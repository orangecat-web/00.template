<?php
declare(strict_types=1);
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/validation.php';
require_once __DIR__ . '/images.php';
require_once __DIR__ . '/limits.php';
$configPath = getenv('PORTFOLIO_CONFIG') ?: __DIR__ . '/config.php';
$config = is_file($configPath) ? require $configPath : [];
$privateDir = getenv('PORTFOLIO_PRIVATE_DIR') ?: ($config['private_dir'] ?? (($config['layout']??'')==='bundled' ? dirname(__DIR__) : dirname(__DIR__) . '/portfolio-private'));
// 帳密是私有資料，不用 require 載入，避免 PHP OPcache 延遲首次登入與密碼更新。
if(is_file($privateDir.'/admin.json')) $config=array_replace($config,json_read($privateDir.'/admin.json'));
$publicDir = getenv('PORTFOLIO_PUBLIC_DIR') ?: ($config['public_dir'] ?? (PHP_SAPI === 'cli' ? dirname(__DIR__) . '/dist' : ($_SERVER['DOCUMENT_ROOT'] ?? '')));
$organization = 'orangecat-web';
$uploadPrefix = '/images/projects/uploads';
function configured(): bool {
    global $config, $privateDir;
    return isset($config['username'], $config['password_hash']) && is_file($privateDir . '/state.json');
}
function request_body(): array {
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) fail(415, '請使用 JSON 傳送資料。');
    $raw = file_get_contents('php://input', false, null, 0, 1048577);
    if (strlen($raw)>1048576) fail(413, '資料超過大小限制。');
    try { $data = json_decode($raw, true, 64, JSON_THROW_ON_ERROR); }
    catch (JsonException) { fail(400, 'JSON 格式不正確。'); }
    if (!is_array($data) || array_is_list($data)) fail(400, '資料格式不正確。');
    return $data;
}
function json_response(array $value, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}
// Cookie 僅作登入識別；任何寫入還需要同站 Origin 與 CSRF Token。
function start_session(): void {
    global $privateDir;
    $https = ($_SERVER['HTTPS'] ?? '') === 'on';
    if (!$https && getenv('PORTFOLIO_ALLOW_HTTP') !== '1') fail(503, '管理後台需要 HTTPS。');
    $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    $private = realpath($privateDir);
    if ($root && $private && ($private===$root || str_starts_with($private, $root . DIRECTORY_SEPARATOR))) fail(503, '私有資料目錄不可放在網站公開目錄。');
    if(!is_dir($privateDir.'/sessions') && !mkdir($privateDir.'/sessions',0700,true)) fail(503,'主機目前無法建立管理員登入資料。');
    session_name('OC_PORTFOLIO_ADMIN');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '28800');
    session_save_path($privateDir . '/sessions');
    session_set_cookie_params(['lifetime'=>0, 'path'=>'/', 'secure'=>$https, 'httponly'=>true, 'samesite'=>'Strict']);
    if(!session_start()) fail(503,'主機目前無法儲存登入資料，請確認私有資料夾可供 PHP 寫入。');
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
function authenticated(): bool {
    global $config;
    if(!isset($config['password_hash'])) return false;
    $valid = ($_SESSION['admin'] ?? false) === true
        && hash_equals(hash('sha256',$config['password_hash']), $_SESSION['credential'] ?? '')
        && time() - ($_SESSION['last_seen'] ?? 0) < 1800
        && time() - ($_SESSION['started'] ?? 0) < 28800;
    if ($valid) $_SESSION['last_seen'] = time();
    return $valid;
}
function require_admin(): void { if (!authenticated()) fail(401, '請先登入管理後台。'); }
function require_post(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '')!=='POST') fail(405, '此操作需要 POST。');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $expected = (($_SERVER['HTTPS']??'')==='on' ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST']??'');
        if (!hash_equals($expected, $origin)) fail(403, '請從同一個網站進行操作。');
    }
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) fail(403, '驗證已失效，請重新整理頁面。');
}
// 嘗試次數存於伺服器，不能藉由清 Cookie 重設；不信任轉送的 IP 標頭。
function verify_attempt(callable $verify, string $scope, string $message): void {
    global $privateDir;
    $path=$privateDir.'/login-attempts.json';
    $handle=fopen($privateDir.'/login-attempts.lock','c');
    if(!$handle || !flock($handle,LOCK_EX)) throw new RuntimeException('Rate limit unavailable');
    try {
        $attempts=is_file($path)?json_read($path):[];
        $attempts=array_filter($attempts,fn($item)=>$item['until']>time());
        $key=hash('sha256',$scope.':'.($_SERVER['REMOTE_ADDR']??'unknown'));
        if(($attempts[$key]['count']??0)>=5) fail(429,'嘗試次數過多，請於 15 分鐘後再試。');
        if(!$verify()) {
            $attempts[$key]=['count'=>($attempts[$key]['count']??0)+1,'until'=>$attempts[$key]['until']??time()+900];
            atomic_json($path,$attempts);fail(401,$message);
        }
        unset($attempts[$key]);atomic_json($path,$attempts);
    } finally {flock($handle,LOCK_UN);fclose($handle);}
}
function establish_login(): void {
    global $config;
    session_regenerate_id(true);
    $_SESSION=['admin'=>true,'credential'=>hash('sha256',$config['password_hash']),'started'=>time(),'last_seen'=>time(),'csrf'=>bin2hex(random_bytes(32))];
}
function login_attempt(string $username, string $password): void {
    global $config;
    if(strlen($username)>200 || strlen($password)>1024) fail(401,'帳號或密碼不正確。');
    verify_attempt(function()use($username,$password,$config) {
        $valid=password_verify($password,$config['password_hash']);
        return $valid && hash_equals($config['username'],$username);
    },'login','帳號或密碼不正確。');
    establish_login();
}
function setup_pending(): bool {
    global $config,$privateDir;
    return !isset($config['password_hash']) && preg_match('/^[a-f0-9]{64}$/D',$config['setup_hash']??'')===1 && is_file($privateDir.'/state.json');
}
function initialize_admin(array $body): void {
    global $config,$privateDir,$publicDir,$uploadPrefix;
    $handle=fopen($privateDir.'/setup.lock','c');
    if(!$handle || !flock($handle,LOCK_EX)) throw new RuntimeException('Setup lock unavailable');
    try {
        // 鎖定後直接檢查資料檔，兩個瀏覽器也只能建立一次帳號。
        clearstatcache(true,$privateDir.'/admin.json');
        if(is_file($privateDir.'/admin.json') || isset($config['password_hash']) || empty($config['setup_hash'])) fail(409,'管理員已建立，請重新整理後登入。');
        $code=text_field($body,'setupCode',200);
        verify_attempt(fn()=>hash_equals($config['setup_hash'],hash('sha256',$code)),'setup','安裝碼不正確。');
        $username=text_field($body,'username',80);$password=$body['password']??'';
        if(!preg_match('/^[A-Za-z0-9_.-]{3,80}$/D',$username)||!is_string($password)||!preg_match('//u',$password)||preg_match_all('/./us',$password)<12||strlen($password)>72) fail(422,'帳號需 3–80 個英數字元，密碼至少 12 字元且不超過 72 bytes。');
        foreach([$privateDir.'/assets',$privateDir.'/sessions'] as $dir) if(!is_dir($dir) && !mkdir($dir,0700,true)) fail(503,'主機目前無法建立私人資料，請確認 PHP 可寫入私有資料夾。');
        $images=rtrim($publicDir,'/').$uploadPrefix;
        if((!is_dir($images) && !@mkdir($images,0755,true)) || !is_writable($images)) fail(503,'主機目前無法建立作品圖片資料夾，請確認 PHP 可寫入 images/projects。');
        $credentials=['username'=>$username,'password_hash'=>password_hash($password,PASSWORD_DEFAULT)];
        atomic_json($privateDir.'/admin.json',$credentials);
        $config=array_replace($config,$credentials);
        if(is_file($privateDir.'/首次安裝碼.txt')) @unlink($privateDir.'/首次安裝碼.txt');
    } finally {flock($handle,LOCK_UN);fclose($handle);}
    establish_login();
}

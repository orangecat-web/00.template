<?php
declare(strict_types=1);
// 僅可從主機命令列初始化；網站沒有公開的建立管理員入口。
if(PHP_SAPI!=='cli') { http_response_code(404); exit; }
require __DIR__.'/bootstrap.php';
try {
    if(PHP_VERSION_ID<80200) throw new RuntimeException('需要 PHP 8.2 以上。');
    foreach(['gd','fileinfo','exif','session'] as $extension) if(!extension_loaded($extension)) throw new RuntimeException("缺少 PHP {$extension} 擴充。");
    if(!function_exists('imagewebp') || !(gd_info()['WebP Support']??false)) throw new RuntimeException('GD 需要 WebP 編碼支援。');
    $command=$argv[1]??'check';
    if($command==='check') { echo "PHP 與圖片處理功能可用。\n"; exit; }
    if(!in_array($command,['init','password','prepare'],true)) throw new RuntimeException('用法：php portfolio-server/cli.php check | init | password | prepare');
    if($command==='init' && (is_file($configPath)||is_file($privateDir.'/state.json'))) throw new RuntimeException('已有管理資料，拒絕覆蓋。');
    if($command==='password' && !configured()) throw new RuntimeException('請先初始化。');
    $username=getenv('PORTFOLIO_ADMIN_USERNAME')?:($config['username']??'');
    if($username==='') { fwrite(STDOUT,'管理員帳號：'); $username=trim(fgets(STDIN)?:''); }
    $password=getenv('PORTFOLIO_ADMIN_PASSWORD');
    if($password===false || $password==='') {
        fwrite(STDOUT,'管理員密碼（至少 12 字元）：');
        $hide=PHP_OS_FAMILY!=='Windows' && function_exists('shell_exec') && stream_isatty(STDIN);
        if($hide) shell_exec('stty -echo');
        try { $password=rtrim(fgets(STDIN)?:'',"\r\n"); } finally { if($hide) {shell_exec('stty echo'); fwrite(STDOUT,"\n");} }
    }
    if(!preg_match('/^[A-Za-z0-9_.-]{3,80}$/D',$username)||!preg_match('//u',$password)||preg_match_all('/./us',$password)<12||strlen($password)>72) throw new RuntimeException('帳號需 3–80 個英數字元，密碼至少 12 字元且不超過 72 bytes。');
    if($command==='prepare') {
        $package=getenv('PORTFOLIO_PREPARE_DIR')?:dirname(__DIR__).'/portfolio-install.local';
        if(file_exists($package)) throw new RuntimeException('安裝資料目錄已存在，拒絕覆蓋。');
        if(!mkdir($package.'/portfolio-server',0700,true)) throw new RuntimeException('無法建立安裝資料目錄。');
        foreach(glob(__DIR__.'/*.php') as $file) if(basename($file)!=='config.php' && !copy($file,$package.'/portfolio-server/'.basename($file))) throw new RuntimeException('無法複製後端程式。');
        $privateDir=$package.'/portfolio-private'; $publicDir=$package.'/public'; $configPath=$package.'/portfolio-server/config.php';
    }
    if(in_array($command,['init','prepare'],true)) {
        $seedPath=getenv('PORTFOLIO_SEED')?:__DIR__.'/seed.json';
        if(!is_file($seedPath)) throw new RuntimeException('缺少 seed.json，請先執行 npm run build。');
        $seed=json_read($seedPath); $projects=$seed['projects']??null;
        if(!is_array($projects)||!array_is_list($projects)||!$projects) throw new RuntimeException('首次匯入資料不正確。');
        foreach([$privateDir,$privateDir.'/sessions',$privateDir.'/assets'] as $dir) if(!is_dir($dir)&&!mkdir($dir,0700,true)) throw new RuntimeException('無法建立私有資料目錄。');
        $docroot=realpath($publicDir); $private=realpath($privateDir);
        if($docroot && ($private===$docroot||str_starts_with($private,$docroot.DIRECTORY_SEPARATOR))) throw new RuntimeException('私有目錄必須放在公開目錄外。');
        $state=['schema'=>1,'revision'=>1,'published'=>$projects,'drafts'=>[],'versions'=>array_fill_keys(array_column($projects,'id'),1),'history'=>[],'assets'=>[]];
        atomic_json($privateDir.'/state.json',$state);
    }
    atomic_json($privateDir.'/admin.json',['username'=>$username,'password_hash'=>password_hash($password,PASSWORD_DEFAULT)]);
    if($command==='password') {echo "密碼已更新，舊登入將失效。\n";exit;}
    $newConfig=['private_dir'=>$privateDir,'public_dir'=>$publicDir];
    if($command==='prepare') {
        $newConfig=['layout'=>'separate'];
        file_put_contents($package.'/INSTALL.txt',"進階 CLI 首次安裝：私有資料不可放入網站公開目錄；一般使用請改用 npm run package:admin 產生網頁設定安裝包。\n");
    }
    $text="<?php\n// 私有設定，不可上傳至公開目錄或提交 Git。\nreturn ".var_export($newConfig,true).";\n";
    $temp=tempnam(dirname($configPath),'.config-'); chmod($temp,0600);
    if(file_put_contents($temp,$text)!==strlen($text)||!rename($temp,$configPath)) throw new RuntimeException('無法儲存私有設定。');
    if($command==='prepare') { echo "首次安裝資料已產生；請依 INSTALL.txt 分開上傳私有資料與公開網站。\n"; exit; }
    echo $command==='init'?"管理員與既有作品匯入完成；請確認 HTTPS 後開啟 /admin.html。\n":"密碼已更新，舊登入將失效。\n";
} catch(Throwable $error) {fwrite(STDERR,$error->getMessage()."\n");exit(1);}

<?php
declare(strict_types=1);
// 此檔是唯一公開 PHP 入口；程式與設定應放在網站公開目錄的上一層。
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
$bundled=dirname(__DIR__,2).'/portfolio-private/server';
$server = getenv('PORTFOLIO_SERVER_DIR') ?: (is_file($bundled.'/api.php') ? $bundled : dirname(__DIR__,2).'/portfolio-server');
if (!is_file($server . '/api.php')) {
    http_response_code(503); header('Content-Type: application/json; charset=utf-8');
    echo '{"message":"作品管理服務尚未完成設定。"}'; exit;
}
require $server . '/api.php';

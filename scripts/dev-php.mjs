// PHP 只供本機測試；正式主機由 Apache / PHP-FPM 提供 HTTPS。
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
const php=spawn(process.env.PHP_BIN||'php',['-d','display_errors=Off','-S','127.0.0.1:8088','-t','public'],{
  stdio:'inherit',env:{...process.env,PORTFOLIO_ALLOW_HTTP:'1',PORTFOLIO_PUBLIC_DIR:resolve('public'),PORTFOLIO_SERVER_DIR:resolve('portfolio-server')},
})
php.on('error',()=>{console.error('找不到 PHP，請先安裝 PHP 8.2+ 與 GD/WebP、Exif、Fileinfo 擴充。');process.exitCode=1})
php.on('exit',code=>{process.exitCode=code||0})
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>php.kill(signal))

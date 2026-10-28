// 一次產出熟悉的 dist 與一個私有資料夾；帳密由安裝碼保護的網頁設定。
import { randomBytes, createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, copyFileSync, statSync, existsSync } from 'node:fs'
import { resolve, join, extname, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { zipSync } from 'fflate'
export function packageAdmin({directory, build=true}={}) {
  if(!directory){const parent=resolve('portfolio-release.local');mkdirSync(parent,{recursive:true});directory=mkdtempSync(join(parent,'install-'))}
  else {if(existsSync(directory) && readdirSync(directory).length)throw new Error('安裝資料夾已有內容，拒絕覆蓋。');mkdirSync(directory,{recursive:true})}
  if(existsSync(directory+'.zip'))throw new Error('同名安裝包已存在，拒絕覆蓋。')
  const site=join(directory,'dist'), privateDir=join(directory,'portfolio-private'), serverDir=join(privateDir,'server')
  if(build)execFileSync(process.execPath,['scripts/build-managed.mjs','--outDir',site],{stdio:'inherit'})
  const seed=JSON.parse(readFileSync('portfolio-server/seed.json','utf8'))
  for(const path of [serverDir,join(privateDir,'sessions'),join(privateDir,'assets')])mkdirSync(path,{recursive:true,mode:0o700})
  for(const file of readdirSync('portfolio-server'))if(file.endsWith('.php') && file!=='config.php')copyFileSync(join('portfolio-server',file),join(serverDir,file))
  const code=`OC-${randomBytes(24).toString('hex')}`
  const hash=createHash('sha256').update(code).digest('hex')
  writeFileSync(join(serverDir,'config.php'),`<?php\n// 首次安裝用私有設定；管理員建立後不再接受安裝碼。\nreturn ['layout'=>'bundled','setup_hash'=>'${hash}'];\n`,{mode:0o600})
  writeFileSync(join(privateDir,'state.json'),JSON.stringify({schema:1,revision:1,published:seed.projects,drafts:[],versions:Object.fromEntries(seed.projects.map(p=>[p.id,1])),history:[],assets:[]}),{mode:0o600})
  writeFileSync(join(privateDir,'首次安裝碼.txt'),`${code}\n`,{mode:0o600})
  writeFileSync(join(directory,'安裝說明.txt'),`Orange Cat 作品管理 — 首次安裝\n\n1. dist 裡的內容：上傳到原本網站的公開根目錄，和以前一樣。\n2. portfolio-private 整個資料夾：放到公開根目錄的上一層。\n3. 以 HTTPS 開啟 /admin.html，使用 portfolio-private 裡「首次安裝碼.txt」的安裝碼建立自己的帳號密碼。\n\n帳密設定只做一次；之後登入編輯、上傳、預覽、發布即可。\n主機的 2MB/128MB 等限制由程式讀取，大圖先在瀏覽器縮小。\n本說明留在本機；安裝碼檔位於私有資料夾，不放公開網站；不可將整個安裝包放進公開目錄。\n此為首次安裝包，不覆蓋已有的 admin.json、state.json 或私有設定；已使用的網站更新時只更新程式與 dist，保留所有執行資料。\n新圖片會放在 images/projects/uploads，更新網站時保留此目錄。\n`)
  const files={}
  function collect(dir) {
    for(const entry of readdirSync(dir,{withFileTypes:true})) {
      const path=join(dir,entry.name), name=relative(directory,path).split('\\').join('/')
      if(entry.isDirectory()){files[name+'/']=new Uint8Array(0);collect(path)}
      else if(entry.isFile()){const compressed=['.jpg','.jpeg','.png','.webp','.woff','.woff2','.mp4','.zip'].includes(extname(name).toLowerCase());files[name]=[new Uint8Array(readFileSync(path)),{level:compressed?0:6}]}
      else throw new Error('安裝包不接受符號連結。')
    }
  }
  collect(directory)
  const archive=directory+'.zip';writeFileSync(archive,zipSync(files),{mode:0o600})
  return {directory,archive,bytes:statSync(archive).size}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const index=process.argv.indexOf('--outDir')
  const result=packageAdmin(index>=0?{directory:resolve(process.argv[index+1])}:{})
  console.log(`首次安裝包已產生：${result.archive}\n解壓後依「安裝說明.txt」放置兩個資料夾，再由網頁設定帳密。`)
}

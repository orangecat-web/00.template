// 真實 PHP/GD 整合測試；每次使用獨立目錄、隨機帳密與本機連接埠，結束清除。
import assert from 'node:assert/strict'
import { randomBytes, createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { unzipSync } from 'fflate'
import { chromium } from '@playwright/test'
const root=resolve(import.meta.dirname,'..'), fixture=mkdtempSync(resolve(tmpdir(),'oc-portfolio-'))
const site=resolve(fixture,'deployed/dist'), credential={username:'test-admin',password:randomBytes(24).toString('hex')}
const image='orangecat-portfolio-php:local', container=`oc-portfolio-test-${randomBytes(5).toString('hex')}`
let server,browser,logs='',passed=0
const pause=ms=>new Promise(r=>setTimeout(r,ms))
function command(executable,args,options={}) {try{return execFileSync(executable,args,{cwd:root,stdio:'pipe',...options})}catch(error){throw new Error(`${executable} 執行失敗：${error.stderr?.toString()||error.stdout?.toString()||'請檢查執行環境'}`)}}
function client(base) {
  const cookies=new Map();let csrf=''
  return {
    async request(action,{body,form,token=csrf,origin,method}={}) {
      const headers={Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')}
      if(body)headers['Content-Type']='application/json'
      if(token)headers['X-CSRF-Token']=token
      if(origin)headers.Origin=origin
      const response=await fetch(`${base}/api/index.php?action=${action}`,{method:method||(body||form?'POST':'GET'),headers,body:form||(body?JSON.stringify(body):undefined)})
      for(const cookie of response.headers.getSetCookie()){const [k,...v]=cookie.split(';')[0].split('=');cookies.set(k,v.join('='))}
      const data=response.headers.get('content-type')?.includes('application/json')?await response.json():new Uint8Array(await response.arrayBuffer())
      if(data.csrf)csrf=data.csrf
      return {status:response.status,data,response}
    },
    cookie:()=>[...cookies].map(([k,v])=>`${k}=${v}`).join('; '),
  }
}
async function run() {
  console.log('建立獨立測試站與 PHP 服務…')
  command(process.execPath,['scripts/package-admin.mjs','--outDir',resolve(fixture,'package')])
  const zip=unzipSync(readFileSync(resolve(fixture,'package.zip')))
  assert.ok(zip['dist/index.html'] && zip['dist/admin.html'] && zip['portfolio-private/server/config.php'])
  for(const name of Object.keys(zip)) {
    assert.ok(!name.startsWith('/') && !name.split('/').includes('..'))
    if(name.startsWith('dist/'))assert.ok(!name.endsWith('/config.php') && !name.endsWith('/state.json'))
    const target=resolve(fixture,'deployed',name)
    if(name.endsWith('/'))mkdirSync(target,{recursive:true})
    else {mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,zip[name])}
  }
  const setupCode=readFileSync(resolve(fixture,'deployed/portfolio-private/首次安裝碼.txt'),'utf8').trim()
  try {command('docker',['image','inspect',image])} catch {command('docker',['build','-t',image,'tools/php'],{env:{...process.env,BUILDX_CONFIG:resolve(fixture,'buildx')}})}
  const uid=process.getuid?.()??1000,gid=process.getgid?.()??1000
  const mounts=['--user',`${uid}:${gid}`,'--mount',`type=bind,src=${root},dst=/app,readonly`,'--mount',`type=bind,src=${fixture},dst=/runtime`,'--mount',`type=bind,src=${site},dst=/site`]
  const environment=['-e','PORTFOLIO_PRIVATE_DIR=/runtime/private','-e','PORTFOLIO_CONFIG=/runtime/config.php','-e','PORTFOLIO_PUBLIC_DIR=/site','-e','PORTFOLIO_SERVER_DIR=/app/portfolio-server']
  command('docker',['run','--rm',...mounts,...environment,'-e',`PORTFOLIO_ADMIN_USERNAME=${credential.username}`,'-e',`PORTFOLIO_ADMIN_PASSWORD=${credential.password}`,image,'php','portfolio-server/cli.php','init'])
  command('docker',['run','--rm',...mounts,...environment,'-e','PORTFOLIO_PREPARE_DIR=/runtime/prepared','-e',`PORTFOLIO_ADMIN_USERNAME=${credential.username}`,'-e',`PORTFOLIO_ADMIN_PASSWORD=${credential.password}`,image,'php','portfolio-server/cli.php','prepare'])
  const preparedKeys=JSON.parse(command('docker',['run','--rm',...mounts,image,'php','-r',"echo json_encode(array_keys(require '/runtime/prepared/portfolio-server/config.php'));"]).toString())
  assert.deepEqual(preparedKeys,['layout'])
  assert.equal(JSON.parse(readFileSync(resolve(fixture,'prepared/portfolio-private/state.json'))).published.length,JSON.parse(readFileSync(resolve(root,'portfolio-server/seed.json'))).projects.length)
  passed++;console.log('PASS 無 SSH 的私有首次安裝資料，設定不包含本機絕對路徑')
  const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r))
  const base=`http://127.0.0.1:${port}`
  server=spawn('docker',['run','--rm','--name',container,'-p',`127.0.0.1:${port}:8088`,...mounts,'-e','PORTFOLIO_ALLOW_HTTP=1',image,'php','-d','upload_max_filesize=2M','-d','post_max_size=8M','-d','memory_limit=128M','-d','display_errors=Off','-S','0.0.0.0:8088','-t','/runtime/deployed/dist'],{cwd:root,stdio:'pipe'})
  server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d)
  let ready=false
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('PHP 服務啟動失敗：'+logs);try{const response=await fetch(`${base}/api/index.php?action=portfolio`);await response.arrayBuffer();if(response.ok){ready=true;break}}catch{}await pause(100)}
  assert.ok(ready,'PHP 服務未就緒：'+logs)
  async function statusOf(url) {const response=await fetch(url);await response.arrayBuffer();return response.status}
  const admin=client(base), anonymous=client(base)
  const initial=(await anonymous.request('portfolio')).data
  const seed=JSON.parse(readFileSync(resolve(root,'portfolio-server/seed.json'),'utf8'));assert.equal(initial.projects.length,seed.projects.length)
  for(const p of initial.projects)for(const item of p.gallery||[])assert.ok(item.src.startsWith('/images/'),'匯入時固定舊 gallery 路徑，避免換封面後失聯')
  assert.ok(!('drafts' in initial) && !('password_hash' in initial))
  assert.equal((await anonymous.request('preview&id=orange-cat-vue')).status,401)
  assert.equal((await anonymous.request('projects')).status,401)
  assert.equal((await anonymous.request('save',{body:{}})).status,401)
  const session=await admin.request('session');assert.equal(session.data.authenticated,false)
  assert.match(session.response.headers.get('set-cookie'),/HttpOnly/i);assert.match(session.response.headers.get('set-cookie'),/SameSite=Strict/i)
  assert.equal(session.data.setupRequired,true)
  assert.equal((await admin.request('setup',{body:{setupCode, ...credential},token:'invalid'})).status,403)
  assert.equal((await admin.request('setup',{body:{setupCode:'invalid',...credential}})).status,401)
  browser ||= await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
  const setupContext=await browser.newContext(),setupPage=await setupContext.newPage()
  await setupPage.goto(base+'/admin.html')
  await setupPage.getByRole('heading',{name:'首次設定管理員',exact:true}).waitFor()
  await setupPage.getByLabel('首次安裝碼',{exact:true}).fill(setupCode)
  await setupPage.getByLabel('管理員帳號',{exact:true}).fill(credential.username)
  await setupPage.getByLabel('設定密碼（至少 12 字元）',{exact:true}).fill(credential.password)
  await setupPage.getByLabel('再輸入一次密碼',{exact:true}).fill(credential.password)
  const firstList=setupPage.waitForResponse(response=>response.url().includes('action=projects'))
  await setupPage.getByRole('button',{name:'建立管理員',exact:true}).click()
  const listResponse=await firstList
  assert.equal(listResponse.status(),200,(await listResponse.json()).message||'建立管理員後應維持登入')
  await setupPage.getByRole('button',{name:'新增作品',exact:true}).waitFor()
  await setupContext.close()
  assert.equal((await admin.request('setup',{body:{setupCode,...credential}})).status,409)
  assert.equal((await admin.request('session')).data.setupRequired,false)
  const storedCredentials=readFileSync(resolve(fixture,'deployed/portfolio-private/admin.json'),'utf8')
  assert.ok(!storedCredentials.includes(setupCode) && !storedCredentials.includes(credential.password))
  assert.equal(JSON.parse(storedCredentials).username,credential.username)
  const installed=(await admin.request('login',{body:credential}));assert.equal(installed.status,200)
  const hostLimits=(await admin.request('projects')).data.limits
  assert.equal(hostLimits.maxBytes,2*1024*1024);assert.equal(hostLimits.memoryBytes,128*1024*1024);assert.ok(hostLimits.maxPixels<8000000)
  await admin.request('logout',{body:{}});await admin.request('session')
  passed++;console.log('PASS ZIP 實際解壓後的首次網頁設定、安裝碼一次性、無本機 PHP 需求、2MB/128MB 主機限制')
  const oldCookie=admin.cookie()
  assert.equal((await admin.request('login',{body:credential,token:'invalid'})).status,403)
  assert.equal((await admin.request('login',{body:{...credential,password:'wrong'}})).status,401)
  assert.equal((await admin.request('login',{body:credential})).status,200)
  assert.notEqual(admin.cookie(),oldCookie)
  passed++;console.log('PASS 未登入隔離、登入驗證、CSRF、Cookie 與 Session 更新')

  const project={title:'管理測試作品',summary:'測試上傳、草稿與發布',role:'前端開發',category:'FRONT-END / VUE',categoryIds:['frontend'],cover:'web-design',image:'',imageAlt:'',detailImage:'',detailImageAlt:'',gallery:[],caseStudy:[{heading:'實作重點',body:'保留正式頁面的互動。'}],techTags:['Vue 3'],sortOrder:100,featuredOrder:100,featured:false}
  assert.equal((await admin.request('save',{body:{project},token:'bad'})).status,403)
  assert.equal((await admin.request('save',{body:{project},origin:'https://foreign.example'})).status,403)
  assert.equal((await admin.request('save',{body:{project:{...project,externalUrl:'javascript:alert(1)'}}})).status,422)
  let saved=await admin.request('save',{body:{project}});assert.equal(saved.status,200)
  const id=saved.data.project.id;let version=saved.data.version
  assert.match(id,/^work-[a-f0-9]+$/)
  assert.ok(!(await anonymous.request('portfolio')).data.projects.some(p=>p.id===id))
  assert.equal((await anonymous.request(`preview&id=${id}`)).status,401)
  assert.equal((await admin.request('publish',{body:{id,version}})).status,409)
  assert.equal((await admin.request('save',{body:{id,version:version-1,project}})).status,409)
  passed++;console.log('PASS 新作品預設私人草稿、發布前需預覽、跨視窗版本衝突')

  // 用 GD 建立實際 JPEG、長圖及帶 EXIF 方向的圖片，避免只測副檔名。
  const generator=`<?php
  $im=imagecreatetruecolor(1800,1200);mt_srand(10);
  for($y=0;$y<1200;$y++)for($x=0;$x<1800;$x++)imagesetpixel($im,$x,$y,mt_rand(0,0xffffff));
  imagejpeg($im,'/runtime/photo.jpg',85);imagejpeg($im,'/runtime/big-photo.jpg',98);
  $large=imagecreatetruecolor(2000,6000);imagefill($large,0,0,0x99bbdd);imagepng($large,'/runtime/large-dim.png');imagedestroy($large);
  $long=imagecreatetruecolor(300,6000);imagefill($long,0,0,0xcceedd);imagepng($long,'/runtime/long.png');
  $portrait=imagecreatetruecolor(80,40);imagefilledrectangle($portrait,0,0,39,19,0xff0000);imagefilledrectangle($portrait,40,0,79,19,0x00ff00);imagefilledrectangle($portrait,0,20,39,39,0x0000ff);imagefilledrectangle($portrait,40,20,79,39,0xffff00);ob_start();imagejpeg($portrait,null,100);$jpg=ob_get_clean();
  $tiff="II".pack('vV',42,8).pack('v',1).pack('vvVvvV',0x112,3,1,6,0,0);
  $exif="Exif\\0\\0".$tiff;file_put_contents('/runtime/oriented.jpg',substr($jpg,0,2)."\\xff\\xe1".pack('n',strlen($exif)+2).$exif.substr($jpg,2));
  foreach([5,7,8] as $o){$t="II".pack('vV',42,8).pack('v',1).pack('vvVvvV',0x112,3,1,$o,0,0);$e="Exif\\0\\0".$t;file_put_contents('/runtime/oriented-'.$o.'.jpg',substr($jpg,0,2)."\\xff\\xe1".pack('n',strlen($e)+2).$e.substr($jpg,2));}
  `
  writeFileSync(resolve(fixture,'fixtures.php'),generator)
  command('docker',['exec',container,'php','/runtime/fixtures.php'])
  function uploadForm(bytes,name,mode='photo',projectId=id) {const f=new FormData();f.set('id',projectId);f.set('mode',mode);f.set('image',new Blob([bytes]),name);return f}
  assert.equal((await admin.request('upload',{form:uploadForm('not an image','evil.png')})).status,422)
  assert.equal((await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,'photo.jpg')),'test.jpg'),token:'invalid'})).status,403)
  assert.equal((await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,'big-photo.jpg')),'large.jpg')})).status,413)
  assert.equal((await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,'large-dim.png')),'large.png')})).status,422)
  const result=await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,'photo.jpg')),'我的作品.jpg')})
  assert.equal(result.status,201,JSON.stringify(result.data))
  const asset=result.data.asset;assert.equal(asset.variants.cover.width,1200)
  assert.ok(asset.variants.display.bytes<asset.originalBytes)
  const publicImage=`/images/projects/uploads/${createHash('sha256').update(id).digest('hex').slice(0,20)}/${asset.id}-cover.webp`
  assert.equal(await statusOf(base+publicImage),404)
  assert.equal((await anonymous.request(`asset&asset=${asset.id}&variant=cover`)).status,401)
  const privateImage=await admin.request(`asset&asset=${asset.id}&variant=cover`)
  assert.equal(privateImage.status,200);assert.match(privateImage.response.headers.get('cache-control'),/no-store/)
  assert.equal(Buffer.from(privateImage.data).subarray(8,12).toString(),'WEBP')
  const long=await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,'long.png')),'long.png','design')})
  assert.equal(long.status,201);assert.equal(long.data.asset.variants.display.height,6000)
  const oriented=await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,'oriented.jpg')),'portrait.jpg')})
  assert.equal(oriented.status,201);assert.equal(oriented.data.asset.variants.display.width,40);assert.equal(oriented.data.asset.variants.display.height,80)
  // 以四個不同色塊驗證 EXIF 的旋轉／鏡像，不只檢查寬高互換。
  for(const [orientation,expected] of [[5,['R','B','G','Y']],[6,['B','R','Y','G']],[7,['Y','G','B','R']],[8,['G','Y','R','B']]]) {
    const corrected=orientation===6?oriented:await admin.request('upload',{form:uploadForm(readFileSync(resolve(fixture,`oriented-${orientation}.jpg`)),'oriented.jpg')})
    assert.equal(corrected.status,201)
    const inspect=`require '/runtime/deployed/portfolio-private/server/bootstrap.php'; $im=imagecreatefromwebp(asset_path('${corrected.data.asset.id}','display'));$w=imagesx($im);$h=imagesy($im);$colors=[];foreach([[10,10],[$w-11,10],[10,$h-11],[$w-11,$h-11]] as [$x,$y]){$c=imagecolorat($im,$x,$y);$r=($c>>16)&255;$g=($c>>8)&255;$colors[]=$r>150?($g>150?'Y':'R'):($g>150?'G':'B');}echo json_encode($colors);`
    assert.deepEqual(JSON.parse(command('docker',['exec',container,'php','-r',inspect]).toString()),expected,`EXIF ${orientation}`)
  }
  assert.equal((await admin.request(`asset&asset=${asset.id}&variant=original`)).status,404)
  assert.equal((await admin.request('save',{body:{project:{...project,image:`asset:${asset.id}`}}})).status,422,'圖片不能跨作品引用')
  const orientBytes=(await admin.request(`asset&asset=${oriented.data.asset.id}&variant=display`)).data
  assert.equal(Buffer.from(orientBytes).indexOf(Buffer.from('Exif')), -1)
  passed++;console.log('PASS 真實圖片驗證、WebP 縮圖與壓縮、長圖高度、EXIF 方向、私人圖片隔離')

  project.image=`asset:${asset.id}`;project.imageAlt='測試封面';project.gallery=[{src:`asset:${long.data.asset.id}`,title:'完整長圖',alt:'完整設計長圖',wide:true}]
  saved=await admin.request('save',{body:{id,version,project}});assert.equal(saved.status,200,JSON.stringify(saved.data));version=saved.data.version
  const preview=await admin.request(`preview&id=${id}`);assert.equal(preview.status,200)
  assert.match(preview.data.projects.find(p=>p.id===id).image,/action=asset/)
  assert.equal((await admin.request('review',{body:{id,version}})).status,200)
  assert.equal((await admin.request('publish',{body:{id,version}})).status,200)
  const live=(await anonymous.request('portfolio')).data.projects.find(p=>p.id===id)
  assert.equal(live.title,project.title);assert.match(live.image,/-cover.webp$/);assert.match(live.detailImage,/-display.webp$/)
  assert.equal(await statusOf(base+live.image),200);assert.equal(await statusOf(base+live.gallery[0].src),200)
  version=(await admin.request(`project&id=${id}`)).data.version
  project.title='修改中的新標題';saved=await admin.request('save',{body:{id,version,project}});version=saved.data.version
  assert.equal((await anonymous.request('portfolio')).data.projects.find(p=>p.id===id).title,'管理測試作品')
  await admin.request('review',{body:{id,version}})
  project.title='再次修改';saved=await admin.request('save',{body:{id,version,project}});version=saved.data.version
  assert.equal((await admin.request('publish',{body:{id,version}})).status,409)
  await admin.request('review',{body:{id,version}});assert.equal((await admin.request('publish',{body:{id,version}})).status,200)
  let liveRecord=(await admin.request(`project&id=${id}`)).data
  const removed=await admin.request('unpublish',{body:{id,version:liveRecord.version}});assert.equal(removed.status,200)
  assert.ok(!(await anonymous.request('portfolio')).data.projects.some(p=>p.id===id))
  assert.equal((await admin.request(`preview&id=${id}`)).status,200)
  await admin.request('review',{body:{id,version:removed.data.version}})
  assert.equal((await admin.request('publish',{body:{id,version:removed.data.version}})).status,200)
  let list=(await admin.request('projects')).data
  assert.equal((await admin.request('restore',{body:{historyId:list.history.at(-1).id,revision:list.revision-1}})).status,409)
  assert.equal((await admin.request('restore',{body:{historyId:list.history.at(-1).id,revision:list.revision}})).status,200)
  assert.deepEqual((await anonymous.request('portfolio')).data.projects.map(p=>p.id),initial.projects.map(p=>p.id))
  passed++;console.log('PASS 發布圖片與資料、修改保留舊公開版、再編輯使預覽失效、歷史還原')

  // 瀏覽器使用正式建置：登入、表單、預覽、Lightbox、發布與訪客畫面。
  browser ||= await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('dialog',dialog=>dialog.accept())
  const mockRepo={name:'not-published-yet',owner:{login:'orangecat-web'},private:false,description:'新增倉庫不應自動上架',language:'JavaScript'}
  await context.route('https://api.github.com/**',route=>route.fulfill({json:[mockRepo]}))
  await page.goto(base+'/admin.html');await page.getByLabel('帳號',{exact:true}).fill(credential.username);await page.getByLabel('密碼',{exact:true}).fill(credential.password);await page.getByRole('button',{name:'登入',exact:true}).click()
  await page.getByRole('button',{name:'新增作品',exact:true}).click()
  await page.getByLabel('作品名稱',{exact:true}).fill('瀏覽器發布測試')
  await page.getByLabel('作品簡介',{exact:true}).fill('使用完整頁面操作驗證。')
  await page.getByLabel('負責項目',{exact:true}).fill('視覺設計、前端開發')
  await page.getByRole('button',{name:'儲存草稿',exact:true}).click();await page.getByRole('status').filter({hasText:'草稿已儲存'}).waitFor()
  await page.getByLabel('圖片用途',{exact:true}).selectOption('image')
  await page.getByLabel('選擇圖片',{exact:true}).setInputFiles(resolve(fixture,'big-photo.jpg'))
  await page.getByRole('status').filter({hasText:'已處理 1 張'}).waitFor()
  await page.getByRole('status').filter({hasText:'已先在瀏覽器縮小'}).waitFor()
  await page.getByLabel('封面替代文字',{exact:true}).fill('瀏覽器測試封面')
  await page.getByLabel('圖片用途',{exact:true}).selectOption('gallery')
  await page.getByLabel('處理方式',{exact:true}).selectOption('design')
  await page.getByLabel('選擇圖片',{exact:true}).setInputFiles(resolve(fixture,'large-dim.png'))
  await page.getByRole('status').filter({hasText:'已處理 1 張'}).waitFor()
  await page.locator('.admin-gallery-item').getByLabel('圖片標題',{exact:true}).fill('長圖作品')
  await page.locator('.admin-gallery-item').getByLabel('替代文字',{exact:true}).fill('長圖預覽')
  await page.getByRole('button',{name:'儲存草稿',exact:true}).click();await page.getByRole('status').filter({hasText:'草稿已儲存'}).waitFor()
  const editorHref=await page.getByRole('link',{name:'預覽草稿 ↗',exact:true}).getAttribute('href')
  const previewPage=await context.newPage();await previewPage.goto(base+editorHref)
  await previewPage.getByRole('heading',{name:'瀏覽器發布測試',exact:true}).waitFor()
  await previewPage.getByText('預覽已就緒，確認後可回後台發布。',{exact:true}).waitFor()
  await previewPage.getByRole('button',{name:'放大查看長圖作品',exact:true}).click()
  await previewPage.waitForFunction(()=>document.querySelector('.lightbox-motion')?.getAnimations().length>0)
  await previewPage.waitForTimeout(1250)
  await previewPage.keyboard.press('Escape')
  await previewPage.waitForFunction(()=>!document.querySelector('.media-lightbox').open)
  await page.getByRole('button',{name:'確認發布',exact:true}).click();await page.getByRole('status').filter({hasText:'作品已發布'}).waitFor()
  const visitor=await browser.newContext(),publicPage=await visitor.newPage()
  await visitor.route('https://api.github.com/**',route=>route.fulfill({json:[mockRepo]}))
  const publishedId=new URL(base+editorHref).searchParams.get('id')
  await publicPage.goto(`${base}/project.html?id=${publishedId}`)
  await publicPage.getByRole('heading',{name:'瀏覽器發布測試',exact:true}).waitFor()
  const publicData=(await anonymous.request('portfolio')).data
  assert.ok(!publicData.projects.some(p=>p.githubRepository==='not-published-yet'))
  await publicPage.goto(`${base}/project.html?id=${publishedId}&preview=1`)
  await publicPage.getByRole('alert').filter({hasText:'請先登入'}).waitFor()
  await page.screenshot({path:'/tmp/orangecat-admin-desktop.png',fullPage:true})
  await page.setViewportSize({width:390,height:844})
  await page.screenshot({path:'/tmp/orangecat-admin-mobile.png',fullPage:true})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  assert.deepEqual(errors,[])
  await page.getByRole('button',{name:'登出',exact:true}).click();await page.getByRole('heading',{name:'管理員登入'}).waitFor()
  await previewPage.reload();await previewPage.getByRole('alert').filter({hasText:'請先登入'}).waitFor()
  passed++;console.log('PASS 正式建置的瀏覽器登入／編輯／上傳／私人預覽／發布／登出／手機布局；GitHub 不繞過發布')
  // API 失敗不得退回舊 JSON；公開前端不允許透過錯誤狀態重新曝光作品。
  await publicPage.route('**/api/index.php?action=portfolio',route=>route.fulfill({status:503,json:{message:'測試服務暫時離線'}}))
  await publicPage.goto(base+'/work.html');await publicPage.getByRole('heading',{name:'作品暫時無法載入'}).waitFor()
  assert.equal(await publicPage.locator('.project-card').count(),0)
  for(let i=0;i<5;i++)assert.equal((await admin.request('login',{body:{...credential,password:'invalid'}})).status,401)
  assert.equal((await admin.request('login',{body:credential})).status,429)
  passed++;console.log('PASS API 失敗不回退、伺服器登入節流')
  console.log(`管理後台整合驗證通過：${passed} 組，使用真正 PHP、GD 與 Chromium。`)
}
try {await run()} catch(error) {console.error(error.stack);console.error('PHP 最後紀錄：\n'+logs.slice(-2500));process.exitCode=1}
finally {
  await browser?.close();if(server){try{command('docker',['stop',container])}catch{}server.kill()}
  rmSync(fixture,{recursive:true,force:true})
}

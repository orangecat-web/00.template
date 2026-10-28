<script setup>
// 後台只管理草稿；公開、預覽及寫入權限都由 PHP 再次檢查。
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { prepareImage } from './prepare-image.js'
import { api } from '../services/portfolio.js'
import { managedPortfolio } from '../data/projects.js'
import { fetchRepositories } from '../services/github.js'
const setupRequired=ref(false), setupCode=ref(''), confirmPassword=ref(''), limits=ref(null)
const authenticated=ref(null), csrf=ref(''), username=ref(''), password=ref('')
const busy=ref(false), error=ref(''), message=ref(''), records=ref([]), history=ref([]), revision=ref(0)
const currentId=ref(''), version=ref(0), form=ref(null), baseline=ref(''), assets=ref([]), search=ref('')
const uploadMode=ref('photo'), uploadTarget=ref('gallery'), repositories=ref([]), inboxLoaded=ref(false)
const categories=[['web','網頁設計'],['graphic','平面設計'],['product-photo','商品攝影'],['frontend','前端開發']]
const dirty=computed(()=>!!form.value && JSON.stringify(form.value)!==baseline.value)
const visibleRecords=computed(()=>records.value.filter(r=>`${r.project.title} ${r.project.id}`.toLowerCase().includes(search.value.toLowerCase())))
const inbox=computed(()=>repositories.value.filter(repo=>!records.value.some(r=>r.project.githubRepository?.toLowerCase()===repo.name.toLowerCase())))
const tags=computed({get:()=>form.value?.techTags?.join(', ')||'',set:value=>{form.value.techTags=value.split(/[,，·]/).map(t=>t.trim()).filter(Boolean)}})
const currentRecord=computed(()=>records.value.find(item=>item.project.id===currentId.value))
const previewUrl=computed(()=>`/project.html?id=${encodeURIComponent(currentId.value)}&preview=1`)
function blank() {return {title:'',summary:'',role:'',category:'WEB / VISUAL DESIGN',categoryIds:['web'],cover:'web-design',image:'',imageAlt:'',detailImage:'',detailImageAlt:'',externalUrl:'',externalLabel:'',githubRepository:'',techTags:[],caseStudy:[],gallery:[],featured:false,featuredOrder:0,sortOrder:records.value.length}}
function setRecord(data) {currentId.value=data.project.id;version.value=data.version;form.value={...blank(),...structuredClone(data.project)};baseline.value=JSON.stringify(form.value)}
async function call(action, options={}) {return api(action,{...options,csrf:csrf.value})}
async function run(operation) {
  if(busy.value)return
  busy.value=true; error.value='';message.value=''
  try {await operation()} catch(failure) {error.value=failure.message;if(failure.status===401)authenticated.value=false}
  finally {busy.value=false}
}
async function loadRecords() {const data=await call('projects');records.value=data.records;history.value=data.history;revision.value=data.revision;limits.value=data.limits}
async function loadAssets() {assets.value=currentId.value?(await call(`assets&id=${encodeURIComponent(currentId.value)}`)).assets:[]}
async function initialize() {
  await run(async()=>{const data=await call('session');csrf.value=data.csrf;authenticated.value=data.authenticated;setupRequired.value=!!data.setupRequired;if(data.authenticated)await loadRecords()})
}
async function login() {
  await run(async()=>{const data=await call('login',{body:{username:username.value,password:password.value}});password.value='';csrf.value=data.csrf;authenticated.value=true;await loadRecords()})
  password.value=''
}
async function setup() {
  if(password.value!==confirmPassword.value){error.value='兩次輸入的密碼不一致。';return}
  await run(async()=>{const data=await call('setup',{body:{setupCode:setupCode.value,username:username.value,password:password.value}});csrf.value=data.csrf;setupRequired.value=false;setupCode.value='';password.value='';confirmPassword.value='';authenticated.value=true;await loadRecords();message.value='管理員已建立，之後直接登入即可。'})
}
function discardAllowed() {return !dirty.value || confirm('還有未儲存內容，要捨棄這些修改嗎？')}
async function select(id) {if(!discardAllowed())return;await run(async()=>{setRecord(await call(`project&id=${encodeURIComponent(id)}`));await loadAssets()})}
function newProject() {if(!discardAllowed())return;currentId.value='';version.value=0;form.value=blank();assets.value=[];baseline.value=JSON.stringify(form.value);error.value='';message.value=''}
async function save() {
  const data=await call('save',{body:{id:currentId.value,version:version.value,project:form.value}})
  setRecord(data);await loadRecords();message.value='草稿已儲存，公開版本尚未變更。'
}
async function publish() {
  if(dirty.value || !currentId.value){error.value='請先儲存草稿並預覽，再確認發布。';return}
  if(!confirm(`確認發布「${form.value.title}」？訪客將看到這個版本。`))return
  await run(async()=>{setRecord(await call('publish',{body:{id:currentId.value,version:version.value}}));await loadRecords();message.value='作品已發布。'})
}
async function unpublish() {
  if(dirty.value){error.value='請先儲存草稿。';return}
  if(!confirm('確認將這件作品下架？已公開圖片仍保留供歷史版本還原。'))return
  await run(async()=>{setRecord(await call('unpublish',{body:{id:currentId.value,version:version.value}}));await loadRecords();message.value='作品已下架，內容保留為私人草稿。'})
}
function preview(event) {if(dirty.value){event.preventDefault();error.value='請先儲存目前內容，再開啟預覽。'}}
async function restore(id) {
  if(!discardAllowed() || !confirm('還原會替換整份公開作品清單，私人草稿仍保留。確認還原？'))return
  await run(async()=>{await call('restore',{body:{historyId:id,revision:revision.value}});form.value=null;currentId.value='';await loadRecords();message.value='公開版本已還原。'})
}
async function logout() {if(!discardAllowed())return;await run(async()=>{await call('logout',{body:{}});authenticated.value=false;form.value=null;records.value=[];history.value=[];assets.value=[];await initializeSession()})}
async function initializeSession() {const data=await call('session');csrf.value=data.csrf}
function picture(src, variant='cover') {
  if(!src)return ''
  if(src.startsWith('asset:'))return `/api/index.php?action=asset&asset=${encodeURIComponent(src.slice(6))}&variant=${variant}`
  if(src.startsWith('/') || /^https?:\/\//i.test(src))return src
  const base=form.value.image || form.value.detailImage || ''
  return `${base.slice(0,base.lastIndexOf('/')+1)}${src}`
}
function applyAsset(asset, target) {
  const src=`asset:${asset.id}`
  if(target==='gallery')form.value.gallery.push({src,title:'',alt:'',wide:false})
  else {form.value[target]=src;form.value[target+'Alt']=''}
}
async function upload(event) {
  const files=[...event.target.files];event.target.value='';if(!files.length)return
  if(uploadTarget.value!=='gallery' && files.length>1){error.value='封面與主圖一次請選一張。';return}
  await run(async()=>{
    if(!currentId.value || dirty.value)await save()
    let completed=0, resized=0
    try {
      for(const file of files){
        const prepared=await prepareImage(file,uploadMode.value,limits.value);if(prepared.changed)resized++
        const data=new FormData();data.set('id',currentId.value);data.set('mode',uploadMode.value);data.set('image',prepared.file,file.name)
        const result=await call('upload',{form:data});applyAsset(result.asset,uploadTarget.value);completed++
      }
      message.value=`已處理 ${completed} 張圖片，請填寫圖片說明並儲存草稿。`+(resized?`其中 ${resized} 張已先在瀏覽器縮小；完整原檔仍留在你的電腦。`:'')
    } catch(failure) {if(completed)message.value=`已完成 ${completed} 張圖片，其餘上傳未完成；已完成的圖片仍保留，請確認後儲存。`;throw failure}
    finally {await loadAssets()}
  })
}
function move(items,index,step) {const next=index+step;if(!Number.isInteger(index)||!Number.isInteger(next)||index<0||index>=items.length||next<0||next>=items.length)return;[items[index],items[next]]=[items[next],items[index]]}
async function loadInbox() {await run(async()=>{repositories.value=await fetchRepositories('orangecat-web');inboxLoaded.value=true})}
function importRepo(repo) {
  if(!discardAllowed())return
  currentId.value='';version.value=0;assets.value=[];form.value={...blank(),title:repo.name,summary:repo.description,role:'',category:'FRONT-END / GITHUB',categoryIds:['frontend'],cover:'github',githubRepository:repo.name,techTags:repo.language?[repo.language]:[]};baseline.value=''
  message.value='已帶入倉庫資料，請補上介紹與負責項目，再儲存草稿。'
}
const kb=bytes=>`${Math.round(bytes/1024)} KB`
const date=value=>new Date(value).toLocaleString('zh-TW')
function beforeUnload(event){if(dirty.value){event.preventDefault();event.returnValue=''}}
function focus(){if(authenticated.value && !busy.value)loadRecords().catch(failure=>{error.value=failure.message;if(failure.status===401)authenticated.value=false})}
onMounted(()=>{initialize();window.addEventListener('beforeunload',beforeUnload);window.addEventListener('focus',focus)})
onUnmounted(()=>{window.removeEventListener('beforeunload',beforeUnload);window.removeEventListener('focus',focus)})
</script>

<template lang="pug">
main.admin-shell
  header.admin-header
    div
      p.admin-kicker ORANGE CAT / PORTFOLIO
      h1 作品管理
    nav(aria-label="後台導覽")
      a(href="/" target="_blank" rel="noopener") 查看網站 ↗
      button(v-if="authenticated" type="button" :disabled="busy" @click="logout") 登出
  p.admin-message(v-if="!managedPortfolio") 目前網站尚未啟用圖文管理模式；可儲存草稿，完成網站設定後才能發布。
  p.admin-error(v-if="error" role="alert") {{ error }}
  p.admin-message(v-if="message" role="status") {{ message }}
  p(v-if="authenticated === null && !error" role="status") 正在確認登入狀態…
  button(v-if="authenticated === null && error" type="button" :disabled="busy" @click="initialize") 重新連線
  form.admin-login(v-if="authenticated === false && setupRequired" @submit.prevent="setup")
    h2 首次設定管理員
    p 安裝碼在安裝包 portfolio-private 裡的「首次安裝碼.txt」，帳密由你自行設定。
    label 首次安裝碼
      input(v-model="setupCode" type="password" autocomplete="off" required :disabled="busy")
    label 管理員帳號
      input(v-model="username" autocomplete="username" required :disabled="busy")
    label 設定密碼（至少 12 字元）
      input(v-model="password" type="password" autocomplete="new-password" required :disabled="busy")
    label 再輸入一次密碼
      input(v-model="confirmPassword" type="password" autocomplete="new-password" required :disabled="busy")
    button.admin-primary(type="submit" :disabled="busy") 建立管理員
  form.admin-login(v-if="authenticated === false && !setupRequired" @submit.prevent="login")
    h2 管理員登入
    label 帳號
      input(v-model="username" name="username" autocomplete="username" required :disabled="busy")
    label 密碼
      input(v-model="password" name="password" type="password" autocomplete="current-password" required :disabled="busy")
    button.admin-primary(type="submit" :disabled="busy") {{ busy ? '登入中…' : '登入' }}
  .admin-layout(v-if="authenticated")
    aside.admin-sidebar
      button.admin-primary(type="button" :disabled="busy" @click="newProject") 新增作品
      label 搜尋作品
        input(v-model="search" type="search")
      nav.admin-records(aria-label="作品清單")
        button(v-for="item in visibleRecords" :key="item.project.id" type="button" :class="{ 'is-selected': currentId === item.project.id }" :disabled="busy" @click="select(item.project.id)")
          strong {{ item.project.title || '未命名作品' }}
          span {{ item.published ? (item.hasDraft ? '已公開 · 有修改草稿' : '已公開') : '私人草稿' }}
      details.admin-inbox
        summary GitHub 待整理
        p 新倉庫先編輯、預覽與發布，才會出現在網站。
        button(type="button" :disabled="busy" @click="loadInbox") 讀取公開倉庫
        p(v-if="inboxLoaded && !inbox.length") 目前沒有待整理倉庫。
        button(v-for="repo in inbox" :key="repo.name" type="button" :disabled="busy" @click="importRepo(repo)") {{ repo.name }} ＋
      details.admin-history
        summary 公開版本還原
        p 保留最近 20 次公開清單變更；還原不刪除私人草稿。
        p(v-if="!history.length") 尚無歷史版本。
        button(v-for="item in history" :key="item.id" type="button" :disabled="busy" @click="restore(item.id)") 還原 {{ date(item.at) }} · {{ item.count }} 件
    section.admin-editor
      p(v-if="!form") 選擇一件作品，或新增作品開始編輯。
      form(v-else @submit.prevent="run(save)")
        .admin-actions
          button.admin-primary(type="submit" :disabled="busy") {{ busy ? '處理中…' : '儲存草稿' }}
          a(v-if="currentId && currentRecord?.hasDraft" :href="previewUrl" target="_blank" rel="noopener" @click="preview") 預覽草稿 ↗
          button(type="button" :disabled="busy || !currentRecord?.hasDraft || dirty || !managedPortfolio" @click="publish") 確認發布
          button(v-if="currentRecord?.published" type="button" :disabled="busy" @click="unpublish") 下架
          span {{ dirty ? '有未儲存修改' : '目前內容已儲存' }}
        fieldset(:disabled="busy")
          legend 基本資料
          label 作品名稱
            input(v-model="form.title" maxlength="100")
          .admin-category-options
            span 作品分類
            label(v-for="[id, label] in categories" :key="id")
              input(v-model="form.categoryIds" type="checkbox" :value="id")
              | {{ label }}
          label 類型文字
            input(v-model="form.category" placeholder="WEB / VISUAL DESIGN")
          label 作品簡介
            textarea(v-model="form.summary" rows="5")
          label 負責項目
            textarea(v-model="form.role" rows="2")
          label 展示網址
            input(v-model="form.externalUrl" placeholder="https://… 或 /lab.html")
          label 網址按鈕文字
            input(v-model="form.externalLabel" placeholder="查看上線網站")
          label GitHub 倉庫名稱
            input(v-model="form.githubRepository" placeholder="只填倉庫名稱，例如 00.template")
          label 技術標籤（以逗號分隔）
            input(v-model="tags")
          .admin-order
            label
              input(v-model="form.featured" type="checkbox")
              | 首頁精選（最多三件）
            label 精選排序（數字小的在前）
              input(v-model.number="form.featuredOrder" type="number" min="0" max="100000")
            label 分類排序（數字小的在前）
              input(v-model.number="form.sortOrder" type="number" min="0" max="100000")
        fieldset(:disabled="busy")
          legend 圖片上傳
          p JPEG、PNG、WebP；大圖會依主機能力先在瀏覽器縮小。先儲存私人草稿，發布後才公開。
          p(v-if="limits") 目前主機每張上傳上限 {{ kb(limits.maxBytes) }}；較大的圖片會先自動縮小。
          p 已先縮小的圖片，主機保留上傳版本；完整原檔仍在你的電腦。
          .admin-upload-options
            label 圖片用途
              select(v-model="uploadTarget" aria-label="圖片用途")
                option(value="gallery") 多張作品圖
                option(value="image") 列表封面
                option(value="detailImage") 內頁主圖
            label 處理方式
              select(v-model="uploadMode" aria-label="處理方式")
                option(value="photo") 一般照片
                option(value="design") 設計長圖（保留完整高度）
            label 選擇圖片
              input(type="file" accept="image/jpeg,image/png,image/webp" :multiple="uploadTarget === 'gallery'" @change="upload")
          .admin-main-images
            div
              h3 列表封面
              img(v-if="form.image" :src="picture(form.image)" alt="目前封面預覽")
              label 封面替代文字
                input(v-model="form.imageAlt")
              button(type="button" @click="form.image = ''; form.imageAlt = ''") 移除封面
            div
              h3 內頁主圖
              img(v-if="form.detailImage || form.image" :src="picture(form.detailImage || form.image, 'display')" alt="目前內頁主圖預覽")
              label 內頁主圖替代文字
                input(v-model="form.detailImageAlt" :disabled="!form.detailImage" :placeholder="form.detailImage ? '' : '沿用封面替代文字'")
              button(type="button" @click="form.detailImage = ''; form.detailImageAlt = ''") 沿用封面
          details(v-if="assets.length")
            summary 已上傳圖片（{{ assets.length }} 張）
            .admin-assets
              article(v-for="asset in assets" :key="asset.id")
                img(:src="picture('asset:' + asset.id)" :alt="asset.originalName")
                p {{ asset.originalName }}
                p 上傳檔 {{ kb(asset.originalBytes) }} → 封面 {{ kb(asset.variants.cover.bytes) }} ／大圖 {{ kb(asset.variants.display.bytes) }}
                p {{ asset.variants.display.width }} × {{ asset.variants.display.height }}
                p(v-if="asset.variants.display.bytes > asset.variants.display.targetBytes") 為保留畫質，這張圖超過一般大小目標；請預覽確認。
                button(type="button" @click="applyAsset(asset, 'image')") 設為封面
                button(type="button" @click="applyAsset(asset, 'detailImage')") 設為主圖
                button(type="button" @click="applyAsset(asset, 'gallery')") 加入作品圖
        fieldset(:disabled="busy")
          legend 多張作品圖
          p 拖曳左側把手可排序，也可使用上移、下移按鈕。
          article.admin-gallery-item(v-for="(item, index) in form.gallery" :key="index")
            span.admin-drag(draggable="true" aria-label="拖曳排序" @dragstart="$event.dataTransfer.setData('text/plain', String(index))" @dragover.prevent @drop.prevent="move(form.gallery, Number($event.dataTransfer.getData('text/plain')), index - Number($event.dataTransfer.getData('text/plain')))") ☰
            img(:src="picture(item.src)" :alt="item.alt || '作品圖預覽'")
            label 圖片標題
              input(v-model="item.title")
            label 替代文字
              input(v-model="item.alt")
            label
              input(v-model="item.wide" type="checkbox")
              | 寬版顯示
            .admin-row-actions
              button(type="button" :disabled="index === 0" @click="move(form.gallery, index, -1)") 上移
              button(type="button" :disabled="index === form.gallery.length - 1" @click="move(form.gallery, index, 1)") 下移
              button(type="button" @click="form.gallery.splice(index, 1)") 移除
        fieldset(:disabled="busy")
          legend 作品思路
          article.admin-note(v-for="(note, index) in form.caseStudy" :key="index")
            label 小標題
              input(v-model="note.heading")
            label 內文
              textarea(v-model="note.body" rows="4")
            button(type="button" @click="move(form.caseStudy, index, -1)") 上移
            button(type="button" @click="move(form.caseStudy, index, 1)") 下移
            button(type="button" @click="form.caseStudy.splice(index, 1)") 移除段落
          button(type="button" @click="form.caseStudy.push({ heading: '', body: '' })") 新增段落
</template>

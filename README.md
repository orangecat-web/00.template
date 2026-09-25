# oc-template → Vue 3：第一批搬移

## 首頁作品版（2026-09-26）

首頁現在依序呈現個人定位、三件精選作品、合作服務、工作經歷、互動實驗室預告與關於我的短摘要。完整作品一覽在 `/work.html`，原本首頁的影像濾鏡、八種導覽動態及圖文媒體檢視移到 `/lab.html`；Google Icons 維持 `/icons.html`。精選作品由 `src/data/projects.js` 管理，卡片元件是 `src/components/ProjectCard.vue`。新增專案到 `projects` 後，作品頁會自動列出；設定 `featured: true` 的前三件會出現在首頁。站外案例連到已公開的原站，正式案例頁完成後可替換 `href`。

首頁 `03 / EXPERIENCE` 參考 Knight Lab TimelineJS 的閱讀方式：中央一次顯示一段經歷，使用左右箭頭或下方年份節點切換，內容會依方向水平滑動。七段資料集中在 `src/data/experience.js`，元件是 `src/components/ExperienceTimeline.vue`，不需 jQuery、外部 iframe 或試算表；時間軸可在手機橫向捲動，也支援鍵盤左右鍵。首頁文字維持摘要長度，未來完整職責與成果可放在 About 頁。

`src/data/media.js` 仍管理實驗室圖庫和燈箱內容，與專案資料分開。首頁載入 `main.sass`，實驗室額外載入 `lab-page.sass` 中的效果、媒體檢視及導覽試玩樣式；Vite 會產生對應的 CSS。既有選單、回頁首、輪播與 Google Icons 專頁保留。`npm run build` 會檢查四個入口。關於與聯絡頁預計獨立製作；目前還沒有公開聯絡信箱，所以首頁沒有失效的聯絡按鈕。

這份專案以你上傳的 **`00.template(1).zip`** 為底，從舊版 **`oc-template.zip`** 挑出能沿用的資產。它是可執行的 Vue 3 視覺效果展示，原版並不是客戶案例集；頁面也沒有把示範照片說成客戶專案。

## 啟動

```powershell
cd D:\00.orangeCatWork\01.httpdoc\00.template
npm install
npm run dev
```

開啟終端機顯示的網址，通常是 `http://localhost:5173/`。Google Icons 專頁是 `http://localhost:5173/icons.html`。既有 `package.json` 的 `dev` 指令是 `vite --open`，會自動開啟瀏覽器。建置檢查：`npm run build`。

若 PowerShell 的 `npm.ps1` 被系統執行原則擋住，可將上面指令中的 `npm` 改成 `npm.cmd`。

## 舊版檔案盤點與處理

| 舊版 | 這一版的處理 | 新版位置／原因 |
| --- | --- | --- |
| `images/logo.svg`、`btn_open.svg`、`btn_close.svg`、`btn_gotop.svg` | 原檔複製 | `public/images/`；logo 與回頁首圖已使用，選單圖先留待下一步比較 |
| `favicon.ico` | 原檔複製 | `public/favicon.ico` |
| `upload/` 中的 5 張照片 | 原檔複製 | `src/assets/photos/`；由 `src/data/media.js` 引用，Vite 只打包有用到的照片 |
| `sass/_effects.sass` | 挑選、修正、改寫 | `src/assets/sass/_effects.sass`；已移植 10 種圖片濾鏡／原色與 15 種疊色模式，使用 `@use` 模組；原始轉場工具仍保存在 `reference/legacy-sass/` |
| `sass/_mixin.sass` | 保留名稱、修正舊相依後移植 | `src/assets/sass/_mixin.sass`；字型、文字截斷、轉場、邊框、圓角、回頁首、表單、分頁、表格、圖文列表與相簿 mixin。原檔仍在 `reference/legacy-sass/` |
| `sass/_function.sass` | 搬移並共用 | `src/assets/sass/_function.sass`；保留尺寸、字重、12 欄、容器設定及計算函式，改用 `sass:math`、`sass:map` |
| `sass/_grid.sass` | 搬移並接入 | `src/assets/sass/_grid.sass`；保留 `container`、`row`、`col`、`breakpoint` 等名稱與舊斷點；共用 `_function.sass` 的設定 |
| `sass/_include.sass` | 選用字型並整理後備字型 | `src/assets/sass/_include.sass`；載入 Noto Sans TC、Roboto、Raleway，遠端無法載入時改用系統繁中字型；Material Icons 只由圖示專頁載入 |
| `sass/_spacing.sass` | 名稱沿用、改為模組 | `src/assets/sass/_spacing.sass`；對齊、flex、margin、padding、display 快捷 mixin，距離取自新版 `_function.sass` |
| `sass/_navs.sass` | 重新實作 | `src/assets/sass/_navs.sass`；四方向的 offcanvas 位置與覆蓋／推擠轉場，實驗室的八組試玩樣式另外放在 `_nav-lab.sass` |
| `pug/icon_exsample.pug`、`sass/_icons.sass` | 獨立頁移植 | `icons.html`、`src/IconsApp.vue`、`src/data/icons.js`、`src/assets/sass/_icons.sass`；五種本地字型在 `src/assets/fonts/`，僅由 `icons-page.sass` 載入 |
| `pug/_base.pug` | 結構改寫 | `src/components/SiteLayout.vue` 的共用 header、nav、footer、回頂；頁面內容各由 `App.vue`、`IconsApp.vue` 填入，桌面與手機共用一份 `<nav>` |
| `pug/graphic_list.pug`、`pug/tools/_list.pug` | 元件化改寫 | `src/components/GalleryCard.vue`、`src/LabApp.vue` 與 `src/data/media.js`；用 `v-for` 取代重複 markup |
| `pug/portfolio.pug` | 效果概念沿用 | `LabApp.vue` 的視覺效果實驗區；大量效果尚未逐一搬完 |
| 舊版全部 13 支 `_*.sass` partial | 原檔複製 | `reference/legacy-sass/`；完整保留你的工具庫。`_effects.sass`、`_mixin.sass`、`_function.sass`、`_grid.sass`、`_include.sass`、`_spacing.sass`、`_navs.sass` 已另做新版模組 |
| 舊版 `css/`、`dist/`、根目錄 HTML | 不複製 | 舊版編譯產物；新版交給 Vite 從 Vue / Sass 產生 |
| `js/jquery-3.5.0.js`、`js/nav/slidebars*`、`js/basic.js` | 不複製 | 導覽功能由 `src/composables/useOffcanvas.js`、共用的 `SiteLayout.vue` 實作；`usePageScroll.js` 負責捲動，媒體檢視使用 `<dialog>` |
| 其他未使用照片與示範頁 | 暫不複製 | 等需要展示對應功能時再選擇性搬移 |

## 網站共用外框

`src/components/SiteLayout.vue` 是首頁與內頁共用的 header、nav、footer、浮動回頂，copyright 在此元件統一輸出。全部 nav 連結集中在 `src/data/navigation.js` 的 `navigationItems`，由 `pageId` 選出目前頁的連結；`App.vue`、`IconsApp.vue` 不再各存一份陣列。新增內頁時傳 `page-id`，在同一份清單加上連結，並視需要設定 `brand-caption`。

`src/composables/useOffcanvas.js` 管理 nav 的四方向、覆蓋／推擠和開關；`usePageScroll.js` 管理 350px header、200px 回頂與 600ms 捲動。共用元件會攔截本頁 `#section-id` 的 nav 連結，以同一動畫捲至目標（扣除 header 高度）；跨頁連結照網址導航。八種模式試玩位於 `LabApp.vue`，只控制共用 nav。

Sass 分為 `src/assets/sass/shared.sass`（共用外框，匯入 `_site-chrome.sass` 和 `_navs.sass`）、`main.sass`（首頁與作品頁版型）、`lab-page.sass`（實驗室效果、媒體檢視和 `_nav-lab.sass`）與 `icons-page.sass`（圖示頁）。Vite 打包後會按入口產生 CSS，圖示字型僅在圖示頁載入。

## Google Icons 獨立頁

開啟 `/icons.html` 查看舊版六類、61 個常用範例；可切換 Filled、Round、Outlined、Sharp、Two Tone 五種字型樣式、搜尋名稱或標籤、點選圖示複製 Sass 名稱。`_icons.sass` 保留 `@include icons.google_icons(home, round)` 的兩參數用法（使用 `@use './icons' as icons`），也示範 Google 原生 ligature 寫法。舊版五個 Material Icons 字型檔放在 `src/assets/fonts/`；其 Apache 2.0 授權條款見該資料夾。首頁的 CSS 不包含這些字型，正式打包會生成 `dist/icons.html` 及獨立的 CSS。圖示頁沿用同一套選單邏輯，桌面顯示橫列、手機顯示可開關的側欄；分類、頁尾與浮動回頂按鈕使用 `usePageScroll.js` 的 600ms 動態捲動，捲過 350px 縮小 header、捲過 200px 顯示回頂按鈕。

## 已可操作

- 首頁精選照片由 `src/components/HeroCarousel.vue` 讀取 `src/data/media.js` 裡的圖片項目；每 6 秒向左滑動切換，上一張向右、下一張向左，也能暫停或在手機左右滑。游標停留、鍵盤焦點進入、分頁隱藏或輪播滑出畫面時會暫停；系統設定減少動態效果時不會自動播放。
- 視覺效果切換：原色與 9 種圖片濾鏡（灰階、懷舊、對比、亮度、反相、透明度、色相旋轉、模糊、飽和度），以及舊版 `pseffects` 的 15 種疊色模式。模式名稱和濾鏡參數可在 `src/assets/sass/_effects.sass`、`lab-page.sass` 調整；效果清單在 `src/LabApp.vue`。
- 導覽動態試玩：一份導覽內容，四個方向（左、右、上、下）與兩個模式（覆蓋、推擠）；可用關閉鈕、背景或 Esc 關閉，開啟時鎖住背景捲動。手機的選單鈕使用同一份導覽。
- 圖文卡片依類別篩選、滑入效果；點擊後開啟深色全螢幕媒體檢視，圖片由卡片位置放大進場。左右兩側切換、右上角縮圖／縮放／輪播／全螢幕／關閉，支援方向鍵、手機左右滑、Esc 和背景點擊。元件與樣式位於 `src/components/MediaLightbox.vue`、`src/assets/sass/_media-lightbox.sass`。
- 手機選單、頁面定位捲動、回到頁首；保留舊版 `basic.js` 的門檻：捲過 350px 縮小 header、捲過 200px 顯示回頁首，點擊後以原生 `requestAnimationFrame` 做 600ms 捲動。全部沒有 jQuery 執行相依。
- 已移除首頁跑馬燈；共用 Sass mixin 的 `transition`、`mline`、`goTop`、`radius50`，以及格線的 `container`、`breakpoint` 已在目前頁面實際使用。
- `<script setup>`、`<template lang="pug">`、縮排式 `.sass`、`sass:math`。

## 共用媒體檢視 MediaLightbox

`src/components/MediaLightbox.vue` 透過 `items` 陣列決定內容，`open(id, sourceElement)` 或 `openAt(index, sourceElement)` 開啟。第二個參數可省略；傳入卡片元素時，內容會從卡片位置放大，沒有來源元素時由中央淡入。實驗室從 `src/data/media.js` 讀取同一份清單，卡片、分類與燈箱同步更新。互動與動畫都在同一個元件，不需 jQuery 或第三方 lightbox。

| `type` | 使用資料 | 內容 |
| --- | --- | --- |
| `image` | `src`、`alt`、`title`、`caption` | 圖片，可縮放與輪播 |
| `youtube` | YouTube 網址放 `src` | 轉成 youtube-nocookie 嵌入網址 |
| `video` | 影片 `src`，可加 `poster` | HTML5 `<video controls>` |
| `map` | Google Maps iframe 的 `src` | 地圖嵌入；需用分享選單提供的嵌入網址 |
| `text` | `title`、`text` | 純文字；換行會保留 |
| `custom` | 任意資料搭配 `#content` slot | 由 Vue 模板自行渲染 HTML 與元件 |

每項需有**唯一 `id`**。`caption` 會放在卡片文字與燈箱底部，非圖片項目建議加 `poster` 作為卡片及縮圖封面，省略時卡片會顯示媒體類型。`category` 的顯示名稱可在 `mediaCategoryNames` 設定，實驗室只顯示有項目的分類。YouTube 可用一般觀看、Shorts 或嵌入網址；Google Maps 須用分享選單提供的嵌入網址。不直接渲染外部輸入的 HTML 字串，客製內容請用 Vue slot。

### 在同一份清單混用圖片、影片與地圖

編輯 `src/data/media.js` 的 `mediaItems`，把下列項目加在現有照片後面，換成自己的網址和封面即可。實驗室會自動出現「影片」與「地點」分類，點卡片後開啟對應內容；`src/LabApp.vue` 不用另外建立一份影片或地圖陣列。`public/images/` 的圖片以 `/images/檔名.jpg` 引用；若放在 `src/assets/`，先 import 再指定給 `poster`。

```js
{ id: 'film-1', type: 'youtube', category: 'videos', categoryLabel: 'VIDEO',
  title: '影片標題', caption: '影片說明',
  src: 'https://www.youtube.com/watch?v=你的影片ID', poster: '/images/你的影片封面.jpg' },
{ id: 'place-1', type: 'map', category: 'places', categoryLabel: 'LOCATION',
  title: '地點名稱', caption: '地點說明',
  src: '從 Google Maps 嵌入程式碼取出的 iframe src', poster: '/images/你的地圖封面.jpg' },
```

```vue
<script setup>
import { ref } from 'vue'
import MediaLightbox from './components/MediaLightbox.vue'

const lightbox = ref(null)
const items = [
  { id: 'photo', type: 'image', src: '/images/photo.jpg', alt: '作品照片', title: '作品照片' },
  { id: 'film', type: 'video', src: '/videos/demo.mp4', poster: '/images/poster.jpg', title: '影片' },
  { id: 'story', type: 'text', title: '設計說明', text: '第一段文字\n第二段文字' },
  { id: 'details', type: 'custom', title: '自訂內容' },
]
</script>

<template>
  <button @click="lightbox.open('photo', $event.currentTarget)">看照片</button>
  <MediaLightbox ref="lightbox" :items="items">
    <template #content="{ item }">
      <article v-if="item.id === 'details'">這裡可以放 Vue 元件或任意版面。</article>
    </template>
  </MediaLightbox>
</template>
```

開啟 YouTube 時填一般觀看網址；地圖請從 Google Maps「分享 → 嵌入地圖」複製 iframe 的 `src`。媒體切換後原生影片與 iframe 會卸載，播放也會停止。工具列中的輪播只在圖片項目啟用；切到其他類型就會自動暫停。

## 使用舊版 mixin 的新版模組

在需要套用樣式的 `.sass` 檔加入 `@use './mixin' as oc`（相對路徑依檔案位置調整），再呼叫熟悉的名稱，例如：

```sass
@use './mixin' as oc

.card-description
  @include oc.mline(3)

.rounded-photo
  @include oc.radius(1, top-left)
```

模組中保留舊版 mixin 名稱，尺寸與字重改從新版 `_function.sass` 讀取，不再依賴舊版全域 `@import`；舊版未完成的表單與頁碼功能也整理成不依賴缺失圖片的版本。`@use` 本身不會把全部 mixin 變成 CSS，只有實際 `@include` 的規則會輸出。

## 共用設定與 RWD 格線

`_function.sass` 是共用設定來源；`_grid.sass`、`_mixin.sass` 都由它讀取。每支要使用變數或 mixin 的 Sass 檔，仍要自行宣告命名空間。若要覆寫設定，先載入 `_function.sass`，再載入依賴它的模組：

```sass
@use './function' as base with ($baseSize: 16px, $custom-gutter-width: 32px)
@use './grid' as grid
@use './mixin' as oc

.row
  @include grid.row

.half
  @include grid.col(6)
  @include grid.breakpoint()
    @include grid.col(12)

.card-title
  @include oc.mline(2)
```

`grid.breakpoint()` 是小於 576px；`sm` 是 576–767.98px，`md` 是 768–991.98px，`lg` 是 992–1199.98px，`xl` 是 1200px 以上。舊版裝置代號也保留作為相容選項；`DPIreset` 會縮放整頁，需明確呼叫才會輸出。

字型與間距也各自用命名空間，例如 `@use './include' as fonts` 後使用 `fonts.$font-body`，或 `@use './spacing' as sp` 後使用 `@include sp.mt(2)`（預設 `2 × 15px`）。若使用端無法下載 Google Fonts，字型會依照 `_include.sass` 中的後備順序回退。

選單方向與模式的預設值在 `SiteLayout.vue` 呼叫的 `useOffcanvas({ initialSide: 'left', initialMode: 'overlay' })`；實驗室的試玩區可立即切換八種組合。`slidebars.js` 和 jQuery 不會進入正式 bundle。

## 下一步

舊版的 `basic_exsample.pug`、`graphic_list.pug` 有更多工具展示。可依面試需求逐項挑最能證明切版與互動能力的部分，再移植成 Vue 元件；網站視覺也可在此基礎上換成正式作品內容。舊 Sass partial 已留在 `reference/legacy-sass/`，使用狀態見該資料夾的說明。

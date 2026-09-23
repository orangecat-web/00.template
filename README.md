# oc-template → Vue 3：第一批搬移

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
| `upload/` 中的 5 張照片 | 原檔複製 | `src/assets/photos/`；由 `src/data/photos.js` 引用，Vite 只打包有用到的照片 |
| `sass/_effects.sass` | 挑選、修正、改寫 | `src/assets/sass/_effects.sass`；已移植 10 種圖片濾鏡／原色與 15 種疊色模式，使用 `@use` 模組；原始轉場工具仍保存在 `reference/legacy-sass/` |
| `sass/_mixin.sass` | 保留名稱、修正舊相依後移植 | `src/assets/sass/_mixin.sass`；字型、文字截斷、轉場、邊框、圓角、回頁首、表單、分頁、表格、圖文列表與相簿 mixin。原檔仍在 `reference/legacy-sass/` |
| `sass/_function.sass` | 搬移並共用 | `src/assets/sass/_function.sass`；保留尺寸、字重、12 欄、容器設定及計算函式，改用 `sass:math`、`sass:map` |
| `sass/_grid.sass` | 搬移並接入 | `src/assets/sass/_grid.sass`；保留 `container`、`row`、`col`、`breakpoint` 等名稱與舊斷點；共用 `_function.sass` 的設定 |
| `sass/_include.sass` | 選用字型並整理後備字型 | `src/assets/sass/_include.sass`；載入 Noto Sans TC、Roboto、Raleway，遠端無法載入時改用系統繁中字型；Material Icons 只由圖示專頁載入 |
| `sass/_spacing.sass` | 名稱沿用、改為模組 | `src/assets/sass/_spacing.sass`；對齊、flex、margin、padding、display 快捷 mixin，距離取自新版 `_function.sass` |
| `sass/_navs.sass` | 重新實作 | `src/assets/sass/_navs.sass`；四方向的 offcanvas 位置與覆蓋／推擠轉場，首頁的八組試玩樣式另外放在 `_nav-lab.sass` |
| `pug/icon_exsample.pug`、`sass/_icons.sass` | 獨立頁移植 | `icons.html`、`src/IconsApp.vue`、`src/data/icons.js`、`src/assets/sass/_icons.sass`；五種本地字型在 `src/assets/fonts/`，僅由 `icons-page.sass` 載入 |
| `pug/_base.pug` | 結構改寫 | `src/components/SiteLayout.vue` 的共用 header、nav、footer、回頂；頁面內容各由 `App.vue`、`IconsApp.vue` 填入，桌面與手機共用一份 `<nav>` |
| `pug/graphic_list.pug`、`pug/tools/_list.pug` | 元件化改寫 | `src/components/GalleryCard.vue` 與 `src/data/photos.js`；用 `v-for` 取代重複 markup |
| `pug/portfolio.pug` | 效果概念沿用 | `App.vue` 的視覺效果實驗區；大量效果尚未逐一搬完 |
| 舊版全部 13 支 `_*.sass` partial | 原檔複製 | `reference/legacy-sass/`；完整保留你的工具庫。`_effects.sass`、`_mixin.sass`、`_function.sass`、`_grid.sass`、`_include.sass`、`_spacing.sass`、`_navs.sass` 已另做新版模組 |
| 舊版 `css/`、`dist/`、根目錄 HTML | 不複製 | 舊版編譯產物；新版交給 Vite 從 Vue / Sass 產生 |
| `js/jquery-3.5.0.js`、`js/nav/slidebars*`、`js/basic.js` | 不複製 | 導覽功能由 `src/composables/useOffcanvas.js`、共用的 `SiteLayout.vue` 實作；`usePageScroll.js` 負責捲動，照片放大使用 `<dialog>` |
| 其他未使用照片與示範頁 | 暫不複製 | 等需要展示對應功能時再選擇性搬移 |

## 網站共用外框

`src/components/SiteLayout.vue` 是首頁與內頁共用的 header、nav、footer、浮動回頂。全部 nav 連結集中在 `src/data/navigation.js` 的 `navigationItems`，由 `pageId` 選出目前頁的連結；`App.vue`、`IconsApp.vue` 不再各存一份陣列。新增內頁時傳 `page-id`，在同一份清單加上連結，並視需要設定 `brand-caption` 和 `footer-text`。

`src/composables/useOffcanvas.js` 管理 nav 的四方向、覆蓋／推擠和開關；`usePageScroll.js` 管理 350px header、200px 回頂與 600ms 捲動。共用元件會攔截本頁 `#section-id` 的 nav 連結，以同一動畫捲至目標（扣除 header 高度）；跨頁連結照網址導航。首頁的八種模式試玩仍在 `App.vue`，只控制共用 nav。

Sass 分為 `src/assets/sass/shared.sass`（共用外框，匯入 `_site-chrome.sass` 和 `_navs.sass`）、`main.sass`（首頁）與 `icons-page.sass`（圖示頁）；首頁試玩樣式在 `_nav-lab.sass`。Vite 打包後也會分開產生共用 CSS 和各頁 CSS，圖示字型僅在圖示頁載入。

## Google Icons 獨立頁

開啟 `/icons.html` 查看舊版六類、61 個常用範例；可切換 Filled、Round、Outlined、Sharp、Two Tone 五種字型樣式、搜尋名稱或標籤、點選圖示複製 Sass 名稱。`_icons.sass` 保留 `@include icons.google_icons(home, round)` 的兩參數用法（使用 `@use './icons' as icons`），也示範 Google 原生 ligature 寫法。舊版五個 Material Icons 字型檔放在 `src/assets/fonts/`；其 Apache 2.0 授權條款見該資料夾。首頁的 CSS 不包含這些字型，正式打包會生成 `dist/icons.html` 及獨立的 CSS。圖示頁沿用同一套選單邏輯，桌面顯示橫列、手機顯示可開關的側欄；分類、頁尾與浮動回頂按鈕使用 `usePageScroll.js` 的 600ms 動態捲動，捲過 350px 縮小 header、捲過 200px 顯示回頂按鈕。

## 已可操作

- 視覺效果切換：原色與 9 種圖片濾鏡（灰階、懷舊、對比、亮度、反相、透明度、色相旋轉、模糊、飽和度），以及舊版 `pseffects` 的 15 種疊色模式。模式名稱和濾鏡參數可在 `src/assets/sass/_effects.sass`、`main.sass` 調整；效果清單在 `src/App.vue`。
- 導覽動態試玩：一份導覽內容，四個方向（左、右、上、下）與兩個模式（覆蓋、推擠）；可用關閉鈕、背景或 Esc 關閉，開啟時鎖住背景捲動。手機的選單鈕使用同一份導覽。
- 圖文卡片依類別篩選、滑入效果、點擊放大與 Esc 關閉。
- 手機選單、頁面定位捲動、回到頁首；保留舊版 `basic.js` 的門檻：捲過 350px 縮小 header、捲過 200px 顯示回頁首，點擊後以原生 `requestAnimationFrame` 做 600ms 捲動。全部沒有 jQuery 執行相依。
- 已移除首頁跑馬燈；共用 Sass mixin 的 `transition`、`mline`、`goTop`、`radius50`，以及格線的 `container`、`breakpoint` 已在目前頁面實際使用。
- `<script setup>`、`<template lang="pug">`、縮排式 `.sass`、`sass:math`。

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

選單方向與模式的預設值在 `SiteLayout.vue` 呼叫的 `useOffcanvas({ initialSide: 'left', initialMode: 'overlay' })`；首頁上的試玩區可立即切換八種組合。`slidebars.js` 和 jQuery 不會進入正式 bundle。

## 下一步

舊版的 `basic_exsample.pug`、`graphic_list.pug` 有更多工具展示。可依面試需求逐項挑最能證明切版與互動能力的部分，再移植成 Vue 元件；網站視覺也可在此基礎上換成正式作品內容。舊 Sass partial 已留在 `reference/legacy-sass/`，使用狀態見該資料夾的說明。

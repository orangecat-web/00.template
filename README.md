# oc-template → Vue 3：第一批搬移

這份專案以你上傳的 **`00.template(1).zip`** 為底，從舊版 **`oc-template.zip`** 挑出能沿用的資產。它是可執行的 Vue 3 視覺效果展示，原版並不是客戶案例集；頁面也沒有把示範照片說成客戶專案。

## 啟動

```powershell
cd D:\00.orangeCatWork\01.httpdoc\00.template
npm install
npm run dev
```

開啟終端機顯示的網址，通常是 `http://localhost:5173/`。既有 `package.json` 的 `dev` 指令是 `vite --open`，會自動開啟瀏覽器。建置檢查：`npm run build`。

若 PowerShell 的 `npm.ps1` 被系統執行原則擋住，可將上面指令中的 `npm` 改成 `npm.cmd`。

## 舊版檔案盤點與處理

| 舊版 | 這一版的處理 | 新版位置／原因 |
| --- | --- | --- |
| `images/logo.svg`、`btn_open.svg`、`btn_close.svg`、`btn_gotop.svg` | 原檔複製 | `public/images/`；logo 與回頁首圖已使用，選單圖先留待下一步比較 |
| `favicon.ico` | 原檔複製 | `public/favicon.ico` |
| `upload/` 中的 5 張照片 | 原檔複製 | `src/assets/photos/`；由 `src/data/photos.js` 引用，Vite 只打包有用到的照片 |
| `sass/_effects.sass` | 挑選、修正、改寫 | `src/assets/sass/_effects.sass`；保留濾鏡、疊色與圖文滑入概念，使用 `@use` 模組 |
| `pug/_base.pug` | 結構改寫 | `src/App.vue` 的 header、main、footer；不沿用整份 HTML 文件與舊腳本標籤 |
| `pug/graphic_list.pug`、`pug/tools/_list.pug` | 元件化改寫 | `src/components/GalleryCard.vue` 與 `src/data/photos.js`；用 `v-for` 取代重複 markup |
| `pug/portfolio.pug` | 效果概念沿用 | `App.vue` 的視覺效果實驗區；大量效果尚未逐一搬完 |
| 舊版全部 13 支 `_*.sass` partial | 原檔複製、暫不直接匯入 | `reference/legacy-sass/`；保留你的工具庫。部分依賴全域 `@import`、舊除法與其他 mixin，要逐支整理後才接進 `src/assets/sass/` |
| 舊版 `css/`、`dist/`、根目錄 HTML | 不複製 | 舊版編譯產物；新版交給 Vite 從 Vue / Sass 產生 |
| `js/jquery-3.5.0.js`、`js/nav/slidebars*`、`js/basic.js` | 不複製 | 互動改用 Vue 狀態、`scrollTo()`、事件監聽與原生 `<dialog>` |
| 未使用的照片、Material Icons 字型與示範頁 | 暫不複製 | 先維持專案精簡；需要展示對應功能時再選擇性搬移 |

## 已可操作

- 視覺濾鏡切換：原色、灰階、懷舊、對比、暖色疊加。
- 圖文卡片依類別篩選、滑入效果、點擊放大與 Esc 關閉。
- 手機選單、頁面定位捲動、回到頁首；保留舊版 `basic.js` 的門檻：捲過 350px 縮小 header、捲過 200px 顯示回頁首，點擊後以原生 `requestAnimationFrame` 做 600ms 捲動。全部沒有 jQuery 執行相依。
- `<script setup>`、`<template lang="pug">`、縮排式 `.sass`、`sass:math`。

## 下一步

舊版的 `basic_exsample.pug`、`graphic_list.pug` 有更多工具展示。可依面試需求逐項挑最能證明切版與互動能力的部分，再移植成 Vue 元件；網站視覺也可在此基礎上換成正式作品內容。舊 Sass partial 已留在 `reference/legacy-sass/`，使用狀態見該資料夾的說明。

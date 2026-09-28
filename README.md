# 00.template

我用 Vue 3 製作的作品集與互動展示。網站可獨立執行；作品資料目前由本地 JSON 提供，尚未連接後端 API。

## 技術與啟動

- Vue 3、Vite、Pug、縮排式 Sass、原生 JavaScript；無 jQuery 執行相依。
- Node.js 與 npm 環境下執行：

```bash
npm ci
npm run dev
npm run check:data
npm run build
npm run preview
```

`dev` 啟動開發伺服器；`check:data` 檢查作品 id、分類及圖片路徑；`build` 先檢查資料，再輸出 `dist/`；`preview` 檢視建置結果。

## 頁面

| 網址 | 用途 |
| --- | --- |
| `/` | 首頁、精選作品、經歷與互動實驗室入口 |
| `/work.html` | 全部作品、分類與每頁 15 筆分頁 |
| `/project.html?id=<id>` | 作品內頁、圖片集與相鄰作品 |
| `/lab.html` | 影像效果、導覽動態、媒體檢視、輪播與環景展示 |
| `/icons.html` | Google Material Icons 樣式展示 |

## 程式位置

| 路徑 | 用途 |
| --- | --- |
| `src/App.vue`、`src/WorkApp.vue`、`src/ProjectApp.vue` | 首頁、作品列表、作品內頁 |
| `src/components/SiteLayout.vue` | 共用頁首、導覽、頁尾與回頁首 |
| `src/components/ProjectCard.vue` | 首頁精選與列表共用卡片 |
| `src/components/MediaLightbox.vue` | 作品圖片與實驗室共用媒體檢視 |
| `src/data/projects-*.json`、`src/data/projects.js` | 三類作品資料、合併清單與內頁網址 |
| `src/utils/pagination.js` | 列表分頁規則 |
| `src/assets/sass/` | 共用樣式、頁面樣式與 Sass 工具 |
| `public/images/` | 網站圖片；以 `/images/...` 引用 |
| `reference/legacy-sass/` | 從舊版保留的 Sass 參考檔 |

## 作品資料

我把作品分在 `src/data/projects-web.json`、`projects-graphic.json`、`projects-product-photo.json`。新增作品只要放進對應檔案的陣列，不必填 `categoryIds`；`projects.js` 會合併「全部作品」，並自動給作品分類。分類列表維持各檔案的陣列順序。全部作品固定以互動實驗室開頭，接著隨機排列有 HTTP(S) 上線網址的網頁作品，再隨機排列其餘作品；同一瀏覽器分頁的順序保持一致，避免翻頁或返回內頁時跳位。作品 `id` 在三份檔案間須唯一且穩定；首頁顯示資料中前 3 件 `featured: true` 的作品。

作品卡片一律導向本站內頁。若有上線網站或可操作展示，我在該作品設定 `externalUrl`，內頁按鈕預設顯示「查看上線網站」；需要不同文字時才加 `externalLabel`。`gallery[].src` 是相對於 `image`（無 `image` 時為 `detailImage`）所在資料夾的檔名；內頁以 `MediaLightbox` 放大圖片。

列表透過 `?category=web&page=2` 保存篩選與頁碼；內頁以 `?id=<id>&category=web&from=2` 保留返回列表的狀態。新增作品後執行 `npm run build`，會自動檢查資料並更新 `dist/`。正式版更新內容需要部署新的建置結果。

## 部署與後端交接

我將 `dist/` 部署在網站根目錄；目前網址與圖片使用 `/...` 絕對路徑。若部署在子路徑，需要調整 Vite `base` 與站內連結。

目前沒有作品 API 或管理後台。我保留可獨立展示的資料版本；日後接 API 時，維持作品 `id`、分類、排序、圖片與 `gallery` 欄位，再補非同步載入、錯誤和空資料狀態。欄位契約與串接邊界見 [前後端交接說明](docs/backend-handoff.md)。

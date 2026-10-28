# 00.template

我用 Vue 3 製作的作品集與互動展示。提供靜態 JSON 模式與可選的 PHP 圖文管理模式；前端開發作品可串接 GitHub REST API，顯示公開專案的語言、更新時間與原始碼連結。

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
| `/404.html` | 找不到頁面時的搜尋與導覽入口 |

## 程式位置

| 路徑 | 用途 |
| --- | --- |
| `src/App.vue`、`src/WorkApp.vue`、`src/ProjectApp.vue`、`src/NotFoundApp.vue` | 首頁、作品列表、作品內頁、404 頁 |
| `src/components/SiteLayout.vue` | 共用頁首、導覽、頁尾與回頁首 |
| `src/components/ProjectCard.vue` | 首頁精選與列表共用卡片 |
| `src/components/MediaLightbox.vue` | 作品圖片與實驗室共用媒體檢視 |
| `src/data/projects-*.json`、`src/data/projects.js` | 三類作品資料、合併清單與內頁網址 |
| `src/utils/pagination.js` | 列表分頁規則 |
| `src/assets/sass/` | 共用樣式、頁面樣式與 Sass 工具 |
| `public/images/` | 網站圖片；以 `/images/...` 引用 |

## 作品資料

我把作品分在 `src/data/projects-web.json`、`projects-graphic.json`、`projects-product-photo.json`。新增作品只要放進對應檔案的陣列，不必填 `categoryIds`；`projects.js` 會合併「全部作品」，並自動給作品分類。分類列表維持各檔案的陣列順序。全部作品固定以互動實驗室開頭，接著隨機排列有 HTTP(S) 上線網址的網頁作品，再隨機排列其餘作品；同一瀏覽器分頁的順序保持一致，避免翻頁或返回內頁時跳位。作品 `id` 在三份檔案間須唯一且穩定；首頁顯示資料中前 3 件 `featured: true` 的作品。

作品卡片一律導向本站內頁。若有上線網站或可操作展示，我在該作品設定 `externalUrl`，內頁按鈕預設顯示「查看上線網站」；需要不同文字時才加 `externalLabel`。`gallery[].src` 是相對於 `image`（無 `image` 時為 `detailImage`）所在資料夾的檔名；內頁以 `MediaLightbox` 放大圖片。

列表透過 `?category=web&page=2` 保存篩選與頁碼；內頁以 `?id=<id>&category=web&from=2` 保留返回列表的狀態。新增作品後執行 `npm run build`，會自動檢查資料並更新 `dist/`。正式版更新內容需要部署新的建置結果。

## 部署與後端交接

我將 `dist/` 部署在網站根目錄；目前網址與圖片使用 `/...` 絕對路徑。若部署在子路徑，需要調整 Vite `base` 與站內連結。

建置會輸出 `dist/404.html`。部署時將伺服器的找不到頁面設定指向 `/404.html`，並維持 HTTP 404 狀態；直接開啟 `/404.html` 可檢查畫面。頁內搜尋會以 GET 前往 `/work.html?q=關鍵字`。

靜態模式串接 GitHub 公開 Repository API；v1.6 另提供 PHP 作品 API 與管理後台，設定方式見文末。我保留可獨立展示的資料版本；日後接 API 時，維持作品 `id`、分類、排序、圖片與 `gallery` 欄位，再補非同步載入、錯誤和空資料狀態。欄位契約與串接邊界見 [前後端交接說明](docs/backend-handoff.md)。

## v1.1：全部公開倉庫納入前端開發

入口：`/work.html?category=frontend`，沿用作品內頁與每頁 15 筆。這次實際取得 orangecat-web 的 17 個公開倉庫；6 個合併既有作品、11 個自動建立文字封面作品，總清單 93 件。

- `src/data/github.json` 的 `projects` 只負責對應既有作品，不再限制展示範圍。EFShop 對應雙語商業資源入口、dish-life 對應同名作品、the-mikuni-whisky 對應株式会社ミクニ，加上原三個對應。
- 所有公開倉庫（含練習、舊版、封存或 Fork）都會納入，未自動判斷品質或排除。沒有描述時顯示介紹整理中；未確認角色不擅自填寫。
- `src/data/github-snapshot.json` 是此次透過 GitHub 取得的真實資料快照，作為初次顯示及連線失敗備援；來源與擷取時間明確標示。
- `src/services/github.js` GET `https://api.github.com/orgs/orangecat-web/repos?type=public&sort=pushed&per_page=100&page=1`，讀完所有分頁、驗證公開組織資料後更新清單。將來新增的公開倉庫會自動加入。
- `src/utils/githubProjects.js` 合併本地作品與全部倉庫；既有作品保留 id、封面、介紹和展示網址。未對應作品以 `github-倉庫名稱小寫` 作為穩定 id，提供自己的內頁。
- `src/composables/useGithub.js` 共用請求與 15 分鐘快取；更新後列表、筆數、搜尋、分頁及內頁一起重新計算。快取鍵升級 v2，避免沿用上一版不完整清單。
- API 網路錯誤／15 秒逾時／403 或 429 限流可重試。顯示快取、過期資料或隨版本附上的快照；不把快照說成即時 API。
- Stars、Forks、主要語言與程式推送時間取自 GitHub；詳細技術標籤可人工補充。GitHub 描述保留原文，可能需要後續修改 GitHub 倉庫的 About。
- 公開 GET 不使用前端 Token；本作品未宣稱登入、權限或 CRUD 能力。

## 後續補圖片與中文介紹

編輯 `src/data/github.json` 的 `overrides`，以倉庫原名當鍵，例如：

```json
{
  "sunger": {
    "title": "上格西服",
    "summary": "請填入確認後的作品介紹",
    "role": "請填入實際負責項目",
    "image": "/images/projects/sunger/cover.jpg",
    "imageAlt": "上格西服網站畫面",
    "tags": ["JavaScript", "前端切版"]
  }
}
```

將圖片放在對應 public/images 位置。若這個倉庫已有本地作品，請在 `projects` 加入 repository 和 projectId 的對應，並在原本作品 JSON 補內容；已有對應作品維持原資料為主。補圖不是 API 正常工作的必要條件。

## 註解與驗證

繁中區塊註解在程式中；正式資料維持標準 JSON。`docs/json-comments/*.jsonc` 是附欄位註解的閱讀副本，修改 src/data 原始 JSON 後執行 `npm run docs:json` 更新，不要只修改副本。

```bash
npm ci
npm test
npm run check:pages
npm run docs:json
npm run build
```

8 組測試涵蓋公開資料、API 分頁、限流／錯誤、快取／過期／重試、全部倉庫合併、資料去重、未來新增與補圖。SSR 頁面檢查依快照與人工對應計算前端作品數（目前 18 筆、15+3 分頁），並驗證文字封面、生成內頁及返回分類；此檢查不取代瀏覽器的視覺／互動測試。正式建置輸出六個 HTML 入口。

## v1.5：作品客製欄位與清理

作品內頁可用 `caseStudy` 加入「作品思路」，每項包含 `heading` 和 `body`；可依前端、視覺設計或商品攝影使用不同的小標題。第一輪為 17 件代表作品填入草稿，其餘作品不顯示空欄。編輯方式和清單見 [作品客製欄位](docs/作品客製欄位.md)。

首頁與列表頁共用的作品卡片保留封面、類型、標題、摘要及 `project-bottom` 連結列；只將負責項目文字留在內頁，卡片仍可直接開啟線上作品或內容頁。

已清除未引用的根目錄圖示副本、public 圖示與按鈕素材及舊錯誤紀錄；保留所有正在引用的作品圖片、原始碼、文件與正式建置產物。

## v1.2：GitHub 資訊位置

GitHub 更新提示與按鈕只顯示在 work 的前端開發分類，按鈕與分類共用 work-category-tab 樣式。內容頁保留原始碼資料讀取，技術標籤、語言／更新日期／Stars／Forks 與原始碼連結放進 project-detail-copy 介紹區，不再提供更新按鈕。

## v1.3：清理未使用檔案

刪除舊 projects.json 與其 JSONC、舊 panoramas.js、PhotoViewer、HelloWorld、初始 CSS、未引用的示範素材、與 public 完全相同的 src 圖片副本和根目錄圖示副本、舊 Sass 備查資料。正式來源仍是三份作品分類 JSON、panoramas.json、public/images 及目前 Sass 模組；刪除紀錄見 docs/cleanup-v1.3.md。

JSONC 產生器會同步移除已不存在來源的自動產生副本，避免刪掉舊資料後又留下舊註解。

## v1.3：列表直接看線上作品

列表卡片不再顯示 GithubProject，技術標籤、GitHub 動態資訊與原始碼連結都在內頁 project-detail-copy 中。卡片仍可進入內容頁，另依 existing externalUrl 提供上線作品或站內 Demo 連結。GitHub 倉庫原始碼網址不會當作上線網站；未來倉庫 About 填入合法 homepage 或在 overrides 補 externalUrl，便能顯示線上作品連結。

## v1.6：作品管理後台

交付方式：開發程式與驗證完成後推送 GitHub，由使用者本機 `git pull --ff-only origin main`、`npm ci` 後確認；確認後再執行打包並自行上傳主機。雲端不代為部署，安裝包不提交 Git。

新增 `/admin.html` 的管理員登入、圖文編輯、圖片自動處理、私人預覽、確認發布與歷史還原。

`npm run package:admin` 一次產出首次安裝 ZIP：原本結構的 `dist/` 與一個 `portfolio-private/`。前者內容照原方式放到公開根目錄，後者放在上一層；用安裝包中的一次性安裝碼在網頁設定自己的帳密。管理者只需要原本的 Node.js 打包，不必在本機裝 PHP／Docker，也不依賴主機 SSH。

主機需 PHP 8.2+、GD/WebP、Exif、Fileinfo、Session；程式讀取主機目前的容量與記憶體，大圖先由瀏覽器縮小，不要求預先調高到 20MB／512MB。新公開圖片放在 `images/projects/uploads/`，更新網站時保留這個目錄。完整原檔在瀏覽器縮小時仍留在本機；主機保留的是實際上傳版本。

原靜態模式仍可 `npm run dev`／`npm run build`；安裝包自動建置管理版，前台只讀取已發布 API，失敗不回退舊 JSON，GitHub 新倉庫先進後台待整理。後台日常編輯不自動提交 Git。此版尚未部署到正式主機。

詳見 [作品管理後台：打包與安裝](docs/portfolio-admin.md)。原本描述「沒有後端」的段落為舊靜態模式說明。

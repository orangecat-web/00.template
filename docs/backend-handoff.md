# 00.template 前後端交接說明

這是可獨立展示的 Vue 3 作品集。**目前沒有後端 API，也不需要後端才能展示作品**。本文件說明現有資料來源、頁面網址與部署方式，供未來串接後台或 API 時使用；現有視覺與互動以目前前端版本為準。

## 啟動與部署

```bash
npm ci
npm run dev
npm run check:data
npm run build
npm run preview
```

- `npm run dev` 啟動開發版；`npm run build` 產生 `dist/`；`npm run preview` 在本機檢查建置結果。
- `npm run check:data` 檢查作品 id、分類、圖片檔案與 gallery 路徑；`npm run build` 會先執行這項檢查，避免缺圖資料進入正式版。
- 部署 `dist/` 到網域根目錄即可提供目前的展示版。網站使用 `/work.html`、`/project.html` 和 `/images/...` 等**根目錄絕對路徑**；若掛在子路徑，需一併調整 Vite `base` 與這些連結。
- 六個 HTML 入口是 `/`（`index.html`）、`/work.html`、`/project.html`、`/lab.html`、`/icons.html`、`/404.html`。`/project.html?id=<id>` 是同一個作品內頁入口，依查詢參數選擇作品；目前不需伺服器提供動態路由重寫。
- 將找不到的網址對應到 `dist/404.html` 並保留 HTTP 404 狀態；具體設定由部署的靜態伺服器決定。404 頁搜尋表單以 GET 導向 `/work.html?q=...`，不需後端 API。
- `public/images/` 中的素材會以 `/images/...` 網址提供。上傳或部署時需保留檔名大小寫及目錄；前端字型、CSS 與 JS 由建置產生。
- 目前編輯 `src/data/*.json` 或替換 `public/` 素材後，都需要重新建置並部署。畫面沒有依賴 API 的載入狀態，也沒有作品管理後台。

## 作品資料來源

作品資料按類別分成 `src/data/projects-web.json`、`projects-graphic.json`、`projects-product-photo.json`。三個檔案各是一個作品陣列；例如 `projects-web.json` 的單筆資料：

```json
[
  {
    "id": "example-work",
    "featured": false,
    "category": "WEB / VISUAL DESIGN",
    "title": "範例網站設計",
    "summary": "首頁視覺與商品展示。",
    "role": "網頁視覺設計",
    "cover": "web-design",
    "image": "/images/projects/example-work/homepage.jpg",
    "imageAlt": "範例網站首頁",
    "detailImage": "/images/projects/example-work/homepage.jpg",
    "detailImageAlt": "範例網站首頁",
    "gallery": [
      { "src": "homepage.jpg", "title": "首頁", "alt": "範例網站首頁畫面" }
    ],
    "externalUrl": "https://example.com/"
  }
]
```

這是欄位形狀的示例，不是需要新增到現有清單的作品。新增時只需選擇檔案；`projects.js` 依來源自動指定分類、合併「全部作品」，不需填 `categoryIds`。分類頁維持檔案內的陣列順序；全部作品固定互動實驗室在第一筆，有 HTTP(S) 上線網址的網頁作品隨機排在其後，其餘作品再隨機排列。同一瀏覽器分頁維持順序，避免分頁、搜尋或從內頁返回時重複或漏掉作品。

| 欄位 | 現有用途與約定 |
| --- | --- |
| `id` | 每件作品唯一且穩定的字串，作為 `/project.html?id=...` 的識別值；改名會使舊連結失效。 |
| `featured` | 布林值；清單中前 3 件 `true` 的作品出現在首頁精選區。 |
| 所屬分類 | 由檔名決定；目前每件作品屬於一個分類。前端合併時產生供篩選的 `categoryIds`；`all` 是全部作品檢視。 |
| `category` | 卡片及內頁顯示的類型文字，與檔案決定的篩選分類分開。 |
| `title`、`summary`、`role` | 作品名稱、簡介、負責項目；列表與內頁都會使用。 |
| `cover` | 沒有 `image` 時的封面視覺樣式識別值；有圖片時也保留卡片樣式 class。 |
| `image`、`imageAlt` | 列表封面圖及替代文字；無圖片時顯示既有文字佔位。 |
| `detailImage`、`detailImageAlt` | 內頁主圖及替代文字；未填主圖時改用 `image`。 |
| `gallery` | 內頁可點開的圖片陣列；每筆有 `src`、`title`、`alt`，可選 `wide: true`。燈箱重用 `MediaLightbox`。 |
| `externalUrl`、`externalLabel` | `externalUrl` 可選，只在作品內頁顯示額外按鈕，卡片一律先進內頁。`projects.js` 會補上預設文字「查看上線網站」；僅在需要不同文字時填 `externalLabel`。HTTP(S) 網址另開分頁；站內路徑留在本站。 |

`gallery[].src` **目前是相對檔名**，前端以 `image`（若無則 `detailImage`）所在目錄組成完整網址。例如 `image: "/images/projects/mim/homepage.jpg"` 配 `src: "products.jpg"`，會讀取 `/images/projects/mim/products.jpg`。不能直接把 API 回傳的完整圖片網址塞入 `gallery[].src`，除非同步修改 `src/ProjectApp.vue` 的組址方式。

## 頁面行為與網址

- `src/data/projects.js` 提供分類、首頁精選、卡片網址與返回列表網址；`src/components/ProjectCard.vue` 供首頁與列表共用。
- 作品列表每頁 **15 筆**，在瀏覽器端篩選與分頁。`/work.html?category=web&page=2` 可直接開啟；不合法分類退回 `all`，不合法頁碼會限制到可用範圍。
- 所有卡片導向 `/project.html?id=<id>`；可附 `category=<分類>` 與 `from=<列表頁碼>`，讓內頁的返回連結回到原列表狀態。內頁顯示同分類的上一件／下一件；找不到作品 id 會顯示找不到作品。
- `gallery` 的圖片在內頁經 `MediaLightbox` 放大。只有 `externalUrl` 的作品會顯示額外的網站或展示連結。

## 日後接 API 的界線

以下是**建議的串接契約，尚未實作**。若需要管理後台，可讓 API 回傳分類與作品清單（例如 `GET /api/portfolio`），每件作品附上分類 id；再以資料取得／轉換層替換 `src/data/projects.js` 的本地 JSON 匯入。保持 `id`、排序、分類 id、圖片網址與 `gallery` 結構穩定，就能繼續使用現有卡片、內頁與燈箱。

接成非同步資料時，需要在首頁、列表、內頁加入載入中、失敗重試與找不到作品的處理；目前元件依同步資料初始化，**不能只把 import 換成 `fetch`**。若未來改為伺服器分頁，API 還需回傳總筆數、頁碼與穩定排序，並調整目前的瀏覽器端篩選、相鄰作品及返回頁邏輯。後端負責存放與發布圖片時，請提供可公開讀取的圖片網址，並維持前述 gallery 路徑規則或同步更新前端組址方式。

`media.json`、`panoramas.json`、`experience.json`、`navigation.json` 等目前仍是獨立的展示資料，不屬於作品 API。需要後台管理時可分別規劃，不必為了接作品資料一併改動互動實驗室。

## 交接驗收

建置後至少檢查 `/`、`/work.html`、`/project.html?id=mim`、`/lab.html`、`/icons.html`、`/404.html`；在 404 頁搜尋作品並確認跳到帶 `q` 的列表，部署後再檢查不存在的網址回傳 HTTP 404。另需檢查作品列表切換分類與頁碼、從卡片進內頁再返回、開啟 MIM 圖片燈箱、從互動實驗室內頁進 `/lab.html`，以及由雙語商業資源入口網內頁點「查看上線網站」。若外站已變更，更新 `externalUrl`，不要讓列表卡片直接跳出本站。

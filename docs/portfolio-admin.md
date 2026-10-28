# 作品管理後台：打包與安裝

保留原本 `dist` 前台結構，登入、圖文編輯、圖片處理及發布由 PHP 管理。主機目前已確認 PHP 8.4 與所需圖片功能；程式依主機實際容量與記憶體處理圖片，無須先調高到 20MB／512MB。

## 一次打包

在專案資料夾執行：

```sh
npm ci
npm run package:admin
```

只需要原本開發網站使用的 Node.js，不需要在本機安裝 PHP 或 Docker，也不需要主機 SSH。安裝包會產生在 Git 忽略的 `portfolio-release.local/`，每次建立新資料夾與 ZIP，拒絕覆蓋同名既有內容。

解壓縮後：

```text
dist/                     原本的公開網站，新增 admin.html 與 api/
portfolio-private/        只放一次的私有管理資料
安裝說明.txt               操作說明，留在本機
```

## 上傳與第一次登入

1. 把 **dist 裡面的內容** 上傳到原本網站公開根目錄，與以前上傳網站相同。
2. 把 **portfolio-private 整個資料夾** 放在公開根目錄的上一層；不要放進公開網站裡。
3. 用 HTTPS 開啟 `/admin.html`，輸入安裝包 `portfolio-private/首次安裝碼.txt` 裡的安裝碼，自行設定管理員帳號與密碼。

帳號設定只做一次。完成後安裝碼失效，伺服器上的安裝碼文字檔會移除；之後直接用自己設定的帳密登入。帳號需 3–80 個英數、底線、點或連字號；密碼至少 12 字元且最多 72 bytes。

安裝程式會建立登入與圖片需要的子資料夾。新增公開作品圖放在 `images/projects/uploads/`，既有的 `images/photos`、`images/panoramas`、`images/projects` 素材仍保留。若主機限制 PHP 建立資料夾，頁面會回報實際問題，再依主機帳號權限處理，不需預先逐一手建目錄。

FTP 若無法進入公開目錄上一層，需請主機商提供 PHP 可讀寫、網址無法直接存取的私有目錄。不能把草稿移到公開區來略過這個限制。自訂位置可由伺服器環境變數 PORTFOLIO_SERVER_DIR／PORTFOLIO_PRIVATE_DIR／PORTFOLIO_PUBLIC_DIR 指定；它們不是前端 VITE 變數。

**這是首次安裝包。** 已使用的後台更新時，保留 `portfolio-private/admin.json`、`state.json`、assets、sessions、設定檔及公開 `images/projects/uploads/`；不能以新的初始資料覆蓋。Git 只保存程式，後台日常編輯不會自動提交 Git。安裝包含有一次性安裝碼，留在本機，不整包放入公開網站。

## 日常使用

**登入 → 編輯圖文 → 儲存草稿 → 預覽 → 確認發布。**

- 表單支援作品名稱、分類、類型文字、介紹、負責項目、展示網址、GitHub 倉庫／技術標籤、首頁精選與排序、封面、內頁主圖、多張作品圖及作品思路。
- 圖片可拖曳排序或用上下移動按鈕；每張可填標題、替代文字與寬版設定。首頁最多三件精選。
- 草稿可不填完整，發布前檢查必填。預覽共用正式作品頁與 Lightbox，只有管理員登入才能讀取草稿與私人圖片。顯示「預覽已就緒」後再確認發布。
- 每次重新儲存會讓舊預覽失效；已公開作品修改時，訪客繼續看到舊版，直到再次發布。
- GitHub 新倉庫先進待整理，補好資料、預覽後才發布；已發布作品仍可讀取語言、更新時間及 Stars／Forks。
- 下架後保留私人草稿；已公開圖片的原網址仍保留，不能把下架視為撤回已公開的檔案。
- 最近 20 次公開清單變更可還原。還原替換整份公開清單，保留私人草稿；被移出公開清單且沒有草稿的作品也會轉存草稿。
- 跨分頁修改會檢查版本，避免舊內容覆蓋新資料；API 失敗不回退舊 JSON。已開啟的訪客頁面重新讀取後才看到新發布內容。

## 圖片與主機限制

後台由 PHP 讀取 upload_max_filesize、post_max_size 與 memory_limit，顯示實際上傳與像素預算。使用主機目前的 2MB／128MB 也可操作：較大或像素較多的圖片，會先在瀏覽器依可用資源縮小，再交給 PHP 驗證及重新編碼。

**先縮小時，主機保存的是縮小後上傳版本；完整原檔仍在你的電腦。** 已符合主機限制的檔案則保留原上傳檔。兩者都存於私有區，不會直接公開。後台顯示實際上傳檔、封面與大圖 KB。

- 格式：JPEG、PNG、WebP；瀏覽器接受的原檔最多 50MB。
- 照片：封面長邊最多 1200px，大圖長邊最多 2400px，不放大小圖。
- 設計長圖：保留比例與完整內容，不裁切高度；展示寬度最多 1800px，另依記憶體縮小整張圖。
- 主機驗證檔案實際內容、像素與大小；最終公開的是重新編碼的 WebP。校正 JPEG EXIF 方向，公開衍生圖不包含原 EXIF／GPS。
- 封面目標 250KB，大圖目標 700KB；優先保留品質，不保證每張相同 KB。重要文字長圖請在預覽中確認清晰度，必要時分段上傳。
- 原始上傳檔、草稿衍生圖位於私有區；發布才複製引用到的 WebP 至 `images/projects/uploads/{作品雜湊}/{圖片ID}-cover.webp` 與 `-display.webp`。
- 移除表單圖片只移除引用，檔案不自動刪除，以保留歷史還原。本版尚無自動垃圾清理；備份需同時保存私有資料、既有 images 及已公開 uploads。

## 開發與驗證

靜態前台仍可 `npm run dev`／`npm run build`。管理版用 `npm run dev:managed`／`npm run build:managed`；`package:admin` 已自動建置管理版。

開發 PHP API 需要 PHP 8.2+、GD（JPEG／PNG／WebP）、Exif、Fileinfo、Session。先執行 `node scripts/export-portfolio-seed.mjs`，再 `php portfolio-server/cli.php init`，以 `npm run dev:php` 與另一個終端的 `npm run dev:managed` 開發。這些 PHP／Docker 工具只供開發與測試，網站管理者使用首次安裝包不需要它們。

後端帳密放在私有 admin.json，以密碼雜湊保存；設定檔不包密碼。CLI 重設密碼使用 `php portfolio-server/cli.php password`。沒有 SSH 時先保留私有資料備份，不能重新安裝覆蓋內容來重設帳號。

所有寫入需登入、POST、同站 Origin 與 CSRF Token。首次建立帳號還需要單次安裝碼，並以鎖檔保證只建立一次。Cookie 為 HttpOnly、SameSite=Strict，HTTPS 使用 Secure；閒置 30 分鐘或登入滿 8 小時需重新登入。同一 IP 15 分鐘五次失敗後暫停嘗試。JSON 以鎖檔、暫存檔及原子更名寫入。

```sh
npm test
npm run check:pages
npm run build
npm run test:admin
```

test:admin 使用 Docker、PHP／GD 與 Chromium（可用 PLAYWRIGHT_CHROMIUM_EXECUTABLE 指定）。每次建立獨立安裝包、**真正解壓 ZIP 後**以 2MB／8MB／128MB 啟動站點，驗證網頁首次設定、登入、圖片處理、預覽發布、還原與未登入隔離，結束後清除測試服務及資料。正式 PHP 主機不需要 Docker。

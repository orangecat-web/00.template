# v1.1 驗證紀錄

- GitHub 外掛實際取得 17 個公開倉庫的 REST 資料，已保存為 github-snapshot.json；非模擬快照。
- 6 個倉庫對應既有作品、11 個新建，前端開發 17 筆、全部作品 93 件。
- npm test：7 組通過，新增全量合併、未來新倉庫、去重與補圖。
- npm run check:pages：通過。SSR 頁面含 17 筆、15+2 分頁、文字封面、新作品內頁、返回分類。
- npm run build：通過；六個 HTML 入口完整輸出。
- JSONC 副本隨全部資料更新。
- 尚未完成 Chrome 的實際視覺檢查；本環境組織清單 URL 的直接連線受限，未完成瀏覽器端實網 GET。真實快照透過 GitHub 外掛逐倉庫取得，網站端仍會呼叫組織 API。
- 沒有提交或推送 GitHub；交付包含原始碼及 dist，不含 .git 或 node_modules。

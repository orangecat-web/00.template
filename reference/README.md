# 舊版 Sass partial 備查

`legacy-sass/` 是從舊版 `oc-template/sass/` **原檔複製**的 13 支 `_*.sass`，沒有在 `src/main.js` 載入，也沒有被 `main.sass` 匯入。這是待移植的原料，不是目前網站的編譯來源。

| 檔案 | 用途與下一步 |
| --- | --- |
| `_function.sass`、`_grid.sass`、`_spacing.sass` | 框架寬度、欄位、間距等有重用價值；整理除法、全域變數與 `@use` 命名空間後可逐支啟用 |
| `_mixin.sass` | 原檔保留；同名新版模組已放在 `src/assets/sass/_mixin.sass`，沿用 mixin 名稱並修正舊版全域相依，部分規則為適應新版 DOM 而改寫 |
| `_effects.sass` | 濾鏡與轉場原始版本；圖片濾鏡與 15 種疊色模式已搬到 `src/assets/sass/_effects.sass`，動畫轉場仍可依需求逐項移植 |
| `_color.sass` | 舊色票與表單 map；需要依新版視覺重新定義，不直接照搬全白預設值 |
| `_reset.sass` | 重置規則；可與目前 `main.sass` 的基礎設定比對後合併，避免重複覆蓋 |
| `_basic.sass`、`_layout.sass` | 舊版彙整與示範頁版型；有 `@import` 和舊式 off-canvas 樣式，需要拆成真正使用的區塊 |
| `_icons.sass`、`_include.sass` | Material Icons 與遠端字體設定；確定要用哪套圖示／字體後再接入 |
| `_extools.sass`、`_navs.sass` | 程式碼示範與舊導覽樣式；可參考，但目前 Vue 選單已有自己的樣式 |

現在運作中的關係是：`main.js` → `main.sass` → `@use './effects' as fx` 和 `@use './mixin' as oc` → 在需要的位置 `@include`。檔名前面的 `_` 仍然是 Sass partial 的正常命名方式；**它不代表不能在 Vue 裡使用**，其餘舊檔還可依需求逐支整理。

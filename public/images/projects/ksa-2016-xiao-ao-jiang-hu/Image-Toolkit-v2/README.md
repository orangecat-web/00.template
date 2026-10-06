# Image Toolkit v2｜Windows × Mac 雙擊版

## 這一版怎麼用？

把以下三個檔案一起放進「圖片／PNG 影格資料夾」：

```text
圖片資料夾/
├── 001.png
├── 002.png
├── 003.png
├── image-toolkit.sh
├── Image Toolkit - Windows.bat
└── Image Toolkit - Mac.command
```

### Windows 11

雙擊：

```text
Image Toolkit - Windows.bat
```

它會自動尋找 Git Bash，並在目前圖片資料夾執行工具。

### macOS

雙擊：

```text
Image Toolkit - Mac.command
```

第一次使用時，macOS 可能要求確認或執行權限。

若顯示無法執行，請在該資料夾開啟 Terminal，執行一次：

```bash
chmod +x "Image Toolkit - Mac.command" image-toolkit.sh
```

接著再雙擊 `.command`。

若 macOS 顯示安全性警告，可在 Finder 對 `.command` 按右鍵 →「打開」，完成第一次允許。

## 轉檔結果

工具會自動建立：

```text
output/
```

動畫輸出會使用目前資料夾名稱，例如：

```text
cat-animation/output/cat-animation.webp
```

## 選單功能

1. 單張 PNG/JPG 批次轉 WebP（品質 82）
2. PNG 影格轉無失真動畫 WebP（100 ms）
3. PNG 影格轉壓縮動畫 WebP（品質 82 / 100 ms）
4. 自訂動畫速度與品質
5. 查看工具版本
0. 離開

## 系統需求

### Windows

- Git for Windows / Git Bash
- `cwebp`
- `img2webp`

### macOS

- Terminal
- `cwebp`
- `img2webp`

確認方式：

```bash
cwebp -version
img2webp -version
```

`img2webp -version` 最後出現：

```text
[no output file specified] [0 frames, 0 bytes].
```

是正常訊息，不是錯誤。

## Photoshop 影格命名

推薦：

```text
001.png
002.png
003.png
...
010.png
```

不要使用：

```text
1.png
2.png
10.png
```

因為檔名字串排序可能讓第 10 張跑到第 2 張前面，動畫突然開始演時間旅行。

## 常用速度

| 每格時間 | 約略 FPS |
|---:|---:|
| 200 ms | 5 FPS |
| 100 ms | 10 FPS |
| 67 ms | 15 FPS |
| 50 ms | 20 FPS |
| 42 ms | 24 FPS |
| 33 ms | 30 FPS |

## 路徑相容性

v2 啟動器已針對以下情況處理：

- 資料夾名稱含空白
- 中文資料夾名稱
- Windows 不同磁碟機
- Windows 區網／NAS 路徑（由 `pushd` 暫時映射）

實際的 WebP 工具仍需能讀取該路徑。若非常老舊的程式對中文路徑有意見，可先以純英文測試。

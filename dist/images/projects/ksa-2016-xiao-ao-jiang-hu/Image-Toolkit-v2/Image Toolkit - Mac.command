#!/bin/bash
set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" >/dev/null 2>&1 && pwd)"

if [[ -z "$SCRIPT_DIR" ]] || ! cd "$SCRIPT_DIR"; then
  printf '\n[錯誤] 無法進入 Image Toolkit 所在資料夾。\n'
  printf '\n按 Enter 關閉視窗...'
  read -r
  exit 1
fi

if [[ ! -f "./image-toolkit.sh" ]]; then
  printf '\n[錯誤] 找不到 image-toolkit.sh\n'
  printf '請確認三個 Toolkit 檔案放在同一個圖片資料夾。\n'
  printf '\n按 Enter 關閉視窗...'
  read -r
  exit 1
fi

/bin/bash "./image-toolkit.sh"
status=$?

printf '\n'
if [[ $status -ne 0 ]]; then
  printf 'Image Toolkit 結束，錯誤碼：%s\n' "$status"
else
  printf 'Image Toolkit 已關閉。\n'
fi

printf '\n按 Enter 關閉視窗...'
read -r
exit "$status"

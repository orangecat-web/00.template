#!/usr/bin/env bash
set -Eeuo pipefail
shopt -s nullglob

TOOLKIT_VERSION="2.0.0"
SOURCE_DIR="$PWD"
OUTPUT_DIR="$SOURCE_DIR/output"
FOLDER_NAME="$(basename "$SOURCE_DIR")"

die() {
  printf '\n❌ %s\n\n' "$1" >&2
  exit 1
}

pause_menu() {
  printf '\n按 Enter 返回選單...'
  read -r
}

check_command() {
  command -v "$1" >/dev/null 2>&1 || die "找不到 $1，請先安裝 WebP 工具。"
}

prepare() {
  check_command cwebp
  check_command img2webp
  mkdir -p "$OUTPUT_DIR"
}

show_header() {
  clear 2>/dev/null || true
  printf '========================================\n'
  printf ' Image Toolkit v%s\n' "$TOOLKIT_VERSION"
  printf ' 目前資料夾：%s\n' "$SOURCE_DIR"
  printf ' 輸出資料夾：%s\n' "$OUTPUT_DIR"
  printf '========================================\n\n'
}

convert_stills() {
  local quality="${1:-82}"
  local method="${2:-6}"
  local files=( *.png *.jpg *.jpeg *.PNG *.JPG *.JPEG )

  ((${#files[@]} > 0)) || die "目前資料夾找不到 PNG、JPG 或 JPEG。"

  printf '\n開始轉換單張圖片，共 %d 個檔案。\n' "${#files[@]}"

  local src stem out
  for src in "${files[@]}"; do
    stem="${src%.*}"
    out="$OUTPUT_DIR/${stem}.webp"

    cwebp \
      -quiet \
      -q "$quality" \
      -m "$method" \
      "$src" \
      -o "$out"

    printf '✓ %s → output/%s.webp\n' "$src" "$stem"
  done

  printf '\n✅ 完成：%s\n' "$OUTPUT_DIR"
}

convert_animation_lossless() {
  local delay="${1:-100}"
  local method="${2:-6}"
  local files=( *.png *.PNG )

  ((${#files[@]} > 0)) || die "目前資料夾找不到 PNG 影格。"

  local out="$OUTPUT_DIR/${FOLDER_NAME}.webp"

  printf '\n開始製作無失真動畫 WebP。\n'
  printf '影格數：%d｜每格：%s ms｜循環：無限\n\n' "${#files[@]}" "$delay"

  img2webp \
    -loop 0 \
    -d "$delay" \
    -lossless \
    -m "$method" \
    "${files[@]}" \
    -o "$out"

  printf '\n✅ 完成：%s\n' "$out"
}

convert_animation_lossy() {
  local delay="${1:-100}"
  local quality="${2:-82}"
  local method="${3:-6}"
  local files=( *.png *.PNG )

  ((${#files[@]} > 0)) || die "目前資料夾找不到 PNG 影格。"

  local out="$OUTPUT_DIR/${FOLDER_NAME}-q${quality}.webp"

  printf '\n開始製作壓縮動畫 WebP。\n'
  printf '影格數：%d｜每格：%s ms｜品質：%s｜循環：無限\n\n' \
    "${#files[@]}" "$delay" "$quality"

  img2webp \
    -loop 0 \
    -d "$delay" \
    -lossy \
    -q "$quality" \
    -m "$method" \
    "${files[@]}" \
    -o "$out"

  printf '\n✅ 完成：%s\n' "$out"
}

custom_animation() {
  local mode delay quality

  printf '\n每格停留時間（毫秒，預設 100）：'
  read -r delay
  delay="${delay:-100}"

  printf '模式：[1] 無失真  [2] 壓縮（預設 2）：'
  read -r mode
  mode="${mode:-2}"

  case "$mode" in
    1)
      convert_animation_lossless "$delay" 6
      ;;
    2)
      printf '品質 0–100（預設 82）：'
      read -r quality
      quality="${quality:-82}"
      convert_animation_lossy "$delay" "$quality" 6
      ;;
    *)
      die "模式只能輸入 1 或 2。"
      ;;
  esac
}

show_versions() {
  printf '\n[cwebp]\n'
  cwebp -version
  printf '\n[img2webp]\n'
  img2webp -version || true
}

run_menu() {
  prepare

  while true; do
    show_header

    printf '1) 單張 PNG/JPG 批次轉 WebP（品質 82）\n'
    printf '2) PNG 影格 → 無失真動畫 WebP（100 ms）\n'
    printf '3) PNG 影格 → 壓縮動畫 WebP（品質 82 / 100 ms）\n'
    printf '4) 自訂動畫速度與品質\n'
    printf '5) 查看工具版本\n'
    printf '0) 離開\n\n'
    printf '請選擇：'

    read -r choice

    case "$choice" in
      1) convert_stills 82 6; pause_menu ;;
      2) convert_animation_lossless 100 6; pause_menu ;;
      3) convert_animation_lossy 100 82 6; pause_menu ;;
      4) custom_animation; pause_menu ;;
      5) show_versions; pause_menu ;;
      0) printf '\n喵，收工。\n'; exit 0 ;;
      *) printf '\n⚠️  請輸入 0–5。\n'; pause_menu ;;
    esac
  done
}

case "${1:-menu}" in
  menu)
    run_menu
    ;;
  still|stills)
    prepare
    convert_stills "${2:-82}" "${3:-6}"
    ;;
  animation|animation-lossless)
    prepare
    convert_animation_lossless "${2:-100}" "${3:-6}"
    ;;
  animation-lossy)
    prepare
    convert_animation_lossy "${2:-100}" "${3:-82}" "${4:-6}"
    ;;
  version|versions)
    prepare
    show_versions
    ;;
  help|-h|--help)
    cat <<'HELP'
Image Toolkit 使用方式

互動選單：
  bash image-toolkit.sh

單張圖片批次轉換：
  bash image-toolkit.sh still [品質] [壓縮方法]

PNG 影格轉無失真動畫：
  bash image-toolkit.sh animation [每格毫秒] [壓縮方法]

PNG 影格轉壓縮動畫：
  bash image-toolkit.sh animation-lossy [每格毫秒] [品質] [壓縮方法]

輸出位置：
  目前資料夾/output/
HELP
    ;;
  *)
    die "未知模式：$1。請執行 bash image-toolkit.sh help"
    ;;
esac

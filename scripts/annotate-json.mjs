// ═══ JSON 註解副本：正式 JSON 是來源，JSONC 供閱讀 ═══
// 不改 JSON 語法，避免瀏覽器、JSON.parse 或第三方系統無法讀取。
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const target = resolve(root, 'docs/json-comments')
mkdirSync(target, { recursive: true })
const descriptions = {
  id: '穩定識別碼；站內連結與資料對應使用，請勿任意修改。',
  title: '畫面顯示的標題。', label: '按鈕或導覽顯示文字。',
  featured: '是否納入首頁精選；目前取合併清單中前三筆。',
  category: '畫面顯示的作品類型文字；篩選分類由 projects.js 指定。',
  summary: '作品摘要與搜尋內容。', role: '實際負責項目。',
  externalUrl: '可操作展示或上線網站網址；站內路徑可使用 / 開頭。',
  externalLabel: '外連按鈕文字；省略時使用預設文案。',
  cover: '封面樣式名稱；有 image 時優先顯示圖片。',
  image: '主要圖片，作品封面使用 /images/... 絕對路徑。',
  imageAlt: '主要圖片的替代文字，供無障礙閱讀。',
  detailImage: '作品內頁主圖；省略時沿用 image。',
  detailImageAlt: '作品內頁主圖的替代文字。',
  gallery: '同系列的圖集，透過共用 MediaLightbox 放大。',
  src: '媒體來源；作品 gallery 使用與主圖同目錄的檔名。',
  alt: '媒體替代文字。', wide: '是否使用寬版展示。', type: '內容或媒體類型。',
  href: '點選後前往的網址。', projects: '倉庫與既有作品的對應清單；未對應的倉庫會自動建立作品。',
  projectId: '對應既有作品 id；不要新增重複作品資料。',
  repository: 'orangecat-web 組織底下的 GitHub 倉庫名稱。',
  tags: '人工確認的技術標籤，也可透過作品搜尋找到。',
  organization: '公開 GitHub 組織名稱；API 只取得這個組織的公開倉庫。',
  repositories: '本次真實擷取的全部公開倉庫，啟動可先顯示。',
  fetchedAt: '資料擷取時間（毫秒時間戳），不是程式的最後更新時間。',
  name: 'GitHub 倉庫名稱，未補中文標題時用此名稱顯示。',
  description: 'GitHub 原始倉庫描述，沒有描述时保留空字串。',
  language: 'GitHub 偵測的主要語言，不代表專案的全部技術。',
  pushedAt: 'GitHub 最後程式推送時間。',
  stars: 'GitHub 星號數量。',
  forks: 'GitHub 分支複製數量。',
  topics: 'GitHub 倉庫主題標籤。',
  overrides: '以倉庫原名為鍵，補中文介紹、圖片與負責項目。',
  cacheMinutes: 'GitHub 快取有效分鐘数；過期會嘗試更新，失敗時明確標示舊資料。',
}
// 只清理本產生器的舊副本；不碰人工建立的其他文件。
const filenames = readdirSync(resolve(root, 'src/data')).filter((name) => name.endsWith('.json'))
const expected = new Set(filenames.map((name) => name.replace(/\.json$/, '.jsonc')))
for (const name of readdirSync(target)) {
  if (name.endsWith('.jsonc') && !expected.has(name)
    && readFileSync(resolve(target, name), 'utf8').split('\n')[0].includes('閱讀用註解副本。')) unlinkSync(resolve(target, name))
}
for (const filename of filenames) {
  const source = JSON.parse(readFileSync(resolve(root, 'src/data', filename), 'utf8'))
  const lines = JSON.stringify(source, null, 2).split('\n')
  const annotated = lines.flatMap((line) => {
    const match = line.match(/^(\s*)"([^"]+)":/)
    return match && descriptions[match[2]] ? [`${match[1]}// ${descriptions[match[2]]}`, line] : [line]
  })
  writeFileSync(resolve(target, filename.replace(/\.json$/, '.jsonc')), `// ${filename}：閱讀用註解副本。請編輯 src/data/${filename} 後執行 npm run docs:json。\n${annotated.join('\n')}\n`)
}
console.log('JSONC 註解副本已更新。')

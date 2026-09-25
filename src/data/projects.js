import catPair from '../assets/photos/IMG_8157.JPG'
import dishLife from '../assets/projects/dish-life.jpg'

// 分類是資料設定；作品可同時屬於多個分類，新增類別無須改列表元件。
export const projectCategories = [
  { id: 'all', label: '全部作品' },
  { id: 'graphic', label: '平面設計' },
  { id: 'web', label: '網頁設計' },
  { id: 'product-photo', label: '商品攝影' },
]

// 專案總清單。destination 可讓卡片直連網站；省略時進共用內頁。
export const projects = [
  {
    id: 'orange-cat-vue',
    featured: true,
    categoryIds: ['web'],
    category: 'FRONT-END / VUE 3',
    title: 'Orange Cat · 互動樣版',
    summary: '從 oc-template 延伸的 Vue 3 實作：影像輪播、媒體檢視、動態導覽與 Sass 視覺效果。',
    role: '視覺設計、前端實作',
    externalUrl: '/lab.html#effects',
    externalLabel: '操作互動展示',
    cover: 'photo',
    image: catPair,
    imageAlt: '兩隻橘白貓咪坐在沙發上的攝影作品',
  },
  {
    id: 'bilingual-shop',
    featured: true,
    categoryIds: ['web'],
    category: 'WEBSITE / REAL PROJECT',
    title: '雙語商業資源入口網',
    summary: '涵蓋雙語檢索、內容列表、主題資源與相簿的網站作品。',
    role: '既有網站作品',
    destination: {
      type: 'url',
      href: 'https://serv.gcis.nat.gov.tw/bilingualshop/tw/homepage',
      label: '查看上線網站',
    },
    cover: 'bilingual',
  },
  {
    id: 'dish-life',
    featured: true,
    categoryIds: ['web'],
    category: 'WEB / VISUAL DESIGN',
    title: 'DISH-LIFE 網站設計',
    summary: '以商品影像、色彩與資訊層次構成的商業網站視覺作品。',
    role: '網頁視覺設計',
    externalUrl: 'https://orangecat-design.wixsite.com/cang/webdesign?pgid=lpkulvgb-688e7727-a90b-4450-9df3-a1440896ec6b',
    externalLabel: '查看原始作品',
    cover: 'dish',
    detailImage: dishLife,
    detailImageAlt: 'DISH-LIFE 網站設計長圖，呈現首頁商品、活動區塊與頁尾',
  },
]

export const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)

export function resolveProjectCategory(id) {
  return projectCategories.some((category) => category.id === id) ? id : 'all'
}

export function filterProjects(items, categoryId) {
  return categoryId === 'all' ? items : items.filter((project) => project.categoryIds?.includes(categoryId))
}

export function workListUrl({ category = 'all', page = 1 } = {}) {
  const params = new URLSearchParams()
  if (category !== 'all') params.set('category', category)
  if (page > 1) params.set('page', page)
  return `/work.html${params.size ? `?${params}` : ''}`
}

export function projectUrl(project, { category = 'all', page = 1 } = {}) {
  const params = new URLSearchParams({ id: project.id })
  if (category !== 'all') params.set('category', category)
  if (page > 1) params.set('from', page)
  return `/project.html?${params}`
}

export function projectDestination(project, context = {}) {
  if (project.destination?.type === 'url') {
    return {
      href: project.destination.href,
      label: project.destination.label || '查看網站',
      external: /^https?:\/\//.test(project.destination.href),
    }
  }
  return { href: projectUrl(project, context), label: '查看作品內容', external: false }
}

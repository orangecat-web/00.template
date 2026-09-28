import webProjects from './projects-web.json'
import graphicProjects from './projects-graphic.json'
import productPhotoProjects from './projects-product-photo.json'

// 新增作品只需放進對應分類的 JSON；「全部作品」由前端合併。
export const projectCategories = [
  { id: 'all', label: '全部作品' },
  { id: 'graphic', label: '平面設計' },
  { id: 'web', label: '網頁設計' },
  { id: 'product-photo', label: '商品攝影' },
]

const projectGroups = [
  ['web', webProjects],
  ['graphic', graphicProjects],
  ['product-photo', productPhotoProjects],
]

export const projects = projectGroups.flatMap(([categoryId, items]) =>
  items.map((project) => ({
    ...project,
    categoryIds: [categoryId],
    ...(project.externalUrl && !project.externalLabel ? { externalLabel: '查看上線網站' } : {}),
  })),
)

export const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)

export function resolveProjectCategory(id) {
  return projectCategories.some((category) => category.id === id) ? id : 'all'
}

export function filterProjects(items, categoryId) {
  return categoryId === 'all' ? items : items.filter((project) => project.categoryIds?.includes(categoryId))
}

export function searchProjects(items, query) {
  const keyword = query.trim().toLocaleLowerCase()
  if (!keyword) return items

  return items.filter((project) => [
    project.id,
    project.title,
    project.summary,
    project.role,
    project.category,
    ...(project.categoryIds || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
    .includes(keyword))
}

export function workListUrl({ category = 'all', page = 1, query = '' } = {}) {
  const params = new URLSearchParams()
  const keyword = query.trim()
  if (keyword) params.set('q', keyword)
  if (category !== 'all') params.set('category', category)
  if (page > 1) params.set('page', page)
  return `/work.html${params.size ? `?${params}` : ''}`
}

export function projectUrl(project, { category = 'all', page = 1, query = '' } = {}) {
  const params = new URLSearchParams({ id: project.id })
  const keyword = query.trim()
  if (keyword) params.set('q', keyword)
  if (category !== 'all') params.set('category', category)
  if (page > 1) params.set('from', page)
  return `/project.html?${params}`
}

export function projectDestination(project, context = {}) {
  return { href: projectUrl(project, context), label: '查看作品內容' }
}

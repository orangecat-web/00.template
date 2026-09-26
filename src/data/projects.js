import projectData from './projects.json'

// 資料放 JSON，分頁與導向判斷留在 JS。
export const projectCategories = projectData.projectCategories
export const projects = projectData.projects

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

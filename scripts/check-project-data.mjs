import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const errors = []
const projectFiles = [
  ['web', 'projects-web.json'],
  ['graphic', 'projects-graphic.json'],
  ['product-photo', 'projects-product-photo.json'],
]
const ids = new Set()

function checkImage(value, label) {
  if (typeof value !== 'string' || !value.startsWith('/images/')) {
    errors.push(`${label}: expected a /images/... path`)
    return
  }
  const relative = value.slice(1)
  let isFile = false
  try { isFile = statSync(resolve(root, 'public', relative)).isFile() } catch { /* missing */ }
  if (relative.split('/').includes('..') || !isFile) {
    errors.push(`${label}: missing or invalid file ${value}`)
  }
}

for (const [categoryId, filename] of projectFiles) {
  let projects
  try {
    projects = JSON.parse(readFileSync(resolve(root, 'src/data', filename), 'utf8'))
  } catch (error) {
    errors.push(`${filename}: ${error.message}`)
    continue
  }
  if (!Array.isArray(projects)) {
    errors.push(`${filename}: expected an array of projects`)
    continue
  }
  for (const project of projects) {
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      errors.push(`${filename}: each project must be an object`)
      continue
    }
    const label = project.id || '(missing id)'
    if (!project.id || ids.has(project.id)) errors.push(`missing or repeated project id: ${label}`)
    ids.add(project.id)
    for (const key of ['title', 'summary', 'role', 'category', 'cover']) {
      if (!project[key]) errors.push(`${label}: missing ${key}`)
    }
    if (typeof project.featured !== 'boolean') errors.push(`${label}: featured must be a boolean`)
    if (Object.hasOwn(project, 'categoryIds')) errors.push(`${label}: remove categoryIds; ${filename} already assigns ${categoryId}`)
    for (const field of ['image', 'detailImage']) {
      if (!project[field]) continue
      checkImage(project[field], `${label}.${field}`)
      if (!project[`${field}Alt`]) errors.push(`${label}: missing ${field}Alt`)
    }
    if (project.externalUrl) {
      if (!/^https?:\/\//.test(project.externalUrl) && !project.externalUrl.startsWith('/')) {
        errors.push(`${label}: externalUrl must be HTTP(S) or a site-root path`)
      }
    }
    if (!project.gallery) continue
    if (!Array.isArray(project.gallery)) {
      errors.push(`${label}: gallery must be an array`)
      continue
    }
    const base = project.image || project.detailImage
    if (project.gallery.length && !base) errors.push(`${label}: gallery needs image or detailImage`)
    for (const [index, item] of project.gallery.entries()) {
      const itemLabel = `${label}.gallery[${index}]`
      if (!item.title || !item.alt) errors.push(`${itemLabel}: missing title or alt`)
      if (typeof item.src !== 'string' || !item.src || ['.', '..'].includes(item.src) || basename(item.src) !== item.src) {
        errors.push(`${itemLabel}: src must be a filename beside the main image`)
      } else if (base) {
        checkImage(`${dirname(base)}/${item.src}`, itemLabel)
      }
    }
  }
}

// ═══ 前端開發對應設定：禁止不存在的 id 或重複對應 ═══
try {
  const config = JSON.parse(readFileSync(resolve(root, 'src/data/github.json'), 'utf8'))
  if (!/^[a-zA-Z0-9-]+$/.test(config.organization)) errors.push('GitHub organization 格式不正確')
  if (!Number.isFinite(config.cacheMinutes) || config.cacheMinutes < 1) errors.push('GitHub cacheMinutes 必須至少 1 分鐘')
  const selected = new Set()
  for (const item of config.projects) {
    if (!ids.has(item.projectId)) errors.push(`GitHub 對應作品不存在：${item.projectId}`)
    if (selected.has(item.projectId)) errors.push(`GitHub 重複對應作品：${item.projectId}`)
    selected.add(item.projectId)
    if (!/^[a-zA-Z0-9_.-]+$/.test(item.repository)) errors.push(`GitHub repository 格式不正確：${item.repository}`)
    if (!Array.isArray(item.tags) || !item.tags.every((tag) => typeof tag === 'string')) errors.push(`GitHub tags 格式不正確：${item.projectId}`)
  }
} catch (error) { errors.push(`github.json: ${error.message}`) }

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Project data OK: ${ids.size} projects, ${projectFiles.length} source categories (+ all).`)
}

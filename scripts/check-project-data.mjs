import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const data = JSON.parse(readFileSync(resolve(root, 'src/data/projects.json'), 'utf8'))
const errors = []
const categories = new Set()
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

for (const category of data.projectCategories || []) {
  if (!category.id || !category.label || categories.has(category.id)) {
    errors.push(`invalid or repeated category: ${category.id || '(missing id)'}`)
  }
  categories.add(category.id)
}
if (!categories.has('all')) errors.push('missing all category')

for (const project of data.projects || []) {
  const label = project.id || '(missing id)'
  if (!project.id || ids.has(project.id)) errors.push(`missing or repeated project id: ${label}`)
  ids.add(project.id)
  for (const key of ['title', 'summary', 'role', 'category', 'cover']) {
    if (!project[key]) errors.push(`${label}: missing ${key}`)
  }
  if (typeof project.featured !== 'boolean') errors.push(`${label}: featured must be a boolean`)
  if (!Array.isArray(project.categoryIds) || !project.categoryIds.length ||
      project.categoryIds.some((id) => id === 'all' || !categories.has(id))) {
    errors.push(`${label}: categoryIds must refer to defined categories other than all`)
  }
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

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Project data OK: ${ids.size} projects, ${categories.size} categories.`)
}

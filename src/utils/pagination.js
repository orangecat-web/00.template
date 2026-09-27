export const PROJECTS_PER_PAGE = 15

export function totalPages(total, pageSize = PROJECTS_PER_PAGE) {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function clampPage(value, total, pageSize = PROJECTS_PER_PAGE) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0
    ? Math.min(page, totalPages(total, pageSize))
    : 1
}

export function pageSlice(items, page, pageSize = PROJECTS_PER_PAGE) {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function pageNumbers(page, count) {
  const numbers = [...new Set([1, page - 1, page, page + 1, count])]
    .filter((number) => number >= 1 && number <= count)
    .sort((a, b) => a - b)

  return numbers.flatMap((number, index) => {
    const gap = index ? number - numbers[index - 1] : 1
    if (gap === 2) return [number - 1, number]
    if (gap > 2) return ['…', number]
    return [number]
  })
}

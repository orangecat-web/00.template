// ═══ GitHub 倉庫與作品合併：同倉庫只建立一件作品 ═══
// 本地作品保留視覺與介紹；未對應的倉庫用文字封面，後續可用 overrides 補圖。
export function mergeGithubProjects(base, repositories, config) {
  const mappings = new Map(config.projects.map((item) => [item.repository.toLowerCase(), item]))
  const records = new Map(repositories.map((repo) => [repo.name.toLowerCase(), repo]))
  const result = base.map((project) => {
    const mapping = config.projects.find((item) => item.projectId === project.id)
    if (!mapping) return { ...project, categoryIds: [...project.categoryIds] }
    const repo = records.get(mapping.repository.toLowerCase())
    return { ...project, categoryIds: [...new Set([...project.categoryIds, 'frontend'])],
      githubRepository: mapping.repository,
      githubUrl: `https://github.com/${config.organization}/${encodeURIComponent(mapping.repository)}`,
      techTags: mapping.tags || (repo?.language ? [repo.language] : []),
    }
  })
  // 固定以名稱排序，避免 API 最新推送順序造成列表與返回頁跳位。
  for (const repo of [...records.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const mapping = mappings.get(repo.name.toLowerCase())
    if (mapping && base.some((item) => item.id === mapping.projectId)) continue
    const extra = config.overrides?.[repo.name] || {}
    result.push({
      id: `github-${repo.name.toLowerCase()}`, title: extra.title || repo.name,
      summary: extra.summary || repo.description || 'GitHub 公開專案，詳細介紹與圖片整理中。',
      role: extra.role || '公開原始碼；負責內容待補',
      category: 'FRONT-END / GITHUB', categoryIds: ['frontend'], featured: false,
      cover: 'github', ...(extra.image ? { image: extra.image, imageAlt: extra.imageAlt || extra.title || repo.name } : {}),
      githubRepository: repo.name, githubUrl: `https://github.com/${config.organization}/${encodeURIComponent(repo.name)}`,
      techTags: extra.tags || (repo.language ? [repo.language] : []),
      ...(extra.externalUrl ? { externalUrl: extra.externalUrl, externalLabel: '查看 Demo' } : {}),
    })
  }
  return result
}

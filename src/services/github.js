// ═══ GitHub REST API：驗證、分頁與錯誤處理 ═══
// 只讀公開組織倉庫，不在前端放入 Token；測試可注入 fetch。
export function normalizeRepositories(data, organization) {
  if (!Array.isArray(data)) throw new Error('GitHub 回傳的資料格式不正確。')
  return data.filter((repo) => repo && repo.owner?.login?.toLowerCase() === organization.toLowerCase()
    && repo.private === false && typeof repo.name === 'string').map((repo) => ({
    name: repo.name,
    description: typeof repo.description === 'string' ? repo.description : '',
    url: `https://github.com/${encodeURIComponent(organization)}/${encodeURIComponent(repo.name)}`,
    homepage: typeof repo.homepage === 'string' ? repo.homepage : '',
    language: typeof repo.language === 'string' ? repo.language : '',
    pushedAt: typeof repo.pushed_at === 'string' ? repo.pushed_at : '',
    stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0,
    forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0,
    topics: Array.isArray(repo.topics) ? repo.topics.filter((x) => typeof x === 'string') : [],
  }))
}

export async function fetchRepositories(organization, fetcher = fetch) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  const repositories = []
  try {
    // 每頁最多 100 筆；用頁長判斷是否繼續，避免遺漏第二頁。
    for (let page = 1; page <= 100; page++) {
      const response = await fetcher(`https://api.github.com/orgs/${encodeURIComponent(organization)}/repos?type=public&sort=pushed&per_page=100&page=${page}`, {
        signal: controller.signal, headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) throw new Error('GitHub 暫時限制存取，請稍後再試。')
        throw new Error(`GitHub 資料讀取失敗（${response.status}）。`)
      }
      const data = await response.json()
      repositories.push(...normalizeRepositories(data, organization))
      if (data.length < 100) return repositories
    }
    throw new Error('GitHub 分頁超出預期，請稍後再試。')
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('GitHub 連線逾時，請稍後再試。')
    if (error instanceof TypeError) throw new Error('無法連線到 GitHub，請檢查網路後重試。')
    throw error
  } finally { clearTimeout(timer) }
}

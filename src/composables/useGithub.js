// ═══ 共用 GitHub 狀態：同一頁的卡片與內頁共用一次請求 ═══
import { computed, onMounted, ref } from 'vue'
import config from '../data/github.json' with { type: 'json' }
import snapshot from '../data/github-snapshot.json' with { type: 'json' }
import { updateGithubProjects } from '../data/projects.js'
import { fetchRepositories } from '../services/github.js'

const repositories = ref(snapshot.repositories)
const loading = ref(false)
const error = ref('')
const source = ref('snapshot')
const fetchedAt = ref(snapshot.fetchedAt)
const key = `orange-cat-github-v2:${config.organization}`
let pending
let initialized = false

// ═══ 快取是可選功能；無痕模式或儲存空間不足也能正常讀 API ═══
function readCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (saved && Number.isFinite(saved.fetchedAt) && saved.fetchedAt > 0
      && saved.fetchedAt <= Date.now() && Array.isArray(saved.repositories)
      && saved.repositories.every((item) => item && typeof item.name === 'string'
        && typeof item.url === 'string' && item.url.startsWith(`https://github.com/${config.organization}/`)
        && typeof item.description === 'string' && typeof item.language === 'string'
        && typeof item.pushedAt === 'string' && Number.isFinite(item.stars)
        && Number.isFinite(item.forks) && Array.isArray(item.topics)
        && item.topics.every((topic) => typeof topic === 'string'))) return saved
  } catch { /* 快取不可用時直接讀取 API。 */ }
  return null
}

export async function loadGithub(force = false) {
  if (pending) return pending
  if (initialized && !force) return
  initialized = true
  const saved = readCache()
  if (saved) {
    repositories.value = saved.repositories
    updateGithubProjects(repositories.value)
    fetchedAt.value = saved.fetchedAt
    source.value = 'cache'
    if (!force && Date.now() - saved.fetchedAt < config.cacheMinutes * 60000) return
    source.value = 'stale'
  }
  loading.value = true
  error.value = ''
  pending = (async () => {
    try {
      repositories.value = await fetchRepositories(config.organization)
      updateGithubProjects(repositories.value)
      fetchedAt.value = Date.now()
      source.value = 'live'
      try { localStorage.setItem(key, JSON.stringify({ fetchedAt: fetchedAt.value, repositories: repositories.value })) } catch { /* 儲存失敗不影響已載入資料。 */ }
    } catch (failure) {
      error.value = failure.message || 'GitHub 資料暫時無法讀取。'
      source.value = saved || source.value === 'live' || source.value === 'cache' || source.value === 'stale' ? 'stale' : 'snapshot'
    } finally { loading.value = false; pending = undefined }
  })()
  return pending
}

export function useGithub() {
  onMounted(() => loadGithub())
  const byName = computed(() => new Map(repositories.value.map((repo) => [repo.name.toLowerCase(), repo])))
  return { repositories, byName, loading, error, source, fetchedAt, reload: () => loadGithub(true) }
}

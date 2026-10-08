// ═══ GitHub API 行為測試：公開資料、錯誤與第二頁 ═══
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mergeGithubProjects, websiteUrl } from '../src/utils/githubProjects.js'
import { fetchRepositories, normalizeRepositories } from '../src/services/github.js'
const repo = (name) => ({ name, owner: { login: 'orangecat-web' }, private: false, description: null, language: 'JavaScript', pushed_at: '2026-10-01T00:00:00Z' })
const response = (data) => ({ ok: true, json: async () => data })

test('只接受指定組織公開資料，網址不採用外部回傳值', () => {
  const result = normalizeRepositories([repo('00.template'), { ...repo('secret'), private: true }, { ...repo('foreign'), owner: { login: 'elsewhere' } }], 'orangecat-web')
  assert.equal(result.length, 1)
  assert.equal(result[0].url, 'https://github.com/orangecat-web/00.template')
  assert.equal(result[0].description, '')
  assert.equal(result[0].language, 'JavaScript')
})
test('倉庫超過 100 筆時繼續第二頁', async () => {
  const urls = []
  const result = await fetchRepositories('orangecat-web', async (url) => {
    urls.push(url)
    return response(urls.length === 1 ? Array.from({ length: 100 }, (_, i) => repo(`repo-${i}`)) : [repo('last')])
  })
  assert.equal(result.length, 101)
  assert.match(urls[1], /page=2$/)
})
test('空資料是成功回應', async () => assert.deepEqual(await fetchRepositories('orangecat-web', async () => response([])), []))
test('限流、HTTP 錯誤、格式錯誤與斷網都明確回報', async () => {
  for (const status of [403, 429]) await assert.rejects(fetchRepositories('orangecat-web', async () => ({ ok: false, status })), /限制存取/)
  await assert.rejects(fetchRepositories('orangecat-web', async () => ({ ok: false, status: 500 })), /500/)
  await assert.rejects(fetchRepositories('orangecat-web', async () => response({ message: 'bad' })), /格式/)
  await assert.rejects(fetchRepositories('orangecat-web', async () => { throw new TypeError('network') }), /檢查網路/)
})
test('精選 Repo 對應既有作品、分類不重複、搜尋與返回網址正確', async () => {
  globalThis.window = { sessionStorage: { getItem: () => '123', setItem() {} } }
  const { projects, filterProjects, searchProjects, workListUrl, projectUrl } = await import('../src/data/projects.js')
  const config = JSON.parse(readFileSync(new URL('../src/data/github.json', import.meta.url)))
  const frontend = filterProjects(projects, 'frontend')
  const snapshot = JSON.parse(readFileSync(new URL('../src/data/github-snapshot.json', import.meta.url)))
  // 設定裡的作品即使倉庫不在快照中，仍屬前端分類（例如 cthouse）。
  const expectedCount = new Set([
    ...snapshot.repositories.map((item) => item.name.toLowerCase()),
    ...config.projects.map((item) => item.repository.toLowerCase()),
  ]).size
  assert.equal(frontend.length, expectedCount)
  assert.equal(new Set(projects.map((p) => p.id)).size, projects.length)
  for (const item of frontend) {
    if (!item.id.startsWith('github-')) assert.ok(item.categoryIds.includes('web'))
    assert.ok(item.githubUrl.startsWith('https://github.com/orangecat-web/'))
  }
  assert.equal(searchProjects(frontend, 'GitHub API')[0].id, 'orange-cat-vue')
  assert.equal(workListUrl({ category: 'frontend', page: 2 }), '/work.html?category=frontend&page=2')
  assert.match(projectUrl(frontend[0], { category: 'frontend' }), /category=frontend/)
})

test('共用狀態：快取、過期資料、重試、請求去重與儲存不可用', async () => {
  const { createSSRApp, h } = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const originalFetch = globalThis.fetch
  const originalStorage = globalThis.localStorage
  const key = 'orange-cat-github-v2:orangecat-web'
  let sequence = 0
  async function fixture(saved, fetcher, storageBroken = false) {
    const storage = new Map(saved ? [[key, saved]] : [])
    globalThis.localStorage = {
      getItem: (k) => { if (storageBroken) throw new Error('blocked'); return storage.get(k) || null },
      setItem: (k, v) => { if (storageBroken) throw new Error('blocked'); storage.set(k, v) },
    }
    globalThis.fetch = fetcher
    const api = await import(`../src/composables/useGithub.js?test=${sequence++}`)
    let state
    await renderToString(createSSRApp({ setup() { state = api.useGithub(); return () => h('div') } }))
    return { api, state, storage }
  }
  try {
    const cached = JSON.stringify({ fetchedAt: Date.now(), repositories: normalizeRepositories([repo('00.template')], 'orangecat-web') })
    let f = await fixture(cached, () => { throw new Error('不應呼叫') })
    await f.api.loadGithub()
    assert.equal(f.state.source.value, 'cache')
    const stale = JSON.parse(cached); stale.fetchedAt -= 3600000
    f = await fixture(JSON.stringify(stale), async () => ({ ok: false, status: 429 }))
    await f.api.loadGithub()
    assert.equal(f.state.source.value, 'stale')
    assert.match(f.state.error.value, /限制存取/)
    assert.equal(f.state.repositories.value.length, 1)
    globalThis.fetch = async () => response([])
    await f.api.loadGithub(true)
    assert.equal(f.state.source.value, 'live')
    assert.equal(f.state.error.value, '')
    assert.equal(f.state.repositories.value.length, 0)
    let calls = 0
    f = await fixture('{broken', async () => { calls++; return response([repo('00.template')]) }, true)
    await Promise.all([f.api.loadGithub(), f.api.loadGithub()])
    assert.equal(calls, 1)
    assert.equal(f.state.source.value, 'live')
    assert.equal(f.state.repositories.value.length, 1)
    f = await fixture(null, async () => { throw new TypeError('offline') })
    await f.api.loadGithub()
    assert.equal(f.state.source.value, 'snapshot')
    assert.equal(f.state.loading.value, false)
    assert.match(f.state.error.value, /檢查網路/)
  } finally { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage }
})

// ═══ 全量倉庫：合併既有作品、候補圖片與未來新增倉庫 ═══
test('快照與人工對應合併為前端作品，且不重複新增', () => {
  const config = JSON.parse(readFileSync(new URL('../src/data/github.json', import.meta.url)))
  const snapshot = JSON.parse(readFileSync(new URL('../src/data/github-snapshot.json', import.meta.url)))
  const web = JSON.parse(readFileSync(new URL('../src/data/projects-web.json', import.meta.url)))
  const base = web.map(item => ({ ...item, categoryIds: ['web'] }))
  const results = mergeGithubProjects(base, snapshot.repositories, config)
  const mapped = new Set(config.projects.map(item => item.repository.toLowerCase()))
  const expectedNew = snapshot.repositories.filter(item => !mapped.has(item.name.toLowerCase())).length
  const expectedFrontend = new Set([...snapshot.repositories.map(item => item.name.toLowerCase()), ...mapped]).size
  assert.equal(results.filter(item => item.categoryIds.includes('frontend')).length, expectedFrontend)
  assert.equal(results.filter(item => item.id.startsWith('github-')).length, expectedNew)
  assert.equal(results.length, base.length + expectedNew)
  assert.equal(new Set(results.map(item => item.id)).size, results.length)
  const matched = results.find(item => item.id === 'bilingual-shop')
  assert.equal(matched.githubRepository, 'EFShop')
  assert.equal(matched.image, base.find(item => item.id === matched.id).image)
  const generated = results.find(item => item.id === 'github-sunger')
  assert.equal(generated.summary, snapshot.repositories.find(item => item.name === 'sunger').description)
  assert.equal(generated.cover, 'github')
  assert.equal(generated.image, undefined)
  const extra = normalizeRepositories([repo('future-new')], 'orangecat-web')[0]
  const expanded = mergeGithubProjects(base, [...snapshot.repositories, extra, extra], config)
  assert.equal(expanded.length, results.length + 1)
  assert.equal(expanded.filter(item => item.id === 'github-future-new').length, 1)
  const supplemented = mergeGithubProjects(base, [extra], { ...config, overrides: { 'future-new': { title: '新作品', image: '/images/test.jpg', imageAlt: '展示', tags: ['Vue 3'] } } })
  assert.equal(supplemented.find(item => item.id === 'github-future-new').image, '/images/test.jpg')
})


test('列表線上作品只接受網站網址，支援站內 Demo 及未來 Repo homepage', () => {
  assert.equal(websiteUrl('javascript:alert(1)'), '')
  assert.equal(websiteUrl('https://github.com/orangecat-web/sunger'), '')
  assert.equal(websiteUrl('//example.com'), '')
  assert.equal(websiteUrl('/lab.html'), '/lab.html')
  assert.equal(websiteUrl('https://orangecat-web.github.io/demo'), 'https://orangecat-web.github.io/demo')
  const config = { organization: 'orangecat-web', projects: [], overrides: {} }
  const result = mergeGithubProjects([], [{ name: 'demo', homepage: 'https://example.com/demo', language: 'JavaScript' }], config)
  assert.equal(result[0].externalUrl, 'https://example.com/demo')
  const bad = mergeGithubProjects([], [{ name: 'bad', homepage: 'javascript:alert(1)' }], config)
  assert.equal(bad[0].externalUrl, undefined)
})

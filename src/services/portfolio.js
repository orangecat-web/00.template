// 公開頁與私人預覽共用載入入口；API 失敗時保留明確錯誤，不重新公開舊資料。
import { createApp, h, nextTick, ref } from 'vue'
import { managedPortfolio, portfolioPreview, portfolioPreviewReady, replacePublishedProjects } from '../data/projects.js'
export async function api(action, { body, csrf, method, form } = {}) {
  const response = await fetch(`/api/index.php?action=${action}`, {
    method: method || (body || form ? 'POST' : 'GET'), credentials:'same-origin', cache:'no-store',
    headers: { ...(body ? {'Content-Type':'application/json'} : {}), ...(csrf ? {'X-CSRF-Token':csrf} : {}) },
    body: form || (body ? JSON.stringify(body) : undefined),
  })
  let data
  try { data = await response.json() } catch { throw new Error('作品服務未正確回應，請確認 PHP 服務已啟動。') }
  if (!response.ok) { const error = new Error(data.message || '操作失敗'); error.status = response.status; throw error }
  return data
}
export function mountPortfolioApp(Component) {
  if (!managedPortfolio) return createApp(Component).mount('#app')
  return createApp({
    setup() {
      const ready=ref(false), error=ref('')
      async function load() {
        error.value=''; ready.value=false; portfolioPreviewReady.value=false
        try {
          const id=new URLSearchParams(location.search).get('id') || ''
          const data=await api(portfolioPreview ? `preview&id=${encodeURIComponent(id)}` : 'portfolio')
          if (!Array.isArray(data.projects)) throw new Error('作品資料格式不正確。')
          replacePublishedProjects(data.projects); ready.value=true
          await nextTick()
          if (portfolioPreview && data.preview.hasDraft) await api('review',{body:{id,version:data.preview.version},csrf:data.csrf})
          portfolioPreviewReady.value=portfolioPreview
        } catch(failure) { ready.value=false; error.value=failure.message }
      }
      load()
      return ()=>ready.value ? h(Component) : h('main',{class:'portfolio-state'},[
        h('h1', error.value ? '作品暫時無法載入' : '作品載入中'),
        error.value ? h('p',{role:'alert'},error.value) : h('p','請稍候。'),
        error.value && h('button',{onClick:load},'重新載入'),
        portfolioPreview && h('a',{href:'/admin.html'},'前往管理後台'),
      ])
    },
  }).mount('#app')
}

import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
globalThis.window = { location: { search: '?category=frontend' }, sessionStorage: {getItem:()=> '123',setItem(){} } }
globalThis.document = { title: '' }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
 const { default: Work } = await server.ssrLoadModule('/src/WorkApp.vue')
 let html = await renderToString(createSSRApp(Work))
 assert.equal((html.match(/class="project-card"/g)||[]).length, 15)
 assert.match(html, /17 件作品/)
 assert.doesNotMatch(html, /class="github-project"/)
 assert.match(html, /class="project-online"[^>]*href="https:\/\/demo.orangecat.com.tw\/night-hospital-map\/"/)
 assert.match(html, /進入夜間毛孩就醫/)
 assert.match(html, /查看作品內容/)
 assert.match(html, /<button class="work-category-tab"[^>]*>更新 GitHub 資料/)
 window.location.search='?category=web'
 const webHtml = await renderToString(createSSRApp(Work))
 assert.doesNotMatch(webHtml, /class="github-status"/)
 assert.match(html, /公開原始碼 \/ 圖片待補/)
 window.location.search='?category=frontend&page=2'
 html = await renderToString(createSSRApp(Work))
 assert.equal((html.match(/class="project-card"/g)||[]).length,2)
 window.location.search='?category=frontend&id=github-sunger&from=2'
 const { default: Project } = await server.ssrLoadModule('/src/ProjectApp.vue')
 html = await renderToString(createSSRApp(Project))
 assert.match(html, /sunger/)
 assert.doesNotMatch(html, /class="github-status"/)
 const copy = html.slice(html.indexOf('class="project-detail-copy"'), html.indexOf('<nav class="project-detail-neighbors"'))
 assert.match(copy, /class="github-tags"/)
 assert.match(copy, /class="github-meta"/)
 assert.match(copy, /查看 GitHub 原始碼/)
 assert.match(html, /https:\/\/github.com\/orangecat-web\/sunger/)
 assert.match(html, /category=frontend/)
 assert.match(html, /上格西服/)
 console.log('SSR 頁面檢查通過：17 筆、15+2 分頁、文字封面、倉庫內頁、返回分類。')
} finally { await server.close() }

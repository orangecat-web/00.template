<script setup>
// ═══ 404 導覽：以 GET 帶入既有作品搜尋參數 ═══
import SiteLayout from './components/SiteLayout.vue'
</script>

<template lang="pug">
SiteLayout(page-id="not-found")
  section.project-not-found(aria-labelledby="not-found-title")
    p.kicker 404 / PAGE NOT FOUND
    h1#not-found-title 找不到這個頁面<span class="period">．</span>
    p 可以回到首頁，或搜尋你想看的作品。
    form.work-search(role="search" action="/work.html" method="get")
      label.sr-only(for="not-found-search") 搜尋作品
      input#not-found-search(type="search" name="q" placeholder="搜尋作品" required)
      button(type="submit") 搜尋
    a.text-link(href="/") ← 回首頁
    a.text-link(href="/work.html") 查看作品 ↗
</template>

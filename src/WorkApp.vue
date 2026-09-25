<script setup>
import ProjectCard from './components/ProjectCard.vue'
import SiteLayout from './components/SiteLayout.vue'
import { projects } from './data/projects.js'
</script>

<template lang="pug">
SiteLayout(page-id="work" brand-caption="SELECTED WORK")
  section.work-page-intro(aria-labelledby="work-page-title")
    p.kicker SELECTED WORK / ARCHIVE
    h1#work-page-title 每一件作品，<br>都有自己的任務<span class="period">．</span>
    p 從前端互動、商業網站到視覺設計，這裡收錄目前公開的專案；後續作品會繼續加入同一份清單。
  section.work-page-list(aria-label="作品列表")
    .project-grid
      ProjectCard(v-for="(project, index) in projects" :key="project.id" :project="project" :index="index" :total="projects.length")
  a.text-link.work-page-back(href="/") ← 回首頁
</template>

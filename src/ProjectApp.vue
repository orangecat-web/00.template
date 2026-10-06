<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useGithub } from './composables/useGithub.js'
import GithubProject from './components/GithubProject.vue'
import SiteLayout from './components/SiteLayout.vue'
import MediaLightbox from './components/MediaLightbox.vue'
import { filterProjects, projectDestination, projects, resolveProjectCategory, searchProjects, workListUrl } from './data/projects.js'
import { clampPage } from './utils/pagination.js'

// ═══ 作品 id 與列表返回狀態 ═══
const params = new URLSearchParams(window.location.search)
const id = params.get('id')
// ═══ API 載入後自動解析新增倉庫的作品內頁 ═══
useGithub()
const selectedProject = computed(() => projects.find((item) => item.id === id))
const requestedCategory = resolveProjectCategory(params.get('category'))
const query = params.get('q') || ''
const category = computed(() => selectedProject.value && filterProjects([selectedProject.value], requestedCategory).length ? requestedCategory : 'all')
const siblings = computed(() => searchProjects(filterProjects(projects, category.value), query))
const context = computed(() => ({ category: category.value, page: clampPage(params.get('from'), siblings.value.length), query }))
const backUrl = computed(() => workListUrl(context.value))
const index = computed(() => siblings.value.findIndex((item) => item.id === id))
const project = selectedProject
const previous = computed(() => index.value > 0 ? siblings.value[index.value - 1] : null)
const next = computed(() => index.value >= 0 && index.value < siblings.value.length - 1 ? siblings.value[index.value + 1] : null)
const previousDestination = computed(() => previous.value && projectDestination(previous.value, context.value))
const nextDestination = computed(() => next.value && projectDestination(next.value, context.value))
// ═══ 同系列圖片映射到共用媒體檢視 ═══
const galleryLightbox = ref(null)
const galleryItems = computed(() => {
  const base = project.value?.image || project.value?.detailImage
  return (project.value?.gallery || []).map((item, galleryIndex) => ({
    ...item, id: `${project.value.id}-${galleryIndex}`, type: 'image',
    src: `${base.slice(0, base.lastIndexOf('/') + 1)}${item.src}`,
  }))
})

function openGallery(item, event) {
  galleryLightbox.value?.open(item.id, event.currentTarget.querySelector('img'))
}

watchEffect(() => {
  document.title = project.value ? `${project.value.title} — 陳泓蒼 Orange Cat` : '找不到作品 — 陳泓蒼 Orange Cat'
})
</script>

<template lang="pug">
SiteLayout(page-id="work")
  template(v-if="project")
    section.project-detail(aria-labelledby="project-title")
      .project-detail-top
        a.project-detail-back(:href="backUrl") ← 作品列表
        span {{ String(index + 1).padStart(2, '0') }} / {{ String(siblings.length).padStart(2, '0') }}
        a.project-detail-close(:href="backUrl" aria-label="關閉作品內容，返回作品列表") ×
      .project-detail-grid
        figure.project-detail-media
          img(v-if="project.detailImage || project.image" :src="project.detailImage || project.image" :alt="project.detailImageAlt || project.imageAlt")
          .project-detail-placeholder(v-else :class="`project-detail-placeholder--${project.cover}`" role="img" :aria-label="`${project.title} 的視覺展示`")
            span {{ project.category }}
            strong {{ project.title }}
            span ORANGE CAT / SELECTED WORK
        .project-detail-copy
          p.kicker PROJECT / {{ String(index + 1).padStart(2, '0') }}
          h1#project-title {{ project.title }}
          p.project-detail-summary {{ project.summary }}
          dl.project-detail-facts
            div
              dt 類型
              dd {{ project.category }}
            div
              dt 負責項目
              dd {{ project.role }}
          //- ═══ 介紹區內顯示技術標籤、GitHub 資訊與原始碼連結 ═══
          GithubProject(v-if="project.githubRepository" :project="project" detail)
          a.project-detail-external(v-if="project.externalUrl" :href="project.externalUrl" :target="project.externalUrl.startsWith('http') ? '_blank' : undefined" :rel="project.externalUrl.startsWith('http') ? 'noopener noreferrer' : undefined") {{ project.externalLabel }} ↗
      section.project-series(v-if="galleryItems.length" aria-labelledby="project-series-title")
        .project-series-heading
          div
            p.kicker PROJECT DETAILS / {{ String(galleryItems.length).padStart(2, '0') }} {{ galleryItems.length === 1 ? 'ITEM' : 'ITEMS' }}
            h2#project-series-title 作品內容<span class="period">．</span>
          p 點選作品可放大檢視。
        .project-series-grid
          button.project-series-item(v-for="item in galleryItems" :key="item.id" type="button" :class="{ 'is-wide': item.wide }" :aria-label="`放大查看${item.title}`" @click="openGallery(item, $event)")
            span.project-series-image
              img(:src="item.src" :alt="item.alt" loading="lazy")
            span.project-series-caption
              strong {{ item.title }}
              span(aria-hidden="true") ↗
        MediaLightbox(ref="galleryLightbox" :items="galleryItems" :aria-label="`${project.title}作品內容檢視`")
      nav.project-detail-neighbors(aria-label="其他作品")
        a(v-if="previous" :href="previousDestination.href") ← {{ previous.title }}
        span(v-else)
        a(v-if="next" :href="nextDestination.href") {{ next.title }} →
  section.project-not-found(v-else)
    p.kicker PROJECT / NOT FOUND
    h1 找不到這件作品<span class="period">．</span>
    p 這個作品編號可能已變更，請回作品列表重新選擇。
    a.text-link(:href="backUrl") ← 回作品列表
</template>

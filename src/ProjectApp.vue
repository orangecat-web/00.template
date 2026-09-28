<script setup>
import { computed, onMounted, ref } from 'vue'
import SiteLayout from './components/SiteLayout.vue'
import MediaLightbox from './components/MediaLightbox.vue'
import { filterProjects, projectDestination, projects, resolveProjectCategory, searchProjects, workListUrl } from './data/projects.js'
import { clampPage } from './utils/pagination.js'

const params = new URLSearchParams(window.location.search)
const id = params.get('id')
const selectedProject = projects.find((item) => item.id === id)
const requestedCategory = resolveProjectCategory(params.get('category'))
const query = params.get('q') || ''
const category = selectedProject && filterProjects([selectedProject], requestedCategory).length
  ? requestedCategory : 'all'
const siblings = searchProjects(filterProjects(projects, category), query)
const fromPage = clampPage(params.get('from'), siblings.length)
const context = { category, page: fromPage, query }
const backUrl = workListUrl(context)
const index = siblings.findIndex((item) => item.id === id)
const project = siblings[index]
const previous = index > 0 ? siblings[index - 1] : null
const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null
const previousDestination = previous && projectDestination(previous, context)
const nextDestination = next && projectDestination(next, context)
const galleryLightbox = ref(null)
const galleryBase = project?.image || project?.detailImage
const galleryItems = computed(() => (project?.gallery || []).map((item, galleryIndex) => ({
  ...item,
  id: `${project.id}-${galleryIndex}`,
  type: 'image',
  src: `${galleryBase.slice(0, galleryBase.lastIndexOf('/') + 1)}${item.src}`,
})))

function openGallery(item, event) {
  galleryLightbox.value?.open(item.id, event.currentTarget.querySelector('img'))
}

onMounted(() => {
  document.title = project ? `${project.title} — 陳泓蒼 Orange Cat` : '找不到作品 — 陳泓蒼 Orange Cat'
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

<script setup>
import { computed } from 'vue'
import { projectDestination } from '../data/projects.js'

const props = defineProps({
  project: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  page: { type: Number, default: 1 },
  selectedCategory: { type: String, default: 'all' },
})
const destination = computed(() => projectDestination(props.project, {
  category: props.selectedCategory,
  page: props.page,
}))
</script>

<template lang="pug">
article.project-card
  a.project-cover(:class="`project-cover--${project.cover}`" :href="destination.href" :aria-label="`${project.title}：${destination.label}`")
    img(v-if="project.image" :src="project.image" :alt="project.imageAlt" loading="lazy")
    .project-cover-design(v-else aria-hidden="true")
      template(v-if="project.cover === 'bilingual'")
        span.cover-small ENGLISH FRIENDLY / TAIWAN
        strong 雙語<br>商業資源
        span.cover-line
        span.cover-end 中 EN / 內容與檢索
      template(v-else)
        span.cover-small WEB DESIGN / SELECTED WORK
        strong DISH<br>life<span class="cover-dot">.</span>
        span.cover-end A visual story for everyday objects
    span.cover-arrow(aria-hidden="true") ↗
  .project-details
    .project-meta
      span {{ project.category }}
      span {{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}
    h3 {{ project.title }}
    p {{ project.summary }}
    .project-bottom
      span {{ project.role }}
      a(:href="destination.href") {{ destination.label }} ↗
</template>

<script setup>
import { computed, ref } from 'vue'
import GalleryCard from '../components/GalleryCard.vue'
import MediaLightbox from '../components/MediaLightbox.vue'
import { mediaCategoryNames, mediaItems } from '../data/media.js'

const categories = computed(() => [
  { id: 'all', label: '全部' },
  ...[...new Set(mediaItems.map((item) => item.category).filter(Boolean))]
    .map((id) => ({ id, label: mediaCategoryNames[id] || id })),
])
const activeCategory = ref('all')
const lightbox = ref(null)
const filteredItems = computed(() => activeCategory.value === 'all'
  ? mediaItems : mediaItems.filter((item) => item.category === activeCategory.value))

function openMedia(item, sourceElement) {
  lightbox.value?.open(item.id, sourceElement)
}
</script>

<template lang="pug">
.media-gallery-demo
  .category-controls(role="group" aria-label="媒體分類")
    button.category-button(v-for="category in categories" :key="category.id" type="button" :class="{ 'is-active': activeCategory === category.id }" :aria-pressed="activeCategory === category.id" @click="activeCategory = category.id") {{ category.label }}
  TransitionGroup.gallery-grid(name="gallery" tag="div")
    GalleryCard(v-for="(item, index) in filteredItems" :key="item.id" :item="item" :index="index" :total="filteredItems.length" @open="openMedia")
  p.gallery-note 原始照片取自舊版 oc-template；此處展示的是版型與效果，不將它們標作客戶專案。
  MediaLightbox(ref="lightbox" :items="filteredItems" aria-label="媒體作品檢視")
</template>

<script setup>
import { computed, ref } from 'vue'
import { getYouTubeId, youtubeThumbnail } from '../utils/youtube.js'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
})
defineEmits(['open'])

const typeLabels = {
  image: 'IMAGE', youtube: 'YOUTUBE', video: 'VIDEO',
  map: 'MAP', text: 'TEXT', custom: 'CONTENT',
}
const thumbnailQuality = ref('maxresdefault')
const videoId = computed(() => props.item.type === 'youtube' ? getYouTubeId(props.item.src) : '')
const cover = computed(() => props.item.poster || (props.item.type === 'image' ? props.item.src : thumbnailQuality.value === 'unavailable' ? '' : youtubeThumbnail(videoId.value, thumbnailQuality.value)))
const typeLabel = computed(() => typeLabels[props.item.type] || 'MEDIA')

function fallbackThumbnail(event) {
  if (props.item.type !== 'youtube' || props.item.poster) return
  if (thumbnailQuality.value === 'maxresdefault') thumbnailQuality.value = 'hqdefault'
  else thumbnailQuality.value = 'unavailable'
}

function checkThumbnail(event) {
  // An unavailable maxres image may return a tiny placeholder instead of an error.
  if (thumbnailQuality.value === 'maxresdefault' && event.target.naturalWidth < 300) fallbackThumbnail(event)
}
</script>

<template lang="pug">
article.gallery-card
  figure
    .gallery-image
      img(v-if="cover" :src="cover" :alt="item.type === 'image' ? item.alt : ''" loading="lazy" @load="checkThumbnail" @error="fallbackThumbnail")
      span.gallery-placeholder(v-else aria-hidden="true") {{ typeLabel }}
      span.image-overlay(aria-hidden="true") VIEW {{ typeLabel }} ↗
      button.card-open(type="button" :aria-label="`查看${item.title || typeLabel}`" @click="$emit('open', item, $event.currentTarget.closest('.gallery-image'))")
    figcaption
      .card-meta
        span {{ item.categoryLabel || typeLabel }}
        span {{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}
      .card-title
        h3 {{ item.title }}
        span(aria-hidden="true") ↗
      p {{ item.caption }}
</template>

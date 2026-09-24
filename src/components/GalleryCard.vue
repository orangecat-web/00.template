<script setup>
import { computed } from 'vue'

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
const cover = computed(() => props.item.poster || (props.item.type === 'image' ? props.item.src : ''))
const typeLabel = computed(() => typeLabels[props.item.type] || 'MEDIA')
</script>

<template lang="pug">
article.gallery-card
  figure
    .gallery-image
      img(v-if="cover" :src="cover" :alt="item.type === 'image' ? item.alt : ''" loading="lazy")
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

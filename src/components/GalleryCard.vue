<script setup>
defineProps({ photo: { type: Object, required: true } })
defineEmits(['open'])
</script>

<template lang="pug">
article.gallery-card
  figure
    .gallery-image
      img(:src="photo.src" :alt="photo.alt" loading="lazy")
      span.image-overlay(aria-hidden="true") VIEW IMAGE ↗
      button.card-open(type="button" :aria-label="`查看${photo.title}照片`" @click="$emit('open', photo, $event.currentTarget.closest('.gallery-image'))")
    figcaption
      .card-meta
        span {{ photo.categoryLabel }}
        span 0{{ photo.id }} / 05
      .card-title
        h3 {{ photo.title }}
        span(aria-hidden="true") ↗
      p {{ photo.description }}
</template>

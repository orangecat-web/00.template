<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  photos: { type: Array, required: true },
  interval: { type: Number, default: 6000 },
})

const root = ref(null)
const currentIndex = ref(0)
const isPaused = ref(false)
const reducedMotion = ref(false)
const isVisible = ref(true)
const isHovered = ref(false)
const isFocused = ref(false)
const currentPhoto = computed(() => props.photos[currentIndex.value] ?? null)
let timer = null
let observer = null
let motionPreference = null
let touchStartX = null

function stopTimer() {
  window.clearInterval(timer)
  timer = null
}

function syncTimer() {
  stopTimer()
  if (props.photos.length < 2 || isPaused.value || reducedMotion.value || !isVisible.value
    || isHovered.value || isFocused.value || document.hidden) return
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.photos.length
  }, props.interval)
}

function show(index) {
  if (!props.photos.length) return
  currentIndex.value = (index + props.photos.length) % props.photos.length
  syncTimer()
}

function togglePause() {
  isPaused.value = !isPaused.value
  syncTimer()
}

function onFocusOut(event) {
  if (root.value?.contains(event.relatedTarget)) return
  isFocused.value = false
  syncTimer()
}

function onTouchEnd(event) {
  if (touchStartX === null) return
  const distance = event.changedTouches[0].clientX - touchStartX
  touchStartX = null
  if (Math.abs(distance) > 50) show(currentIndex.value + (distance < 0 ? 1 : -1))
}

function onMotionChange(event) {
  reducedMotion.value = event.matches
  syncTimer()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionPreference.matches
  motionPreference.addEventListener('change', onMotionChange)
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      isVisible.value = entry.isIntersecting
      syncTimer()
    }, { threshold: 0.1 })
    observer.observe(root.value)
  }
  document.addEventListener('visibilitychange', syncTimer)
  syncTimer()
})

onBeforeUnmount(() => {
  stopTimer()
  observer?.disconnect()
  motionPreference?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', syncTimer)
})
</script>

<template lang="pug">
.hero-media(ref="root" role="region" aria-roledescription="輪播圖" aria-label="精選攝影作品" @mouseenter="isHovered = true; syncTimer()" @mouseleave="isHovered = false; syncTimer()" @focusin="isFocused = true; syncTimer()" @focusout="onFocusOut" @touchstart.passive="touchStartX = $event.touches[0].clientX" @touchend.passive="onTouchEnd")
  .hero-photo-frame
    Transition(name="hero-slide")
      img.hero-slide(v-if="currentPhoto" :key="currentPhoto.id" :src="currentPhoto.src" :alt="currentPhoto.alt")
    .hero-sticker(aria-hidden="true")
      span Original
      strong → Vue 3
  span.media-note SELECTED IMAGE / OC-TEMPLATE
  span.media-index {{ String(currentIndex + 1).padStart(3, '0') }} / {{ String(photos.length).padStart(3, '0') }}
  .hero-carousel-controls(v-if="photos.length > 1" role="group" aria-label="照片輪播控制")
    button.hero-carousel-button(type="button" aria-label="上一張照片" @click="show(currentIndex - 1)") ←
    button.hero-carousel-button(v-if="!reducedMotion" type="button" :aria-label="isPaused ? '播放輪播' : '暫停輪播'" :aria-pressed="isPaused" @click="togglePause") {{ isPaused ? '▶' : 'Ⅱ' }}
    button.hero-carousel-button(type="button" aria-label="下一張照片" @click="show(currentIndex + 1)") →
</template>

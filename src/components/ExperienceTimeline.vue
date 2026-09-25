<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({ items: { type: Array, required: true } })

const activeIndex = ref(0)
const direction = ref('forward')
const timelineNav = ref(null)
const activeItem = computed(() => props.items[activeIndex.value])
const transitionName = computed(() => `experience-${direction.value}`)

function select(index, focusMarker = false) {
  if (index < 0 || index >= props.items.length || index === activeIndex.value) return

  direction.value = index > activeIndex.value ? 'forward' : 'backward'
  activeIndex.value = index

  nextTick(() => {
    const marker = timelineNav.value?.querySelector(`[data-index="${index}"]`)
    if (!marker) return

    timelineNav.value.scrollTo({
      left: marker.offsetLeft - timelineNav.value.clientWidth / 2 + marker.clientWidth / 2,
      behavior: 'smooth',
    })
    if (focusMarker) marker.focus({ preventScroll: true })
  })
}

function onKeydown(event) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  select(activeIndex.value + (event.key === 'ArrowRight' ? 1 : -1), true)
}
</script>

<template lang="pug">
.experience-widget(@keydown="onKeydown")
  .experience-player
    button.experience-arrow.experience-arrow--prev(type="button" :disabled="activeIndex === 0" aria-label="上一段工作經歷" @click="select(activeIndex - 1)") ←
    .experience-viewport(aria-live="polite")
      Transition(:name="transitionName")
        article.experience-slide(:key="`${activeItem.period}-${activeItem.company}`")
          .experience-slide-date
            span.experience-slide-ordinal {{ String(activeIndex + 1).padStart(2, '0') }}
            span.experience-slide-period {{ activeItem.period }}
          .experience-slide-content
            p.experience-slide-label WORK EXPERIENCE / {{ String(activeIndex + 1).padStart(2, '0') }}
            h3 {{ activeItem.company }}
            p.experience-slide-role {{ activeItem.role }}
            p.experience-slide-description {{ activeItem.description }}
    button.experience-arrow.experience-arrow--next(type="button" :disabled="activeIndex === items.length - 1" aria-label="下一段工作經歷" @click="select(activeIndex + 1)") →
  .experience-timeline-meta
    span {{ String(activeIndex + 1).padStart(2, '0') }} / {{ String(items.length).padStart(2, '0') }}
    span 點選年份，或使用左右箭頭切換
  nav.experience-timeline(ref="timelineNav" aria-label="工作經歷時間軸")
    .experience-track
      button.experience-marker(v-for="(item, index) in items" :key="`${item.period}-${item.company}`" type="button" :data-index="index" :class="{ 'is-current': activeIndex === index }" :aria-current="activeIndex === index ? 'step' : undefined" @click="select(index)")
        span.experience-marker-period {{ item.period }}
        span.experience-marker-company {{ item.company }}
</template>

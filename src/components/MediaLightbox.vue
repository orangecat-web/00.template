<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { getYouTubeId } from '../utils/youtube.js'

const props = defineProps({
  items: { type: Array, required: true },
  ariaLabel: { type: String, default: '媒體檢視' },
  slideInterval: { type: Number, default: 4000 },
})

const dialog = ref(null)
const motion = ref(null)
const stage = ref(null)
const image = ref(null)
const currentIndex = ref(0)
const currentItem = computed(() => props.items[currentIndex.value] ?? null)
const isImage = computed(() => currentItem.value?.type === 'image')
const isClosing = ref(false)
const isPlaying = ref(false)
const showThumbnails = ref(false)
const isFullscreen = ref(false)
const isActive = ref(false)
const isReady = ref(false)
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
let sourceElement = null
let openedIndex = 0
let isOpening = false
let closeTimer
let slideTimer
let touchStartX = null
let drag = null
let didDrag = false
let openingAnimations = []

function youtubeEmbed(src) {
  const id = getYouTubeId(src)
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : ''
}

function mapEmbed(src) {
  try {
    const url = new URL(src)
    return url.protocol === 'https:'
      && ['www.google.com', 'google.com', 'maps.google.com'].includes(url.hostname)
      && (url.pathname.startsWith('/maps/embed') || (url.pathname === '/maps' && url.searchParams.has('output')))
      ? url.href : ''
  } catch {
    return ''
  }
}

const embedSrc = computed(() => {
  if (currentItem.value?.type === 'youtube') return youtubeEmbed(currentItem.value.src)
  if (currentItem.value?.type === 'map') return mapEmbed(currentItem.value.src)
  return ''
})

function positionFromSource() {
  if (!isImage.value || !sourceElement?.isConnected || !motion.value || !dialog.value) return
  const source = (sourceElement.querySelector?.('img') || sourceElement).getBoundingClientRect()
  const target = motion.value.getBoundingClientRect()
  if (!target.width || !target.height) return
  const x = source.left + source.width / 2 - target.left - target.width / 2
  const y = source.top + source.height / 2 - target.top - target.height / 2
  dialog.value.style.setProperty('--lightbox-from-x', `${x}px`)
  dialog.value.style.setProperty('--lightbox-from-y', `${y}px`)
  dialog.value.style.setProperty('--lightbox-from-scale-x', String(source.width / target.width))
  dialog.value.style.setProperty('--lightbox-from-scale-y', String(source.height / target.height))
}

async function open(id, source = null) {
  const index = props.items.findIndex((item) => item.id === id)
  if (index < 0 || dialog.value?.open || isOpening) return
  isOpening = true
  sourceElement = source
  openedIndex = index
  currentIndex.value = index
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
  isReady.value = false
  isActive.value = true
  await nextTick()
  dialog.value?.showModal()
  if (isImage.value && image.value && !image.value.complete) {
    await Promise.race([image.value.decode?.().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 700))])
  }
  await nextTick()
  positionFromSource()
  isReady.value = true
  await nextTick()
  if (!dialog.value?.open) { isOpening = false; return }
  {
    const styles = getComputedStyle(dialog.value)
    const x = styles.getPropertyValue('--lightbox-from-x').trim()
    const y = styles.getPropertyValue('--lightbox-from-y').trim()
    const sx = Math.min(.32, Number(styles.getPropertyValue('--lightbox-from-scale-x')) || .32)
    const sy = Math.min(.32, Number(styles.getPropertyValue('--lightbox-from-scale-y')) || .32)
    openingAnimations = [
      dialog.value.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 500, easing: 'ease-in-out', fill: 'both',
      }),
      motion.value?.animate([
        { transform: `translate(${x}, ${y}) scale(${sx}, ${sy})`, opacity: .65 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ], { duration: 1150, easing: 'cubic-bezier(.42, 0, .18, 1)', fill: 'both' }),
    ].filter(Boolean)
    Promise.all(openingAnimations.map((animation) => animation.finished.catch(() => {}))).then(() => {
      openingAnimations.forEach((animation) => animation.cancel())
      openingAnimations = []
    })
  }
  isOpening = false
}

function openAt(index, source = null) {
  if (index < 0 || index >= props.items.length) return
  return open(props.items[index].id, source)
}

function stopSlideshow() {
  window.clearInterval(slideTimer)
  isPlaying.value = false
}

function close() {
  if (!dialog.value?.open || isClosing.value) return
  openingAnimations.forEach((animation) => animation.cancel())
  openingAnimations = []
  stopSlideshow()
  if (document.fullscreenElement === dialog.value) document.exitFullscreen().catch(() => {})
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialog.value.close()
    return
  }
  resetView()
  positionFromSource()
  isClosing.value = true
  closeTimer = window.setTimeout(() => dialog.value?.close(), 380)
}

function onClosed() {
  window.clearTimeout(closeTimer)
  stopSlideshow()
  isClosing.value = false
  isReady.value = false
  showThumbnails.value = false
  resetView()
  sourceElement = null
  isActive.value = false
  isOpening = false
  dialog.value?.style.removeProperty('--lightbox-from-x')
  dialog.value?.style.removeProperty('--lightbox-from-y')
  dialog.value?.style.removeProperty('--lightbox-from-scale-x')
  dialog.value?.style.removeProperty('--lightbox-from-scale-y')
}

function select(index) {
  if (index < 0 || index >= props.items.length || index === currentIndex.value) return
  currentIndex.value = index
  resetView()
  if (index !== openedIndex) {
    sourceElement = null
    dialog.value?.style.removeProperty('--lightbox-from-x')
    dialog.value?.style.removeProperty('--lightbox-from-y')
    dialog.value?.style.removeProperty('--lightbox-from-scale-x')
    dialog.value?.style.removeProperty('--lightbox-from-scale-y')
  }
  if (currentItem.value?.type !== 'image') stopSlideshow()
}

function move(step) {
  if (props.items.length < 2) return
  select((currentIndex.value + step + props.items.length) % props.items.length)
}

function toggleSlideshow() {
  if (isPlaying.value) return stopSlideshow()
  if (props.items.length < 2 || !isImage.value) return
  isPlaying.value = true
  slideTimer = window.setInterval(() => move(1), Math.max(1500, props.slideInterval))
}

function resetView() {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
  isDragging.value = false
  drag = null
}

function clampPan(x, y, scale = zoom.value) {
  const width = image.value?.clientWidth || 0
  const height = image.value?.clientHeight || 0
  const frame = stage.value?.getBoundingClientRect()
  const maxX = Math.max(0, (width * scale - (frame?.width || 0)) / 2)
  const maxY = Math.max(0, (height * scale - (frame?.height || 0)) / 2)
  return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
}

function changeZoom(step) {
  if (!isImage.value) return
  zoom.value = Math.min(3, Math.max(1, +(zoom.value + step).toFixed(2)))
  pan.value = zoom.value === 1 ? { x: 0, y: 0 } : clampPan(pan.value.x, pan.value.y)
}

function onImagePointerDown(event) {
  if (zoom.value <= 1 || (event.pointerType === 'mouse' && event.button !== 0)) return
  event.preventDefault()
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, pan: pan.value }
  didDrag = false
  isDragging.value = true
  image.value?.setPointerCapture(event.pointerId)
}

function onImagePointerMove(event) {
  if (drag?.id !== event.pointerId) return
  if (Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 5) didDrag = true
  pan.value = clampPan(drag.pan.x + event.clientX - drag.x, drag.pan.y + event.clientY - drag.y)
}

function onImageClick() {
  if (didDrag) { didDrag = false; return }
  zoom.value = zoom.value > 1 ? 1 : 2
  pan.value = { x: 0, y: 0 }
}

function onImagePointerEnd(event) {
  if (drag?.id !== event.pointerId) return
  if (image.value?.hasPointerCapture(event.pointerId)) image.value.releasePointerCapture(event.pointerId)
  drag = null
  isDragging.value = false
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement === dialog.value) await document.exitFullscreen()
    else await dialog.value?.requestFullscreen?.()
  } catch { /* 瀏覽器不支援或拒絕全螢幕時保持原畫面。 */ }
}

function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === dialog.value
}

function onKeydown(event) {
  if (event.target.closest('input, textarea, video')) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    move(event.key === 'ArrowLeft' ? -1 : 1)
  }
}

function onTouchStart(event) {
  touchStartX = event.changedTouches[0]?.clientX ?? null
}

function onTouchEnd(event) {
  if (zoom.value > 1) { touchStartX = null; return }
  if (touchStartX === null) return
  const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX
  if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1)
  touchStartX = null
}

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer)
  stopSlideshow()
})
defineExpose({ open, openAt, close })
</script>

<template lang="pug">
dialog.media-lightbox(ref="dialog" :class="{ 'is-closing': isClosing, 'is-ready': isReady }" :aria-label="ariaLabel" @cancel.prevent="close" @close="onClosed" @keydown="onKeydown" @fullscreenchange="onFullscreenChange")
  .lightbox-shell(v-if="isActive && currentItem")
    .lightbox-toolbar
      span.lightbox-count(aria-live="polite") {{ currentIndex + 1 }} / {{ items.length }}
      .lightbox-actions
        button.lightbox-tool(v-if="items.length > 1" type="button" :aria-label="showThumbnails ? '隱藏縮圖' : '顯示縮圖'" :aria-pressed="showThumbnails" @click="showThumbnails = !showThumbnails") ▦
        button.lightbox-tool(v-if="isImage" type="button" aria-label="放大圖片" :disabled="zoom >= 3" @click="changeZoom(.25)") ⊕
        button.lightbox-tool(v-if="isImage" type="button" aria-label="縮小圖片" :disabled="zoom <= 1" @click="changeZoom(-.25)") ⊖
        button.lightbox-tool(v-if="items.length > 1 && isImage" type="button" :aria-label="isPlaying ? '暫停輪播' : '開始輪播'" :aria-pressed="isPlaying" @click="toggleSlideshow") {{ isPlaying ? 'Ⅱ' : '▶' }}
        button.lightbox-tool(type="button" :aria-label="isFullscreen ? '退出全螢幕' : '全螢幕'" @click="toggleFullscreen") ⛶
        button.lightbox-tool.lightbox-close(type="button" aria-label="關閉媒體檢視" @click="close") ×
    .lightbox-stage(ref="stage" @click.self="close" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd")
      .lightbox-motion(ref="motion")
        Transition(name="lightbox-switch")
          .lightbox-media(:key="currentItem.id")
            img.lightbox-image(v-if="currentItem.type === 'image'" ref="image" :class="{ 'is-zoomed': zoom > 1, 'is-dragging': isDragging }" :src="currentItem.src" :alt="currentItem.alt || currentItem.title || ''" :style="{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }" draggable="false" @click="onImageClick" @dragstart.prevent @pointerdown="onImagePointerDown" @pointermove="onImagePointerMove" @pointerup="onImagePointerEnd" @pointercancel="onImagePointerEnd" @wheel.prevent="changeZoom($event.deltaY < 0 ? .25 : -.25)")
            iframe.lightbox-embed(v-else-if="currentItem.type === 'youtube' && embedSrc" :src="embedSrc" :title="currentItem.title || 'YouTube 影片'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy")
            video.lightbox-video(v-else-if="currentItem.type === 'video'" :src="currentItem.src" :poster="currentItem.poster" controls playsinline preload="metadata")
            iframe.lightbox-embed(v-else-if="currentItem.type === 'map' && embedSrc" :src="embedSrc" :title="currentItem.title || 'Google 地圖'" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade")
            article.lightbox-text(v-else-if="currentItem.type === 'text'")
              h2 {{ currentItem.title }}
              p {{ currentItem.text }}
            slot(v-else-if="currentItem.type === 'custom'" name="content" :item="currentItem")
            p.lightbox-error(v-else="") 無法顯示這項內容，請檢查類型或嵌入網址。
      template(v-if="items.length > 1")
        button.lightbox-arrow.lightbox-prev(type="button" aria-label="上一項" @click="move(-1)") ←
        button.lightbox-arrow.lightbox-next(type="button" aria-label="下一項" @click="move(1)") →
    .lightbox-bottom
      .lightbox-thumbnails(v-if="showThumbnails && items.length > 1" aria-label="媒體清單")
        button.lightbox-thumbnail(v-for="(item, index) in items" :key="item.id" type="button" :class="{ 'is-active': index === currentIndex }" :aria-label="`顯示第 ${index + 1} 項：${item.title || item.type}`" :aria-current="index === currentIndex ? 'true' : undefined" @click="select(index)")
          img(v-if="item.type === 'image' || item.poster" :src="item.poster || item.src" alt="")
          span(v-else="") {{ item.type }}
      .lightbox-caption(v-if="currentItem.title || currentItem.caption")
        strong {{ currentItem.title }}
        span(v-if="currentItem.caption") {{ currentItem.caption }}
</template>

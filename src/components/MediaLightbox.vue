<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  ariaLabel: { type: String, default: '媒體檢視' },
  slideInterval: { type: Number, default: 4000 },
})

const dialog = ref(null)
const motion = ref(null)
const currentIndex = ref(0)
const currentItem = computed(() => props.items[currentIndex.value] ?? null)
const isImage = computed(() => currentItem.value?.type === 'image')
const isClosing = ref(false)
const isPlaying = ref(false)
const showThumbnails = ref(false)
const isFullscreen = ref(false)
const isActive = ref(false)
const zoom = ref(1)
let sourceElement = null
let openedIndex = 0
let isOpening = false
let closeTimer
let slideTimer
let touchStartX = null

function youtubeEmbed(src) {
  try {
    const url = new URL(src)
    const host = url.hostname.replace(/^www\./, '')
    let id = ''
    if (host === 'youtu.be') id = url.pathname.slice(1)
    if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || ''
    }
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : ''
  } catch {
    return ''
  }
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
  const source = sourceElement?.getBoundingClientRect()
  if (!source || !motion.value || !dialog.value) return
  motion.value.style.animation = 'none'
  const target = motion.value.getBoundingClientRect()
  motion.value.style.animation = ''
  if (!target.width || !target.height) return
  const scale = Math.min(source.width / target.width, source.height / target.height)
  const x = source.left + source.width / 2 - target.left - target.width / 2
  const y = source.top + source.height / 2 - target.top - target.height / 2
  dialog.value.style.setProperty('--lightbox-from-x', `${x}px`)
  dialog.value.style.setProperty('--lightbox-from-y', `${y}px`)
  dialog.value.style.setProperty('--lightbox-from-scale', String(scale))
}

async function open(id, source = null) {
  const index = props.items.findIndex((item) => item.id === id)
  if (index < 0 || dialog.value?.open || isOpening) return
  isOpening = true
  sourceElement = source
  openedIndex = index
  currentIndex.value = index
  zoom.value = 1
  isActive.value = true
  await nextTick()
  dialog.value?.showModal()
  positionFromSource()
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
  stopSlideshow()
  if (document.fullscreenElement === dialog.value) document.exitFullscreen().catch(() => {})
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialog.value.close()
    return
  }
  positionFromSource()
  isClosing.value = true
  closeTimer = window.setTimeout(() => dialog.value?.close(), 380)
}

function onClosed() {
  window.clearTimeout(closeTimer)
  stopSlideshow()
  isClosing.value = false
  showThumbnails.value = false
  zoom.value = 1
  sourceElement = null
  isActive.value = false
  isOpening = false
  dialog.value?.style.removeProperty('--lightbox-from-x')
  dialog.value?.style.removeProperty('--lightbox-from-y')
  dialog.value?.style.removeProperty('--lightbox-from-scale')
}

function select(index) {
  if (index < 0 || index >= props.items.length || index === currentIndex.value) return
  currentIndex.value = index
  zoom.value = 1
  if (index !== openedIndex) {
    sourceElement = null
    dialog.value?.style.removeProperty('--lightbox-from-x')
    dialog.value?.style.removeProperty('--lightbox-from-y')
    dialog.value?.style.removeProperty('--lightbox-from-scale')
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

function changeZoom(step) {
  if (isImage.value) zoom.value = Math.min(3, Math.max(1, +(zoom.value + step).toFixed(1)))
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
dialog.media-lightbox(ref="dialog" :class="{ 'is-closing': isClosing }" :aria-label="ariaLabel" @cancel.prevent="close" @close="onClosed" @keydown="onKeydown" @fullscreenchange="onFullscreenChange")
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
    .lightbox-stage(@click.self="close" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd")
      .lightbox-motion(ref="motion")
        Transition(name="lightbox-switch")
          .lightbox-media(:key="currentItem.id")
            img.lightbox-image(v-if="currentItem.type === 'image'" :src="currentItem.src" :alt="currentItem.alt || currentItem.title || ''" :style="{ transform: `scale(${zoom})` }")
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

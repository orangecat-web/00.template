<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({ photos: { type: Array, required: true } })
const dialog = ref(null)
const currentIndex = ref(0)
const currentPhoto = computed(() => props.photos[currentIndex.value] ?? null)
const touchStartX = ref(null)
const isClosing = ref(false)
let closeTimer
let sourceElement = null

function positionFromCard() {
  const source = sourceElement?.getBoundingClientRect()
  if (!dialog.value || !source) return
  // 測量彈窗的最終位置，不把進場動畫的縮放算進距離。
  dialog.value.style.animation = 'none'
  const target = dialog.value.getBoundingClientRect()
  dialog.value.style.animation = ''
  if (!source || !target?.width || !target.height) return
  const scale = Math.min(source.width / target.width, source.height / target.height)
  const x = source.left + source.width / 2 - target.left - target.width / 2
  const y = source.top + source.height / 2 - target.top - target.height / 2
  dialog.value.style.setProperty('--dialog-from-x', `${x}px`)
  dialog.value.style.setProperty('--dialog-from-y', `${y}px`)
  dialog.value.style.setProperty('--dialog-from-scale', String(scale))
}

async function open(photo, card) {
  const index = props.photos.findIndex((item) => item.id === photo.id)
  if (index < 0 || dialog.value?.open) return
  sourceElement = card
  currentIndex.value = index
  await nextTick()
  dialog.value?.showModal()
  positionFromCard()
}

function close() {
  if (!dialog.value?.open || isClosing.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialog.value.close()
    return
  }
  positionFromCard()
  isClosing.value = true
  closeTimer = window.setTimeout(() => dialog.value?.close(), 420)
}

function onClosed() {
  window.clearTimeout(closeTimer)
  isClosing.value = false
  sourceElement = null
}

function move(step) {
  if (props.photos.length < 2) return
  currentIndex.value = (currentIndex.value + step + props.photos.length) % props.photos.length
}

function onKeydown(event) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    move(1)
  }
}

function onTouchStart(event) {
  touchStartX.value = event.changedTouches[0]?.clientX ?? null
}

function onTouchEnd(event) {
  if (touchStartX.value === null) return
  const distance = (event.changedTouches[0]?.clientX ?? touchStartX.value) - touchStartX.value
  if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1)
  touchStartX.value = null
}

onBeforeUnmount(() => window.clearTimeout(closeTimer))
defineExpose({ open, close })
</script>

<template lang="pug">
dialog.photo-dialog(ref="dialog" :class="{ 'is-closing': isClosing }" aria-label="照片檢視" @keydown="onKeydown" @cancel.prevent="close" @close="onClosed" @click="($event) => { if ($event.target === dialog) close() }")
  .photo-dialog-body(v-if="currentPhoto")
    button.dialog-close(type="button" aria-label="關閉照片" @click="close") ×
    .dialog-stage(@touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd")
      Transition(name="photo-switch")
        img(:key="currentPhoto.id" :src="currentPhoto.src" :alt="currentPhoto.alt")
      template(v-if="photos.length > 1")
        button.dialog-arrow.dialog-arrow-prev(type="button" aria-label="上一張照片" @click="move(-1)")
        button.dialog-arrow.dialog-arrow-next(type="button" aria-label="下一張照片" @click="move(1)")
    .dialog-caption
      div
        span.kicker OC / IMAGE {{ currentPhoto.id }} · {{ currentIndex + 1 }} / {{ photos.length }}
        h3 {{ currentPhoto.title }}
      p {{ currentPhoto.description }}
</template>

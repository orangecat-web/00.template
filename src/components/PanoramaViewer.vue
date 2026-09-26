<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PanoramaRenderer } from '../utils/PanoramaRenderer.js'
import { projectPanoramaPoint } from '../utils/panoramaProjection.js'

const props = defineProps({ scene: { type: Object, required: true } })
const emit = defineEmits(['navigate'])
const root = ref(null)
const stage = ref(null)
const canvas = ref(null)
const loading = ref(true)
const error = ref('')
const isFullscreen = ref(false)
const yaw = ref(0)
const pitch = ref(0)
const fov = ref(72)
const stageSize = ref({ width: 0, height: 0 })
const visibleHotspots = computed(() => (props.scene.hotspots || []).flatMap((hotspot) => {
  if (loading.value || error.value) return []
  const position = projectPanoramaPoint(hotspot,
    { yaw: yaw.value, pitch: pitch.value, fov: fov.value }, stageSize.value.width, stageSize.value.height)
  return position ? [{ ...hotspot, position }] : []
}))
let renderer = null
let resizeObserver = null
let requestId = 0
let pointer = null

const toRadians = (degrees) => degrees * Math.PI / 180
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function render() {
  if (stage.value) stageSize.value = { width: stage.value.clientWidth, height: stage.value.clientHeight }
  renderer?.draw({ yaw: yaw.value, pitch: pitch.value, fov: fov.value })
}

function resetView() {
  yaw.value = toRadians(props.scene.initialYaw ?? 0)
  pitch.value = toRadians(props.scene.initialPitch ?? 0)
  fov.value = clamp(props.scene.initialFov ?? 72, 35, 100)
  render()
}

function loadScene() {
  if (!renderer) return
  const currentRequest = ++requestId
  loading.value = true
  error.value = ''
  resetView()
  const image = new Image()
  if (/^https?:\/\//.test(props.scene.src)) image.crossOrigin = 'anonymous'
  image.onload = () => {
    if (currentRequest !== requestId) return
    if (Math.abs(image.naturalWidth / image.naturalHeight - 2) > 0.1) {
      error.value = '這張圖片不是 2:1 等距柱狀全景，請換成環景素材。'
      loading.value = false
      return
    }
    try {
      renderer.setImage(image)
      loading.value = false
      render()
    } catch {
      error.value = '環景影像無法載入 WebGL；請確認圖片來源允許跨網域使用。'
      loading.value = false
    }
  }
  image.onerror = () => {
    if (currentRequest !== requestId) return
    error.value = '無法載入這個環景場景。'
    loading.value = false
  }
  image.src = props.scene.src
}

function turn(horizontal, vertical = 0) {
  yaw.value += toRadians(horizontal)
  pitch.value = clamp(pitch.value + toRadians(vertical), toRadians(-85), toRadians(85))
  render()
}

function zoom(change) {
  fov.value = clamp(fov.value + change, 35, 100)
  render()
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: yaw.value, pitch: pitch.value }
  canvas.value.setPointerCapture(event.pointerId)
  root.value?.focus({ preventScroll: true })
}

function onPointerMove(event) {
  if (!pointer || pointer.id !== event.pointerId) return
  const width = Math.max(1, stage.value.clientWidth)
  const height = Math.max(1, stage.value.clientHeight)
  const sensitivity = toRadians(fov.value) * 1.35
  yaw.value = pointer.yaw - (event.clientX - pointer.x) / width * sensitivity
  pitch.value = clamp(pointer.pitch + (event.clientY - pointer.y) / height * sensitivity,
    toRadians(-85), toRadians(85))
  render()
}

function onPointerEnd(event) {
  if (pointer?.id !== event.pointerId) return
  if (canvas.value?.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId)
  pointer = null
}

function onKeyDown(event) {
  const actions = {
    ArrowLeft: () => turn(-10), ArrowRight: () => turn(10),
    ArrowUp: () => turn(0, 8), ArrowDown: () => turn(0, -8),
    '+': () => zoom(-8), '=': () => zoom(-8), '-': () => zoom(8),
    '0': resetView,
  }
  if (!actions[event.key]) return
  event.preventDefault()
  actions[event.key]()
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement === root.value) await document.exitFullscreen()
    else await root.value?.requestFullscreen()
  } catch { /* 瀏覽器未開放全螢幕時仍可在原尺寸觀看。 */ }
}

function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === root.value
  nextTick(render)
}

function onContextLost(event) {
  event.preventDefault()
  renderer = null
  error.value = '顯示裝置正在重新啟動環景，請稍候。'
}

function onContextRestored() {
  try {
    renderer = new PanoramaRenderer(canvas.value)
    loadScene()
  } catch (cause) {
    error.value = cause.message
    loading.value = false
  }
}

onMounted(() => {
  canvas.value.addEventListener('webglcontextlost', onContextLost)
  canvas.value.addEventListener('webglcontextrestored', onContextRestored)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(render)
    resizeObserver.observe(stage.value)
  } else window.addEventListener('resize', render)
  onContextRestored()
})

watch(() => props.scene, loadScene)

onBeforeUnmount(() => {
  requestId++
  resizeObserver?.disconnect()
  window.removeEventListener('resize', render)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  canvas.value?.removeEventListener('webglcontextlost', onContextLost)
  canvas.value?.removeEventListener('webglcontextrestored', onContextRestored)
  renderer?.destroy()
})
</script>

<template lang="pug">
.panorama-viewer(ref="root" role="region" :aria-label="`${scene.label} 360 度環景`" tabindex="0" @keydown="onKeyDown")
  .panorama-stage(ref="stage")
    canvas.panorama-canvas(ref="canvas" :aria-label="`拖曳查看${scene.label}環景`" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerEnd" @pointercancel="onPointerEnd" @wheel.prevent="zoom($event.deltaY * .06)" @contextmenu.prevent)
    .panorama-status(v-if="loading || error" role="status") {{ error || '載入環景中…' }}
    button.panorama-hotspot(v-for="hotspot in visibleHotspots" :key="hotspot.id" type="button" :style="hotspot.position" :aria-label="hotspot.label" @click="emit('navigate', hotspot.targetSceneId)")
      span.panorama-hotspot-icon(aria-hidden="true") ↗
      span.panorama-hotspot-label {{ hotspot.label }}
    .panorama-topline
      span 360° / PANORAMA
      span {{ scene.label }}
    span.panorama-reticle(v-if="!scene.hotspots?.length" aria-hidden="true") +
    .panorama-bottomline
      span.panorama-hint 拖曳轉向 · 滾輪縮放 · 方向鍵操作
      .panorama-controls(role="group" aria-label="環景控制")
        button(type="button" aria-label="縮小環景" @click="zoom(8)") −
        button(type="button" aria-label="放大環景" @click="zoom(-8)") +
        button(type="button" aria-label="重設環景視角" @click="resetView") ↺
        button(type="button" :aria-label="isFullscreen ? '離開全螢幕' : '環景全螢幕'" :aria-pressed="isFullscreen" @click="toggleFullscreen") {{ isFullscreen ? '▣' : '⛶' }}
</template>

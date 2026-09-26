<script setup>
import { ref, computed } from 'vue'
import PanoramaViewer from '../components/PanoramaViewer.vue'
import panoramaScenes from '../data/panoramas.json'
import panoramaTour from '../data/panoramaTour.json'
import { canOpenPanorama, unavailablePanoramaLabel } from '../utils/panoramaAccess.js'

const firstOpenScene = panoramaScenes.find((item) => canOpenPanorama(item.id, panoramaScenes))
const activeId = ref(firstOpenScene?.id)
const scene = computed(() => panoramaScenes.find((item) => item.id === activeId.value) || firstOpenScene)
const tabScenes = computed(() => panoramaScenes.filter((item) => !item.parentId))
const activeRootId = computed(() => scene.value.parentId || scene.value.id)
const branchScenes = computed(() => {
  const children = panoramaScenes.filter((item) => item.parentId === activeRootId.value)
  return children.length ? [panoramaScenes.find((item) => item.id === activeRootId.value), ...children] : []
})
const floorPlan = computed(() => panoramaTour.floorPlan?.rootSceneId === activeRootId.value
  ? panoramaTour.floorPlan : null)

function enterScene(targetId) {
  if (canOpenPanorama(targetId, panoramaScenes)) activeId.value = targetId
}
</script>

<template lang="pug">
.panorama-demo(v-if="scene")
  .panorama-scene-bar
    div
      p.kicker 360° / SCENES
      p.panorama-scene-description {{ scene.description }}
    .panorama-scene-options(v-if="tabScenes.length" aria-label="環景場景")
      button.panorama-scene-button(v-for="item in tabScenes" :key="item.id" type="button" :class="{ 'is-active': activeRootId === item.id }" :disabled="!canOpenPanorama(item.id, panoramaScenes)" :aria-pressed="activeRootId === item.id" @click="enterScene(item.id)") {{ item.label }}{{ canOpenPanorama(item.id, panoramaScenes) ? '' : ` · ${unavailablePanoramaLabel(item)}` }}
  PanoramaViewer(:scene="scene" :scenes="branchScenes" :floor-plan="floorPlan" @navigate="enterScene")
  p.panorama-credit(v-if="scene.credit") {{ scene.credit }}
</template>

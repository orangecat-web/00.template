<script setup>
import { ref, computed } from 'vue'
import PanoramaViewer from '../components/PanoramaViewer.vue'
import { panoramaScenes } from '../data/panoramas.js'

const activeId = ref(panoramaScenes[0]?.id)
const scene = computed(() => panoramaScenes.find((item) => item.id === activeId.value) || panoramaScenes[0])
</script>

<template lang="pug">
.panorama-demo(v-if="scene")
  .panorama-scene-bar
    div
      p.kicker 360° / DEMO SCENES
      p.panorama-scene-description {{ scene.description }}
    .panorama-scene-options(role="group" aria-label="環景場景")
      button.panorama-scene-button(v-for="item in panoramaScenes" :key="item.id" type="button" :class="{ 'is-active': activeId === item.id }" :aria-pressed="activeId === item.id" @click="activeId = item.id") {{ item.label }}
  PanoramaViewer(:scene="scene")
  p.panorama-credit 示範場景為向量插畫；日後可替換為 2:1 等距柱狀環景照片。
</template>

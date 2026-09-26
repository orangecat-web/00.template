<script setup>
import { computed, ref } from 'vue'
import { mediaItems } from '../data/media.js'

const effectGroups = [
  { id: 'filter', label: '圖片濾鏡', effects: [
    { id: 'none', label: '原色', detail: 'Original' },
    { id: 'grayscale', label: '灰階', detail: 'Grayscale' },
    { id: 'sepia', label: '懷舊', detail: 'Sepia' },
    { id: 'contrast', label: '對比', detail: 'Contrast' },
    { id: 'brightness', label: '亮度', detail: 'Brightness' },
    { id: 'invert', label: '反相', detail: 'Invert' },
    { id: 'opacity', label: '透明度', detail: 'Opacity' },
    { id: 'hue-rotate', label: '色相旋轉', detail: 'Hue rotate' },
    { id: 'blur', label: '模糊', detail: 'Blur' },
    { id: 'saturate', label: '飽和度', detail: 'Saturate' },
  ] },
  { id: 'blend', label: '疊色模式', effects: [
    { id: 'multiply', label: '色彩增值', detail: 'Multiply' },
    { id: 'screen', label: '濾色', detail: 'Screen' },
    { id: 'overlay', label: '覆蓋', detail: 'Overlay' },
    { id: 'darken', label: '變暗', detail: 'Darken' },
    { id: 'lighten', label: '變亮', detail: 'Lighten' },
    { id: 'color-dodge', label: '加亮顏色', detail: 'Color dodge' },
    { id: 'color-burn', label: '加深顏色', detail: 'Color burn' },
    { id: 'hard-light', label: '實光', detail: 'Hard light' },
    { id: 'soft-light', label: '柔光', detail: 'Soft light' },
    { id: 'difference', label: '差異化', detail: 'Difference' },
    { id: 'exclusion', label: '排除', detail: 'Exclusion' },
    { id: 'hue', label: '色相', detail: 'Hue' },
    { id: 'saturation', label: '飽和度', detail: 'Saturation' },
    { id: 'color', label: '顏色', detail: 'Color' },
    { id: 'luminosity', label: '明度', detail: 'Luminosity' },
  ] },
]
const featuredPhoto = mediaItems.find((item) => item.type === 'image')
const activeGroupId = ref(effectGroups[0].id)
const activeEffectId = ref(effectGroups[0].effects[0].id)
const activeGroup = computed(() => effectGroups.find((group) => group.id === activeGroupId.value))
const selectedEffect = computed(() => activeGroup.value.effects.find((effect) => effect.id === activeEffectId.value))

function selectGroup(group) {
  activeGroupId.value = group.id
  activeEffectId.value = group.effects[0].id
}
</script>

<template lang="pug">
.effect-workbench
  .effect-preview(:class="`effect-${activeGroupId}-${activeEffectId}`")
    img(v-if="featuredPhoto" :src="featuredPhoto.src" :alt="featuredPhoto.alt")
    span.effect-preview-label {{ selectedEffect.detail }} / 01
  .effect-controls
    p.control-heading EFFECT SELECTOR
    .effect-groups(role="group" aria-label="效果分類")
      button.effect-group(v-for="group in effectGroups" :key="group.id" type="button" :class="{ 'is-active': activeGroupId === group.id }" :aria-pressed="activeGroupId === group.id" @click="selectGroup(group)") {{ group.label }}
    .effect-options(role="group" :aria-label="activeGroup.label")
      button.effect-option(v-for="(effect, index) in activeGroup.effects" :key="effect.id" type="button" :class="{ 'is-active': activeEffectId === effect.id }" :aria-pressed="activeEffectId === effect.id" @click="activeEffectId = effect.id")
        span.effect-number {{ String(index + 1).padStart(2, '0') }}
        span.effect-name {{ effect.label }}
        span.effect-english {{ effect.detail }}
        span.effect-arrow(aria-hidden="true") ↗
    p.control-note 原版 Sass 濾鏡與疊色模式 · Vue 即時切換
</template>

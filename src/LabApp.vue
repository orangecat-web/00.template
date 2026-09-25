<script setup>
import { computed, ref } from 'vue'
import GalleryCard from './components/GalleryCard.vue'
import MediaLightbox from './components/MediaLightbox.vue'
import SiteLayout from './components/SiteLayout.vue'
import { mediaCategoryNames, mediaItems } from './data/media.js'

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
const categories = computed(() => [
  { id: 'all', label: '全部' },
  ...[...new Set(mediaItems.map((item) => item.category).filter(Boolean))]
    .map((id) => ({ id, label: mediaCategoryNames[id] || id })),
])
const navDirections = [
  { id: 'left', label: '左' }, { id: 'right', label: '右' },
  { id: 'top', label: '上' }, { id: 'bottom', label: '下' },
]
const navModes = [
  { id: 'overlay', label: '覆蓋' }, { id: 'push', label: '推擠' },
]

const activeEffect = ref('none')
const activeEffectGroup = ref('filter')
const activeCategory = ref('all')
const layout = ref(null)
const navSide = computed(() => layout.value?.navSide ?? 'left')
const navMode = computed(() => layout.value?.navMode ?? 'overlay')
const menuOpen = computed(() => layout.value?.menuOpen ?? false)
const mediaLightbox = ref(null)
const featuredPhoto = mediaItems.find((item) => item.type === 'image')
const filteredItems = computed(() => activeCategory.value === 'all'
  ? mediaItems
  : mediaItems.filter((item) => item.category === activeCategory.value))
const visibleEffects = computed(() => effectGroups.find((group) => group.id === activeEffectGroup.value).effects)
const selectedEffect = computed(() => visibleEffects.value.find((effect) => effect.id === activeEffect.value))

function setNavSide(value) { layout.value?.setNavSide(value) }
function setNavMode(value) { layout.value?.setNavMode(value) }
function openMenu(event) { layout.value?.openMenu(event) }
function selectEffectGroup(group) {
  activeEffectGroup.value = group.id
  activeEffect.value = group.effects[0].id
}
function openMedia(item, sourceElement) {
  mediaLightbox.value?.open(item.id, sourceElement)
}
</script>

<template lang="pug">
SiteLayout(ref="layout" page-id="lab")
  section.lab-page-intro(aria-labelledby="lab-page-title")
    p.kicker INTERACTIVE LAB / VUE 3
    h1#lab-page-title 動手試試，<br>互動怎麼發生<span class="period">．</span>
    p 這裡集中展示影像效果、選單動畫與媒體檢視；每個操作都來自目前的 Vue 3 樣版。Google Icons 工具另有獨立頁面。
    a.text-link(href="/icons.html") 前往 Google Icons 工具 ↗
  section#effects.effects-section(aria-labelledby="effects-title")
    .shell
      .section-heading
        div
          p.kicker 01 / IMAGE EFFECTS
          h2#effects-title 同一張影像，<br>多種觀看方式<span class="period">.</span>
        p.section-description 這是可以直接操作的前端實作。選擇濾鏡、切換疊色，看看同一張影像如何即時變化。
      .effect-workbench
        .effect-preview(:class="`effect-${activeEffectGroup}-${activeEffect}`")
          img(:src="featuredPhoto.src" :alt="featuredPhoto.alt")
          span.effect-preview-label {{ selectedEffect?.detail }} / 01
        .effect-controls
          p.control-heading EFFECT SELECTOR
          .effect-groups(role="group" aria-label="效果分類")
            button.effect-group(v-for="group in effectGroups" :key="group.id" type="button" :class="{ 'is-active': activeEffectGroup === group.id }" :aria-pressed="activeEffectGroup === group.id" @click="selectEffectGroup(group)") {{ group.label }}
          .effect-options(role="group" :aria-label="effectGroups.find((group) => group.id === activeEffectGroup).label")
            button.effect-option(v-for="(effect, index) in visibleEffects" :key="effect.id" type="button" :class="{ 'is-active': activeEffect === effect.id }" :aria-pressed="activeEffect === effect.id" @click="activeEffect = effect.id")
              span.effect-number {{ String(index + 1).padStart(2, '0') }}
              span.effect-name {{ effect.label }}
              span.effect-english {{ effect.detail }}
              span.effect-arrow(aria-hidden="true") ↗
          p.control-note 原版 Sass 濾鏡與疊色模式 · Vue 即時切換
      #nav-demo.nav-lab
        .nav-lab-copy
          p.kicker NAV MOTION / ONE MENU
          h3 同一份導覽，<br>八種出場方式<span class="period">.</span>
          p 從舊版 Slidebars 的方向與動態概念重新寫成原生互動；桌面和手機共用同一份連結。
        .nav-lab-controls
          p.control-heading 滑出方向
          .nav-choice-group(role="group" aria-label="滑出方向")
            button.nav-choice(v-for="option in navDirections" :key="option.id" type="button" :aria-pressed="navSide === option.id" :class="{ 'is-active': navSide === option.id }" @click="setNavSide(option.id)") {{ option.label }}
          p.control-heading 動態模式
          .nav-choice-group(role="group" aria-label="動態模式")
            button.nav-choice(v-for="option in navModes" :key="option.id" type="button" :aria-pressed="navMode === option.id" :class="{ 'is-active': navMode === option.id }" @click="setNavMode(option.id)") {{ option.label }}
          button.nav-preview(type="button" :aria-expanded="menuOpen" aria-controls="site-nav" @click="openMenu($event)") 試開選單 ↗
  section#gallery.gallery-section(aria-labelledby="gallery-title")
    .shell
      .section-heading
        div
          p.kicker 02 / MEDIA & GALLERY
          h2#gallery-title 圖片與文字，<br>換個方式相遇<span class="period">．</span>
        p.section-description 舊版 `graphic_list.pug` 的圖文列表概念，現在由 Vue 元件與資料陣列產生。分類、卡片展開與手機版都能實際操作。
      .category-controls(role="group" aria-label="媒體分類")
        button.category-button(v-for="category in categories" :key="category.id" type="button" :class="{ 'is-active': activeCategory === category.id }" :aria-pressed="activeCategory === category.id" @click="activeCategory = category.id") {{ category.label }}
      TransitionGroup.gallery-grid(name="gallery" tag="div")
        GalleryCard(v-for="(item, index) in filteredItems" :key="item.id" :item="item" :index="index" :total="filteredItems.length" @open="openMedia")
      p.gallery-note 原始照片取自舊版 oc-template；此處展示的是版型與效果，不將它們標作客戶專案。
MediaLightbox(ref="mediaLightbox" :items="filteredItems" aria-label="媒體作品檢視")
</template>

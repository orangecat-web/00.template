<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import GalleryCard from './components/GalleryCard.vue'
import { photos } from './data/photos.js'

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
const categories = [
  { id: 'all', label: '全部' },
  { id: 'cats', label: '貓咪肖像' },
  { id: 'spaces', label: '空間攝影' },
]

const activeEffect = ref('none')
const activeEffectGroup = ref('filter')
const activeCategory = ref('all')
const menuOpen = ref(false)
const headerLow = ref(false)
const showGoTop = ref(false)
const selectedPhoto = ref(null)
const photoDialog = ref(null)
let scrollFrame = 0
const year = new Date().getFullYear()
const featuredPhoto = photos[0]
const filteredPhotos = computed(() => activeCategory.value === 'all'
  ? photos
  : photos.filter((photo) => photo.category === activeCategory.value))
const visibleEffects = computed(() => effectGroups.find((group) => group.id === activeEffectGroup.value).effects)
const selectedEffect = computed(() => visibleEffects.value.find((effect) => effect.id === activeEffect.value))

function selectEffectGroup(group) {
  activeEffectGroup.value = group.id
  activeEffect.value = group.effects[0].id
}

function updateScroll() {
  headerLow.value = window.scrollY > 350
  showGoTop.value = window.scrollY > 200
}

function scrollToPosition(top, duration = 600) {
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  scrollFrame = 0
  const destination = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight))
  if (Math.abs(destination - window.scrollY) < 1) return
  const start = window.scrollY
  const distance = destination - start
  let startTime
  function animate(time) {
    if (startTime === undefined) startTime = time
    const progress = Math.min((time - startTime) / duration, 1)
    const eased = (1 - Math.cos(Math.PI * progress)) / 2
    window.scrollTo(0, start + distance * eased)
    if (progress < 1) scrollFrame = requestAnimationFrame(animate)
    else scrollFrame = 0
  }
  scrollFrame = requestAnimationFrame(animate)
}

function goTo(id) {
  menuOpen.value = false
  const target = id === 'top' ? null : document.getElementById(id)
  if (id !== 'top' && !target) return
  const top = target ? target.getBoundingClientRect().top + window.scrollY - 80 : 0
  scrollToPosition(top)
}

function openPhoto(photo) {
  selectedPhoto.value = photo
  photoDialog.value?.showModal()
}

function closePhoto() {
  photoDialog.value?.close()
}

function onDialogClose() {
  selectedPhoto.value = null
}

onMounted(() => {
  updateScroll()
  window.addEventListener('scroll', updateScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
})
</script>

<template lang="pug">
.site#top
  header.site-header.header(:class="{ headerlow: headerLow }")
    .shell.header-inner
      a.brand(href="#top" @click.prevent="goTo('top')" aria-label="Orange Cat 回到頁首")
        img(src="/images/logo.svg" alt="orangeCat's photography")
      span.header-caption VISUAL DESIGN / FRONT-END
      button.menu-button(type="button" :aria-expanded="menuOpen" aria-controls="site-nav" aria-label="切換導覽選單" @click="menuOpen = !menuOpen")
        span
        span
      nav#site-nav.site-nav(:class="{ 'is-open': menuOpen }" aria-label="主要導覽")
        a(href="#effects" @click.prevent="goTo('effects')") 視覺效果
        a(href="#gallery" @click.prevent="goTo('gallery')") 圖文列表
        a(href="#about" @click.prevent="goTo('about')") 關於這版
  main
    section.hero.shell(aria-labelledby="hero-title")
      .hero-copy
        p.kicker
          span.kicker-line
          | ORANGE CAT / VISUAL LAB
        h1#hero-title 設計有感，<br>互動有據<span class="period">.</span>
        p.hero-lead 以舊版 oc-template 的影像與視覺效果為起點，重新組成 Vue 3 的互動展示。從 Pug、Sass 到原生 JavaScript，讓頁面上的每個細節都能被看見，也能被操作。
        .hero-actions
          a.pill.pill-primary(href="#effects" @click.prevent="goTo('effects')") 看效果實驗
            span(aria-hidden="true") ↗
          a.pill.pill-outline(href="#gallery" @click.prevent="goTo('gallery')") 探索圖文列表
        .hero-footnote
          span 01 — DESIGN SYSTEM
          span 02 — INTERACTION
          span 03 — VUE 3
      .hero-media
        .hero-photo-frame
          img(:src="featuredPhoto.src" :alt="featuredPhoto.alt")
          .hero-sticker(aria-hidden="true")
            span Original
            strong → Vue 3
        span.media-note SELECTED IMAGE / OC-TEMPLATE
        span.media-index 001 / 005
    section#effects.effects-section(aria-labelledby="effects-title")
      .shell
        .section-heading
          div
            p.kicker 01 / EFFECT LAB
            h2#effects-title 同一張影像，<br>多種觀看方式<span class="period">.</span>
          p.section-description 舊版的 `_effects.sass` 有豐富的濾鏡與疊色效果。選擇分類與效果，就能用同一張照片即時比較。
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
    section#gallery.gallery-section(aria-labelledby="gallery-title")
      .shell
        .section-heading
          div
            p.kicker 02 / GRAPHIC LIST
            h2#gallery-title 圖片與文字，<br>換個方式相遇<span class="period">.</span>
          p.section-description 舊版 `graphic_list.pug` 的圖文列表概念，現在由 Vue 元件與資料陣列產生。分類、卡片展開與手機版都能實際操作。
        .category-controls(role="group" aria-label="攝影分類")
          button.category-button(v-for="category in categories" :key="category.id" type="button" :class="{ 'is-active': activeCategory === category.id }" :aria-pressed="activeCategory === category.id" @click="activeCategory = category.id") {{ category.label }}
        TransitionGroup.gallery-grid(name="gallery" tag="div")
          GalleryCard(v-for="photo in filteredPhotos" :key="photo.id" :photo="photo" @open="openPhoto")
        p.gallery-note 原始照片取自舊版 oc-template；此處展示的是版型與效果，不將它們標作客戶專案。
    section#about.about-section(aria-labelledby="about-title")
      .shell.about-grid
        div
          p.kicker 03 / BEHIND THE BUILD
          h2#about-title 既有設計資產，<br>新的互動方式<span class="period">.</span>
        .about-copy
          p 這版延續原本的 Pug 與縮排式 Sass，並把舊版選單、捲動與畫面更新改由 Vue 狀態及瀏覽器原生 API 處理。頁面上的濾鏡和圖文卡片，正是這次搬移的第一批成果。
          .about-stats
            div
              strong Pug
              span Vue 模板語法
            div
              strong Sass
              span 可重用視覺效果
            div
              strong JS
              span 原生互動與 Vue 狀態
          .about-links
            a(href="https://github.com/orangecat-web" target="_blank" rel="noopener noreferrer") GitHub ↗
            a(href="https://orangecat-design.wixsite.com/cang" target="_blank" rel="noopener noreferrer") 其他視覺作品 ↗
  footer.site-footer
    .shell.footer-inner
      span © {{ year }} orangeCat's photography
      span VUE 3 / PUG / SASS / VANILLA JS
      a(href="#top" @click.prevent="goTo('top')") BACK TO TOP ↑
  Transition(name="back-to-top")
    button.back-to-top.goTop(v-if="showGoTop" type="button" aria-label="回到頁首" @click="goTo('top')")
      img(src="/images/btn_gotop.svg" alt="")
  dialog.photo-dialog(ref="photoDialog" @close="onDialogClose" @click="($event) => { if ($event.target === photoDialog) closePhoto() }")
    .photo-dialog-body(v-if="selectedPhoto")
      button.dialog-close(type="button" aria-label="關閉照片" @click="closePhoto") ×
      img(:src="selectedPhoto.src" :alt="selectedPhoto.alt")
      .dialog-caption
        div
          span.kicker OC / IMAGE {{ selectedPhoto.id }}
          h3 {{ selectedPhoto.title }}
        p {{ selectedPhoto.description }}
</template>

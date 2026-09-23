<script setup>
import { computed, nextTick, ref } from 'vue'
import { iconGroups } from './data/icons.js'
import SiteLayout from './components/SiteLayout.vue'

const styles = [
  { id: 'filled', label: 'Filled', className: 'material-icons' },
  { id: 'round', label: 'Round', className: 'material-icons-round' },
  { id: 'outlined', label: 'Outlined', className: 'material-icons-outlined' },
  { id: 'sharp', label: 'Sharp', className: 'material-icons-sharp' },
  { id: 'twotone', label: 'Two Tone', className: 'material-icons-two-tone' },
]
const selectedStyle = ref(styles[0])
const search = ref('')
const copied = ref('')
const layout = ref(null)
const visibleGroups = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return iconGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !query || `${item.name} ${item.label}`.toLocaleLowerCase().includes(query)),
  })).filter((group) => group.items.length)
})
const count = computed(() => visibleGroups.value.reduce((total, group) => total + group.items.length, 0))

function goTo(id) {
  layout.value?.goTo(id)
}

async function goToGroup(id) {
  if (search.value) {
    search.value = ''
    await nextTick()
  }
  goTo(id)
}

async function copyName(name) {
  try {
    await navigator.clipboard.writeText(name)
    copied.value = name
    window.setTimeout(() => { if (copied.value === name) copied.value = '' }, 1800)
  } catch {
    copied.value = ''
  }
}
</script>

<template lang="pug">
SiteLayout(ref="layout" page-id="icons" brand-caption="/ ICON LIBRARY" :data-style="selectedStyle.id")
  section.icons-hero(aria-labelledby="icons-title")
    .hero-copy
      p.eyebrow UTILITY / 01 — MATERIAL ICONS
      h1#icons-title 基礎圖示，<br>留給字型<span>.</span>
      p.hero-lead 用現成的 Google Material Icons 處理選單、搜尋、會員、購物車等基礎圖示，把繪製時間留給更重要的視覺設計。這頁整理了舊版 `icon_exsample.pug` 與 `_icons.sass` 的常用清單。
      a.text-link(href="https://fonts.google.com/icons?icon.set=Material+Icons" target="_blank" rel="noopener noreferrer") 查看 Google 圖示庫 ↗
    .hero-preview(aria-hidden="true")
      span.preview-orbit
      span.preview-icon.preview-home: i.material-icons home
      span.preview-icon.preview-star: i.material-icons-round star
      span.preview-icon.preview-search: i.material-icons-outlined search
      span.preview-caption FIVE STYLES / ONE TOOLBOX

  section#guide.guide-section(aria-labelledby="guide-title")
    .section-head
      p.eyebrow HOW TO USE
      h2#guide-title 一段 Sass，兩種用法。
      p 以本地字型載入，不需要 jQuery。直接使用 Google 的 ligature 寫法，或沿用我們的 `google_icons()` mixin。
    .guide-grid
      article.guide-card
        span.guide-number 01 / SASS MIXIN
        h3 指定圖示與樣式
        pre
          code.
            @use './icons' as icons

            .home-link
              @include icons.google_icons(home, round)
        pre
          code.
            &lt;a class="home-link" href="/"&gt;
              &lt;i aria-hidden="true"&gt;&lt;/i&gt;首頁
            &lt;/a&gt;
        a.home-link(href="/")
          i(aria-hidden="true")
          | 首頁示範
        p 第一個參數是舊版常用名稱；第二個可填 `filled`、`round`、`outlined`、`sharp` 或 `twotone`，省略時使用 Filled。
      article.guide-card
        span.guide-number 02 / GOOGLE LIGATURE
        h3 直接寫圖示名稱
        pre: code &lt;span class="material-icons" aria-hidden="true"&gt;home&lt;/span&gt;
        p 在這頁，五種字型的 `material-icons-*` class 都已備好。單純的圖示建議加上 `aria-hidden="true"`，並為按鈕提供文字或 `aria-label`。
        .mini-examples
          span.material-icons(aria-hidden="true") home
          span.material-icons-round(aria-hidden="true") home
          span.material-icons-outlined(aria-hidden="true") home
          span.material-icons-sharp(aria-hidden="true") home
          span.material-icons-two-tone(aria-hidden="true") home

  section#catalog.catalog-section(aria-labelledby="catalog-title")
    .section-head
      p.eyebrow ICON INDEX / {{ count }} ICONS
      h2#catalog-title 換個筆觸，看看效果。
      p 切換五種字型樣式，或搜尋舊版整理的常用圖示；點圖示可複製 Sass 使用的名稱。
    .catalog-controls
      .style-choices(role="group" aria-label="圖示樣式")
        button.style-choice(v-for="style in styles" :key="style.id" type="button" :aria-pressed="selectedStyle.id === style.id" @click="selectedStyle = style") {{ style.label }}
      label.search-field
        span 搜尋圖示
        input(v-model="search" type="search" placeholder="例如 home、購物車、search" autocomplete="off")
    nav.category-links(aria-label="圖示分類")
      a(v-for="group in iconGroups" :key="group.id" :href="`#${group.id}`" @click.prevent="goToGroup(group.id)") {{ group.title }}
    .icon-groups(v-if="visibleGroups.length")
      section.icon-group(v-for="group in visibleGroups" :id="group.id" :key="group.id" :aria-labelledby="`${group.id}-title`")
        .group-heading
          h3(:id="`${group.id}-title`") {{ group.title }}
          span {{ String(group.items.length).padStart(2, '0') }} / {{ selectedStyle.label.toUpperCase() }}
        .icon-grid
          button.icon-tile(v-for="item in group.items" :key="item.name" type="button" :aria-label="`複製 ${item.name} 圖示名稱`" @click="copyName(item.name)")
            span.icon-glyph(:class="`icon-${item.name}`" aria-hidden="true")
            strong {{ item.label }}
            small {{ copied === item.name ? '已複製！' : item.name }}
    p.empty-message(v-else) 找不到相符的圖示，換個關鍵字試試。
</template>

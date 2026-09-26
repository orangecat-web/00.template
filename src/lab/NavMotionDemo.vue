<script setup>
import { computed, inject } from 'vue'
import { labLayoutKey } from './context.js'

const layout = inject(labLayoutKey)
const directions = [
  { id: 'left', label: '左' }, { id: 'right', label: '右' },
  { id: 'top', label: '上' }, { id: 'bottom', label: '下' },
]
const modes = [
  { id: 'overlay', label: '覆蓋' }, { id: 'push', label: '推擠' },
]
const side = computed(() => layout?.value?.navSide ?? 'left')
const mode = computed(() => layout?.value?.navMode ?? 'overlay')
const open = computed(() => layout?.value?.menuOpen ?? false)
</script>

<template lang="pug">
.nav-lab
  .nav-lab-copy
    p.kicker NAV MOTION / ONE MENU
    h3 同一份導覽，<br>八種出場方式<span class="period">.</span>
    p 從舊版 Slidebars 的方向與動態概念重新寫成原生互動；桌面和手機共用同一份連結。
  .nav-lab-controls
    p.control-heading 滑出方向
    .nav-choice-group(role="group" aria-label="滑出方向")
      button.nav-choice(v-for="option in directions" :key="option.id" type="button" :aria-pressed="side === option.id" :class="{ 'is-active': side === option.id }" @click="layout?.setNavSide(option.id)") {{ option.label }}
    p.control-heading 動態模式
    .nav-choice-group(role="group" aria-label="動態模式")
      button.nav-choice(v-for="option in modes" :key="option.id" type="button" :aria-pressed="mode === option.id" :class="{ 'is-active': mode === option.id }" @click="layout?.setNavMode(option.id)") {{ option.label }}
    button.nav-preview(type="button" :aria-expanded="open" aria-controls="site-nav" @click="layout?.openMenu($event)") 試開選單 ↗
</template>

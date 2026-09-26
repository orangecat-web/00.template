<script setup>
import { provide, ref } from 'vue'
import SiteLayout from './components/SiteLayout.vue'
import { labLayoutKey } from './lab/context.js'
import { availableLabModules } from './lab/modules.js'

const layout = ref(null)
provide(labLayoutKey, layout)

function goTo(id) { layout.value?.goTo(id) }

function selectModule(event) {
  if (!event.target.value) return
  goTo(event.target.value)
  event.target.value = ''
}
</script>

<template lang="pug">
SiteLayout(ref="layout" page-id="lab")
  section.lab-page-intro(aria-labelledby="lab-page-title")
    p.kicker INTERACTIVE LAB / VUE 3
    h1#lab-page-title 動手試試，<br>互動怎麼發生<span class="period">．</span>
    p 從影像效果、選單動態到媒體檢視與輪播，這裡每一項都能親手操作。實驗會繼續增加
  nav.lab-module-index(aria-label="互動實驗室項目")
    a.lab-module-link(v-for="(module, index) in availableLabModules" :key="module.id" :href="`#${module.id}`" @click.prevent="goTo(module.id)")
      span.lab-module-number {{ String(index + 1).padStart(2, '0') }} / {{ module.eyebrow }}
      strong {{ module.label }}
      span.lab-module-arrow(aria-hidden="true") ↗
  .lab-module-picker
    select#lab-module-select(aria-label="選擇互動實驗室項目" @change="selectModule")
      option(value="" disabled selected) 選擇實驗項目
      option(v-for="(module, index) in availableLabModules" :key="module.id" :value="module.id") {{ String(index + 1).padStart(2, '0') }} / {{ module.label }}
    span(aria-hidden="true") ↓
  section.lab-module-section(v-for="(module, index) in availableLabModules" :id="module.id" :key="module.id" :class="`lab-module--${module.id}`" :aria-labelledby="`${module.id}-title`")
    .shell
      .section-heading
        div
          p.kicker {{ String(index + 1).padStart(2, '0') }} / {{ module.eyebrow }}
          h2(:id="`${module.id}-title`")
            template(v-for="(line, lineIndex) in module.title" :key="lineIndex")
              | {{ line }}
              br(v-if="lineIndex < module.title.length - 1")
            span.period ．
        p.section-description {{ module.description }}
      component(:is="module.component")
</template>

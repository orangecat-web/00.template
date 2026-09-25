<script setup>
import { computed } from 'vue'
import { pageNumbers } from '../utils/pagination.js'

const props = defineProps({
  page: { type: Number, required: true },
  count: { type: Number, required: true },
  hrefForPage: { type: Function, required: true },
})
const emit = defineEmits(['change'])
const numbers = computed(() => pageNumbers(props.page, props.count))

function change(event, page) {
  event.preventDefault()
  emit('change', page)
}
</script>

<template lang="pug">
nav.pagination(v-if="count > 1" aria-label="作品列表頁碼")
  a.pagination-step(v-if="page > 1" :href="hrefForPage(page - 1)" @click="change($event, page - 1)") ← 上一頁
  span.pagination-step.is-disabled(v-else) ← 上一頁
  .pagination-pages
    template(v-for="(number, index) in numbers" :key="`${number}-${index}`")
      span.pagination-ellipsis(v-if="number === '…'") …
      a.pagination-number(v-else :href="hrefForPage(number)" :aria-current="number === page ? 'page' : undefined" @click="change($event, number)") {{ number }}
  a.pagination-step(v-if="page < count" :href="hrefForPage(page + 1)" @click="change($event, page + 1)") 下一頁 →
  span.pagination-step.is-disabled(v-else) 下一頁 →
</template>

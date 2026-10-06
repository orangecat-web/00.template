<script setup>
// ═══ 來源提示與重試：失敗時保留本地作品，過期快取明確標示 ═══
import { computed } from 'vue'
import { useGithub } from '../composables/useGithub.js'
const { loading, error, source, fetchedAt, repositories, reload } = useGithub()
const message = computed(() => loading.value ? '正在讀取 GitHub 專案資料…'
  : source.value === 'live' ? 'GitHub 專案資料已更新。'
  : source.value === 'cache' ? '目前顯示最近取得的 GitHub 資料。'
  : source.value === 'stale' ? '目前顯示先前的 GitHub 資料，尚未取得最新版本。'
  : '目前顯示隨版本附上的 GitHub 資料快照。')
const time = computed(() => fetchedAt.value ? new Date(fetchedAt.value).toLocaleString('zh-TW') : '')
</script>

<template lang="pug">
.github-status(role="status" aria-live="polite" :aria-busy="loading")
  p {{ message }}
  small(v-if="time") 資料取得時間：{{ time }}
  p(v-if="error") {{ error }}
  p(v-if="source === 'live' && !repositories.length") GitHub 目前沒有公開的專案資料。
  button.work-category-tab(type="button" :disabled="loading" @click="reload") {{ loading ? '讀取中…' : error ? '重新嘗試 ↗' : '更新 GitHub 資料 ↗' }}
</template>

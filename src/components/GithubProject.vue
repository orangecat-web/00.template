<script setup>
// ═══ 卡片／內頁共用資料展示；Repo URL 由可信任設定產生 ═══
import { computed } from 'vue'
import { useGithub } from '../composables/useGithub.js'
const props = defineProps({ project: { type: Object, required: true }, detail: Boolean })
const { byName, source, loading } = useGithub()
const repo = computed(() => byName.value.get(props.project.githubRepository?.toLowerCase()))
const date = computed(() => {
  const date = new Date(repo.value?.pushedAt)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-TW')
})
</script>

<template lang="pug">
.github-project(v-if="project.githubRepository")
  p.github-tags {{ project.techTags.join(' · ') }}
  template(v-if="repo")
    p(v-if="detail && repo.description") {{ repo.description }}
    p.github-meta
      span(v-if="repo.language") {{ repo.language }} ·
      span(v-if="date") 程式更新 {{ date }} ·
      span ★ {{ repo.stars }} / Fork {{ repo.forks }}
    p(v-if="detail && repo.topics.length") {{ repo.topics.join(' · ') }}
  p(v-if="!loading && source === 'live' && !repo") GitHub 目前沒有這件作品的公開倉庫資料。
  a.text-link(:href="project.githubUrl" target="_blank" rel="noopener noreferrer") 查看 GitHub 原始碼 ↗
</template>

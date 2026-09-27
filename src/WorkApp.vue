<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PaginationNav from './components/PaginationNav.vue'
import ProjectCard from './components/ProjectCard.vue'
import SiteLayout from './components/SiteLayout.vue'
import { filterProjects, projectCategories, projects, resolveProjectCategory, searchProjects, workListUrl } from './data/projects.js'
import { clampPage, pageSlice, PROJECTS_PER_PAGE, totalPages } from './utils/pagination.js'

function stateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const category = resolveProjectCategory(params.get('category'))
  const query = params.get('q') || ''
  const results = searchProjects(filterProjects(projects, category), query)
  return { category, query, page: clampPage(params.get('page'), results.length) }
}

const layout = ref(null)
const initialState = stateFromUrl()
const category = ref(initialState.category)
const query = ref(initialState.query)
const page = ref(initialState.page)
const filteredProjects = computed(() => searchProjects(filterProjects(projects, category.value), query.value))
const count = computed(() => totalPages(filteredProjects.value.length))
const visibleProjects = computed(() => pageSlice(filteredProjects.value, page.value))
const pageHref = (nextPage) => workListUrl({ category: category.value, page: nextPage, query: query.value })

function updateList(nextCategory, nextPage) {
  if (nextCategory === category.value && nextPage === page.value) return
  category.value = nextCategory
  page.value = nextPage
  window.history.pushState(null, '', workListUrl({ category: nextCategory, page: nextPage, query: query.value }))
  layout.value?.goTo('work-list')
}

function changePage(nextPage) {
  if (nextPage < 1 || nextPage > count.value) return
  updateList(category.value, nextPage)
}

function selectCategory(nextCategory) { updateList(nextCategory, 1) }
function updateQuery() {
  page.value = 1
  window.history.replaceState(null, '', workListUrl({ category: category.value, query: query.value }))
}
function clearQuery() {
  query.value = ''
  updateQuery()
}
function onPopState() {
  const next = stateFromUrl()
  category.value = next.category
  query.value = next.query
  page.value = next.page
}
onMounted(() => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))
</script>

<template lang="pug">
SiteLayout(ref="layout" page-id="work")
  section.work-page-intro(aria-labelledby="work-page-title")
    p.kicker SELECTED WORK / ARCHIVE
    h1#work-page-title 每一件作品，<br>都有自己的任務<span class="period">．</span>
    p 從前端互動、商業網站到視覺設計，這裡收錄目前公開的專案；後續作品會繼續加入同一份清單。
  section#work-list.work-page-list(aria-label="作品列表")
    .work-filter-bar
      .work-filter-heading
        p.kicker 01 / WORK CATEGORIES
        h2 挑選作品<span class="period">．</span>
      form.work-search(role="search" @submit.prevent)
        label.sr-only(for="work-search-input") 搜尋作品
        input#work-search-input(v-model="query" type="search" placeholder="搜尋作品名稱、內容或類型" autocomplete="off" @input="updateQuery" @keydown.esc="clearQuery")
        button(v-if="query" type="button" aria-label="清除搜尋關鍵字" @click="clearQuery") 清除
      .work-category-tabs(role="group" aria-label="作品分類")
        button.work-category-tab(v-for="item in projectCategories" :key="item.id" type="button" :class="{ 'is-active': category === item.id }" :aria-pressed="category === item.id" @click="selectCategory(item.id)") {{ item.label }}
    p.work-result-count(v-if="query.trim()") 符合「{{ query.trim() }}」的 {{ filteredProjects.length }} 件作品
    p.work-result-count(v-else) {{ filteredProjects.length }} 件作品
    .project-grid(v-if="visibleProjects.length")
      ProjectCard(v-for="(project, index) in visibleProjects" :key="project.id" :project="project" :index="(page - 1) * PROJECTS_PER_PAGE + index" :total="filteredProjects.length" :page="page" :selected-category="category" :query="query")
    .work-empty(v-else)
      template(v-if="query.trim()")
        p.kicker SEARCH / NO RESULTS
        h3 找不到符合「{{ query.trim() }}」的作品<span class="period">．</span>
        p 試試其他關鍵字，或清除搜尋查看目前分類的所有作品。
        button.text-link(type="button" @click="clearQuery") 清除搜尋 ↗
      template(v-else)
        p.kicker SELECTED WORK / COMING SOON
        h3 這類作品正在整理中<span class="period">．</span>
        p 先看看其他分類，新的作品會陸續加入。
        button.text-link(type="button" @click="selectCategory('all')") 查看全部作品 ↗
    PaginationNav(:page="page" :count="count" :href-for-page="pageHref" @change="changePage")
  a.text-link.work-page-back(href="/") ← 回首頁
</template>

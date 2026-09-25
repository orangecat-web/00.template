<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PaginationNav from './components/PaginationNav.vue'
import ProjectCard from './components/ProjectCard.vue'
import SiteLayout from './components/SiteLayout.vue'
import { filterProjects, projectCategories, projects, resolveProjectCategory, workListUrl } from './data/projects.js'
import { clampPage, pageSlice, PROJECTS_PER_PAGE, totalPages } from './utils/pagination.js'

function stateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const category = resolveProjectCategory(params.get('category'))
  return { category, page: clampPage(params.get('page'), filterProjects(projects, category).length) }
}

const layout = ref(null)
const initialState = stateFromUrl()
const category = ref(initialState.category)
const page = ref(initialState.page)
const filteredProjects = computed(() => filterProjects(projects, category.value))
const count = computed(() => totalPages(filteredProjects.value.length))
const visibleProjects = computed(() => pageSlice(filteredProjects.value, page.value))
const pageHref = (nextPage) => workListUrl({ category: category.value, page: nextPage })

function updateList(nextCategory, nextPage) {
  if (nextCategory === category.value && nextPage === page.value) return
  category.value = nextCategory
  page.value = nextPage
  window.history.pushState(null, '', workListUrl({ category: nextCategory, page: nextPage }))
  layout.value?.goTo('work-list')
}

function changePage(nextPage) {
  if (nextPage < 1 || nextPage > count.value) return
  updateList(category.value, nextPage)
}

function selectCategory(nextCategory) { updateList(nextCategory, 1) }
function onPopState() {
  const next = stateFromUrl()
  category.value = next.category
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
      .work-category-tabs(role="group" aria-label="作品分類")
        button.work-category-tab(v-for="item in projectCategories" :key="item.id" type="button" :class="{ 'is-active': category === item.id }" :aria-pressed="category === item.id" @click="selectCategory(item.id)") {{ item.label }}
    p.work-result-count {{ filteredProjects.length }} 件作品
    .project-grid(v-if="visibleProjects.length")
      ProjectCard(v-for="(project, index) in visibleProjects" :key="project.id" :project="project" :index="(page - 1) * PROJECTS_PER_PAGE + index" :total="filteredProjects.length" :page="page" :selected-category="category")
    .work-empty(v-else)
      p.kicker SELECTED WORK / COMING SOON
      h3 這類作品正在整理中<span class="period">．</span>
      p 先看看其他分類，新的作品會陸續加入。
      button.text-link(type="button" @click="selectCategory('all')") 查看全部作品 ↗
    PaginationNav(:page="page" :count="count" :href-for-page="pageHref" @change="changePage")
  a.text-link.work-page-back(href="/") ← 回首頁
</template>

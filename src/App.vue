<script setup>
import { ref } from 'vue'
import HeroCarousel from './components/HeroCarousel.vue'
import ExperienceTimeline from './components/ExperienceTimeline.vue'
import ProjectCard from './components/ProjectCard.vue'
import SiteLayout from './components/SiteLayout.vue'
import { mediaItems } from './data/media.js'
import experience from './data/experience.js'
import { featuredProjects } from './data/projects.js'

const layout = ref(null)
const heroPhotos = mediaItems.filter((item) => item.type === 'image')
function goTo(id) { layout.value?.goTo(id) }
</script>

<template lang="pug">
SiteLayout(ref="layout" page-id="home")
  section.hero.shell(aria-labelledby="hero-title")
    .hero-copy
      p.kicker
        span.kicker-line
        | HONG-CANG CHEN / ORANGE CAT
      h1#hero-title 從視覺設計，<br>走進前端實作<span class="period">．</span>
      p.hero-lead 我是陳泓蒼，擅長網站視覺、前端頁面製作與商品攝影。這裡收錄實際網站作品，也讓你親手操作我用 Vue 3、Pug、Sass 與原生 JavaScript 製作的互動效果。
      .hero-actions
        a.pill.pill-primary(href="#work" @click.prevent="goTo('work')") 看精選作品
          span(aria-hidden="true") ↗
        a.pill.pill-outline(href="#services" @click.prevent="goTo('services')") 看合作服務
      .hero-footnote
        span FRONT-END
        span PHOTOGRAPHY
        span WEB DESIGN
    HeroCarousel(:photos="heroPhotos")
  section#work.work-section(aria-labelledby="work-title")
    .shell
      .section-heading
        div
          p.kicker 01 / SELECTED WORK
          h2#work-title 設計與實作，<br>都有作品可看<span class="period">．</span>
        p.section-description 從真實網站到正在製作的 Vue 3 互動樣版，每件作品都有不同的任務與觀看方式。先挑三件，帶你認識我的工作。
      .project-grid
        ProjectCard(v-for="(project, index) in featuredProjects" :key="project.id" :project="project" :index="index" :total="featuredProjects.length")
      .section-tail
        a.text-link(href="/work.html") 查看全部作品 ↗
  section#services.services-section(aria-labelledby="services-title")
    .shell.services-grid
      .services-intro
        p.kicker 02 / WHAT I DO
        h2#services-title 網站、影像與視覺，<br>讓想法完整落地<span class="period">．</span>
        p 從畫面規劃、前端製作到商品影像，能依專案需要組合。想評估合作方向，可先從相關作品開始看。
        a.text-link(href="#work" @click.prevent="goTo('work')") 看作品與實作 ↗
      .service-list
        article.service-item
          span.service-number 01
          div
            h3 網站視覺與前端製作
            p 形象網站、活動頁與商品頁的視覺規劃、響應式切版和互動實作。
          span.service-icon(aria-hidden="true") ↗
        article.service-item
          span.service-number 02
          div
            h3 既有網站改版
            p 整理內容層級與共用元件，讓既有網站更容易閱讀與維護。
          span.service-icon(aria-hidden="true") ↗
        article.service-item
          span.service-number 03
          div
            h3 商品攝影與視覺素材
            p 以商品影像與平面視覺，補足網站展示需要的素材與品牌氛圍。
          span.service-icon(aria-hidden="true") ↗
  section#experience.experience-section(aria-labelledby="experience-title")
    .shell
      .experience-heading
        p.kicker 03 / EXPERIENCE
        h2#experience-title 從視覺到前端，<br>一路累積的實作<span class="period">．</span>
        p 從近期工作一路回看，點選年份，看看平面設計、攝影與前端製作如何串成一條線。
      ExperienceTimeline(:items="experience")
  section#lab.lab-teaser(aria-labelledby="lab-title")
    .shell.lab-teaser-grid
      div
        p.kicker 04 / INTERACTIVE LAB
        h2#lab-title 設計之後，<br>讓互動自己說話<span class="period">．</span>
        p.lab-teaser-copy 輪播、影像濾鏡、選單動態與媒體檢視，都可以在獨立的實驗室直接操作。這些是從舊版樣版移植、重新組合的 Vue 3 元件。
        a.pill.pill-primary(href="/lab.html") 進入互動實驗室 ↗
      .lab-teaser-list
        a(href="/lab.html#effects")
          span 01 / IMAGE EFFECTS
          strong 影像濾鏡與疊色
          span(aria-hidden="true") ↗
        a(href="/lab.html#nav-demo")
          span 02 / NAV MOTION
          strong 四方向 × 兩種動態
          span(aria-hidden="true") ↗
        a(href="/lab.html#gallery")
          span 03 / MEDIA VIEWER
          strong 圖文卡片與媒體檢視
          span(aria-hidden="true") ↗
  section#about.about-section(aria-labelledby="about-title")
    .shell.about-grid
      div
        p.kicker 05 / ABOUT THE MAKER
        h2#about-title 跨越視覺與程式，<br>把細節做完整<span class="period">．</span>
      .about-copy
        p 我從平面、攝影與網站視覺一路做到前端頁面製作。這個 Vue 3 樣版沿用過去累積的 Pug 與 Sass 工具，並以 Vue 狀態及瀏覽器原生 API 處理互動；實際專案與互動實驗分別呈現，讓設計思考和製作能力都能被看見。
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
          a(href="https://orangecat-design.wixsite.com/cang" target="_blank" rel="noopener noreferrer") 攝影與平面作品 ↗
</template>

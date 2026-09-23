<script setup>
import { computed } from 'vue'
import { useOffcanvas } from '../composables/useOffcanvas.js'
import { usePageScroll } from '../composables/usePageScroll.js'
import { navigationFor } from '../data/navigation.js'

const props = defineProps({
  pageId: { type: String, required: true },
  brandCaption: { type: String, default: '' },
  footerText: { type: String, default: '' },
})
const isHome = computed(() => props.pageId === 'home')
const links = computed(() => navigationFor(props.pageId))

const {
  side: navSide, mode: navMode, isOpen: menuOpen, isVisible: navVisible,
  panel: menuPanel, closeButton: menuCloseButton,
  open: openMenu, close: closeMenu, toggle: toggleMenu,
  setSide: setNavSide, setMode: setNavMode,
} = useOffcanvas()
const { headerLow, showGoTop, goTo: scrollToSection } = usePageScroll()
const year = new Date().getFullYear()

function goTo(id) {
  closeMenu({ immediate: true, restoreFocus: false })
  scrollToSection(id)
}

function navigate(event, href) {
  if (href.startsWith('#')) {
    event.preventDefault()
    goTo(href.slice(1))
  } else {
    closeMenu({ immediate: true, restoreFocus: false })
  }
}

defineExpose({ goTo, navSide, navMode, menuOpen, openMenu, setNavSide, setNavMode })
</script>

<template lang="pug">
div#top(:class="[isHome ? 'site' : 'standard-page', { 'nav-pushed': navVisible && navMode === 'push' }]" :data-nav-side="navSide")
  header.header(:class="[isHome ? 'site-header' : 'standard-header', { headerlow: headerLow }]")
    div(:class="isHome ? 'shell header-inner' : 'page-shell header-row'")
      a(:class="isHome ? 'brand' : 'standard-brand'" :href="isHome ? '#top' : '/'" :aria-label="isHome ? 'Orange Cat 回到頁首' : 'Orange Cat 回首頁'" @click="isHome ? navigate($event, '#top') : undefined")
        img(src="/images/logo.svg" alt="Orange Cat")
        span(v-if="!isHome") {{ brandCaption }}
      span.header-caption(v-if="isHome") VISUAL DESIGN / FRONT-END
      button.menu-button(type="button" :aria-expanded="menuOpen" aria-controls="site-nav" aria-label="切換導覽選單" @click="toggleMenu($event)")
        span
        span
      Teleport(to="body" :disabled="!menuOpen")
        nav#site-nav.site-nav.offcanvas-panel(ref="menuPanel" :class="{ 'is-open': menuOpen, 'is-visible': navVisible }" :data-side="navSide" aria-label="主要導覽")
          button.offcanvas-close(v-if="menuOpen" ref="menuCloseButton" type="button" aria-label="關閉導覽選單" @click="closeMenu()") ×
          a(v-for="link in links" :key="link.href" :href="link.href" @click="navigate($event, link.href)") {{ link.label }}
        button.nav-scrim(v-if="menuOpen" type="button" tabindex="-1" aria-label="關閉導覽選單" :class="{ 'is-visible': navVisible }" @click="closeMenu()")
  main(:class="isHome ? null : 'page-shell'")
    slot
  footer.site-footer
    .shell.footer-inner
      span © {{ year }} orangeCat's photography
      span VUE 3 / PUG / SASS / VANILLA JS
      a(href="#top" @click.prevent="goTo('top')") BACK TO TOP ↑
  Transition(name="back-to-top")
    button.back-to-top.goTop(v-if="showGoTop" type="button" aria-label="回到頁首" @click="goTo('top')")
      img(src="/images/btn_gotop.svg" alt="")
</template>

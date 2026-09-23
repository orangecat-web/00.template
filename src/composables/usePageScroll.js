import { onMounted, onUnmounted, ref } from 'vue'

// 首頁與圖示頁共用：header 縮小、回頁首顯示，以及 600ms 的定位捲動。
export function usePageScroll({ duration = 600, headerOffset = 80 } = {}) {
  const headerLow = ref(false)
  const showGoTop = ref(false)
  let scrollFrame = 0

  function updateScroll() {
    headerLow.value = window.scrollY > 350
    showGoTop.value = window.scrollY > 200
  }

  function scrollToPosition(top) {
    if (scrollFrame) cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
    const destination = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight))
    if (Math.abs(destination - window.scrollY) < 1) return
    const start = window.scrollY
    const distance = destination - start
    let startTime

    function animate(time) {
      if (startTime === undefined) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      const eased = (1 - Math.cos(Math.PI * progress)) / 2
      window.scrollTo(0, start + distance * eased)
      if (progress < 1) scrollFrame = requestAnimationFrame(animate)
      else scrollFrame = 0
    }

    scrollFrame = requestAnimationFrame(animate)
  }

  function goTo(id) {
    const target = id === 'top' ? null : document.getElementById(id)
    if (id !== 'top' && !target) return
    // 推擠模式會平移整頁；以頁面根節點為基準，避免把 nav 的位移算進目標位置。
    const pageTop = document.getElementById('top')?.getBoundingClientRect().top ?? -window.scrollY
    const top = target ? target.getBoundingClientRect().top - pageTop - headerOffset : 0
    scrollToPosition(top)
  }

  onMounted(() => {
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
  })
  onUnmounted(() => {
    window.removeEventListener('scroll', updateScroll)
    if (scrollFrame) cancelAnimationFrame(scrollFrame)
  })

  return { headerLow, showGoTop, goTo }
}

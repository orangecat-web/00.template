import { onMounted, onUnmounted, ref } from 'vue'

// 首頁與圖示頁共用：header 縮小、回頁首顯示，以及 600ms 的定位捲動。
export function usePageScroll({ duration = 600, headerOffset = 80 } = {}) {
  const headerLow = ref(false)
  const showGoTop = ref(false)
  let scrollFrame = 0

  function updateScroll() {
    // 短頁面的 header 縮小會改變可捲動高度；留出回復區間，避免在 350px 反覆切換。
    headerLow.value = headerLow.value ? window.scrollY > 310 : window.scrollY > 350
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

  function positionInitialHash() {
    if (!window.location.hash) return
    let id
    try { id = decodeURIComponent(window.location.hash.slice(1)) }
    catch { return }
    const target = document.getElementById(id)
    if (!target) return
    window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - headerOffset)
    updateScroll()
  }

  onMounted(() => {
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    if (document.readyState === 'complete') requestAnimationFrame(positionInitialHash)
    else window.addEventListener('load', positionInitialHash, { once: true })
  })
  onUnmounted(() => {
    window.removeEventListener('scroll', updateScroll)
    window.removeEventListener('load', positionInitialHash)
    if (scrollFrame) cancelAnimationFrame(scrollFrame)
  })

  return { headerLow, showGoTop, goTo }
}

import { nextTick, onMounted, onUnmounted, ref } from 'vue'

export const offcanvasSides = ['left', 'right', 'top', 'bottom']
export const offcanvasModes = ['overlay', 'push']

// 一份導覽 DOM 即可在不同方向與模式之間切換，無需 jQuery。
export function useOffcanvas({ initialSide = 'left', initialMode = 'overlay', duration = 380 } = {}) {
  const side = ref(initialSide)
  const mode = ref(initialMode)
  const isOpen = ref(false)
  const isVisible = ref(false)
  const panel = ref(null)
  const closeButton = ref(null)
  let opener = null
  let previousOverflow = ''
  let frame = 0
  let closingTimer = 0

  function setSide(value) {
    if (offcanvasSides.includes(value) && !isOpen.value) side.value = value
  }

  function setMode(value) {
    if (offcanvasModes.includes(value) && !isOpen.value) mode.value = value
  }

  async function open(trigger) {
    if (isOpen.value) return
    opener = trigger?.currentTarget ?? trigger ?? document.activeElement
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    isOpen.value = true
    await nextTick()
    if (!isOpen.value) return
    panel.value?.getBoundingClientRect() // 先套用關閉位置，再開始 CSS transition
    frame = requestAnimationFrame(() => {
      isVisible.value = true
      nextTick(() => closeButton.value?.focus())
    })
  }

  function close({ immediate = false, restoreFocus = true } = {}) {
    if (!isOpen.value) return
    cancelAnimationFrame(frame)
    clearTimeout(closingTimer)
    isVisible.value = false

    function finish() {
      isOpen.value = false
      document.body.style.overflow = previousOverflow
      if (restoreFocus) nextTick(() => opener?.focus?.())
    }

    if (immediate) finish()
    else closingTimer = window.setTimeout(finish, duration)
  }

  function toggle(trigger) {
    if (isOpen.value) close()
    else open(trigger)
  }

  function onKeydown(event) {
    if (!isOpen.value) return
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
    if (event.key !== 'Tab') return
    const items = [...(panel.value?.querySelectorAll('a[href], button:not([disabled])') ?? [])]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    cancelAnimationFrame(frame)
    clearTimeout(closingTimer)
    if (isOpen.value) document.body.style.overflow = previousOverflow
  })

  return { side, mode, isOpen, isVisible, panel, closeButton, open, close, toggle, setSide, setMode }
}

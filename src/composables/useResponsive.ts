import { onMounted, onUnmounted, ref } from 'vue'

const MOBILE_QUERY = '(max-width: 768px)'
const TABLET_QUERY = '(max-width: 1024px)'

export function useResponsive() {
  const isMobile = ref(false)
  const isTablet = ref(false)

  let mobileMedia: MediaQueryList | null = null
  let tabletMedia: MediaQueryList | null = null

  const sync = () => {
    isMobile.value = mobileMedia?.matches ?? false
    isTablet.value = tabletMedia?.matches ?? false
  }

  onMounted(() => {
    mobileMedia = window.matchMedia(MOBILE_QUERY)
    tabletMedia = window.matchMedia(TABLET_QUERY)
    sync()
    mobileMedia.addEventListener('change', sync)
    tabletMedia.addEventListener('change', sync)
  })

  onUnmounted(() => {
    mobileMedia?.removeEventListener('change', sync)
    tabletMedia?.removeEventListener('change', sync)
  })

  return {
    isMobile,
    isTablet,
  }
}

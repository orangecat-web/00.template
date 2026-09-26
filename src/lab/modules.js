import moduleData from '../data/lab.json'
import CarouselDemo from './CarouselDemo.vue'
import ImageEffectsDemo from './ImageEffectsDemo.vue'
import MediaGalleryDemo from './MediaGalleryDemo.vue'
import NavMotionDemo from './NavMotionDemo.vue'
import PanoramaDemo from './PanoramaDemo.vue'

// 顯示內容在 JSON；Vue 元件參照只能在 JS 註冊。
const demoComponents = {
  effects: ImageEffectsDemo,
  'nav-demo': NavMotionDemo,
  gallery: MediaGalleryDemo,
  carousel: CarouselDemo,
  panorama: PanoramaDemo,
}

export const labModules = moduleData.map((module) => ({
  ...module,
  component: demoComponents[module.id],
}))

export const availableLabModules = labModules.filter((module) => module.component)

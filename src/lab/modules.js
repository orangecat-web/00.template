import CarouselDemo from './CarouselDemo.vue'
import ImageEffectsDemo from './ImageEffectsDemo.vue'
import MediaGalleryDemo from './MediaGalleryDemo.vue'
import NavMotionDemo from './NavMotionDemo.vue'
import PanoramaDemo from './PanoramaDemo.vue'

// 新增展示：建立獨立 Demo 元件，再在這裡加入一筆設定即可出現在導覽與頁面。
// 尚未完成的想法先保留規格，不輸出成無法操作的展示。
export const labModules = [
  {
    id: 'effects',
    eyebrow: 'IMAGE EFFECTS',
    label: '影像濾鏡與疊色',
    title: ['同一張影像，', '多種觀看方式'],
    description: '選擇濾鏡、切換疊色，看看同一張影像如何即時變化。',
    component: ImageEffectsDemo,
  },
  {
    id: 'nav-demo',
    eyebrow: 'NAV MOTION',
    label: '選單動態',
    title: ['同一份導覽，', '八種出場方式'],
    description: '四個方向、覆蓋與推擠兩種模式，桌面和手機共用同一份選單。',
    component: NavMotionDemo,
  },
  {
    id: 'gallery',
    eyebrow: 'MEDIA & LIGHTBOX',
    label: '媒體檢視',
    title: ['圖片與文字，', '換個方式相遇'],
    description: '分類、圖文卡片與媒體檢視都能操作；同一檢視器也能展示影片與地圖。',
    component: MediaGalleryDemo,
  },
  {
    id: 'carousel',
    eyebrow: 'IMAGE CAROUSEL',
    label: '左右滑動輪播',
    title: ['同一組照片，', '換個節奏觀看'],
    description: '首頁使用的輪播也在此開放操作：切換方向、暫停播放，或用手指滑動。',
    component: CarouselDemo,
  },
  { id: 'pagination', eyebrow: 'PAGINATION', label: '分頁', status: 'planned' },
  {
    id: 'panorama',
    eyebrow: '360° PANORAMA',
    label: '360 環景',
    title: ['轉個角度，', '讓空間自己說話'],
    description: '拖曳探索周圍、縮放視野並切換場景；這裡先展示輕量的環景基礎。',
    component: PanoramaDemo,
  },
]

export const availableLabModules = labModules.filter((module) => module.component)

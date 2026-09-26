import mountainLake from '../assets/panoramas/mountain-lake.svg'
import designStudio from '../assets/panoramas/design-studio.svg'

// 換成自己的 2:1 等距柱狀全景影像即可；場景數量與順序不寫在檢視器裡。
export const panoramaScenes = [
  {
    id: 'mountain-lake',
    label: '山間湖景',
    src: mountainLake,
    description: '以向量繪製的示範環景，用來展示 360° 球面觀看與縮放。',
    initialYaw: 0,
    initialPitch: 0,
  },
  {
    id: 'design-studio',
    label: '設計展間',
    src: designStudio,
    description: '第二個示範場景，展示同一個檢視器切換素材。',
    initialYaw: 35,
    initialPitch: 0,
  },
]

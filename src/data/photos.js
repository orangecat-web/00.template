import catPair from '../assets/photos/IMG_8157.JPG'
import catPortrait from '../assets/photos/IMG_8167.JPG'
import entry from '../assets/photos/IMG_8236.JPG'
import room from '../assets/photos/IMG_8242.JPG'
import overhead from '../assets/photos/IMG_8249.JPG'

// 舊版 upload/ 的實際照片，作為版型與效果展示素材。
export const photos = [
  { id: 1, category: 'cats', categoryLabel: 'CAT PORTRAIT', title: '午後雙貓', description: '影像、留白與標題的組合。', alt: '兩隻橘白色貓咪窩在沙發上', src: catPair },
  { id: 2, category: 'cats', categoryLabel: 'CAT PORTRAIT', title: '盆裡的好奇心', description: '圖像裁切與滑入疊層效果。', alt: '一隻橘白色貓咪坐在圓形容器裡', src: catPortrait },
  { id: 3, category: 'spaces', categoryLabel: 'SPACE STUDY', title: '走向光的角落', description: '直式影像的節奏與比例。', alt: '室內走廊通向明亮的洗手台空間', src: entry },
  { id: 4, category: 'spaces', categoryLabel: 'SPACE STUDY', title: '日常場景', description: '空間影像與資訊層級。', alt: '有床、書桌和小廚具的房間', src: room },
  { id: 5, category: 'spaces', categoryLabel: 'SPACE STUDY', title: '俯視的構圖', description: '同一空間，不同取景方式。', alt: '由上往下拍攝床與書桌的室內場景', src: overhead },
]

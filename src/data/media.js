import catPair from "../assets/photos/IMG_8157.JPG";
import catPortrait from "../assets/photos/IMG_8167.JPG";
import entry from "../assets/photos/IMG_8236.JPG";
import room from "../assets/photos/IMG_8242.JPG";
import overhead from "../assets/photos/IMG_8249.JPG";

// 分類會依 mediaItems 中實際使用的 category 自動顯示。
export const mediaCategoryNames = {
  cats: "貓咪肖像",
  spaces: "空間攝影",
  videos: "影片",
  places: "地點",
};

// 每筆 id 必須唯一。src 是燈箱的內容；非圖片項目可用 poster 當卡片封面。
// 舊版 upload/ 的照片用於版型與效果展示。
export const mediaItems = [
  {
    id: 1,
    type: "image",
    category: "cats",
    categoryLabel: "CAT PORTRAIT",
    title: "午後雙貓",
    caption: "影像、留白與標題的組合。",
    alt: "兩隻橘白色貓咪窩在沙發上",
    src: catPair,
  },
  {
    id: 2,
    type: "image",
    category: "cats",
    categoryLabel: "CAT PORTRAIT",
    title: "盆裡的好奇心",
    caption: "圖像裁切與滑入疊層效果。",
    alt: "一隻橘白色貓咪坐在圓形容器裡",
    src: catPortrait,
  },
  {
    id: 3,
    type: "image",
    category: "spaces",
    categoryLabel: "SPACE STUDY",
    title: "走向光的角落",
    caption: "直式影像的節奏與比例。",
    alt: "室內走廊通向明亮的洗手台空間",
    src: entry,
  },
  {
    id: 4,
    type: "image",
    category: "spaces",
    categoryLabel: "SPACE STUDY",
    title: "日常場景",
    caption: "空間影像與資訊層級。",
    alt: "有床、書桌和小廚具的房間",
    src: room,
  },
  {
    id: 5,
    type: "image",
    category: "spaces",
    categoryLabel: "SPACE STUDY",
    title: "俯視的構圖",
    caption: "同一空間，不同取景方式。",
    alt: "由上往下拍攝床與書桌的室內場景",
    src: overhead,
  },

  // 影片與地圖示範沒有封面時，GalleryCard 會顯示類型文字卡。
  {
    id: "film-1",
    type: "youtube",
    category: "videos",
    categoryLabel: "VIDEO",
    title: "YouTube 嵌入示範",
    caption: "影片與圖片共用同一個媒體檢視元件。",
    src: "https://www.youtube.com/watch?v=iyBqtc03b9M",
  },
  {
    id: "place-1",
    type: "map",
    category: "places",
    categoryLabel: "LOCATION",
    title: "Google 地圖嵌入示範",
    caption: "地圖也能從圖文卡片開啟與切換。",
    src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1300!2d120.292146!3d22.68234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346e059f55ca6d3b%3A0x6b5b827a9b90955c!2z5bem54ef5ZWf5piO5aCC!5e0!3m2!1szh-TW!2stw!4v1790189831097!5m2!1szh-TW!2stw",
  },
  // { id: 'clip-1', type: 'video', category: 'videos', categoryLabel: 'VIDEO', title: '本地影片', caption: '影片說明', src: '/videos/demo.mp4', poster: '/images/影片封面.jpg' },
];

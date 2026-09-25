import catPair from '../assets/photos/IMG_8157.JPG'

// 專案總清單。首頁只取 featured 的前三筆；作品頁顯示全部。
// 案例頁完成後，可把 href 換成站內專案網址。
export const projects = [
  {
    id: 'orange-cat-vue',
    featured: true,
    category: 'FRONT-END / VUE 3',
    title: 'Orange Cat · 互動樣版',
    summary: '從 oc-template 延伸的 Vue 3 實作：影像輪播、媒體檢視、動態導覽與 Sass 視覺效果。',
    role: '視覺設計、前端實作',
    href: '/lab.html#effects',
    linkLabel: '操作互動展示',
    cover: 'photo',
    image: catPair,
    imageAlt: '兩隻橘白貓咪坐在沙發上的攝影作品',
  },
  {
    id: 'bilingual-shop',
    featured: true,
    category: 'WEBSITE / REAL PROJECT',
    title: '雙語商業資源入口網',
    summary: '涵蓋雙語檢索、內容列表、主題資源與相簿的網站作品。',
    role: '既有網站作品',
    href: 'https://serv.gcis.nat.gov.tw/bilingualshop/tw/homepage',
    linkLabel: '查看上線網站',
    cover: 'bilingual',
  },
  {
    id: 'dish-life',
    featured: true,
    category: 'WEB / VISUAL DESIGN',
    title: 'DISH-LIFE 網站設計',
    summary: '以商品影像、色彩與資訊層次構成的商業網站視覺作品。',
    role: '網頁視覺設計',
    href: 'https://orangecat-design.wixsite.com/cang/webdesign',
    linkLabel: '查看設計作品',
    cover: 'dish',
  },
]

export const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)

// 全站唯一一組主導覽。首頁錨點在首頁改為 #id，以共用捲動動畫定位。
export const navigationItems = [
  { id: 'home', href: '/', label: '首頁' },
  { id: 'work', href: '/work.html', label: '作品一覽' },
  { id: 'services', href: '/#services', label: '合作服務' },
  { id: 'experience', href: '/#experience', label: '工作經歷' },
  { id: 'lab', href: '/lab.html', label: '互動實驗室' },
  { id: 'icons', href: '/icons.html', label: 'Google Icons' },
  { id: 'about', href: '/#about', label: '關於我' },
];

export function navigationFor(pageId) {
  return navigationItems.map((item) => {
    let href = item.href
    if (pageId === 'home' && href === '/') href = '#top'
    else if (pageId === 'home' && href.startsWith('/#')) href = href.slice(1)
    return { ...item, href, current: item.id === pageId }
  })
}

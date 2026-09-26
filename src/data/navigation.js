import navigationItems from './navigation.json'

// 首頁錨點轉為本頁定位，其他頁維持指向首頁。
export function navigationFor(pageId) {
  return navigationItems.map((item) => {
    let href = item.href
    if (pageId === 'home' && href === '/') href = '#top'
    else if (pageId === 'home' && href.startsWith('/#')) href = href.slice(1)
    return { ...item, href, current: item.id === pageId }
  })
}

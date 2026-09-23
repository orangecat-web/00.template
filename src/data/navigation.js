// 網站唯一的導覽清單。pageId 決定目前頁要顯示哪些連結。
// # 開頭是本頁區塊，會交給 SiteLayout 做 600ms 定位捲動。
export const navigationItems = [
  { pageId: "home", href: "#effects", label: "視覺效果" },
  { pageId: "home", href: "#gallery", label: "圖文列表" },
  { pageId: "home", href: "/icons.html", label: "Google Icons" },
  { pageId: "home", href: "#about", label: "關於這版" },
  { pageId: "icons", href: "/#effects", label: "視覺效果" },
  { pageId: "icons", href: "/#gallery", label: "圖文列表" },
  { pageId: "icons", href: "/icons.html", label: "Google Icons" },
  { pageId: "icons", href: "#guide", label: "使用方式" },
];

export function navigationFor(pageId) {
  return navigationItems.filter((item) => item.pageId === pageId);
}

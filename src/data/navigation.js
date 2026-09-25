// 網站唯一的導覽清單。pageId 決定目前頁要顯示哪些連結。
// # 開頭是本頁區塊，會交給 SiteLayout 做 600ms 定位捲動。
export const navigationItems = [
  { pageId: "home", href: "#work", label: "精選作品" },
  { pageId: "home", href: "#services", label: "合作服務" },
  { pageId: "home", href: "#experience", label: "工作經歷" },
  { pageId: "home", href: "/lab.html", label: "互動實驗室" },
  { pageId: "home", href: "#about", label: "關於我" },
  { pageId: "work", href: "/", label: "首頁" },
  { pageId: "work", href: "/lab.html", label: "互動實驗室" },
  { pageId: "work", href: "/#services", label: "合作服務" },
  { pageId: "work", href: "/#about", label: "關於我" },
  { pageId: "lab", href: "/", label: "首頁" },
  { pageId: "lab", href: "/work.html", label: "作品一覽" },
  { pageId: "lab", href: "#effects", label: "影像效果" },
  { pageId: "lab", href: "#gallery", label: "媒體檢視" },
  { pageId: "lab", href: "/icons.html", label: "Google Icons" },
  { pageId: "icons", href: "/", label: "首頁" },
  { pageId: "icons", href: "/work.html", label: "作品一覽" },
  { pageId: "icons", href: "/lab.html", label: "互動實驗室" },
  { pageId: "icons", href: "/icons.html", label: "Google Icons" },
  { pageId: "icons", href: "#guide", label: "使用方式" },
];

export function navigationFor(pageId) {
  return navigationItems.filter((item) => item.pageId === pageId);
}

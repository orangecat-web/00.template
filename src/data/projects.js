import { computed, reactive, ref } from "vue";
import snapshot from "./github-snapshot.json" with { type: "json" };
import { mergeGithubProjects } from "../utils/githubProjects.js";
import githubConfig from "./github.json" with { type: "json" };
import webProjects from "./projects-web.json" with { type: "json" };
import graphicProjects from "./projects-graphic.json" with { type: "json" };
import productPhotoProjects from "./projects-product-photo.json" with { type: "json" };

// 新增作品只需放進對應分類的 JSON；「全部作品」由前端合併。
export const projectCategories = [
  { id: "all", label: "全部作品" },
  { id: "frontend", label: "前端開發" },
  { id: "product-photo", label: "商品攝影" },
  { id: "web", label: "網頁設計" },
  { id: "graphic", label: "平面設計" },
];

const projectGroups = [
  ["web", webProjects],
  ["graphic", graphicProjects],
  ["product-photo", productPhotoProjects],
];

// ═══ 本地作品是基底；GitHub 快照／API 更新合併到同一份清單 ═══
const baseProjects = projectGroups.flatMap(([categoryId, items]) =>
  items.map((project) => ({
    ...project,
    categoryIds: [categoryId],
    ...(project.externalUrl && !project.externalLabel
      ? { externalLabel: "查看上線網站" }
      : {}),
  })),
);
// managed 模式只顯示 API 的已發布清單，失敗時不回退舊 JSON。
export const portfolioPreview = typeof window !== 'undefined' && new URLSearchParams(window.location?.search || '').get('preview') === '1';
export const portfolioPreviewReady = ref(false);
export const managedPortfolio = import.meta.env?.VITE_PORTFOLIO_MODE === 'managed' || portfolioPreview;
export const projects = reactive(managedPortfolio ? [] : mergeGithubProjects(baseProjects, snapshot.repositories, githubConfig));
export function replacePublishedProjects(items) {
  projects.splice(0, projects.length, ...[...items].sort((a,b)=>(a.sortOrder ?? 0)-(b.sortOrder ?? 0)));
  rebuildOrder();
}
export function updateGithubProjects(repositories) {
  if (managedPortfolio) return;
  projects.splice(
    0,
    projects.length,
    ...mergeGithubProjects(baseProjects, repositories, githubConfig),
  );
}

export const featuredProjects = computed(() => projects
  .filter(project => project.featured)
  .sort((a,b)=>(a.featuredOrder ?? 0)-(b.featuredOrder ?? 0))
  .slice(0,3));

// 同一分頁共用一個隨機種子，避免翻頁、進內頁再返回時作品跳位。
function sessionSeed() {
  const key = "portfolio-work-order-v1";
  try {
    const saved = window.sessionStorage.getItem(key);
    if (saved !== null) return Number(saved) >>> 0;
    const seed = Math.floor(Math.random() * 0x100000000);
    window.sessionStorage.setItem(key, String(seed));
    return seed;
  } catch {
    return Math.floor(Math.random() * 0x100000000);
  }
}

// ═══ 固定種子亂數：跨分頁維持全部作品排序 ═══
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const next = Math.floor(random() * (index + 1));
    const selected = shuffled[index];
    shuffled[index] = shuffled[next];
    shuffled[next] = selected;
  }
  return shuffled;
}

const orderSeed = sessionSeed();
const allOrder = new Map();
function rebuildOrder() {
  const random = seededRandom(orderSeed);
  const laboratory = projects.find(project => project.id === 'orange-cat-vue');
  const online = projects.filter(project => project !== laboratory && project.categoryIds.includes('web') && /^https?:\/\//i.test(project.externalUrl || ''));
  const others = projects.filter(project => project !== laboratory && !online.includes(project));
  allOrder.clear();
  [...(laboratory ? [laboratory] : []), ...shuffle(online,random), ...shuffle(others,random)].forEach((project,index)=>allOrder.set(project.id,index));
}
rebuildOrder();

// ═══ 分類驗證、篩選與搜尋 ═══
export function resolveProjectCategory(id) {
  return projectCategories.some((category) => category.id === id) ? id : "all";
}

export function filterProjects(items, categoryId) {
  return categoryId === "all"
    ? [...items].sort(
        (first, second) =>
          (allOrder.get(first.id) ?? Infinity) -
          (allOrder.get(second.id) ?? Infinity),
      )
    : items.filter((project) => project.categoryIds?.includes(categoryId));
}

export function searchProjects(items, query) {
  const keyword = query.trim().toLocaleLowerCase();
  if (!keyword) return items;

  return items.filter((project) =>
    [
      project.id,
      project.title,
      project.summary,
      project.role,
      project.category,
      project.githubRepository,
      ...(project.techTags || []),
      ...(project.categoryIds || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(keyword),
  );
}

// ═══ 站內網址：保留分類、關鍵字與返回頁碼 ═══
export function workListUrl({ category = "all", page = 1, query = "" } = {}) {
  const params = new URLSearchParams();
  const keyword = query.trim();
  if (keyword) params.set("q", keyword);
  if (category !== "all") params.set("category", category);
  if (page > 1) params.set("page", page);
  return `/work.html${params.size ? `?${params}` : ""}`;
}

export function projectUrl(
  project,
  { category = "all", page = 1, query = "" } = {},
) {
  const params = new URLSearchParams({ id: project.id });
  const keyword = query.trim();
  if (keyword) params.set("q", keyword);
  if (category !== "all") params.set("category", category);
  if (page > 1) params.set("from", page);
  return `/project.html?${params}`;
}

export function projectDestination(project, context = {}) {
  return { href: projectUrl(project, context), label: "查看作品內容" };
}

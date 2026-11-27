/**
 * 视图懒加载解析器：后端菜单只存相对路径（如 `goods/index`），
 * 这里映射成动态 import。显式表用于路径与文件名不一致的历史页面。
 */
const explicitViews: Record<string, () => Promise<unknown>> = {
  "shop/shopInfo": () => import("@/views/shop/shopInfo.vue"),
  "shop/addressManage": () => import("@/views/shop/addressManage.vue"),
};

export default (url: string): (() => Promise<unknown>) =>
  explicitViews[url] || (() => import(`@/views/${url}.vue`));

/**
 * 视图懒加载解析器：后端菜单只存相对路径（如 `goods/index`，即 `li_store_menu.front_route`），
 * 这里映射成动态 import。
 *
 * 命名约定：`front_route` 与 `views/` 下的文件路径保持一致（kebab-case）。
 * 显式表用于「菜单路径 ≠ 文件路径」的历史页面，新增页面请优先修正菜单数据而不是加映射。
 */
const explicitViews: Record<string, () => Promise<unknown>> = {
  // 商品发布/编辑三步页（菜单只记了入口名）
  "goods-operation": () => import("@/views/goods/goods-seller/goods-operation.vue"),
  // 消息中心
  message: () => import("@/views/message/message.vue"),
};

export default (url: string): (() => Promise<unknown>) =>
  explicitViews[url] || (() => import(`@/views/${url}.vue`));

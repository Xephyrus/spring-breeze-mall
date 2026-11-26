import type { Component } from "vue";

type AsyncView = () => Promise<Component | { default: Component }>;

// Vite 无 require.context，用 import.meta.glob 做按需视图加载
const viewModules = import.meta.glob("../views/**/*.vue") as Record<string, AsyncView>;

// 独立营销页面使用明确导入，保证新目录加入开发服务时能建立模块依赖。
const VIEW_LOADERS: Record<string, AsyncView> = {
  "promotions/lottery/LotteryManage": () =>
    import("@/views/promotions/lottery/lottery-manage.vue"),
};

/**
 * 后端菜单 frontRoute / 路由 path 与 views 实际路径不一致时的映射。
 * 与 router.ts 静态路由保持同步。
 */
const VIEW_ALIASES: Record<string, string> = {
  // 后端菜单里「分组节点」的 front_route 存的是 'Main'（对应布局组件），
  // 文件已统一为 kebab-case（Main.vue → main.vue），这里做兼容映射。
  Main: "main",
  main: "main",
  "custom-words/index": "custom-words/index",
  "sensitive-words/index": "sensitive-words/index",
  "sys/message/notice-message-template": "sys/message/message-template",
  noticeMessageTemplate: "sys/message/message-template",
  home: "home/home",
  "personal-center": "personal-center/personal-center",
  "change-password": "change-password/change-password",
  category: "goods/goods-manage/category",
  parameter: "goods/goods-manage/parameter",
  shop: "seller/shop/shop-list",
  "shop-detail": "seller/shop/shop-detail",
  "bill-detail": "seller/bill/bill-detail",
  "apply-goods": "goods/goods-info/goods-apply",
  "manager-goods": "goods/goods-info/goods",
  "goods-brand": "goods/goods-manage/brand",
  "goods-category": "goods/goods-manage/category",
  "goods-scheduled-upper": "goods/scheduled-upper/index",
  "goods-group": "goods/group/index",
  "goods-parameter": "goods/goods-manage/parameter",
  "goods-parameter-edit": "goods/goods-manage/parameter-edit",
  "order-complaint-detail": "order/after-order/order-complaint-detail",
  "order-list": "order/order/order-list",
  "order-detail": "order/order/order-detail",
  "wechat-order-list": "order/wechat/order-list",
  "appointment/work-orders": "appointment/work-order-list",
  "appointment/order-settings": "appointment/order-settings",
  "after-order-detail": "order/after-order/after-sale-order-detail",
  "shop-operation": "seller/shop/shop-operation",
  "member-detail": "member/list/member-detail",
  "member-group": "member/group/index",
  "member-grade": "member/grade/index",
  "member-benefit": "member/benefit/index",
  "paid-member-settings": "member/paid/settings",
  "payment-success-settings": "promotions/payment-success/index",
  "paid-member-records": "member/paid/records",
  "member-benefit-deliveries": "member/benefit/benefit-delivery-records",
  "member-grade-experience": "member/grade/experience-setting",
  "member-grade-experience-log": "member/grade/experience-log",
  "promotions/add-lottery-activity": "promotions/lottery/lottery-create",
  "promotions/add-points-goods": "promotions/points-goods/points-goods-add",
  "promotions/edit-points-goods": "promotions/points-goods/points-goods-edit",
  "promotions/add-kanJia-activity-goods": "promotions/kanjia/kanjia-activity-add-goods",
  "promotions/edit-kanJia-activity-goods": "promotions/kanjia/kanjia-activity-edit-goods",
  "promotions/manager-coupon": "promotions/coupon/coupon",
  "promotions/gift-card-cash": "promotions/gift-card-cash/gift-card-cash-activity",
  "promotions/add-gift-card-cash-activity":
    "promotions/gift-card-cash/gift-card-cash-activity-add",
  "promotions/edit-gift-card-cash-activity":
    "promotions/gift-card-cash/gift-card-cash-activity-add",
  "promotions/gift-card-cash-records": "promotions/gift-card-cash/gift-card-cash-records",
  "promotions/gift-card-cash-batch-credentials":
    "promotions/gift-card-cash/gift-card-cash-batch-credentials",
  "promotions/coupon-receive": "promotions/coupon/coupon-receive",
  "promotions/add-platform-coupon": "promotions/coupon/coupon-publish",
  "promotions/edit-platform-coupon": "promotions/coupon/coupon-publish",
  "promotions/add-coupon-activity": "promotions/coupon-activity/coupon-publish",
  "promotions/edit-coupon-activity": "promotions/coupon-activity/coupon-publish",
  "promotions/coupon-activity-info": "promotions/coupon-activity/coupon-info",
  "promotions/manager-pintuan": "promotions/pintuan/pintuan",
  "promotions/full-discount-detail": "promotions/full-discount/full-discount-detail",
  "promotions/seckill/manager-seckill-add": "promotions/seckill/seckill-add",
  "live-add": "live/add",
  "live-edit": "live/edit",
  "live-manage-detail": "live/detail",
  "live-control-panel": "live/control-panel",
  "live-detail": "promotions/live/live-detail",
  "finance-platform-report": "finance/platform-report",
  "finance-store-settlement": "finance/store-settlement",
  "finance-payment-method": "finance/payment-method",
  "finance-settlement-ledger": "finance/settlement-ledger",
  "finance-refund-log": "finance/refund-log",
  "finance-wallet-log": "finance/wallet-log",
  "article-edit": "page/article-manage/article-edit",
};

function viewKey(viewPath: string): string {
  return `../views/${viewPath}.vue`;
}

function findLoader(viewPath: string): AsyncView | undefined {
  if (VIEW_LOADERS[viewPath]) {
    return VIEW_LOADERS[viewPath];
  }
  // 依次尝试：原样 → 目录 index → 全小写 → 全小写 + index
  // 兜底历史菜单数据里残留的驼峰 front_route（如 'Main'、'shopList'），
  // 否则这类菜单会整页空白，只在控制台报 "view not found"
  const candidates = [
    viewPath,
    `${viewPath}/index`,
    viewPath.toLowerCase(),
    `${viewPath.toLowerCase()}/index`,
  ];
  for (const candidate of candidates) {
    const loader = viewModules[viewKey(candidate)];
    if (loader) return loader;
  }
  return undefined;
}

export default (url: string): AsyncView => {
  const viewPath = VIEW_ALIASES[url] || url;
  const loader = findLoader(viewPath);
  if (loader) {
    return loader;
  }
  console.error(`[lazyLoading] view not found: ${viewPath}`);
  return (
    viewModules[viewKey("error-page/404")] ||
    (() => Promise.reject(new Error(`View not found: ${viewPath}`)))
  );
};

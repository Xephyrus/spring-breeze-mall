import type { MenuRoute } from "@/types/menu";

/**
 * 商家导航的权限菜单检索及详情页归属；仅在已授权菜单中定位，不增加访问权限。
 *
 * @author Bulbasaur
 * @since 2026-11-08
 */

/** 展平后的导航项（带栏目与分组信息） */
export interface NavigationItem extends MenuRoute {
  name: string;
  title: string;
  topName: string;
  topTitle: string;
  groupTitle: string;
}

// 非菜单页面回到对应业务入口；多个候选项按实际已授权入口匹配
const DETAIL_MENUS: Record<string, string[]> = {
  "goods-operation-edit": ["goods"],
  "goods-template-operation-edit": ["template-goods"],
  "goods-draft-operation-edit": ["draftGoods", "draft-goods", "goods"],
  "card-key-pool": ["goods"],
  "add-coupon": ["coupon"],
  "coupon-receive": ["coupon"],
  "add-live": ["live"],
  "bill-detail": ["store-bill", "account-statement-bill"],
  "order-detail": ["order-list", "virtualOrderList"],
  "export-order-deliver": ["order-list"],
  "order-complaint-detail": ["order-complaint"],
  "return-goods-order-detail": ["return-goods-order", "return-money-order"],
  "full-discount-detail": ["full-discount", "full-cut"],
  "seckill-goods": ["seckill"],
  "pintuan-goods": ["pintuan"],
  "pintuan-edit": ["pintuan"],
  main: ["wap-list"],
  renovation: ["pcList"],
  "appointment-system-form-designer": ["appointment-system-forms"],
  "procurement-purchase-order-operation": ["procurement-purchase-order-list"],
  "procurement-inbound-operation": ["procurement-inbound-list"],
  "procurement-inventory-count-detail": ["procurement-inventory-count-list"],
  "procurement-damage-report-operation": ["procurement-damage-report-list"],
  "stock-outbound-operation": ["stock-outbound-list"],
};

/** 将权限树展开为带栏目与分组信息的可跳转菜单，用于搜索和路由定位 */
export function flattenNavigation(menus: MenuRoute[]): NavigationItem[] {
  return menus.flatMap((top) =>
    (top.children ?? []).flatMap((group) =>
      (group.children ?? [])
        .filter((leaf) => leaf.name && typeof leaf.component === "function")
        .map((leaf) => ({
          ...leaf,
          name: String(leaf.name),
          title: String(leaf.title ?? ""),
          topName: String(top.name ?? ""),
          topTitle: String(top.title ?? ""),
          groupTitle: String(group.title ?? ""),
        }))
    )
  );
}

const FULL_DISCOUNT_DETAIL_MENUS: Record<string, string[]> = {
  SINGLE_REDUCTION: [
    "store-single-reduction",
    "single-reduction",
    "full-discount",
    "full-cut",
  ],
  FULL_COUNT_MINUS: ["store-full-count-minus", "full-count-minus", "full-discount", "full-cut"],
  FULL_GIFT: ["store-full-gift", "full-gift", "full-discount", "full-cut"],
  FULL_RATE: ["store-full-rate", "full-rate", "full-discount", "full-cut"],
  FULL_MINUS: ["full-discount", "full-cut"],
};

function resolveDetailMenuCandidates(
  routeName: string,
  routeQuery: Record<string, unknown> = {}
): string[] {
  if (routeName === "full-discount-detail") {
    const type = routeQuery.activityType;
    if (typeof type === "string" && FULL_DISCOUNT_DETAIL_MENUS[type]) {
      return FULL_DISCOUNT_DETAIL_MENUS[type];
    }
  }
  return DETAIL_MENUS[routeName] || [];
}

/** 优先精确匹配菜单，再匹配详情页业务入口；无授权入口时返回空，不沿用旧账号栏目 */
export function findNavigationItem(
  items: NavigationItem[],
  routeName: string,
  routeQuery: Record<string, unknown> = {}
): NavigationItem | null {
  return (
    items.find((item) => item.name === routeName) ||
    resolveDetailMenuCandidates(routeName, routeQuery)
      .map((name) => items.find((item) => item.name === name || item.path === name))
      .find(Boolean) ||
    null
  );
}

/** 按菜单、分组和栏目检索，空格分隔的关键词须全部匹配 */
export function searchNavigation(
  items: NavigationItem[],
  keyword: string
): NavigationItem[] {
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const text = `${item.topTitle} ${item.groupTitle} ${item.title}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

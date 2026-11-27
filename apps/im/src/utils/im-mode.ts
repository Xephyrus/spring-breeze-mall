import type { RouteLocationNormalized } from "vue-router";

/**
 * IM 身份判断（与 main-mixin.loadUserSetting 一致）
 * - 买家从商城「联系客服」进入：URL 带 ?id=店铺ID
 * - 商家从商家后台进入：URL 无 id
 */
export function isBuyerImMode(route?: Pick<RouteLocationNormalized, "query">): boolean {
  return Boolean(route?.query?.id);
}

export function isStoreImMode(route?: Pick<RouteLocationNormalized, "query">): boolean {
  return !isBuyerImMode(route);
}

/** 从 URL query 同步 token（宿主页面跳转时带上 ?token=xxx） */
export function syncImTokenFromRoute(
  route: Pick<RouteLocationNormalized, "query"> | undefined,
  setTokenFn: (token: string) => void
): void {
  const token = route?.query?.token;
  if (typeof token === "string" && token) {
    setTokenFn(token);
  }
}

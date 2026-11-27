/**
 * 买家端内部链接跳转（首页装修、列表等共用）。
 *
 * 商品详情新开标签，其余站内页面在当前页打开；外链仍新开。
 */
import type { Router } from "vue-router";

const NEW_TAB_PATHS = ["/goodsDetail", "/pointGoodsDetail"];

function isExternalLink(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith("//");
}

function normalizeInternal(url: string): string {
  return url.charAt(0) === "/" ? url : `/${url}`;
}

function pathnameOf(url: string): string {
  return normalizeInternal(url).split("?")[0].split("#")[0];
}

export function shouldOpenNewTab(url: string): boolean {
  if (!url) return false;
  if (isExternalLink(url)) return true;
  const path = pathnameOf(url);
  return NEW_TAB_PATHS.indexOf(path) !== -1;
}

export function openLink(url: string, router: Router): void | Promise<unknown> {
  if (!url) return;
  if (isExternalLink(url)) {
    window.open(url, "_blank");
    return;
  }
  const internal = normalizeInternal(url);
  if (shouldOpenNewTab(internal)) {
    window.open(router.resolve(internal).href, "_blank");
    return;
  }
  return router.push(internal);
}

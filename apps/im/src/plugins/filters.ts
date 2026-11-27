import * as Foundation from "./Foundation";
import type { App } from "vue";

/**
 * 金额展示：2999 → 2,999.00
 *
 * @param val 金额
 * @param unit 单位前缀（如 ¥）
 * @param location before: 只取整数部分；after: 只取小数部分
 */
export function unitPrice(
  val?: number | string | null,
  unit?: string,
  location?: "before" | "after"
): string {
  const price = Foundation.formatPrice(val ?? 0);
  if (location === "before") {
    return price.substr(0, price.length - 3);
  }
  if (location === "after") {
    return price.substr(-2);
  }
  return (unit || "") + price;
}

/** 注册全局过滤器到 app.config.globalProperties.$filters */
export function setupFilters(app: App): void {
  app.config.globalProperties.$filters = {
    unitPrice,
  };
}

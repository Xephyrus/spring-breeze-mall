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

/** 处理 unix 时间戳（秒），转换为可阅读时间格式 */
export function unixToDate(unix?: number | null, format?: string): string {
  if (!unix) return "";
  let _format = format || "yyyy-MM-dd hh:mm:ss";
  const d = new Date(unix * 1000);
  const o: Record<string, number> = {
    "M+": d.getMonth() + 1,
    "d+": d.getDate(),
    "h+": d.getHours(),
    "m+": d.getMinutes(),
    "s+": d.getSeconds(),
    "q+": Math.floor((d.getMonth() + 3) / 3),
    S: d.getMilliseconds(),
  };
  if (/(y+)/.test(_format)) {
    _format = _format.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp("(" + k + ")").test(_format)) {
      _format = _format.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? String(o[k]) : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return _format;
}

/** 替换地址栏 逗号分隔为空格分隔 */
export function unitAddress(val?: string | null): string {
  if (!val) return "";
  return val.replace(/,/g, " ");
}

/** 13888888888 → 138****8888 */
export function secrecyMobile(mobile: string | number): string {
  const text = String(mobile);
  if (!/\d{11}/.test(text)) {
    return text;
  }
  return text.replace(/(\d{3})(\d{4})(\d{4})/, "$1****$3");
}

/** 商品在列表中的展示价格（单品立减用服务端活动价） */
export interface GoodsPriceLike {
  promotionMap?: Record<string, unknown>;
  promotionPrice?: number | string;
  price?: number | string;
}

export function goodsDisplayPrice(goods: GoodsPriceLike = {}): number | string | undefined {
  const hasSingle =
    goods.promotionMap &&
    Object.keys(goods.promotionMap).some((key) => key.startsWith("SINGLE_REDUCTION-"));
  return hasSingle && Number(goods.promotionPrice) > 0 ? goods.promotionPrice : goods.price;
}

/** 注册全局过滤器（$filters） */
export function setupFilters(app: App): void {
  app.config.globalProperties.$filters = {
    unitPrice,
    unixToDate,
    unitAddress,
    secrecyMobile,
    goodsDisplayPrice,
  };
}

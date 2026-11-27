/** 订单履约方式相关的展示与判断 */

/** 包裹是否可以「无需配送」 */
export interface FulfillmentPackage {
  fulfillmentMode?: string;
  logisticsRequired?: boolean;
  [key: string]: unknown;
}

export type FulfillmentMode = "WHOLE" | "SPLIT" | "NO_DELIVERY" | string;

export function isNoDeliveryPackage(pkg?: FulfillmentPackage | null): boolean {
  if (!pkg) return false;
  return pkg.fulfillmentMode === "NO_DELIVERY" || pkg.logisticsRequired === false;
}

export function isNoDeliveryOrder(packages?: FulfillmentPackage[] | null): boolean {
  if (!Array.isArray(packages) || !packages.length) return false;
  return packages.every(isNoDeliveryPackage);
}

export function getFulfillmentModeLabel(mode?: FulfillmentMode): string {
  const map: Record<string, string> = {
    WHOLE: "整单发货",
    SPLIT: "拆单发货",
    NO_DELIVERY: "无需配送",
  };
  return (mode && map[mode]) || mode || "-";
}

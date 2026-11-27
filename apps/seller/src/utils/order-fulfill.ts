/** 发货方式 */
export type FulfillmentMode = "WHOLE" | "SPLIT" | "NO_DELIVERY";

/** 电子卡券 / 虚拟商品类型 */
const NON_SHIPPABLE_ORDER_TYPES = ["E_COUPON", "VIRTUAL"];

/** 发货表单（拆单时 items 为勾选的商品） */
export interface FulfillForm {
  logisticsId?: string | number;
  logisticsNo?: string;
  deliveryRemark?: string;
  items?: Array<{ deliveryNum?: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** 电子卡券 / 虚拟 / 自提订单不适用商家发货 */
export function isNonShippableOrder(order: Record<string, unknown> = {}): boolean {
  if (!order) return false;
  if (NON_SHIPPABLE_ORDER_TYPES.includes(String(order.orderType))) return true;
  return order.deliveryMethod === "SELF_PICK_UP";
}

export function canShowShipButton(
  allowOperation: Record<string, unknown> = {},
  order: Record<string, unknown> = {}
): boolean {
  return Boolean(allowOperation.ship) && !isNonShippableOrder(order);
}

export const FULFILLMENT_MODE_LABEL: Record<FulfillmentMode, string> = {
  WHOLE: "整单发货",
  SPLIT: "拆单发货",
  NO_DELIVERY: "无需配送",
};

/** 校验发货表单，返回错误文案；通过返回 null */
export function validateFulfillForm(
  mode: FulfillmentMode,
  form: FulfillForm
): string | null {
  if (mode === "WHOLE" || mode === "SPLIT") {
    if (!form.logisticsId) return "请选择物流公司";
    if (!form.logisticsNo || !String(form.logisticsNo).trim()) return "请填写运单号";
  }
  if (mode === "NO_DELIVERY") {
    if (form.logisticsId || form.logisticsNo) return "无需配送不能填写物流信息";
    if (form.deliveryRemark && form.deliveryRemark.length > 500) {
      return "备注不能超过500字";
    }
  }
  if (mode === "SPLIT") {
    if (!form.items || !form.items.length) return "请至少选择一个商品";
    for (const item of form.items) {
      if (item.deliveryNum != null && item.deliveryNum <= 0) {
        return "发货数量必须大于0";
      }
    }
  }
  return null;
}

/** 包裹是否无需配送 */
export function isNoDeliveryPackage(pkg: Record<string, unknown> | null | undefined): boolean {
  if (!pkg) return false;
  return pkg.fulfillmentMode === "NO_DELIVERY" || pkg.logisticsRequired === false;
}

export function getFulfillmentModeLabel(mode: string): string {
  return FULFILLMENT_MODE_LABEL[mode as FulfillmentMode] || mode || "-";
}

/** 根据订单状态与可操作项推导默认发货方式 */
export function resolveDefaultFulfillmentMode(
  allowOperation: Record<string, unknown> = {},
  orderStatus?: string
): FulfillmentMode | null {
  if (orderStatus === "PARTS_DELIVERED") {
    return allowOperation.fulfillSplit ? "SPLIT" : null;
  }
  if (allowOperation.fulfillWhole) return "WHOLE";
  if (allowOperation.fulfillSplit) return "SPLIT";
  if (allowOperation.fulfillNoDelivery) return "NO_DELIVERY";
  return null;
}

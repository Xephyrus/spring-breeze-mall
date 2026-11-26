/**
 * 订单模块的 VO。
 *
 * 关键：**订单详情是一个「聚合对象」**（order + items + logs + priceDetail + 发票），
 * 字段很多，所以这里按后端 `OrderDetailVO` 的真实结构声明。
 */

/** 订单主表（详情里的 order 字段） */
export type OrderInfo = {
  id?: string | number;
  sn?: string;
  tradeSn?: string;
  parentOrderSn?: string;
  memberId?: string | number;
  memberName?: string;
  storeId?: string | number;
  storeName?: string;
  orderStatus?: string;
  payStatus?: string;
  deliverStatus?: string;
  orderType?: string;
  paymentMethod?: string;
  deductionMethod?: string;
  deliveryMethod?: string;
  clientType?: string;
  goodsNum?: number;
  goodsPrice?: number;
  freightPrice?: number;
  flowPrice?: number;
  discountPrice?: number;
  updatePrice?: number;
  weight?: number;
  consigneeName?: string;
  consigneeMobile?: string;
  consigneeDetail?: string;
  consigneeAddressPath?: string;
  consigneeAddressIdPath?: string;
  paymentTime?: string;
  payOrderNo?: string;
  completeTime?: string;
  logisticsCode?: string;
  logisticsName?: string;
  logisticsNo?: string;
  logisticsTime?: string;
  canReturn?: boolean;
  cancelReason?: string;
  remark?: string;
  sellerRemark?: string;
  createTime?: string;
  [key: string]: unknown;
};

/** 订单商品行 */
export type OrderItemInfo = {
  id?: string | number;
  orderSn?: string;
  sn?: string;
  goodsId?: string | number;
  skuId?: string | number;
  goodsName?: string;
  image?: string;
  specs?: string;
  num?: number;
  goodsPrice?: number;
  flowPrice?: number;
  unitPrice?: number;
  subTotal?: number;
  commentStatus?: string;
  afterSaleStatus?: string;
  isRefund?: string;
  refundPrice?: number;
  deliverNumber?: number;
  returnGoodsNumber?: number;
  cardKeyDelivered?: boolean;
  cardKeys?: Array<{ cardKey?: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

/** 订单操作日志 */
export type OrderLogInfo = {
  id?: string | number;
  message?: string;
  operatorId?: string | number;
  operatorName?: string;
  operatorType?: string;
  createTime?: string;
  [key: string]: unknown;
};

/** 订单可执行操作标记 */
export type OrderAllowOperation = {
  canCancel?: boolean;
  canPay?: boolean;
  canDeliver?: boolean;
  canComplete?: boolean;
  canComment?: boolean;
  canAfterSale?: boolean;
  [key: string]: unknown;
};

/** 发票信息 */
export type OrderReceipt = {
  receiptNo?: string;
  receiptTitle?: string;
  receiptType?: string;
  receiptContent?: string;
  [key: string]: unknown;
};

/** 订单详情（聚合） */
export type OrderDetail = {
  order?: OrderInfo;
  orderItems?: OrderItemInfo[];
  orderLogs?: OrderLogInfo[];
  receipt?: OrderReceipt;
  allowOperationVO?: OrderAllowOperation;
  priceDetail?: Record<string, unknown>;
  orderStatusValue?: string;
  payStatusValue?: string;
  paymentMethodValue?: string;
  deliverStatusValue?: string;
  deliveryMethodValue?: string;
  [key: string]: unknown;
};

/** 售后单详情 */
export type AfterSaleDetail = {
  id?: string | number;
  sn?: string;
  orderSn?: string;
  serviceType?: string;
  serviceStatus?: string;
  serviceName?: string;
  reason?: string;
  afterSaleImage?: string | string[];
  applyRefundPrice?: number | string;
  actualRefundPrice?: number | string;
  showDelivery?: boolean;
  auditRemark?: string;
  applyTime?: string;
  [key: string]: unknown;
};

/** 物流轨迹 */
export type LogisticsTrace = {
  time?: string;
  context?: string;
  status?: string;
  [key: string]: unknown;
};

/** 交易投诉详情 */
export type OrderComplainDetail = {
  id?: string | number;
  complainStatus?: string;
  orderSn?: string;
  memberName?: string;
  communicationList?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

/** 商家售后收货地址 */
export type StoreAfterSaleAddress = {
  consigneeName?: string;
  consigneeMobile?: string;
  consigneeAddressPath?: string;
  consigneeDetail?: string;
  [key: string]: unknown;
};

/** 订单/售后数量统计 */
export type OrderCountVO = {
  waitPayNum?: number;
  waitDeliveryNum?: number;
  waitEvaluateNum?: number;
  afterSaleNum?: number;
  [key: string]: unknown;
};

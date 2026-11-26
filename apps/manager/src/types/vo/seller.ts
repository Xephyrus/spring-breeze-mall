/**
 * 商家模块的 VO。
 *
 * 起点：`views/seller/bill/bill-detail.vue` 里 30+ 字段的结算单详情类型
 * 只在该文件里定义，api 层拿不到，`getBuyBillDetail` 因此没有返回类型。
 */

/** 结算单详情（字段较多，后端会扩容） */
export type BillDetail = {
  billStatus?: string;
  sn?: string;
  storeName?: string;
  startTime?: string | null;
  endTime?: string | null;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankCode?: string;
  payTime?: string | null;
  billPrice?: number;
  orderPrice?: number;
  siteCouponCommission?: number;
  pointSettlementPrice?: number;
  kanjiaSettlementPrice?: number;
  giftCardSubsidy?: number;
  distributionCommission?: number;
  commissionPrice?: number;
  refundPrice?: number;
  siteCouponRefundCommission?: number;
  pointRefundSettlementPrice?: number;
  kanjiaRefundSettlementPrice?: number;
  giftCardRefundSubsidy?: number;
  distributionRefundCommission?: number;
  refundCommissionPrice?: number;
  [key: string]: unknown;
};

/** 结算单流水行 */
export type BillFlowRow = {
  flowType?: string;
  pointSettlementPrice?: number;
  kanjiaSettlementPrice?: number;
  siteCouponCommission?: number;
  commissionPrice?: number;
  distributionRebate?: number;
  [key: string]: unknown;
};

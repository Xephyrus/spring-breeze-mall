/**
 * 管理端财务中心 API。
 * 导出类接口返回 blob，需配合 downloadBlob 触发浏览器下载。
 */
import { getRequest, postBlobRequest } from "@/libs/axios";
import type { Id } from '@/types/api';
import type { VoRow } from '@/types/vo/common';

/** 导出支付流水（筛选条件同 paymentLog 列表） */
export const exportPaymentFlow = (params?: Record<string, unknown>) => {
  return getRequest<Blob>("/finance/payment-flow/export", params, "blob");
};

/** 导出退款流水 */
export const exportRefundFlow = (params?: Record<string, unknown>) => {
  return getRequest<Blob>("/finance/refund-flow/export", params, "blob");
};

/** 导出钱包流水 */
export const exportWalletLog = (params?: Record<string, unknown>) => {
  return getRequest<Blob>("/finance/wallet-log/export", params, "blob");
};

/** 导出结算单列表（仅汇总行） */
export const exportBillList = (params?: Record<string, unknown>) => {
  return getRequest<Blob>("/finance/bill-list/export", params, "blob");
};

/** 批量下载结算单 ZIP */
export const batchDownloadBills = (billIds: Id | Id[]) => {
  return postBlobRequest("/finance/bill/batchDownload", billIds);
};

/** 平台经营报表查询 */
export const getPlatformReport = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/finance/report/platform", params);
};

/** 导出平台经营报表 */
export const exportPlatformReport = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/finance/report/platform/export", params, "blob");
};

/** 店铺结算汇总查询 */
export const getStoreSettlementReport = (params?: Record<string, unknown>) => {
  return getRequest("/finance/report/store-settlement", params);
};

/** 导出店铺结算汇总 */
export const exportStoreSettlementReport = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/finance/report/store-settlement/export", params, "blob");
};

/** 支付方式汇总查询 */
export const getPaymentMethodReport = (params?: Record<string, unknown>) => {
  return getRequest("/finance/report/payment-method", params);
};

/** 导出支付方式汇总 */
export const exportPaymentMethodReport = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/finance/report/payment-method/export", params, "blob");
};

/** 结算台账查询 */
export const getSettlementLedger = (params?: Record<string, unknown>) => {
  return getRequest("/finance/report/settlement-ledger", params);
};

/** 导出结算台账 */
export const exportSettlementLedger = (params?: Record<string, unknown>) => {
  return getRequest<Blob>("/finance/report/settlement-ledger/export", params, "blob");
};

/** 退款流水分页（财务中心页面复用） */
export const refundLogPage = (params?: Record<string, unknown>) => {
  return getRequest("/order/refundLog", params);
};

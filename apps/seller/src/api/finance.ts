/**
 * 商家端财务 API。
 * 所有接口由后端强制限定为当前登录店铺，无需前端传 storeId。
 */
import { getRequest } from "@/libs/axios";
import type { Query } from "@/types/api";

/** 导出本店流水明细 */
export const exportStoreFlow = (params: Query) => {
  return getRequest("/finance/store-flow/export", params, "blob");
};

/** 导出本店结算单列表 */
export const exportBillList = (params: Query) => {
  return getRequest("/finance/bill-list/export", params, "blob");
};

/** 本店周期财务汇总查询 */
export const getStoreSummary = (params: Query) => {
  return getRequest("/finance/report/store-summary", params);
};

/** 导出本店周期财务汇总 */
export const exportStoreSummary = (params: Query) => {
  return getRequest("/finance/report/store-summary/export", params, "blob");
};

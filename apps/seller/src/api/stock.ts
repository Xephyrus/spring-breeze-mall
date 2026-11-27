/**
 * 商家端库存管理 API（出库单与库存流水）
 * @author Bulbasaur
 * @since 2026-11-12
 */
import {
  getRequest,
  postRequest,
  putRequest,
} from "@/libs/axios";
import type { Query } from "@/types/api";

// ========== 出库单 ==========
export const getStockReasonList = (params: Query) => getRequest("/procurement/reason", params);
export const getStockOutboundPage = (params: Query) => getRequest("/stock/outbound", params);
export const getStockOutboundDetail = (id: string | number) => getRequest(`/stock/outbound/${id}`);
export const createStockOutbound = (params: Query) =>
  postRequest("/stock/outbound", params, { "Content-Type": "application/json" });
export const updateStockOutbound = (id: string | number, params: Query) =>
  putRequest(`/stock/outbound/${id}`, params, { "Content-Type": "application/json" });
export const submitStockOutbound = (id: string | number) => putRequest(`/stock/outbound/submit/${id}`);
export const auditStockOutbound = (id: string | number, params: Query) =>
  putRequest(`/stock/outbound/audit/${id}`, params, { "Content-Type": "application/json" });
export const cancelStockOutbound = (id: string | number) => putRequest(`/stock/outbound/cancel/${id}`);

// ========== 库存流水 ==========
export const getStockFlowPage = (params: Query) => getRequest("/stock/flow", params);

import {
  getRequest,
  postRequest,
  putRequest,
} from "@/libs/axios";
import type { Query } from "@/types/api";

// ========== 采购单 ==========
export const getProcurementOrderPage = (params: Query) => getRequest("/procurement/order", params);
export const getProcurementOrderStatusCount = (params: Query) => getRequest("/procurement/order/status-count", params);
export const getProcurementOrderDetail = (id: string | number) => getRequest(`/procurement/order/${id}`);
export const createProcurementOrder = (params: Query) =>
  postRequest("/procurement/order", params, { "Content-Type": "application/json" });
export const submitProcurementOrder = (id: string | number) => putRequest(`/procurement/order/submit/${id}`);
export const auditProcurementOrder = (id: string | number, params: Query) =>
  putRequest(`/procurement/order/audit/${id}`, params, { "Content-Type": "application/json" });
export const closeProcurementOrder = (id: string | number) => putRequest(`/procurement/order/close/${id}`);

// ========== 采购入库单 ==========
export const getProcurementInboundPage = (params: Query) => getRequest("/procurement/inbound", params);
export const getProcurementInboundDetail = (id: string | number) => getRequest(`/procurement/inbound/${id}`);
export const getProcurementInboundItems = (id: string | number) => getRequest(`/procurement/inbound/${id}/items`);
export const createProcurementInbound = (params: Query) =>
  postRequest("/procurement/inbound", params, { "Content-Type": "application/json" });

// ========== 盘点单 ==========
export const createInventoryCount = () => postRequest("/procurement/inventory-count");
export const getInventoryCountPage = (params: Query) => getRequest("/procurement/inventory-count/page", params);
export const getInventoryCountDetail = (id: string | number) => getRequest(`/procurement/inventory-count/${id}`);
export const getInventoryCountItemsPage = (id: string | number, params: Query) =>
  getRequest(`/procurement/inventory-count/${id}/items/page`, params);
export const downloadInventoryCountItems = (id: string | number) =>
  getRequest(`/procurement/inventory-count/${id}/download`);
export const exportInventoryCountItems = (id: string | number) =>
  getRequest(`/procurement/inventory-count/${id}/export`, {}, "blob");

// ========== 报损单 ==========
export const getDamageReportPage = (params: Query) => getRequest("/procurement/damage-report/page", params);
export const getDamageReportStatusCount = (params: Query) => getRequest("/procurement/damage-report/status-count", params);
export const getDamageReportDetail = (id: string | number) => getRequest(`/procurement/damage-report/${id}`);
export const getDamageReportItems = (id: string | number) => getRequest(`/procurement/damage-report/${id}/items`);
export const createDamageReport = (params: Query) =>
  postRequest("/procurement/damage-report", params, { "Content-Type": "application/json" });
export const submitDamageReport = (id: string | number) => putRequest(`/procurement/damage-report/${id}/submit`);
export const approveDamageReport = (id: string | number) => putRequest(`/procurement/damage-report/${id}/approve`);
export const rejectDamageReport = (id: string | number, remark: Query) =>
  putRequest(`/procurement/damage-report/${id}/reject?remark=${encodeURIComponent(String(remark || ""))}`);
export const cancelDamageReport = (id: string | number) => putRequest(`/procurement/damage-report/${id}/cancel`);
export const completeDamageReport = (id: string | number) => putRequest(`/procurement/damage-report/${id}/complete`);

// ========== 出入库原因 ==========
export const getStockReasonList = (params: Query) => getRequest("/procurement/reason", params);

import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "@/libs/axios";
import type { ApiParams, Id } from '@/types/api';
import type { DamageDetail, DamageItem, InboundDetail, InboundItem } from '@/types/vo/procurement';
import type { PageRows, VoRow } from '@/types/vo/common';

// ========== 采购单（只读） ==========
export const getProcurementOrderPage = (params: ApiParams) => getRequest<PageRows>("/procurement/order", params);
export const getProcurementOrderDetail = (id: Id) => getRequest<VoRow>(`/procurement/order/${id}`);

// ========== 采购入库单（只读） ==========
export const getProcurementInboundPage = (params: ApiParams) => getRequest<PageRows>("/procurement/inbound", params);
export const getProcurementInboundDetail = (id: Id) => getRequest<InboundDetail>(`/procurement/inbound/${id}`);
export const getProcurementInboundItems = (id: Id) => getRequest<InboundItem[]>(`/procurement/inbound/${id}/items`);

// ========== 盘点单（只读） ==========
export const getInventoryCountPage = (params: ApiParams) => getRequest<PageRows>("/procurement/inventory-count/page", params);
export const getInventoryCountDetail = (id: Id) => getRequest<VoRow>(`/procurement/inventory-count/${id}`);
export const getInventoryCountItemsPage = (id: string | number, params?: Record<string, unknown>) => getRequest<PageRows>(`/procurement/inventory-count/${id}/items/page`, params);
export const downloadInventoryCountItems = (id: Id) => getRequest<VoRow[]>(`/procurement/inventory-count/${id}/download`);
export const exportInventoryCountItems = (id: Id) =>
  getRequest<Blob>(`/procurement/inventory-count/${id}/export`, {}, "blob");

// ========== 报损单（只读） ==========
export const getDamageReportPage = (params: ApiParams) => getRequest<PageRows>("/procurement/damage-report/page", params);
export const getDamageReportDetail = (id: Id) => getRequest<DamageDetail>(`/procurement/damage-report/${id}`);
export const getDamageReportItems = (id: Id) => getRequest<DamageItem[]>(`/procurement/damage-report/${id}/items`);

// ========== 出入库原因 CRUD ==========
export const getStockReasonPage = (params: ApiParams) => getRequest("/procurement/reason", params);
export const addStockReason = (params: ApiParams) => postRequest<null>("/procurement/reason", params, { "Content-Type": "application/json" });
export const updateStockReason = (params: ApiParams) => putRequest<null>("/procurement/reason", params, { "Content-Type": "application/json" });
export const deleteStockReason = (id: Id) => deleteRequest<null>(`/procurement/reason/${id}`);

/**
 * 运营端预约服务 API
 */
import { getRequest, postRequestWithNoForm, putRequestWithNoForm } from "@/libs/axios";
import type { PageRows } from '@/types/vo/common';

export const getManagerWorkOrderPage = (params?: Record<string, unknown>) => getRequest<PageRows>("/appointment/work-orders", params);

export const getAppointmentOrderSettings = () => getRequest("/appointment/settings");

export const saveAppointmentOrderSettings = (params?: Record<string, unknown>) =>
  putRequestWithNoForm("/appointment/settings", params);

export const platformRefund = (orderSn: string | number, params?: Record<string, unknown>) =>
  postRequestWithNoForm(`/appointment/orders/${orderSn}/platform-refund`, params);

export const noShowRefund = (orderSn: string | number, params?: Record<string, unknown>) =>
  postRequestWithNoForm(`/appointment/orders/${orderSn}/no-show-refund`, params);

export const getAppointmentOrderDetail = (orderSn: string) =>
  getRequest(`/appointment/orders/${orderSn}`);

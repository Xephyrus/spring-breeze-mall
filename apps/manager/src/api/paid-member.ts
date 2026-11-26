import { getRequest, putRequestWithNoForm } from '@/libs/axios';
import type { ApiParams, Id } from '@/types/api';
export const getPaidConfig = () => getRequest('/member/paid/config');
export const savePaidConfig = (data: ApiParams) => putRequestWithNoForm('/member/paid/config', data);
export const getPaidOrders = (params: ApiParams) => getRequest('/member/paid/orders', params);
export const getPaidResources = (type: string, ids: Id | Id[]) => getRequest('/member/paid/resources', { type, ids: (Array.isArray(ids) ? ids : [ids]).join(',') });
export const getPaidDiscountSkus = (params: ApiParams) => getRequest('/member/paid/discount-skus', params);

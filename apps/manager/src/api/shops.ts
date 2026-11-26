// 统一请求路径前缀在libs/axios.js中修改
import type { Store, PageResult } from '@spring-breeze/shared';
import {getRequest, postRequest, putRequest} from '@/libs/axios';
import type { Id } from '@/types/api';
import type { BillDetail, BillFlowRow } from '@/types/vo/seller';
import type { PageRows, VoRow } from '@/types/vo/common';

//查询店铺列表
export const getBillPage = (params?: Record<string, unknown>) => {
  return getRequest('/', params)
}
//查询店铺列表
export const getShopListData = (params?: Record<string, unknown>) => {
    return getRequest<PageResult<Store>>('/store/store', params)
}
//禁用店铺
export const disableShop = (id: string | number) => {
    return putRequest(`/store/store/disable/${id}`)
}
//开启店铺
export const enableBrand = (id: string | number) => {
    return putRequest<null>(`/store/store/enable/${id}`)
}

//查询店铺详细
export const getShopDetailData = (id: string | number, params?: Record<string, unknown>) => {
    return getRequest<Store>(`/store/store/get/detail/${id}`, params)
}

//增加店铺列表
export const shopAdd = (params?: Record<string, unknown>) => {
    return postRequest<null>(`/store/store/add`, params)
}

//修改店铺列表
export const shopEdit = (id: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/store/store/edit/${id}`, params)
}

//审核店铺
export const shopAudit = (id: Id, passed: boolean) => {
    return putRequest<null>(`/store/store/audit/${id}/${passed}`)
}

//查询店铺详情
export const shopDetail = (id: string | number) => {
    return getRequest<Store>(`/store/store/get/detail/${id}`)
}



// 获取结算单分页
export const getBuyBillPage = (params?: Record<string, unknown>) => {
  return getRequest<{ records?: BillDetail[]; total?: number }>(`/order/bill/getByPage`,params)
}

// 获取结算单详情
export const getBuyBillDetail = (id: string | number) => {
  return getRequest<BillDetail>(`/order/bill/get/${id}`)
}


// 获取商家结算单流水分页
export const getStoreFlow = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest<{ records?: BillFlowRow[]; total?: number }>(`/order/bill/${id}/getStoreFlow`,params)
}

// 审核结算单

export const examine = (id: string | number) => {
  return putRequest<null>(`/order/bill/examine/${id}`)
}
// 审核结算单

export const pay = (id: string | number) => {
  return putRequest<null>(`/order/bill/pay/${id}`)
}

//获取所有商家
export const getShopList = () => {
  return getRequest<VoRow[]>(`/store/store/all`)
}

//根据id获取店铺信息
export const getShopByMemberId = (id: string | number) => {
  return getRequest<VoRow>(`/store/store/${id}/member`)
}

//查询店铺店员分页列表（包含店主）
export const getShopClerkPage = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/store/store/clerk/${id}`, params)
}

//根据id获取店铺信息
export const downloadBill = (id: string | number) => {
  return getRequest<Blob>(`/order/bill/downLoad/${id}`, {}, 'blob')
}


// 统一请求路径前缀在libs/axios.js中修改
import type { Order, PageResult } from '@spring-breeze/shared';
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest
} from '@/libs/axios';
import type { Id } from '@/types/api';
import type { PageRows } from '@/types/vo/common';
import type {
  AfterSaleDetail,
  LogisticsTrace,
  OrderComplainDetail,
  OrderCountVO,
  OrderDetail,
  StoreAfterSaleAddress,
} from '@/types/vo/order';


//  交由商家申诉
export const storeComplain = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/complain/status`, params)
}


//  获取售后原因分页列表
export const getAfterSaleReasonPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>('/order/afterSaleReason/getByPage', params)
}

//  删除售后原因
export const delAfterSaleReason = (id: string | number) => {
  return deleteRequest<null>(`/order/afterSaleReason/delByIds/${id}`)
}

//  添加售后原因
export const addAfterSaleReason = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/order/afterSaleReason`, params)
}

//  修改售后原因
export const editAfterSaleReason = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/afterSaleReason/update/${id}`, params)
}

// 售后服务单详情
export const afterSaleOrderDetail = (sn: Id) => {
  return getRequest<AfterSaleDetail>(`/order/afterSale/${sn}`)
}

// 商家审核
export const afterSaleSellerReview = (sn: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/afterSale/review/${sn}`, params)
}

// 商家确认收货
export const afterSaleSellerConfirm = (sn: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/afterSale/confirm/${sn}`, params)
}

// 商家换货业务发货
export const afterSaleSellerDelivery = (sn: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/afterSale/${sn}/delivery`, params)
}

//  获取交易投诉信息
export const getOrderComplain = (params?: Record<string, unknown>) => {
  return getRequest('/order/complain', params)
}

//  获取交易投诉详细信息
export const getOrderComplainDetail = (id: string | number) => {
  return getRequest<OrderComplainDetail>(`/order/complain/${id}`)
}

//  交易投诉对话
export const addOrderCommunication = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/order/complain/communication`, params)
}

//  平台仲裁
export const orderComplete = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/complain/complete/${id}`, params)
}

//  查询订单列表
export const getOrderList = (params?: Record<string, unknown>) => {
  return getRequest<PageResult<Order>>(`/order/order`, params)
}

// 小程序专用接口由服务端固定来源与微信支付范围，并回填本地上报结果。
export const getWechatOrderList = (params?: Record<string, unknown>) => getRequest('/order/order/wechat', params)
// 状态统计与专用列表共用上报状态筛选。
export const getWechatOrderNum = (params?: Record<string, unknown>) => getRequest('/order/order/wechat/orderNum', params)
// 人工补报复用支付流水锁和真实履约校验，不受自动上报开关限制。
export const retryWechatOrder = (sn: Id) => postRequest(`/order/order/wechat/${encodeURIComponent(sn)}/retry`, {}, undefined, 120000)
// 查询同笔微信支付下的操作日志，不返回原始支付和物流凭据。
export const getWechatOrderLogs = (sn: string | number, params?: Record<string, unknown>) => getRequest<PageRows>(`/order/order/wechat/${encodeURIComponent(sn)}/logs`, params)

//  导出订单列表
export const exportOrder = (params?: Record<string, unknown>) => {
  return getRequest<Blob>(`/order/order/queryExportOrder`, params,'blob')
}

//  订单付款
export const orderPay = (sn: Id) => {
  return postRequest<null>(`/order/order/${sn}/pay`)
}

//  订单付款
export const orderDetail = (sn: Id) => {
  return getRequest<OrderDetail>(`/order/order/${sn}`)
}


// 获取订单日志
export const getOrderLog = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/orderLog/getByPage`, params)
}

// 订单取消
export const orderCancel = (sn: string | number, params?: Record<string, unknown>) => {
  return postRequest<null>(`/order/order/${sn}/cancel`, params)
}

// 修改收货地址
export const editOrderConsignee = (sn: string | number, params?: Record<string, unknown>) => {
  return postRequest<null>(`/order/order/update/${sn}/consignee`, params)
}

//  获取售后订单列表
export const getAfterSaleOrderPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>('/order/afterSale/page', params)
}

//  获取售后订单详情
export const getAfterSaleOrderDetail = (sn: Id) => {
  return getRequest<AfterSaleDetail>(`/order/afterSale/get/${sn}`)
}
//售后单查询物流
export const getAfterSaleTraces = (sn: Id) => {
  return getRequest<LogisticsTrace[]>(`/order/afterSale/getDeliveryTraces/${sn}`)
}
// 获取商家选中的物流公司
export const getLogisticsChecked = () => {
  return getRequest(`/other/logistics/getChecked`)
}

//查询物流
export const getTraces = (sn: string | number, params?: Record<string, unknown>) => {
  return postRequest<null>(`/order/order/getTraces/${sn}`, params)
}
//获取发票列表
export const getReceiptPage = (params?: Record<string, unknown>) => {
  return getRequest(`/trade/receipt`, params)
}
//平台退款
export const refundPrice = (afterSaleSn: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/order/afterSale/refund/${afterSaleSn}`, params)
}


//平台收款记录
export const paymentLog = (params?: Record<string, unknown>) => {
  return getRequest(`/order/paymentLog`, params)
}


//平台退款记录
export const refundLog = (params?: Record<string, unknown>) => {
  return getRequest(`/order/refundLog`, params)
}

//售后单商家收货信息
export const storeAddress = (sn: Id) => {
  return getRequest<StoreAfterSaleAddress>(`/order/afterSale/getStoreAfterSaleAddress/${sn}`)
}

// 获取订单数量统计
export const getOrderNum = (params?: Record<string, unknown>) => {
  return getRequest<OrderCountVO>(`/order/order/orderNum`, params)
}

// 获取售后数量统计
export const getAfterSaleNumVO = (params?: Record<string, unknown>) => {
  return getRequest<OrderCountVO>(`/order/afterSale/afterSaleNumVO`, params)
}

// 统一请求路径前缀在libs/axios.js中修改
import {getRequest, postRequest, putRequest, deleteRequest} from '@/libs/axios';
import type { Query } from "@/types/api";

//查询店铺列表
export const getShopListData = (params: Query) => {
  return getRequest('/shop', params)
}
// 获取结算单分页
export const getBillPage = (params: Query) => {
  return getRequest(`/order/bill/getByPage`, params)
}

// 获取商家结算单流水分页
export const getSellerFlow = (id: string | number, params: Query) => {
  return getRequest(`/order/bill/${id}/getStoreFlow`, params)
}

// 商家核对结算单
export const reconciliation = (id: string | number, params: Query) => {
  return putRequest(`/order/bill/check/${id}`, params)
}
//根据id获取店铺信息
export const downloadBill = (id: string | number) => {
  return getRequest(`/order/bill/downLoad/${id}`, {}, 'blob')
}

// 获取商家分销订单流水分页
export const getDistributionFlow = (id: string | number, params: Query) => {
  return getRequest(`/order/bill/${id}/getDistributionFlow`, params)
}

// 获取商家结算单详细
export const getBillDetail = (id: string | number, params: Query) => {
  return getRequest(`/order/bill/get/${id}`, params)
}

// 获取所有物流公司
export const getLogistics = (id: string | number, params: Query) => {
  return getRequest(`/other/logistics`, params)
}
//返回信息
export const getIsCheck =(logisticsId: string | number) =>{
  return getRequest(`other/logistics/${logisticsId}/getStoreLogistics`)
}

// 开启物流公司
export const logisticsChecked = (id: string | number, params: Query) => {
  return postRequest(`/other/logistics/${id}`, params, {
    "Content-type": "application/json"
  })
}
//获取发货地址
export const getDeliverAddress = () =>{
  return getRequest(`/settings/storeSettings/storeDeliverGoodsAddress`)
}
//修改发货地址
export const editDeliverAddress = (params: Query) =>{
  return putRequest(`/settings/storeSettings/storeDeliverGoodsAddress`,params)
}

// 关闭开启物流公司
export const logisticsUnChecked = (id: string | number, params: Query) => {
  return deleteRequest(`/other/logistics/${id}`, params)
}
// 获取商家自提点
export const getShopAddress = (id: string | number, params: Query) => {
  return getRequest(`/member/storeAddress`, params)
}

// 修改商家自提点
export const editShopAddress = (id: string | number, params: Query) => {
  return putRequest(`/member/storeAddress/${id}`, params)
}

// 添加商品自提点
export const addShopAddress = (params: Query) => {
  return postRequest(`/member/storeAddress`, params)
}

// 添加商品自提点
export const deleteShopAddress = (id: string | number) => {
  return deleteRequest(`/member/storeAddress/${id}`)
}

// 获取商家详细信息
export const getShopInfo = () => {
  return getRequest(`/settings/storeSettings`)
}

// 获取商家入驻详细信息
export const getShopEntryDetail = () => {
  return getRequest(`/settings/storeSettings/storeDetail`)
}

// 保存商家详细信息
export const saveShopInfo = (params: Query) => {
  return putRequest(`/settings/storeSettings`, params)
}

//获取商家退货地址
export const getRefundGoodsAddress = () => {
  return getRequest(`/settings/storeSettings/storeAfterSaleAddress`)
}
//修改商家退货地址
export const saveRefundGoodsAddress = (params: Query) => {
  return putRequest(`/settings/storeSettings/storeAfterSaleAddress`, params)
}
//修改im商户id
export const updatEmerchantId = (params: Query) => {
  return putRequest(`/settings/storeSettings/merchantEuid`, params)
}

//查询运费模板
export const getShipTemplate = () => {
  return getRequest(`/setting/freightTemplate`)
}
//删除运费模板
export const deleteShipTemplate = (id: string | number) => {
  return deleteRequest(`/setting/freightTemplate/${id}`)
}
//新增运费模板
export const addShipTemplate = (params: Query, headers: Record<string, string>) => {
  return postRequest(`/setting/freightTemplate`, params, headers)
}

//新增运费模板
export const editShipTemplate = (id: string | number, params: Query, headers: Record<string, string>) => {
  return putRequest(`/setting/freightTemplate/${id}`, params, headers)
}

//修改电子面单等信息
export const editChecked = (logisticsId: string | number, params: Query) => {
  return putRequest(`/other/logistics/${logisticsId}/updateStoreLogistics`,params)
}

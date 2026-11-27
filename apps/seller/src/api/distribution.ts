
// 统一请求路径前缀在libs/axios.js中修改
import {getRequest, postRequest, postRequestWithNoForm, putRequest, deleteRequest} from '@/libs/axios';
import type { Query } from "@/types/api";


//获取分销商品列表
export const getDistributionGoods = (params: Query) => {
  return getRequest('/distribution/goods', params)
}

// 取消分销商品
export const distributionGoodsCancel = (id: string | number) => {
  return deleteRequest(`/distribution/goods/cancel/${id}`)
}

// 选择分销商品
export const distributionGoodsCheck = (id: string | number, param: Query) => {
  return putRequest(`/distribution/goods/checked/${id}`,param)
}

// 批量选择分销商品
export const distributionGoodsBatchCheck = (items: Query) => {
  return postRequestWithNoForm('/distribution/goods/checked/batch', { items })
}

// 修改分销商品佣金
export const updateDistributionGoodsCommission = (id: string | number, params: Query) => {
  return putRequest(`/distribution/goods/${id}/commission`, params)
}


//查询分销员
export const getDistributionListData = (params: Query) => {
    return getRequest('/distribution/getByPage', params)
}
//审核分销员
export const auditDistribution = (id: string | number, params: Query) => {
    return putRequest(`/distribution/audit/${id}`, params)
}

// 清退分销员
export const retreatDistribution = (id: string | number, params: Query) => {
    return putRequest(`/distribution/retreat/${id}`, params)
}

// 恢复分销员
export const resumeDistribution = (id: string | number, params: Query) => {
    return putRequest(`/distribution/resume/${id}`, params)
}

//保存更新分销设置
export const saveDistributionSetting = (params: Query) => {
    return postRequest('/distribution/setting/insertOrUpdate', params)
}

//获取分销设置
export const getDistributionSetting = (id: string | number, params: Query) => {
    return getRequest(`/distribution/setting/get/${id}`, params)
}


//获取分销订单列表
export const getDistributionOrder = (params: Query) => {
    return getRequest('/distribution/order', params)
}


//删除分销商品
export const delDistributionGoods = (ids: Query) => {
    return deleteRequest(`/distribution/goods/delByIds/${ids}`)
}
//获取分销佣金信息
export const getDistributionCash = (params: Query) => {
    return getRequest('/distribution/cash/getByPage', params)
}
//审核分销佣金申请
export const auditDistributionCash = (id: string | number, params: Query) => {
    return postRequest(`/distribution/cash/audit/${id}`, params)
}




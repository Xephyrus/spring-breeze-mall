// 统一请求路径前缀在libs/axios.js中修改
import { getRequest, postRequest, putRequest, deleteRequest } from '@/libs/axios';
import type { Query } from "@/types/api";


// 认证
export const authorize = (params: Query) => {
    return getRequest('/oauth2/authorize', params)
}
// 认证过
export const authorized = (params: Query) => {
    return getRequest('/oauth2/authorized', params)
}
// 获取token
export const token = (params: Query) => {
    return getRequest('/oauth2/token', params)
}
// 获取user信息
export const user = (params: Query) => {
    return getRequest('/oauth2/user', params)
}

// 获取随机secretKey
export const getSecretKey = (params: Query) => {
    return getRequest('/client/getSecretKey', params)
}
// 获取客户端
export const getClientDataList = (params: Query) => {
    return getRequest('/client/getByCondition', params)
}
// 添加客户端
export const addClient = (params: Query) => {
    return postRequest('/client/save', params)
}
// 编辑客户端
export const updateClient = (params: Query) => {
    return putRequest('/client/update', params)
}
// 删除客户端
export const deleteClient = (ids: Query, params: Query) => {
    return deleteRequest(`/client/delByIds/${ids}`, params)
}








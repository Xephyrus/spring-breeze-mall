// 统一请求路径前缀在libs/axios.js中修改
import { getRequest, postRequest } from '@/libs/axios';
import type { Query } from "@/types/api";

// 获取kuaidi配置
export const getParams = (params: Query) => {
    return getRequest('/platformSetting/get/'+params)
}
// 编辑kuaidi配置
export const editParams = (params: Query, method: string | number) => {
    return postRequest('/platformSetting/insertOrUpdate/'+method, params)
}
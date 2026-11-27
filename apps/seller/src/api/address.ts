// 统一请求路径前缀在libs/axios.js中修改
import {getRequest} from '@/libs/axios';
import type { Query } from "@/types/api";


// 传给后台citycode 获取城市街道等id
export const handleRegion = (params: Query) => {
  return getRequest(`/address/region`,params)
}



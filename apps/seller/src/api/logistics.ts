// 统一请求路径前缀在libs/axios.js中修改
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
  getRequestHasHeader
} from "@/libs/axios";
import type { Query } from "@/types/api";



// 分页获取物流公司
export const getLogisticsPage = (params: Query) => {
  return getRequest(`/other/logistics/getByPage`, params);
};
// 删除
export const delLogistics = (id: string | number) => {
  return deleteRequest(`/other/logistics/delete/${id}`);
};
// 添加
export const addLogistics = (params: Query) => {
  return postRequest(`/other/logistics/save`,params);
};
// 通过id查询详情
export const getLogisticsDetail = (id: string | number) => {
  return getRequest(`/other/logistics/get/${id}`);
};
// 编辑
export const updateLogistics = (id: string | number, params: Query) => {
  return putRequest(`/other/logistics/${id}`,params);
};

export const getCheckedOn = (params: Query) =>{
  return getRequest(`/other/logistics/getCheckedFaceSheet`,params);
}

//获取物流设置
export const getLogisticsSetting = () =>{
  return getRequest(`/other/logistics`);
}

export const getShunFengFaceSheet = (url: string | number, headers: Record<string, string>) =>{
  return getRequestHasHeader(`${url}`, undefined, headers);
}



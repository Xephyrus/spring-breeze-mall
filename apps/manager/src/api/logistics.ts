// 统一请求路径前缀在libs/axios.js中修改
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "@/libs/axios";
import type { ApiParams, Id } from '@/types/api';
import type { PageRows } from '@/types/vo/common';



// 分页获取物流公司
export const getLogisticsPage = (params: ApiParams) => {
  return getRequest<PageRows>(`/other/logistics/getByPage`, params);
};
// 删除
export const delLogistics = (id: Id) => {
  return deleteRequest(`/other/logistics/${id}`);
};
// 添加
function buildLogisticsFormBody(params: ApiParams) {
  const parts: string[] = [];
  const appendField = (key: string, value: string | number | boolean) => {
    if (value === undefined || value === null || value === "") return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  };
  appendField("name", params.name);
  appendField("code", params.code);
  appendField("disabled", params.disabled);
  appendField("standBy", params.standBy);
  appendField("formItems", params.formItems);
  return parts.join("&");
}

export const addLogistics = (params: ApiParams) => {
  const body = buildLogisticsFormBody(params);
  return postRequest("/other/logistics", body, {
    "Content-Type": "application/x-www-form-urlencoded",
  });
};
// 通过id查询详情
export const getLogisticsDetail = (id: Id) => {
  return getRequest(`/other/logistics/get/${id}`);
};
// 编辑
export const updateLogistics = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest(`/other/logistics/${id}`,params);
};



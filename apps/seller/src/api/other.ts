// 统一请求路径前缀在libs/axios.js中修改
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "@/libs/axios";
import type { Query } from "@/types/api";

/**
 * 楼层装修设置
 *
 */
export const setHomeSetup = (params: Query) => {
  return postRequest("/settings/pageData/save", params);
};

/**
 * 获取页面信息
 *
 */
export const getHomeData = (params: Query) => {

  return getRequest(`/settings/pageData/${params}`);
};


/**
 * 查询楼层装修
 *
 */
export const getHomeList = (params: Query) => {
  return getRequest(`/settings/pageData/${params.pageClientType}/pageDataList`, params);

};


/**
 * 修改楼层装修
 *
 */
 export const updateHome = (id: string | number, params: Query) => {
  return putRequest(`/settings/pageData/update/${id}`, params);
};

/**
 * 删除楼层装修
 *
 */
export const removePageHome = (id: string | number) => {
  return deleteRequest(`/settings/pageData/removePageData/${id}`);
};


/**
 * 发布页面
 *
 */
export const releasePageHome = (id: string | number) => {
  return putRequest(`/settings/pageData/release/${id}`);
};


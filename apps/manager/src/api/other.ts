// 统一请求路径前缀在libs/axios.js中修改
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest
} from "@/libs/axios";
import type { ApiParams } from '@/types/api';
import type { PageRows } from '@/types/vo/common';
import type { PageDataDetail } from '@/types/vo/page';

/**
 * 楼层装修设置
 *
 */
export const setHomeSetup = (params: ApiParams) => {

  return postRequest("/other/pageData/add", params);
};

/**
 * 获取页面信息
 *
 */
/**
 * 按 id 获取页面装修数据。
 *
 * 注意：参数会拼进 URL 路径，必须是 id 字符串（传对象会被拼成 `[object Object]`）。
 */
export const getHomeData = (id: string | number) => {
  // 带上时间戳：装修数据改过一次后，浏览器缓存里的旧数据会让人一直看到"已损坏"，
  // 保存时又会把这份旧数据原样提交回库里。这里强制绕过缓存。
  return getRequest<PageDataDetail>(`/other/pageData/${id}?t=${Date.now()}`);
};


/**
 * 查询楼层装修列表
 *
 */
export const getHomeList = (params: ApiParams) => {

  return getRequest<PageRows>("/other/pageData/pageDataList", params);
};


/**
 * 修改楼层装修
 *
 */
export const updateHome = (id: string | number, params?: Record<string, unknown>) => {

  return putRequest(`/other/pageData/update/${id}`, params);
};

/**
 * 删除楼层装修
 *
 */
export const removePageHome = (id: string | number) => {

  return deleteRequest<null>(`/other/pageData/remove/${id}`);
};


/**
 * 发布页面
 *
 */
export const releasePageHome = (id: string | number) => {

  return putRequest<null>(`/other/pageData/release/${id}`);
};

//管理员获取发送列表
export const getMessagePage = (params?: Record<string, unknown>) => {
  return getRequest(`/other/message`, params);
};
//管理员获取发送列表
export const sendMessage = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/other/message`, params);
};
//管理员获取发送详情列表
export const getShopMessage = (params?: Record<string, unknown>) => {
  return getRequest(`/other/storeMessage`, params);
};

//管理员获取会员意见反馈
export const getMemberFeedback = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/other/feedback`, params);
};

//管理员获取会员意见反馈
export const getMemberFeedbackDetail = (id: string | number) => {
  return getRequest(`/other/feedback/${id}`);
};

//管理员获取发送详情列表
export const getMemberMessage = (params?: Record<string, unknown>) => {
  return getRequest(`/other/memberMessage`, params);
};

// 弹窗广告
export const getOpenHomeData = (params: ApiParams | string) => {
  return getRequest<PageDataDetail>(`/other/pageData/pageType/${params}`);
};
// 保存修改弹窗广告
export const addOpenHomeData = (params: ApiParams | string) => {
  return postRequest<null>(`/other/pageData/pageType/${params}`);
};

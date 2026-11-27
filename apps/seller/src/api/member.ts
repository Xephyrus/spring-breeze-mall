// 统一请求路径前缀在libs/axios.js中修改
import { getRequest, putRequest, postRequest, deleteRequest } from "@/libs/axios";
import type { Query } from "@/types/api";

// 分页获取会员评价
export const getMemberReview = (params: Query) => {
  return getRequest("/member/evaluation", params);
};

// 根据id获取评价详情
export const getMemberInfoReview = (id: string | number) => {
  return getRequest(`/member/evaluation/get/${id}`);
};

//回复评价信息
export const replyMemberReview = (id: string | number, params: Query) => {
  return putRequest(`/member/evaluation/reply/${id}`, params);
};

// 获取会员注册统计列表
export const getStatisticsList = (params: Query) => {
  return getRequest("/statistics/view/list", params);
};

//   获取分页
export const getMember = (params: Query) => {
  return getRequest("/member/getByPage", params);
};

//  添加或修改会员通知发送设置
export const insertOrUpdateMemberNotice = (params: Query) => {
  return postRequest("/memberNoticeSenter/insertOrUpdate", params);
};

//  获取会员列表
export const getMemberListData = (params: Query) => {
  return getRequest("/member", params);
};

//  获取会员详情
export const getMemberInfoData = (id: string | number) => {
  return getRequest(`/member/${id}`);
};

//  添加会员基本信息
export const addMember = (params: Query) => {
  return postRequest(`/member`, params);
};

//  获取会员列表
export const getMemberAll = () => {
  return getRequest("/member/getAll");
};

//  增加或修改会员列表
export const operationMemberListData = (params: Query) => {
  return postRequest("/member/insertOrUpdate", params);
};

//  增加或修改会员列表
export const deleteMemberListData = (ids: Query) => {
  return deleteRequest(`/member/delByIds/${ids}`);
};
// 获取充值记录列表数据
export const getUserRecharge = (params: Query) => {
  return getRequest("/wallet/recharge", params);
};

// 获取预存款明细列表数据
export const getUserDeposit = (params: Query) => {
  return getRequest("/deposit", params);
};

// 获取提现申请列表数据
export const getUserWithdrawApply = (params: Query) => {
  return getRequest("/members/withdraw-apply", params);
};

// 审核提现申请
export const withdrawApply = (params: Query) => {
  return postRequest("/members/withdraw-apply", params);
};

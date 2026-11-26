// 统一请求路径前缀在libs/axios.js中修改
import type { Member, PageResult } from '@spring-breeze/shared';
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
} from "@/libs/axios";
import type { ApiParams, Id } from '@/types/api';
import type { PageRows, VoRow } from '@/types/vo/common';
import type { MemberEvaluation, MemberGradeInfo, MemberGroupInfo, MemberInfo, MemberPointsStatistics, MemberWallet } from '@/types/vo/member';

//   获取分页
export const getMember = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/member/getByPage", params);
};

// 分页获取会员评价
export const getMemberReview = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/member/evaluation/getByPage", params);
};

// 获取id
export const getMemberInfoReview = (id: string | number) => {
  return getRequest<MemberEvaluation>(`/member/evaluation/get/${id}`);
};

// 删除评论
export const delMemberReview = (id: string | number) => {
  return putRequest<null>(`/member/evaluation/delete/${id}`);
};
// 修改评价状态
export const updateMemberReview = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/member/evaluation/updateStatus/${id}`, params);
};

// 修改评价置顶状态
export const updateMemberReviewTop = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/member/evaluation/updateTop/${id}`, params);
};

//  添加或修改
export const insertOrUpdateSpec = (params?: Record<string, unknown>) => {
  return postRequest<null>("/memberNoticeSenter/insertOrUpdate", params);
};

//  获取会员列表
export const getMemberListData = (params?: Record<string, unknown>) => {
  return getRequest<PageResult<Member>>("/passport/member", params);
};

//  获取会员详情
export const getMemberInfoData = (id: string | number) => {
  return getRequest<MemberInfo>(`/passport/member/${id}`);
};

//  修改会员基本信息
export const updateMember = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/passport/member`, params);
};

//  添加会员基本信息
export const addMember = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/passport/member`, params);
};

//  获取会员列表
export const getMemberAll = () => {
  return getRequest("/passport/member/getAll");
};

//  增加或修改会员列表
export const operationMemberListData = (params?: Record<string, unknown>) => {
  return postRequest<null>("/passport/member/insertOrUpdate", params);
};

//  增加或修改会员列表
export const deleteMemberListData = (ids: string | number) => {
  return deleteRequest<null>(`/passport/member/delByIds/${ids}`);
};
// 获取充值记录列表数据
export const getUserRecharge = (params?: Record<string, unknown>) => {
  return getRequest("/wallet/recharge", params);
};

// 获取预存款明细列表数据
export const getUserWallet = (params?: Record<string, unknown>) => {
  return getRequest("/wallet/log", params);
};

// 获取提现申请列表数据
export const getUserWithdrawApply = (params?: Record<string, unknown>) => {
  return getRequest("/wallet/withdrawApply", params);
};

// 审核提现申请
export const withdrawApply = (params?: Record<string, unknown>) => {
  return postRequest<null>("/wallet/withdrawApply", params);
};

//会员状态修改
export const updateMemberStatus = (params?: Record<string, unknown>) => {
  return putRequest<null>("/passport/member/updateMemberStatus", params);
};

// 获取会员注册统计列表
export const getMemberStatistics = (params?: Record<string, unknown>) => {
  return getRequest("/statistics/member", params);
};

// 获取流量统计
export const getStatisticsList = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/statistics/view/list", params);
};

// 获取会员历史流量
export const historyMemberChartList = () => {
  return getRequest<VoRow[]>("/statistics/view/online/history");
};

//查询会员数量
export const getMemberNum = (params?: Record<string, unknown>) => {
  return getRequest("/passport/member/num", params);
};
//查询会员历史积分
export const getHistoryPointData = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/member/memberPointsHistory/getByPage`, params);
};
export const queryMemberPointsStatistics = () => {
  return getRequest<MemberPointsStatistics>(`/member/memberPointsHistory/queryMemberPointsStatistics`);
};
//查询会员的收货地址
export const getMemberAddressData = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/member/address/${id}`, params);
};
//删除会员地址
export const removeMemberAddress = (id: string | number) => {
  return deleteRequest<null>(`/member/address/delById/${id}`);
};
//添加会员收货地址
export const addMemberAddress = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/member/address`, params);
};
//修改会员收货地址
export const editMemberAddress = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/member/address`, params);
};
//查询会员预存款
export const getMemberWallet = (params?: Record<string, unknown>) => {
  return getRequest<MemberWallet>(`/wallet/wallet`, params);
};

export const increaseMemberWallet = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/wallet/wallet/increase`, params);
};

export const updateMemberPoint = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/passport/member/updateMemberPoint`, params);
};

export const getMemberGroupByPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/member/memberGroup/getByPage", params);
};
export const getMemberGroup = (id: string | number) => {
  return getRequest<MemberGroupInfo>(`/member/memberGroup/get/${id}`);
};
export const addMemberGroup = (params?: Record<string, unknown>) => {
  return postRequest(`/member/memberGroup`, params);
};
export const updateMemberGroup = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest(`/member/memberGroup/update/${id}`, params);
};
export const deleteMemberGroup = (id: string | number) => {
  return deleteRequest(`/member/memberGroup/delete/${id}`);
};

export const getMemberGroupUsers = (groupId: string | number, params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/member/memberGroup/${groupId}/users`, params);
};

export const addMemberGroupUsers = (groupId: Id, memberIds: Id | Id[]) => {
  return postRequest(`/member/memberGroup/${groupId}/users`, {
    memberIds: Array.isArray(memberIds) ? memberIds.join(",") : memberIds,
  });
};

export const setMemberUserGroups = (memberId: Id, groupIds: Id | Id[]) => {
  const ids = Array.isArray(groupIds) ? groupIds : groupIds ? [groupIds] : [];
  return postRequest<null>(`/member/memberGroup/user/${memberId}/groups`, {
    groupIds: ids.join(","),
  });
};

/**
 * 批量给多个客户设置同一分组（覆盖式）。
 *
 * 后端在一个事务内完成「按 member_id IN (...) 删除 + 批量插入」，
 * 不要把这里退化成前端 forEach 并发调用 setMemberUserGroups ——
 * 那样每个请求各开一个事务、互相抢 li_member_group_user 的行锁，会出现死锁
 * （MySQL: Deadlock found when trying to get lock）。
 */
export const setMembersUserGroups = (memberIds: Id | Id[], groupIds: Id | Id[]) => {
  const userIds = Array.isArray(memberIds) ? memberIds : memberIds ? [memberIds] : [];
  const ids = Array.isArray(groupIds) ? groupIds : groupIds ? [groupIds] : [];
  return postRequest<null>('/member/memberGroup/users/groups', {
    memberIds: userIds.join(","),
    groupIds: ids.join(","),
  });
};

// 客户等级
export const getMemberGradeByPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/member/memberGrade/getByPage", params);
};
export const getMemberGrade = (id: string | number) => {
  return getRequest<MemberGradeInfo>(`/member/memberGrade/get/${id}`);
};
export const addMemberGrade = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/member/memberGrade`, params);
};
export const updateMemberGrade = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/member/memberGrade/update/${id}`, params);
};
export const updateMemberGradeState = (id: Id, state: string) => {
  return putRequest<null>(`/member/memberGrade/state/${id}?state=${state}`);
};
export const deleteMemberGrade = (id: string | number) => {
  return deleteRequest<null>(`/member/memberGrade/delete/${id}`);
};
export const getMemberExperienceByPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/member/memberGrade/experience/getByPage`, params);
};

// 客户权益
export const getMemberBenefitByPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/member/benefit/getByPage", params);
};

export const getMemberBenefit = (id: string | number) => {
  return getRequest(`/member/benefit/get/${id}`);
};

export const addMemberBenefit = (params?: Record<string, unknown>) => {
  return postRequest<null>("/member/benefit", params);
};

export const updateMemberBenefit = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/member/benefit/update/${id}`, params);
};

export const updateMemberBenefitState = (id: Id, state: string) => {
  return putRequest<null>(`/member/benefit/state/${id}?state=${state}`);
};

export const deleteMemberBenefit = (id: string | number) => {
  return deleteRequest<null>(`/member/benefit/delete/${id}`);
};

/** 客户权益类型枚举（管理端） */
export const getMemberBenefitTypes = () => {
  return getRequest<VoRow[]>("/member/benefit/types");
};

export const getMemberBenefitDeliveries = (params: ApiParams) => getRequest('/member/benefit/deliveries', params);
export const retryMemberBenefitDelivery = (id: Id) => postRequest<null>('/member/benefit/deliveries/' + id + '/retry');


// 统一请求路径前缀在libs/axios.js中修改
import {getRequest, postRequest, postRequestWithNoForm, putRequest, putRequestWithNoForm, deleteRequest, importRequest} from '@/libs/axios';
import type { GradeOption, RelationLog, RelationRow } from '@/types/vo/distribution';
import type { Id } from '@/types/api';
import type { PageRows } from '@/types/vo/common';

//查询分销员
export const getDistributionListData = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/distribution/distribution/getByPage', params)
}
// 分销员聚合分页(V2)
export const getDistributionMemberPage = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/distribution/distribution/memberPage', params)
}
export const getDistributionMemberDetail = (id: string | number) => {
    return getRequest(`/distribution/distribution/memberDetail/${id}`)
}
export const updateDistributionMember = (id: string | number, params?: Record<string, unknown>) => {
    return putRequestWithNoForm(`/distribution/distribution/member/${id}`, params)
}
export const createDistributionMember = (params?: Record<string, unknown>) => {
    return postRequestWithNoForm('/distribution/distribution/member', params)
}
export const batchUpdateDistributionGrade = (params?: Record<string, unknown>) => {
    return putRequestWithNoForm('/distribution/distribution/member/batchGrade', params)
}
export const exportDistributionMembers = (params?: Record<string, unknown>) => {
    return getRequest<Blob>('/distribution/distribution/memberExport', params, 'blob')
}
export const downloadDistributionImportTemplate = () => {
    return getRequest<Blob>('/distribution/memberImport/template', {}, 'blob')
}
export const importDistributionMembers = (formData: FormData) => {
    return importRequest('/distribution/memberImport/import', formData)
}
export const getDistributionImportBatches = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/distribution/memberImport/batch', params)
}
export const getDistributionImportItems = (batchId: string | number, params?: Record<string, unknown>) => {
    return getRequest<PageRows>(`/distribution/memberImport/batch/${batchId}/items`, params)
}
export const downloadDistributionImportFailItems = (batchId: Id) => {
    return getRequest<Blob>(`/distribution/memberImport/batch/${batchId}/failExport`, {}, 'blob')
}
//审核分销员
export const auditDistribution = (id: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/distribution/distribution/audit/${id}`, params)
}
// 清退分销员
export const retreatDistribution = (id: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/distribution/distribution/retreat/${id}`, params)
}
//修改分销员
export const editDistribution = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/distribution/distribution/${params!.id}`!, params)
}

// 恢复分销员
export const resumeDistribution = (id: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/distribution/distribution/resume/${id}`, params)
}

//保存更新分销设置
export const saveDistributionSetting = (params?: Record<string, unknown>) => {
    return postRequest<null>('/distribution/setting/insertOrUpdate', params)
}

//获取分销设置
export const getDistributionSetting = (id: string | number, params?: Record<string, unknown>) => {
    return getRequest(`/distribution/setting/get/${id}`, params)
}

// V2客户关系设置
export const getDistributionCustomerSetting = () => getRequest('/distribution/setting/v2/customer')
export const putDistributionCustomerSetting = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/setting/v2/customer', params)
// V2结算方案设置
export const getDistributionSettlementSetting = () => getRequest('/distribution/setting/v2/settlement')
export const putDistributionSettlementSetting = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/setting/v2/settlement', params)
// 分销商品设置
export const getDistributionFeaturedGoodsSetting = () => getRequest('/distribution/setting/v2/featured-goods')
export const putDistributionFeaturedGoodsSetting = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/setting/v2/featured-goods', params)
// 平台海报设置
export const getDistributionPromotionPosterSetting = () => getRequest('/distribution/setting/v2/promotion-poster')
export const putDistributionPromotionPosterSetting = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/setting/v2/promotion-poster', params)
// 邀请卡设置
export const getDistributionInviteCardSetting = () => getRequest('/distribution/setting/v2/invite-card')
export const putDistributionInviteCardSetting = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/setting/v2/invite-card', params)
// 分销等级
export const getDistributionGrades = () => getRequest<GradeOption[]>('/distribution/grade')
export const saveAllDistributionGrades = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/grade/batch', params)
export const deleteDistributionGrade = (id: string | number) => deleteRequest<null>(`/distribution/grade/${id}`)
export const getDistributionGradeHistoryPage = (params?: Record<string, unknown>) => getRequest('/distribution/gradeHistory', params)

// 客户关系
export const getCustomerRelations = (params?: Record<string, unknown>) => getRequest<{ records?: RelationRow[]; total?: number }>('/distribution/customerRelation', params)
export const getCustomerRelationDetail = (id: string | number) => getRequest<RelationRow>(`/distribution/customerRelation/${id}`)
export const getCustomerRelationLogs = (id: string | number) => getRequest<RelationLog[]>(`/distribution/customerRelation/${id}/logs`)
export const rebindCustomerRelation = (params?: Record<string, unknown>) => putRequest<null>('/distribution/customerRelation/rebind', params)
export const unbindCustomerRelation = (params?: Record<string, unknown>) => putRequest<null>('/distribution/customerRelation/unbind', params)

// 分销招募设置
export const getCurrentRecruitPlan = () => getRequest('/distribution/recruit/plan/current')
export const getPublishedRecruitPlan = () => getRequest('/distribution/recruit/plan/published')
export const saveRecruitPlan = (params?: Record<string, unknown>) => postRequestWithNoForm('/distribution/recruit/plan', params)
export const getDistributionRecruitSetting = () => getRequest('/distribution/setting/v2/recruit')
export const putDistributionRecruitSetting = (params?: Record<string, unknown>) => putRequestWithNoForm('/distribution/setting/v2/recruit', params)
export const publishRecruitPlan = (planId: Id) => putRequest<null>(`/distribution/recruit/plan/publish/${planId}`)
export const auditRecruitApplication = (applicationId: string | number, params?: Record<string, unknown>) => putRequest<null>(`/distribution/recruit/application/audit/${applicationId}`, params)

// 统计V2
export const getDistributionOverviewV2 = (params?: Record<string, unknown>) => getRequest('/statistics/distribution/v2/overview', params)
export const getDistributionBehaviorV2 = (params?: Record<string, unknown>) => getRequest<PageRows>('/statistics/distribution/v2/behavior', params)
export const getDistributionGoodsV2 = (params?: Record<string, unknown>) => getRequest<PageRows>('/statistics/distribution/v2/goods', params)

// 钱包流水
export const getDistributionWalletLogs = (params?: Record<string, unknown>) => getRequest('/distribution/walletLog', params)

//获取分销订单列表
export const getDistributionOrder = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/distribution/order/getByPage', params)
}

//获取分销商品列表
export const getDistributionGoods = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/distribution/goods/getByPage', params)
}
//删除分销商品
export const delDistributionGoods = (ids: string | number) => {
    return deleteRequest<null>(`/distribution/goods/delByIds/${ids}`)
}

export const auditDistributionGoods = (params?: Record<string, unknown>) => {
    return putRequestWithNoForm('/distribution/goods/audit', params)
}
//获取分销佣金信息
export const getDistributionCash = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/distribution/cash/getByPage', params)
}
//审核分销佣金申请
export const auditDistributionCash = (id: string | number, params?: Record<string, unknown>) => {
    return postRequest<null>(`/distribution/cash/audit/${id}`, params)
}

// 兼容别名导出
export const getDistributionCustomerPage = (params?: Record<string, unknown>) => getCustomerRelations(params);
export const getDistributionBindLogPage = (params?: Record<string, unknown>) => {
    if (params && params.id) {
        return getCustomerRelationLogs(params.id as string | number);
    }
    return getRequest('/distribution/customerRelation/logs', params);
};
export const rebindDistributionCustomer = (params?: Record<string, unknown>) => {
    return rebindCustomerRelation({
        memberId: params!.memberId!,
        distributionId: params!.distributionId!,
        reason: params!.reason || params!.remark!
    });
};

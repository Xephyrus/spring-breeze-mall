/**
 * 分销模块的 VO。
 *
 * 从 `views/distribution/*` 搬出来的，目的：
 * 1. 同一类型不再在多处各写一遍
 * 2. `api/distribution.ts` 能标注返回类型（见 apps/manager/API-TYPING-PLAN.md）
 */

/** 分销等级选项 / 等级行 */
export type GradeOption = {
  /** 下拉用的取值（等级历史页只用 value/label） */
  id: string | number;
  value?: string | number;
  label?: string;
  name?: string;
  gradeName?: string;
  sortOrder?: number;
  [key: string]: unknown;
};

/** 分销商行（列表） */
export type DistributionRow = {
  id?: string | number;
  mobile?: string;
  nickname?: string;
  inviterMobile?: string;
  gradeId?: string | number;
  distributionStatus?: string;
  [key: string]: unknown;
};

/** 分销商详情 */
export type DistributionDetail = DistributionRow & {
  gradeName?: string;
  joinTime?: string;
  validSalesAmount?: number | string | null;
  orderCount?: number | string | null;
  totalCustomerCount?: number | string | null;
  validCustomerCount?: number | string | null;
  inviteCount?: number | string | null;
  totalCommission?: number | string | null;
  goodsCommission?: number | string | null;
  inviteCommission?: number | string | null;
  promotionAmount?: number | string | null;
  selfPurchaseAmount?: number | string | null;
};

/** 客户关系行 */
export type RelationRow = {
  id?: string | number;
  memberId?: string | number;
  memberNickname?: string;
  memberMobile?: string;
  distributionId?: string | number;
  distributionNickname?: string;
  distributionMobile?: string;
  relationEffective?: boolean;
  relationStatus?: string;
  invalidTime?: string;
  invalidReason?: string;
  bindTime?: string;
  hasDeadline?: boolean;
  expireAt?: string;
  [key: string]: unknown;
};

/** 客户关系变更日志 */
export type RelationLog = {
  id?: string | number;
  action?: string;
  reason?: string;
  createTime?: string;
  operatorName?: string;
  [key: string]: unknown;
};


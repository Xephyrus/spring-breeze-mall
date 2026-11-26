/**
 * 会员模块的 VO。
 *
 * 从 `views/member/list/memberDetail.vue` 等页面搬出来的，目的：
 * 1. 同一形状不再各写一遍
 * 2. `api/member.ts` 的单实体接口能标注返回类型
 */

/** 会员信息（详情页展示字段） */
export type MemberInfo = {
  id?: string | number;
  mobile?: string;
  nickName?: string;
  username?: string;
  gradeName?: string;
  disabled?: boolean | string | number;
  point?: number;
  experience?: number;
  face?: string;
  createTime?: string;
  lastLoginDate?: string;
  birthday?: string;
  sex?: string | number;
  region?: string;
  regionId?: string;
  [key: string]: unknown;
};

/** 会员钱包 */
export type MemberWallet = {
  memberWallet?: number;
  memberFrozenWallet?: number;
  wallet?: number;
  [key: string]: unknown;
};

/** 会员等级 */
export type MemberGradeInfo = {
  id?: string | number;
  gradeName?: string;
  gradePoint?: number;
  /** 等级关联的权益 id 列表（等级编辑页要用） */
  benefitIds?: Array<string | number>;
  [key: string]: unknown;
};

/** 会员分组 */
export type MemberGroupInfo = {
  id?: string | number;
  groupName?: string;
  /** 分组备注（分组编辑页要用） */
  remark?: string;
  [key: string]: unknown;
};


/** 积分统计 */
export type MemberPointsStatistics = {
  totalPoint?: number;
  unUsedPoint?: number;
  usedPoint?: number;
  [key: string]: unknown;
};

/** 会员收货地址 */
export type MemberAddressRow = {
  id?: string | number;
  name?: string;
  mobile?: string;
  consigneeAddressPath?: string;
  consigneeAddressIdPath?: string;
  detail?: string;
  isDefault?: number;
  [key: string]: unknown;
};


/** 会员商品评价详情 */
export type MemberEvaluation = {
  id?: string | number;
  goodsName?: string;
  content?: string;
  grade?: number | string;
  images?: string[];
  createTime?: string;
  memberName?: string;
  reply?: string;
  status?: string;
  [key: string]: unknown;
};

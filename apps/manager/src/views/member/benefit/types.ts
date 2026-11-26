/**
 * 客户权益模块共用类型
 *
 * index.vue（列表 + 新增/编辑弹窗）与 BenefitFormFields / BenefitConfigFields 传的是同一个表单对象，
 * 类型必须共享，否则子组件只能退化成 Record<string, any>（模板里每个 v-model 都会变成 unknown）。
 */

/** 权益类型选项（后端字典） */
export type BenefitTypeOption = {
  value: string;
  description?: string;
  label?: string;
};

/** 优惠券套餐行（表单内展示用） */
export type CouponPackageRow = {
  couponId?: string | number;
  quantity?: number;
  couponName?: string;
  faceValueLabel?: string;
  validRange?: string;
};

/** 权益表单 */
export type BenefitForm = {
  id?: string | number;
  benefitName: string;
  benefitCode?: string;
  benefitType?: string;
  benefitLogo?: string;
  benefitDesc?: string;
  benefitSort?: number;
  /** el-radio-group 的值域是 string | number | boolean */
  benefitState?: string | number | boolean;
  benefitConfig?: string;
  giftPoint?: number | null;
  multiplier?: number;
  grantRule?: string;
  grantDay?: number;
  periodMonths?: number;
  couponPackageRows: CouponPackageRow[];
};

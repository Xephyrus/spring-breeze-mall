/**
 * 商品模块的 VO。
 *
 * 说明：
 * - 商品本身用 shared 包的 `Goods`（已存在），这里只补**商品周边**的返回类型。
 * - 字段按后端 DTO/VO 的真实定义声明，并保留索引签名以兼容扩容。
 */

/** 商品分组 */
export type GoodsGroupInfo = {
  id?: string | number;
  groupName?: string;
  description?: string;
  [key: string]: unknown;
};

/** 商品数量统计（上架/下架/待审核/未通过） */
export type GoodsNumVO = {
  upperGoodsNum?: number;
  downGoodsNum?: number;
  auditGoodsNum?: number;
  refuseGoodsNum?: number;
  [key: string]: unknown;
};

/** 商品参数（按分类） */
export type GoodsParameterRow = {
  id?: string | number;
  paramName?: string;
  categoryId?: string | number;
  required?: boolean | string | number;
  value?: unknown;
  [key: string]: unknown;
};

/** 商品参数集合（GET /goods/parameters/{id} 返回） */
export type GoodsParamsDTO = {
  categoryParameterList?: GoodsParameterRow[];
  [key: string]: unknown;
};

/** 订单概览统计（商品/订单报表页顶部） */
export type OrderOverviewVO = {
  uvNum?: number;
  orderNum?: number;
  orderMemberNum?: number;
  orderAmount?: number;
  paymentOrderNum?: number;
  paymentsNum?: number;
  paymentAmount?: number;
  refundOrderNum?: number;
  refundOrderPrice?: number;
  orderConversionRate?: string;
  paymentsConversionRate?: string;
  overallConversionRate?: string;
  [key: string]: unknown;
};

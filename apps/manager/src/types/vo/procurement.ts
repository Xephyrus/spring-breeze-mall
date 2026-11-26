/**
 * 采购模块的 VO。
 *
 * 从 `views/procurement/*` 搬出来的，目的：
 * 1. 类型不再散落在各个 .vue 里
 * 2. `api/procurement.ts` 能标注返回类型
 */
export type DamageDetail = {
  id?: string | number;
  sn?: string;
  status?: string;
  makerName?: string;
  createBy?: string;
  createTime?: string;
  auditorName?: string;
  auditTime?: string;
  damageDate?: string;
  totalQuantity?: number;
  totalAmount?: number | string;
  remark?: string;
  [key: string]: unknown;
};

export type DamageItem = {
  goodsName?: string;
  skuId?: string | number;
  quantity?: number;
  unitPrice?: number | string;
  amount?: number | string;
  [key: string]: unknown;
};

export type InboundItem = {
  inboundQuantity?: number | string;
  [key: string]: unknown;
};

/** 入库单详情（字段较多且会扩容） */
export type InboundDetail = {
  id?: string | number;
  sn?: string;
  status?: string;
  createTime?: string;
  [key: string]: unknown;
};

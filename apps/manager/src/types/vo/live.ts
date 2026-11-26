/**
 * 直播模块的 VO。
 *
 * 从 `views/live/*` 搬出来的，目的：
 * 1. 同一类型不再散落各页（`LiveDetail` 原本在 detail.vue / control-panel.vue 各一份）
 * 2. `api/live.ts` 能标注返回类型
 */

/** 直播间详情 */
export type LiveDetail = {
  title?: string;
  storeName?: string;
  streamerName?: string;
  startTime?: string | number;
  endTime?: string | number;
  pushStreamServer?: string;
  pushStreamCode?: string;
  pullStreamUrl?: string;
  streamUrl?: string;
  coverImg?: string;
  liveStatus?: string;
  status?: string;
  [key: string]: unknown;
};

/** 直播间已关联的优惠券行 */
export type LiveCouponRow = {
  /** 关联记录主键（后端必然返回；声明可选以兼容 el-table slot 的行类型） */
  id?: string | number;
  couponId?: string | number;
  couponName?: string;
  price?: number | string;
  promotionStatus?: string;
  [key: string]: unknown;
};

/** 直播间商品行（li_live_goods + 商品字段） */
export type LiveGoodsRow = {
  /** 直播间商品主键（后端必然返回；声明为可选是为了兼容 el-table slot 的行类型） */
  id?: string | number;
  skuId?: string | number;
  goodsId?: string | number;
  goodsName?: string;
  thumbnail?: string;
  price?: number | string;
  originPrice?: number | string;
  cost?: number | string;
  originalPrice?: number | string;
  quantity?: number | string;
  stock?: number | string;
  salesCount?: number;
  buyCount?: number;
  storeId?: string | number;
  storeName?: string;
  sellPoint?: string;
  sellingPoint?: string;
  popularity?: number;
  soldOutFlag?: boolean;
  recommend?: boolean;
  [key: string]: unknown;
};

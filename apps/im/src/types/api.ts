/**
 * im 端 api 层通用类型。
 *
 * `Query` 用于查询/表单参数；`RequestOptions` 是 request 封装的第三个参数（超时、silent 等）。
 */
export type Query = Record<string, unknown>;
export type RequestOptions = Record<string, unknown>;

/** 商品详情参数（api/goods） */
export interface GoodsSkuQuery {
  goodsId: string | number;
  skuId: string | number;
}

export type { ResultMessage } from "@spring-breeze/shared";

/**
 * seller api 层通用类型。
 *
 * `Query` 用于查询/表单参数（后端接受的松散对象）；
 * 需要精确结构时在调用处写泛型，例如 `getRequest<GoodsVO>(...)`。
 */
export type Query = Record<string, unknown>;

export type { ResultMessage, PageResult } from "@spring-breeze/shared";

/**
 * 请求层公共类型。
 *
 * 约定：
 * - `ApiParams`  — 动态查询参数袋（后端多用 Map 接收），保留索引签名便于逐步收紧；
 * - `PageQuery`  — 分页查询参数，页面里用 `useTable` 时可直接复用；
 * - `ApiResult<T>` / `ApiPage<T>` — 与后端 `ResultMessage` / `PageResult` 对齐的返回类型。
 *
 * 调用示例：
 *   getRequest<Goods>(`/goods/goods/${id}`)
 *   getRequest<PageResult<Goods>>("/goods/goods/getByPage", query)
 */
import type { PageResult, ResultMessage } from "@spring-breeze/shared";

/** 通用查询参数袋。 */
export type ApiParams = Record<string, any>;

/** 分页查询参数。 */
export interface PageQuery extends ApiParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  sort?: string;
  order?: string;
}

/** 无分页的 ResultMessage 返回。 */
export type ApiResult<T = any> = ResultMessage<T>;

/** 分页列表返回（ResultMessage<PageResult<T>>）。 */
export type ApiPage<T = any> = ResultMessage<PageResult<T>>;

/** 主键类型：后端 id 既有 Long 也有 String。 */
export type Id = string | number;

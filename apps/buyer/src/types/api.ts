/**
 * buyer 端 api 层通用类型。
 *
 * 后端接口返回体是统一结构：`{ success, code, message, result }`，
 * `result` 的具体形状由各接口决定，因此这里用泛型 + 默认 unknown，
 * 需要精确类型时在调用处写 `getXxx<MyVO>()`。
 */
export interface BuyerResponse<T = unknown> {
  success: boolean;
  code?: number;
  message?: string;
  result: T;
}

/** 分页返回体 */
export interface PageResult<T = unknown> {
  total: number;
  records: T[];
  pages?: number;
  current?: number;
  size?: number;
}

/** 查询/表单参数：后端接受的松散对象 */
export type Query = Record<string, unknown>;

/** 请求选项（部分接口允许调用方决定是否自己提示错误） */
export interface RequestOptions {
  skipMessage?: boolean;
  needToken?: boolean;
  optionalToken?: boolean;
  loading?: boolean;
  [key: string]: unknown;
}

export type { ResultMessage } from "@spring-breeze/shared";

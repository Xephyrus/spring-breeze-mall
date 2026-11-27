export type { ResultMessage, PageResult, ApiErrorLike } from "./types";
export type * from "./models";

export function isResultSuccess<T>(
  data: { success?: boolean; result?: T } | null | undefined
): data is { success: true; result: T } {
  return Boolean(data && data.success);
}

// 共享工具（各端行为一致，避免维护三份副本）
export { setStore, getStore, removeStore } from "./storage";
export * as regexp from "./regexp";
export {
  validatePassword,
  validateMobile,
  validateIDCard,
  isInteger,
  isMoney,
  type RuleValidator,
  type ValidateCallback,
} from "./validators";

// axios 客户端工厂：差异点通过 hooks 注入
export { createHttpClient } from "./http";
export type { HttpClient, HttpClientHooks, HttpClientOptions } from "./http";

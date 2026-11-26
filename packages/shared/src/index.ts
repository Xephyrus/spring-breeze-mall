export type { ResultMessage, PageResult, ApiErrorLike } from "./types";
export type * from "./models";

export function isResultSuccess<T>(
  data: { success?: boolean; result?: T } | null | undefined
): data is { success: true; result: T } {
  return Boolean(data && data.success);
}

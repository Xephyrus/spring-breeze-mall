/**
 * 表单校验函数。
 *
 * 实现已抽到 `@spring-breeze/shared`，这里转发以保持既有 import 路径不变。
 */
export {
  validatePassword,
  validateMobile,
  validateIDCard,
  isInteger,
  isMoney,
} from "@spring-breeze/shared";

/** 保留两位小数的占位实现（当前直接原样返回） */
export function validatetoFixedNew(str: string): string {
  return str;
}

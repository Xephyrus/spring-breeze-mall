/**
 * 常用正则表达式。
 *
 * 实现已抽到 `@spring-breeze/shared`（以 `regexp` 命名空间导出，避免污染顶层名字），
 * 这里做平铺转发，保持 `import * as RegExp from "@/libs/reg-exp"` 的既有用法不变。
 */
import { regexp } from "@spring-breeze/shared";

export const mobile = regexp.mobile;
export const email = regexp.email;
export const password = regexp.password;
export const integer = regexp.integer;
export const Integer = regexp.Integer;
export const money = regexp.money;
export const TINumber = regexp.TINumber;
export const IDCard = regexp.IDCard;
export const userName = regexp.userName;
export const URL = regexp.URL;
export const TEL = regexp.TEL;

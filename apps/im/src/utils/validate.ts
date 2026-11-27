/** 校验相关的小工具 */

/** 检测是否是邮箱地址 */
export const isEmail = (value: string): boolean =>
  /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,3}){1,2})$/.test(value);

/** 检测是否是手机号 */
export const isMobile = (value: string): boolean => /^1[0-9]{10}$/.test(value);

/** 检测是否为 url */
export const isURL = (value: string): boolean => /^http[s]?:\/\/.*/.test(value);

/** 检测是否为数字类型 */
export const isNumber = (value: unknown): boolean =>
  Object.prototype.toString.call(value).slice(8, -1) === "Number";

/** 检测是否为 Boolean 类型 */
export const isBoolean = (value: unknown): boolean =>
  Object.prototype.toString.call(value).slice(8, -1) === "Boolean";

/** 检测是否微信浏览器 */
export const isWeiXin = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.match(/microMessenger/i)?.[0] === "micromessenger";
};

import JsBase64 from "js-base64";
import type { UserProfile, UserSettings } from "@/stores/types";

const USER_TOKEN = "LILI-TOKEN";
const USER_INFO = "LILI-USERINFO";
const USER_SETTING = "LILI-SETTING";

/** 设置用户授权 token */
export function setToken(token: string | null | undefined): void {
  if (token == null || token === "" || token === "undefined" || token === "null") {
    return;
  }
  localStorage.setItem(USER_TOKEN, token);
}

/** 获取授权 token */
export function getToken(): string | null {
  return localStorage.getItem(USER_TOKEN);
}

/** 设置用户信息（base64 后存 localStorage） */
export function setUserInfo(data: Partial<UserProfile>): void {
  localStorage.setItem(USER_INFO, JsBase64.Base64.encode(JSON.stringify(data)));
}

/** 获取用户信息 */
export function getUserInfo(): Partial<UserProfile> {
  const data = JsBase64.Base64.decode(localStorage.getItem(USER_INFO) || "");
  return data ? (JSON.parse(data) as Partial<UserProfile>) : {};
}

/** 获取用户本地缓存的设置信息 */
export function getUserSettingCache(): Partial<UserSettings> {
  const data = localStorage.getItem(USER_SETTING);
  return data ? (JSON.parse(data) as Partial<UserSettings>) : {};
}

/** 用户设置保存到浏览器缓存中 */
export function setUserSettingCache(state: unknown): void {
  localStorage.setItem(USER_SETTING, JSON.stringify(state));
}

/** 删除用户相关缓存信息 */
export function removeAll(): void {
  localStorage.removeItem(USER_TOKEN);
  localStorage.removeItem(USER_INFO);
  localStorage.removeItem(USER_SETTING);
}

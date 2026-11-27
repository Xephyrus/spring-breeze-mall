import { defineStore } from "pinia";
import { setUserInfo, getUserInfo, getToken } from "@/utils/auth";
import { defaultAvatar, defaultUserBanner } from "@/assets/images";
import type { UserProfile } from "./types";

interface UserState {
  /** 用户ID */
  id: string | number;
  /** 用户昵称 */
  name: string;
  /** 个性头像 */
  face?: string;
  /** 名片背景 */
  visitCardBag: string;
  /** 当前登录状态 */
  loginStatus: boolean;
  toUser: string;
}

// 判断用户是否登录（模块加载时初始化，与原 vuex user 模块行为一致）
function initState(): UserState {
  const state: UserState = {
    id: 0,
    name: "",
    face: defaultAvatar,
    visitCardBag: defaultUserBanner,
    loginStatus: false,
    toUser: "",
  };
  if (getToken()) {
    const userInfo = getUserInfo() as Partial<UserProfile> & { face?: string };
    state.name = userInfo.name ?? "";
    state.id = userInfo.id ?? 0;
    // 原代码如此：state.avatar 并不存在（恒为 undefined），保持行为不变
    state.face = userInfo.face ? userInfo.face : undefined;
    state.loginStatus = true;
  }
  return state;
}

export const useUserStore = defineStore("user", {
  state: initState,
  actions: {
    // 用户退出登录
    USER_LOGOUT(): void {
      this.id = 0;
      this.face = "";
      this.name = "";
      this.loginStatus = false;
    },

    // 设置用户登录状态
    UPDATE_LOGIN_STATUS(): void {
      this.loginStatus = true;
    },

    // 更新用户信息
    UPDATE_USER_INFO(data: Record<string, unknown>): void {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(this.$state, key)) {
          (this as unknown as Record<string, unknown>)[key] = data[key];
        }
      }

      // 保存用户信息到缓存
      setUserInfo({
        id: this.id,
        face: this.face,
        name: this.name,
      });
    },

    // 退出登录处理操作（原 vuex action ACT_USER_LOGOUT）
    ACT_USER_LOGOUT(): void {
      this.USER_LOGOUT();
    },
  },
});

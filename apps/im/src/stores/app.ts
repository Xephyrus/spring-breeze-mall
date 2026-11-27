import { defineStore } from "pinia";
import { defaultAvatar } from "@/assets/images";
import { useUserStore } from "./user";

// 原 vuex 根级别 state/mutation/getter
export const useAppStore = defineStore("app", {
  state: (): { socketStatus: boolean; website_name?: string; defaultAvatar: string } => ({
    socketStatus: false,
    website_name: import.meta.env.VUE_APP_WEBSITE_NAME,
    // 头像加载失败后的默认头像
    defaultAvatar: "this.src='" + defaultAvatar + "'",
  }),
  getters: {
    // 用户登录状态（跨模块读取 user store）
    loginStatus: (): boolean => useUserStore().loginStatus,
  },
  actions: {
    // 更新 socket 连接状态
    UPDATE_SOCKET_STATUS(status: boolean): void {
      this.socketStatus = status;
    },
  },
});

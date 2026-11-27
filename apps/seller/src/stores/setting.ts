import { defineStore } from "pinia";
import config from "@/config/index";

/** 站点偏好（商家端固定关闭多标签页内嵌模式） */
export interface SettingState {
  isUseTabsRouter: boolean;
  [key: string]: unknown;
}

const { setting } = config;

const localSetting = window.localStorage.getItem("setting");
const persisted: Record<string, unknown> = localSetting
  ? (JSON.parse(localSetting) as Record<string, unknown>)
  : {};

export const useSettingStore = defineStore("setting", {
  state: (): { setting: SettingState } => ({
    // 兼容已保存的其他偏好，旧浏览器中的多标签开启状态统一归为关闭
    setting: { ...setting, ...persisted, isUseTabsRouter: false },
  }),
  actions: {
    /** 更新其他页面偏好时，仍保持商家多标签模式关闭 */
    updateSetting(data: Record<string, unknown>): void {
      this.setting = { ...data, isUseTabsRouter: false };
    },
  },
});

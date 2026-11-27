import { defineStore } from "pinia";
import { getToken, getUserSettingCache, setUserSettingCache } from "@/utils/auth";
import type { UserSettings } from "./types";

// 模块加载时合并本地缓存的设置（与原 vuex settings 模块行为一致）
function initState(): UserSettings {
  const state: UserSettings = {
    // 主题模式 true:全屏模式 false:居中模式
    themeMode: true,
    // 主题模式为居中模式下，body 的背景图片
    themeBagImg: "bag003",
    // 主题颜色
    themeColor: "",
    // 消息提示音
    notifyCueTone: true,
    // 键盘输入事件消息推送开关
    keyboardEventNotify: true,
  };
  if (getToken()) {
    Object.assign(state, getUserSettingCache());
  }
  return state;
}

/**
 * 用户相关设置
 */
export const useSettingsStore = defineStore("settings", {
  state: initState,
  actions: {
    // 设置主题模式
    SET_THEME_MODE(mode: boolean): void {
      this.themeMode = mode;
      setUserSettingCache(this.$state);
    },

    // 设置主题的背景图片
    SET_THEME_BAGIMG(bagName: string): void {
      this.themeBagImg = bagName;
      setUserSettingCache(this.$state);
    },

    // 主题颜色
    SET_THEME_COLOR(color: string): void {
      this.themeColor = color;
      setUserSettingCache(this.$state);
    },

    // 设置消息提示音状态
    SET_NOTIFY_CUE_TONE(isTrue: boolean): void {
      this.notifyCueTone = isTrue;
      setUserSettingCache(this.$state);
    },

    // 设置键盘输入事件消息推送状态
    SET_KEYBOARD_EVENT_NOTIFY(isTrue: boolean): void {
      this.keyboardEventNotify = isTrue;
      setUserSettingCache(this.$state);
    },
  },
});

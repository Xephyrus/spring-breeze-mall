import { defineStore } from "pinia";
import type { FriendStatus } from "./types";

export const useNotifyStore = defineStore("notify", {
  state: (): {
    /** 聊天消息未读数 */
    unreadNum: number;
    /** 好友申请未读数 */
    applyNum: number;
    /** 好友键盘事件监听计数 */
    inputEvent: number;
    /** 好友登录状态监听 */
    friendStatus: FriendStatus;
  } => ({
    unreadNum: 0,
    applyNum: 0,
    inputEvent: 0,
    friendStatus: {
      // 登录状态[0:下线;1:在线;]
      status: 0,
      // 好友ID
      friend_id: 0,
    },
  }),
  actions: {
    // 消息未读数自增
    INCR_UNREAD_NUM(): void {
      this.unreadNum++;
    },

    // 好友申请事件监听
    INCR_APPLY_NUM(): void {
      this.applyNum++;
    },

    // 设置消息未读数
    SET_UNREAD_NUM(value: number): void {
      this.unreadNum = value;
    },

    // 设置好友申请未读数
    SET_APPLY_NUM(value: number): void {
      this.applyNum = value;
    },

    // 自增好友键盘输入事件
    UPDATE_KEYBOARD_EVENT(): void {
      this.inputEvent++;
    },

    // 更新好友登录状态
    UPDATE_FRIEND_STATUS(value: FriendStatus): void {
      this.friendStatus = value;
    },

    // 原 vuex action ACT_UPDATE_FRIEND_STATUS（推迟到下一轮事件循环再更新）
    ACT_UPDATE_FRIEND_STATUS(value: FriendStatus): Promise<void> {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.UPDATE_FRIEND_STATUS(value);
          resolve();
        }, 0);
      });
    },
  },
});

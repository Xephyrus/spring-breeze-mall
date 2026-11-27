import { defineStore } from "pinia";
import { getSort, getMutipSort } from "@/utils/functions";
import type { TalkItem } from "./types";

/** 未读消息提示（顶部轻提示） */
interface UnreadMessage {
  num: number;
  nickname: string;
  content: string;
}

export const useTalkStore = defineStore("talks", {
  state: (): {
    /** 用户对话列表 */
    items: TalkItem[];
    /** 最后一条未读消息 */
    unreadMessage: UnreadMessage;
    /** 对话列表重载状态 */
    heavyLoad: boolean;
  } => ({
    items: [],
    unreadMessage: {
      num: 0,
      nickname: "未知",
      content: "...",
    },
    heavyLoad: false,
  }),
  getters: {
    // 过滤所有置顶对话列表
    topItems: (state): TalkItem[] => state.items.filter((item) => item.is_top === 1),
    // 原 vuex getter，注意：sort 会原地修改 items 数组（历史行为，原样保留）
    talkItems: (state): TalkItem[] =>
      state.items.sort(getMutipSort([getSort((a: TalkItem, b: TalkItem) => (a.lastTalkTime ?? 0) > (b.lastTalkTime ?? 0))])),
    // 消息未读数总计
    unreadNum: (state): number =>
      state.items.reduce((total, item) => total + parseInt(String(item.unread ?? 0)), 0),
    talkNum: (state): number => state.items.length,
  },
  actions: {
    // 设置对话列表
    SET_TALK_ITEMS(resource: { items: TalkItem[] }): void {
      this.items = resource.items;
    },

    // 更新对话节点
    UPDATE_TALK_ITEM(resource: { index_name: string } & Record<string, unknown>): void {
      const index = this.items.findIndex(
        (item) => item.userId === resource.index_name.split("_")[1]
      );
      if (index >= 0) Object.assign(this.items[index], resource);
    },

    // 新增对话节点
    PUSH_TALK_ITEM(resource: TalkItem): void {
      this.items.push(resource);
    },

    // 移除对话节点
    REMOVE_TALK_ITEM(indexName: string): void {
      const index = this.items.findIndex((item) => item.index_name === indexName);
      if (index >= 0) this.items.splice(index, 1);
    },

    // 收到新消息时更新对应会话节点
    UPDATE_TALK_MESSAGE(resource: TalkItem & Record<string, unknown>): void {
      this.items.forEach((item) => {
        if (
          item.index_name === resource.index_name ||
          // eslint-disable-next-line eqeqeq -- 前后端 id 类型不一致（string vs number），需宽松比较
          item.userId == String(resource.index_name).split("_")[1]
        ) {
          item.unread = (item.unread ?? 0) + 1;
          item.msg_text = resource.msg_text;
          item.lastTalkTime = resource.updated_at;
          item.lastTalkMessage = resource.msg_text;
          if (resource.lastMessageType) {
            item.lastMessageType = resource.lastMessageType;
          }
          item.updated_at = resource.updated_at;
        }
      });
    },

    // 触发对话列表重新加载
    TRIGGER_TALK_ITEMS_LOAD(status = false): void {
      this.heavyLoad = status;
    },

    SET_TLAK_UNREAD_MESSAGE(resource: { nickname: string; content: string }): void {
      this.unreadMessage.num++;
      this.unreadMessage.nickname = resource.nickname;
      this.unreadMessage.content = resource.content;
    },

    // 清除最后一条未读消息
    CLEAR_TLAK_UNREAD_MESSAGE(): void {
      this.unreadMessage = {
        num: 0,
        nickname: "未知",
        content: "...",
      };
    },
  },
});

import { defineStore } from "pinia";
import type { TalkRecord } from "./types";

/** 切换会话时传入的参数 */
export interface DialogueSwitchPayload {
  talk_type: number | string;
  receiver_id: number | string;
  is_robot?: number | string;
}

export const useDialogueStore = defineStore("dialogue", {
  state: (): {
    /** 对话来源[1:私聊;2:群聊] */
    talk_type: number;
    /** 接收者ID */
    receiver_id: number;
    is_robot: number;
    /** 聊天记录 */
    records: TalkRecord[];
    /** ws 是否掉线（无输出状态） */
    webSocketWithOut: boolean;
    /** 对话索引（talk_type + '_' + receiver_id） */
    index_name: string | null;
  } => ({
    talk_type: 0,
    receiver_id: 0,
    is_robot: 0,
    records: [
      {
        id: "",
        createTime: "",
        toUser: "",
        isRead: false,
        messageType: "",
        talkId: "",
        text: "",
        float: "",
      },
    ],
    webSocketWithOut: false,
    index_name: null,
  }),
  actions: {
    // 设置 ws 状态
    SET_WS_STATUS(resource: boolean): void {
      this.webSocketWithOut = resource;
    },

    // 更新对话（切换会话时清空并重置索引）
    UPDATE_DIALOGUE_MESSAGE(resource: DialogueSwitchPayload): void {
      this.records = [];
      this.talk_type = parseInt(String(resource.talk_type));
      this.receiver_id = parseInt(String(resource.receiver_id));
      this.is_robot = parseInt(String(resource.is_robot ?? 0));

      /**
       * receiver_id 就是好友 id
       * 比如 a 和 b 聊天，receiver_id = b 的 id
       */
      this.index_name = (resource.talk_type || 1) + "_" + resource.receiver_id;
    },

    // 数组头部压入对话记录
    UNSHIFT_DIALOGUE(records: TalkRecord[]): void {
      if (this.records.length > 0) {
        this.records.unshift(...records);
      } else {
        this.records.push(...records);
      }
    },

    // 推送单条对话记录（带上当前 ws 状态）
    PUSH_DIALOGUE(record: TalkRecord): void {
      const next = { ...record, webSocketStatus: this.webSocketWithOut };
      this.records.push(next);
    },

    // 更新对话记录
    UPDATE_DIALOGUE(resource: TalkRecord): void {
      const target = this.records.find((item) => item.id === resource.id);
      if (target) Object.assign(target, resource);
    },

    // 删除对话记录
    DELETE_DIALOGUE(index: number): void {
      this.records.splice(index, 1);
    },

    BATCH_DELETE_DIALOGUE(ids: Array<string | number>): void {
      ids.forEach((recordId) => {
        // eslint-disable-next-line eqeqeq -- 前后端 id 类型不一致（string vs number），需宽松比较
        const index = this.records.findIndex((item) => item.id == recordId);
        if (index >= 0) this.records.splice(index, 1);
      });
    },

    // 整体替换对话记录
    SET_DIALOGUE(records: TalkRecord[]): void {
      this.records = records;
    },
  },
});

import Base, { type SocketResource } from "./base";
import { nextTick } from "vue";
import type { Component } from "vue";
import { getAppBridge } from "@/utils/app-bridge";
import NewMessageNotify from "@/components/notify/new-message-notify.vue";
import { ServeClearTalkUnreadNum, ServeCreateTalkList } from "@/api/chat";
import { formatTalkItem, toTalk } from "@/utils/talk";
import { parseTime } from "@/utils/functions";
import { useTalkStore } from "@/stores/talk";
import { useNotifyStore } from "@/stores/notify";
import { useDialogueStore } from "@/stores/dialogue";
import type { TalkRecord } from "@/stores/types";

/** 聊天消息推送的资源结构（后端字段命名不完全统一，这里按实际使用声明） */
export interface TalkResource extends SocketResource {
  fromUser?: string | number;
  toUser?: string | number;
  userId?: string | number;
  messageType?: string;
  msg_type?: string;
  content?: string;
  text?: string;
  avatar?: string;
  nickname?: string;
  group_avatar?: string;
  group_name?: string;
  created_at?: string;
  name?: string;
  float?: string;
}

/**
 * 聊天消息事件处理。
 *
 * 负责：把推送消息插入当前会话、更新会话列表、未读计数与桌面通知。
 */
export default class Talk extends Base {
  resource: TalkResource;

  /** 发送者 ID */
  sender_id: string | number = 0;

  /** 接收者 ID */
  receiver_id: string | number = 0;

  /** 聊天类型[1:私聊;2:群聊;] */
  talk_type = 0;

  constructor(resource: TalkResource) {
    super();
    this.sender_id = resource.fromUser ?? 0;
    this.receiver_id = resource.toUser ?? 0;
    // 后端推送的 messageType 是消息内容类型（MESSAGE/PICTURE/GOODS/ORDERS），私聊会话类型固定为 1
    this.talk_type = Number(resource.talk_type) || 1;

    this.resource = resource;

    // 判断发送者是否已在当前用户列表中，不在则触发一次用户信息刷新
    const bridge = getAppBridge();
    if (this.sender_id && !useTalkStore().items.some((item) => item.userId == this.sender_id)) {
      (bridge.loadUserSetting as (type: string) => void)("update");
    }
  }

  /** 判断消息发送者是否是我自己 */
  isCurrSender(): boolean {
    return this.sender_id == this.getAccountId();
  }

  /** 获取对话索引 */
  getIndexName(): string {
    if (this.talk_type == 2) {
      return `${this.talk_type}_${this.receiver_id}`;
    }

    const receiver_id = this.isCurrSender() ? this.receiver_id : this.sender_id;
    return `${this.talk_type}_${receiver_id}`;
  }

  /** 消息气泡的浮动方式：center / right / left */
  getFloatType(): string {
    const userId = this.resource.userId;

    if (userId == 0) return "center";

    return userId == this.getAccountId() ? "right" : "left";
  }

  /** 获取消息内容类型（MESSAGE/PICTURE/GOODS/ORDERS） */
  getMessageType(): string {
    return this.resource.messageType || this.resource.msg_type || "MESSAGE";
  }

  /** 获取会话列表左侧展示的文案（图片/商品/订单用占位文案） */
  getTalkText(): string {
    let text = this.resource.content || this.resource.text || "";
    switch (this.getMessageType()) {
      case "PICTURE":
        text = "[图片]";
        break;
      case "GOODS":
        text = "[商品链接]";
        break;
      case "ORDERS":
        text = "[订单链接]";
        break;
    }

    return text;
  }

  handle(): boolean | void {
    // 不在聊天页：只累加未读，并在不是自己发的消息时弹通知
    if (!this.isTalkPage()) {
      useNotifyStore().INCR_UNREAD_NUM();

      if (!this.isCurrSender()) {
        this.showMessageNocice();
      }
      return;
    }

    // 正在和该好友对话 → 直接插入气泡；否则只更新会话列表
    if (this.isTalk(1, this.receiver_id, this.sender_id)) {
      this.insertTalkRecord();
    } else {
      this.updateTalkItem();
    }
  }

  /** 显示消息通知 */
  showMessageNocice(): void {
    let avatar = this.resource.avatar;
    let nickname = this.resource.nickname ?? "";
    const talk_type = this.resource.talk_type;
    let receiver_id = this.receiver_id;

    if (talk_type == 2) {
      avatar = this.resource.group_avatar;
      nickname += `【 ${this.resource.group_name ?? ""} 】`;
    } else {
      receiver_id = this.sender_id;
    }

    const bridge = getAppBridge();
    // NewMessageNotify 是 JS 组件（props 未声明类型），h() 处显式断言为 Component
    this.$notify({
      message: bridge.$createElement(NewMessageNotify as unknown as Component, {
        avatar,
        talk_type,
        nickname,
        content: this.getTalkText(),
        datetime: this.resource.created_at,
      }),
      customClass: "im-notify",
      duration: 3000,
      position: "top-right",
      onClick: function (this: { close: () => void }) {
        this.close();
        toTalk(talk_type ?? 1, receiver_id);
      },
    });
  }

  /** 加载对接节点（收到陌生人的消息时把会话补进列表） */
  addTalkItem(): void {
    let receiver_id = this.sender_id;
    const talk_type = this.talk_type;

    if (talk_type == 1 && this.receiver_id != this.getAccountId()) {
      receiver_id = this.receiver_id;
    } else if (talk_type == 2) {
      receiver_id = this.receiver_id;
    }

    ServeCreateTalkList(receiver_id).then((raw) => {
      const { code, data } = raw as { code?: number; data?: Record<string, unknown> };
      if (code == 200 && data) {
        useTalkStore().PUSH_TALK_ITEM(formatTalkItem(data));
      }
    });
  }

  /** 插入对话记录（当前正在和该好友聊天） */
  insertTalkRecord(): void {
    const talkStore = useTalkStore();
    const dialogueStore = useDialogueStore();
    const record = { ...this.resource, float: this.getFloatType() } as TalkRecord;

    dialogueStore.PUSH_DIALOGUE(record);

    // 获取聊天面板元素节点
    const el = document.getElementById("lumenChatPanel");

    // 判断滚动条是否在底部
    const isBottom = el
      ? Math.ceil(el.scrollTop) + el.clientHeight >= el.scrollHeight
      : false;

    if (isBottom || record.userId == this.getAccountId() || record.fromUser == this.getAccountId()) {
      nextTick(() => {
        if (el) el.scrollTop = el.scrollHeight;
      });
    } else {
      talkStore.SET_TLAK_UNREAD_MESSAGE({
        content: this.getTalkText(),
        nickname: String(record.name ?? ""),
      });
    }

    const nowTime = parseTime(new Date()) as string;
    const msgText = this.getTalkText() || record.text;
    talkStore.UPDATE_TALK_ITEM({
      index_name: this.getIndexName(),
      msg_text: msgText,
      lastTalkMessage: msgText,
      lastTalkTime: nowTime,
      lastMessageType: this.getMessageType(),
      updated_at: nowTime,
    });

    // 清除该会话未读数
    if (this.talk_type == 1 && this.getAccountId() !== this.sender_id) {
      ServeClearTalkUnreadNum({
        talk_type: 1,
        receiver_id: this.sender_id,
      });
    }
  }

  /** 更新对话列表记录（不在当前会话） */
  updateTalkItem(): void {
    useNotifyStore().INCR_UNREAD_NUM();

    useTalkStore().UPDATE_TALK_MESSAGE({
      index_name: this.getIndexName(),
      msg_text: this.getTalkText(),
      lastMessageType: this.getMessageType(),
      updated_at: parseTime(new Date()) as string,
    } as never);
  }
}

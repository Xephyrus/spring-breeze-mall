import { useAppStore } from "@/stores/app";
import { useDialogueStore } from "@/stores/dialogue";
import config from "@/config/config";
import WsSocket from "@/plugins/ws-socket";
import { getToken } from "@/utils/auth";
import { ElNotification } from "element-plus";

// 消息处理类
import KeyboardEvent from "@/im-server/event/keyboard";
import LoginEvent from "@/im-server/event/login";
import TalkEvent, { type TalkResource } from "@/im-server/event/talk";
import RevokeEvent from "@/im-server/event/revoke";
import GroupJoinEvent from "@/im-server/event/group-join";
import FriendApplyEvent from "@/im-server/event/friend-apply";
import type { SocketResource } from "@/im-server/event/base";

/** 推送消息统一外壳 */
interface SocketEnvelope {
  messageResultType?: string;
  result?: SocketResource & { message?: string; pictureUrl?: string; talkId?: string };
}

/**
 * SocketInstance 连接实例。
 *
 * 所有 WebSocket 消息的接收与分发都集中在这里：
 * 按后端推送的事件名创建对应的事件处理类并调用 handle()。
 */
class SocketInstance {
  /** WsSocket 实例 */
  socket: WsSocket;

  constructor() {
    this.socket = new WsSocket(
      () => `${config.BASE_WS_URL}/${getToken() ?? ""}`,
      {
        onError: () => {
          console.log("Websocket 连接失败回调方法");
        },
        onOpen: () => {
          this.updateSocketStatus(true);
        },
        onClose: () => {
          this.updateSocketStatus(false);
        },
      }
    );

    this.registerEvents();
  }

  /** 连接 WebSocket 服务 */
  connect(): void {
    console.log("🔗连接 WebSocket");
    this.socket.connection();
  }

  /** 注册回调消息处理事件 */
  registerEvents(): void {
    this.socket.on("event_talk", (data: TalkResource) => {
      new TalkEvent(data).handle();
    });

    this.socket.on("event_online_status", (data: SocketResource) => {
      new LoginEvent(data).handle();
    });

    this.socket.on("event_keyboard", (data: SocketResource) => {
      new KeyboardEvent(data).handle();
    });

    this.socket.on("event_revoke_talk", (data: SocketResource) => {
      new RevokeEvent(data).handle();
    });

    this.socket.on("event_friend_apply", (data: SocketResource) => {
      new FriendApplyEvent(data).handle();
    });

    this.socket.on("join_group", (data: SocketResource) => {
      new GroupJoinEvent(data).handle();
    });

    this.socket.on("event_error", (data: SocketEnvelope["result"]) => {
      if (!data) return;
      // 被服务端拒绝的图片标记为失败，避免乐观展示被误认为发送成功
      if (data.pictureUrl) {
        useDialogueStore().records.forEach((record) => {
          if (
            record.messageType === "PICTURE" &&
            record.float === "right" &&
            record.talkId === data.talkId &&
            record.text === data.pictureUrl
          ) {
            record.webSocketStatus = true;
          }
        });
      }
      ElNotification({
        title: "友情提示",
        message: String(data.message ?? ""),
        type: "warning",
      });
    });
  }

  /** 更新 WebSocket 连接状态 */
  updateSocketStatus(status: boolean): void {
    useAppStore().UPDATE_SOCKET_STATUS(status);
  }

  /** 推送消息 */
  emit(event: string, data: unknown): void {
    this.socket.emit(event, data);
  }
}

export default new SocketInstance();

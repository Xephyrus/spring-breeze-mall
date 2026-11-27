import { useUserStore } from "@/stores/user";
import { useDialogueStore } from "@/stores/dialogue";
import router from "@/router";
import { ElNotification } from "element-plus";

/** 当前会话参数 */
export interface TalkParams {
  talk_type: number;
  receiver_id: number;
  index_name: string | null;
}

/** WebSocket 推送消息的公共结构（各事件按需取字段） */
export interface SocketResource {
  talk_type?: number | string;
  sender_id?: number | string;
  receiver_id?: number | string;
  user_id?: number | string;
  status?: number;
  record_id?: string;
  [key: string]: unknown;
}

/**
 * WebSocket 事件处理基类：提供当前会话判定、通知弹窗等能力。
 */
export default class Base {
  /** 通知方法（便于子类复用 / 单测替换） */
  $notify = ElNotification;

  /** 获取当前登录用户 ID */
  getAccountId(): string | number {
    return useUserStore().id;
  }

  /** 获取当前会话参数 */
  getTalkParams(): TalkParams {
    const { talk_type, receiver_id, index_name } = useDialogueStore();
    return { talk_type, receiver_id, index_name };
  }

  /**
   * 判断消息是否来自当前对话
   *
   * @param talk_type 聊天消息类型[1:私信;2:群聊;]
   * @param sender_id 发送者 ID
   * @param receiver_id 接收者 ID
   */
  isTalk(
    talk_type?: number | string,
    sender_id?: number | string,
    receiver_id?: number | string
  ): boolean {
    const params = this.getTalkParams();

    if (talk_type !== params.talk_type) {
      return false;
    }
    // eslint-disable-next-line eqeqeq -- 前后端 id 类型不一致（string vs number），需宽松比较
    return params.receiver_id == Number(receiver_id) || params.receiver_id == Number(sender_id);
  }

  /** 判断用户是否打开对话页 */
  isTalkPage(): boolean {
    const path = router.currentRoute.value.path;
    return !(path !== "/message" && path !== "/");
  }
}

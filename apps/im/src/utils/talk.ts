import { useTalkStore } from "@/stores/talk";
import router from "@/router";
import { ServeCreateTalkList } from "@/api/chat";
import type { TalkItem } from "@/stores/types";

const KEY_INDEX_NAME = "send_message_index_name";

/** 通过对话索引查找对话列表下标 */
export function findTalkIndex(indexName: string): number {
  return useTalkStore().items.findIndex((item) => item.index_name == indexName);
}

/** 通过对话索引查找对话列表 */
export function findTalk(indexName: string): TalkItem | undefined {
  return useTalkStore().items.find((item) => item.index_name == indexName);
}

/** 格式化后的会话项（在 TalkItem 基础上补齐可编辑字段） */
export interface FormattedTalkItem extends TalkItem {
  id: string;
  disable: boolean;
  face: string;
  lastTalkTime: number | string;
  name: string;
  top: boolean;
  draft_text: string;
  is_online: number;
  talk_type: number;
  receiver_id: string | number;
}

/** 格式化聊天对话列表数据 */
export function formatTalkItem(params: Record<string, unknown> = {}): FormattedTalkItem {
  const options = {
    id: "",
    disable: false,
    face: "",
    lastTalkTime: "",
    name: "",
    top: false,
    unread: 0, // 未读消息
    is_online: 0, // 是否在线
    draft_text: "", // 草稿
    msg_text: "", // 存储的消息
    userId: "",
  } as Record<string, unknown> & { [key: string]: unknown };

  Object.assign(options, params);
  options.talk_type = options.talk_type || 1;
  options.receiver_id = options.receiver_id || options.userId;
  options.index_name = `${options.talk_type}_${options.receiver_id}`;

  return options as unknown as FormattedTalkItem;
}

/** 打开指定对话窗口 */
export function toTalk(talkType: number | string, receiverId: number | string): void {
  ServeCreateTalkList(receiverId).then((raw) => {
    const { code } = raw as { code?: number; data?: unknown };
    if (code == 200) {
      sessionStorage.setItem(KEY_INDEX_NAME, `${talkType}_${receiverId}`);
      router.push({
        path: "/message",
        query: {
          v: new Date().getTime(),
        },
      });
    }
  });
}

/** 获取需要打开的对话索引值（读取后即清除） */
export function getCacheIndexName(): string | null {
  const indexName = sessionStorage.getItem(KEY_INDEX_NAME);
  if (indexName) {
    sessionStorage.removeItem(KEY_INDEX_NAME);
  }

  return indexName;
}

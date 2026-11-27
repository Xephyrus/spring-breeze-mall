/**
 * im 端 store 共享类型。
 *
 * 这些结构大多来自后端推送/查询的松散 JSON（字段命名有 camelCase 也有 snake_case，
 * 属上游历史风格），因此统一用「必填核心字段 + 索引签名」的方式声明，
 * 既给出可用的类型提示，又不因为后端多返回字段就报错。
 */

/** 聊天记录（对话气泡） */
export interface TalkRecord {
  id: string;
  createTime: string;
  toUser: string;
  isRead: boolean;
  messageType: string;
  talkId: string;
  text: string;
  float: string;
  /** 前端本地标记：该条消息是否因断网未发送成功 */
  webSocketStatus?: boolean;
  [key: string]: unknown;
}

/** 会话列表项 */
export interface TalkItem {
  index_name: string;
  userId: string;
  nickname?: string;
  unread: number;
  msg_text?: string;
  lastTalkTime?: number | string;
  lastTalkMessage?: string;
  lastMessageType?: string;
  updated_at?: number | string;
  is_top?: number;
  [key: string]: unknown;
}

/** 好友登录状态推送 */
export interface FriendStatus {
  status: number;
  friend_id: number | string;
}

/** 用户会话档案（缓存到 localStorage） */
export interface UserProfile {
  id: string | number;
  name: string;
  face?: string;
}

/** 用户设置（本地缓存） */
export interface UserSettings {
  themeMode: boolean;
  themeBagImg: string;
  themeColor: string;
  notifyCueTone: boolean;
  keyboardEventNotify: boolean;
}

/** 表情包分组 */
export interface EmoticonGroup {
  emoticon_id?: string;
  name?: string;
  list?: EmoticonItem[];
  [key: string]: unknown;
}

/** 单个表情 */
export interface EmoticonItem {
  emoticon_id?: string;
  url?: string;
  [key: string]: unknown;
}

/** 便签标签 */
export interface NoteTag {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

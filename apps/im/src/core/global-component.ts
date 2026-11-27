import type { App, Component } from "vue";
import {
  AudioMessage,
  CodeMessage,
  ForwardMessage,
  ImageMessage,
  TextMessage,
  VideoMessage,
  VoiceMessage,
  SystemTextMessage,
  FileMessage,
  InviteMessage,
  RevokeMessage,
  VisitCardMessage,
  ReplyMessage,
  VoteMessage,
  LoginMessage,
} from "@/components/chat/messaege";
import UserCard from "@/components/user/user-card/index";
import LegacyElIcon from "@/components/global/LegacyElIcon.vue";
import { resolveLegacyIcon } from "@/core/legacy-icon-map";

const messageComponents: Component[] = [
  AudioMessage,
  CodeMessage,
  ForwardMessage,
  ImageMessage,
  TextMessage,
  VideoMessage,
  VoiceMessage,
  SystemTextMessage,
  FileMessage,
  InviteMessage,
  RevokeMessage,
  VisitCardMessage,
  ReplyMessage,
  VoteMessage,
  LoginMessage,
];

/** 注册消息气泡、legacy 图标与现代图标组件 */
export function registerGlobalComponents(app: App): void {
  messageComponents.forEach((component) => {
    // 消息组件都声明了 name（用于 <component :is="messageType"> 的动态渲染）
    const name = (component as { name?: string }).name;
    if (name) app.component(name, component);
  });
  app.component("legacy-el-icon", LegacyElIcon);
  app.config.globalProperties.$legacyIcon = resolveLegacyIcon;
  app.use(UserCard);
}

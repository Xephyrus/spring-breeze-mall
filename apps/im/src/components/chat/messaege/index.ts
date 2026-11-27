import type { Component } from "vue";
import AudioMessage from "./AudioMessage.vue";
import CodeMessage from "./CodeMessage.vue";
import ForwardMessage from "./ForwardMessage.vue";
import ImageMessage from "./ImageMessage.vue";
import TextMessage from "./TextMessage.vue";
import VideoMessage from "./VideoMessage.vue";
import VoiceMessage from "./VoiceMessage.vue";
import SystemTextMessage from "./SystemTextMessage.vue";
import FileMessage from "./FileMessage.vue";
import InviteMessage from "./InviteMessage.vue";
import RevokeMessage from "./RevokeMessage.vue";
import VisitCardMessage from "./VisitCardMessage.vue";
import ReplyMessage from "./ReplyMessage.vue";
import VoteMessage from "./VoteMessage.vue";
import LoginMessage from "./LoginMessage.vue";

/** 所有消息气泡组件（供 core/global-component 按 name 全局注册） */
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

export {
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
};
export default messageComponents;

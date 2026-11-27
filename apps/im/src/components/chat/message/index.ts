import type { Component } from "vue";
import AudioMessage from "./audio-message.vue";
import CodeMessage from "./code-message.vue";
import ForwardMessage from "./forward-message.vue";
import ImageMessage from "./image-message.vue";
import TextMessage from "./text-message.vue";
import VideoMessage from "./video-message.vue";
import VoiceMessage from "./voice-message.vue";
import SystemTextMessage from "./system-text-message.vue";
import FileMessage from "./file-message.vue";
import InviteMessage from "./invite-message.vue";
import RevokeMessage from "./revoke-message.vue";
import VisitCardMessage from "./visit-card-message.vue";
import ReplyMessage from "./reply-message.vue";
import VoteMessage from "./vote-message.vue";
import LoginMessage from "./login-message.vue";

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

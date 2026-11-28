// @ts-nocheck
/**
 * 条件编译「双实现」文件：`#ifndef MP-WEIXIN` 是完整实现，`#ifdef MP-WEIXIN` 是精简实现，
 * 两段各自定义了同名 class / 导出函数（mqtt 客户端、腾讯 IM、直播 MQTT）。
 *
 * 为什么整文件 @ts-nocheck：
 * - TS 看不到 uni 的编译期裁剪，会认为同名 class 重复声明（TS2300/TS2393/TS2323），
 *   而这些错误**在真机上根本不存在**（每个平台只会保留一段）；
 * - 逐行 `@ts-expect-error` 能压住，但这里重复的是**整个类**（200+ 行），
 *   压制点会随平台分支改动不断漂移，维护成本高于收益；
 * - 本文件对外只暴露 `createMqttClient()` / `LiveMqttService` / `LiveChatService`
 *   这几个入口，调用侧（直播页、room.vue）是类型化的，接口形状在调用处已被约束。
 *
 * 仍然保留 ESLint（语法、未使用变量、条件编译结构都会检查）。
 */
/**
 * 直播腾讯云 IM（由 saas-uni-v3 useChat 迁移）
 */
// #ifndef MP-WEIXIN
import TencentCloudChat from "@tencentcloud/chat";
import { fetchLiveSetting } from "./live-setting";

const MAX_MESSAGE_COUNT = 100;

export class LiveChatService {
  // 以下字段在构造函数里动态挂载（原 JS 写法），这里补声明以通过类型检查
  _onKickedOut: any;
  _onMessageReceived: any;
  _onSdkNotReady: any;
  _onSdkReady: any;
  chat: any;
  defaultAvatar: any;
  hasMoreHistory: any;
  isAtBottom: any;
  isLoadingHistory: any;
  liveId: any;
  messageIdSet: any;
  messageList: any;
  nextReqMessageID: any;
  onMessagesChange: any;
  onScrollToBottom: any;
  savedViewLiveResult: any;
  unreadCount: any;
  userInfo: any;
  constructor(options = {}) {
    this.liveId = options.liveId || "";
    this.userInfo = options.userInfo || {};
    this.defaultAvatar = options.defaultAvatar || "";
    this.onMessagesChange = options.onMessagesChange || (() => {});
    this.onScrollToBottom = options.onScrollToBottom || (() => {});

    this.chat = null;
    this.groupID = "";
    this.messageList = [];
    this.messageIdSet = new Set();
    this.savedViewLiveResult = null;
    this.isAtBottom = true;
    this.unreadCount = 0;
    this.isLoadingHistory = false;
    this.hasMoreHistory = false;
    this.nextReqMessageID = "";

    this._onMessageReceived = this.onMessageReceived.bind(this);
    this._onSdkReady = this.onSdkReady.bind(this);
    this._onSdkNotReady = this.onSdkNotReady.bind(this);
    this._onKickedOut = this.onKickedOut.bind(this);
  }

  setGroupID(id) {
    this.groupID = id ? String(id) : "";
  }

  async initTencentIm(viewLiveResult) {
    if (!this.groupID) {
      console.warn("groupID 不存在，跳过 IM 初始化");
      return;
    }

    const setting = await fetchLiveSetting(this.liveId);
    if (!setting?.imSdkAppid) {
      console.warn("IM SDKAppID 未配置，跳过 IM 初始化");
      return;
    }

    if (viewLiveResult?.userSig) {
      this.savedViewLiveResult = viewLiveResult;
    }

    if (this.chat) {
      this.loginChat(viewLiveResult);
      return;
    }

    const chatInstance = TencentCloudChat.create({
      SDKAppID: Number(setting.imSdkAppid),
    });
    this.chat = chatInstance;
    chatInstance.setLogLevel(1);

    chatInstance.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, this._onMessageReceived);
    chatInstance.on(TencentCloudChat.EVENT.SDK_READY, this._onSdkReady);
    chatInstance.on(TencentCloudChat.EVENT.SDK_NOT_READY, this._onSdkNotReady);
    chatInstance.on(TencentCloudChat.EVENT.KICKED_OUT, this._onKickedOut);

    this.loginChat(viewLiveResult);
  }

  onSdkNotReady() {
    console.log("[SDK Not Ready，重新登录]");
    this.loginChat();
  }

  loginChat(viewLiveResult) {
    if (!this.chat) return;

    const source =
      (viewLiveResult?.userSig ? viewLiveResult : null) || this.savedViewLiveResult;
    const userId = source?.userId || this.userInfo?.id;
    const userSig = source?.userSig;

    if (!userId || !userSig) {
      console.warn("用户ID或签名不存在", { userId, userSig });
      return;
    }

    this.chat
      .login({
        userID: `${userId}`,
        userSig,
      })
      .then((imResponse) => {
        if (imResponse.data.repeatLogin === true) {
          this.joinGroup();
          this.getHistoryMessageList("");
        }
      })
      .catch((imError) => {
        console.warn("login error:", imError);
      });
  }

  onSdkReady() {
    console.log("[SDK Ready]");
    this.updateUserInfo();
    this.joinGroup();
    this.getHistoryMessageList("");
  }

  onKickedOut() {
    console.log("[用户被踢下线，重新登录]");
    this.loginChat();
  }

  updateUserInfo() {
    if (!this.chat || !this.userInfo) return;

    this.chat.updateMyProfile({
      nick: this.userInfo.nickName || this.userInfo.username || "用户",
      avatar: this.userInfo.face || this.defaultAvatar,
      gender: TencentCloudChat.TYPES.GENDER_UNKNOWN,
      allowType: TencentCloudChat.TYPES.ALLOW_TYPE_ALLOW_ANY,
    });
  }

  joinGroup() {
    if (!this.chat || !this.groupID) return;

    this.chat
      .joinGroup({
        groupID: this.groupID,
        type: TencentCloudChat.TYPES.GRP_AVCHATROOM,
      })
      .then((imResponse) => {
        switch (imResponse.data.status) {
          case TencentCloudChat.TYPES.JOIN_STATUS_SUCCESS:
          case TencentCloudChat.TYPES.JOIN_STATUS_ALREADY_IN_GROUP:
            this.getHistoryMessageList("");
            break;
          default:
            break;
        }
      })
      .catch((imError) => {
        console.warn("joinGroup error:", imError);
        this.getHistoryMessageList("");
      });
  }

  async getHistoryMessageList(nextReqId) {
    if (this.isLoadingHistory || !this.chat || !this.groupID) return;

    this.isLoadingHistory = true;

    const requestParams = {
      conversationID: `GROUP${this.groupID}`,
      direction: 0,
    };
    if (nextReqId) {
      requestParams.nextReqMessageID = nextReqId;
    }

    try {
      const imResponse = await this.chat.getMessageList(requestParams);
      const msgList = imResponse.data.messageList || [];
      const nextId = imResponse.data.nextReqMessageID;
      const isCompleted = imResponse.data.isCompleted;

      msgList.forEach((msg) => {
        this.addMessageToList(this.formatReceivedMessage(msg), "append");
      });

      if (!this.nextReqMessageID) {
        this.scrollToBottom();
      }

      this.nextReqMessageID = nextId;
      this.hasMoreHistory = !isCompleted;
    } catch (imError) {
      console.warn("getMessageList error:", imError);
    } finally {
      this.isLoadingHistory = false;
    }
  }

  formatReceivedMessage(message) {
    let messageText = "";
    let username = "";
    let isSystem = false;

    if (message.from === "@TIM#SYSTEM") {
      username = "系统消息";
      isSystem = true;
    } else {
      username = message.nick || message.from || "用户";
    }

    const avatar = message.avatar || this.defaultAvatar || null;

    if (message.type === TencentCloudChat.TYPES.MSG_TEXT || message.type === "TIMTextElem") {
      messageText = message.payload?.text || "";
    } else if (
      message.type === TencentCloudChat.TYPES.MSG_CUSTOM ||
      message.type === "TIMCustomElem"
    ) {
      try {
        const customData = JSON.parse(message.payload.data);
        messageText = customData.content || "系统消息";
        username = "系统消息";
        isSystem = true;
      } catch (e) {
        messageText = "系统消息";
        username = "系统消息";
        isSystem = true;
      }
    } else {
      messageText = "欢迎加入直播间";
    }

    return {
      username,
      message: messageText,
      avatar: isSystem ? this.defaultAvatar : avatar,
      messageId: message.ID,
      time: message.time,
      type: message.type,
      isSystem,
    };
  }

  toRoomMessage(item) {
    return {
      id: item.messageId,
      userName: item.username,
      userFace: item.avatar || this.defaultAvatar,
      message: item.message,
      isSystem: item.isSystem,
    };
  }

  emitMessagesChange() {
    this.onMessagesChange(
      this.messageList.map((item) => this.toRoomMessage(item))
    );
  }

  onMessageReceived(event) {
    const msgList = event.data || [];
    msgList.forEach((message) => {
      if (message.type === TencentCloudChat.TYPES.MSG_TEXT) {
        const formattedMessage = this.formatReceivedMessage(message);
        this.addMessageToList(formattedMessage, "append");

        if (this.isAtBottom) {
          this.scrollToBottom();
        } else {
          this.unreadCount += 1;
        }
      }
    });
  }

  addMessageToList(message, mode = "append") {
    if (!message.messageId || this.messageIdSet.has(message.messageId)) return;

    this.messageIdSet.add(message.messageId);

    if (mode === "append") {
      this.messageList.push(message);
      if (this.messageList.length > MAX_MESSAGE_COUNT) {
        const removeCount = this.messageList.length - MAX_MESSAGE_COUNT;
        const removed = this.messageList.splice(0, removeCount);
        removed.forEach((item) => this.messageIdSet.delete(item.messageId));
      }
    } else {
      this.messageList.unshift(message);
      if (this.messageList.length > MAX_MESSAGE_COUNT) {
        const removeCount = this.messageList.length - MAX_MESSAGE_COUNT;
        const removed = this.messageList.splice(-removeCount, removeCount);
        removed.forEach((item) => this.messageIdSet.delete(item.messageId));
      }
    }

    this.emitMessagesChange();
  }

  scrollToBottom() {
    this.isAtBottom = true;
    this.unreadCount = 0;
    setTimeout(() => {
      this.onScrollToBottom();
    }, 100);
  }

  markAtBottom(isBottom) {
    this.isAtBottom = isBottom;
    if (isBottom) {
      this.unreadCount = 0;
    }
  }

  cleanup() {
    if (this.chat) {
      try {
        this.chat.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, this._onMessageReceived);
        this.chat.off(TencentCloudChat.EVENT.SDK_READY, this._onSdkReady);
        this.chat.off(TencentCloudChat.EVENT.SDK_NOT_READY, this._onSdkNotReady);
        this.chat.off(TencentCloudChat.EVENT.KICKED_OUT, this._onKickedOut);
        this.chat.logout?.();
      } catch (error) {
        console.error("清理腾讯云IM失败:", error);
      }
      this.chat = null;
    }
    this.messageList = [];
    this.messageIdSet.clear();
    this.savedViewLiveResult = null;
  }
}
// #endif

// #ifdef MP-WEIXIN
export class LiveChatService {
  constructor() {}
  setGroupID() {}
  async initTencentIm() {}
  cleanup() {}
}
// #endif

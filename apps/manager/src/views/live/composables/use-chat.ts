import { nextTick, ref, unref, watch, type MaybeRef } from "vue";
import TencentCloudChat from "@tencentcloud/chat";
import { resolveImConfigFromDetail } from "./use-live-setting";
import { genTestUserSig } from "../utils/generate-test-user-sig";

const MAX_MESSAGE_COUNT = 100;
const ADMIN_IM_USER_ID = "admin";

/** 直播间详情：本组合式函数只透传给 resolveImConfigFromDetail */
type LiveDetailLike = Record<string, unknown>;

/** 当前管理员信息（登录后由后端返回） */
type AdminUserInfo = {
  nickName?: string;
  username?: string;
  face?: string;
};

/** IM 原始消息：按本文件用到的字段取子集 */
type ImRawMessage = {
  ID?: string;
  type?: string;
  from?: string;
  nick?: string;
  avatar?: string;
  time?: number;
  payload?: { text?: string; data?: string };
};

/** 组件内部渲染用的聊天消息 */
type ChatMessage = {
  username: string;
  message: string;
  avatar: string | null;
  messageId?: string;
  time?: number;
  type?: string;
  isSystem: boolean;
};

/** 新增消息的位置 */
type AddMode = "append" | "prepend";

/** 列表滚动信息 */
type ScrollDetail = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/**
 * IM 实例：只声明本文件用到的能力。
 * 腾讯云 SDK 自带类型体积大且版本耦合强，这里按需收窄，避免引入整个 SDK 类型。
 */
type ImChatInstance = {
  on: (event: string, handler: (payload: unknown) => void) => void;
  off: (event: string, handler: (payload: unknown) => void) => void;
  setLogLevel: (level: number) => void;
  login: (options: { userID: string; userSig: string }) => Promise<{ data: { repeatLogin?: boolean } }>;
  logout?: () => Promise<unknown>;
  updateMyProfile: (profile: Record<string, unknown>) => Promise<unknown>;
  joinGroup: (options: { groupID: string; type: string }) => Promise<unknown>;
  getMessageList: (params: {
    conversationID: string;
    direction: number;
    nextReqMessageID?: string;
  }) => Promise<{
    data: {
      messageList: ImRawMessage[];
      nextReqMessageID: string;
      isCompleted: boolean;
    };
  }>;
};

/** 统一提取异常信息，兼容 throw 非 Error 的场景 */
function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useChat(
  liveId: MaybeRef<string | number | undefined>,
  userInfo: AdminUserInfo | null | undefined,
  liveDetail: MaybeRef<LiveDetailLike | undefined>
) {
  const chat = ref<ImChatInstance | null>(null);
  const groupID = ref("");
  const messageList = ref<ChatMessage[]>([]);
  const chatListRef = ref<HTMLElement | null>(null);
  const bottomAnchorRef = ref<HTMLElement | null>(null);
  const isAtBottom = ref(true);
  const unreadCount = ref(0);
  const isLoadingHistory = ref(false);
  const hasMoreHistory = ref(true);
  const nextReqMessageID = ref("");
  const imReady = ref(false);
  const initError = ref("");

  let loginPromise: Promise<{ data: { repeatLogin?: boolean } }> | null = null;
  let historyLoaded = false;

  function resetSessionState() {
    imReady.value = false;
    loginPromise = null;
    historyLoaded = false;
    hasMoreHistory.value = true;
    nextReqMessageID.value = "";
    isLoadingHistory.value = false;
  }

  function detachChatEvents(instance: ImChatInstance) {
    instance.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onMessageReceived);
    instance.off(TencentCloudChat.EVENT.SDK_READY, onSdkReady);
    instance.off(TencentCloudChat.EVENT.SDK_NOT_READY, onSdkNotReady);
    instance.off(TencentCloudChat.EVENT.KICKED_OUT, onKickedOut);
  }

  function attachChatEvents(instance: ImChatInstance) {
    instance.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onMessageReceived);
    instance.on(TencentCloudChat.EVENT.SDK_READY, onSdkReady);
    instance.on(TencentCloudChat.EVENT.SDK_NOT_READY, onSdkNotReady);
    instance.on(TencentCloudChat.EVENT.KICKED_OUT, onKickedOut);
  }

  async function initTencentIm() {
    initError.value = "";
    resetSessionState();

    if (!groupID.value) {
      const fallbackGroupId = unref(liveId);
      if (fallbackGroupId) {
        groupID.value = `${fallbackGroupId}`;
      }
    }
    if (!groupID.value) {
      initError.value = "直播间群组 ID 不存在";
      return;
    }

    const detail = unref(liveDetail) || {};
    const { sdkAppId, secretKey, userSig: detailUserSig } = resolveImConfigFromDetail(detail);
    if (!sdkAppId) {
      initError.value = "直播间详情缺少 IM SDK APPID";
      return;
    }

    let userSig = detailUserSig;
    if (!userSig) {
      if (!secretKey) {
        initError.value = "直播间详情缺少 IM 登录凭证";
        return;
      }
      userSig = genTestUserSig({
        SDKAppID: sdkAppId,
        secretKey,
        userID: ADMIN_IM_USER_ID,
      }).userSig;
    }

    if (chat.value) {
      detachChatEvents(chat.value);
      try {
        await chat.value.logout?.();
      } catch (error) {
        console.warn("IM logout error:", error);
      }
      chat.value = null;
    }

    const chatInstance = TencentCloudChat.create({
      SDKAppID: sdkAppId,
    }) as unknown as ImChatInstance;
    chat.value = chatInstance;
    chatInstance.setLogLevel(1);
    attachChatEvents(chatInstance);

    try {
      await loginChat(userSig);
      await waitForSdkReady();
      await joinGroupAndLoadHistory();
    } catch (error) {
      initError.value = errorMessage(error, "IM 初始化失败");
      console.warn("initTencentIm error:", error);
    }
  }

  function waitForSdkReady(timeoutMs: number = 15000) {
    if (imReady.value) {
      return Promise.resolve(undefined);
    }
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("IM SDK 就绪超时"));
      }, timeoutMs);

      const onReady = () => {
        clearTimeout(timer);
        chat.value?.off(TencentCloudChat.EVENT.SDK_READY, onReady);
        resolve();
      };

      chat.value?.on(TencentCloudChat.EVENT.SDK_READY, onReady);
    });
  }

  function loginChat(userSig: string) {
    if (!chat.value) {
      return Promise.reject(new Error("IM 实例不存在"));
    }
    if (loginPromise) {
      return loginPromise;
    }

    loginPromise = chat.value
      .login({
        userID: ADMIN_IM_USER_ID,
        userSig,
      })
      .then((imResponse) => {
        if (imResponse.data.repeatLogin === true) {
          imReady.value = true;
        }
        return imResponse;
      })
      .catch((imError: unknown) => {
        initError.value = errorMessage(imError, "IM 登录失败");
        throw imError;
      })
      .finally(() => {
        loginPromise = null;
      });

    return loginPromise;
  }

  function onSdkNotReady() {
    imReady.value = false;
  }

  function onSdkReady() {
    imReady.value = true;
    updateUserInfo();
  }

  function onKickedOut() {
    imReady.value = false;
    initError.value = "IM 已下线，请刷新页面";
  }

  async function joinGroupAndLoadHistory() {
    if (!chat.value || !imReady.value || !groupID.value) {
      return;
    }
    await joinGroup();
    await getHistoryMessageList("");
  }

  function updateUserInfo() {
    if (!chat.value || !userInfo) {
      return;
    }

    chat.value.updateMyProfile({
      nick: userInfo.nickName || userInfo.username || "管理员",
      avatar: userInfo.face || "",
      gender: TencentCloudChat.TYPES.GENDER_UNKNOWN,
      allowType: TencentCloudChat.TYPES.ALLOW_TYPE_ALLOW_ANY,
    });
  }

  async function joinGroup() {
    if (!chat.value || !imReady.value || !groupID.value) {
      return;
    }

    try {
      await chat.value.joinGroup({
        groupID: groupID.value,
        type: String(TencentCloudChat.TYPES.GRP_AVCHATROOM),
      });
    } catch (imError) {
      console.warn("joinGroup error:", imError);
      throw imError;
    }
  }

  async function getHistoryMessageList(nextReqId: string) {
    if (!chat.value || !imReady.value || !groupID.value) {
      return;
    }
    if (isLoadingHistory.value || !hasMoreHistory.value) {
      return;
    }
    if (!nextReqId && historyLoaded) {
      return;
    }

    isLoadingHistory.value = true;

    const requestParams: {
      conversationID: string;
      direction: number;
      nextReqMessageID?: string;
    } = {
      conversationID: `GROUP${groupID.value}`,
      direction: 0,
    };

    if (nextReqId) {
      requestParams.nextReqMessageID = nextReqId;
    }

    try {
      const imResponse = await chat.value.getMessageList(requestParams);
      const msgList = imResponse.data.messageList;
      const nextId = imResponse.data.nextReqMessageID;
      const isCompleted = imResponse.data.isCompleted;

      const formattedMessages = msgList.map((msg) => formatReceivedMessage(msg));
      formattedMessages.forEach((msg) => {
        addMessageToList(msg, "append");
      });

      scrollToBottom(true);

      nextReqMessageID.value = nextId;
      hasMoreHistory.value = !isCompleted;
      historyLoaded = true;
    } catch (imError) {
      console.warn("getMessageList error:", imError);
      throw imError;
    } finally {
      isLoadingHistory.value = false;
    }
  }

  function formatReceivedMessage(message: ImRawMessage): ChatMessage {
    let messageText = "";
    let username = "";
    let isSystem = false;

    if (message.from === "@TIM#SYSTEM") {
      username = "系统消息";
      isSystem = true;
    } else {
      username = message.nick || message.from || "用户";
    }

    const avatar = message.avatar || null;
    const textType = TencentCloudChat.TYPES.MSG_TEXT;
    const customType = TencentCloudChat.TYPES.MSG_CUSTOM;

    if (message.type === textType || message.type === "TIMTextElem") {
      messageText = message.payload?.text || "";
    } else if (message.type === customType || message.type === "TIMCustomElem") {
      try {
        const customData = JSON.parse(message.payload?.data ?? "{}") as { content?: string };
        messageText = customData.content || "系统消息";
        username = "系统消息";
        isSystem = true;
      } catch {
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
      avatar: isSystem ? null : avatar,
      messageId: message.ID,
      time: message.time,
      type: message.type,
      isSystem,
    };
  }

  function onMessageReceived(event: unknown) {
    const msgList = (event as { data?: ImRawMessage[] } | undefined)?.data ?? [];

    msgList.forEach((message) => {
      const formattedMessage = formatReceivedMessage(message);
      if (!formattedMessage.message?.trim() && !formattedMessage.isSystem) {
        return;
      }

      addMessageToList(formattedMessage, "append");
      isAtBottom.value = true;
      unreadCount.value = 0;
      scrollToBottom(true);
    });
  }

  function addMessageToList(message: ChatMessage, mode: AddMode = "append") {
    const exists = messageList.value.some((item) => item.messageId === message.messageId);
    if (exists) {
      return;
    }

    if (mode === "append") {
      messageList.value.push(message);
      if (messageList.value.length > MAX_MESSAGE_COUNT) {
        const removeCount = messageList.value.length - MAX_MESSAGE_COUNT;
        messageList.value.splice(0, removeCount);
      }
    } else {
      messageList.value.unshift(message);
      if (messageList.value.length > MAX_MESSAGE_COUNT) {
        const removeCount = messageList.value.length - MAX_MESSAGE_COUNT;
        messageList.value.splice(-removeCount, removeCount);
      }
    }

    messageList.value.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  }

  function scrollToBottom(force: boolean = false) {
    if (!force && !isAtBottom.value) {
      return;
    }

    nextTick(() => {
      const run = () => {
        const anchor = bottomAnchorRef.value;
        if (anchor?.scrollIntoView) {
          anchor.scrollIntoView({ block: "end" });
        }
        const el = chatListRef.value;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      };

      run();
      requestAnimationFrame(run);
      setTimeout(run, 50);
      setTimeout(run, 150);
    });
  }

  watch(
    () => messageList.value.length,
    () => {
      if (isAtBottom.value) {
        scrollToBottom(true);
      }
    }
  );

  function checkIfAtBottom(scrollDetail: ScrollDetail) {
    const { scrollTop, scrollHeight, clientHeight } = scrollDetail;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (isNearBottom && !isAtBottom.value) {
      isAtBottom.value = true;
      unreadCount.value = 0;
    } else if (!isNearBottom && isAtBottom.value) {
      isAtBottom.value = false;
    }
  }

  function onScroll() {
    const el = chatListRef.value;
    if (!el) {
      return;
    }

    checkIfAtBottom({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    });
  }

  function scrollToBottomAndClearUnread() {
    unreadCount.value = 0;
    isAtBottom.value = true;
    scrollToBottom(true);
  }

  function setGroupID(id: string) {
    groupID.value = id;
  }

  function cleanup() {
    resetSessionState();
    if (chat.value) {
      detachChatEvents(chat.value);
      try {
        chat.value.logout?.();
      } catch (error) {
        console.error("清理腾讯云 IM 失败:", error);
      }
      chat.value = null;
    }
  }

  return {
    chat,
    groupID,
    messageList,
    chatListRef,
    bottomAnchorRef,
    isAtBottom,
    unreadCount,
    isLoadingHistory,
    hasMoreHistory,
    imReady,
    initError,
    initTencentIm,
    scrollToBottom,
    scrollToBottomAndClearUnread,
    onScroll,
    setGroupID,
    cleanup,
  };
}

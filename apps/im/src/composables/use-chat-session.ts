import { computed, nextTick, ref, type Ref } from "vue";
import router from "@/router";
import SocketInstance from "@/im-server/socket-instance";
import { ServeGetStoreSetting, ServeGetUserSetting } from "@/api/user";
import { ServeGetStoreTalkList, ServeGetTalkList } from "@/api/chat";
import { useDialogueStore } from "@/stores/dialogue";
import { useNotifyStore } from "@/stores/notify";
import { useTalkStore } from "@/stores/talk";
import { useUserStore } from "@/stores/user";
import { refreshView } from "@/utils/view-refresh";
import { formatTalkItem } from "@/utils/talk";

/**
 * 会话初始化与会话列表加载（原 `mixins/main-mixin.js` 的组合式重写）。
 *
 * 为什么不再用 mixin：
 * 1. mixin 的 `this` 语义要求调用方是 Options API 实例，`<script setup>` 里的绑定
 *    对公共代理不可见，原实现不得不用 `Object.defineProperties(instance.ctx, ...)`
 *    把 `createTalk` / `clickTab` / `goodsParams` / `loadStatus` 手工桥接出去；
 * 2. mixin 里的 `this.loadUserSetting()` / `this.loadStoreChatList()` 属于隐式依赖，
 *    组件删了某个方法也不会报错，只会在运行时报 `undefined is not a function`；
 * 3. 组合式函数可以显式声明依赖（见 `ChatSessionHooks`），也可以被非组件环境
 *    （`im-server/event/talk.ts`）直接调用。
 */

/** 组件侧可选注入的依赖；不传时按「纯后台刷新」处理 */
export interface ChatSessionHooks {
  /** 有 `?id=` 时（买家点「联系客服」进入）创建会话 */
  createTalk?: (id: string | number) => void | Promise<void>;
  /** 店铺会话列表加载完成后，切到 `?id=` 对应的会话 */
  clickTab?: (id: string | number, data: unknown, index: number) => void;
  /** 把 URL 上的 goodsId/skuId 写入商品参数对象 */
  getGoodsParams?: () => Record<string, unknown> | undefined;
}

/** 从后端设置接口返回的松散对象里取字段 */
interface SettingResult {
  id?: string | number;
  face?: string;
  nickName?: string;
  storeLogo?: string;
  storeName?: string;
  [key: string]: unknown;
}

/** 开启 WebSocket 连接（页面初始化时调用一次） */
export function initializeChatSocket(): void {
  SocketInstance.connect();
}

/**
 * 加载当前身份的用户信息与会话列表。
 *
 * - URL 带 `?id=`：买家从商城「联系客服」进入，先建会话再拉列表；
 * - 否则：商家端进入，拉店铺会话列表。
 */
export async function loadUserSetting(hooks: ChatSessionHooks = {}): Promise<void> {
  const route = router.currentRoute.value;
  const userStore = useUserStore();

  if (route.query.id) {
    const { code, result } = (await ServeGetUserSetting()) as {
      code?: number;
      result?: SettingResult | null;
    };

    if (result) {
      userStore.UPDATE_USER_INFO({
        id: result.id as string | number,
        face: result.face,
        name: result.nickName ?? "",
      });

      // 买家进入：优先用组件提供的 createTalk，其次退回列表刷新
      if (hooks.createTalk) {
        await hooks.createTalk(route.query.id as string);
      } else {
        await loadChatListInJs();
      }

      // 从商品详情点「联系客服」时把商品参数带进会话
      const goodsId = route.query.goodsId;
      const skuId = route.query.skuId;
      const goodsParams = hooks.getGoodsParams?.();
      if (goodsId && skuId && goodsParams) {
        goodsParams.goodsId = goodsId;
        goodsParams.skuId = skuId;
      }
      return;
    }

    // 后端还没准备好该用户信息：2 秒后重试（保持原行为）
    if (code === 200) {
      setTimeout(() => void loadUserSetting(hooks), 2000);
    }
    return;
  }

  const { code, result } = (await ServeGetStoreSetting()) as {
    code?: number;
    result?: SettingResult | null;
  };

  if (result) {
    userStore.UPDATE_USER_INFO({
      id: result.id as string | number,
      face: result.storeLogo,
      name: result.storeName ?? "",
    });
    await loadStoreChatList(hooks);
    return;
  }

  if (code === 200) {
    setTimeout(() => void loadUserSetting(hooks), 2000);
  }
}

/** 获取用户（买家）对话列表 */
export function loadChatListInJs(): Promise<void> {
  return ServeGetTalkList({}).then((raw) => {
    const { code, result } = raw as { code?: number; result?: Record<string, unknown>[] };
    if (code !== 200 || !Array.isArray(result)) return;

    useNotifyStore().SET_UNREAD_NUM(0);
    useTalkStore().SET_TALK_ITEMS({
      items: result.map((item) => formatTalkItem(item)),
    });

    // 消费一次「待打开会话」标记，避免下次进入时误跳
    sessionStorage.removeItem("send_message_index_name");
  });
}

/** 获取商家（店铺）会话列表，并按 `?id=` 自动切到对应会话 */
export function loadStoreChatList(hooks: ChatSessionHooks = {}): Promise<void> {
  return ServeGetStoreTalkList({})
    .then((raw) => {
      const { code, result } = raw as { code?: number; result?: Record<string, unknown>[] };
      if (code !== 200 || !Array.isArray(result)) return;

      useNotifyStore().SET_UNREAD_NUM(0);
      useTalkStore().SET_TALK_ITEMS({
        items: result.map((item) => formatTalkItem(item)),
      });

      const targetId = router.currentRoute.value.query.id;
      if (!targetId || !hooks.clickTab) return;

      let takeData: unknown;
      let takeIndex = -1;
      result.forEach((take, index) => {
        // eslint-disable-next-line eqeqeq -- 前后端 id 类型不一致（string vs number），需宽松比较
        if (take.id == targetId) {
          takeData = take;
          takeIndex = index;
        }
      });

      void nextTick(() => hooks.clickTab?.(targetId as string, takeData, takeIndex));
    })
    .catch(() => undefined);
}

/** 重新渲染当前视图（由宿主页面注册） */
export function reloadView(): void {
  refreshView();
}

/**
 * 组件内使用的组合式函数。
 *
 * ```ts
 * const { loadStatus, initialize, loadUserSetting, ... } = useChatSession({
 *   createTalk,
 *   clickTab,
 *   getGoodsParams: () => goodsParams.value,
 * });
 * onMounted(async () => {
 *   initialize();
 *   await loadUserSetting();
 * });
 * ```
 */
export function useChatSession(hooks: ChatSessionHooks = {}) {
  const talkStore = useTalkStore();
  const dialogueStore = useDialogueStore();

  /** 会话列表加载状态[0:加载中;1:加载完成] */
  const loadStatus = ref(0);

  /** 当前会话的未读数（模板里用来显示小红点） */
  const talkNum = computed(() => talkStore.talkNum);

  /** 当前打开会话的索引名 */
  const currentIndexName = computed(() => dialogueStore.index_name);

  return {
    loadStatus: loadStatus as Ref<number>,
    talkNum,
    currentIndexName,
    initialize: initializeChatSocket,
    loadUserSetting: () => loadUserSetting(hooks),
    loadChatListInJs,
    loadStoreChatList: () => loadStoreChatList(hooks),
    reload: reloadView,
  };
}

import { h } from "vue";
import router from "@/router";
import MainMixin from "@/mixins/main-mixin";
import { useTalkStore } from "@/stores/talk";

/** 刷新视图的钩子（由 main-mixin 注册） */
let refreshViewFn: (() => void) | null = null;

/** mixin 方法的宽松签名（main-mixin 仍是 JS，方法体内部用 any 是既有实现） */
type MixinMethod = (this: unknown, ...args: unknown[]) => unknown;

/**
 * vuex → pinia 兼容门面：外部（im-server/event/talk.js）仍以
 * `$store.state.talks.items` 的旧 vuex 形态访问，这里用惰性 getter 返回
 * 对应的 pinia store（store 实例上直接暴露 state 属性）。
 */
const store = {
  get state(): { talks: ReturnType<typeof useTalkStore> } {
    return {
      talks: useTalkStore(),
    };
  },
};

const mixinCtx: Record<string, unknown> = {
  get $store(): typeof store {
    return store;
  },
  get $router(): typeof router {
    return router;
  },
  get $route() {
    return router.currentRoute.value;
  },
};

const methods = MainMixin.methods as unknown as Record<string, MixinMethod>;

mixinCtx.loadChatListInJs = methods.loadChatListInJs.bind(mixinCtx);
mixinCtx.loadStoreChatList = methods.loadStoreChatList.bind(mixinCtx);

/** 注册刷新视图的钩子 */
export function setRefreshView(fn: () => void): void {
  refreshViewFn = fn;
}

/** 触发刷新（未注册时静默忽略） */
export function refreshView(): void {
  refreshViewFn?.();
}

/** 给 im-server 等非组件环境使用的应用门面 */
export function getAppBridge() {
  return {
    $store: store,
    $router: router,
    $route: router.currentRoute.value,
    $createElement: h,
    loadUserSetting: methods.loadUserSetting.bind(mixinCtx),
    refreshView,
  };
}

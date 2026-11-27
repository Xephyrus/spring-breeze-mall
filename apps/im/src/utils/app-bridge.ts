import { h } from "vue";
import router from "@/router";
import { useTalkStore } from "@/stores/talk";
import { loadChatListInJs, loadStoreChatList, loadUserSetting } from "@/composables/use-chat-session";

export { setRefreshView, refreshView } from "@/utils/view-refresh";

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

/**
 * 给 im-server 等非组件环境使用的应用门面。
 *
 * 说明：原实现通过 `MainMixin.methods.xxx.bind(mixinCtx)` 借用 mixin 的方法，
 * 现在改为直接调用 `composables/use-chat-session` 的纯函数 —— 不再需要伪造 `this`。
 */
export function getAppBridge() {
  return {
    $store: store,
    $router: router,
    $route: router.currentRoute.value,
    $createElement: h,
    loadUserSetting,
    loadChatListInJs,
    loadStoreChatList,
    refreshView: () => void 0,
  };
}

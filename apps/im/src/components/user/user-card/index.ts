import { createApp, h } from "vue";
import type { App, Component } from "vue";
import UserCardDetail from "./UserCardDetail.vue";
import router from "@/router";
import { createPinia } from "pinia";
import { setupElementPlus } from "@/plugins/element";
import { setupLegacyMessage } from "@/utils/message";
import { registerDirectives } from "@/core/directives";
import LegacyElIcon from "@/components/global/LegacyElIcon.vue";
import { resolveLegacyIcon } from "@/core/legacy-icon-map";

/** 用户名片弹窗的调用参数 */
export interface UserCardOptions {
  /** 修改备注后的回调（由调用方提供） */
  editRemarkCallbak?: (data: unknown) => void;
}

/** 全局 $user(userId, options)：动态挂载一个用户名片弹窗 */
export default {
  install(app: App): void {
    function user(user_id: string | number, options: UserCardOptions = {}): void {
      const container = document.createElement("div");
      document.body.appendChild(container);

      const cardApp = createApp({
        render() {
          // UserCardDetail 仍是 JS 组件，props 无类型声明；这里显式断言避免 h() 重载报错
          return h(UserCardDetail as Component, {
            user_id,
            onClose: () => {
              cardApp.unmount();
              document.body.removeChild(container);
            },
            onChangeRemark: (data: unknown) => {
              options.editRemarkCallbak?.(data);
            },
          });
        },
      });

      setupElementPlus(cardApp);
      setupLegacyMessage(cardApp);
      registerDirectives(cardApp);
      cardApp.component("legacy-el-icon", LegacyElIcon);
      cardApp.config.globalProperties.$legacyIcon = resolveLegacyIcon;
      cardApp.use(router);
      cardApp.use(createPinia());
      cardApp.mount(container);
    }

    app.config.globalProperties.$user = user;
  },
};

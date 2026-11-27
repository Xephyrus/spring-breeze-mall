import { ElLoading, provideGlobalConfig } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "@/styles/element.scss";
import type { App } from "vue";

/**
 * Element Plus 初始化。
 *
 * 组件经 unplugin-vue-components 按需引入（见 vite.config.ts），
 * 此处仅注册指令（v-loading 不走按需解析）与全局配置（语言/尺寸）。
 */
export function setupElementPlus(app: App): void {
  app.use(ElLoading);
  provideGlobalConfig(
    {
      locale: zhCn,
      size: "default",
    },
    app,
    true
  );
}

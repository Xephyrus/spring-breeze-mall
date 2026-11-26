import type { App } from "vue";
import { ElLoading } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "@/styles/element.scss";

/**
 * Element Plus 初始化（按需模式）。
 *
 * - 模板里的 el-* 由 vite.config.ts 的 unplugin-vue-components 按使用引入；
 * - 这里只做两件事：注册 v-loading 指令（全站 165 处用到），以及注入全量样式。
 * - 语言仍由 App.vue 的 <el-config-provider :locale> 提供。
 */
export function setupElementPlus(app: App) {
  app.use(ElLoading);
  // 保留 zhCn 的导入，供 App.vue 的 config-provider 复用（避免重复引入）
  void zhCn;
}

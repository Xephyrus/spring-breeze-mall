import type { App } from "vue";

/**
 * element-plus 改为按需引入后，这里不再 `app.use(ElementPlus)`。
 *
 * 模板里的 `el-*` 由 `unplugin-vue-components` 自动注册（见 vite.config.ts），
 * 样式也随组件一起引入。但**编程式调用**（ElMessage / ElNotification /
 * ElMessageBox / ElLoading）不走模板解析，需要手动引入各自的样式。
 */
import "element-plus/theme-chalk/base.css";
import "element-plus/theme-chalk/el-message.css";
import "element-plus/theme-chalk/el-message-box.css";
import "element-plus/theme-chalk/el-notification.css";
import "element-plus/theme-chalk/el-loading.css";
import "element-plus/theme-chalk/el-overlay.css";

/**
 * 保留函数签名，main.ts 调用处无需调整。
 *
 * 注意：Element Plus 的全局配置（如中文语言包）现在由 App.vue 的
 * `<el-config-provider :locale="zhCn">` 提供。
 */
export function setupElementPlus(_app: App): void {
  // 无需全局 install；样式已在文件顶部引入
}

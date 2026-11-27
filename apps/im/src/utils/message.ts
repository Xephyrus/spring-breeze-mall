import type { App } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";

export { ElNotification, ElMessage, ElMessageBox };

/** 兼容旧代码里的 this.$message / $notify / $confirm 等全局方法 */
export function setupLegacyMessage(app: App): void {
  app.config.globalProperties.$message = ElMessage;
  app.config.globalProperties.$notify = ElNotification;
  app.config.globalProperties.$confirm = ElMessageBox.confirm;
  app.config.globalProperties.$prompt = ElMessageBox.prompt;
  app.config.globalProperties.$alert = ElMessageBox.alert;
}

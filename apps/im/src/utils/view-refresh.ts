/**
 * 「刷新当前视图」的注册与触发。
 *
 * 单独成文件的原因：`app-bridge` 与 `composables/use-chat-session` 都要用它，
 * 放在 app-bridge 里会形成循环依赖（app-bridge 需要会话方法，会话方法需要 refreshView）。
 */
let refreshViewFn: (() => void) | null = null;

/** 由 App.vue 注册刷新函数 */
export function setRefreshView(fn: () => void): void {
  refreshViewFn = fn;
}

/** 触发刷新（未注册时静默忽略） */
export function refreshView(): void {
  refreshViewFn?.();
}

import type { Router } from "vue-router";

/** 延迟持有 router 实例，避免 router ↔ util ↔ axios ↔ api 循环依赖 */
let routerInstance: Router | null = null;

export function setRouter(router: Router): void {
  routerInstance = router;
}

export function getRouter(): Router | null {
  return routerInstance;
}

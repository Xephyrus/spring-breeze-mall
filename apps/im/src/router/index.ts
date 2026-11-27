import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

/**
 * im 端的静态路由（本端不使用后端菜单驱动）。
 *
 * 说明：历史上还有 `router/contacts.js` / `router/settings.js` 两个路由模块，
 * 它们指向 `views/contacts/**`、`views/settings/**`，但这两个目录在本仓库已不存在，
 * 且没有任何代码 import 它们 —— 属于死代码，已于本次 TS 化时删除。
 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/message/index.vue"),
    meta: {
      title: "",
      needLogin: true,
    },
  },
  {
    path: "/message",
    name: "message",
    component: () => import("@/views/message/index.vue"),
    meta: {
      title: "消息通知",
      needLogin: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "404 NotFound",
    component: () => import("@/views/other/404.vue"),
    meta: {
      title: "404 NotFound",
      needLogin: false,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

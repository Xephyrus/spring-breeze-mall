import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import Util from "../libs/util";
import Cookies from "js-cookie";
import { routers } from "./router";

NProgress.configure({ showSpinner: false });

export const router = createRouter({
  history: createWebHistory(),
  routes: routers,
});

router.beforeEach((to, from, next) => {
  NProgress.start();
  Util.title(to.meta.title as string | undefined);

  const name = to.name as string | undefined;
  const hasToken = Cookies.get("userInfoSeller");

  if (!hasToken && name !== "login") {
    if (name === "forget-password") {
      Util.toDefaultPage([...routers] as never[], name, router, next);
      return;
    }
    next({ name: "login" });
    return;
  }

  if (hasToken && name === "login") {
    Util.title();
    next({ name: "home-index" });
    return;
  }

  if (hasToken) {
    Util.toDefaultPage([...routers] as never[], name, router, next);
    return;
  }

  next();
});

router.afterEach((to: RouteLocationNormalized) => {
  Util.openNewPage(to.name as string, to.params, to.query);
  NProgress.done();
  window.scrollTo(0, 0);
});

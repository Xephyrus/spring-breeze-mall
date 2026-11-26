import { createRouter, createWebHistory } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import Util from "../libs/util";
import { setRouter } from "../libs/router-holder";
import Cookies from "js-cookie";
import { routers } from "./router";

NProgress.configure({ showSpinner: false });

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routers,
});

setRouter(router);

router.beforeEach((to, _from, next) => {
  NProgress.start();
  Util.title(to.meta.title as string | undefined);

  const name = to.name;
  const hasToken = Cookies.get("userInfoManager");

  if (!hasToken && name !== "login") {
    next({ name: "login" });
    return;
  }

  if (hasToken && name === "login") {
    Util.title();
    next({ name: "home-index" });
    return;
  }

  if (hasToken) {
    Util.toDefaultPage([...routers], String(name ?? ""), router, next);
    return;
  }

  next();
});

router.afterEach((to) => {
  Util.openNewPage(String(to.name ?? ""), to.params, to.query);
  NProgress.done();
  window.scrollTo(0, 0);
});

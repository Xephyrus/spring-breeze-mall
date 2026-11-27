import router from "@/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import config from "@/config/config";

NProgress.configure({
  showSpinner: false,
});

const WEBSITE_NAME = config.WEBSITE_NAME;

// 路由标题 + 顶部进度条
router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${WEBSITE_NAME} | ${String(to.meta.title)}` : WEBSITE_NAME;

  NProgress.start();
  next();
});

router.afterEach(() => {
  NProgress.done();
});

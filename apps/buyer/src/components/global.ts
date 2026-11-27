import type { App } from "vue";
import empty from "./empty/main.vue";
import drawer from "./drawer/main.vue";
import Header from "@/components/header/header.vue";
import FixedTopPage from "@/components/advertising/fixed-top.vue";
import Footer from "@/components/footer/footer.vue";
import Search from "@/components/search.vue";
import card from "@/components/card/index.vue";
import cateNav from "@/components/nav/cate-nav.vue";
import UserCenterLayout from "@/components/user-center/layout.vue";

/** 注册一批按 kebab/驼峰标签在模板里直接使用的全局组件 */
export function registerGlobalComponents(app: App): void {
  app.component("empty", empty);
  app.component("drawer", drawer);
  app.component("BaseHeader", Header);
  app.component("FixedTopPage", FixedTopPage);
  app.component("BaseFooter", Footer);
  app.component("Search", Search);
  app.component("card", card);
  app.component("UserCenterLayout", UserCenterLayout);
  app.component("cateNav", cateNav);
}

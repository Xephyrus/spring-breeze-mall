import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import face from "@/components/face.vue";
import faceNull from "@/components/face-null.vue";
import config from "@/config/config";
import { setupElementPlus } from "@/plugins/element";
import { setupLegacyMessage } from "@/utils/message";
import { registerDirectives } from "./core/directives";
import { registerGlobalComponents } from "./core/global-component";
import { registerIcons } from "@/icons";
import "virtual:svg-icons-register";
import * as filters from "./plugins/filters";

import VueVirtualScroller from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import { setupContextmenu } from "@/plugins/contextmenu";
import "@/permission";
import "@/assets/css/global.less";

const app = createApp(App);

setupElementPlus(app);
setupLegacyMessage(app);
registerDirectives(app);
registerGlobalComponents(app);
registerIcons(app);

app.use(createPinia());
app.use(router);
setupContextmenu(app);
app.use(VueVirtualScroller);

app.component("face", face);
app.component("face-null", faceNull);
app.component("RecycleScroller", VueVirtualScroller.RecycleScroller);

app.config.globalProperties.$filters = filters;
app.config.globalProperties.linkToGoods = function (goodsId: string, skuId: string) {
  window.open(
    `${config.PC_URL}goodsDetail?skuId=${skuId}&goodsId=${goodsId}`,
    "_blank"
  );
};
app.config.globalProperties.linkToStore = function (storeId: string) {
  window.open(`${config.PC_URL}merchant?id=${storeId}`, "_blank");
};
app.config.globalProperties.linkToOrders = function (sn: string) {
  if (localStorage.getItem("storeFlag") == "false") {
    window.open(`${config.PC_STORE}order-detail?sn=${sn}`, "_blank");
  } else {
    window.open(`${config.PC_URL}home/OrderDetail?sn=${sn}`, "_blank");
  }
};

router.isReady().then(() => {
  app.mount("#app");
});

export default app;

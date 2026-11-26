import { markRaw, type Component } from "vue";
import category from "./category.vue";
import shops from "./shops.vue";
import marketing from "./marketing.vue";
import pages from "./pages.vue";
import goods from "../goods-dialog.vue";
import other from "./other.vue";
import special from "./special.vue";

/** tab 的 name -> 具体选择面板组件 */
export type LinkTemplateMap = Record<string, Component>;

export default {
  pages: markRaw(pages),
  marketing: markRaw(marketing),
  shops: markRaw(shops),
  category: markRaw(category),
  goods: markRaw(goods),
  other: markRaw(other),
  special: markRaw(special),
} as LinkTemplateMap;

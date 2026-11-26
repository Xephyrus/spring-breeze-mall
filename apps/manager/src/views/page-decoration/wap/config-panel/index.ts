// 新组件配置面板映射：type → 面板组件
// 面板契约：props res（整个楼层条目），直接修改 res.options.*，保存链路自动感知
import PanelBlank from "./panel-blank.vue";
import PanelLine from "./panel-line.vue";
import PanelRichText from "./panel-rich-text.vue";
import PanelIntegral from "./panel-integral.vue";
import PanelCoupon from "./panel-coupon.vue";
import PanelArticle from "./panel-article.vue";
import PanelShop from "./panel-shop.vue";
import PanelFlexOne from "./panel-flex-one.vue";
import PanelCarousel from "./panel-carousel.vue";
import PanelAdCube from "./panel-ad-cube.vue";
import PanelMenu from "./panel-menu.vue";
import PanelSearch from "./panel-search.vue";
import PanelNotice from "./panel-notice.vue";
import PanelVideo from "./panel-video.vue";
import PanelTitle from "./panel-title.vue";
import PanelPromotion from "./panel-promotion.vue";
import PanelGoods from "./panel-goods.vue";
import PanelHomeComb from "./panel-home-comb.vue";

// 图片魔方及其全部可选风格共用 PanelAdCube
const adCubeTypes = [
  "tpl_ad_list",
  "leftOneRightTwo",
  "leftTwoRightOne",
  "flexThree",
  "flexTwo",
  "topOneBottomTwo",
  "topTwoBottomOne",
  "flexFive",
  "flexFour",
  "textPicture",
];

export default {
  homeComb: PanelHomeComb,
  blank: PanelBlank,
  line: PanelLine,
  richText: PanelRichText,
  integral: PanelIntegral,
  coupon: PanelCoupon,
  article: PanelArticle,
  shop: PanelShop,
  flexOne: PanelFlexOne,
  carousel: PanelCarousel,
  menu: PanelMenu,
  search: PanelSearch,
  notice: PanelNotice,
  video: PanelVideo,
  title: PanelTitle,
  promotionDetail: PanelPromotion,
  goods: PanelGoods,
  ...Object.fromEntries(adCubeTypes.map((t) => [t, PanelAdCube])),
};

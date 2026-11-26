import TplUserBenefits from './tpl-user-benefits.vue';
import TplTopBar from './tpl-top-bar.vue';
import TplSearchHeader from './tpl-search-header.vue';
import TplFooterNav from './tpl-footer-nav.vue';
import TplCategoryNav from './tpl-category-nav.vue';
import TplChannelGrid from './tpl-channel-grid.vue';
import TplCategoryMegaMenu from './tpl-category-mega-menu.vue';
import TplCarousel from './tpl-carousel.vue';
import TplBrandWall from './tpl-brand-wall.vue';
import TplHotZone from './tpl-hot-zone.vue';
import TplFreeLayout from './tpl-free-layout.vue';
import TplPromoGroup from './tpl-promo-group.vue';
import TplVideo from './tpl-video.vue';
import TplGoods from './tpl-goods.vue';
import TplGridFloor from './tpl-grid-floor.vue';
import TplGoodsGrid from './tpl-goods-grid.vue';
import TplChannelFloor from './tpl-channel-floor.vue';
import TplRecommendFeed from './tpl-recommend-feed.vue';
import TplCoupon from './tpl-coupon.vue';
import TplTitle from './tpl-title.vue';
import TplArticle from './tpl-article.vue';
import TplNotice from './tpl-notice.vue';

export const CANVAS_TEMPLATE_MAP = {
  // 结构 (3)
  topBar: TplTopBar,
  searchHeader: TplSearchHeader,
  footerNav: TplFooterNav,

  // 导航 (3)
  categoryNav: TplCategoryNav,
  channelGrid: TplChannelGrid,
  categoryMegaMenu: TplCategoryMegaMenu,

  // 广告 (6)
  carousel: TplCarousel,
  brandWall: TplBrandWall,
  hotZone: TplHotZone,
  freeLayout: TplFreeLayout,
  promoGroup: TplPromoGroup,
  video: TplVideo,

  // 商品 (8)
  goodsList: TplGoods,
  gridFloor: TplGridFloor,
  goodsGrid: TplGoodsGrid,
  goodsCard: TplGoods,
  bannerFloor: TplGridFloor,
  goodsBar: TplGoods,
  channelFloor: TplChannelFloor,
  recommendFeed: TplRecommendFeed,

  // 营销 (1)
  couponList: TplCoupon,
  userBenefits: TplUserBenefits,

  // 内容 (3)
  titleBar: TplTitle,
  articleContent: TplArticle,
  noticeBar: TplNotice
};

export function resolveCanvasTemplate(type: string | undefined) {
  return (CANVAS_TEMPLATE_MAP as Record<string, unknown>)[String(type ?? "")] || null;
}

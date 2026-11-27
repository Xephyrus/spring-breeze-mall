import type { Component } from "vue";
/**
 * PC 前台装修楼层组件注册表
 * 映射 6 大分类、24 个组件
 */
import TopBar from './components/top-bar.vue';
import SearchHeader from './components/search-header.vue';
import FooterNav from './components/footer-nav.vue';
import CategoryNav from './components/category-nav.vue';
import ChannelGrid from './components/channel-grid.vue';
import CategoryMegaMenu from './components/category-mega-menu.vue';
import Carousel from './components/carousel.vue';
import BrandWall from './components/brand-wall.vue';
import HotZone from './components/hot-zone.vue';
import FreeLayout from './components/free-layout.vue';
import PromoGroup from './components/promo-group.vue';
import VideoPlayer from './components/video-player.vue';
import GoodsList from './components/goods-list.vue';
import GridFloor from './components/grid-floor.vue';
import GoodsGrid from './components/goods-grid.vue';
import ChannelFloor from './components/channel-floor.vue';
import RecommendFeed from './components/recommend-feed.vue';
import CouponList from './components/coupon-list.vue';
import UserBenefits from './components/user-benefits.vue';
import TitleBar from './components/title-bar.vue';
import ArticleContent from './components/article-content.vue';
import NoticeBar from './components/notice-bar.vue';

export const COMPONENT_MAP: Record<string, Component> = {
  // 1. 结构 (3)
  topBar: TopBar,
  searchHeader: SearchHeader,
  footerNav: FooterNav,

  // 2. 导航 (3)
  categoryNav: CategoryNav,
  channelGrid: ChannelGrid,
  categoryMegaMenu: CategoryMegaMenu,

  // 3. 广告 (6)
  carousel: Carousel,
  brandWall: BrandWall,
  hotZone: HotZone,
  freeLayout: FreeLayout,
  promoGroup: PromoGroup,
  video: VideoPlayer,

  // 4. 商品 (8)
  goodsList: GoodsList,
  gridFloor: GridFloor,
  goodsGrid: GoodsGrid,
  goodsCard: GoodsList,
  bannerFloor: GridFloor,
  goodsBar: GoodsList,
  channelFloor: ChannelFloor,
  recommendFeed: RecommendFeed,

  // 5. 营销 (1)
  couponList: CouponList,
  userBenefits: UserBenefits,

  // 6. 内容 (3)
  titleBar: TitleBar,
  articleContent: ArticleContent,
  noticeBar: NoticeBar
};

/**
 * 根据组件 type 解析 Vue 组件
 */
export function resolveComponent(type?: string | null): Component | null {
  if (!type) return null;
  return COMPONENT_MAP[type] || null;
}

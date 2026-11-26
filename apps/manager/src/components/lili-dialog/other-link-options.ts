/**
 * 楼层装修公共固定入口目录，选择器及支付后推广共用同一份名称和入口代码。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import { markRaw } from "vue";
import {
  House,
  ShoppingCart,
  Star,
  Document,
  User,
  UserFilled,
  Service,
  Ticket,
  Bell,
  OfficeBuilding,
  Promotion,
  PriceTag,
  Sunny,
  VideoCamera,
  Share,
  ShoppingBag,
} from "@element-plus/icons-vue";

export const otherLinkOptions = [
  { title: "首页", icon: markRaw(House), url: "/", ___type: "home" },
  { title: "购物车", icon: markRaw(ShoppingCart), url: "/cart", ___type: "cart" },
  { title: "我的订单", icon: markRaw(Document), url: "/home/MyOrder", ___type: "order" },
  { title: "个人中心", icon: markRaw(User), url: "/home", ___type: "user" },
  { title: "基本信息", icon: markRaw(UserFilled), url: "/home/Profile", ___type: "userInfo" },
  { title: "我的售后", icon: markRaw(Service), url: "/home/AfterSale", ___type: "afterSale" },
  { title: "我的优惠券", icon: markRaw(Ticket), url: "/home/Coupons", ___type: "myCoupons" },
  { title: "收藏商品", icon: markRaw(Star), url: "/home/Favorites", ___type: "collection" },
  { title: "消息中心", icon: markRaw(Bell), url: "/home/MsgList", ___type: "msg" },
  { title: "商家入驻", icon: markRaw(OfficeBuilding), url: "/shopEntry", ___type: "merchantEntry" },
  { title: "领券中心", icon: markRaw(PriceTag), url: "/coupon", ___type: "coupon" },
  { title: "秒杀频道", icon: markRaw(Promotion), url: "/seckill", ___type: "seckill" },
  { title: "拼团频道", icon: markRaw(Promotion), url: "/group", ___type: "group" },
  { title: "签到", icon: markRaw(Sunny), url: "/sign", ___type: "sign" },
  { title: "小程序直播", icon: markRaw(VideoCamera), url: "/live", ___type: "live" },
  { title: "砍价", icon: markRaw(Share), url: "/kanjia", ___type: "kanjia" },
  { title: "积分商城", icon: markRaw(ShoppingBag), url: "/point", ___type: "point" },
 ];

import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import Index from "@/pages/index.vue";
import config from "@/config";

const Login = () => import("@/pages/login.vue");
const SignUp = () => import("@/pages/sign-up.vue");
const ForgetPassword = () => import("@/pages/forget-password.vue");
const GoodsList = () => import("@/pages/goods-list.vue");
const GoodsDetail = () => import("@/pages/goods-detail.vue");
const PointGoodsDetail = () => import("@/pages/promotion/point-goods-detail.vue");
const ShoppingCart = () => import("@/pages/shopping-cart.vue");
const Cart = () => import("@/pages/cart.vue");
const Pay = () => import("@/pages/payment/pay.vue");
const PayDone = () => import("@/pages/payment/pay-done.vue");
const PayMent = () => import("@/pages/payment/pay-ment.vue");
const ThirdPay = () => import("@/pages/payment/third-pay.vue");
const Coupon = () => import("@/pages/coupon-center.vue");
const seckill = () => import("@/pages/promotion/seckill.vue");
const article = () => import("@/pages/article/index.vue");
const articleDetail = () => import("@/pages/article/detail.vue");
const PointMall = () => import("@/pages/promotion/point-mall.vue");

const MyOrder = () => import("@/pages/home/order-center/my-order.vue");
const OrderDetail = () => import("@/pages/home/order-center/order-detail.vue");
const MyAddress = () => import("@/pages/home/order-center/my-address.vue");
const AddAddress = () => import("@/pages/home/order-center/add-address.vue");
const Complain = () => import("@/pages/home/order-center/complain.vue");
const AfterSale = () => import("@/pages/home/order-center/after-sale.vue");
const AfterSaleDetail = () => import("@/pages/home/order-center/after-sale-detail.vue");
const ApplyAfterSale = () => import("@/pages/home/order-center/apply-after-sale.vue");

const Profile = () => import("@/pages/home/member-center/profile.vue");
const AccountSafe = () => import("@/pages/home/member-center/account-safe.vue");
const ModifyPwd = () => import("@/pages/home/member-center/modify-pwd.vue");
const Favorites = () => import("@/pages/home/member-center/favorites.vue");
const CommentList = () => import("@/pages/home/member-center/comment-list.vue");
const AddEval = () => import("@/pages/home/member-center/evaluation/add-eval.vue");
const EvalDetail = () => import("@/pages/home/member-center/evaluation/eval-detail.vue");
const ComplainList = () => import("@/pages/home/member-center/complain-list.vue");
const ComplainDetail = () => import("@/pages/home/member-center/complain-detail.vue");
const Point = () => import("@/pages/home/member-center/point.vue");
const MemberGrade = () => import("@/pages/home/member-center/member-grade.vue");
const MsgList = () => import("@/pages/home/member-center/member-msg/msg-list.vue");
const MsgDetail = () => import("@/pages/home/member-center/member-msg/msg-detail.vue");

const Coupons = () => import("@/pages/home/user-center/coupons.vue");
const MyTracks = () => import("@/pages/home/user-center/my-tracks.vue");
const MoneyManagement = () => import("@/pages/home/user-center/money-management.vue");
const MyGiftCards = () => import("@/pages/home/user-center/my-gift-cards.vue");

const Home = () => import("@/pages/user/home.vue");
const UserCenter = () => import("@/pages/home/main.vue");
const Merchant = () => import("@/pages/merchant.vue");
const StoreList = () => import("@/pages/store-list.vue");
const NotFound = () => import("@/pages/not-found.vue");
const topic = () => import("@/pages/topic.vue");
const ShopEntry = () => import("@/pages/shop-entry/shop-entry.vue");

const { title } = config;

NProgress.configure({ showSpinner: false });

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Index",
    component: Index,
  },
  {
    path: "/topic",
    name: "topic",
    component: topic,
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { title: "登录" },
  },
  {
    path: "/SignUp",
    name: "SignUp",
    component: SignUp,
    meta: { title: "注册" },
  },
  {
    path: "/forgetPassword",
    name: "forgetPassword",
    component: ForgetPassword,
    meta: { title: "忘记密码" },
  },
  {
    path: "/goodsList",
    name: "GoodsList",
    component: GoodsList,
  },
  {
    path: "/goodsDetail",
    name: "GoodsDetail",
    component: GoodsDetail,
    meta: { title: "商品详情" },
  },
  {
    path: "/pointGoodsDetail",
    name: "PointGoodsDetail",
    component: PointGoodsDetail,
    meta: { title: "积分商品" },
  },
  {
    path: "/shoppingCart",
    name: "ShoppingCart",
    component: ShoppingCart,
  },
  {
    path: "/cart",
    name: "Cart",
    component: Cart,
    meta: { title: "购物车" },
  },
  {
    path: "/pay",
    name: "Pay",
    component: Pay,
    meta: { title: "订单结算" },
  },
  {
    path: "/payMent",
    name: "PayMent",
    component: PayMent,
  },
  {
    path: "/PointMall",
    name: "PointMall",
    component: PointMall,
    meta: { title: "积分商城" },
  },
  {
    path: "/qrpay",
    name: "qrpay",
    component: ThirdPay,
  },
  {
    path: "/payDone",
    name: "PayDone",
    component: PayDone,
  },
  {
    path: "/article",
    name: "article",
    component: article,
    meta: { title: "帮助中心" },
  },
  {
    path: "/article/detail",
    name: "articleDetail",
    component: articleDetail,
    meta: { title: "帮助中心" },
  },
  {
    path: "/shopEntry",
    name: "shopEntry",
    component: ShopEntry,
    meta: { title: "店铺入驻" },
  },
  {
    path: "/coupon",
    name: "coupon",
    component: Coupon,
    meta: { title: "领券中心" },
  },
  {
    path: "/seckill",
    name: "seckill",
    component: seckill,
    meta: { title: "限时秒杀" },
  },
  {
    path: "/home",
    component: Home,
    children: [
      {
        path: "",
        name: "UserCenter",
        component: UserCenter,
        meta: { title: "个人中心" },
      },
      {
        path: "MyTracks",
        name: "MyTracks",
        component: MyTracks,
        meta: { title: "我的足迹" },
      },
      {
        path: "MoneyManagement",
        name: "MoneyManagement",
        component: MoneyManagement,
        meta: { title: "我的余额" },
      },
      {
        path: "PickupCard",
        name: "PickupCard",
        component: () => import("@/pages/home/user-center/pickup-card.vue"),
        meta: { title: "提货卡兑换" },
      },
      {
        path: "MyGiftCards",
        name: "MyGiftCards",
        component: MyGiftCards,
        meta: { title: "我的礼品卡" },
      },
      {
        path: "Complain",
        name: "Complain",
        component: Complain,
      },
      {
        path: "Coupons",
        name: "Coupons",
        component: Coupons,
        meta: { title: "我的优惠券" },
      },
      {
        path: "CommentList",
        name: "CommentList",
        component: CommentList,
        meta: { title: "评价列表" },
      },
      {
        path: "AddEval",
        name: "AddEval",
        component: AddEval,
        meta: { title: "添加评价" },
      },
      {
        path: "EvalDetail",
        name: "EvalDetail",
        component: EvalDetail,
        meta: { title: "评价详情" },
      },
      {
        path: "ComplainList",
        name: "ComplainList",
        component: ComplainList,
      },
      {
        path: "ComplainDetail",
        name: "ComplainDetail",
        component: ComplainDetail,
      },
      {
        path: "AccountSafe",
        name: "AccountSafe",
        component: AccountSafe,
      },
      {
        path: "ModifyPwd",
        name: "ModifyPwd",
        component: ModifyPwd,
      },
      {
        path: "Favorites",
        name: "Favorites",
        component: Favorites,
        meta: { title: "我的收藏" },
      },
      {
        path: "Point",
        name: "Point",
        component: Point,
        meta: { title: "我的积分" },
      },
      {
        path: "MemberGrade",
        name: "MemberGrade",
        component: MemberGrade,
        meta: { title: "我的等级" },
      },
      {
        path: "UserInfo",
        redirect: { name: "Profile" },
      },
      {
        path: "Profile",
        name: "Profile",
        component: Profile,
      },
      {
        path: "AfterSale",
        name: "AfterSale",
        component: AfterSale,
        meta: { title: "售后" },
      },
      {
        path: "ApplyAfterSale",
        name: "ApplyAfterSale",
        component: ApplyAfterSale,
        meta: { title: "申请售后" },
      },
      {
        path: "/home/MyAddress",
        name: "MyAddress",
        component: MyAddress,
        meta: { title: "收货地址" },
      },
      {
        path: "AddAddress",
        name: "AddAddress",
        component: AddAddress,
      },
      {
        // 兼容已保存的装修顶部菜单中的旧消息地址，统一进入现有消息列表。
        path: "Msg",
        redirect: { name: "MsgList" },
      },
      {
        path: "MsgList",
        name: "MsgList",
        component: MsgList,
        meta: { title: "我的消息" },
      },
      {
        path: "MsgDetail",
        name: "MsgDetail",
        component: MsgDetail,
        meta: { title: "消息详情" },
      },
      {
        path: "MyOrder",
        name: "MyOrder",
        component: MyOrder,
        meta: { title: "我的订单" },
      },
      {
        path: "OrderDetail",
        name: "OrderDetail",
        component: OrderDetail,
        meta: { title: "订单详情" },
      },
      {
        path: "AfterSaleDetail",
        name: "AfterSaleDetail",
        component: AfterSaleDetail,
        meta: { title: "售后详情" },
      },
    ],
  },
  {
    path: "/merchant",
    name: "Merchant",
    component: Merchant,
    meta: { title: "店铺" },
  },
  {
    path: "/storeList",
    name: "StoreList",
    component: StoreList,
    meta: { title: "店铺列表" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
    meta: { title: "页面不存在" },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  NProgress.start();
  window.document.title = (to.meta.title as string | undefined) ?? title;
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;

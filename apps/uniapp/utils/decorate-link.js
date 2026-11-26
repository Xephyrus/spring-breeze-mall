/**
 * 楼层装修和支付后推广共用的商城内部导航，只从固定入口及关联ID生成路由。
 * @author Bulbasaur
 * @since 2026-11-19
 */
const otherLinks = {
  home: { title: '首页', url: '/pages/tabbar/home/index', tabBar: true },
  cart: { title: '购物车', url: '/pages/tabbar/cart/cartList', tabBar: true },
  order: { title: '我的订单', url: '/pages/order/myOrder?status=0' },
  user: { title: '个人中心', url: '/pages/tabbar/user/my', tabBar: true },
  userInfo: { title: '基本信息', url: '/pages/mine/set/personMsg' },
  afterSale: { title: '我的售后', url: '/pages/order/myOrder?status=5' },
  myCoupons: { title: '我的优惠券', url: '/pages/cart/coupon/myCoupon' },
  collection: { title: '收藏商品', url: '/pages/mine/myCollect' },
  msg: { title: '消息中心', url: '/pages/mine/msgTips/main' },
  merchantEntry: { title: '商家入驻', url: '/pages/passport/entry/seller/index' },
  coupon: { title: '领券中心', url: '/pages/cart/coupon/couponCenter' },
  seckill: { title: '秒杀频道', url: '/pages/promotion/seckill' },
  group: { title: '拼团频道', url: '/pages/promotion/joinGroup' },
  sign: { title: '签到', url: '/pages/mine/signIn' },
  live: { title: '小程序直播', url: '/pages/promotion/lives', live: true },
  kanjia: { title: '砍价', url: '/pages/promotion/bargain/list' },
  point: { title: '积分商城', url: '/pages/promotion/point/pointList' },
  shopList: { title: '店铺列表', url: '/pages/product/shopList' },
};

/** 解析装修选择器的标准数据；兼容旧数据按标题存储固定入口，不使用传入的任意URL或文章路径。 */
export function resolveDecorateLink(item) {
  const value = item?.url && typeof item.url === 'object' ? item.url : item;
  if (!value || typeof value !== 'object') return null;
  const type = value.___type || value.type;
  const id = value.id == null ? '' : encodeURIComponent(String(value.id));
  if (type === 'special' || String(value.pageType || '').toLowerCase() === 'special') {
    return id ? { url: `/pages/tabbar/special/special?id=${id}` } : null;
  }
  switch (type) {
    case 'goods': return id && value.goodsId ? { url: `/pages/product/goods?id=${id}&goodsId=${encodeURIComponent(String(value.goodsId))}` } : null;
    case 'category': return { url: '/pages/navigation/search/searchPage' + (id ? `?category=${id}` : '') };
    case 'shops': return id ? { url: `/pages/product/shopPage?id=${id}` } : null;
    case 'pages': return id ? { url: `/pages/passport/article?id=${id}&title=${encodeURIComponent(value.title || '文章')}` } : null;
    case 'couponPackage': return id ? { url: `/pages/promotion/coupon-pack?id=${id}` } : null;
    case 'other': {
      const key = value.originalType || Object.keys(otherLinks).find(code => otherLinks[code].title === value.title);
      return Object.prototype.hasOwnProperty.call(otherLinks, key) ? { ...otherLinks[key] } : null;
    }
    default: return null;
  }
}

/** 执行共用内部导航，TabBar入口必须切换标签；微信小程序直播沿用现有平台提示。 */
export function navigateDecorateLink(item, options = {}) {
  const route = resolveDecorateLink(item);
  if (!route) return false;
  // #ifdef MP-WEIXIN
  if (route.live) {
    uni.showToast({ title: '小程序暂不支持直播', icon: 'none' });
    return true;
  }
  // #endif
  if (route.tabBar) uni.switchTab({ ...options, url: route.url });
  else uni.navigateTo({ ...options, url: route.url });
  return true;
}

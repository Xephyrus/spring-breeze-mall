/**
 * 支付返回上下文和推广到装修公共导航的数据适配，跨H5、小程序与APP复用，不接受外部链接。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import { resolveDecorateLink, navigateDecorateLink } from './decorate-link';

/** 构造成功页地址，只携带支付编号及业务类型，不将客户端金额作为支付依据。 */
export function paymentSuccessUrl({ sn, orderType, paymentMethod, orderPromotionType = '' }) {
  const values = { sn: sn || '', orderType: orderType || 'TRADE', paymentMethod: paymentMethod || '', orderPromotionType };
  return '/pages/cart/payment/success?' + Object.entries(values).map(([key,value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

/** H5三方支付返回兼容当前history和hash路由，避免支付后跳到空白页面。 */
export function paymentReturnUrl(currentUrl, origin, pagePath) {
  return currentUrl.includes('#/') ? currentUrl.split('#')[0] + '#' + pagePath : origin + pagePath;
}

/** 将服务端核验的目标还原成装修标准数据，兼容旧频道和券包配置，不透传客户端URL。 */
function promotionLink(promotion) {
  if (!promotion) return null;
  const channels = { COUPON_CENTER: 'coupon', SECKILL: 'seckill', PINTUAN: 'group' };
  if (promotion.targetType === 'OTHER' || channels[promotion.targetType]) return { ___type: 'other', originalType: channels[promotion.targetType] || promotion.targetId };
  const type = { GOODS: 'goods', CATEGORY: 'category', STORE: 'shops', ARTICLE: 'pages', SPECIAL: 'special', COUPON_PACKAGE: 'couponPackage' }[promotion.targetType];
  return type && promotion.targetId ? { ___type: type, id: promotion.targetId, goodsId: promotion.goodsId, title: promotion.targetName } : null;
}

/** 获取共用导航的内部地址，保留已有调用方和回归检查入口。 */
export function paymentPromotionUrl(promotion) { return resolveDecorateLink(promotionLink(promotion))?.url || ''; }

/** 使用楼层装修相同的导航执行器，正确处理首页、购物车和个人中心等TabBar入口。 */
export function navigatePaymentPromotion(promotion, options = {}) { return navigateDecorateLink(promotionLink(promotion), options); }

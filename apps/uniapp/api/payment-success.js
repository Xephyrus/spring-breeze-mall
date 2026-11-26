/**
 * 支付成功页接口，金额、支付状态与推广资格均由服务端确认。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import { http, Method } from '@/utils/request.js';

/** 查询当前账号支付结果、推荐商品与推广，不提交客户端金额。 */
export function getPaymentSuccessPage(params) {
  return http.request({ url: '/payment/success-page', method: Method.GET, params, needToken: true, loading: false, message: false });
}

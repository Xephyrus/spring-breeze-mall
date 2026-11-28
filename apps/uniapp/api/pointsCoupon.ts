/** 积分兑券活动、兑换及记录接口。@author Bulbasaur @since 2026-11-14 */
import { http, Method } from '@/utils/request';
/** 分页获取可兑换活动，支持未登录浏览。 */
export const listPointsCoupons = params => http.request({ url: '/promotion/pointsCoupon', method: Method.GET, needToken: false, params });
/** 每次兑换一张，网络重试沿用请求号。 */
export const exchangePointsCoupon = (id, params) => http.request({ url: `/promotion/pointsCoupon/${id}/exchange`, method: Method.POST, needToken: true, params });
/** 仅查询本人成功记录。 */
export const listPointsCouponRecords = params => http.request({ url: '/promotion/pointsCoupon/records', method: Method.GET, needToken: true, params });

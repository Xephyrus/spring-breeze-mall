/** 每日免费抽奖活动、次数与记录。@author Bulbasaur @since 2026-11-14 */
import { http, Method } from '@/utils/request';
const base = '/promotion/lottery';
/** 查询有效活动和公开奖池。 */
export const listLottery = params => http.request({ url: base, method: Method.GET, needToken: true, params });
/** 查询北京时间当天的剩余次数。 */
export const lotteryChances = id => http.request({ url: `${base}/${id}/chances`, method: Method.GET, needToken: true });
/** 抽奖与结果确认共用请求号，重复请求返回原结果。 */
export const drawLottery = (id, requestId) => http.request({ url: `${base}/${id}/draw`, method: Method.POST, needToken: true, params: { requestId } });
/** 查询当前会员全部记录，包含未中奖。 */
export const lotteryRecords = params => http.request({ url: `${base}/records`, method: Method.GET, needToken: true, params });

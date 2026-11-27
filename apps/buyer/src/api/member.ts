import request, {Method} from '@/plugins/request.js';
import type { Query, BuyerResponse } from "@/types/api";

// 查询账户余额
export function getMembersWallet () {
  return request({
    url: '/buyer/wallet/wallet',
    method: Method.GET,
    needToken: true
  });
}

// 查询余额列表
export function getDepositLog(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/wallet/log',
    method: Method.GET,
    needToken: true,
    params
  });
}

// 查询充值记录
export function getRecharge(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/wallet/recharge',
    method: Method.GET,
    needToken: true,
    params
  });
}

// 查询提现记录
export function getWithdrawApply(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/member/withdrawApply',
    method: Method.GET,
    needToken: true,
    params
  });
}

// 在线充值
export function recharge(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/trade/recharge',
    method: Method.POST,
    needToken: true,
    data: params
  });
}

// 提现
export function withdrawalApply(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/wallet/wallet/withdrawal',
    method: Method.POST,
    needToken: true,
    data: params
  });
}

// 收藏商品
export function collectGoods(type: Query, id: string | number) {
  return request({
    url: `/buyer/member/collection/add/${type}/${id}`,
    method: Method.POST,
    needToken: true
  });
}

// 收藏店铺
export function collectStore(type: Query, id: string | number) {
  return request({
    url: `/buyer/member/storeCollection/add/${type}/${id}`,
    method: Method.POST,
    needToken: true
  });
}

// 取消 收藏商品
export function cancelCollect(type: Query, id: string | number) {
  return request({
    url: `/buyer/member/collection/delete/${type}/${id}`,
    method: Method.DELETE,
    needToken: true
  });
}

// 取消 收藏店铺
export function cancelStoreCollect(type: Query, id: string | number) {
  return request({
    url: `/buyer/member/storeCollection/delete/${type}/${id}`,
    method: Method.DELETE,
    needToken: true
  });
}

// 查看是否收藏商品（后台查询，token 失效时静默失败，不弹全局登录框）
export function isCollection(type: Query, goodsId: string | number) {
  return request({
    url: `/buyer/member/collection/isCollection/${type}/${goodsId}`,
    method: Method.GET,
    needToken: true,
    skipAuthHandler: true,
    skipMessage: true
  });
}

// 查看是否收藏店铺（后台查询，token 失效时静默失败，不弹全局登录框）
export function isStoreCollection(type: Query, goodsId: string | number) {
  return request({
    url: `/buyer/member/storeCollection/isCollection/${type}/${goodsId}`,
    method: Method.GET,
    needToken: true,
    skipAuthHandler: true,
    skipMessage: true
  });
}

// 会员收藏商品列表
export function collectList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/collection/${params.type}`,
    method: Method.GET,
    needToken: true,
    params
  });
}

// 会员收藏店铺列表
export function storeCollectList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/storeCollection/${params.type}`,
    method: Method.GET,
    needToken: true,
    params
  });
}

// 单个商品评价（需登录；token 失效时静默失败，不弹全局登录框）
export function goodsComment(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/evaluation/${params.goodsId}/goodsEvaluation`,
    method: Method.GET,
    needToken: true,
    skipAuthHandler: true,
    skipMessage: true,
    params
  });
}

// 商品各评价类别数量（需登录；token 失效时静默失败，不弹全局登录框）
export function goodsCommentNum(goodsId: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/evaluation/${goodsId}/evaluationNumber`,
    method: Method.GET,
    needToken: true,
    skipAuthHandler: true,
    skipMessage: true
  });
}

// 添加会员评价
export function addEvaluation(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/evaluation`,
    method: Method.POST,
    needToken: true,
    data: params
  });
}

// 会员评价详情
export function evaluationDetail(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/evaluation/get/${id}`,
    method: Method.GET,
    needToken: true
  });
}

// 发票分页列表
export function receiptList () {
  return request({
    url: `/buyer/trade/receipt`,
    method: Method.GET,
    needToken: true
  });
}

// 发票详情
export function receiptDetail(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/trade/receipt/${id}`,
    method: Method.GET,
    needToken: true
  });
}

// 保存发票信息
export function saveReceipt(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/trade/receipt`,
    method: Method.POST,
    needToken: true,
    params
  });
}

// 获取可领取优惠券列表
export function couponList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/promotion/coupon`,
    method: Method.GET,
    needToken: true,
    loading: false,
    params
  });
}

// 会员优惠券列表
export function memberCouponList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/promotion/coupon/getCoupons`,
    method: Method.GET,
    needToken: true,
    params
  });
}

// 会员优惠券列表
export function canUseCouponList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/promotion/coupon/canUse`,
    method: Method.GET,
    needToken: true,
    params
  });
}

// 领取优惠券
export function receiveCoupon(couponId: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/promotion/coupon/receive/${couponId}`,
    method: Method.GET,
    needToken: true
  });
}

// 获取申请售后列表
export function afterSaleList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/page`,
    method: Method.GET,
    needToken: true,
    params
  });
}

// 获取申请售后页面信息
export function afterSaleInfo(sn: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/applyAfterSaleInfo/${sn}`,
    method: Method.GET,
    needToken: true
  });
}

// 获取申请售后、投诉原因
export function afterSaleReason(serviceType: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/get/afterSaleReason/${serviceType}`,
    method: Method.GET,
    needToken: true
  });
}
// 获取申请售后详情
export function afterSaleDetail(sn: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/get/${sn}`,
    method: Method.GET,
    needToken: true
  });
}
// 售后日志
export function afterSaleLog(sn: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/get/getAfterSaleLog/${sn}`,
    method: Method.GET,
    needToken: true
  });
}

// 申请售后
export function applyAfterSale(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/save/${params.orderItemSn}`,
    method: Method.POST,
    needToken: true,
    params
  });
}

// 取消售后申请
export function cancelAfterSale(afterSaleSn: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/afterSale/cancel/${afterSaleSn}`,
    method: Method.POST,
    needToken: true,
    loading: false
  });
}

// 投诉商品
export function handleComplain(data: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/complain`,
    method: Method.POST,
    needToken: true,
    data
  });
}
// 分页获取我的投诉列表
export function complainList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/complain`,
    method: Method.GET,
    needToken: true,
    params
  });
}

/**
 * 获取投诉详情
 */
export function getComplainDetail(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/complain/${id}`,
    method: Method.GET,
    needToken: true
  });
}

/**
 * 取消投诉
 */
export function clearComplain(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/order/complain/status/${id}`,
    method: Method.PUT,
    needToken: true
  });
}

/**
 * 我的足迹
 * @param {Number} pageNumber 页码
 * @param {Number} pageSize 页数
 */
export function tracksList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/footprint`,
    method: Method.GET,
    needToken: true,
    params
  });
}

/**
 * 清空足迹
 */
export function clearTracks () {
  return request({
    url: `/buyer/member/footprint`,
    method: Method.DELETE,
    needToken: true
  });
}

/**
 * 根据id删除足迹
 * @param {String} ids id集合
 */
export function clearTracksById(ids: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/footprint/delByIds/${ids}`,
    method: Method.DELETE,
    needToken: true
  });
}

/**
 * 获取会员积分
 */
export function memberPoint(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/memberPointsHistory/getMemberPointsHistoryVO`,
    method: Method.GET,
    needToken: true,
    params
  });
}

/**
 * 积分历史
 */
export function memberPointHistory(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/memberPointsHistory/getByPage`,
    method: Method.GET,
    needToken: true,
    params
  });
}

export function memberGradeCurrent(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/member/memberGrade/current`,
    method: Method.GET,
    needToken: true,
    params
  })
}

export function memberGradeRules () {
  return request({
    url: `/buyer/member/memberGrade/rules`,
    method: Method.GET,
    needToken: true
  })
}

export function memberGradeList () {
  return request({
    url: `/buyer/member/memberGrade/list`,
    method: Method.GET,
    needToken: true
  })
}
/**
 * 分页获取会员站内信
 * @param {Object} params 请求参数，包括pageNumber、pageSize、status
 */
export function memberMsgList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/message/member`,
    method: Method.GET,
    needToken: true,
    params
  });
}
/**
 * 设置消息为已读
 * @param {String} messageId 消息id
 */

export function getMemberMessage(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/message/member/${id}`,
    method: Method.GET,
    needToken: true,
    skipMessage: true
  });
}

export function readMemberMsg(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/message/member/${id}`,
    method: Method.PUT,
    needToken: true
  });
}
/**
 * 删除会员消息
 * @param {String} messageId 消息id
 */
export function delMemberMsg(id: string | number): Promise<BuyerResponse> {
  return request({
    url: `/buyer/message/member/${id}`,
    method: Method.DELETE,
    needToken: true
  });
}

/**
 * 绑定分销
 * @param distributionId 商品分销ID
 */
export function getGoodsDistribution(distributionId: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/distribution/distribution/bindingDistribution/${distributionId}`,
    method: Method.GET,
    needToken: true
  });
}

/**
 * 订单评价入口规则，复用服务端返回的商品评价状态。
 * @author Bulbasaur
 * @since 2026-11-19
 */

/**
 * 仅已完成且存在待评价商品的订单展示入口，虚拟商品与实物商品使用相同规则。
 * @param {object} order 订单信息
 * @param {Array} items 列表内商品或详情接口单独返回的商品
 * @returns {boolean} 是否可进入评价
 */
export function canEvaluateOrder(order, items = order?.orderItems) {
  return ['COMPLETED', 'COMPLETE'].includes(order?.orderStatus) &&
    Array.isArray(items) && items.some(item => item.commentStatus === 'UNFINISHED')
}

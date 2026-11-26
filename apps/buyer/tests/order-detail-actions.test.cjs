/**
 * 订单详情操作区回归：用真实模板和 Element Plus 按钮验证入口状态与统一尺寸。
 * @author Bulbasaur
 * @since 2026-11-19
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Vue = require('vue');
const { compile } = require('@vue/compiler-dom');
const { renderToString } = require('@vue/server-renderer');
const { ElButton } = require('element-plus');

const source = fs.readFileSync(path.join(__dirname, '../src/pages/home/orderCenter/OrderDetail.vue'), 'utf8');
const start = source.indexOf('<div class="goods-actions">');
const template = source.slice(start, source.indexOf('\n        </div>', start));
const render = new Function('Vue', compile(template, { mode: 'function', prefixIdentifiers: true }).code)(Vue);
const methodNames = ['isGiftItem', 'canEvaluateGoods', 'canApplyGoodsAfterSale'];
const methods = methodNames.map(name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0]).join('\n');

/** 按接口数据渲染实际操作区，不请求或改写业务订单。 */
async function actions(orderOverrides = {}, goodsOverrides = {}) {
  const currentOrder = { sn: 'O123', orderStatus: 'COMPLETED', payStatus: 'PAID', orderType: 'VIRTUAL', ...orderOverrides };
  const goods = { sn: 'I123', commentStatus: 'UNFINISHED', afterSaleStatus: 'NOT_APPLIED', ...goodsOverrides };
  const order = Vue.ref({ order: currentOrder });
  const isECouponOrder = Vue.computed(() => currentOrder.orderType === 'E_COUPON');
  const rules = new Function('order', 'isECouponOrder', `${methods}; return { ${methodNames.join(',')} };`)(order, isECouponOrder);
  const app = Vue.createSSRApp({
    setup: () => ({ order, goods, goodsIndex: 0, ...rules }), render,
  });
  app.component('el-button', ElButton);
  return renderToString(app);
}

test('完成的虚拟核销订单显示相同尺寸的评价和售后按钮', async () => {
  const html = await actions();
  assert.match(html, /评价/);
  assert.match(html, /申请售后/);
  assert.equal((html.match(/el-button--small/g) || []).length, 2);
  assert.doesNotMatch(html, /comment-text/);
});

test('评价仅限已完成且未评价的非赠品', async () => {
  for (const orderStatus of ['UNPAID', 'PAID', 'DELIVERED', 'CANCELLED']) {
    assert.doesNotMatch(await actions({ orderStatus }), />评价</);
  }
  for (const commentStatus of ['NEW', 'FINISHED', 'WAIT_CHASE']) {
    assert.doesNotMatch(await actions({}, { commentStatus }), />评价</);
  }
  assert.doesNotMatch(await actions({}, { promotionType: 'GIFT' }), /<button/);
});

test('售后排除未支付、取消、卡密、兑换和全部退款，部分售后仍可申请', async () => {
  for (const order of [{ payStatus: 'UNPAID' }, { orderStatus: 'CANCELLED' }, { orderType: 'E_COUPON' }, { pickupCardId: 'card' }]) {
    assert.doesNotMatch(await actions(order), /申请售后/);
  }
  for (const goods of [{ isRefund: 'ALL_REFUND' }, { afterSaleStatus: undefined }, { afterSaleStatus: 'EXPIRED' }, { afterSaleStatus: 'ALREADY_APPLIED' }]) {
    assert.doesNotMatch(await actions({}, goods), /申请售后/);
  }
  assert.match(await actions({}, { afterSaleStatus: 'PART_AFTER_SALE' }), /申请售后/);
  assert.match(await actions({ orderType: 'NORMAL' }), /申请售后/);
});

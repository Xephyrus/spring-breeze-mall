/**
 * 评价入口状态及评价列表刷新、分页回归验证。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
// 被测模块是 .ts，Node 侧用类型擦除 + 解析钩子加载
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./ts-resolve-hook.mjs', pathToFileURL('./scripts/'))
const { canEvaluateOrder } = await import('../utils/order-evaluation.ts')

// 覆盖核销券、虚拟商品与实物商品，完成状态和商品评价状态必须同时满足。
for (const orderType of ['E_COUPON', 'VIRTUAL', 'NORMAL']) {
  const order = { orderType, orderStatus: 'COMPLETED', orderItems: [{ commentStatus: 'UNFINISHED' }] }
  assert.equal(canEvaluateOrder(order), true)
  for (const orderStatus of ['UNPAID', 'PAID', 'DELIVERED', 'CANCELLED']) {
    assert.equal(canEvaluateOrder({ ...order, orderStatus }), false)
  }
  for (const commentStatus of ['NEW', 'FINISHED', 'WAIT_CHASE']) {
    assert.equal(canEvaluateOrder({ ...order, orderItems: [{ commentStatus }] }), false)
  }
  assert.equal(canEvaluateOrder({ ...order, orderItems: [
    { commentStatus: 'FINISHED' }, { commentStatus: 'UNFINISHED' },
  ] }), true)
  assert.equal(canEvaluateOrder(order, []), false)
  assert.equal(canEvaluateOrder({ orderStatus: 'COMPLETED' }, order.orderItems), true)
}
assert.equal(canEvaluateOrder(undefined), false)

const source = readFileSync(new URL('../pages/order/evaluate/myEvaluate.vue', import.meta.url), 'utf8')
const refresh = source.match(/function refreshEvaluations\(\) \{[\s\S]*?\n\}/)[0]
// 形参类型可能是 `index: number` 或 `index: number | string`（模板 v-for 下标类型更宽），
// 这里匹配任意类型注解后再统一抹掉，避免类型微调就把测试打挂。
const paginate = source
  .match(/function renderData\(index(?::[^)]*)?\) \{[\s\S]*?\n\}/)[0]
  .replace(/index(?::[^)]*)?\)/, 'index)')
const calls = []
const context = {
  current: { value: 1 }, params: { orderSn: 'O123', pageNumber: 3, loadStatus: 'noMore' },
  orderList: { value: ['old'] },
  loadData: () => calls.push('orders'), loadComments: () => calls.push('comments'),
}
vm.createContext(context)
vm.runInContext(refresh + '\n' + paginate, context)
vm.runInContext('refreshEvaluations(); renderData(1)', context)
assert.deepEqual(calls, ['orders', 'orders'])
assert.equal(context.current.value, 1)
assert.equal(context.params.commentStatus, 'UNFINISHED')
assert.equal(context.params.orderSn, 'O123')
assert.equal(context.params.pageNumber, 1)
assert.equal(context.orderList.value.length, 0)
context.params.loadStatus = 'noMore'
vm.runInContext('renderData(1)', context)
assert.equal(calls.length, 2)
context.current.value = 2
vm.runInContext('refreshEvaluations(); renderData(2)', context)
assert.deepEqual(calls.slice(2), ['comments', 'comments'])
context.current.value = 0
vm.runInContext('refreshEvaluations(); renderData(0)', context)
assert.equal(context.params.commentStatus, undefined)
assert.deepEqual(calls.slice(4), ['orders', 'orders'])
console.log('PASS 评价资格、返回刷新、订单筛选保留及三个标签分页')

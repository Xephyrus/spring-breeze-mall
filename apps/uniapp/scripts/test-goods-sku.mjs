/**
 * 商品规格弹窗回归：使用真实 Vue 响应式运行组件脚本，模拟交易接口验证购买边界。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')
const { ref, computed, watch, reactive, nextTick, effectScope } = require('vue')
const filename = new URL('../components/m-buy/goods.vue', import.meta.url)
const source = await readFile(filename, 'utf8')
const { descriptor, errors } = parse(source)
assert.deepEqual(errors, [])
const compiled = compileScript(descriptor, { id: 'goods-sku-test' })
const template = compileTemplate({ source: descriptor.template.content, filename: filename.pathname, id: 'goods-sku-test', compilerOptions: { bindingMetadata: compiled.bindings } })
assert.deepEqual(template.errors, [])
const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?\sfrom\s+['"][^'"]+['"]\s*$/gm, ''))

/** 创建组件运行环境；只替代平台与网络依赖，保留实际选中、监听及下单逻辑。 */
function mount(goodsDetail, goodsSpec) {
  const props = reactive({ goodsDetail, goodsSpec, isGroup: false })
  const requests = [], toasts = [], routes = [], events = []
  const scope = effectScope()
  const dependencies = {
    ref, computed, watch,
    defineProps: () => props,
    withDefaults: value => value,
    defineEmits: () => (...args) => events.push(args),
    defineExpose: () => {},
    API_trade: { addToCart: data => { requests.push(data); return Promise.resolve({ data: { success: true } }) } },
    uni: { showToast: data => toasts.push(data), navigateTo: data => routes.push(data), hideLoading: () => {} },
    isECoupon: () => false,
    isVirtualGoods: () => false,
    isAppointmentGoods: () => false,
  }
  const state = scope.run(() => new Function(...Object.keys(dependencies), `${script}\nreturn { selectName, selectSkuList, formatList, currentSelected, addToCartOrBuy, handleClickSpec, buyType, parentOrder };`)(...Object.values(dependencies)))
  return { props, state, requests, toasts, routes, events, stop: () => scope.stop() }
}

/** 构造带库存的有效 SKU 详情。 */
function detail(id = 'sku-1') { return { id, goodsId: 'goods-1', quantity: 10, price: 3 } }

for (const specValues of [[], [{ specName: 'images', specImage: ['a.png'] }]]) {
  test(`无规格商品（${specValues.length ? '仅图片' : '空规格'}）可购买和加购`, async () => {
    const vm = mount(detail(), [{ skuId: 'sku-1', specValues }])
    try {
      assert.equal(vm.state.selectName.value, '默认规格')
      assert.deepEqual(vm.state.formatList.value, [])
      assert.equal(vm.state.selectSkuList.value.data.id, 'sku-1')
      vm.state.addToCartOrBuy('buy')
      vm.state.addToCartOrBuy('cart')
      await nextTick()
      assert.deepEqual(vm.requests, [{ skuId: 'sku-1', num: 1, cartType: 'BUY_NOW' }, { skuId: 'sku-1', num: 1 }])
      assert.ok(vm.routes[0].url.includes('way=BUY_NOW'))
      assert.ok(!vm.toasts.some(item => item.title === '请选择规格商品'))
    } finally { vm.stop() }
  })
}

test('异步加载、多规格切换和清空数据均同步选中状态', async () => {
  const vm = mount(detail(), '')
  const specs = [
    { skuId: 'sku-1', specValues: [{ specName: '颜色', specValue: '红' }, { specName: '尺寸', specValue: '大' }] },
    { skuId: 'sku-2', specValues: [{ specName: '颜色', specValue: '蓝' }, { specName: '尺寸', specValue: '大' }] },
  ]
  try {
    vm.props.goodsSpec = specs
    await nextTick()
    assert.deepEqual(vm.state.currentSelected.value, ['红', '大'])
    assert.equal(vm.state.formatList.value.length, 2)
    vm.state.handleClickSpec(vm.state.formatList.value[0], 0, { value: '蓝' })
    assert.ok(vm.events.some(([name, value]) => name === 'handleClickSku' && value.skuId === 'sku-2'))
    vm.props.goodsDetail = detail('sku-2')
    await nextTick()
    assert.deepEqual(vm.state.currentSelected.value, ['蓝', '大'])
    vm.state.addToCartOrBuy('buy')
    assert.equal(vm.requests[0].skuId, 'sku-2')
    vm.props.goodsSpec = []
    await nextTick()
    assert.equal(vm.state.selectSkuList.value, '')
    assert.deepEqual(vm.state.formatList.value, [])
    vm.state.addToCartOrBuy('buy')
    assert.equal(vm.requests.length, 1)
    assert.equal(vm.toasts.at(-1).title, '请选择规格商品')
  } finally { vm.stop() }
})

test('缺失规格、SKU 不匹配或详情缺少 ID 时不绕过购买校验', () => {
  for (const [goods, specs] of [
    [detail(), null], [detail(), []],
    [detail(), [{ skuId: 'other', specValues: [] }]],
    [detail(), [{ skuId: 'sku-1' }]],
    [{ quantity: 10 }, [{ specValues: [] }]],
  ]) {
    const vm = mount(goods, specs)
    try {
      vm.state.addToCartOrBuy('buy')
      assert.equal(vm.requests.length, 0)
      assert.equal(vm.toasts.at(-1).title, '请选择规格商品')
    } finally { vm.stop() }
  }
})

test('数字与字符串 SKU ID 兼容，拼团购买保留订单类型', () => {
  const vm = mount(detail('123'), [{ skuId: 123, specValues: [] }])
  try {
    vm.state.buyType.value = 'PINTUAN'
    vm.state.addToCartOrBuy('buy')
    assert.equal(vm.requests[0].cartType, 'PINTUAN')
  } finally { vm.stop() }
})

/**
 * `utils/loading.ts` 的计数与配对回归。
 *
 * 背景：uni 的 showLoading / hideLoading 必须 1:1 配对，否则控制台告警
 * 「请注意 showLoading 与 hideLoading 必须配对使用」。项目里存在
 * 「页面 show、请求层兜底 hide」的历史写法，所以封装成计数版：
 * 多出来的 hide 变 no-op，重复 show 不叠加遮罩。
 *
 * 这个测试同时能挡住一类危险回归：封装内部若误写成 `showLoading()` 自调用，
 * 就会无限递归 —— 断言「恰好一次 uni.showLoading」即可发现。
 */
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

/** 记录对 uni 的真实调用 */
const calls = []
globalThis.uni = {
  showLoading: (options) => calls.push(['show', options?.title]),
  hideLoading: () => calls.push(['hide']),
}

// 用文件自身位置定位钩子，避免依赖进程 cwd（pnpm 与直接 node 运行时的 cwd 不同）
register('./ts-resolve-hook.mjs', import.meta.url)
const { showLoading, hideLoading, resetLoading } = await import('../utils/loading.ts')

const reset = () => {
  calls.length = 0
  resetLoading()
  calls.length = 0
}

// 1) 基本配对：一次 show 对应一次 hide
reset()
showLoading({ title: '加载中' })
assert.deepEqual(calls, [['show', '加载中']])
hideLoading()
assert.deepEqual(calls, [['show', '加载中'], ['hide']])

// 2) 多余的 hide 必须是 no-op —— 这正是消除告警的关键
reset()
hideLoading()
hideLoading()
assert.deepEqual(calls, [], '没有 show 过就不应调用 uni.hideLoading')

// 3) 并发：两次 show 只显示一次；两次 hide 只在计数归零时隐藏一次
reset()
showLoading()
showLoading()
assert.equal(calls.length, 1, '重复 show 不应重复调用 uni.showLoading')
hideLoading()
assert.equal(calls.length, 1, '计数未归零时不应隐藏')
hideLoading()
assert.deepEqual(calls, [['show', '加载中'], ['hide']])

// 4) resetLoading 强制收起，且随后再 hide 不再重复调用
reset()
showLoading()
resetLoading()
assert.deepEqual(calls, [['show', '加载中'], ['hide']])
hideLoading()
assert.equal(calls.length, 2, 'reset 后再 hide 应为 no-op')

// 5) 默认 title 兜底
reset()
showLoading()
assert.deepEqual(calls, [['show', '加载中']])

console.log('PASS loading 计数、配对与 reset')

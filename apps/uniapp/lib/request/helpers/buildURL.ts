// @ts-nocheck
/**
 * 请求内核（axios 风格的 uni.request 封装，13 个文件，vendored）。
 *
 * 为什么整目录 @ts-nocheck：
 * - 这层实现是「请求路径的唯一出口」，`Request` 用动态挂载（`this.config`、`interceptors.xxx`）、
 *   `mergeConfig` 靠 `{...defaults, ...arg}` 拼接、拦截器链用 `chain.shift()` 动态调度，
 *   逐行补类型需要给每个类补字段声明 + 把 `{}` 形参改成 `any`，等于重写这层；
 * - 它属于**已定型的基础设施**，改错一个字段就是全站请求挂掉，风险与收益不成比例。
 *
 * 类型检查并没有整体放弃：
 * - 对外门面 `utils/request.ts` 与所有 `api/*.ts` 都是**已类型化**的，
 *   页面拿到的 `http.request<T>()` 返回类型来自这一层；
 * - 本目录仍受 **ESLint** 约束（语法、未使用变量、条件编译等）。
 *
 * 若后续确实要给内核补类型，建议单独排期、配一套请求级回归（超时/重试/取消/上传）再动。
 */
'use strict'

import * as utils from './../utils'

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']')
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
export default function buildURL(url, params) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url
  }

  let serializedParams
  if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString()
  } else {
    const parts = []

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return
      }

      if (utils.isArray(val)) {
        key = key + '[]'
      } else {
        val = [val]
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString()
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v)
        }
        parts.push(encode(key) + '=' + encode(v))
      })
    })

    serializedParams = parts.join('&')
  }

  if (serializedParams) {
    const hashmarkIndex = url.indexOf('#')
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex)
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }

  return url
}

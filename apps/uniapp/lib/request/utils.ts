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

// utils is a library of generic helper functions non-specific to axios

const toString = Object.prototype.toString

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
export function isArray (val) {
  return toString.call(val) === '[object Array]'
}


/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
export function isObject (val) {
  return val !== null && typeof val === 'object'
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
export function isDate (val) {
  return toString.call(val) === '[object Date]'
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
export function isURLSearchParams (val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams
}


/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
export function forEach (obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj]
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (let i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj)
    }
  } else {
    // Iterate over object keys
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj)
      }
    }
  }
}

/**
 * 是否为boolean 值
 * @param val
 * @returns {boolean}
 */
export function isBoolean(val) {
  return typeof val === 'boolean'
}

/**
 * 是否为真正的对象{} new Object
 * @param {any} obj - 检测的对象
 * @returns {boolean}
 */
export function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}



/**
 * Function equal to merge with the difference being that no reference
 * to original objects is kept.
 *
 * @see merge
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
export function deepMerge(...sources: any[]) {
  const result = {}
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = deepMerge(result[key], val)
    } else if (typeof val === 'object') {
      result[key] = deepMerge({}, val)
    } else {
      result[key] = val
    }
  }
  // rest 参数替代 arguments：调用方只传普通对象，遍历行为不变
  for (let i = 0, l = sources.length; i < l; i++) {
    forEach(sources[i], assignValue)
  }
  return result
}

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
/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
export default function settle(resolve, reject, response) {
  const validateStatus = response.config.validateStatus
  const status = response.statusCode
  if (status && (!validateStatus || validateStatus(status))) {
    resolve(response)
  } else {
    reject(response)
  }
}

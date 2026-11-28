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
 * @Class Request
 * @description luch-request http请求插件
 * @version 3.0.2
 * @Author lu-ch
 * @Date 2020-06-04
 * @Email webwork.s@qq.com
 * 文档: https://quanzhan.co/luch-request/
 * github: https://github.com/lei-mu/luch-request
 * DCloud: http://ext.dcloud.net.cn/plugin?id=392
 * HBuilderX: 2.7.9
 */


import dispatchRequest from './dispatch-request'
import InterceptorManager from './interceptor-manager'
import mergeConfig from './merge-config'
import defaults from './defaults'
import { isPlainObject } from '../utils'

export default class Request {
  /**
   * @param {Object} arg - 全局配置
   * @param {String} arg.baseURL - 全局根路径
   * @param {Object} arg.header - 全局header
   * @param {String} arg.method = [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE] - 全局默认请求方式
   * @param {String} arg.dataType = [json] - 全局默认的dataType
   * @param {String} arg.responseType = [text|arraybuffer] - 全局默认的responseType。App和支付宝小程序不支持
   * @param {Object} arg.custom - 全局默认的自定义参数
   * @param {Number} arg.timeout - 全局默认的超时时间，单位 ms。默认30000。仅微信小程序（2.10.0）、支付宝小程序支持
   * @param {Boolean} arg.sslVerify - 全局默认的是否验证 ssl 证书。默认true.仅App安卓端支持（HBuilderX 2.3.3+）
   * @param {Boolean} arg.withCredentials - 全局默认的跨域请求时是否携带凭证（cookies）。默认false。仅H5支持（HBuilderX 2.6.15+）
   * @param {Function(statusCode):Boolean} arg.validateStatus - 全局默认的自定义验证器。默认statusCode >= 200 && statusCode < 300
   */
  constructor(arg = {}) {
    if (!isPlainObject(arg)) {
      arg = {}
      //console.warn('设置全局参数必须接收一个Object')
    }
    this.config = {...defaults, ...arg}
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  /**
   * @Function
   * @param {Request~setConfigCallback} f - 设置全局默认配置
   */
  setConfig(f) {
    this.config = f(this.config)
  }

  _middleware(config) {
    config = mergeConfig(this.config, config)
    const chain = [dispatchRequest, undefined]
    let promise = Promise.resolve(config)

    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      chain.unshift(interceptor.fulfilled, interceptor.rejected)
    })

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }

  /**
   * @Function
   * @param {Object} config - 请求配置项
   * @prop {String} options.url - 请求路径
   * @prop {Object} options.data - 请求参数
   * @prop {Object} [options.responseType = config.responseType] [text|arraybuffer] - 响应的数据类型
   * @prop {Object} [options.dataType = config.dataType] - 如果设为 json，会尝试对返回的数据做一次 JSON.parse
   * @prop {Object} [options.header = config.header] - 请求header
   * @prop {Object} [options.method = config.method] - 请求方法
   * @returns {Promise<any>}
   */
  request(config = {}) {
    return this._middleware(config)
  }

  get(url, options = {}) {
    return this.request({
      url,
      method: 'GET',
      ...options
    })
  }

  post(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'POST',
      ...options
    })
  }

  // #ifndef MP-ALIPAY
  put(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'PUT',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  delete(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'DELETE',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN
  connect(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'CONNECT',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  head(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'HEAD',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  options(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'OPTIONS',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN
  trace(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'TRACE',
      ...options
    })
  }

  // #endif

  upload(url, config = {}) {
    config.url = url
    config.method = 'UPLOAD'
    return this._middleware(config)
  }

  download(url, config = {}) {
    config.url = url
    config.method = 'DOWNLOAD'
    return this._middleware(config)
  }
}


/**
 * setConfig回调
 * @return {Object} - 返回操作后的config
 * @callback Request~setConfigCallback
 * @param {Object} config - 全局默认config
 */

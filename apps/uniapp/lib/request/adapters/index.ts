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
import buildURL from '../helpers/buildURL'
import buildFullPath from '../core/buildFullPath'
import settle from '../core/settle'

/**
 * 返回可选值存在的配置
 * @param {Array} keys - 可选值数组
 * @param {Object} config2 - 配置
 * @return {{}} - 存在的配置项
 */
const mergeKeys = (keys, config2) => {
  const config = {}
  keys.forEach(prop => {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop]
    }
  })
  return config
}
export default (config) => {
  return new Promise((resolve, reject) => {
    const _config = {
      url: buildURL(buildFullPath(config.baseURL, config.url), config.params),
      header: config.header,
      complete: (response) => {
        response.config = config
        try {
          // 对可能字符串不是json 的情况容错
          if (typeof response.data === 'string') {
            response.data = JSON.parse(response.data)
          }
           
        } catch (e) {
        }
        settle(resolve, reject, response)
      }
    }
    let requestTask
    if (config.method === 'UPLOAD') {
      const otherConfig = {
        // #ifdef MP-ALIPAY
        fileType: config.fileType,
        // #endif
        filePath: config.filePath,
        name: config.name
      }
      const optionalKeys = [
        // #ifdef APP-PLUS || H5
        'files',
        // #endif
        // #ifdef H5
        'file',
        // #endif
        'formData'
      ]
      requestTask = uni.uploadFile({..._config, ...otherConfig, ...mergeKeys(optionalKeys, config)})
    } else if (config.method === 'DOWNLOAD') {
      requestTask = uni.downloadFile(_config)
    } else {
      const optionalKeys = [
        'data',
        'method',
        // #ifdef MP-ALIPAY || MP-WEIXIN
        'timeout',
        // #endif
        'dataType',
        // #ifndef MP-ALIPAY || APP-PLUS
        'responseType',
        // #endif
        // #ifdef APP-PLUS
        'sslVerify',
        // #endif
        // #ifdef H5
        'withCredentials'
        // #endif
      ]
      requestTask = uni.request({..._config,...mergeKeys(optionalKeys, config)})
    }
    if (config.getTask) {
      config.getTask(requestTask, config)
    }
  })
}

import "axios";

/**
 * buyer 的请求层在 axios 配置上挂了若干业务开关，
 * 这里统一用模块扩展声明，避免调用处出现隐式 any。
 */
declare module "axios" {
  interface AxiosRequestConfig {
    /** true：强制显示全屏 loading；false：强制不显示 */
    loading?: boolean;
    /** 需要登录态：token 过期时触发刷新，失败则引导登录 */
    needToken?: boolean;
    /** 可选登录态：token 失效时降级为匿名请求，不打断浏览 */
    optionalToken?: boolean;
    /** 跳过 401/403/20004 的统一登录处理（刷新 token 自身用） */
    skipAuthHandler?: boolean;
    /** 跳过统一错误提示（调用方自行提示） */
    skipMessage?: boolean;
    /** 内部标记：请求体已完成序列化 */
    _dataSerialized?: boolean;
    /** 内部标记：已在刷新 token 后重试过一次 */
    _retryAfterRefresh?: boolean;
    /** 内部标记：当前请求的 loading 实例 */
    _loadingInstance?: { close: () => void };
  }
}

export {};

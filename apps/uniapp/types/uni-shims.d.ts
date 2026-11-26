/**
 * HBuilderX 编译期才存在、但项目里没有对应 npm 包的全局声明。
 *
 * 这个文件只服务于编辑器的语法提示，不参与 HBuilderX / vite 构建。
 */

/**
 * 微信小程序 API。
 *
 * 只出现在 `#ifdef MP-WEIXIN` 条件编译块里，运行时由微信基础库提供。
 * 想要完整类型可以另外安装 miniprogram-api-typings，
 * 然后把下面这行换成 `declare const wx: WechatMiniprogram.Wx`。
 */
declare const wx: any

/**
 * HTML5+ 的 `Plus` 类型由 @dcloudio/types 提供，但它没有覆盖 `plus.globalEvent`
 * （应用内全局事件，App.vue 里用它监听 newintent）。
 * 这里做接口合并把缺的成员补上。
 */
interface Plus {
  globalEvent: {
    addEventListener(event: string, listener: (data?: any) => void): void
    removeEventListener(event: string, listener: (data?: any) => void): void
    fire(event: string, data?: any): void
  }
}

/**
 * uni-app 应用 / 页面生命周期。
 *
 * 由 @dcloudio/vite-plugin-uni 在编译时提供，项目的 node_modules 里没有
 * @dcloudio/uni-app 这个包，因此这里补一份最小声明。
 */
declare module '@dcloudio/uni-app' {
  export const onLaunch: (callback: (options?: any) => void) => void
  export const onShow: (callback: (options?: any) => void) => void
  export const onHide: (callback: () => void) => void
  export const onLoad: (callback: (query?: any) => void) => void
  export const onUnload: (callback: () => void) => void
  export const onReady: (callback: () => void) => void
  export const onPullDownRefresh: (callback: () => void) => void
  export const onReachBottom: (callback: () => void) => void
  export const onPageScroll: (
    callback: (options: { scrollTop: number; scrollHeight?: number }) => void
  ) => void
  export const onResize: (callback: (options?: any) => void) => void
  export const onBackPress: (callback: () => void | boolean) => void
  export const onNavigationBarButtonTap: (
    callback: (options?: { index: number }) => void
  ) => void
  export const onShareAppMessage: (callback: (options?: any) => any) => void
  export const onShareTimeline: (callback: (options?: any) => any) => void
}

/**
 * 兜底：main.js 里 import 了 './components/m-airbtn/index.vue'。
 *
 * 真实 .vue 文件由 Volar 接管，只有解析不到真实文件时才会用到这条通配声明。
 */
declare module '*.vue' {
  const component: any
  export default component
}

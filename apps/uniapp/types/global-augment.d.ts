/**
 * 项目级类型补丁（只服务于 typecheck 与编辑器，不参与 HBuilderX 构建）。
 *
 * 这里补的都是「运行时由 HBuilderX / uni 运行时 / uview-plus / 原生插件提供，
 * 但仓库里没有对应 npm 类型」的成员。改动原则：
 *   1. 只做**声明合并**，不引入任何运行时包；
 *   2. 能用精确类型就不用 any；实在拿不准的（原生插件返回）用 unknown/any 并写注释。
 */

import type { ComputedRef } from 'vue'

// ---------------------------------------------------------------------------
// Vue 组件实例上的全局属性（main.js 里用 app.config.globalProperties 注入）
// ---------------------------------------------------------------------------
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /** vuex store（main.js: app.config.globalProperties.$store = store） */
    $store: unknown
    /** 主题主色（computed 包装，模板里自动解包） */
    $mainColor: ComputedRef<string> | string
    /** 主题亮色 */
    $lightColor: ComputedRef<string> | string
    /** 主题辅助亮色 */
    $aiderLightColor: ComputedRef<string> | string
    /** uview-plus 的全局工具对象（$u.route / $u.mpShare / $u.toast 等） */
    $u: UviewPlusGlobal
  }
}

/**
 * uni-app 的内置 `<button>` 组件支持 `type="primary|default|warn"`，
 * 而 Volar 默认按 DOM 的 `<button type="button|reset|submit">` 校验。
 * 这里把 DOM 属性类型放宽为两者的并集 —— 对 uni 项目才是准确的。
 */
declare module '@vue/runtime-dom' {
  interface ButtonHTMLAttributes {
    type?: 'button' | 'reset' | 'submit' | 'primary' | 'default' | 'warn'
  }
}

/**
 * uview-plus 暴露在实例上的 `$u`。
 *
 * 它本身没有随包发布 d.ts，这里按实际用到的成员收窄；其余走索引签名。
 */
export interface UviewPlusGlobal {
  /** 路由工具 */
  route: (...args: any[]) => any
  /** toast */
  toast: (title: string, ...args: any[]) => any
  /** 剪贴板 */
  setClipboardData?: (options: Record<string, unknown>) => void
  /** 小程序分享配置（m-share 组件会写） */
  mpShare: Record<string, unknown>
  [key: string]: any
}

// ---------------------------------------------------------------------------
// uni / 小程序事件与页面实例
// ---------------------------------------------------------------------------
declare global {
  /**
   * uni 的事件对象比 DOM 的 Event 多出 detail / target.dataset / touches 等字段。
   *
   * 直接给 DOM 的 `Event` 做声明合并，可以一次性覆盖所有 `e.detail`、
   * `e.target.dataset.id`、`e.touches[0].clientX` 这类写法，
   * 避免在几十个页面里逐个写 as。
   */
  interface Event {
    detail?: any
    target?: {
      dataset?: Record<string, any>
      value?: any
      id?: string
      [key: string]: any
    }
    currentTarget?: {
      dataset?: Record<string, any>
      id?: string
      [key: string]: any
    }
    touches?: Array<{ clientX: number; clientY: number; identifier?: number; [key: string]: any }>
    changedTouches?: Array<{
      clientX: number
      clientY: number
      identifier?: number
      [key: string]: any
    }>
    /** 小程序 picker / input 的回调参数 */
    [key: string]: any
  }

  /**
   * 页面实例上的私有字段。
   *
   * 注意：`PageInstance` 声明在全局命名空间 `Page` 里（@dcloudio/types/page.d.ts），
   * 不是全局接口 —— 必须按命名空间合并，否则不会生效。
   */
  namespace Page {
    interface PageInstance<D extends AnyObject = any, T extends AnyObject = any> {
      __page__?: { fullPath?: string; options?: Record<string, any> }
      [key: string]: any
    }
  }

  /**
   * HTML5+ 的 plus 命名空间补充：缓存统计 / 清理（`pages/mine/set/setUp.vue` 在用）。
   */
  interface Plus {
    cache: {
      calculate: (callback: (size: number) => void) => void
      clear: (callback?: () => void) => void
      [key: string]: any
    }
  }

  /**
   * 微信 JSAPI 的支付桥（H5 端由微信内置浏览器注入，只在公众号支付里出现）。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WeixinJSBridge: any

  /**
   * 微信小程序插件加载器（仅在 #ifdef MP-WEIXIN 分支里使用），基础库提供。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requirePlugin: any

  /**
   * uni 对象上被 uview-plus 挂载的 `$u`（`utils/mpShare.ts` 里会读写它做分享配置）。
   */
  interface Uni {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $u: any
  }

  /**
   * HTML5+ 的 plus.ios 命名空间补充：`plus.ios.import(...)` 用于导入 iOS 原生类
   * （`pages/tabbar/screen/fullScreen.vue` 退出全屏时使用）。
   */
  interface PlusIos {
    import: (name: string) => any
    [key: string]: any
  }

  /**
   * HTML5+ 的 plus.android 命名空间。
   *
   * @dcloudio/types 里 `PlusAndroidInstanceObject` 只声明了 message 通道相关的成员，
   * 项目里实际还用到 importClass / invoke / requestPermissions / runtimeMainActivity。
   */
  interface PlusAndroidInstanceObject {
    importClass: (name: string) => any
    invoke?: (obj: any, method: string, ...args: any[]) => any
    requestPermissions?: (
      permissions: string[],
      success?: (e: any) => void,
      fail?: (e: any) => void
    ) => void
    runtimeMainActivity?: () => any
    [key: string]: any
  }
}

export {}

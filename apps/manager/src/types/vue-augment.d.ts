/**
 * Vue / Element Plus 的类型补齐（strictTemplates 下必需）。
 *
 * 1) `v-loading` 等全局指令：模板校验走 `GlobalDirectives`，属性访问走 `ComponentCustomProperties`。
 * 2) 运行时会把未声明属性透传到根元素，但类型系统默认拒绝。事件一律用
 *    `(...args: any[]) => any`，避免与组件自身的事件签名求交后不可赋值。
 * 3) `data-*` / `aria-*` / `width` 是原生属性。注意要增强 `@vue/runtime-dom`——
 *    `vue` 只做重导出，增强 `vue` 里的 HTMLAttributes 不会作用到 ThHTMLAttributes 等子接口。
 * 4) `liliDialog` 是在 main.ts 里 app.component 注册的全局组件；
 *    `priceColorScheme` 来自 app.config.globalProperties。
 */
import { ElLoading } from "element-plus";

declare module "@vue/runtime-dom" {
  interface HTMLAttributes {
    [key: `data-${string}`]: any;
    "aria-value"?: string | number;
    width?: string | number;
  }
  interface SVGAttributes {
    [key: `data-${string}`]: any;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    vLoading: typeof ElLoading.directive;
    priceColorScheme?: any;
    /** main.ts 里注册的全局过滤器集合（filters.ts） */
    $filters: typeof import("@/utils/filters");
  }

  interface GlobalDirectives {
    vLoading: typeof ElLoading.directive;
  }

  interface ComponentCustomProps {
    title?: string;
    width?: string | number;
    onClick?: (...args: any[]) => any;
    onDblclick?: (...args: any[]) => any;
    onMouseenter?: (...args: any[]) => any;
    onMouseleave?: (...args: any[]) => any;
    onContextmenu?: (...args: any[]) => any;
    onKeyup?: (...args: any[]) => any;
    onKeydown?: (...args: any[]) => any;
    onChange?: (...args: any[]) => any;
    onSubmit?: (...args: any[]) => any;
    onEnd?: (...args: any[]) => any;
    /** vuedraggable 透传属性（其类型定义未声明） */
    animation?: number;
    ghostClass?: string;
    disabled?: boolean;
    /** 自定义富文本编辑器透传属性 */
    openXss?: boolean;
    /** 页面装修组件透传属性 */
    zonesInit?: any;
    image?: any;
    "aria-label"?: string;
    "aria-value"?: string | number;
    priceColorScheme?: any;
    type?: any;
  }

  interface GlobalComponents {
    liliDialog: any;
    priceColorScheme: any;
  }
}

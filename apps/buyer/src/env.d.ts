/// <reference types="vite/client" />

/**
 * 运行时配置（`public/config.js`）在 index.html 里以全局变量注入，
 * 因此这里显式声明，避免源码里出现隐式全局。
 */
interface RuntimeBaseConfig {
  API_DEV: { buyer: string };
  API_PROD: { buyer: string };
  MAP?: { aMapKey?: string; aMapSecurityJsCode?: string };
}

declare const BASE: RuntimeBaseConfig;

interface ImportMetaEnv {
  readonly VUE_APP_PUBLIC_PATH?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  BASE?: RuntimeBaseConfig;
  atob: (data: string) => string;
  _AMapSecurityConfig?: { securityJsCode: string };
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "uuid";
declare module "qs";
declare module "js-cookie";
declare module "psl";
declare module "nprogress";
declare module "dplayer";
declare module "vue-qr";
declare module "@amap/amap-jsapi-loader";

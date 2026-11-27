/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_PATH?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface SellerBaseConfig {
  /** 后端服务（店铺接口由 manager-api 提供） */
  API_DEV: { seller: string };
  API_PROD: { seller: string };
  PC_URL: string;
  WAP_URL: string;
  PREFIX: string;
  /** 第三方地图 Key，由 public/config.js 运行时注入（不写进 src） */
  MAP?: {
    aMapKey?: string;
    aMapSecurityJsCode?: string;
    tMapKey?: string;
  };
}

/**
 * `public/config.js` 以 <script> 方式注入的全局对象。
 * 注意：本文件是全局脚本（无 import/export），因此直接在顶层 declare，
 * 不能用 `declare global {}`（那是模块文件里的写法）。
 */
declare const BASE: SellerBaseConfig;

interface Window {
  BASE?: SellerBaseConfig;
  _AMapSecurityConfig?: { securityJsCode: string };
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "vue-qr";
declare module "dplayer";
declare module "hls";
declare module "@amap/amap-jsapi-loader";
declare module "uuid";

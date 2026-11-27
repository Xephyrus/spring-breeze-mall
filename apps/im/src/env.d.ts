/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VUE_APP_PUBLIC_PATH?: string;
  readonly VUE_APP_API_BASE_URL?: string;
  readonly VUE_APP_WEB_SOCKET_URL?: string;
  readonly VUE_APP_BUYER?: string;
  readonly VUE_APP_SELLER?: string;
  readonly VUE_APP_WEBSITE_NAME?: string;
  readonly VUE_APP_PC_URL?: string;
  readonly VUE_APP_PC_STORE?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** 由 index.html 或宿主页面注入的全局配置（如有） */
  BASE?: Record<string, unknown>;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "js-base64";
declare module "virtual:svg-icons-register";
declare module "vue-virtual-scroller";
declare module "vue-cropper";
declare module "js-audio-recorder";
declare module "vue-prism-editor";

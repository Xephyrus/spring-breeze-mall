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

interface ManagerBaseConfig {
  API_DEV: { manager: string };
  API_PROD: { manager: string };
  PC_URL: string;
  WAP_URL: string;
  PREFIX: string;
}

declare global {
  const BASE: ManagerBaseConfig;

  interface TinyMceEditor {
    setContent: (content: string) => void;
    getContent: () => string;
    insertContent: (content: string) => void;
    destroy: () => void;
    on: (event: string, callback: (...args: never[]) => void) => void;
  }

  interface TinyMceApi {
    init: (config: Record<string, unknown>) => void;
    get: (id: string) => TinyMceEditor | null | undefined;
  }

  interface Window {
    BASE?: ManagerBaseConfig;
    _AMapSecurityConfig?: { securityJsCode: string };
    tinymce?: TinyMceApi;
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "vue-qr" {
  import type { App, Plugin } from "vue";
  export const install: (app: App) => void;
  const plugin: Plugin;
  export default plugin;
}

declare module "dplayer";
declare module "hls";
declare module "hls.js";
declare module "sockjs-client";
declare module "@amap/amap-jsapi-loader";

export {};

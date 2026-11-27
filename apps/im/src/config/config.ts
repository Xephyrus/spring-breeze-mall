/**
 * 全局业务配置。
 *
 * 环境变量来自 `.env` / `.env.development`（Vite 的 `import.meta.env`，前缀 `VUE_APP_`）。
 * 修改环境变量后需要重启 dev server 或重新构建才会生效。
 */
export interface AppConfig {
  /** 站点/系统标题名称 */
  WEBSITE_NAME: string;
  /** IM 专属后端 HTTP API 基准地址 */
  BASE_API_URL: string;
  /**
   * IM 实时通讯 WebSocket 基准地址。
   *
   * 本地开发必须用 `ws://`（如 `ws://127.0.0.1:8885/lili/webSocket`），
   * 生产环境配了 SSL 证书必须用 `wss://`。
   */
  BASE_WS_URL: string;
  /** 买家端接口基准地址 */
  BASE_BUYER: string;
  /** 商家端接口基准地址 */
  BASE_SELLER: string;
  /** PC 买家端商城外链前缀 */
  PC_URL: string;
  /** PC 商家后台外链前缀 */
  PC_STORE: string;
}

const config: AppConfig = {
  WEBSITE_NAME: import.meta.env.VUE_APP_WEBSITE_NAME || "LiLi IM",
  BASE_API_URL: import.meta.env.VUE_APP_API_BASE_URL || "",
  BASE_WS_URL: import.meta.env.VUE_APP_WEB_SOCKET_URL || "",
  BASE_BUYER: import.meta.env.VUE_APP_BUYER || "",
  BASE_SELLER: import.meta.env.VUE_APP_SELLER || "",
  PC_URL: import.meta.env.VUE_APP_PC_URL || "https://pc-b2b2c.pickmall.cn",
  PC_STORE: import.meta.env.VUE_APP_PC_STORE || "https://store-b2b2c.pickmall.cn",
};

export default config;

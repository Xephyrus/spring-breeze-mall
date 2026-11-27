export interface AppConfig {
  title: string;
  aMapSecurityJsCode: string;
  aMapKey: string;
  aMapSwitch: boolean;
  website: string;
  enableCDN: boolean;
  port: number;
  inputMaxLength: string;
  mainColor: string;
  /** 页脚公司信息回退值（站点设置未加载时） */
  company?: {
    name?: string;
    href?: string;
  };
  icpMessage?: string;
  setting: {
    isUseTabsRouter: boolean;
  };
}

/** `public/config.js` 运行时注入的地图 Key（部署环境填写） */
const mapConfig = (typeof window !== "undefined" ? window.BASE?.MAP : undefined) ?? {};

const config: AppConfig = {
  title: "lilishop",
  /**
   * 地图 Key 不再硬编码在源码里（会随仓库泄露）。
   * 统一由 `public/config.js` 的 `BASE.MAP` 在运行时注入：
   *   - 高德地图申请：https://lbs.amap.com/api/javascript-api/guide/abc/prepare
   *     （2021-12-02 之后申请的 Key 必须同时配安全密钥 jscode）
   *   - 腾讯位置服务：https://lbs.qq.com/webApi/javascriptGL/glGuide/glOverview
   * 未配置时地图相关功能不可用，其余功能不受影响。
   */
  aMapSecurityJsCode: mapConfig.aMapSecurityJsCode ?? "",
  aMapKey: mapConfig.aMapKey ?? "",
  aMapSwitch: false,
  website: "https://www.pickmall.cn",
  enableCDN: true,
  port: 10003,
  inputMaxLength: "140",
  mainColor: "#ff5c58",
  company: {
    name: "",
    href: "",
  },
  icpMessage: "",
  setting: {
    isUseTabsRouter: true,
  },
};

export const {
  title,
  aMapSecurityJsCode,
  aMapKey,
  aMapSwitch,
  website,
  enableCDN,
  port,
  inputMaxLength,
  mainColor,
  setting,
} = config;

export default config;

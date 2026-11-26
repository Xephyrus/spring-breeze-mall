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

const config: AppConfig = {
  title: "lilishop",
  /**
   * 高德地图申请链接
   * https://lbs.amap.com/api/javascript-api/guide/abc/prepare
   * 添加成功后，可获取到key值和安全密钥jscode（自2021年12月02日升级，升级之后所申请的 key 必须配备安全密钥 jscode 一起使用)
   */
  // FIXME 请检查当前高德key创建的日期，如果2021年12月02日之前申请的 无需填写安全密钥
  aMapSecurityJsCode: "2bd0fbf621881f4c77be74f0e76495f3",
  aMapKey: "7f11113750315d8543daaf5c3ba353ca",
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

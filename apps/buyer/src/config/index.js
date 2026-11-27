import Cookie from "js-cookie";

// 地图 Key 由 public/config.js 运行时注入（不硬编码在源码里，避免随仓库泄露）
const mapConfig = (typeof window !== "undefined" && window.BASE && window.BASE.MAP) || {};

export default {
  // 配置显示在浏览器标签的 title、底部信息、部分信息展示的值
  title: Cookie.get("siteName") || "lilishop",
  icpCard: "", // icp 证
  company: {
    href: "https://pickmall.cn",
    name: "北京宏业汇成科技有限公司",
  }, // 公司信息
  icpMessage: "京ICP备20009696号-1", // icp 备案
  /**
   * 高德地图：`public/config.js` 的 BASE.MAP 里配置
   * 2021-12-02 之后申请的 Key 必须同时配安全密钥 jscode
   */
  aMapSecurityJsCode: mapConfig.aMapSecurityJsCode || "",
  aMapKey: mapConfig.aMapKey || "",
  aMapSwitch: false, // 是否开启高德定位
  enableCDN: true, // 生产环境是否启用 cdn 加载 vue 等 js
  port: 10000, // 端口
  inputMaxLength: "140", // 全局输入框默认最大输入长度字

  PC_DOMAIN: "https://pc-b2b2c.pickmall.cn", // PC 端域名
  WAP_DOMAIN: "https://m-b2b2c.pickmall.cn", // WAP 端域名
};

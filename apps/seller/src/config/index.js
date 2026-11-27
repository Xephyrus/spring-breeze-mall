
// 地图 Key 由 public/config.js 运行时注入（不硬编码在源码里，避免随仓库泄露）
const mapConfig =
  (typeof window !== "undefined" && window.BASE && window.BASE.MAP) || {};

module.exports = {
  title: "lilishop", //配置显示在浏览器标签的title
  icpCard: "", // icp证
  company: {
    href: "https://pickmall.cn",
    name: "北京宏业汇成科技有限公司",
  }, //公司信息
  icpMessage: "京ICP备20009696号-1", //icp备案
  /**
   * 高德地图：`public/config.js` 的 BASE.MAP 里配置
   * 2021-12-02 之后申请的 Key 必须同时配安全密钥 jscode
   */
  aMapSecurityJsCode: mapConfig.aMapSecurityJsCode || "",
  aMapKey: mapConfig.aMapKey || "",
  /**
   * 腾讯位置服务 JavaScript API GL，用于上门服务电子围栏
   * 与后端 lili.lbs.key 同一把 Key，控制台需开通 JavaScript API GL
   */
  tMapKey: mapConfig.tMapKey || "",
  website: "https://www.pickmall.cn", //官网地址
  aMapSwitch:false, //是否开启高德定位
  enableCDN: true, //生产环境 是否启用cdn加载 vue等js
  port: 10002, //端口
  inputMaxLength: "140", //全局输入框默认最大输入长度字
  /**
   * 如需更换主题请修改此处以及theme.less中修改
   */
  mainColor: "#ff5c58", //主题色
  setting: {
    isUseTabsRouter: false, // 商家后台固定关闭多标签页内嵌模式，详情使用新页面展示。
  },
};

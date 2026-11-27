var BASE = {
  /**
   * @description api请求基础路径
   */
  API_DEV: {
    manager: "http://127.0.0.1:8887",
  },
  API_PROD: {
    manager: "https://admin-api.pickmall.cn"
  },
  /**
   * @description // 跳转买家端地址 pc端
   */
  PC_URL: "https://pc-b2b2c.pickmall.cn",
  /**
   * @description  // 跳转买家端地址 wap端
   */
  WAP_URL: "https://m-b2b2c.pickmall.cn",
  /**
   *  @description api请求基础路径前缀
   */
  PREFIX: "/manager",
  /**
   * @description 第三方地图 Key（部署时填写，不要写进 src/）
   * 高德：https://lbs.amap.com/api/javascript-api/guide/abc/prepare
   * 腾讯位置服务：https://lbs.qq.com/webApi/javascriptGL/glGuide/glOverview
   * 留空则地图相关功能不可用，但不会影响其它功能。
   */
  MAP: {
    aMapKey: "",
    aMapSecurityJsCode: "",
    tMapKey: "",
  },
  };

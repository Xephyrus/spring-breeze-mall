var BASE = {
  /**
   * @description api请求基础路径
   */
  API_DEV: {
    buyer: "http://127.0.0.1:8888",
  },
  API_PROD: {
    buyer: "https://buyer-api.pickmall.cn",
  },
  /**
   * @description 第三方地图 Key（部署时填写，不要写进 src/）
   * 高德：https://lbs.amap.com/api/javascript-api/guide/abc/prepare
   * 留空则地图相关功能不可用，但不会影响其它功能。
   */
  MAP: {
    aMapKey: "",
    aMapSecurityJsCode: "",
  },
};

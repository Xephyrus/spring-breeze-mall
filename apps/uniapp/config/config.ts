const name = "lilishop"; //全局商城name
const schemeName = "lilishop"; //唤醒app需要的schemeName

/**
 * IM 地址：**开发构建**（H5 与微信小程序）走本地，其余（App / 发行构建）走生产。
 *
 * 为什么不用 `#ifdef H5` 写两份常量：条件编译在**构建期**才裁剪，而 ESLint / 编辑器看到的是
 * 两份重复声明，会被 `no-useless-assignment` 判成「赋值了但没用到」。
 *
 * 判断依据：
 * - `NODE_ENV`：`运行` 是 development、`发行` 是 production —— 发行包一律走生产；
 * - `UNI_PLATFORM`：HBuilderX 编译期注入（h5 / mp-weixin / app-plus 等）。
 *   App 真机上 `127.0.0.1` 指向手机自身，开发期也走生产；
 *   微信开发者工具与后端同机，`127.0.0.1` 可达，所以小程序开发构建走本地。
 *   取不到平台时按 h5 处理，仍有 NODE_ENV 兜底。
 */
const PLATFORM = process.env.UNI_PLATFORM || "h5";
const IS_DEV_LOCAL = process.env.NODE_ENV === "development" && PLATFORM !== "app-plus";

const imWebSrc = IS_DEV_LOCAL ? "http://localhost:8000" : "https://im.pickmall.cn";
const baseWsUrl = IS_DEV_LOCAL
  ? "ws://127.0.0.1:8885/lili/webSocket"
  : "wss://im-api.pickmall.cn/lili/webSocket";

export default {
  name: name,
  schemeLink: `${schemeName}://`, //唤起app地址
  downloadLink: "https://pickmall.cn/download-page/index.html", //下载地址，下载app的地址
  shareLink: "https://m-b2b2c.pickmall.cn", //分享地址，也就是在h5中默认的复制地址
  appid: "wx6f10f29075dc1b0b", //小程序唯一凭证，即 AppID，可在「微信公众平台 - 设置 - 开发设置」页中获得。（需要已经成为开发者，且帐号没有异常状态）
  aMapKey: "1f78544934b66c9fbc0104117f663973", //在高德中申请Web服务key
  scanAuthNavigation: ["https://m-b2b2c.pickmall.cn/"], //扫码认证跳转域名配置 会根据此处配置的路由进行跳转
  iosAppId: "id1564638363", //AppStore的应用地址id 具体在分享->拷贝链接中查看
  logo: "https://lilishop-oss.oss-cn-beijing.aliyuncs.com/4c864e133c2944efad1f7282ac8a3b9e.png", //logo地址
  customerServiceMobile: "13161366885", //客服电话
  customerServiceEmail: "lili@lili.com", //客服邮箱
  imWebSrc: imWebSrc, //IM 页面地址（H5 走本地 8000）
  baseWsUrl: baseWsUrl, // IM WS 地址（H5 走本地 8885）
  enableGetClipboard: false, //是否启用粘贴板获取 scanAuthNavigation 中的链接，如果匹配则会跳转到对应页面
  enableMiniBarStartUpApp: false, //是否在h5中右侧浮空按钮点击启动app
  /**
   * 如需更换主题请修改此处以及uni.scss中的全局颜色
   */
  mainColor: "#ff3c2a", // 主题色
  lightColor: "#ff6b35", // 高亮主题色
  aiderLightColor: "#ff9f28", // 辅助高亮颜色
  defaultUserPhoto: "/static/missing-face.png", // 默认用户头像
  enableFetchMobileLogin: false // 是否启用获取手机号登录 如果微信小程序提示封禁手机号获取权限 可将此选项设置成false作为备用登录方案
};

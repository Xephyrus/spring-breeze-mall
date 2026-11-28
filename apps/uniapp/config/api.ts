/**
 * 后端地址配置。
 *
 * ## 当前状态：只有本地环境
 * 项目还没搭生产环境，`prod` 段是**占位**（上游示例域名，不可直接用）。
 * 部署时把 `prod` 整段换成自己的域名即可，其余代码不用动。
 *
 * ## 开发环境
 * 改 `DEV_HOST` 一处即可：
 * - H5 / 微信开发者工具：保持 `127.0.0.1`（与后端同机）
 * - App 真机调试：改成电脑的局域网 IP（如 `192.168.1.5`），
 *   否则 `127.0.0.1` 在手机上指向手机自身，连不上电脑
 *
 * 端口对应：buyer-api 8888、manager-api 8887、im-api 8885。
 * 浏览器直连远端会被 CORS 拦掉（远端不认 localhost 这个 Origin），所以开发期一律指本地。
 */

/** 开发期后端所在主机：H5 / 小程序用 127.0.0.1，App 真机改成局域网 IP */
export const DEV_HOST = "127.0.0.1";

// 开发环境
const dev = {
  buyer: `http://${DEV_HOST}:8888`,
  store: `http://${DEV_HOST}:8887`,
  im: `http://${DEV_HOST}:8885`,
  // MQTT 是独立服务（本地没有 broker），生产环境搭建前先沿用上游实例
  mqtt: "wss://lilishop-mqtt-pull.dllll.xyz/mqtt",
};

// 生产环境（⚠️ 占位：尚未部署，部署时替换成自己的域名）
const prod = {
  buyer: "https://buyer-api.pickmall.cn",
  store: "https://admin-api.pickmall.cn",
  im: "https://im-api.pickmall.cn",
  mqtt: "wss://lilishop-mqtt-pull.dllll.xyz/mqtt",
};

/**
 * 由构建模式决定：
 * - `运行`（NODE_ENV=development）→ 本地
 * - `发行`（NODE_ENV=production）→ prod 段
 *
 * 不再按平台强制生产：项目还没有生产环境，App 真机开发期也走本地
 * （配合把 `DEV_HOST` 改成局域网 IP）。
 */
let api = process.env.NODE_ENV === "development" ? dev : prod;

const buyerHost = api.buyer;
const storeHost = api.store;
api.buyer = buyerHost + "/buyer";
api.store = storeHost + "/store";
api.im = api.im + "/im";

export default {
  ...api,
  buyerHost,
  storeHost,
};

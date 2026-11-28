/**
 * buyer : 买家 API（baseURL 为 buyer + /buyer）
 * store : 商家 API（baseURL 为 store + /store）
 *
 * 开发环境指向本地后端：
 * - H5 dev（HBuilderX 起的 5173）如果指到远端域名，浏览器会因 CORS 直接拦掉
 *   （远端不认 localhost 这个 Origin），控制台一串 ERR_FAILED。
 * - 小程序 / App 打包由下面的条件编译强制走 prod，不受影响。
 *
 * 端口对应：buyer-api 8888、manager-api 8887、im-api 8885。
 * 如果你的后端不在本机，改这三个地址即可（或在本段下面加 h5.devServer.proxy 走代理）。
 */
// 开发环境
const dev = {
  buyer: "http://127.0.0.1:8888",
  store: "http://127.0.0.1:8887",
  im: "http://127.0.0.1:8885",
  // MQTT 是独立服务，本地没有对应 broker 时保持远端
  mqtt: "wss://lilishop-mqtt-pull.dllll.xyz/mqtt",
};
// 生产环境
const prod = {
  buyer: "https://buyer-api.pickmall.cn",
  store: "https://admin-api.pickmall.cn",
  im: "https://im-api.pickmall.cn",
  mqtt: "wss://lilishop-mqtt-pull.dllll.xyz/mqtt",
};

let api = dev;
if (process.env.NODE_ENV == "development") {
  api = dev;
} else {
  api = prod;
}
/**
 * App 端（真机）开发期也走生产地址：
 * `dev` 段是 127.0.0.1，在手机上指向手机自身，连不上电脑上的后端。
 * 若要在真机上连本地后端，把 dev 段改成局域网 IP（如 http://192.168.1.5:8888）
 * 并删掉下面这段强制生产。
 *
 * 微信小程序不在此列：开发者工具与后端同机，`127.0.0.1` 可达，
 * 只需在开发者工具勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」。
 */
// #ifdef APP-PLUS
api = prod;
// #endif

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

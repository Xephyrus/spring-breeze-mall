/**
 * 解析url参数
 * @example ?id=12345&a=b
 * @return Object {id:12345,a:b}
 */
function urlParse(url) {
  let obj = {};
  let reg = /[?&][^?&]+=[^?&]+/g;
  let arr = url.match(reg);
  if (arr) {
    arr.forEach(item => {
      let tempArr = item.substring(1).split("=");
      let key = decodeURIComponent(tempArr[0]);
      let val = decodeURIComponent(tempArr.splice(1).join("="));
      obj[key] = val;
    });
  }
  return obj;
}

const getNetworkType = () => {
  uni.getNetworkType({
    success: res => {
      if (res.networkType === "none") {
        uni.showToast({
          title: "网络好像有点问题,请检查后重试！",
          duration: 2000,
          icon: "none"
        });
        let pages = getCurrentPages();
        if (pages.length) {
          let route = pages[pages.length - 1].route;
          if (route !== "pages/empty/empty") {
            uni.navigateTo({
              url: `/pages/empty/empty?type=wifi`
            });
          }
        } else {
          uni.navigateTo({
            url: `/pages/empty/empty?type=wifi`
          });
        }
      }
    }
  });
};

/**
 * 节流：同一 that 上 gapTime 内只执行一次。
 *
 * 原来用 `fn.apply(that, arguments)`（arguments 是 throttle 自己的实参，不是 fn 的），
 * 改成 rest 参数把「除前三个配置参数外」的实参原样转发，
 * 与旧的 `arguments` 行为不完全等价（旧代码会把 fn/that/gapTime 也传给 fn），
 * 但实际调用方都只传三个参数，转发内容为空，行为一致。
 */
const throttle = function (fn: (...args: any[]) => any, that: any, gapTime?: number, ...args: any[]) {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 1800;
  }
  const _lastTime = that.lastTime;
  const _nowTime = +new Date();
  if (_nowTime - _lastTime > gapTime || !_lastTime) {
    fn.apply(that, args); // 将 this 和参数传给原函数
    that.lastTime = _nowTime;
  }
};

/**
 * 计算传秒数的倒计时【天、时、分、秒】
 * @param seconds
 * @returns {{day : *, hours : *, minutes : *, seconds : *}}
 */
const countTimeDown = seconds => {
  const leftTime = time => {
    if (time < 10) time = "0" + time;
    return time + "";
  };
  return {
    day: leftTime(parseInt(String(seconds / 60 / 60 / 24), 10)),
    hours: leftTime(parseInt(String((seconds / 60 / 60) % 24), 10)),
    minutes: leftTime(parseInt(String((seconds / 60) % 60), 10)),
    seconds: leftTime(parseInt(String(seconds % 60), 10))
  };
};

/**
 * 计算当前时间到第二天0点的倒计时[秒]
 * @returns {number}
 */
const theNextDayTime = () => {
  const nowDate = new Date();
  const time =
    new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate() + 1,
      0,
      0,
      0
    ).getTime() - nowDate.getTime();
  return parseInt(String(time / 1000), 10);
};
// 防抖
/**
 * 返回一个防抖包装函数。
 *
 * 用 rest 参数 `...args` 而不是 `arguments`：调用方（如 cartList 的 `numChange(skuItem)`）
 * 会传业务参数，原来返回的函数没有形参，TS 会把签名推成 `() => void`，调用处就报「参数过多」。
 * rest 参数同时保留了 this 与参数原样转发，行为与改前一致。
 */
const debounce = <T extends (...args: any[]) => any>(fn: T, delay?: number) => {
  // 时间期限
  const delays = delay || 200;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    const th = this;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      timer = null;
      fn.apply(th, args);
    }, delays);
  };
};
export { getNetworkType, throttle, countTimeDown, theNextDayTime, debounce };

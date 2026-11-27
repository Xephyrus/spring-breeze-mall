import { logout, logoffConfirm } from "@/api/login";
import { getUserInfo } from "@/api/members";
import storage from "@/utils/storage";
import config from "@/config/config";
import Foundation from "./Foundation";
import store from "@/store";
import { h5Copy } from "@/js_sdk/h5-copy/h5-copy.js";

/**
 * 通用过滤器 / 页面小工具。
 *
 * 由 `filters.js` 就地补类型而来：函数体逻辑保持原样，
 * 只是把「调用方经常省略的参数」标成可选（原来 JS 里没有形参个数约束，
 * 接上 typecheck 后会报 87 处 TS2554）。
 */

/** 时间类入参：后端可能给秒级时间戳、字符串或 Date */
export type TimeLike = string | number | Date;

function getMainColor(): string {
  return store.getters.mainColor || config.mainColor;
}

/** 解析商品图片地址，兼容上传 JSON 与纯 URL，非法时返回占位图 */
export function parseGoodsImageUrl(item: unknown, fallback: string = config.logo): string {
  const url = Foundation.parseGoodsImageUrl(item);
  return url || fallback || "";
}

/**
 * 金钱单位置换  2999 --> 2,999.00
 *
 * @param val 金额
 * @param unit 单位前缀（如 ¥）
 * @param location before: 只取整数部分；after: 只取小数部分
 */
export function unitPrice(
  val?: number | string | null,
  unit?: string,
  location?: "before" | "after" | string
): string {
  if (!val) val = 0;
  const price = Foundation.formatPrice(val);
  if (location === "before") {
    return price.substr(0, price.length - 3);
  }
  if (location === "after") {
    return price.substr(-2);
  }
  return (unit || "") + price;
}

/** 格式化价格  1999 --> ["1999","00"] */
export function goodsFormatPrice(val?: number | string | null): string[] | undefined | null {
  if (typeof val === "undefined") {
    return val;
  }
  const valNum = new Number(val);
  return valNum.toFixed(2).split(".");
}

/** 将内容复制到粘贴板 */
export function setClipboard(val?: string | number | null): void {
  // #ifdef H5
  if (val === null || val === undefined) {
    val = "";
  } else val = val + "";
  const result = h5Copy(val);
  if (result === false) {
    uni.showToast({
      title: "不支持",
    });
  } else {
    uni.showToast({
      title: "复制成功",
      icon: "none",
    });
  }
  // #endif

  // #ifndef H5
  const text = val == null ? "" : String(val);
  const clipboard = typeof wx !== "undefined" && wx.setClipboardData ? wx : uni;
  clipboard.setClipboardData({
    data: text,
    success: function () {
      uni.showToast({
        title: "复制成功",
        duration: 2000,
        icon: "none",
      });
    },
    fail: function () {
      uni.showToast({
        title: "复制失败，请重试",
        icon: "none",
      });
    },
  });
  // #endif
}

/** 拨打电话 */
export function callPhone(phoneNumber: string): void {
  uni.makePhoneCall({
    phoneNumber: phoneNumber,
  });
}

/** 脱敏姓名 */
export function noPassByName(str?: string | null): string {
  if (null != str && str != undefined) {
    if (str.length <= 3) {
      return "*" + str.substring(1, str.length);
    } else if (str.length > 3 && str.length <= 6) {
      return "**" + str.substring(2, str.length);
    } else if (str.length > 6) {
      return str.substring(0, 2) + "****" + str.substring(6, str.length);
    }
  }
  return "";
}

/** 处理 unix 时间戳（秒），转换为可阅读时间格式 */
export function unixToDate(unix: number, format?: string): string {
  let _format = format || "yyyy-MM-dd hh:mm:ss";
  const d = new Date(unix * 1000);
  const o: Record<string, number> = {
    "M+": d.getMonth() + 1,
    "d+": d.getDate(),
    "h+": d.getHours(),
    "m+": d.getMinutes(),
    "s+": d.getSeconds(),
    "q+": Math.floor((d.getMonth() + 3) / 3),
    S: d.getMilliseconds(),
  };
  if (/(y+)/.test(_format)) {
    _format = _format.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp("(" + k + ")").test(_format)) {
      _format = _format.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? String(o[k]) : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return _format;
}

/** 人性化显示时间 */
export function beautifyTime(datetime: TimeLike | string = ""): string {
  if (datetime == null || datetime == undefined || !datetime) {
    return "";
  }
  const text = timestampToTime(datetime).replace(/-/g, "/");

  const time = new Date();
  let outTime = new Date(text);
  if (/^[1-9]\d*$/.test(text)) {
    outTime = new Date(parseInt(text) * 1000);
  }

  if (time.getTime() < outTime.getTime()) {
    return parseTime(outTime, "{y}/{m}/{d}") as string;
  }

  if (time.getFullYear() != outTime.getFullYear()) {
    return parseTime(outTime, "{y}/{m}/{d}") as string;
  }

  if (time.getMonth() != outTime.getMonth()) {
    return parseTime(outTime, "{m}/{d}") as string;
  }

  if (time.getDate() != outTime.getDate()) {
    const day = outTime.getDate() - time.getDate();
    if (day == -1) {
      return parseTime(outTime, "昨天 {h}:{i}") as string;
    }

    if (day == -2) {
      return parseTime(outTime, "前天 {h}:{i}") as string;
    }

    return parseTime(outTime, "{m}-{d}") as string;
  }

  if (time.getHours() != outTime.getHours()) {
    return parseTime(outTime, "{h}:{i}") as string;
  }

  let minutes = outTime.getMinutes() - time.getMinutes();
  if (minutes == 0) {
    return "刚刚";
  }

  minutes = Math.abs(minutes);
  return `${minutes}分钟前`;
}

/** 时间转换（时间戳转 yyyy-MM-dd hh:mm:ss 字符串） */
function timestampToTime(timestamp: TimeLike | string): string {
  const date = new Date(timestamp as string | number); // 10 位需 *1000，13 位不用
  const Y = date.getFullYear() + "-";
  const M =
    (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "-";
  const D = date.getDate() + " ";
  const h = date.getHours() + ":";
  const m = date.getMinutes() + ":";
  const s = date.getSeconds();
  return Y + M + D + h + m + s;
}

/** 13888888888 -> 138****8888 */
export function secrecyMobile(mobile: string | number): string {
  const text = String(mobile);
  if (!/\d{11}/.test(text)) {
    return text;
  }
  return text.replace(/(\d{3})(\d{4})(\d{4})/, "$1****$3");
}

/** 人性化时间显示（到分钟级） */
export function formatTime(datetime: string): string {
  if (datetime == null) return "";

  const text = datetime.replace(/-/g, "/");

  const time = new Date();
  let outTime = new Date(text);
  if (/^[1-9]\d*$/.test(text)) {
    outTime = new Date(parseInt(text) * 1000);
  }

  if (time.getTime() < outTime.getTime() || time.getFullYear() != outTime.getFullYear()) {
    return parseTime(outTime, "{y}-{m}-{d} {h}:{i}") as string;
  }

  if (time.getMonth() != outTime.getMonth()) {
    return parseTime(outTime, "{m}-{d} {h}:{i}") as string;
  }

  if (time.getDate() != outTime.getDate()) {
    const day = outTime.getDate() - time.getDate();
    if (day == -1) {
      return parseTime(outTime, "昨天 {h}:{i}") as string;
    }

    if (day == -2) {
      return parseTime(outTime, "前天 {h}:{i}") as string;
    }

    return parseTime(outTime, "{m}-{d} {h}:{i}") as string;
  }

  if (time.getHours() != outTime.getHours()) {
    return parseTime(outTime, "{h}:{i}") as string;
  }

  let minutes = outTime.getMinutes() - time.getMinutes();
  if (minutes == 0) {
    return "刚刚";
  }

  minutes = Math.abs(minutes);
  return `${minutes}分钟前`;
}

/** 时间格式化方法（无参调用返回 null，保持原 `arguments.length` 语义） */
export function parseTime(time?: TimeLike | null, cFormat?: string): string | null {
  if (arguments.length === 0) {
    return null;
  }

  let date: Date;
  const format = cFormat || "{y}-{m}-{d} {h}:{i}:{s}";

  if (typeof time === "object") {
    date = time as Date;
  } else {
    let value = time as string | number;
    if (typeof value === "string" && /^[0-9]+$/.test(value)) {
      value = parseInt(value);
    }
    if (typeof value === "number" && value.toString().length === 10) {
      value = value * 1000;
      console.log("时间判断为number");
    }

    date = new Date(String(value).replace(/-/g, "/"));
  }

  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
  };

  return format.replace(/{([ymdhisa])+}/g, (result, key) => {
    const value = formatObj[key];
    // Note: getDay() returns 0 on Sunday
    if (key === "a") {
      return ["日", "一", "二", "三", "四", "五", "六"][value];
    }

    return value.toString().padStart(2, "0");
  });
}

/** 清除字符串里的所有逗号 */
export function clearStrComma(str: string): string {
  return str.replace(/,/g, "");
}

/** 缓存里的用户信息（字段按需取用） */
export interface UserInfoLike {
  id?: string | number;
  [key: string]: any;
}

/**
 * 判断用户是否登录
 *
 * 用重载而不是 `boolean | unknown`：后者会让所有 `isLogin()?.id` 退化成 unknown，
 * 调用处就得逐个 as（my.vue / goods.vue 就这么被顶出 4 个错误）。
 */
export function isLogin(val: "auth"): boolean;
export function isLogin(val?: string): UserInfoLike;
export function isLogin(val?: string): boolean | UserInfoLike {
  const userInfo = storage.getUserInfo();
  if (val == "auth") {
    return userInfo && userInfo.id ? true : false;
  }
  return storage.getUserInfo() as UserInfoLike;
}

/** 退出登录 */
export function quiteLoginOut(): void {
  uni.showModal({
    title: "提示",
    content: "是否退出登录？",
    confirmColor: getMainColor(),
    async success(res) {
      if (res.confirm) {
        storage.setAccessToken("");
        storage.setRefreshToken("");
        storage.setUserInfo({});
        storage.setHasLogin(false);
        navigateToLogin("redirectTo");
        await logout();
      }
    },
  });
}

/** 用户注销 */
export function logoff(): void {
  uni.showModal({
    title: "提示",
    content: "确认注销用户么？注销用户将无法再次登录并失去当前数据。",
    confirmColor: getMainColor(),
    async success(res) {
      if (res.confirm) {
        await logoffConfirm();
        storage.setAccessToken("");
        storage.setRefreshToken("");
        storage.setUserInfo({});
        navigateToLogin("redirectTo");
      }
    },
  });
}

/** 跳转 im（客服会话） */
export function talkIm(
  storeId: string | number,
  goodsId?: string | number,
  id?: string | number
): void {
  if (isLogin("auth")) {
    let url = `/pages/mine/im/index?userId=${storeId}`;
    if (goodsId && id) url = `/pages/mine/im/index?userId=${storeId}&goodsid=${goodsId}&skuid=${id}`;
    uni.navigateTo({
      url,
    });
  } else {
    tipsToLogin();
  }
}

/** 未登录提示（传 "normal" 时取消后不返回上一页） */
export function tipsToLogin(type?: string): boolean {
  if (!isLogin("auth")) {
    uni.showModal({
      title: "提示",
      content: "当前用户未登录是否登录？",
      confirmText: "确定",
      cancelText: "取消",
      confirmColor: getMainColor(),
      success: (res) => {
        if (res.confirm) {
          navigateToLogin();
        } else if (res.cancel) {
          if (type !== "normal") {
            uni.navigateBack();
          }
        }
      },
    });
    return false;
  }
  return true;
}

/** 获取用户信息并重新写入缓存 */
export async function refreshUserInfo(): Promise<unknown> {
  const res = await getUserInfo();
  if (res.data.success) {
    storage.setUserInfo(res.data.result);
    return res.data.result;
  }
}

/** 验证是否登录，未登录则跳登录页 */
export function forceLogin(): void {
  const userInfo = storage.getUserInfo();
  if (!userInfo || !userInfo.id) {
    // #ifdef MP-WEIXIN

    uni.navigateTo({
      url: "/pages/passport/wechatMPLogin",
    });

    // #endif

    // #ifndef MP-WEIXIN

    uni.navigateTo({
      url: "/pages/passport/login",
    });

    //  #endif
  }
}

/** 获取当前页面对象（val 为真时返回 page 实例，否则返回 route） */
export function getPages(val?: boolean): Page.PageInstance | string {
  const pages = getCurrentPages(); // 获取加载的页面
  const currentPage = pages[pages.length - 1]; // 获取当前页面的对象
  const url = currentPage.route; // 当前页面 url

  return val ? currentPage : url;
}

/** 跳转到登录页面 */
export function navigateToLogin(type: "navigateTo" | "redirectTo" = "navigateTo"): void {
  /**
   * 此处进行条件编译判断
   * 微信小程序跳转到微信小程序登录页面
   * H5/App 跳转到普通登录页面
   */
  let url = "/pages/passport/login";
  // #ifdef MP-WEIXIN
  url = "/pages/passport/wechatMPLogin";
  // #endif

  if (type === "redirectTo") {
    uni.redirectTo({ url });
  } else {
    uni.navigateTo({ url });
  }
}

/** 售后状态文案 */
export function serviceStatusList(val: string): string {
  const statusList: Record<string, string> = {
    APPLY: "申请售后",
    PASS: "通过售后",
    REFUSE: "拒绝售后",
    BUYER_RETURN: "买家退货，待卖家收货",
    SELLER_RE_DELIVERY: "商家换货/补发",
    SELLER_CONFIRM: "卖家确认收货",
    SELLER_TERMINATION: "卖家终止售后",
    BUYER_CONFIRM: "买家确认收货",
    BUYER_CANCEL: "买家取消售后",
    WAIT_REFUND: "等待平台退款",
    COMPLETE: "完成售后",
  };
  return statusList[val];
}

/** 格式化商品规格展示（兼容 SKU JSON 与纯文本） */
export function formatGoodsSpecs(specs?: unknown): string {
  if (specs === null || specs === undefined) {
    return "默认";
  }
  const trimmed = String(specs).trim();
  if (!trimmed) {
    return "默认";
  }
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }
  try {
    const data = JSON.parse(trimmed);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return trimmed;
    }
    const parts: string[] = [];
    Object.keys(data).forEach((key) => {
      if (key === "images") {
        return;
      }
      const value = (data as Record<string, unknown>)[key];
      if (value === null || value === undefined || value === "") {
        return;
      }
      if (typeof value === "object") {
        return;
      }
      const text = String(value).trim();
      if (text) {
        parts.push(text);
      }
    });
    return parts.length ? parts.join(" ") : "默认";
  } catch (e) {
    return "默认";
  }
}

/** 订单状态文案 */
export function orderStatusList(val: string): string {
  const map: Record<string, string> = {
    UNDELIVERED: "待发货",
    UNPAID: "未付款",
    PAID: "已付款",
    PARTS_DELIVERED: "部分发货",
    DELIVERED: "已发货",
    CANCELLED: "已取消",
    COMPLETED: "已完成",
    COMPLETE: "已完成",
    TAKE: "待核验",
    STAY_PICKED_UP: "待自提",
  };
  return map[val];
}

/** 商品列表/详情的单价展示（单品立减用服务端活动价） */
export function goodsDisplayPrice(
  goods?: { promotionMap?: Record<string, unknown>; promotionPrice?: number | string; price?: number | string },
  promotions: Record<string, unknown> | undefined = goods?.promotionMap
): number | string | undefined {
  const hasSingle =
    promotions && Object.keys(promotions).some((key) => key.startsWith("SINGLE_REDUCTION-"));
  return hasSingle && Number(goods?.promotionPrice) > 0 ? goods?.promotionPrice : goods?.price;
}

/** 公共方法类 */
import { getToken } from "@/utils/auth";
import config from "@/config/config";

/**
 * 人性化时间显示
 *
 * @param datetime 后端返回的时间字符串（`2024-01-01 10:00:00`）或秒级时间戳
 */
export function formatTime(datetime?: string | number | null): string {
  if (datetime == null) return "";

  const text = String(datetime).replace(/-/g, "/");

  const time = new Date();
  let outTime = new Date(text);
  if (/^[1-9]\d*$/.test(text)) {
    outTime = new Date(parseInt(text) * 1000);
  }

  if (time.getTime() < outTime.getTime() || time.getFullYear() !== outTime.getFullYear()) {
    return parseTime(outTime, "{y}-{m}-{d} {h}:{i}") as string;
  }

  if (time.getMonth() !== outTime.getMonth()) {
    return parseTime(outTime, "{m}-{d} {h}:{i}") as string;
  }

  if (time.getDate() !== outTime.getDate()) {
    const day = outTime.getDate() - time.getDate();
    if (day === -1) {
      return parseTime(outTime, "昨天 {h}:{i}") as string;
    }

    if (day === -2) {
      return parseTime(outTime, "前天 {h}:{i}") as string;
    }

    return parseTime(outTime, "{m}-{d} {h}:{i}") as string;
  }

  if (time.getHours() !== outTime.getHours()) {
    return parseTime(outTime, "{h}:{i}") as string;
  }

  let minutes = outTime.getMinutes() - time.getMinutes();
  if (minutes === 0) {
    return "刚刚";
  }

  minutes = Math.abs(minutes);
  return `${minutes}分钟前`;
}

/**
 * 格式化文件大小
 *
 * @param value 文件大小（字节）
 */
export function formatSize(value?: string | number | null): string {
  if (null == value || value === "") {
    return "0";
  }
  const unitArr = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const srcsize = parseFloat(String(value));
  const index = Math.floor(Math.log(srcsize) / Math.log(1024));
  let size = srcsize / Math.pow(1024, index);
  size = parseFloat(size.toFixed(2)); // 保留的小数位数
  return size + unitArr[index];
}

/** 获取文件后缀名 */
export function getFileExt(fileName: string): string {
  const ext = fileName.split(".");
  return ext[ext.length - 1];
}

/** 根据图片 url 下载图片 */
export function downloadIamge(imgsrc: string, name?: string): void {
  const image = new Image();
  // 解决跨域 Canvas 污染问题
  image.setAttribute("crossOrigin", "anonymous");
  image.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context?.drawImage(image, 0, 0, image.width, image.height);
    const url = canvas.toDataURL("image/png"); // 得到图片的 base64 编码数据
    const a = document.createElement("a"); // 生成一个 a 元素
    const event = new MouseEvent("click"); // 创建一个单击事件
    a.download = name || "photo"; // 设置图片名称
    a.href = url; // 将生成的 URL 设置为 a.href 属性
    a.dispatchEvent(event); // 触发 a 的单击事件
  };
  image.src = imgsrc;
}

/** 通过图片 url 获取图片大小（文件名里带 `_350x345` 这类尺寸后缀） */
export function getImageInfo(imgsrc: string): { width: number; height: number } {
  const data = {
    width: 0,
    height: 0,
  };

  const arr = imgsrc.split("_");
  if (arr.length === 1) return data;

  const info = arr[arr.length - 1].match(/\d+x\d+/g);
  if (info == null) return data;

  const parts = info[0].split("x");
  return {
    width: parseInt(parts[0]),
    height: parseInt(parts[1]),
  };
}

/** 文件下载 */
export function download(cr_id: string | number): void {
  const api = config.BASE_API_URL;
  const token = getToken();
  try {
    const link = document.createElement("a");
    link.href = `${api}/download/user-chat-file?cr_id=${cr_id}&token=${token}`;
    link.click();
  } catch {
    // ignore download trigger failures
  }
}

/**
 * 时间格式化方法
 *
 * @param time  Date / 字符串 / 数字时间戳
 * @param cFormat 形如 `{y}-{m}-{d} {h}:{i}:{s}` 的模板
 */
export function parseTime(
  time?: Date | string | number | null,
  cFormat?: string
): string | null {
  if (time === undefined) {
    return null;
  }

  const format = cFormat || "{y}-{m}-{d} {h}:{i}:{s}";
  let date: Date;

  if (time instanceof Date) {
    date = time;
  } else {
    // time 已排除 undefined，这里只剩 string | number（null 走 instanceof 分支）
    let value: string | number = time as string | number;
    if (typeof value === "string" && /^[0-9]+$/.test(value)) {
      value = parseInt(value);
    }
    if (typeof value === "number" && value.toString().length === 10) {
      value = value * 1000;
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

  return format.replace(/{([ymdhisa])+}/g, (result: string, key: string) => {
    const value = formatObj[key];
    // Note: getDay() returns 0 on Sunday
    if (key === "a") {
      return ["日", "一", "二", "三", "四", "五", "六"][value];
    }

    return value.toString().padStart(2, "0");
  });
}

/**
 * 去除字符串首尾空白
 *
 * 注意：保留上游行为 —— type 为真值时去掉首尾，否则只去掉尾部（原实现的 `type == "l"`
 * 分支实际不可达，这里按真实行为实现并在注释中标注）。
 */
export function trim(str: string, type?: string | null): string {
  if (type) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
  }
  return str.replace(/(\s*$)/g, "");
}

/** 解析 url 中的 query 参数 */
export function param2Obj(url: string): Record<string, string> {
  const search = url.split("?")[1];

  if (!search) return {};

  return JSON.parse(
    '{"' +
      decodeURIComponent(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"')
        .replace(/\+/g, " ") +
      '"}'
  ) as Record<string, string>;
}

/** 对象序列化为 query string */
export function param(json?: Record<string, unknown> | null): string {
  if (!json) return "";
  return cleanArray(
    Object.keys(json).map((key) => {
      if (json[key] === undefined) return "";

      return encodeURIComponent(key) + "=" + encodeURIComponent(String(json[key]));
    })
  ).join("&");
}

/** 过滤数组中的空值 */
export function cleanArray(actual: Array<string | number | null | undefined>): string[] {
  const newArray: string[] = [];
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(String(actual[i]));
    }
  }

  return newArray;
}

/** 切换元素的 class */
export function toggleClass(element: HTMLElement, className: string): void {
  if (!element || !className) {
    return;
  }

  let classString = element.className;
  const nameIndex = classString.indexOf(className);
  if (nameIndex === -1) {
    classString += "" + className;
  } else {
    classString =
      classString.substr(0, nameIndex) + classString.substr(nameIndex + className.length);
  }
  element.className = classString;
}

/** 判断元素是否含有某个 class */
export function hasClass(ele: HTMLElement, cls: string): boolean {
  return !!ele.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
}

/** 给元素添加 class */
export function addClass(ele: HTMLElement, cls: string): void {
  if (!hasClass(ele, cls)) ele.className += " " + cls;
}

/** 移除元素的 class */
export function removeClass(ele: HTMLElement, cls: string): void {
  if (hasClass(ele, cls)) {
    const reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
    ele.className = ele.className.replace(reg, " ");
  }
}

/** 通过图片 Url 获取等比例缩放后的宽高 */
export function imgZoom(src: string, width = 200): { width: string; height: string } {
  const info = getImageInfo(src);

  if (info.width < width) {
    return {
      width: `${info.width}px`,
      height: `${info.height}px`,
    };
  }

  return {
    width: width + "px",
    height: parseInt(String(info.height / (info.width / width))) + "px",
  };
}

/** 获取浏览器光标选中内容 */
export function getSelection(): string {
  if (window.getSelection) {
    return window.getSelection()?.toString() ?? "";
  }
  // 兼容极老的 IE（TS 的 DOM 类型里没有 document.selection）
  const legacy = document as Document & { selection?: { createRange(): { text: string } } };
  return legacy.selection?.createRange().text ?? "";
}

/**
 * 剪贴板复制
 *
 * 注意：原实现 catch 里写的是 `this.$message.error(...)`，模块作用域下 `this` 是 undefined，
 * 复制失败时会再抛一个 TypeError。这里改为 console 输出，避免二次异常。
 */
export const copyTextToClipboard = (value: string, callback?: () => void): void => {
  const textArea = document.createElement("textarea");
  textArea.style.background = "transparent";
  textArea.value = value;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    document.execCommand("copy");
    if (callback) callback();
  } catch {
    console.error("Oops, unable to copy");
  }

  document.body.removeChild(textArea);
};

/** 隐藏手机号中间四位 */
export function hidePhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

/** 根据名字生成稳定的头像底色（本地首字头像用，替代 dicebear 外链） */
export function avatarColor(name = ""): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360}, 55%, 55%)`;
}

/** 人性化显示时间（只到「天」级别） */
export function beautifyTime(datetime: string | number | null = ""): string {
  if (datetime == null) {
    return "";
  }

  const text = String(datetime).replace(/-/g, "/");

  const time = new Date();
  let outTime = new Date(text);
  if (/^[1-9]\d*$/.test(text)) {
    outTime = new Date(parseInt(text) * 1000);
  }

  if (time.getTime() < outTime.getTime()) {
    return parseTime(outTime, "{y}-{m}-{d}") as string;
  }

  if (time.getFullYear() !== outTime.getFullYear()) {
    return parseTime(outTime, "{y}-{m}-{d}") as string;
  }

  if (time.getMonth() !== outTime.getMonth()) {
    return parseTime(outTime, "{m}-{d}") as string;
  }

  if (time.getDate() !== outTime.getDate()) {
    const day = outTime.getDate() - time.getDate();
    if (day === -1) {
      return parseTime(outTime, "昨天 {h}:{i}") as string;
    }

    if (day === -2) {
      return parseTime(outTime, "前天 {h}:{i}") as string;
    }

    return parseTime(outTime, "{m}-{d}") as string;
  }

  if (time.getHours() !== outTime.getHours()) {
    return parseTime(outTime, "{h}:{i}") as string;
  }

  let minutes = outTime.getMinutes() - time.getMinutes();
  if (minutes === 0) {
    return "刚刚";
  }

  minutes = Math.abs(minutes);
  return `${minutes}分钟前`;
}

/** 把布尔比较函数包装成 Array.prototype.sort 需要的 -1/0/1 比较器 */
export function getSort<T>(fn: (a: T, b: T) => boolean): (a: T, b: T) => number {
  return function (this: unknown, a: T, b: T): number {
    let ret = 0;

    if (fn.call(this, a, b)) {
      ret = -1;
    } else if (fn.call(this, b, a)) {
      ret = 1;
    }

    return ret;
  };
}

/** 批量排序：按顺序应用多个比较器，直到某个比较器返回非 0 */
export function getMutipSort<T>(arr: Array<(a: T, b: T) => number>): (a: T, b: T) => number {
  return function (a: T, b: T): number {
    let tmp = 0;
    let i = 0;

    do {
      tmp = arr[i++](a, b);
    } while (tmp === 0 && i < arr.length);

    return tmp;
  };
}

/** 把文本里的 URL 替换成超链接 */
export function textReplaceLink(text: string, color = "#409eff"): string {
  const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
  return text.replace(
    exp,
    `<a href='$1' target="_blank" style="color:${color};text-decoration: revert;">$1</a >`
  );
}

/** 防抖 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  wait: number,
  immediate?: boolean
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: A): void {
    if (timeout) clearTimeout(timeout); // timeout 不为 null
    if (immediate) {
      const callNow = !timeout; // 第一次会立即执行，以后只有事件执行后才会再次触发
      timeout = setTimeout(function () {
        timeout = null;
      }, wait);
      if (callNow) func.apply(this, args);
    } else {
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    }
  };
}

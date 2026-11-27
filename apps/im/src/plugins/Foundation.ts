/**
 * 一些常用的基础方法（货币格式化、手机号脱敏、倒计时等）。
 */

/** 验证银行卡号（Luhm 校验） */
export function checkBankno(bankno: string): boolean {
  const lastNum = bankno.substr(bankno.length - 1, 1); // 取出最后一位（与 luhm 比较）
  const first15Num = bankno.substr(0, bankno.length - 1); // 前 15 或 18 位
  const newArr: string[] = [];

  for (let i = first15Num.length - 1; i > -1; i--) {
    newArr.push(first15Num.substr(i, 1));
  }

  const arrJiShu: number[] = []; // 奇数位 *2 的积 <9
  const arrJiShu2: number[] = []; // 奇数位 *2 的积 >9
  const arrOuShu: string[] = []; // 偶数位数组
  for (let j = 0; j < newArr.length; j++) {
    if ((j + 1) % 2 === 1) {
      if (parseInt(newArr[j]) * 2 < 9) arrJiShu.push(parseInt(newArr[j]) * 2);
      else arrJiShu2.push(parseInt(newArr[j]) * 2);
    } else {
      arrOuShu.push(newArr[j]);
    }
  }

  const jishu_child1: number[] = []; // 奇数位 *2 >9 分割后的个位数
  const jishu_child2: number[] = []; // 奇数位 *2 >9 分割后的十位数
  for (let h = 0; h < arrJiShu2.length; h++) {
    jishu_child1.push(parseInt(String(arrJiShu2[h])) % 10);
    jishu_child2.push(parseInt(String(arrJiShu2[h])) / 10);
  }

  let sumJiShu = 0;
  let sumOuShu = 0;
  let sumJiShuChild1 = 0;
  let sumJiShuChild2 = 0;
  for (let m = 0; m < arrJiShu.length; m++) {
    sumJiShu = sumJiShu + parseInt(String(arrJiShu[m]));
  }
  for (let n = 0; n < arrOuShu.length; n++) {
    sumOuShu = sumOuShu + parseInt(arrOuShu[n]);
  }
  for (let p = 0; p < jishu_child1.length; p++) {
    sumJiShuChild1 = sumJiShuChild1 + parseInt(String(jishu_child1[p]));
    sumJiShuChild2 = sumJiShuChild2 + parseInt(String(jishu_child2[p]));
  }
  // 计算总和
  const sumTotal = sumJiShu + sumOuShu + sumJiShuChild1 + sumJiShuChild2;
  // 计算 Luhm 值
  const k = sumTotal % 10 === 0 ? 10 : sumTotal % 10;
  const luhm = 10 - k;
  return String(lastNum) === String(luhm);
}

/** 将 unix 时间戳（秒）转换为指定格式 */
export function unixToDate(unix?: number | null, format?: string): string | number | undefined {
  if (!unix) return unix ?? undefined;
  let _format = format || "yyyy-MM-dd hh:mm:ss";
  const d = new Date(unix);
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

/** 将时间字符串转成 unix 时间戳（秒） */
export function dateToUnix(date: string): number {
  let newStr = date.replace(/:/g, "-");
  newStr = newStr.replace(/ /g, "-");
  const arr = newStr.split("-");
  const datum = new Date(
    Date.UTC(
      Number(arr[0]),
      Number(arr[1]) - 1,
      Number(arr[2]),
      Number(arr[3]) - 8 || -8,
      Number(arr[4]) || 0,
      Number(arr[5]) || 0
    )
  );
  return parseInt(String(datum.getTime() / 1000));
}

/** 货币格式化：2999 → 2,999.00 */
export function formatPrice(price: number | string): string {
  if (typeof price !== "number") return String(price);
  return String(Number(price).toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 手机号隐私保护：隐藏中间四位 */
export function secrecyMobile(mobile: string | number): string {
  const text = String(mobile);
  if (!/\d{11}/.test(text)) {
    return text;
  }
  return text.replace(/(\d{3})(\d{4})(\d{4})/, "$1****$3");
}

/** 随机生成指定长度的字符串 */
export function randomString(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const maxPos = chars.length;
  let _string = "";
  for (let i = 0; i < length; i++) {
    _string += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return _string;
}

/** 计算秒数倒计时【天、时、分、秒】 */
export function countTimeDown(seconds: number): {
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const leftTime = (time: number): string => {
    let value: string | number = time;
    if (time < 10) value = "0" + time;
    return value + "";
  };
  return {
    day: leftTime(parseInt(String(seconds / 60 / 60 / 24), 10)),
    hours: leftTime(parseInt(String((seconds / 60 / 60) % 24), 10)),
    minutes: leftTime(parseInt(String((seconds / 60) % 60), 10)),
    seconds: leftTime(parseInt(String(seconds % 60), 10)),
  };
}

/** 计算当前时间到第二天 0 点的倒计时（秒） */
export function theNextDayTime(): number {
  const nowDate = new Date();
  const time =
    new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1, 0, 0, 0).getTime() -
    nowDate.getTime();
  return parseInt(String(time / 1000));
}

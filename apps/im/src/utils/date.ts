/**
 * 对 Date 的扩展，将 Date 转化为指定格式的 String。
 *
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 * 年(y) 可以用 1-4 个占位符，毫秒(S) 只能用 1 个占位符（是 1-3 位的数字）。
 *
 * 示例：
 *   formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss.S') ==> 2006-07-02 08:09:04.423
 *   formatDate(new Date(), 'yyyy-M-d h:m:s.S')      ==> 2006-7-2 8:9:4.18
 *   formatDate(new Date(), 'hh:mm:ss.S')            ==> 08:09:04.423
 */
export function formatDate(date: Date, fmt: string): string {
  const o: Record<string, number> = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }

  for (const k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      const value =
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length);
      fmt = fmt.replace(RegExp.$1, String(value));
    }
  }

  return fmt;
}

/**
 * 仿照微信中的消息时间显示逻辑，将时间戳（单位：毫秒）转换为友好的显示格式。
 *
 * 1）7 天之内：今天、昨天、前天、星期？（只显示 7 天内的星期数）；
 * 2）7 天之外：直接显示完整日期时间。
 *
 * @param timestamp 时间戳（毫秒），形如 1550789954260
 * @param mustIncludeTime true 表示输出一定包含「时间:分钟」
 */
export function formatDateShort(
  timestamp: number | string,
  mustIncludeTime?: boolean
): string {
  const currentDate = new Date();
  const srcTimestamp = parseInt(String(timestamp));
  const srcDate = new Date(srcTimestamp);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDateD = currentDate.getDate();

  const srcYear = srcDate.getFullYear();
  const srcMonth = srcDate.getMonth() + 1;
  const srcDateD = srcDate.getDate();

  let ret = "";

  // 要额外显示的时间分钟
  const timeExtraStr = mustIncludeTime ? " " + formatDate(srcDate, "hh:mm") : "";

  // 当年
  if (currentYear == srcYear) {
    const currentTimestamp = currentDate.getTime();
    // 相差时间（单位：毫秒）
    const deltaTime = currentTimestamp - srcTimestamp;

    // 当天（月份和日期一致才是）
    if (currentMonth == srcMonth && currentDateD == srcDateD) {
      // 时间相差 60 秒以内
      if (deltaTime < 60 * 1000) ret = "刚刚";
      // 否则当天其它时间段的，直接显示「时:分」
      else ret = formatDate(srcDate, "hh:mm");
    }
    // 当年 && 当天之外的时间（即昨天及以前）
    else {
      // 昨天（以「现在」为基准 -1 天）
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      // 前天（以「现在」为基准 -2 天）
      const beforeYesterdayDate = new Date();
      beforeYesterdayDate.setDate(beforeYesterdayDate.getDate() - 2);

      // 用目标日期的「月/日」跟「昨天」比较最准确（用时间戳差值判断会误判跨天场景）
      if (
        srcMonth == yesterdayDate.getMonth() + 1 &&
        srcDateD == yesterdayDate.getDate()
      ) {
        ret = "昨天" + timeExtraStr;
      } else if (
        srcMonth == beforeYesterdayDate.getMonth() + 1 &&
        srcDateD == beforeYesterdayDate.getDate()
      ) {
        ret = "前天" + timeExtraStr;
      } else {
        // 跟当前时间相差的小时数
        const deltaHour = deltaTime / (3600 * 1000);

        // 7*24 小时以内显示星期几
        if (deltaHour <= 7 * 24) {
          const weekday = [
            "星期日",
            "星期一",
            "星期二",
            "星期三",
            "星期四",
            "星期五",
            "星期六",
          ];
          ret = weekday[srcDate.getDay()] + timeExtraStr;
        } else {
          ret = formatDate(srcDate, "yyyy/M/d") + timeExtraStr;
        }
      }
    }
  }
  // 往年
  else {
    ret = formatDate(srcDate, "yyyy/M/d") + timeExtraStr;
  }

  return ret;
}

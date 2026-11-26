
/**
 * 平台优惠券「活动时间 / 有效期」文案（活动获取券：effectiveDays 为领取后有效天数）
 */
/** 优惠券/活动行的有效期相关字段（表格里只用到这几个） */
export type PromotionValidityRow = {
  getType?: string;
  effectiveDays?: number | string;
  rangeDayType?: string;
  startTime?: string;
  endTime?: string;
};

/**
 * 把有效期渲染成 HTML 片段：领取后 N 天有效 / 起止时间 / 长期有效。
 * 返回值可能含 <br/>，调用方用 v-html 输出。
 */
export function formatPromotionCouponValidityHtml(
  row: PromotionValidityRow | null | undefined
): string {
  if (!row) return "-";
  if (row.getType === "ACTIVITY") {
    const days = row.effectiveDays;
    if (days !== undefined && days !== null && days !== "") {
      const n = Number(days);
      if (!Number.isNaN(n) && n > 0) {
        return `领取后${n}天有效`;
      }
    }
  }
  if (row.startTime && row.endTime) {
    return `${row.startTime}<br/>${row.endTime}`;
  }
  if (row.getType === "ACTIVITY" && row.rangeDayType === "DYNAMICTIME") {
    return "长期有效";
  }
  return "-";
}

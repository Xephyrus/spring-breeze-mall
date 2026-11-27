/**
 * 商品规格快照的文字展示，兼容 SKU JSON 规格与历史纯文本规格。
 *
 * @author Bulbasaur
 * @since 2026-11-13
 */

/**
 * 将规格快照转换为业务规格文字，过滤图片及非标量数据，不修改原始快照。
 *
 * @param specs 原始规格 JSON、规格对象或历史纯文本
 * @returns 规格名和值组成的文字，无有效规格时返回占位符
 */
export function formatGoodsSpecs(specs: unknown): string {
  let value: unknown = specs;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return "-";
    try {
      value = JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  if (value == null) return "-";
  if (typeof value !== "object") return String(value) || "-";
  if (Array.isArray(value)) return "-";

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(
      ([key, item]) =>
        key !== "images" &&
        item != null &&
        ["string", "number", "boolean"].includes(typeof item) &&
        String(item).trim() !== ""
    )
    .map(([key, item]) => `${key}：${String(item).trim()}`)
    .join("，");

  return entries || "-";
}

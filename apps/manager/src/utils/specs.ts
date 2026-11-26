/**
 * 商品规格展示：兼容简要规格、键值 JSON 和旧数组结构，过滤图片数据，不展示原始 JSON。
 * @author Bulbasaur
 * @since 2026-11-06
 */

/** 将规格中的简单值转为文字，图片对象等复杂数据不参与规格展示。 */
function specValueText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .filter((item: unknown) => !item || typeof item !== "object")
      .map((item: unknown) => specValueText(item))
      .filter(Boolean)
      .join("、");
  }
  return "";
}

/**
 * 生成可读的 SKU 规格，优先复用接口已有的 simpleSpecs；无有效规格时显示默认规格。
 * @param {string|object|Array|null} specs SKU 原始规格
 * @param {string|null} simpleSpecs 接口提供的简要规格
 * @returns {string} 排除 images 后的规格值，以斜线分隔
 */
/** SKU 规格的三种历史形态：JSON 字符串 / 数组 / 键值对象 */
type SkuSpecItem = { specName?: string; specValue?: unknown };

export function formatSkuSpecs(
  specs: string | SkuSpecItem[] | Record<string, unknown> | null | undefined,
  simpleSpecs: string | null | undefined
): string {
  if (typeof simpleSpecs === "string" && simpleSpecs.trim()) return simpleSpecs.trim();
  let parsed: unknown = specs;
  if (typeof parsed === "string") {
    const text = parsed.trim();
    if (!text) return "默认规格";
    try {
      parsed = JSON.parse(text);
    } catch {
      return /^[[{]/.test(text) ? "默认规格" : text;
    }
  }
  let values: string[];
  if (Array.isArray(parsed)) {
    values = (parsed as SkuSpecItem[])
      .filter((item) => item && typeof item === "object" && item.specName !== "images")
      .map((item) => specValueText(item.specValue));
  } else if (parsed && typeof parsed === "object") {
    values = Object.entries(parsed as Record<string, unknown>)
      .filter(([name]) => name !== "images")
      .map(([, value]) => specValueText(value));
  } else {
    values = [specValueText(parsed)];
  }
  return values.filter(Boolean).join(" / ") || "默认规格";
}

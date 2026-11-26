/**
 * 媒体地址规范化
 *
 * 背景：本地存储（OssEnum.LOCAL）上传后，后端返回的是相对路径（如 `files/MANAGER/xxx.png`）。
 * 相对路径会被浏览器按**当前页面路径**解析（例如 `/floor-list/files/...`），导致图片/视频 404。
 *
 * 约定：
 * - 绝对地址（http/https/data/blob）原样返回；
 * - 其余一律规范成「以 / 开头」的根相对路径，由开发环境 Vite 代理 / 生产环境 nginx 转发到后端；
 * - 不把站点域名写进数据（保持可迁移）。
 */

/** 判断是否是完整的、可直接访问的地址 */
function isAbsoluteUrl(value: string) {
  return /^(https?:|data:|blob:|\/\/)/i.test(value);
}

/** 单个地址规范化：`files/a.png` → `/files/a.png` */
export function normalizeMediaUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isAbsoluteUrl(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** 只处理看起来像媒体路径的字符串，避免误改普通文本 */
function looksLikeMediaPath(value: string) {
  return /^\/?files\//i.test(value.trim());
}

/**
 * 深度规范化对象/数组里的媒体地址。
 * 用于页面装修数据（后端保存的 JSON）加载后、渲染前。
 */
export function normalizeMediaUrlsDeep<T>(input: T): T {
  if (typeof input === "string") {
    return (looksLikeMediaPath(input) ? normalizeMediaUrl(input) : input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => normalizeMediaUrlsDeep(item)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      result[key] = normalizeMediaUrlsDeep(value);
    });
    return result as T;
  }
  return input;
}

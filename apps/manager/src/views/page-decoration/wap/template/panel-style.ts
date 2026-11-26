/**
 * 面板级样式字段。
 *
 * 装修器的配置面板（config-panel/PanelXxx.vue）把样式写在楼层 options 上，
 * 而老数据把样式写在条目上（item.style.*）。渲染端要能区分两者。
 *
 * **不能只用一个字段判断**（例如 paddingTop）：面板可能只改圆角/颜色，
 * 那样整块新样式都不会生效 —— 视频楼层的「圆角设置无效」就是这么来的。
 */
const PANEL_STYLE_KEYS = [
  // 间距
  "paddingTop",
  "paddingX",
  "paddingBottom",
  "pageGap",
  "contentGap",
  // 背景与圆角
  "bgColor1",
  "bgColor2",
  "borderRadius",
  "imgRadius",
  // 文字与布局
  "titleColor",
  "nameColor",
  "moreColor",
  "textColor",
  "menuCols",
  "menuDisplay",
] as const;

/** 楼层 options 是否已被配置面板设置过（任一字段存在即为真） */
export function hasPanelStyle(res: unknown): boolean {
  if (!res || typeof res !== "object") return false;
  const options = res as Record<string, unknown>;
  return PANEL_STYLE_KEYS.some((key) => options[key] !== undefined);
}

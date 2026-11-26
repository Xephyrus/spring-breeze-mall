import type { CSSProperties } from "vue";

/** 视频项样式：面板保存的样式字段，老数据可能缺省 */
export type VideoItemStyle = {
  bgType?: string;
  bgColorStart?: string;
  bgColorEnd?: string;
  bgGradientDir?: string;
  bgRadius?: number;
  bottomBgColor?: string;
  bgImage?: string;
  margin?: number;
  padding?: number;
  borderShow?: boolean;
  borderStyle?: string;
  borderWidth?: number;
  borderColor?: string;
  shadowShow?: boolean;
  shadowColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
};

/** 视频项：list 中的一项 */
export type VideoItem = {
  id?: string | number;
  videoUrl?: string;
  coverImg?: string;
  aspectRatio?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  style?: VideoItemStyle;
  [key: string]: unknown;
};

export const DEFAULT_VIDEO_STYLE: VideoItemStyle = {
  bgType: "color",
  bgColorStart: "#F5F5F5",
  bgColorEnd: "#F5F5F5",
  bgGradientDir: "horizontal",
  bgRadius: 0,
  bottomBgColor: "#F5F5F5",
  bgImage: "",
  margin: 0,
  padding: 0,
  borderShow: false,
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#e5e5e5",
  shadowShow: false,
  shadowColor: "rgba(0,0,0,0.1)",
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 10,
  shadowSpread: 0,
};

export const ASPECT_RATIO_MAP: Record<string, number> = {
  "16:9": 56.25,
  "4:3": 75,
  "1:1": 100,
};

/**
 * 补全视频项：缺 aspectRatio 时给默认值，缺 style 字段时按默认值填充。
 * 就地修改（面板与预览共用同一份对象），因此入参要求是可变对象。
 */
export function ensureVideoItem(item: VideoItem) {
  if (!item.aspectRatio) item.aspectRatio = "16:9";
  if (!item.style) {
    item.style = { ...DEFAULT_VIDEO_STYLE };
    return;
  }
  const style = item.style;
  (Object.keys(DEFAULT_VIDEO_STYLE) as Array<keyof VideoItemStyle>).forEach((key) => {
    if (style[key] === undefined) {
      style[key] = DEFAULT_VIDEO_STYLE[key] as never;
    }
  });
}

/** 取背景渐变；方向未知时退回水平渐变 */
export function getVideoGradient(style: VideoItemStyle = {}) {
  const start = style.bgColorStart || "#F5F5F5";
  const end = style.bgColorEnd || start;
  const colors = `${start}, ${end}`;
  const dirMap: Record<string, string> = {
    horizontal: `linear-gradient(to right, ${colors})`,
    vertical: `linear-gradient(to bottom, ${colors})`,
    skewLeft: `linear-gradient(135deg, ${colors})`,
    skewRight: `linear-gradient(45deg, ${colors})`,
  };
  return dirMap[style.bgGradientDir ?? ""] || dirMap.horizontal;
}

/** 外层容器样式 */
export function getVideoWrapperStyle(item: VideoItem) {
  ensureVideoItem(item);
  const style = item.style ?? {};
  return {
    margin: `${style.margin || 0}px`,
    padding: `${style.padding || 0}px`,
    background: style.bottomBgColor || "#F5F5F5",
    boxSizing: "border-box" as const,
  };
}

/** 视频框样式（背景 / 圆角 / 边框 / 阴影） */
export function getVideoBoxStyle(item: VideoItem): CSSProperties {
  ensureVideoItem(item);
  const style = item.style ?? {};
  const box: CSSProperties = {
    borderRadius: `${style.bgRadius || 0}px`,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  };

  if (style.bgType === "image" && style.bgImage) {
    box.backgroundImage = `url(${style.bgImage})`;
    box.backgroundSize = "cover";
    box.backgroundPosition = "center";
  } else {
    box.background = getVideoGradient(style);
  }

  if (style.borderShow) {
    box.border = `${style.borderWidth || 1}px ${style.borderStyle || "solid"} ${
      style.borderColor || "#e5e5e5"
    }`;
  }

  if (style.shadowShow) {
    box.boxShadow = `${style.shadowX || 0}px ${style.shadowY || 0}px ${
      style.shadowBlur || 10
    }px ${style.shadowSpread || 0}px ${style.shadowColor || "rgba(0,0,0,0.1)"}`;
  }

  return box;
}

/** 取宽高比对应的 padding-top 百分比 */
export function getAspectPadding(ratio: string = "16:9") {
  return ASPECT_RATIO_MAP[ratio] || ASPECT_RATIO_MAP["16:9"];
}

/**
 * 热区（hotzone）几何工具
 *
 * 约定：
 * - 所有坐标/尺寸都是**像素**，除 `ZoneRatio`（后端保存的百分比配置）；
 * - `dealXX` 系列只返回**要改的字段**，由调用方合并回原样式；
 * - `dealEdgeValue` 会直接改写传入的 `itemInfo`（历史行为，保持一致）。
 */

/** 热区样式：像素坐标与尺寸，可只出现需要修改的字段 */
export type ZoneStyle = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
};

/** 完整的热区矩形（四个字段都有） */
export type ZoneInfo = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** 容器尺寸 */
export type ContainerSize = {
  width: number;
  height: number;
};

/** 后端保存的热区比例配置 */
export type ZoneRatio = {
  leftPer?: number;
  topPer?: number;
  widthPer?: number;
  heightPer?: number;
};

/** 鼠标事件或触摸事件：只需要能取到页面坐标 */
export type PointerLike =
  | { pageX: number; pageY: number }
  | { touches?: ArrayLike<{ pageX: number; pageY: number }> };

/** 需要相对定位的容器元素 */
export type OffsetContainer = {
  getBoundingClientRect: () => { left: number; top: number };
};

/** 八个拖拽方向的键名（供指令按 dataset.pointer 动态取方法） */
export type DealDirectionKey =
  | "dealTL"
  | "dealTC"
  | "dealTR"
  | "dealCL"
  | "dealCR"
  | "dealBL"
  | "dealBC"
  | "dealBR";
/** 工具对象结构 */
export type HotzoneUtil = {
  /** 热区最小边长 */
  MIN_LIMIT: number;
  /** 定位保留的小数位 */
  DECIMAL_PLACES: number;
  getMultiple: (decimalPlaces?: number) => number;
  decimalPoint: (val?: number) => number;
  getOffset: (elem?: { clientWidth?: number; clientHeight?: number }) => { width: number; height: number };
  getPageX: (e: PointerLike) => number;
  getPageY: (e: PointerLike) => number;
  getDistanceX: (e: PointerLike, container: OffsetContainer) => number;
  getDistanceY: (e: PointerLike, container: OffsetContainer) => number;
  /** 两个矩形是否有交集 */
  handleEgdeCollisions: (rect1: ZoneInfo, rect2: ZoneInfo) => boolean;
  dealEdgeValue: (
    itemInfo: ZoneInfo,
    styleInfo: ZoneStyle,
    container: ContainerSize,
    zones: ZoneRatio[],
    currentIndex?: number
  ) => ZoneInfo;
  dealTL: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealTC: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealTR: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealCL: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealCR: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealBL: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealBC: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
  dealBR: (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle;
};

const _ = {
  MIN_LIMIT: 48, // 热区最小边长
  DECIMAL_PLACES: 4, // 热区定位保留的小数位
} as HotzoneUtil;

/**
 * 取 10 的常量次幂，用于小数的放大与还原
 */
_.getMultiple = (decimalPlaces: number = _.DECIMAL_PLACES) => {
  return Math.pow(10, decimalPlaces);
};

/**
 * 限制小数位数：先放大取整再还原，规避 JS 浮点误差
 */
_.decimalPoint = (val: number = 0) => {
  return Math.round(val * _.getMultiple()) / _.getMultiple() || 0;
};

/**
 * 取元素宽高
 */
_.getOffset = (elem: { clientWidth?: number; clientHeight?: number } = {}) => ({
  width: elem.clientWidth || 0,
  height: elem.clientHeight || 0,
});

/**
 * 取页面横坐标（兼容触摸事件）
 */
_.getPageX = (e: PointerLike) =>
  'pageX' in e ? e.pageX : (e.touches?.[0]?.pageX ?? 0);

/**
 * 取页面纵坐标（兼容触摸事件）
 */
_.getPageY = (e: PointerLike) =>
  'pageY' in e ? e.pageY : (e.touches?.[0]?.pageY ?? 0);

/**
 * 取鼠标点击点相对容器的横坐标
 */
_.getDistanceX = (e: PointerLike, container: OffsetContainer) =>
  _.getPageX(e) - (container.getBoundingClientRect().left + window.pageXOffset);

/**
 * 取鼠标点击点相对容器的纵坐标
 */
_.getDistanceY = (e: PointerLike, container: OffsetContainer) =>
  _.getPageY(e) - (container.getBoundingClientRect().top + window.pageYOffset);

/** 检测两个区域是否有碰撞：true 有交集，false 无交集 */
_.handleEgdeCollisions = (rect1: ZoneInfo, rect2: ZoneInfo) => {
  const l1 = { left: rect1.left, top: rect1.top };
  const r1 = { left: rect1.left + rect1.width, top: rect1.top + rect1.height };
  const l2 = { left: rect2.left, top: rect2.top };
  const r2 = { left: rect2.left + rect2.width, top: rect2.top + rect2.height };
  return !(
    l1.left > r2.left ||
    l2.left > r1.left ||
    l1.top > r2.top ||
    l2.top > r1.top
  );
};

/**
 * 改变热区大小时处理边界条件（越界收回、避免与其他热区重叠）
 */
_.dealEdgeValue = (
  itemInfo: ZoneInfo,
  styleInfo: ZoneStyle,
  container: ContainerSize,
  zones: ZoneRatio[],
  currentIndex: number = zones.length - 1
) => {
  const left = styleInfo.left;
  if (left !== undefined && left < 0) {
    styleInfo.left = 0;
    styleInfo.width = itemInfo.width + itemInfo.left;
  }

  const top = styleInfo.top;
  if (top !== undefined && top < 0) {
    styleInfo.top = 0;
    styleInfo.height = itemInfo.height + itemInfo.top;
  }

  if (left === undefined && styleInfo.width !== undefined) {
    if (itemInfo.left + styleInfo.width > container.width) {
      styleInfo.width = container.width - itemInfo.left;
    }
  }

  if (top === undefined && styleInfo.height !== undefined) {
    if (itemInfo.top + styleInfo.height > container.height) {
      styleInfo.height = container.height - itemInfo.top;
    }
  }

  // 与其他热区重叠则放弃本次调整
  if (zones.length > 1) {
    const currentzones = JSON.parse(JSON.stringify(zones)).map((zone: ZoneRatio) => {
      return {
        left: (zone.leftPer || 0) * container.width,
        top: (zone.topPer || 0) * container.height,
        width: (zone.widthPer || 0) * container.width,
        height: (zone.heightPer || 0) * container.height,
      };
    });
    const current: ZoneInfo = { ...itemInfo, ...styleInfo };
    for (let i = 0, len = currentzones.length; i < len; i++) {
      if (currentIndex !== i && _.handleEgdeCollisions(currentzones[i], current)) {
        return itemInfo;
      }
    }
  }

  return Object.assign(itemInfo, styleInfo);
};

/**
 * 左上角拖拽：大写字母含义 T-top、L-left、C-center、R-right、B-bottom
 */
_.dealTL = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const width = itemInfo.width - moveX;
  const height = itemInfo.height - moveY;

  if (width >= Math.min(minLimit, itemInfo.width)) {
    Object.assign(styleInfo, {
      width,
      left: itemInfo.left + moveX,
    });
  }

  if (height >= Math.min(minLimit, itemInfo.height)) {
    Object.assign(styleInfo, {
      height,
      top: itemInfo.top + moveY,
    });
  }

  return styleInfo;
};

_.dealTC = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  let styleInfo: ZoneStyle = {};
  const height = itemInfo.height - moveY;

  if (height >= Math.min(minLimit, itemInfo.height)) {
    styleInfo = {
      height,
      top: itemInfo.top + moveY,
    };
  }

  return styleInfo;
};

_.dealTR = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const width = itemInfo.width + moveX;
  const height = itemInfo.height - moveY;

  if (width >= Math.min(minLimit, itemInfo.width)) {
    Object.assign(styleInfo, {
      width,
    });
  }

  if (height >= Math.min(minLimit, itemInfo.height)) {
    Object.assign(styleInfo, {
      height,
      top: itemInfo.top + moveY,
    });
  }

  return styleInfo;
};

_.dealCL = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const width = itemInfo.width - moveX;

  if (width >= Math.min(minLimit, itemInfo.width)) {
    Object.assign(styleInfo, {
      width,
      left: itemInfo.left + moveX,
    });
  }

  return styleInfo;
};

_.dealCR = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const width = itemInfo.width + moveX;

  if (width >= Math.min(minLimit, itemInfo.width)) {
    Object.assign(styleInfo, {
      width,
    });
  }

  return styleInfo;
};

_.dealBL = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const width = itemInfo.width - moveX;
  const height = itemInfo.height + moveY;

  if (width >= Math.min(minLimit, itemInfo.width)) {
    Object.assign(styleInfo, {
      width,
      left: itemInfo.left + moveX,
    });
  }

  if (height >= Math.min(minLimit, itemInfo.height)) {
    Object.assign(styleInfo, {
      height,
    });
  }

  return styleInfo;
};

_.dealBC = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const height = itemInfo.height + moveY;

  if (height >= Math.min(minLimit, itemInfo.height)) {
    Object.assign(styleInfo, {
      height,
    });
  }

  return styleInfo;
};

// 添加热区时，判定鼠标释放点满足以下条件时生效
_.dealBR = (itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit: number = _.MIN_LIMIT) => {
  const styleInfo: ZoneStyle = {};
  const width = itemInfo.width + moveX;
  const height = itemInfo.height + moveY;
  if (width >= Math.min(minLimit, itemInfo.width)) {
    // 改变后的宽度 >= min(之前宽度, 内置最小宽度) 即生效
    Object.assign(styleInfo, {
      width,
    });
  }

  if (height >= Math.min(minLimit, itemInfo.height)) {
    // 改变后的高度 >= min(之前高度, 内置最小高度) 即生效
    Object.assign(styleInfo, {
      height,
    });
  }

  return styleInfo;
};

export default _;

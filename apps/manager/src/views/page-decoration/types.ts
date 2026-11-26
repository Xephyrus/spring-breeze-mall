/**
 * 装修模块公共类型 —— 总入口
 *
 * 本文件分两部分：
 *
 * 1. **兼容层**（`DecorateComponent` / `WapTemplateRes` / `CubeStyleRes`）：
 *    早期 `tpl_*` 模板组件按「具名类型 + 索引签名」使用，先保持不动，避免大面积改动。
 * 2. **结构层**（`PcPageData` / `WapPageData` / `PcOptionsMap` / `WapOptionsMap` …）：
 *    对 `li_page_data.page_data` 的真实结构建模，是后续装修器类型化的唯一入口。
 *
 * 迁移顺序见 `apps/manager/DECORATION-TYPES.md`。
 */

/* ================================================================== *
 * 第一部分：兼容层（原有导出，勿改签名）
 * ================================================================== */
/** 装修画布上的一个组件 */
export type DecorateComponent<T extends object = Record<string, unknown>> = {
  /** 组件唯一 id */
  id?: string | number;
  /** 组件类型，等于模板名：tpl_banner / tpl_cube ... */
  type: string;
  /** 面板展示名 */
  name?: string;
} & T;

/** 一个页面的装修组件列表 */
export type DecorateComponents = DecorateComponent[];

/** wap 模板组件收到的 res：各模板字段差异大，只声明高频字段 */
export type WapTemplateRes = {
  /** 模板类型 */
  type?: string;
  /** 内容列表，具体字段由模板决定 */
  list?: Array<Record<string, unknown>>;
  /** 其余配置项 */
  [key: string]: unknown;
};

/** 图片魔方类模板共用的样式字段（老数据可能缺省，全部可选） */
export type CubeStyleRes = {
  paddingTop?: number;
  paddingX?: number;
  paddingBottom?: number;
  bgColor1?: string;
  bgColor2?: string;
  borderRadius?: number;
  pageGap?: number;
  imgRadius?: number;
  contentGap?: number;
  [key: string]: unknown;
};

/* ================================================================== *
 * 第二部分：结构层（page_data 的真实结构）
 *
 * 写法说明：**每个组件类型都把样式字段展开写一遍**（不靠交叉类型拼装）。
 * 好处是读某个组件的类型时自带全部字段，不用跳到别的类型去看；
 * 代价是字段重复 —— 新增公共样式字段时需要同步到多个类型（见文末检查清单）。
 * ================================================================== */

/* ------------------------------------------------------------------ *
 * 一、公共样式字段（这是"展开写法"的字段来源，也是文档）
 * ------------------------------------------------------------------ */

/** H5 组件的内边距 / 间距字段 */
export type WapSpacing = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
};

/** H5 组件的圆角字段 */
export type WapRadius = {
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number;
  /** 下圆角 */
  radiusBottom?: number;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
};

/** H5 组件的背景字段 */
export type WapBackground = {
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
};

/** H5 组件的文字颜色字段 */
export type WapTextColors = {
  /** 主文字色 */
  textColor?: string;
  /** 标题色 */
  titleColor?: string;
  /** 名称色 */
  nameColor?: string;
  /** 文字色（旧字段） */
  color?: string;
  /** 文字色 1（旧字段） */
  color1?: string;
  /** 「更多」文字色 */
  moreColor?: string;
  /** 价格色 */
  priceColor?: string;
  /** 销量文字色 */
  salesColor?: string;
  /** 列表项文字色 */
  itemColor?: string;
};

/** PC 组件的 componentStyle（线上数据） */
export type PcComponentStyle = {
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  height?: number | string;
  widthRatio?: string;
  radius?: number[];
  padding?: number[];
  margin?: number[];
};

/** PC 行的 rowStyle（线上数据） */
export type PcRowStyle = {
  /** 设计稿宽度，通常是 1920 */
  width?: number;
  /** 行内对齐（布局代码会写） */
  alignItems?: string;
  justifyContent?: string;
  height?: number | string;
  gap?: number;
  margin?: number[];
  padding?: number[];
  radius?: number[];
};

/** 页面级样式 */
export type DecorationPageStyle = {
  backgroundColor?: string;
  backgroundImage?: string;
  /** 页面宽度（H5 是 375 设计稿） */
  width?: number;
};

/* ------------------------------------------------------------------ *
 * 二、组件通用形态
 * ------------------------------------------------------------------ */

/**
 * 组件能力标记：装修器据此决定能不能加子项 / 配链接 / 换图。
 * 这些是**运营配置的约束**，不是后端字段。
 */
export type DecorationComponentFlags = {
  /** 不允许"添加"子项 */
  notAdd?: boolean;
  /** 不允许配置跳转链接 */
  notLink?: boolean;
  /** 不允许换图 */
  notImg?: boolean;
  /** 只允许换图（其余配置禁用） */
  onlyImg?: boolean;
  /** 面板里可折叠 */
  close?: boolean;
};

/** PC 组件 */
export type PcComponent<TType extends string = string, TOptions = unknown> = {
  id: string;
  type: TType;
  /** 组件中文名（装修器左侧列表展示） */
  name?: string;
  /** 图标名（Element Plus 图标） */
  icon?: string;
  componentStyle?: PcComponentStyle;
  options: TOptions;
};

/** PC 行：一行可放多个组件，按 componentStyle.widthRatio 分栏 */
export type PcRow = {
  id: string;
  rowStyle?: PcRowStyle;
  components: PcComponent[];
};

/** PC 页面数据（page_data 解析结果） */
export type PcPageData = {
  /** 数据结构版本，当前线上是 2 */
  version?: number;
  pageStyle?: DecorationPageStyle;
  list: PcRow[];
};

/** H5 组件 */
export type WapComponent<TType extends string = string, TOptions = unknown> = {
  /** 列表内唯一键（旧数据可能没有） */
  key?: string;
  type: TType;
  name?: string;
  icon?: string;
  /** 左侧组件库缩略图 */
  img?: string;
  /** 组件分组 */
  group?: string;
  /** 模板编号（同 type 的不同样式） */
  model?: string;
  /** 抽屉里的配置（少数组件用） */
  drawer?: Record<string, unknown>;
  /** 楼层是否在渲染端隐藏（装修器可切换） */
  hidden?: boolean;
  /** 促销类组件的促销类型（LIVE / SECKILL / GROUP …） */
  promotionsType?: string;
  /** 副标题（促销类） */
  subName?: string;
  /** 副标题颜色 */
  subColor?: string;
  /** 副标题背景色 */
  subBkColor?: string;
  options: TOptions;
} & DecorationComponentFlags;

/** H5 页面数据（page_data 解析结果） */
export type WapPageData = {
  list: WapComponent[];
};

/* ------------------------------------------------------------------ *
 * 三、各组件 options（展开写法）
 * ------------------------------------------------------------------ */

/** H5 搜索组件 */
export type WapSearchOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 搜索框样式：1 = 圆角，2 = 直角 */
  searType?: string;
  logoUrl?: string;
  logoFixUrl?: string;
  placeWords?: string;
  hotWords?: string;
  hotInterval?: number;
  textColor?: string;
  boxColor?: string;
  textAlign?: string;
  searchRadius?: number;
  showTabs?: boolean;
  tabColor?: string;
  tabActiveColor?: string;
  tabList?: Array<{ title?: string; [key: string]: unknown }>;
  swiperStyle?: string;
  indicatorStyle?: string;
  indicatorPosition?: string;
  indicatorColor?: string;
  bannerRadius?: number;
  list: Array<{ img?: string; url?: string; link?: string; title?: string; size?: string }>;
};

/** H5 文本 / 图片区 */
export type WapTextPictureOptions = {
  list: Array<{ img?: string; url?: string; link?: string; title?: string; size?: string }>;
};

/** H5 商品列表 */
export type WapGoodsOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
  /** 主文字色 */
  textColor?: string;
  /** 标题色 */
  titleColor?: string;
  /** 名称色 */
  nameColor?: string;
  /** 文字色（旧字段） */
  color?: string;
  /** 文字色 1（旧字段） */
  color1?: string;
  /** 「更多」文字色 */
  moreColor?: string;
  /** 价格色 */
  priceColor?: string;
  /** 销量文字色 */
  salesColor?: string;
  /** 列表项文字色 */
  itemColor?: string;
  /** 色调模式 */
  toneMode?: string;
  list: Array<{
    /** 一行几个 */
    layout?: string;
    showName?: boolean;
    showPrice?: boolean;
    showSales?: boolean;
    cartShow?: boolean;
    cartStyle?: string;
    cartAction?: string;
    /** AUTO = 按条件取；MANUAL = 手选 */
    dataMode?: string;
    categoryId?: string | number;
    brandId?: string | number;
    storeId?: string | number;
    goodsList?: unknown[];
    count?: number;
    sortType?: string;
  }>;
};

/** H5 公告 */
export type WapNoticeOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
  /** 列表项文字色 */
  itemColor?: string;
  list: Array<{
    title?: string;
    color?: string;
    bk_color?: string;
    direction?: string;
    img?: string;
  }>;
};

/** H5 导航宫格 */
export type WapMenuOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 内容区圆角 */
  contentRadius?: number;
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
  menuDisplay?: string;
  menuRows?: number;
  menuCols?: number;
  textColor?: string;
  imgRadius?: number;
  list: Array<{ img?: string; url?: string; link?: string; title?: string; size?: string }>;
};

/** H5 优惠券 */
export type WapCouponOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
  layoutStyle?: string;
  bgColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  list: Array<{ title?: string; count?: number; data?: unknown[] }>;
};

/** H5 单图 */
export type WapFlexOneOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 内容区圆角 */
  contentRadius?: number;
  bgColor?: string;
  imgRadius?: number;
  list: Array<{ img?: string; url?: string; link?: string; title?: string; size?: string; zoneInfo?: unknown }>;
};

/** H5 积分商品 */
export type WapIntegralOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
  layoutStyle?: string;
  pointColor?: string;
  titleType?: string;
  titleImage?: string;
  titleStyle?: string;
  titleColor?: string;
  moreColor?: string;
  list: Array<{ title?: string; count?: number; data?: unknown[] }>;
};

/** H5 店铺 */
export type WapShopOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 内容区圆角 */
  contentRadius?: number;
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
  /** 文字色（旧字段） */
  color?: string;
  /** 文字色 1（旧字段） */
  color1?: string;
  /** 价格色 */
  priceColor?: string;
  /** 销量文字色 */
  salesColor?: string;
  /** 列表项文字色 */
  itemColor?: string;
  textColor?: string;
  titleColor?: string;
  nameColor?: string;
  moreColor?: string;
  imgRadius?: number;
  list: Array<{
    title?: string;
    count?: number;
    showLogo?: boolean;
    showName?: boolean;
    shopStyle?: string;
    dataMode?: string;
    shopList?: unknown[];
  }>;
};

/** H5 标题 */
export type WapTitleOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
  color?: string;
  color1?: string;
  moreColor?: string;
  list: Array<{
    title?: string;
    color?: string;
    title1?: string;
    color1?: string;
    bk_color?: string;
    textAlign?: string;
    link?: string;
    url?: string;
    model?: string;
    showMore?: boolean;
    moreText?: string;
    bgType?: string;
    fontSize?: number;
    subFontSize?: number;
    moreFontSize?: number;
    moreColor?: string;
    textStyle?: string;
  }>;
};

/** H5 首页组合（搜索 + 轮播） */
export type WapHomeCombOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  searType?: string;
  logoUrl?: string;
  logoFixUrl?: string;
  placeWords?: string;
  hotWords?: string;
  hotInterval?: number;
  textColor?: string;
  boxColor?: string;
  textAlign?: string;
  searchRadius?: number;
  showTabs?: boolean;
  tabColor?: string;
  tabActiveColor?: string;
  tabList?: Array<{ title?: string; [key: string]: unknown }>;
  swiperStyle?: string;
  indicatorStyle?: string;
  indicatorPosition?: string;
  indicatorColor?: string;
  bannerRadius?: number;
  list: Array<{ img?: string; url?: string; link?: string; size?: string; model?: string }>;
};

/** H5 促销详情（秒杀 / 拼团 / 满减等） */
export type WapPromotionDetailOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 上圆角 */
  radiusTop?: number | string;
  /** 下圆角 */
  radiusBottom?: number | string;
  /** 图片圆角 */
  imgRadius?: number;
  /** 内容区圆角 */
  contentRadius?: number;
  /** 背景色（单色） */
  bgColor?: string;
  /** 背景色 1（渐变起） */
  bgColor1?: string;
  /** 背景色 2（渐变止） */
  bgColor2?: string;
  /** 头部背景类型：color / image */
  headBgType?: string;
  /** 头部背景色 1 */
  headBgColor1?: string;
  /** 头部背景色 2 */
  headBgColor2?: string;
  /** 头部背景色 1（旧字段） */
  headBg1?: string;
  /** 头部背景色 2（旧字段） */
  headBg2?: string;
  /** 头部背景图 */
  headBgImage?: string;
  /** 主文字色 */
  textColor?: string;
  /** 文字色（旧字段） */
  color?: string;
  /** 文字色 1（旧字段） */
  color1?: string;
  /** 价格色 */
  priceColor?: string;
  /** 销量文字色 */
  salesColor?: string;
  /** 列表项文字色 */
  itemColor?: string;
  promotionsType?: string;
  layoutStyle?: string;
  titleColor?: string;
  nameColor?: string;
  moreColor?: string;
  showGoodsName?: boolean;
  showGoodsPrice?: boolean;
  showGroupTag?: boolean;
  showOriginalPrice?: boolean;
  showGroupBtn?: boolean;
  headTitleType?: string;
  list: Array<{
    type?: string;
    title?: string;
    title1?: string;
    bk_color?: string;
    color1?: string;
    data?: unknown[];
    groupSuccess?: unknown;
  }>;
};

/** PC 顶栏 */
export type PcTopBarOptions = {
  welcomeText?: string;
  loginText?: string;
  loginUrl?: string;
  registerText?: string;
  registerUrl?: string;
  userCenterUrl?: string;
  logoutText?: string;
  rightMenus?: Array<{ title?: string; url?: string }>;
  textColor?: string;
  fontSize?: number;
};

/** PC 公告条 */
export type PcNoticeBarOptions = {
  title?: string;
  showMore?: boolean;
  moreText?: string;
  moreUrl?: string;
  items?: Array<{ title?: string; url?: string }>;
};

/** PC 轮播 */
export type PcCarouselOptions = {
  autoPlay?: boolean;
  interval?: number;
  showArrow?: boolean;
  effect?: string;
  showIndicator?: boolean;
  fitMode?: string;
  aspectRatio?: string;
  height?: number;
  list?: Array<{ img?: string; url?: string; link?: string; title?: string }>;
};

/** PC 视频 */
export type PcVideoOptions = {
  videoUrl?: string;
  coverUrl?: string;
  url?: string;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
};

/** PC 搜索头 */
export type PcSearchHeaderOptions = {
  logoUrl?: string;
  logoLink?: string;
  placeholder?: string;
  showSearchTypes?: boolean;
  defaultSearchType?: string;
  storePlaceholder?: string;
  hotWords?: string[];
  showHotWords?: boolean;
  showCart?: boolean;
  cartText?: string;
  cartBgColor?: string;
  cartBorderColor?: string;
  cartTextColor?: string;
  cartBadgeColor?: string;
};

/** PC 页脚导航 */
export type PcFooterNavOptions = {
  showAssurance?: boolean;
  assurances?: Array<{ title?: string; description?: string; icon?: string }>;
  guideGroups?: Array<{ title?: string; items?: Array<{ title?: string; url?: string }> }>;
  icpText?: string;
  icpLink?: string;
  copyright?: string;
  copyrightLink?: string;
};

/** PC 分类导航 */
export type PcCategoryNavOptions = {
  showAllCategory?: boolean;
  allCategoryText?: string;
  allCategoryIcon?: string;
  textColor?: string;
  activeColor?: string;
  navItems?: Array<{ title?: string; url?: string }>;
};

/** H5 组件类型 → options 注册表（新增组件时在这里登记） */
export interface WapOptionsMap {
  search: WapSearchOptions;
  textPicture: WapTextPictureOptions;
  goods: WapGoodsOptions;
  notice: WapNoticeOptions;
  menu: WapMenuOptions;
  coupon: WapCouponOptions;
  flexOne: WapFlexOneOptions;
  integral: WapIntegralOptions;
  shop: WapShopOptions;
  title: WapTitleOptions;
  homeComb: WapHomeCombOptions;
  promotionDetail: WapPromotionDetailOptions;
}

/** PC 组件类型 → options 注册表 */
export interface PcOptionsMap {
  topBar: PcTopBarOptions;
  noticeBar: PcNoticeBarOptions;
  carousel: PcCarouselOptions;
  video: PcVideoOptions;
  searchHeader: PcSearchHeaderOptions;
  footerNav: PcFooterNavOptions;
  categoryNav: PcCategoryNavOptions;
}

/* ------------------------------------------------------------------ *
 * 四、判别联合 + 守卫
 * ------------------------------------------------------------------ */

/** 任一 PC 组件（带具体 options 类型） */
export type PcTypedComponent = {
  [K in keyof PcOptionsMap]: PcComponent<K & string, PcOptionsMap[K]>;
}[keyof PcOptionsMap];

/** 任一 H5 组件（带具体 options 类型） */
export type WapTypedComponent = {
  [K in keyof WapOptionsMap]: WapComponent<K & string, WapOptionsMap[K]>;
}[keyof WapOptionsMap];

/** H5 组件类型名 */
export type WapComponentType = keyof WapOptionsMap;
/** PC 组件类型名 */
export type PcComponentType = keyof PcOptionsMap;

/** 运行时的类型清单（用于"未登记类型"告警、批量校验） */
export const WAP_COMPONENT_TYPES: Record<WapComponentType, true> = {
  search: true,
  textPicture: true,
  goods: true,
  notice: true,
  menu: true,
  coupon: true,
  flexOne: true,
  integral: true,
  shop: true,
  title: true,
  homeComb: true,
  promotionDetail: true,
};

export const PC_COMPONENT_TYPES: Record<PcComponentType, true> = {
  topBar: true,
  noticeBar: true,
  carousel: true,
  video: true,
  searchHeader: true,
  footerNav: true,
  categoryNav: true,
};

/** 已登记过的 H5 类型 */
export function isWapComponentType(type: string | undefined): type is WapComponentType {
  return !!type && type in WAP_COMPONENT_TYPES;
}

/** 已登记过的 PC 类型 */
export function isPcComponentType(type: string | undefined): type is PcComponentType {
  return !!type && type in PC_COMPONENT_TYPES;
}

/** 取 H5 组件的 options（带类型收窄） */
export function getWapOptions<K extends WapComponentType>(
  component: { type?: string; options?: unknown } | null | undefined,
  type: K
): WapOptionsMap[K] | null {
  if (!component || component.type !== type || !component.options) return null;
  return component.options as WapOptionsMap[K];
}

/** 取 PC 组件的 options（带类型收窄） */
export function getPcOptions<K extends PcComponentType>(
  component: { type?: string; options?: unknown } | null | undefined,
  type: K
): PcOptionsMap[K] | null {
  if (!component || component.type !== type || !component.options) return null;
  return component.options as PcOptionsMap[K];
}

/** H5 页面里按 key 找组件 */
export function findWapComponent(
  pageData: WapPageData | null | undefined,
  key: string
): WapComponent | undefined {
  return pageData?.list.find((item) => item.key === key);
}

/** PC 页面里按 id 找组件（穿透行） */
export function findPcComponent(
  pageData: PcPageData | null | undefined,
  id: string
): { component: PcComponent; row: PcRow; index: number } | undefined {
  for (const row of pageData?.list ?? []) {
    const index = row.components.findIndex((item) => item.id === id);
    if (index >= 0) return { component: row.components[index], row, index };
  }
  return undefined;
}

/**
 * page_data 是字符串：PC / H5 共用这一个字段，靠 page_client_type 区分。
 * 解析失败返回空结构，避免装修页整页崩掉。
 */
export function parsePageData<TPage extends PcPageData | WapPageData>(
  pageDataRaw: string | null | undefined,
  clientType: "PC" | "H5"
): TPage {
  const fallback = (clientType === "PC" ? { version: 2, list: [] } : { list: [] }) as unknown as TPage;
  if (!pageDataRaw) return fallback;
  try {
    const parsed = JSON.parse(pageDataRaw) as TPage;
    if (!parsed || !Array.isArray((parsed as { list?: unknown[] }).list)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * 新增公共样式字段时的检查清单（展开写法的代价）：
 *
 * 1. 先加到 WapSpacing / WapRadius / WapBackground / WapTextColors（文档与来源）
 * 2. 再按需复制到用到它的组件类型：
 *    WapSearchOptions / WapGoodsOptions / WapNoticeOptions / WapMenuOptions /
 *    WapCouponOptions / WapFlexOneOptions / WapIntegralOptions / WapShopOptions /
 *    WapTitleOptions / WapHomeCombOptions / WapPromotionDetailOptions
 * 3. 面板（config-panel/PanelXxx.vue）若读写该字段，同步更新其默认值
 */

/* ------------------------------------------------------------------ *
 * 五、老模板（tpl_*）组件
 *
 * 新组件走 config-panel 面板 + WapOptionsMap；但早期 `tpl_*` 模板（轮播、魔方、标题、
 * 公告 …）的配置项由 `decorate.vue` 自己读写，形状是「options.list[] 里的每一项就是一块内容」。
 * 这部分单独建模，避免把新面板的类型搅进来。
 * ------------------------------------------------------------------ */

/**
 * 老模板里的「链接对象」。
 *
 * 线上数据的真实形状：`item.url` 并不是字符串，而是一个对象 ——
 * 既有 `url.url`（真正的地址），也带 `___type` / `pageType` / `goodsName` 等装修约定字段。
 * 个别组件还会把 url 当字符串用（`item.url.length`），所以补一个 length 兜住历史写法。
 */
export type WapLegacyLink = {
  /** 真正的跳转地址 */
  url?: string;
  link?: string;
  title?: string;
  /** 装修链接约定：goods / category / shops / pages / special / other */
  ___type?: string;
  pageType?: string;
  name?: string;
  goodsName?: string;
  memberName?: string;
  id?: string | number;
  zoneInfo?: unknown;
  /** 历史写法：把 url 当字符串判空 */
  length?: number;
  [key: string]: unknown;
};

/** 老模板的内容项：装修器只读写这几项，其余按需透传 */
export type WapLegacyOptionItem = {
  /** 标题（公告类是多条：数组） */
  title?: string | Array<{ content?: string }>;
  /** 描述 / 副标题 */
  desc?: string;
  /** 名称（分类 / 店铺项） */
  name?: string;
  /** 项类型标记 */
  type?: string;
  /** 背景色（旧字段命名） */
  bk_color?: string;
  /** 商品 / 店铺展示名 */
  goodsName?: string;
  shopName?: string;
  /** 已绑定的分类 */
  bindCategory?: unknown;
  /** 商品分组下标 */
  ___index?: number;
  /** 价格（展示用） */
  price?: string | number;
  /** 主文字色（el-color-picker 清空时写 null） */
  color?: string | null;
  /** 次文字色 / 副标题色（el-color-picker 清空时写 null） */
  color1?: string | null;
  /** 副标题文案 */
  title1?: string;
  /** 公告等组件的附加文案 */
  context?: string;
  /** 目标页面类型 */
  pageType?: string;
  /** 列表项的唯一标识（部分组件用） */
  key?: string;
  /** 列表项的值（部分组件用） */
  value?: string | number;
  /** 文字对齐（title 组件用） */
  textAlign?: string;
  /** 尺寸（样式选择用） */
  size?: string;
  /** 方向（公告横向 / 纵向） */
  direction?: string;
  img?: string;
  /** 链接对象（不是字符串，见 WapLegacyLink） */
  url?: WapLegacyLink;
  link?: WapLegacyLink;
  model?: string;
  /** 商品分组：每一项是一组待绑定的商品 */
  titleWay?: WapLegacyOptionItem[];
  /** 商品分组里的商品 */
  listWay?: Array<Record<string, unknown>>;
  /** 热区数据（热区组件会写） */
  zoneInfo?: unknown;
  /** 图片样式（回调选图时写 bgImage） */
  style?: Record<string, unknown>;
};

/** 老模板组件（decorate.vue 编辑的对象） */
export type WapLegacyComponent = WapComponent<string, { list: WapLegacyOptionItem[] }> & {
  /** 没有标题行 */
  notTitle?: boolean;
  /** 组件自身的方向 */
  direction?: string;
  /** 促销抽屉 */
  drawerPromotions?: unknown;
};
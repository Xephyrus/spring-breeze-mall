/**
 * 热区模块共用类型
 *
 * 三个指令（dragItem / addItem / changeSize）通过 `binding.instance` 拿到宿主组件实例，
 * 这里只声明指令真正用到的成员，避免把整个组件实例类型拖进来。
 */

/** 单个热区的比例配置（后端 li_hotzone 保存的字段） */
export type HotzoneSetting = {
  topPer: number;
  leftPer: number;
  widthPer: number;
  heightPer: number;
  img?: string;
  link?: string;
  type?: string;
  title?: string;
  id?: string | number;
  pageType?: string;
  name?: string;
  goodsName?: string;
  storeName?: string;
  /** 其余字段由装修配置携带，按需读取 */
  [key: string]: unknown;
};

/** 拖拽指令用到的宿主成员 */
export type HotzoneDragInstance = {
  setting: HotzoneSetting;
  index: number;
  handlehideZone: (hide: boolean) => void;
  changeInfo: (patch: Partial<HotzoneSetting>) => void;
  $parent?: { zones: HotzoneSetting[] };
};

/** 新建热区指令用到的宿主成员 */
export type HotzoneAddInstance = {
  zones: HotzoneSetting[];
  addItem: (setting: HotzoneSetting) => void;
  isOverRange: () => boolean;
  overRange: () => void;
  changeItem: (info: HotzoneSetting, reset?: boolean) => void;
  eraseItem: () => void;
};

/** 带指令卸载钩子的元素 */
export type HotzoneBoundElement = HTMLElement & {
  __hotzoneDragDestroy?: () => void;
  __hotzoneAddDestroy?: () => void;
  __hotzoneResizeDestroy?: () => void;
};

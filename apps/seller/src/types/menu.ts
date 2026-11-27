/**
 * 菜单 / 路由相关的公共类型。
 *
 * 独立成文件是为了避免 `libs/util`、`stores/app`、`router/*` 互相 import 造成循环依赖
 * （这里只有类型，编译后不产生任何运行时代码）。
 */

/** 后端权限接口返回的菜单节点（li_store_menu 的一行 + children） */
export interface MenuNode {
  id?: string;
  name?: string;
  path?: string;
  title?: string;
  /** 前端视图文件相对路径（不含扩展名），由 lazyLoading 解析 */
  frontRoute?: string;
  /** 兼容字段：部分老菜单用 component 存视图路径 */
  component?: string;
  keepAlive?: boolean;
  level?: number;
  /** 所属一级菜单名（用于面包屑/侧边栏高亮） */
  firstRouterName?: string;
  children?: MenuNode[] | null;
  [key: string]: unknown;
}

/** 菜单转成路由后的节点（比 MenuRoute 更宽松，供 util 内部与 store 使用） */
export interface MenuRoute {
  name?: string;
  path?: string;
  title?: string | Record<string, string>;
  component?: unknown;
  redirect?: unknown;
  children?: MenuRoute[];
  meta?: Record<string, unknown>;
  argu?: unknown;
  query?: unknown;
  [key: string]: unknown;
}

/** 顶部已打开标签 */
export interface OpenedTag {
  title: string;
  path: string;
  name: string;
  argu?: unknown;
  query?: unknown;
  [key: string]: unknown;
}

/** 顶部一级导航 */
export interface NavItem {
  name: string;
  title: string;
}

/** 商家会话档案（从登录用户信息中裁剪，避免 Cookie 超限） */
export interface SellerProfile {
  id?: string;
  storeId?: string;
  storeName?: string;
  storeLogo?: string;
  nickName?: string;
  storeDisable?: string | number;
  serviceScore?: number;
  deliveryScore?: number;
  descriptionScore?: number;
}

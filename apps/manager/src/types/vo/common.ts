/**
 * 跨模块共用的 VO 类型。
 *
 * 起因：`CategoryNode` 在 10 个文件里各写了一遍（字段还不完全一致），
 * api 层因此无法 import，也就无法给 `getCategoryTree` 标返回类型。
 * 这里给出唯一权威定义，各页面改为 import。
 */
export type CategoryNode = {
  id?: string | number;
  name?: string;
  /** 文章分类使用的名称字段 */
  articleCategoryName?: string;
  /** 层级（1 起） */
  level?: number;
  parentId?: string | number;
  sortOrder?: number;
  commissionRate?: number;
  /** 后端可能返回 0/1 或布尔 */
  deleteFlag?: boolean | number;
  image?: string;
  children?: CategoryNode[];
  /** 后端会扩容，保留未知字段 */
  [key: string]: unknown;
};

/** 地区节点（省/市/区） */
export type RegionNode = {
  id?: string | number;
  name?: string;
  /** 层级：province / city / district / street */
  level?: string;
  children?: RegionNode[];
  [key: string]: unknown;
};

/** 部门树节点 */
export type DepartmentNode = {
  id?: string | number;
  title?: string;
  name?: string;
  parentId?: string | number;
  sortOrder?: number;
  status?: number;
  children?: DepartmentNode[];
  [key: string]: unknown;
};

/** 菜单 / 权限节点 */
export type MenuNode = {
  id?: string | number;
  title?: string;
  name?: string;
  path?: string;
  parentId?: string | number;
  sortOrder?: number;
  level?: number;
  permission?: string;
  icon?: string;
  frontRoute?: string;
  frontComponent?: string;
  buttonType?: string;
  updateTime?: string;
  selected?: boolean;
  children?: MenuNode[];
  [key: string]: unknown;
};

/** 通用分页返回 */
export type PageRows<T = VoRow> = {
  records: T[];
  total: number;
  current?: number;
  size?: number;
  pages?: number;
  [key: string]: unknown;
};

export type VoRow = { id?: string | number; [key: string]: unknown };

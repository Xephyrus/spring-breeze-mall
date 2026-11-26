/**
 * Element Plus 组件实例的结构化类型。
 *
 * 这些 ref 只用到少数几个方法，按「用到什么声明什么」写，
 * 比 `ref<any>(null)` 安全得多：写错方法名、传错参数都会在编译期报错。
 */

/** el-form 实例（只声明项目里实际用到的成员） */
export type FormRefLike = {
  validate?: (callback?: (valid: boolean, fields?: unknown) => void) => Promise<boolean>;
  validateField?: (props: string | string[], callback?: (error: string) => void) => void;
  resetFields?: (props?: string | string[]) => void;
  clearValidate?: (props?: string | string[]) => void;
  scrollToField?: (prop: string | string[]) => void;
};

/** el-table 实例（只声明项目里实际用到的成员） */
export type TableRefLike = {
  clearSelection?: () => void;
  toggleRowSelection?: (row: unknown, selected?: boolean) => void;
  toggleAllSelection?: () => void;
  toggleRowExpansion?: (row: unknown, expanded?: boolean) => void;
  setExpandRowKeys?: (keys: string[]) => void;
  setCurrentRow?: (row?: unknown) => void;
  clearSort?: () => void;
  clearFilter?: (columnKeys?: string[]) => void;
  doLayout?: () => void;
  sort?: (prop: string, order: string) => void;
};

/** el-tree / el-upload 等零散实例的统一兜底（只用于没有任何方法调用的情况） */
export type AnyComponentRef = Record<string, (...args: never[]) => unknown>;

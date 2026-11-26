/**
 * 存储 localStorage
 */
export const setStore = (name: string, content: unknown): void => {
  if (!name) return;
  const value = typeof content !== "string" ? JSON.stringify(content) : content;
  window.localStorage.setItem(name, value);
};

/**
 * 获取 localStorage
 */
export const getStore = (name: string): string => {
  if (!name) return "";
  const v = window.localStorage.getItem(name);
  if (v == null) {
    return "";
  }
  return v;
};

/**
 * 删除 localStorage
 */
export const removeStore = (name: string): void => {
  if (!name) return;
  window.localStorage.removeItem(name);
};

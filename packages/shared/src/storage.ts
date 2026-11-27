/**
 * localStorage 读写（各端行为一致，抽到共享包避免三份副本）。
 */
export const setStore = (name: string, content: unknown): void => {
  if (!name) return;
  const value = typeof content !== "string" ? JSON.stringify(content) : content;
  window.localStorage.setItem(name, value);
};

export const getStore = (name: string): string => {
  if (!name) return "";
  const v = window.localStorage.getItem(name);
  return v == null ? "" : v;
};

export const removeStore = (name: string): void => {
  if (!name) return;
  window.localStorage.removeItem(name);
};

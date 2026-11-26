import * as regular from './regular'

export {
  regular
}


/**
 * 数组对象深拷贝
 * @param obj
 * @returns {*}
 */
export default function cloneObj<T = unknown>(obj: T): T | undefined {
  let str = null
  let newobj: unknown = Array.isArray(obj) ? [] : {}
  if (typeof obj !== 'object') {
    return
  } else if (window && window.JSON) {
    str = JSON.stringify(obj) // 系列化对象
    newobj = JSON.parse(str) // 还原
  } else {
    const src = obj as Record<string, unknown>;
    for (const i in src) {
      (newobj as Record<string, unknown>)[i] =
        typeof src[i] === "object" ? cloneObj(src[i]) : src[i];
    }
  }
  return newobj as T
}

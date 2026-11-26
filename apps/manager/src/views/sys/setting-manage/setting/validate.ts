import { ElMessage } from "element-plus";
//表单中必填
export function validateRequired(rule: unknown, value: unknown, callback: (error?: Error) => void) {
  if (value !== undefined && value !== null && value !== "") {
    callback();
  } else {
    callback(new Error("必填项不能为空"));
  }
}

// 验证必填项（Element Plus 表单校验为异步，返回 Promise）
/**
 * 设置页提交前的表单校验。
 *
 * that 是调用方的组件实例（各设置页里传 `this`），只需要 $refs；
 * 这里按「用到什么声明什么」写，避免整页传 any。
 */
export function handleSubmit(that: unknown, name: string) {
  return new Promise<boolean>((resolve, reject) => {
    // 调用方传的是组件实例（各设置页里的 this），这里按需收窄，避免让整页去满足某个结构类型
    const refs = (that as { $refs?: Record<string, unknown> } | null)?.$refs;
    const form = refs?.[name] as { validate?: (cb: (valid: boolean) => void) => void } | undefined;
    if (!form) {
      ElMessage.error("表单未就绪，请稍后重试");
      reject(new Error("form ref missing"));
      return;
    }
    form.validate?.((valid: boolean) => {
      if (valid) {
        resolve(true);
      } else {
        ElMessage.error("请正确填写内容!");
        reject(new Error("validation failed"));
      }
    });
  });
}

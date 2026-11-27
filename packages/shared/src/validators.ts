/**
 * Element Plus 表单校验函数（各端共用）。
 *
 * 传 Error 表示校验失败，不传表示通过。
 */
export type ValidateCallback = (error?: Error) => void;

/** Element Plus 表单校验函数签名（rule 参数保留以匹配 EP 的三参调用） */
export type RuleValidator = (
  rule: unknown,
  value: unknown,
  callback: ValidateCallback
) => void;

const toText = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

/** 密码格式验证（不少于 6 位） */
export const validatePassword: RuleValidator = (_rule, value, callback) => {
  if (toText(value).length < 6) {
    callback(new Error("密码长度不得小于6位"));
  } else {
    callback();
  }
};

/** 手机号码格式验证 */
export const validateMobile: RuleValidator = (_rule, value, callback) => {
  const reg = /^[1][3,4,5,6,7,8][0-9]{9}$/;
  if (!reg.test(toText(value))) {
    callback(new Error("手机号格式错误"));
  } else {
    callback();
  }
};

/** 身份证号码格式验证（18 位） */
export const validateIDCard: RuleValidator = (_rule, value, callback) => {
  const reg =
    /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  if (!reg.test(toText(value))) {
    callback(new Error("身份证号码格式错误"));
  } else {
    callback();
  }
};

/** 验证是否正整数（保留原实现的 1s 延迟，避免与输入事件抢跑） */
export const isInteger: RuleValidator = (_rule, value, callback) => {
  if (!value) {
    callback(new Error("输入不可以为空"));
    return;
  }
  setTimeout(() => {
    const text = toText(value);
    const re = /^[0-9]*[1-9][0-9]*$/;
    if (!Number(value) || !re.test(text)) {
      callback(new Error("请输入正整数"));
    } else {
      callback();
    }
  }, 1000);
};

/** 验证金额（整数或两位小数） */
export const isMoney: RuleValidator = (_rule, value, callback) => {
  if (!value) {
    callback(new Error("输入不可以为空"));
    return;
  }
  const re = /(^[1-9]{1}[0-9]*$)|(^[0-9]*\.[0-9]{2}$)/;
  if (!re.test(toText(value))) {
    callback(new Error("请输入正整数"));
  } else {
    callback();
  }
};

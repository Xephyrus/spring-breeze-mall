/**
 * 粘贴/拖拽解析工具（来自 wangEditor 的 editor.js，im 端只用到这几个纯函数）。
 *
 * 兼容三种事件来源：原生 ClipboardEvent / 拖拽 DragEvent / 旧版 IE 的 window.clipboardData。
 */

/** 遍历对象（任意结构，回调返回 false 时中断） */
export function objForEach(
  obj: Record<string, unknown>,
  fn: (this: Record<string, unknown>, key: string, value: unknown) => unknown
): void {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const result = fn.call(obj, key, obj[key]);
      if (result === false) {
        break;
      }
    }
  }
}

/** 遍历类数组 */
export function arrForEach(
  fakeArr: ArrayLike<unknown>,
  fn: (this: ArrayLike<unknown>, item: unknown, index: number) => unknown
): void {
  const length = fakeArr.length || 0;
  for (let i = 0; i < length; i++) {
    const result = fn.call(fakeArr, fakeArr[i], i);
    if (result === false) {
      break;
    }
  }
}

/** 替换 html 特殊字符 */
export function replaceHtmlSymbol(html?: string | null): string {
  if (html == null) {
    return "";
  }
  return html
    .replace(/</gm, "&lt;")
    .replace(/>/gm, "&gt;")
    .replace(/"/gm, "&quot;")
    .replace(/(\r\n|\r|\n)/g, "<br/>");
}

/** 兼容 jQuery 事件包装与原生事件 */
interface ClipboardLikeEvent {
  clipboardData?: DataTransfer | null;
  dataTransfer?: DataTransfer | null;
  originalEvent?: ClipboardLikeEvent;
}

function resolveClipboardData(e: ClipboardLikeEvent): DataTransfer | null {
  return e.clipboardData || e.originalEvent?.clipboardData || null;
}

function resolveDataTransfer(e: ClipboardLikeEvent): DataTransfer | null {
  return e.dataTransfer || e.originalEvent?.dataTransfer || null;
}

/** 旧版 IE 的 window.clipboardData（TS 的 DOM 类型里没有） */
function readLegacyClipboardText(): string {
  const legacy = window as Window & { clipboardData?: { getData(type: string): string } };
  return legacy.clipboardData?.getData("text") ?? "";
}

/** 获取粘贴的纯文本 */
export function getPasteText(e: ClipboardLikeEvent): string {
  const clipboardData = resolveClipboardData(e);
  const pasteText = clipboardData ? clipboardData.getData("text/plain") : readLegacyClipboardText();

  return replaceHtmlSymbol(pasteText);
}

/**
 * 获取粘贴的 html。
 *
 * @param filterStyle 是否过滤 style（true 时连 style 一起去掉）
 * @param ignoreImg 是否忽略图片标签
 */
export function getPasteHtml(
  e: ClipboardLikeEvent,
  filterStyle?: boolean,
  ignoreImg?: boolean
): string | undefined {
  const clipboardData = resolveClipboardData(e);
  let pasteText = "";
  let pasteHtml = "";

  if (!clipboardData) {
    pasteText = readLegacyClipboardText();
  } else {
    pasteText = clipboardData.getData("text/plain");
    pasteHtml = clipboardData.getData("text/html");
  }

  if (!pasteHtml && pasteText) {
    pasteHtml = "<p>" + replaceHtmlSymbol(pasteText) + "</p>";
  }
  if (!pasteHtml) {
    return undefined;
  }

  // 过滤 word 中带过来的无用字符
  const docSplitHtml = pasteHtml.split("</html>");
  if (docSplitHtml.length === 2) {
    pasteHtml = docSplitHtml[0];
  }

  // 过滤无用标签
  pasteHtml = pasteHtml.replace(/<(meta|script|link).+?>/gim, "");
  // 去掉注释
  pasteHtml = pasteHtml.replace(/<!--.*?-->/gm, "");
  // 过滤 data-xxx 属性
  pasteHtml = pasteHtml.replace(/\s?data-.+?=('|").+?('|")/gim, "");

  if (ignoreImg) {
    // 忽略图片
    pasteHtml = pasteHtml.replace(/<img.+?>/gim, "");
  }

  if (filterStyle) {
    // 过滤样式
    pasteHtml = pasteHtml.replace(/\s?(class|style)=('|").*?('|")/gim, "");
  } else {
    // 保留样式
    pasteHtml = pasteHtml.replace(/\s?class=('|").*?('|")/gim, "");
  }

  return pasteHtml;
}

/** 获取粘贴的图片文件（有文字时忽略图片） */
export function getPasteImgs(e: ClipboardLikeEvent): File[] {
  const result: File[] = [];
  const txt = getPasteText(e);
  if (txt) {
    // 有文字，就忽略图片
    return result;
  }

  const clipboardData = resolveClipboardData(e);
  const items = clipboardData?.items;
  if (!items) {
    return result;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (/image/i.test(item.type)) {
      const file = item.getAsFile();
      if (file) result.push(file);
    }
  }

  return result;
}

/** 获取拖拽的图片 */
export function getDragPasteImg(e: ClipboardLikeEvent): File[] {
  const result: File[] = [];
  const dataTransfer = resolveDataTransfer(e);
  const items = dataTransfer?.items;
  if (!items) {
    return result;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (/image/i.test(item.type)) {
      const file = item.getAsFile();
      if (file) result.push(file);
    }
  }

  return result;
}

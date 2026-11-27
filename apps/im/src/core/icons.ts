import { h } from "vue";
import type { Component } from "vue";

/**
 * 生成一个包装 `svg-icon` 的组件（图标名与 `src/icons/svg` 下的文件名一致）。
 *
 * 用法：在组件里 `import { SvgNotData } from "@/core/icons"` 后直接当普通组件用。
 */
function createSvgIcon(name: string): Component {
  return {
    name: `SvgIcon_${name}`,
    inheritAttrs: false,
    render() {
      return h("svg-icon", {
        iconClass: name,
        ...this.$attrs,
      });
    },
  };
}

export const SvgMentionDown = createSvgIcon("mention-down");
export const SvgNotFount = createSvgIcon("not-fount");
export const SvgNote = createSvgIcon("note");
export const SvgNoteBook = createSvgIcon("note-book");
export const SvgNotData = createSvgIcon("not-data");
export const SvgZhuangFa = createSvgIcon("zhuangfa");

import type { App, DirectiveBinding } from "vue";

/** 绑定在元素上的 click-outside 处理器（卸载时移除） */
type ElWithClickOutside = HTMLElement & {
  __clickOutsideHandler__?: (e: MouseEvent) => void;
};

function onClickOutside(el: ElWithClickOutside, binding: DirectiveBinding<(e: MouseEvent) => void>): void {
  const handler = (e: MouseEvent) => {
    const target = e.target as Node | null;
    if (target && !el.contains(target)) {
      binding.value(e);
    }
  };
  el.__clickOutsideHandler__ = handler;
  document.addEventListener("click", handler);
}

function offClickOutside(el: ElWithClickOutside): void {
  if (el.__clickOutsideHandler__) {
    document.removeEventListener("click", el.__clickOutsideHandler__);
    delete el.__clickOutsideHandler__;
  }
}

/**
 * 注册全局指令：
 * - `v-focus` 挂载后聚焦
 * - `v-paste` 透传 paste 事件
 * - `v-drag` 拖拽进入/悬停/离开都阻止默认行为，放下时回调
 * - `v-outside` 点击元素外部时回调
 */
export function registerDirectives(app: App): void {
  app.directive("focus", {
    mounted(el: HTMLElement) {
      el.focus();
    },
  });

  app.directive("paste", {
    mounted(el: HTMLElement, binding: DirectiveBinding<(event: ClipboardEvent) => void>) {
      el.addEventListener("paste", (event) => {
        binding.value(event as ClipboardEvent);
      });
    },
  });

  app.directive("drag", {
    mounted(el: HTMLElement, binding: DirectiveBinding<(event: DragEvent) => void>) {
      const stop = (event: Event) => {
        event.stopPropagation();
        event.preventDefault();
      };
      el.addEventListener("dragenter", stop);
      el.addEventListener("dragover", stop);
      el.addEventListener("dragleave", stop);
      el.addEventListener("drop", (event) => {
        stop(event);
        binding.value(event as DragEvent);
      });
    },
  });

  app.directive("outside", {
    mounted(el: HTMLElement, binding: DirectiveBinding<(e: MouseEvent) => void>) {
      onClickOutside(el, binding);
    },
    unmounted(el: HTMLElement) {
      offClickOutside(el);
    },
  });
}

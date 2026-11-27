import { createApp, h, onMounted, onUnmounted, type App, type VNode } from "vue";
import LegacyElIcon from "@/components/global/legacy-el-icon.vue";

/** 右键菜单项 */
export interface ContextmenuItem {
  label: string;
  /** LegacyElIcon 的图标名 */
  icon?: string;
  disabled?: boolean;
  divided?: boolean;
  customClass?: string;
  onClick?: () => void;
}

/** showContextmenu 的参数：可只传数组，也可传完整配置 */
export interface ContextmenuOptions {
  items?: ContextmenuItem[];
  event?: MouseEvent | { clientX?: number; clientY?: number };
  x?: number;
  y?: number;
  customClass?: string;
  zIndex?: number;
  minWidth?: number;
}

interface ActiveMenu {
  app: App;
  el: HTMLElement;
}

let activeMenu: ActiveMenu | null = null;

function destroyMenu(): void {
  if (!activeMenu) return;
  activeMenu.app.unmount();
  if (activeMenu.el.parentNode) {
    activeMenu.el.parentNode.removeChild(activeMenu.el);
  }
  activeMenu = null;
}

function normalizeOptions(options: ContextmenuOptions | ContextmenuItem[]): ContextmenuOptions {
  if (Array.isArray(options)) {
    return { items: options };
  }
  return options || { items: [] };
}

/** 打开右键菜单（同一时间只保留一个） */
export function showContextmenu(options: ContextmenuOptions | ContextmenuItem[]): void {
  destroyMenu();

  const {
    items = [],
    event,
    x = 0,
    y = 0,
    customClass = "",
    zIndex = 3000,
    minWidth = 120,
  } = normalizeOptions(options);

  const left = event?.clientX ?? x;
  const top = event?.clientY ?? y;
  const el = document.createElement("div");
  document.body.appendChild(el);

  const app = createApp({
    setup() {
      const close = () => destroyMenu();

      onMounted(() => {
        document.addEventListener("click", close);
        document.addEventListener("contextmenu", close);
        document.addEventListener("wheel", close, { passive: true });
      });

      onUnmounted(() => {
        document.removeEventListener("click", close);
        document.removeEventListener("contextmenu", close);
        document.removeEventListener("wheel", close);
      });

      return () =>
        h(
          "div",
          {
            class: ["im-contextmenu", customClass].filter(Boolean),
            style: {
              position: "fixed",
              left: `${left}px`,
              top: `${top}px`,
              zIndex,
              minWidth: `${minWidth}px`,
            },
            onContextmenu: (e: MouseEvent) => e.preventDefault(),
          },
          items.flatMap((item, index) => {
            const nodes: VNode[] = [];
            if (item.divided && index > 0) {
              nodes.push(h("div", { class: "im-contextmenu-divider" }));
            }
            nodes.push(renderMenuItem(item, close));
            return nodes;
          })
        );
    },
  });

  activeMenu = { app, el };
  app.mount(el);
}

function renderMenuItem(item: ContextmenuItem, close: () => void): VNode {
  return h(
    "div",
    {
      class: ["im-contextmenu-item", item.customClass, item.disabled ? "is-disabled" : ""].filter(
        Boolean
      ),
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        if (item.disabled) return;
        item.onClick?.();
        close();
      },
    },
    [item.icon ? h(LegacyElIcon, { name: item.icon }) : null, h("span", item.label)]
  );
}

/** 注册全局 $contextmenu 方法 */
export function setupContextmenu(app: App): void {
  app.config.globalProperties.$contextmenu = showContextmenu;
}

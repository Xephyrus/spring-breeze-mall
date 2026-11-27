import type { App } from "vue";
import SvgIcon from "@/components/svg-icon/index.vue";

/**
 * 注册全局 svg-icon 组件。
 *
 * 图标本身由 `vite-plugin-svg-icons` 在构建时扫描 `src/icons/svg` 打成雪碧图，
 * 运行时通过 `import "virtual:svg-icons-register"`（见 main.js）注入 <symbol>，
 * symbolId 仍是 `icon-[name]`。
 */
export function registerIcons(app: App): void {
  app.component("svg-icon", SvgIcon);
}

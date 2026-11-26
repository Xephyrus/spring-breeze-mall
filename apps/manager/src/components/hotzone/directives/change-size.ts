import type { DirectiveBinding } from "vue";
import _, { type DealDirectionKey, type ZoneInfo, type ZoneRatio } from "../utils/index";

/** 热区组件实例上本指令用到的成员 */
type HotzoneInstance = {
  /** 当前热区比例配置 */
  setting: { topPer: number; leftPer: number };
  /** 当前热区下标 */
  index: number;
  /** 拖拽时隐藏辅助层 */
  handlehideZone: (hide: boolean) => void;
  /** 拖拽结束后回写比例 */
  changeInfo: (info: ZoneRatio) => void;
  $parent?: { zones: ZoneRatio[] };
};

/** 带卸载钩子的元素 */
type ResizableElement = HTMLElement & { __hotzoneResizeDestroy?: () => void };

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const handleMouseDown = (e: MouseEvent) => {
      const instance = binding.instance as unknown as HotzoneInstance | null;
      if (!instance) return;
      const ctx: HotzoneInstance = instance;

      const pointer = (e.target as HTMLElement).dataset.pointer as DealDirectionKey | undefined;

      if (!pointer) {
        return;
      }

      e.stopPropagation();

      const zone = el.parentNode as HTMLElement;
      const setting = ctx.setting;
      const currentIndex = ctx.index;
      const container = _.getOffset(zone.parentNode as HTMLElement);
      let itemInfo: ZoneInfo = {
        width: _.getOffset(zone).width || 0,
        height: _.getOffset(zone).height || 0,
        top: setting.topPer * container.height || 0,
        left: setting.leftPer * container.width || 0,
      };
      let preX = _.getPageX(e);
      let preY = _.getPageY(e);
      let flag = false;

      ctx.handlehideZone(true);

      window.addEventListener("mousemove", handleChange, { passive: false });
      window.addEventListener("mouseup", handleMouseUp, { passive: false });

      function handleChange(e: MouseEvent) {
        e.preventDefault();
        flag = true;

        const moveX = _.getPageX(e) - preX;
        const moveY = _.getPageY(e) - preY;

        preX = _.getPageX(e);
        preY = _.getPageY(e);

        const styleInfo = _[pointer as DealDirectionKey](itemInfo, moveX, moveY);
        itemInfo = _.dealEdgeValue(
          itemInfo,
          styleInfo,
          container,
          ctx.$parent?.zones ?? [],
          currentIndex
        );

        Object.assign(zone.style, {
          top: `${itemInfo.top}px`,
          left: `${itemInfo.left}px`,
          width: `${itemInfo.width}px`,
          height: `${itemInfo.height}px`,
        });
      }

      function handleMouseUp() {
        if (flag) {
          flag = false;
          const perInfo: ZoneRatio = {
            topPer: _.decimalPoint(itemInfo.top / container.height),
            leftPer: _.decimalPoint(itemInfo.left / container.width),
            widthPer: _.decimalPoint(itemInfo.width / container.width),
            heightPer: _.decimalPoint(itemInfo.height / container.height),
          };
          ctx.changeInfo(perInfo);

          Object.assign(zone.style, {
            top: `${itemInfo.top}px`,
            left: `${itemInfo.left}px`,
            width: `${itemInfo.width}px`,
            height: `${itemInfo.height}px`,
          });
        }
        ctx.handlehideZone(false);

        window.removeEventListener("mousemove", handleChange);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    };

    (el as ResizableElement).__hotzoneResizeDestroy = () =>
      el.removeEventListener("mousedown", handleMouseDown);
    el.addEventListener("mousedown", handleMouseDown, { passive: false });
  },
  beforeUnmount(el: HTMLElement) {
    (el as ResizableElement).__hotzoneResizeDestroy?.();
  },
};

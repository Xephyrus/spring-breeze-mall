import type { DirectiveBinding } from "vue";
import _, { type ZoneInfo } from "../utils/index";
import type { HotzoneAddInstance, HotzoneBoundElement, HotzoneSetting } from "../types";

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const handleMouseDown = (e: MouseEvent) => {
      const instance = binding.instance as unknown as HotzoneAddInstance | null;
      if (!instance) return;
      const ctx: HotzoneAddInstance = instance;

      e.preventDefault();

      let itemInfo: ZoneInfo = {
        top: _.getDistanceY(e, el),
        left: _.getDistanceX(e, el),
        width: 0,
        height: 0,
      };
      const container = _.getOffset(el);

      const setting: HotzoneSetting = {
        topPer: _.decimalPoint(itemInfo.top / container.height),
        leftPer: _.decimalPoint(itemInfo.left / container.width),
        widthPer: 0,
        heightPer: 0,
      };
      let preX = _.getPageX(e);
      let preY = _.getPageY(e);

      ctx.addItem(setting);

      window.addEventListener("mousemove", handleChange, { passive: false });
      window.addEventListener("mouseup", handleMouseUp, { passive: false });

      function handleChange(e: MouseEvent) {
        e.preventDefault();

        const moveX = _.getPageX(e) - preX;
        const moveY = _.getPageY(e) - preY;
        preX = _.getPageX(e);
        preY = _.getPageY(e);

        const minLimit = 0;
        const styleInfo = _.dealBR(itemInfo, moveX, moveY, minLimit);

        itemInfo = _.dealEdgeValue(itemInfo, styleInfo, container, ctx.zones);

        const preview = el.lastElementChild as HTMLElement | null;
        if (preview) {
          Object.assign(preview.style, {
            top: `${itemInfo.top}px`,
            left: `${itemInfo.left}px`,
            width: `${itemInfo.width}px`,
            height: `${itemInfo.height}px`,
          });
        }
      }

      function handleMouseUp() {
        const perInfo: HotzoneSetting = {
          topPer: _.decimalPoint(itemInfo.top / container.height),
          leftPer: _.decimalPoint(itemInfo.left / container.width),
          widthPer: _.decimalPoint(itemInfo.width / container.width),
          heightPer: _.decimalPoint(itemInfo.height / container.height),
          img: "",
          link: "",
          type: "",
          title: "",
        };

        if (ctx.isOverRange()) {
          ctx.overRange();
        } else if (container.height < _.MIN_LIMIT && itemInfo.width > _.MIN_LIMIT) {
          ctx.changeItem(
            Object.assign(perInfo, {
              topPer: 0,
              heightPer: 1,
            }),
            true
          );
        } else if (container.width < _.MIN_LIMIT && itemInfo.height > _.MIN_LIMIT) {
          ctx.changeItem(
            Object.assign(perInfo, {
              leftPer: 0,
              widthPer: 1,
            }),
            true
          );
        } else if (itemInfo.width > _.MIN_LIMIT && itemInfo.height > _.MIN_LIMIT) {
          ctx.changeItem(perInfo, true);
        } else {
          ctx.eraseItem();
        }

        window.removeEventListener("mousemove", handleChange);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    };

    (el as HotzoneBoundElement).__hotzoneAddDestroy = () =>
      el.removeEventListener("mousedown", handleMouseDown);
    el.addEventListener("mousedown", handleMouseDown, { passive: false });
  },
  beforeUnmount(el: HTMLElement) {
    (el as HotzoneBoundElement).__hotzoneAddDestroy?.();
  },
};

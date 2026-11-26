import type { DirectiveBinding } from "vue";
import _, { type ZoneInfo, type ZoneRatio } from "../utils/index";
import type { HotzoneBoundElement, HotzoneDragInstance, HotzoneSetting } from "../types";

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    let collision = false;
    const handleMouseDown = (e: MouseEvent) => {
      const instance = binding.instance as unknown as HotzoneDragInstance | null;
      if (!instance) return;
      const ctx: HotzoneDragInstance = instance;

      e.stopPropagation();
      const container = _.getOffset(el.parentNode as HTMLElement);
      const preX = _.getPageX(e);
      const preY = _.getPageY(e);
      let topPer = 0;
      let leftPer = 0;
      let flag = false;

      window.addEventListener("mousemove", handleChange, { passive: false });
      window.addEventListener("mouseup", handleMouseUp, { passive: false });

      function handleChange(e: MouseEvent) {
        e.preventDefault();
        flag = true;
        collision = false;
        ctx.handlehideZone(true);

        const setting = ctx.setting;
        const currentIndex = ctx.index;
        let moveX = _.getPageX(e) - preX;
        let moveY = _.getPageY(e) - preY;

        setting.topPer = setting.topPer || 0;
        setting.leftPer = setting.leftPer || 0;
        topPer = _.decimalPoint(moveY / container.height + setting.topPer);
        leftPer = _.decimalPoint(moveX / container.width + setting.leftPer);

        if (topPer < 0) {
          topPer = 0;
          moveY = -container.height * setting.topPer;
        }

        if (leftPer < 0) {
          leftPer = 0;
          moveX = -container.width * setting.leftPer;
        }

        if (topPer + setting.heightPer > 1) {
          topPer = 1 - setting.heightPer;
          moveY = container.height * (topPer - setting.topPer);
        }

        if (leftPer + setting.widthPer > 1) {
          leftPer = 1 - setting.widthPer;
          moveX = container.width * (leftPer - setting.leftPer);
        }

        const zones = ctx.$parent?.zones ?? [];
        if (zones.length > 1) {
          const currentzones = (JSON.parse(JSON.stringify(zones)) as ZoneRatio[]).map((zone) => ({
            left: (zone.leftPer || 0) * container.width,
            top: (zone.topPer || 0) * container.height,
            width: (zone.widthPer || 0) * container.width,
            height: (zone.heightPer || 0) * container.height,
          }));
          const changeSetting: ZoneInfo = {
            left: setting.leftPer * container.width + moveX,
            top: setting.topPer * container.height + moveY,
            width: setting.widthPer * container.width,
            height: setting.heightPer * container.height,
          };
          for (let i = 0, len = currentzones.length; i < len; i++) {
            if (currentIndex !== i && _.handleEgdeCollisions(currentzones[i], changeSetting)) {
              collision = true;
              break;
            }
          }
        }
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }

      function handleMouseUp() {
        if (flag) {
          flag = false;
          el.style.transform = "translate(0, 0)";
          if (!collision) {
            const patch: Partial<HotzoneSetting> = { topPer, leftPer };
            ctx.changeInfo(patch);
          }
        }

        ctx.handlehideZone(false);

        window.removeEventListener("mousemove", handleChange);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    };

    (el as HotzoneBoundElement).__hotzoneDragDestroy = () =>
      el.removeEventListener("mousedown", handleMouseDown);
    el.addEventListener("mousedown", handleMouseDown);
  },
  beforeUnmount(el: HTMLElement) {
    (el as HotzoneBoundElement).__hotzoneDragDestroy?.();
  },
};

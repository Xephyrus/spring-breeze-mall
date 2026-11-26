<template>
  <div
    class="tpl-line"
    :style="{
      background: lineBg,
      padding: `0 ${px(res.paddingX ?? 0)}`,
      marginBottom: px(res.pageGap ?? 0),
    }"
  >
    <div
      :style="{
        borderTop: `${Math.max(1, (Number(res.lineHeight ?? 1) || 1) / 2)}px ${res.lineStyle ?? 'dashed'} ${res.lineColor ?? '#979797'}`,
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;

defineOptions({ name: "tpl_line" });

const props = withDefaults(
  defineProps<{ res?: Record<string, unknown> }>(),
  { res: () => ({}) }
);

const lineBg = computed(() => {
  const res = props.res || {};
  if (res.bgColor1 !== undefined) {
    return !res.bgColor2 || res.bgColor1 === res.bgColor2
      ? String(res.bgColor1)
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  }
  return String(res.bgColor || "#FFFFFF");
});
</script>
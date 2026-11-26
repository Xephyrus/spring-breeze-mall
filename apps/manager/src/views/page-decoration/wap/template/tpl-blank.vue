<template>
  <div
    class="tpl-blank"
    :style="{
      background: blankBg,
      height: px(res.height ?? 10),
      margin: `0 ${px(res.paddingX ?? 0)} ${px(res.pageGap ?? 0)}`,
    }"
  ></div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;

defineOptions({ name: "tpl_blank" });

const props = withDefaults(
  defineProps<{ res?: Record<string, unknown> }>(),
  { res: () => ({}) }
);

const blankBg = computed(() => {
  const res = props.res || {};
  if (res.bgColor1 !== undefined) {
    return !res.bgColor2 || res.bgColor1 === res.bgColor2
      ? String(res.bgColor1)
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  }
  return String(res.bgColor || "#f5f5f5");
});
</script>
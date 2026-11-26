<template>
  <div
    class="tpl-rich-text"
    :style="{
      background: richBg,
      padding: `0 ${px(res.paddingX ?? 12)}`,
      marginBottom: px(res.pageGap ?? 0),
      borderRadius: px(res.borderRadius ?? 0),
      overflow: 'hidden',
    }"
  >
    <div class="rich-content" v-html="res.content ?? ''"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;

defineOptions({ name: "tpl_rich_text" });

const props = withDefaults(
  defineProps<{ res?: Record<string, unknown> }>(),
  { res: () => ({}) }
);

const richBg = computed(() => {
  const res = props.res || {};
  if (res.bgColor1 !== undefined) {
    return !res.bgColor2 || res.bgColor1 === res.bgColor2
      ? String(res.bgColor1)
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  }
  return String(res.bgColor || "#FFFFFF");
});
</script>

<style scoped lang="scss">
.rich-content {
  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>
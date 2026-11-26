<template>
  <span :style="priceStyle">
    {{ dot }}{{ displayText }}
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, type CSSProperties } from "vue";
import { unitPrice } from "@/utils/filters";

defineOptions({ name: "priceColorScheme" });

const props = withDefaults(
  defineProps<{
    value?: number | string | null;
    unit?: string;
    dot?: string;
    color?: string;
    customStyle?: CSSProperties;
  }>(),
  {
    value: 0,
    unit: "￥",
    dot: "",
    color: "",
    customStyle: () => ({}),
  }
);

const { proxy } = getCurrentInstance()!;

const displayText = computed(() => {
  const val = props.value;
  if (val === null || val === undefined || val === "" || val === "null") {
    return `${props.unit || "￥"}0.00`;
  }
  return unitPrice(val, props.unit);
});

const priceStyle = computed(() => {
  const resolvedColor = props.color || (proxy as { $mainColor?: string })?.$mainColor || "";
  return resolvedColor
    ? { color: resolvedColor, ...props.customStyle }
    : { ...props.customStyle };
});
</script>

<template>
  <div class="ctrl-row">
    <div class="ctrl-label">{{ label }}</div>
    <div class="ctrl-body">
      <el-radio-group
        :model-value="modelValue"
        @update:model-value="onInput"
      >
        <el-radio-button
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          >{{ opt.label }}</el-radio-button
        >
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SegmentField" });

withDefaults(
  defineProps<{
    modelValue?: string;
    options?: Array<{ label: string; value: string }>;
    label?: string;
  }>(),
  {
    modelValue: "",
    options: () => [],
    label: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function onInput(val: string | number | boolean | undefined) {
  emit("update:modelValue", String(val ?? ""));
}
</script>

<style scoped lang="scss">
@import "./field-common.scss";
</style>

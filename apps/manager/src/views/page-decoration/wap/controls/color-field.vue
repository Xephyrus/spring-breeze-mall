<template>
  <div class="ctrl-row">
    <div class="ctrl-label">{{ label }}</div>
    <div class="ctrl-body">
      <el-color-picker
        :model-value="modelValue"
        @update:model-value="onInput"
      />
      <el-input
        :model-value="modelValue"
        class="ctrl-color-input"
        placeholder="#FFFFFF"
        @update:model-value="onInput"
      />
      <el-button link type="primary" @click="onReset">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "ColorField" });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    defaultValue?: string;
    label?: string;
  }>(),
  {
    modelValue: "",
    defaultValue: "",
    label: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function onInput(val: string | null) {
  emit("update:modelValue", val ?? "");
}

function onReset() {
  emit("update:modelValue", props.defaultValue);
}
</script>

<style scoped lang="scss">
@import "./field-common.scss";
</style>

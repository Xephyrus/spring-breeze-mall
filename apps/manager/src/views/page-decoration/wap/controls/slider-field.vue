<template>
  <div class="ctrl-row">
    <div class="ctrl-label">
      {{ label }}
      <span v-if="hint" class="ctrl-hint">{{ hint }}</span>
    </div>
    <div class="ctrl-body">
      <el-slider
        class="ctrl-slider"
        :model-value="modelValue"
        :min="min"
        :max="max"
        @update:model-value="onInput"
      />
      <el-input-number
        class="ctrl-number"
        :model-value="modelValue"
        :min="min"
        :max="max"
        @update:model-value="onInput"
      />
      <span v-if="unit" class="ctrl-unit">{{ unit }}</span>
      <!-- rpx 是 750 设计稿单位，375 宽画布上要折半，这里直接标出实际像素 -->
      <span v-if="unit === 'rpx'" class="ctrl-converted">
        ≈ {{ (Number(modelValue) || 0) / 2 }}px
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SliderField" });

withDefaults(
  defineProps<{
    modelValue?: number;
    min?: number;
    max?: number;
    label?: string;
    /** 单位：rpx（750 设计稿）或 px；rpx 会自动显示折算后的实际像素 */
    unit?: string;
    /** 标签下方的补充说明 */
    hint?: string;
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    label: "",
    unit: "",
    hint: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

function onInput(val: number | number[] | undefined) {
  const next = Array.isArray(val) ? val[0] : val;
  emit("update:modelValue", Number(next ?? 0));
}
</script>

<style scoped lang="scss">
@import "./field-common.scss";

.ctrl-body {
  flex-wrap: nowrap;
}

.ctrl-slider {
  flex: 1;
  min-width: 0;
}

.ctrl-number {
  width: 130px;
  flex-shrink: 0;
}

.ctrl-hint {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  font-weight: normal;
  color: #a8abb2;
}

.ctrl-unit {
  margin-left: 6px;
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.ctrl-converted {
  margin-left: 4px;
  font-size: 12px;
  color: #409eff;
  flex-shrink: 0;
}
</style>

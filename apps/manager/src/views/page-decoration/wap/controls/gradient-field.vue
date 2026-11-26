<template>
  <div class="ctrl-row">
    <div class="ctrl-label">{{ label }}</div>
    <div class="ctrl-body gradient-body">
      <div class="gradient-row">
        <el-color-picker
          :model-value="start"
          @update:model-value="emit('update:start', $event ?? '')"
        />
        <el-input
          :model-value="start"
          class="ctrl-color-input"
          placeholder="#FFFFFF"
          @update:model-value="emit('update:start', $event ?? '')"
        />
        <el-button link type="primary" @click="emit('update:start', defaultStart)">重置</el-button>
      </div>
      <div class="gradient-row">
        <el-color-picker
          :model-value="end"
          @update:model-value="emit('update:end', $event ?? '')"
        />
        <el-input
          :model-value="end"
          class="ctrl-color-input"
          placeholder="#FFFFFF"
          @update:model-value="emit('update:end', $event ?? '')"
        />
        <el-button link type="primary" @click="emit('update:end', defaultEnd)">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "GradientField" });

withDefaults(
  defineProps<{
    start?: string;
    end?: string;
    defaultStart?: string;
    defaultEnd?: string;
    label?: string;
  }>(),
  {
    start: "",
    end: "",
    defaultStart: "",
    defaultEnd: "",
    label: "背景颜色",
  }
);

const emit = defineEmits<{
  (e: "update:start", value: string): void;
  (e: "update:end", value: string): void;
}>();
</script>

<style scoped lang="scss">
@import "./field-common.scss";

.gradient-body {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.gradient-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;

  // 两个色板之间的连接线（对齐色板中心）
  & + .gradient-row::before {
    content: "";
    position: absolute;
    left: 15px;
    top: -14px;
    width: 2px;
    height: 10px;
    background: #dcdfe6;
  }
}
</style>

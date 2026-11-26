<template>
  <div class="panel-free-layout">
    <div class="panel-section">
      <div class="section-title">自由画布容器设置</div>
      <div class="form-item flex-row">
        <span class="item-label">容器固定高度 (px)</span>
        <el-input-number
          v-model="local.height"
          :min="100"
          :max="1000"
          :step="20"
          size="small"
          controls-position="right"
        />
      </div>
      <div class="layout-hint">
        当前自由布局容器内已包含 {{ (local.elements ?? []).length }} 个绝对定位元素。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";

/** 自由布局容器配置 */
type PanelOptions = {
  /** 容器固定高度（px，这里是真实像素，不走 rpx 折半） */
  height?: number | null;
  elements?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

const props = defineProps<{
  component?: unknown;
  options?: PanelOptions;
}>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 props.options 的浅拷贝，之后单向 local -> emit -> 父组件。
 */
const local = reactive<PanelOptions>({ ...(props.options ?? {}) });

watch(
  local,
  () => {
    emit("update:options", { ...local });
  },
  { deep: true }
);

onMounted(() => {
  emit("update:options", { ...local });
});
</script>

<style lang="scss" scoped>
.panel-free-layout {
  .panel-section {
    margin-bottom: 20px;
    padding-bottom: 16px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .form-item {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .item-label {
        font-size: 12px;
        color: #475569;
      }
    }

    .layout-hint {
      margin-top: 10px;
      font-size: 12px;
      color: #64748b;
    }
  }
}
</style>

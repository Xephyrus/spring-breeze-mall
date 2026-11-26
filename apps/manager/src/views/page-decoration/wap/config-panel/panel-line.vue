<template>
  <div class="panel-line">
    <div class="panel-header">
      <span class="panel-name">{{ res.name }}</span>
    </div>

    <div class="panel-card">
      <div class="section-title">颜色设置</div>
      <gradient-field
        v-model:start="local.bgColor1"
        v-model:end="local.bgColor2"
        :default-start="defaults.bgColor1"
        :default-end="defaults.bgColor2"
      />
      <color-field
        v-model="local.lineColor"
        label="线条颜色"
        :default-value="defaults.lineColor"
      />
    </div>

    <div class="panel-card panel-card-fill">
      <div class="section-title">样式设置</div>
      <segment-field
        v-model="local.lineStyle"
        label="线条样式"
        :options="lineStyleOptions"
      />
      <slider-field v-model="local.lineHeight" label="线条高度" :min="1" :max="100" unit="rpx" />
      <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
      <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import ColorField from "../controls/color-field.vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";
import SegmentField from "../controls/segment-field.vue";

const DEFAULTS = {
  bgColor: "#FFFFFF",
  bgColor1: "#FFFFFF",
  bgColor2: "#FFFFFF",
  lineColor: "#979797",
  lineStyle: "dashed",
  lineHeight: 1,
  paddingX: 0,
  pageGap: 0,
};

defineOptions({ name: "PanelLine", hideDecorateTitle: true });

/** 辅助线配置（与 tpl_line.vue 读取的字段对应） */
type PanelOptions = {
  bgColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  lineColor?: string;
  lineStyle?: string;
  /** 线条粗细，单位 rpx */
  lineHeight?: number;
  paddingX?: number;
  pageGap?: number;
};

const props = defineProps<{
  res: { name?: string; options?: PanelOptions };
}>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时以 DEFAULTS 打底，再叠加 props.res.options，
 * 之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
const local = reactive<PanelOptions>({ ...DEFAULTS, ...(props.res.options ?? {}) });

watch(
  local,
  () => {
    emit("update:options", { ...local });
  },
  { deep: true }
);

// 首次挂载同步一次，确保默认值也写进组件配置（老数据缺字段时补齐）
onMounted(() => {
  emit("update:options", { ...local });
});

/** 可选线型 */
const lineStyleOptions = ref([
  { label: "虚线", value: "dashed" },
  { label: "实线", value: "solid" },
  { label: "点状线", value: "dotted" },
]);

/** 设计默认值，供各控件显示「默认」提示 */
const defaults = DEFAULTS;

// 原有 ctx 脚手架已移除：面板统一用 props + 本地副本 + emit

</script>

<style scoped lang="scss">
@import "../controls/panel-common.scss";

.panel-line {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}
</style>

<template>
  <div class="panel-blank">
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
    </div>

    <div class="panel-card">
      <div class="section-title">高度设置</div>
      <slider-field
        v-model="local.height"
        label="空白高度"
        hint="750 宽设计稿单位，实际渲染为填写值的一半"
        unit="rpx"
        :min="1"
        :max="200"
      />
    </div>

    <div class="panel-card panel-card-fill">
      <div class="section-title">边距设置</div>
      <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
      <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";

/** 辅助空白的面板配置（与 tpl_blank.vue 读取的字段一一对应） */
type BlankOptions = {
  bgColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  /** 空白高度，单位 rpx（750 设计稿），渲染时折半 */
  height?: number;
  paddingX?: number;
  pageGap?: number;
};

const DEFAULTS: Required<BlankOptions> = {
  bgColor: "#f5f5f5",
  bgColor1: "#f5f5f5",
  bgColor2: "#f5f5f5",
  height: 10,
  paddingX: 0,
  pageGap: 0,
};

defineOptions({ name: "PanelBlank", hideDecorateTitle: true });

const props = defineProps({
  res: { type: Object, required: true },
});

const emit = defineEmits<{ "update:options": [patch: Partial<BlankOptions>] }>();

/**
 * 本地副本：以 DEFAULTS 打底，再叠加 props.res.options，
 * 之后单向 local -> emit -> 父组件。
 */
const local = reactive<BlankOptions>({
  ...DEFAULTS,
  ...((props.res.options ?? {}) as BlankOptions),
});

const defaults = DEFAULTS;

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

<style scoped lang="scss">
@import "../controls/panel-common.scss";

.panel-blank {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}
</style>

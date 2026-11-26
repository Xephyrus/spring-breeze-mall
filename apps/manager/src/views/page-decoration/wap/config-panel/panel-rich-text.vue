<template>
  <div class="panel-rich-text">
    <div class="panel-header">
      <span class="panel-name">{{ res.name }}</span>
      <div class="panel-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="panel-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.title }}
        </div>
      </div>
    </div>

    <template v-if="activeTab === 'content'">
      <div class="panel-card panel-card-fill">
        <div class="section-title">富文本内容</div>
        <editor v-model="local.content" :height="editorHeight" />
      </div>
    </template>

    <template v-else>
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
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, watch } from "vue";
import editor from "@/components/editor/index.vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";

const DEFAULTS = {
  content: "",
  bgColor: "#FFFFFF",
  bgColor1: "#FFFFFF",
  bgColor2: "#FFFFFF",
  paddingX: 12,
  pageGap: 0,
  borderRadius: 0,
};

defineOptions({ name: "PanelRichText", hideDecorateTitle: true });

/** 富文本配置（与 tpl_rich_text.vue 读取的字段对应） */
/**
 * 富文本内容归一：历史数据里出现过 \" 这种"被多转义一层"的引号，
 * 直接持久化会让 JSON.stringify 之后变成 \\\"，把整份 page_data 弄成非法 JSON。
 */
function normalizeContent(html: unknown): string {
  if (typeof html !== "string") return "";
  return html.replace(/\\"/g, '"');
}

type PanelOptions = {
  content?: string;
  bgColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  paddingX?: number;
  pageGap?: number;
  borderRadius?: number;
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
const local = reactive<PanelOptions>({
  ...DEFAULTS,
  ...(props.res.options ?? {}),
});
local.content = normalizeContent(local.content);

watch(
  local,
  () => {
    // 上报前再归一一次：编辑器插入图片时可能带入 " 这种多转义引号
    emit("update:options", { ...local, content: normalizeContent(local.content) });
  },
  { deep: true }
);

// 首次挂载同步一次，确保默认值也写进组件配置（老数据缺字段时补齐）
onMounted(() => {
  emit("update:options", { ...local });
});

/**
 * 编辑器高度跟随窗口：右侧面板高度有限，固定 300px 会显得很挤；
 * 这里给一个随视口变化的像素值（tinymce 只接受具体尺寸）。
 */
const editorHeight = ref("420px");
function syncEditorHeight() {
  editorHeight.value = `${Math.max(360, window.innerHeight - 320)}px`;
}
syncEditorHeight();

/* data */
onMounted(() => {
  syncEditorHeight();
  window.addEventListener("resize", syncEditorHeight);
});
onUnmounted(() => {
  window.removeEventListener("resize", syncEditorHeight);
});

/** 设计默认值，供各控件显示「默认」提示 */
const defaults = DEFAULTS;

const activeTab = ref<"content" | "style">("content");
const tabs = ref<Array<{ key: "content" | "style"; title: string }>>([
  { key: "content", title: "内容" },
  { key: "style", title: "样式" },
]);

// 原有 ctx 脚手架已移除：面板统一用 props + 本地副本 + emit

</script>

<style scoped lang="scss">
@import "../controls/panel-common.scss";

.panel-rich-text {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;

  // 编辑器卡片撑满剩余高度，避免编辑区被压扁
  .panel-card-fill {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  // tinymce 容器与内容区自适应宽度，禁止横向滚动
  :deep(.tinymce-container) {
    width: 100%;
    overflow-x: hidden;
  }
  :deep(.tox-tinymce) {
    border-radius: 8px;
    width: 100% !important;
  }
  :deep(.tox .tox-editor-container),
  :deep(.tox .tox-edit-area) {
    width: 100%;
  }
  :deep(.tox .tox-toolbar-overlord) {
    overflow-x: hidden;
  }
}
</style>

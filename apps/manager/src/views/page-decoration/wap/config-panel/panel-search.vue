<template>
  <div class="panel-search">
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
      <div class="panel-card">
        <div class="section-title">提示文字设置</div>
        <div class="field-row">
          <div class="field-label">提示文字</div>
          <el-input
            v-model="local.list[0].title"
            size="default"
            maxlength="20"
            placeholder="搜索商品名称"
          />
        </div>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">搜索热词</div>
        <div class="hot-word" v-for="(word, index) in local.hotWords" :key="index">
          <el-input
            v-model="local.hotWords[index]"
            size="default"
            maxlength="10"
            placeholder="选填，不超过十个字"
          />
          <el-icon class="del" @click="removeWord(index)"><CircleClose /></el-icon>
        </div>
        <el-button class="add-btn" plain type="primary" @click="addWord">
          + 添加热词
        </el-button>
        <div class="field-row interval-row">
          <div class="field-label">切换时间</div>
          <el-input-number
            class="interval-input"
            v-model="local.hotInterval"
            :min="1"
            :max="60"
            size="default"
            controls-position="right"
          />
          <span class="unit">秒</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">文本位置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">文本位置</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: local.textAlign !== 'center' }"
                @click="local.textAlign = 'left'"
              >
                居左
              </div>
              <div
                class="seg-item"
                :class="{ active: local.textAlign === 'center' }"
                @click="local.textAlign = 'center'"
              >
                居中
              </div>
            </div>
          </div>
        </div>
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
          v-model="local.boxColor"
          label="框体颜色"
          :default-value="defaults.boxColor"
        />
        <color-field
          v-model="local.textColor"
          label="输入文字颜色"
          :default-value="defaults.textColor"
        />
      </div>

      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="20" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.boxRadius" label="内容圆角" :min="0" :max="30" unit="rpx" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import ColorField from "../controls/color-field.vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";
import { CircleClose } from "@element-plus/icons-vue";

defineOptions({ name: "PanelSearch", hideDecorateTitle: true });

/** 搜索框配置 */
type PanelOptions = {
  /** 列表项（搜索框提示文字） */
  list: Array<{ title?: string; [key: string]: unknown }>;
  /** 热搜词（面板里 push/splice 编辑；初始化时保证是数组） */
  hotWords: string[];
  hotInterval?: number;
  textAlign?: string;
  textColor?: string;
  boxColor?: string;
  boxRadius?: number;
  bgColor1?: string;
  bgColor2?: string;
  borderRadius?: number;
  paddingX?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 props.res.options 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/**
 * 本地副本：必须保留组件已有的搜索配置（不能初始化成空数组，否则面板一打开就清空画布）。
 * hotWords 老数据可能是字符串或缺失，统一成数组再编辑。
 */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
  hotWords: Array.isArray(props.res.options?.hotWords) ? props.res.options.hotWords : [],
});
if (!local.list.length) {
  local.list = [{ title: "搜索" }];
}
if (!Array.isArray(local.hotWords)) {
  local.hotWords = [];
}

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
// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, unknown> = {};

const defaults = ref<Record<string, string>>(DEFAULTS as Record<string, string>);
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);

function addWord() {
      local.hotWords.push("");
    
}

function removeWord(index: number) {
      local.hotWords.splice(index, 1);
    
}

</script>

<style scoped lang="scss">
@import "../controls/field-common.scss";
@import "../controls/panel-common.scss";
.panel-search {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  margin-bottom: 12px;
  padding: 0 14px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  .panel-name {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }
}
.panel-tabs {
  display: inline-flex;
  background: #f4f4f5;
  border-radius: 8px;
  padding: 3px;
  .panel-tab {
    padding: 5px 14px;
    font-size: 13px;
    border-radius: 6px;
    cursor: pointer;
    color: #606266;
    transition: all 0.2s ease;
    &.active {
      background: #ffffff;
      color: #409eff;
      font-weight: 600;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
  }
}
.panel-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}
.field-row {
  display: flex;
  align-items: center;
  .field-label {
    font-size: 14px;
    color: #606266;
    margin-right: 10px;
    flex-shrink: 0;
  }
}
.hot-word {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  .del {
    cursor: pointer;
    color: #909399;
    font-size: 18px;
    flex-shrink: 0;
    &:hover {
      color: #e1251b;
    }
  }
}
.add-btn {
  width: 100%;
  margin-bottom: 14px;
}
.interval-row {
  .interval-input {
    flex: 1;
    min-width: 0;
    :deep(.el-input__inner) {
      text-align: center;
    }
  }
  .unit {
    margin-left: 8px;
    font-size: 13px;
    color: #909399;
  }
}
</style>

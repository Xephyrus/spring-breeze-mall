<template>
  <div class="panel-flex-one">
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
        <div class="section-title">内容设置</div>
        <div class="img-preview" v-if="item.img">
          <img :src="item.img" alt="" />
        </div>
        <div class="img-placeholder" v-else>尺寸不限</div>
        <div class="btn-row">
          <el-button plain type="primary" @click="pickImage">选择照片</el-button>
          <el-button plain type="primary" @click="openHotzone">绘制热区</el-button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">颜色设置</div>
        <color-field
          v-model="local.bgColor"
          label="背景颜色"
          :default-value="defaults.bgColor"
        />
      </div>
      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field
          v-model="local.paddingTop"
          label="上边距"
          :min="0"
          :max="100"
          unit="rpx"
        />
        <slider-field
          v-model="local.paddingBottom"
          label="下边距"
          :min="0"
          :max="100"
          unit="rpx"
        />
        <slider-field
          v-model="local.paddingX"
          label="左右边距"
          :min="0"
          :max="40"
          unit="rpx"
        />
        <slider-field
          v-model="local.pageGap"
          label="页面间距"
          :min="0"
          :max="100"
          unit="rpx"
        />
      </div>
      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field
          v-model="local.borderRadius"
          label="背景圆角"
          :min="0"
          :max="30"
          unit="rpx"
        />
        <slider-field
          v-model="local.imgRadius"
          label="内容圆角"
          :min="0"
          :max="30"
          unit="rpx"
        />
      </div>
    </template>

    <hotzone ref="hotzoneRef" @changeZone="changeZone"></hotzone>

    <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <!-- 选择器由 props 驱动：打开时 initialize=true，mediaType 固定为图片 -->
      <ossManage
        @callback="callbackSelected"
        :is-component="true"
        :initialize="picModelFlag"
        :media-type="'IMAGE'"
        :max-select="1"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import hotzone from "@/components/hotzone/index";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { ElMessage } from "element-plus";

defineOptions({ name: "PanelFlexOne", hideDecorateTitle: true });

// 模板 ref 必须指向真正的 ref 变量；原先 ref="hotzone" 与导入的组件同名，
// 运行时写 setup state 会抛 "set on proxy: trap returned falsish"
const hotzoneRef = ref<{ open?: (item: unknown) => void } | null>(null);

/** 单图列表项 */
type FlexOneItem = {
  img?: string;
  url?: string;
  link?: string;
  title?: string;
  size?: string;
  /** 模板编号 / 跳转模型 */
  model?: string;
  /** 热区数据 */
  zoneInfo?: unknown;
};

/** 面板配置 */
type PanelOptions = {
  list: FlexOneItem[];
  bgColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  pageGap?: number;
  borderRadius?: number;
  imgRadius?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, unknown> = {};

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。

const defaults = ref<Record<string, string>>(DEFAULTS as Record<string, string>);
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);
const picModelFlag = ref(false);

const item = computed(() => {
      return local.list?.[0];
    });

/** 打开素材选择器（图片魔方只支持图片） */
function pickImage() {
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url) {
        item.value.img = val.url;
      }
    
}

/** 打开热区绘制：通过模板 ref 调用子组件暴露的方法（组件已 defineExpose({ open })） */
function openHotzone() {
  if (!item.value.img) {
    ElMessage.warning("请先选择照片");
    return;
  }
  hotzoneRef.value?.open?.(item.value);
}

function changeZone(zoneInfo: unknown[]) {
      item.value.zoneInfo = zoneInfo;
    
}

/**
 * 本地副本：初始化时取 local 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/**
 * 本地副本：取组件当前配置的浅拷贝。
 *
 * 注意 list 的写法：**必须保留组件已有的条目**。
 * 早期写成 `{ ...options, list: [] }` 会把已有图片/条目覆盖成空数组 ——
 * 面板一打开就"没有内容"，watch 上报后还会把画布上的内容一起清掉。
 */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
});

if (!Array.isArray(local.list) || !local.list.length) {
  local.list = [
    { img: "", url: "", link: "", size: "750*280", model: "hotzone" },
  ];
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

</script>

<style scoped lang="scss">
@import "../controls/panel-common.scss";
.panel-flex-one {
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
.panel-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
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
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}
.section-tip {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}
.img-preview {
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 10px;
  img {
    width: 100%;
    display: block;
    border-radius: 4px;
  }
}
.img-placeholder {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 10px;
}
.btn-row {
  display: flex;
  gap: 10px;
}
</style>

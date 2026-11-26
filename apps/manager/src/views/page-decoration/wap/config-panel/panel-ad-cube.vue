<template>
  <div class="panel-ad-cube">
    <div class="panel-header">
      <span class="panel-name">图片魔方</span>
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
        <div class="section-title">图片设置</div>
        <div class="section-tip">当前风格：{{ res.name }}，请按布局区域配置对应图片</div>
        <div class="img-item" v-for="(item, index) in local.list" :key="index">
          <div class="img-item-head">
            <span>图片 {{ index + 1 }}</span>
            <span class="img-size" v-if="item.size">建议尺寸 {{ item.size }}</span>
          </div>
          <div class="img-preview" v-if="item.img">
            <img :src="item.img" alt="" />
          </div>
          <div class="img-placeholder" v-else>尺寸 {{ item.size || "不限" }}</div>
          <div class="field-row" v-if="item.title !== undefined">
            <div class="field-label">文字</div>
            <el-input v-model="item.title" maxlength="10" />
          </div>
          <div class="btn-row">
            <el-button plain type="primary" @click="pickImage(item)">选择照片</el-button>
            <el-button plain type="primary" @click="pickLink(item)">选择链接</el-button>
          </div>
          <div class="link-view" v-if="item.url && item.url.___type">
            已选链接：{{ linkText(item.url) }}
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">风格选择</div>
        <div class="section-tip">切换风格将重置当前已配置的图片内容</div>
        <div class="style-grid">
          <div
            v-for="style in styleList"
            :key="style.type"
            class="style-item"
            :class="{ active: res.type === style.type }"
            @click="changeStyle(style)"
          >
            {{ style.name }}
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
      </div>

      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingTop" label="上边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingBottom" label="下边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.contentGap" label="内容间距" :min="0" :max="20" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.imgRadius" label="内容圆角" :min="0" :max="30" unit="rpx" />
      </div>
    </template>

    <liliDialog ref="linkDialogRef" @selectedLink="selectedLink"></liliDialog>

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
import { modelData } from "../config";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";

defineOptions({ name: "PanelAdCube", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

/** 可切换的风格项（来自 modelData） */
type CubeStyle = { type?: string; name?: string; drawer?: unknown };

/** 魔方里的一个格子 */
type CubeCell = {
  img?: string;
  title?: string;
  /** 展示尺寸文案，如 375*187 */
  size?: string;
  /** 链接对象 */
  url?: { ___type?: string; url?: string; title?: string; [key: string]: unknown };
  link?: string;
  model?: string;
};

/** 面板配置 */
type PanelOptions = {
  list: CubeCell[];
  bgColor1?: string;
  bgColor2?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  contentGap?: number;
  pageGap?: number;
  borderRadius?: number;
  imgRadius?: number;
};

const props = defineProps<{ res: { name?: string; type?: string; options?: PanelOptions } }>();

const emit = defineEmits<{
  "update:options": [patch: Partial<PanelOptions>];
  /** 请求装修器切换模板（魔方风格） */
  handleDrawer: [style: CubeStyle];
}>();

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
const currentItem = ref<CubeCell | null>(null);

/** 图片魔方的可选风格：config 里用 drawer 标记的那批组件 */
const styleList = computed(() => modelData.filter((m: { drawer?: unknown }) => m.drawer));

function linkText(url: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      const way = ways.find((e) => e.name === url.___type);
      const typeTitle = way ? way.title : "发现";
      const name =
        url.name || url.goodsName || url.memberName || url.title || "";
      return name ? `${typeTitle} - ${name}` : typeTitle;
    
}

/**
 * 切换魔方风格：需要通知装修器替换模板。
 * 原来这里写的是 `undefined.emit("handleDrawer", style)` —— 一点就崩，
 * 改为通过 defineEmits 声明的事件往外发。
 */
function changeStyle(style: CubeStyle) {
  if (style.type === props.res.type) return;
  emit("handleDrawer", style);
}

/** 打开素材选择器（只选图片），目标条目记在 currentItem 上 */
function pickImage(item: CubeCell) {
  currentItem.value = item;
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url && currentItem.value) {
        currentItem.value.img = val.url;
      }
    
}

function pickLink(item: CubeCell) {
  currentItem.value = item;
  linkDialogRef.value?.openPicker("link");
}

function selectedLink(val: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      if (!currentItem.value) return;
      delete val.selected;
      delete val.intro;
      delete val.mobileIntro;
      currentItem.value.url = val;
    
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
.panel-ad-cube {
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
.section-tip {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}
.img-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  .img-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: #303133;
    margin-bottom: 8px;
    .img-size {
      font-size: 12px;
      color: #909399;
    }
  }
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
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 10px;
}
.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .field-label {
    font-size: 14px;
    color: #606266;
    margin-right: 10px;
    flex-shrink: 0;
  }
}
.btn-row {
  display: flex;
  gap: 10px;
}
.link-view {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  .style-item {
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 10px 4px;
    text-align: center;
    font-size: 12px;
    color: #606266;
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
    &.active {
      border-color: #409eff;
      background: #ecf5ff;
      color: #409eff;
      font-weight: 600;
    }
  }
}
</style>

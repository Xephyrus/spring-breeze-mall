<template>
  <div class="panel-video">
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
        <div class="section-title">视频内容设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">上传视频</div>
          <div class="ctrl-body">
            <div class="upload-state" :class="{ filled: item.videoUrl }">
              {{ item.videoUrl ? "已选择视频" : "未选择视频" }}
            </div>
            <el-button plain type="primary" @click="pickFile('videoUrl')">
              {{ item.videoUrl ? "重新选择" : "上传视频" }}
            </el-button>
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">视频封面</div>
          <div class="ctrl-body">
            <div class="cover-preview" v-if="item.poster">
              <img :src="item.poster" alt="" />
            </div>
            <div class="cover-placeholder" v-else>封面</div>
            <el-button plain type="primary" @click="pickFile('poster')">
              {{ item.poster ? "重新选择" : "上传封面" }}
            </el-button>
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">自动播放</div>
          <div class="ctrl-body">
            <el-switch v-model="item.autoplay" />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">画面比例</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in aspectOptions"
                :key="opt"
                class="seg-item"
                :class="{ active: (item.aspectRatio || '16:9') === opt }"
                @click="item.aspectRatio = opt"
              >
                {{ opt }}
              </div>
            </div>
          </div>
        </div>
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
        <slider-field v-model="local.paddingTop" label="上边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingBottom" label="下边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.imgRadius" label="内容圆角" :min="0" :max="30" unit="rpx" />
      </div>
    </template>

    <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <!-- 选择器由 props 驱动：打开时 initialize=true，按 mediaType 决定图片/视频 -->
      <ossManage
        @callback="callbackSelected"
        :is-component="true"
        :initialize="picModelFlag"
        :media-type="pickerMediaType"
        :max-select="1"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";

defineOptions({ name: "PanelVideo", hideDecorateTitle: true });

/** 视频项 */
type VideoItem = {
  videoUrl?: string;
  coverUrl?: string;
  /** 视频封面（模板里用 poster 绑定） */
  poster?: string;
  img?: string;
  url?: string;
  title?: string;
  /** 宽高比 */
  aspectRatio?: string;
  /** 自动播放 / 循环 / 控件 */
  autoplay?: boolean | string | number;
  loop?: boolean | string | number;
  controls?: boolean | string | number;
};

/** 面板配置 */
type PanelOptions = {
  list: VideoItem[];
  bgColor1?: string;
  bgColor2?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  pageGap?: number;
  borderRadius?: number;
  imgRadius?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 props.res.options 的浅拷贝，之后单向 local -> emit -> 父组件。
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
    { videoUrl: "", poster: "", autoplay: false, aspectRatio: "16:9" },
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
// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, unknown> = {};

const defaults = ref<Record<string, string>>(DEFAULTS as Record<string, string>);
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);
const aspectOptions = ref(["16:9", "4:3", "1:1"]);
const picModelFlag = ref(false);
const currentField = ref("videoUrl");

const item = computed(() => {
      return local.list?.[0];
    });

type MediaField = "videoUrl" | "poster";

/** 当前在选哪个字段；选视频字段就要求素材库切到视频分类 */
const pickerMediaType = computed<"IMAGE" | "VIDEO">(() =>
  currentField.value === "videoUrl" ? "VIDEO" : "IMAGE"
);

/**
 * 打开素材选择器。
 * 只设置自身状态，由 ossManage 通过 props 感知（initialize / mediaType），
 * 不再写 nextTick + $refs 去改子组件内部状态。
 */
function pickFile(field: MediaField) {
  currentField.value = field;
  picModelFlag.value = true;
}

/** 素材库回调：把选中的地址写回当前字段 */
function callbackSelected(payload: { url?: string }) {
  picModelFlag.value = false;
  const url = payload?.url;
  if (!url) return;
  const target = local.list?.[0];
  if (!target) return;
  // currentField 只会是 VideoItem 的字符串字段（模板里由字段选择器给出）
  const field = currentField.value as keyof VideoItem;
  if (typeof target[field] === "string" || target[field] === undefined) {
    (target as Record<string, unknown>)[field] = url;
  }
}

</script>

<style scoped lang="scss">
@import "../controls/field-common.scss";
@import "../controls/panel-common.scss";
.panel-video {
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
.upload-state {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &.filled {
    color: #409eff;
  }
}
.cover-preview {
  width: 88px;
  height: 44px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 3px;
  box-sizing: border-box;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: 4px;
  }
}
.cover-placeholder {
  width: 88px;
  height: 44px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}
.seg {
  display: inline-flex;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  .seg-item {
    padding: 6px 14px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    border-left: 1px solid #dcdfe6;
    transition: all 0.2s ease;
    &:first-child {
      border-left: none;
    }
    &.active {
      background: #ecf5ff;
      color: #409eff;
      font-weight: 600;
    }
  }
}
</style>

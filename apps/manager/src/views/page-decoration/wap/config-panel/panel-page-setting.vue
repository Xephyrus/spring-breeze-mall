<template>
  <div class="panel-page-setting">
    <div class="panel-header">
      <span class="panel-name">页面设置</span>
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
        <div class="section-title">基础设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label"><span class="required-star">*</span>模板名称</div>
          <div class="ctrl-body">
            <el-input
              :model-value="String(res.name ?? '')"
              @update:model-value="(v: string) => setField('name', v)"
              maxlength="30"
              placeholder="请输入模板名称"
            />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label"><span class="required-star">*</span>页面标题</div>
          <div class="ctrl-body">
            <el-input
              :model-value="String(res.title ?? '')"
              @update:model-value="(v: string) => setField('title', v)"
              maxlength="30"
              placeholder="请输入页面标题"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="panel-card panel-card-fill">
        <div class="section-title">颜色设置</div>
        <segment-field
          :model-value="res.bgType ?? ''"
          @update:model-value="(v: string) => setField('bgType', v)"
          label="背景设置"
          :options="bgTypeOptions"
        />
        <color-field
          v-if="res.bgType === 'color'"
          :model-value="res.bgColor ?? ''"
          @update:model-value="(v: string | null) => setField('bgColor', v ?? '')"
          label="背景颜色"
          :default-value="defaults.bgColor"
        />
        <template v-else>
          <div class="ctrl-row">
            <div class="ctrl-label">背景图片</div>
            <div class="ctrl-body bg-image-body">
              <div class="bg-image-preview" v-if="res.bgImage">
                <img :src="res.bgImage" alt="" />
                <el-icon class="bg-image-clear" @click="clearImage"><Close /></el-icon>
              </div>
              <el-button plain type="primary" @click="pickImage">上传图片</el-button>
            </div>
          </div>
          <div class="section-tip upload-tip">上传图片 建议：宽度750px</div>
          <segment-field
            :model-value="res.bgFill ?? ''"
            @update:model-value="(v: string) => setField('bgFill', v)"
            label="填充方式"
            :options="bgFillOptions"
          />
        </template>
        <color-field
          :model-value="res.topColor ?? ''"
          @update:model-value="(v: string | null) => setField('topColor', v ?? '')"
          label="顶部颜色"
          :default-value="defaults.topColor"
        />
        <segment-field
          :model-value="res.titleColor ?? ''"
          @update:model-value="(v: string) => setField('titleColor', v)"
          label="标题颜色"
          :options="titleColorOptions"
        />
      </div>
    </template>

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
import { ref } from "vue";
import ColorField from "../controls/color-field.vue";
import SegmentField from "../controls/segment-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { Close } from "@element-plus/icons-vue";

defineOptions({ name: "PanelPageSetting" });

/**
 * 页面设置对象由父组件持有（contentData），本面板做「就地编辑」。
 * 用对象型 v-model（defineModel）显式声明这条双向绑定，
 * 而不是把父对象当成只读 prop 再偷偷改字段。
 */
/** 页面设置（模板名 / 标题 / 背景 / 配色） */
type PageSettingLike = {
  name?: string;
  title?: string;
  bgType?: string;
  bgColor?: string;
  bgImage?: string;
  bgFill?: string;
  topColor?: string;
  titleColor?: string;
  [key: string]: unknown;
};

const props = defineProps<{ res: PageSettingLike }>();

const emit = defineEmits<{ "update:res": [patch: PageSettingLike] }>();

/**
 * 修改一个页面设置字段。
 * 不直接改父组件传进来的对象，而是把「补丁」交回父组件合并 ——
 * 这样数据流方向始终是单向的（父持有 → 子请求修改 → 父更新）。
 */
function setField(key: keyof PageSettingLike, value: unknown) {
  emit("update:res", { ...props.res, [key]: value } as PageSettingLike);
}

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
const bgTypeOptions = ref([
        { label: "背景色", value: "color" },
        { label: "背景图", value: "image" },
      ]);
const bgFillOptions = ref([
        { label: "拉伸", value: "stretch" },
        { label: "缩放", value: "contain" },
        { label: "填充", value: "cover" },
      ]);
const titleColorOptions = ref([
        { label: "白色", value: "white" },
        { label: "黑色", value: "black" },
      ]);
const picModelFlag = ref(false);

/** 打开素材选择器（页面背景只支持图片） */
function pickImage() {
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url) {
        setField("bgImage", val.url);
      }
    
}

function clearImage() {
      setField("bgImage", "");
    
}

(() => {

    Object.keys(DEFAULTS).forEach((key) => {
      if (props.res[key] === undefined) {
        setField(key, DEFAULTS[key]);
      }
    });
  
})();

</script>

<style scoped lang="scss">
@import "../controls/field-common.scss";
@import "../controls/panel-common.scss";

.panel-page-setting {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}
.required-star {
  color: #f56c6c;
  margin-right: 2px;
}
.bg-image-body {
  align-items: center;
}
.bg-image-preview {
  position: relative;
  width: 88px;
  height: 48px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 3px;
  box-sizing: border-box;
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  .bg-image-clear {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #909399;
    color: #ffffff;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background: #f56c6c;
    }
  }
}
.upload-tip {
  margin: -8px 0 12px 102px;
}
</style>

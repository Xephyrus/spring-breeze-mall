<template>
  <div class="panel-title">
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
        <div class="section-title">文本标题</div>
        <div class="ctrl-row">
          <div class="ctrl-label">标题名称</div>
          <div class="ctrl-body">
            <el-input v-model="item.title" maxlength="20" />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">副标题</div>
          <div class="ctrl-body">
            <el-input v-model="item.title1" maxlength="20" />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">右侧按钮</div>
          <div class="ctrl-body">
            <el-radio-group v-model="item.showMore">
              <el-radio :value="true">显示</el-radio>
              <el-radio :value="false">隐藏</el-radio>
            </el-radio-group>
          </div>
        </div>
        <template v-if="item.showMore">
          <div class="ctrl-row">
            <div class="ctrl-label">右侧文字</div>
            <div class="ctrl-body">
              <el-input v-model="item.moreText" maxlength="6" placeholder="更多" />
            </div>
          </div>
          <div class="ctrl-row">
            <div class="ctrl-label">链接</div>
            <div class="ctrl-body">
              <span class="link-text" v-if="item.moreUrl && item.moreUrl.___type">
                {{ linkText(item.moreUrl) }}
              </span>
              <el-button plain type="primary" @click="pickLink">选择链接</el-button>
            </div>
          </div>
        </template>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">选择风格</div>
        <div class="ctrl-row">
          <div class="ctrl-label">风格</div>
          <div class="ctrl-body">
            <el-radio-group v-model="item.bgType">
              <el-radio value="image">背景图片</el-radio>
              <el-radio value="color">背景色</el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="ctrl-row" v-if="item.bgType === 'color'">
          <div class="ctrl-label">背景色</div>
          <div class="ctrl-body">
            <el-color-picker v-model="item.bk_color" />
            <el-input v-model="item.bk_color" class="ctrl-color-input" />
          </div>
        </div>
        <div class="ctrl-row" v-else>
          <div class="ctrl-label">上传背景图</div>
          <div class="ctrl-body">
            <div class="bg-preview" v-if="item.bgImage">
              <img :src="item.bgImage" alt="" />
            </div>
            <el-button plain type="primary" @click="pickImage">上传背景图</el-button>
          </div>
        </div>
        <div class="section-tip" v-if="item.bgType !== 'color'">建议 910px*86px</div>
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">文字设置</div>
        <color-field v-model="item.color" label="标题颜色" :default-value="defaults.color" />
        <slider-field v-model="item.fontSize" label="标题文字" :min="12" :max="40" unit="px" />
        <div class="ctrl-row">
          <div class="ctrl-label">文本样式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in textStyleOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: (item.textStyle || 'normal') === opt.value }"
                @click="item.textStyle = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <color-field v-model="item.color1" label="副标题颜色" :default-value="defaults.color1" />
        <slider-field v-model="item.subFontSize" label="副标题文字" :min="10" :max="30" unit="px" />
        <template v-if="item.showMore">
          <color-field v-model="item.moreColor" label="按钮颜色" :default-value="defaults.moreColor" />
          <slider-field v-model="item.moreFontSize" label="按钮文字" :min="10" :max="24" unit="px" />
        </template>
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
        <slider-field v-model="local.radiusTop" label="上圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.radiusBottom" label="下圆角" :min="0" :max="30" unit="rpx" />
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
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";

defineOptions({ name: "PanelTitle", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

/** 链接对象（选择链接后写回） */
type NoticeLinkLike = {
  ___type?: string;
  url?: string;
  title?: string;
  name?: string;
  goodsName?: string;
  [key: string]: unknown;
};

/** 标题项 */
type TitleItem = {
  title?: string;
  title1?: string;
  color?: string;
  color1?: string;
  /** el-color-picker 清空时写 null */
  bk_color?: string | null;
  textAlign?: string;
  link?: string;
  /** 链接对象（选择链接后写回） */
  url?: { ___type?: string; url?: string; title?: string; name?: string; goodsName?: string; [key: string]: unknown };
  model?: string;
  /** el-radio-group 写回 string | number | boolean */
  showMore?: string | number | boolean;
  moreText?: string;
  /** 更多按钮的链接对象 */
  moreUrl?: NoticeLinkLike;
  moreColor?: string;
  /** 背景类型：color / image */
  /** el-radio-group 写回 string | number | boolean */
  bgType?: string | number | boolean;
  bgImage?: string;
  fontSize?: number;
  subFontSize?: number;
  moreFontSize?: number;
  textStyle?: string;
};

/** 面板配置 */
type PanelOptions = {
  list: TitleItem[];
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  pageGap?: number;
  radiusTop?: number;
  radiusBottom?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Record<string, unknown>] }>();

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
const textStyleOptions = ref([
        { value: "normal", title: "正常" },
        { value: "italic", title: "斜体" },
        { value: "bold", title: "加粗" },
      ]);
const picModelFlag = ref(false);

const item = computed(() => {
      return local.list?.[0];
    });

function linkText(url: {
  ___type?: string;
  name?: string;
  goodsName?: string;
  memberName?: string;
  title?: string;
  [key: string]: unknown;
} | null | undefined) {
      const way = ways.find((e) => e.name === (url?.___type ?? ""));
      const typeTitle = way ? way.title : "发现";
      const name =
        url?.name ?? url?.goodsName ?? url?.memberName ?? url?.title ?? "";
      return name ? `${typeTitle} - ${name}` : typeTitle;
    
}

/** 打开素材选择器（只选图片） */
function pickImage() {
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url) {
        item.value.bgImage = val.url;
      }
    
}

function pickLink() {
  linkDialogRef.value?.openPicker("link");
}

function selectedLink(val: {
  url?: string;
  title?: string;
  ___type?: string;
  selected?: unknown;
  intro?: unknown;
  mobileIntro?: unknown;
  [key: string]: unknown;
}) {
      delete val.selected;
      delete val.intro;
      delete val.mobileIntro;
      item.value.moreUrl = val;
    
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
    {
      title: "标题",
      title1: "副标题",
      color: "#282828",
      color1: "#282828",
      bk_color: "#FFFFFF",
      textAlign: "left",
    },
  ];
}
// item 是 computed（只读 ref），补默认值要写到它指向的对象上
const first = item.value;
if (first.showMore === undefined) first.showMore = true;
if (!first.moreText) first.moreText = "更多";
if (!first.bgType) first.bgType = "color";
if (!first.fontSize) first.fontSize = 20;
if (!first.subFontSize) first.subFontSize = 14;
if (!first.moreFontSize) first.moreFontSize = 12;
if (!first.moreColor) first.moreColor = "#282828";

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
@import "../controls/field-common.scss";
@import "../controls/panel-common.scss";

.panel-title {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}
.link-text {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
}
.bg-preview {
  width: 132px;
  height: 30px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 2px;
  box-sizing: border-box;
  margin-right: 10px;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: 4px;
  }
}
</style>

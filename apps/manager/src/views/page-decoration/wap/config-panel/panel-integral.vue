<template>
  <div class="panel-integral">
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
        <div class="section-title">头部设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">选择风格</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.headBgType">
              <el-radio value="image">背景图片</el-radio>
              <el-radio value="color">背景色</el-radio>
            </el-radio-group>
          </div>
        </div>
        <gradient-field
          v-if="local.headBgType === 'color'"
          v-model:start="local.headBg1"
          v-model:end="local.headBg2"
          label="背景颜色"
          :default-start="defaults.headBg1"
          :default-end="defaults.headBg2"
        />
        <div class="ctrl-row" v-else>
          <div class="ctrl-label">背景图片</div>
          <div class="ctrl-body">
            <div class="bg-preview" v-if="local.headBgImage">
              <img :src="local.headBgImage" alt="" />
            </div>
            <el-button plain type="primary" @click="pickFile('headBgImage')">上传背景图</el-button>
          </div>
        </div>
        <div class="section-tip" v-if="local.headBgType !== 'color'">建议 710px*96px</div>
        <div class="ctrl-row">
          <div class="ctrl-label">标题类型</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.titleType">
              <el-radio value="image">图片</el-radio>
              <el-radio value="text">文字</el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="ctrl-row" v-if="local.titleType === 'image'">
          <div class="ctrl-label">标题图片</div>
          <div class="ctrl-body">
            <div class="icon-preview" v-if="local.titleImage">
              <img :src="local.titleImage" alt="" />
            </div>
            <el-button plain type="primary" @click="pickFile('titleImage')">上传标题图</el-button>
          </div>
        </div>
        <div class="ctrl-row" v-else>
          <div class="ctrl-label">标题文字</div>
          <div class="ctrl-body">
            <el-input v-model="firstItem.title" maxlength="10" placeholder="积分兑好礼" />
          </div>
        </div>
        <slider-field v-model="firstItem.count" label="展示数量" :min="1" :max="20" />
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">布局设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展示样式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in layoutOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: (local.layoutStyle || '1') === opt.value }"
                @click="local.layoutStyle = opt.value"
              >
                {{ opt.title }}
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
          label="内容背景"
          :default-start="defaults.bgColor1"
          :default-end="defaults.bgColor2"
        />
        <color-field
          v-model="local.pointColor"
          label="积分价格颜色"
          :default-value="defaults.pointColor"
        />
        <div class="ctrl-row">
          <div class="ctrl-label">标题文字</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in titleStyleOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: (local.titleStyle || 'bold') === opt.value }"
                @click="local.titleStyle = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <color-field
          v-model="local.titleColor"
          label="标题颜色"
          :default-value="defaults.titleColor"
        />
        <color-field
          v-model="local.moreColor"
          label="更多按钮颜色"
          :default-value="defaults.moreColor"
        />
      </div>

      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingTop" label="上边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingBottom" label="下边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.contentGap" label="内容间距" :min="0" :max="20" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.imgRadius" label="图片圆角" :min="0" :max="30" unit="rpx" />
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
import { ref, computed, reactive, watch, onMounted } from "vue";
import GradientField from "../controls/gradient-field.vue";
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";

defineOptions({ name: "PanelIntegral", hideDecorateTitle: true });

/** 积分商品列表项 */
type IntegralItem = { title?: string; count?: number };

/** 面板配置 */
type PanelOptions = {
  list: IntegralItem[];
  layoutStyle?: string;
  pointColor?: string;
  /** el-radio-group 写回 string | number | boolean */
  titleType?: string | number | boolean;
  titleImage?: string;
  titleStyle?: string;
  titleColor?: string;
  moreColor?: string;
  /** el-radio-group 写回 string | number | boolean */
  headBgType?: string | number | boolean;
  headBg1?: string;
  headBg2?: string;
  headBgImage?: string;
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

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, unknown> = {};
// 同理：原代码引用了未定义的 DEFAULT_ITEM（列表默认项），显式声明为空对象
const DEFAULT_ITEM: Record<string, unknown> = {};

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
const titleStyleOptions = ref([
        { value: "bold", title: "加粗" },
        { value: "normal", title: "正常" },
        { value: "italic", title: "倾斜" },
      ]);
const layoutOptions = ref([
        { value: "1", title: "样式一" },
        { value: "2", title: "样式二" },
        { value: "3", title: "样式三" },
      ]);
const picModelFlag = ref(false);
const currentField = ref("");

const firstItem = computed(() => {
      return local.list?.[0];
    });

/**
 * 打开素材选择器（本面板只选图片）。
 * 不再 nextTick + $refs 改子组件内部状态，改为由 mediaType prop 决定分类。
 */
function pickFile(field: string) {
  currentField.value = field;
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
  picModelFlag.value = false;
  const field = currentField.value as keyof PanelOptions;
  if (val && val.url && typeof local[field] === "string") {
    (local as Record<string, unknown>)[field] = val.url;
  }
    
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

if (!Array.isArray(local.list) || !local.list?.[0]) {
  local.list = [{ ...DEFAULT_ITEM }];
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
@import "../controls/field-common.scss";
@import "../controls/panel-common.scss";

.panel-integral {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
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
.icon-preview {
  width: 88px;
  height: 24px;
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
    object-fit: contain;
  }
}
</style>

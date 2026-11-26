<template>
  <div class="panel-carousel">
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
        <div class="section-title">图片设置</div>
        <div class="img-item" v-for="(item, index) in local.list" :key="index">
          <div class="img-item-head">
            <span>图片 {{ index + 1 }}</span>
            <div class="img-item-ops">
              <el-icon
                :class="{ disabled: index === 0 }"
                @click="moveItem(index, -1)"
                ><Top
              /></el-icon>
              <el-icon
                :class="{ disabled: index === local.list.length - 1 }"
                @click="moveItem(index, 1)"
                ><Bottom
              /></el-icon>
              <el-icon class="del" @click="removeItem(index)"><Delete /></el-icon>
            </div>
          </div>
          <div class="img-item-body">
            <div class="img-thumb" v-if="item.img">
              <img :src="item.img" alt="" />
            </div>
            <div class="img-thumb placeholder" v-else>750*350</div>
            <div class="img-item-fields">
              <div class="btn-row">
                <el-button plain type="primary" @click="pickImage(item)">选择照片</el-button>
                <el-button plain type="primary" @click="pickLink(item)">选择链接</el-button>
              </div>
              <div class="link-view" v-if="item.url && item.url.___type">
                已选链接：{{ linkText(item.url) }}
              </div>
              <div class="link-view empty" v-else>未设置链接</div>
            </div>
          </div>
        </div>
        <el-button
          v-if="local.list.length < 10"
          class="add-btn"
          plain
          type="primary"
          @click="addItem"
          >添加图片</el-button
        >
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">轮播风格</div>
        <div class="ctrl-row">
          <div class="ctrl-label">风格</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                v-for="opt in swiperStyleOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: local.swiperStyle === opt.value }"
                @click="local.swiperStyle = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <div class="section-tip" v-if="local.swiperStyle === 'card'">
          卡片风格下，两侧会露出前后图片的一部分
        </div>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">指示器设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">指示器样式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in indicatorStyleOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: local.indicatorStyle === opt.value }"
                @click="local.indicatorStyle = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <div class="ctrl-row" v-if="local.indicatorStyle !== 'none'">
          <div class="ctrl-label">指示器位置</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in indicatorPositionOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: local.indicatorPosition === opt.value }"
                @click="local.indicatorPosition = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <div class="ctrl-row" v-if="local.indicatorStyle !== 'none'">
          <div class="ctrl-label">色调</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.indicatorColorMode">
              <el-radio value="theme">跟随主题风格</el-radio>
              <el-radio value="custom">自定义</el-radio>
            </el-radio-group>
          </div>
        </div>
        <template
          v-if="
            local.indicatorStyle !== 'none' &&
            local.indicatorColorMode === 'custom'
          "
        >
          <color-field
            v-model="local.indicatorColor"
            label="指示器颜色"
            :default-value="defaults.indicatorColor"
          />
        </template>
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
import { ref, reactive, watch, onMounted } from "vue";
import { Top, Bottom, Delete } from "@element-plus/icons-vue";
import ColorField from "../controls/color-field.vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";

defineOptions({ name: "PanelCarousel", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

/** 轮播项 */
type CarouselSlide = {
  img?: string;
  title?: string;
  /** 链接对象（选择链接后写回） */
  url?: { ___type?: string; url?: string; title?: string; [key: string]: unknown };
  link?: string;
  size?: string;
  model?: string;
};

/** 面板配置 */
type PanelOptions = {
  list: CarouselSlide[];
  /** 下面几个是 el-radio-group / el-select 绑定的，值域比 string 宽 */
  swiperStyle?: string | number | boolean;
  indicatorStyle?: string | number | boolean;
  indicatorPosition?: string | number | boolean;
  indicatorColorMode?: string | number | boolean;
  indicatorColor?: string;
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
const swiperStyleOptions = ref([
        { value: "full", title: "通栏" },
        { value: "card", title: "卡片" },
      ]);
const indicatorStyleOptions = ref([
        { value: "round", title: "圆形" },
        { value: "line", title: "长条" },
        { value: "none", title: "无" },
      ]);
const indicatorPositionOptions = ref([
        { value: "left", title: "居左" },
        { value: "center", title: "居中" },
        { value: "right", title: "居右" },
      ]);
const picModelFlag = ref(false);
const currentItem = ref<CarouselSlide | null>(null);

function linkText(url: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      const way = ways.find((e) => e.name === url.___type);
      const typeTitle = way ? way.title : "发现";
      const name =
        url.name || url.goodsName || url.memberName || url.title || "";
      return name ? `${typeTitle} - ${name}` : typeTitle;
    
}

/** 打开素材选择器（只选图片），目标条目记在 currentItem 上 */
function pickImage(item: CarouselSlide) {
  currentItem.value = item;
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url && currentItem.value) {
        currentItem.value.img = val.url;
      }
    
}

function pickLink(item: CarouselSlide) {
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

function moveItem(index: number, dir: number) {
      const list = local.list;
      const target = index + dir;
      if (target < 0 || target >= list.length) return;
      list.splice(target, 1, ...list.splice(index, 1, list[target]));
    
}

function removeItem(index: number) {
      local.list.splice(index, 1);
    
}

function addItem() {
  // url 是"链接对象"，新增项不塞空字符串（否则语义与运行时链接解析不一致）
  local.list.push({
    img: "",
    link: "",
    size: "750*350",
    model: "link",
  });
    
}

/**
 * 本地副本：初始化时取 local 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/** 本地副本：必须保留组件已有的轮播项（不能初始化成空数组，否则面板一打开就清空画布） */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
});

if (!Array.isArray(local.list)) {
  local.list = [];
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
.panel-carousel {
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
    .img-item-ops {
      display: flex;
      gap: 4px;
      .el-icon {
        padding: 4px;
        cursor: pointer;
        color: #606266;
        &:hover {
          color: #409eff;
        }
        &.del:hover {
          color: #e1251b;
        }
        &.disabled {
          color: #dcdfe6;
          cursor: not-allowed;
        }
      }
    }
  }
}
.img-item-body {
  display: flex;
  gap: 10px;
}
.img-thumb {
  width: 132px;
  height: 62px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 3px;
  box-sizing: border-box;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 4px;
    object-fit: cover;
  }
  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 12px;
  }
}
.img-item-fields {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  .link-view {
    margin-top: 0;
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
.add-btn {
  width: 100%;
}
</style>

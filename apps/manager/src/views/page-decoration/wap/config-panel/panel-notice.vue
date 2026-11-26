<template>
  <div class="panel-notice">
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
        <div class="section-title">图标设置</div>
        <div class="section-tip">支持上传 1 张图片，建议宽度 130*36px</div>
        <div class="icon-row">
          <div class="icon-preview" v-if="item.img">
            <img :src="item.img" alt="" />
          </div>
          <div class="icon-placeholder" v-else>图标</div>
          <el-button plain type="primary" @click="pickImage">上传图标</el-button>
        </div>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">公告设置</div>
        <div class="section-tip">最多可添加 10 个版块</div>
        <div class="notice-item" v-for="(notice, index) in item.title" :key="index">
          <div class="notice-item-head">
            <span>版块 {{ index + 1 }}</span>
            <div class="img-item-ops">
              <el-icon :class="{ disabled: index === 0 }" @click="moveItem(index, -1)"><Top /></el-icon>
              <el-icon
                :class="{ disabled: index === item.title.length - 1 }"
                @click="moveItem(index, 1)"
                ><Bottom
              /></el-icon>
              <el-icon class="del" @click="removeItem(index)"><Delete /></el-icon>
            </div>
          </div>
          <div class="field-row">
            <div class="field-label">标题</div>
            <el-input v-model="notice.context" maxlength="50" placeholder="请输入公告内容" />
          </div>
          <div class="field-row">
            <div class="field-label">链接</div>
            <div class="link-text" v-if="notice.url && notice.url.___type">{{ linkText(notice.url) }}</div>
            <el-button plain type="primary" @click="pickLink(notice)">选择链接</el-button>
          </div>
        </div>
        <el-button
          v-if="item.title.length < 10"
          class="add-btn"
          plain
          type="primary"
          @click="addItem"
          >+ 添加模块</el-button
        >
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">文字设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">滚动方向</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: item.direction !== 'horizontal' }"
                @click="item.direction = 'vertical'"
              >
                上下
              </div>
              <div
                class="seg-item"
                :class="{ active: item.direction === 'horizontal' }"
                @click="item.direction = 'horizontal'"
              >
                左右
              </div>
            </div>
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">文本位置</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in alignOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: (item.textAlign || 'left') === opt.value }"
                @click="item.textAlign = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <color-field
          v-model="item.color"
          label="文字颜色"
          :default-value="defaults.itemColor"
        />
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
import { Top, Bottom, Delete } from "@element-plus/icons-vue";
import ColorField from "../controls/color-field.vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";

defineOptions({ name: "PanelNotice", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

/** 链接对象（选择链接后写回） */
type NoticeLink = {
  url?: string;
  title?: string;
  ___type?: string;
  pageType?: string;
  name?: string;
  goodsName?: string;
  [key: string]: unknown;
};

/** 一条公告 */
type NoticeText = {
  context?: string;
  url?: NoticeLink;
  color?: string;
};

/**
 * 一个公告版块：
 * - title 是"版块里的多条公告"（不是字符串）
 * - textAlign / color 属于版块级样式
 */
type NoticeItem = {
  title: NoticeText[];
  textAlign?: string;
  color?: string;
  img?: string;
  bk_color?: string;
  direction?: string;
};

/** 面板配置 */
type PanelOptions = {
  list: NoticeItem[];
  bgColor1?: string;
  bgColor2?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  pageGap?: number;
  borderRadius?: number;
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
const alignOptions = ref([
        { value: "left", title: "居左" },
        { value: "center", title: "居中" },
        { value: "right", title: "居右" },
      ]);
const picModelFlag = ref(false);
const currentItem = ref<NoticeText | null>(null);

const item = computed<NoticeItem>(() => {
  const first = local.list?.[0];
  if (!first) return { title: [] };
  if (!Array.isArray(first.title)) first.title = [];
  return first;
});

function linkText(url: NoticeLink) {
      const way = ways.find((e) => e.name === url?.___type);
      const typeTitle = way ? way.title : "发现";
      const name =
        url.name || url.goodsName || url.memberName || url.title || "";
      return name ? `${typeTitle} - ${name}` : typeTitle;
    
}

/** 打开素材选择器（只选图片） */
function pickImage() {
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url) {
        item.value.img = val.url;
      }
    
}

function pickLink(notice: NoticeText) {
  currentItem.value = notice;
  linkDialogRef.value?.openPicker("link");
}

function selectedLink(val: NoticeLink) {
      if (!currentItem.value) return;
      delete val.selected;
      delete val.intro;
      delete val.mobileIntro;
      currentItem.value.url = val;
    
}

function moveItem(index: number, dir: number) {
      const list = item.value.title;
      const target = index + dir;
      if (target < 0 || target >= list.length) return;
      list.splice(target, 1, ...list.splice(index, 1, list[target]));
    
}

function removeItem(index: number) {
      item.value.title.splice(index, 1);
    
}

function addItem() {
  item.value.title.push({ context: "" });
    
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
  local.list = [{ title: [], color: "#333333", direction: "vertical", img: "" }];
}
// item 是 computed（只读 ref），补默认值要写到它指向的对象上
const first = item.value;
if (!Array.isArray(first.title) || !first.title.length) {
  first.title = [{ context: "这是一条公告" }];
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
.panel-notice {
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
.icon-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-preview {
  width: 88px;
  height: 32px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 3px;
  box-sizing: border-box;
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }
}
.icon-placeholder {
  width: 88px;
  height: 32px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
}
.notice-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  .notice-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: #303133;
    margin-bottom: 8px;
  }
}
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
.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  &:last-child {
    margin-bottom: 0;
  }
  .field-label {
    font-size: 14px;
    color: #606266;
    margin-right: 10px;
    flex-shrink: 0;
    width: 32px;
  }
  .el-input {
    flex: 1;
    min-width: 0;
  }
  .el-button {
    flex-shrink: 0;
  }
}
.link-text {
  flex: 1;
  min-width: 0;
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

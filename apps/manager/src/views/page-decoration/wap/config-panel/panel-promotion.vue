<template>
  <div class="panel-promotion">
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
      <div class="panel-card" v-if="!isPintuan">
        <div class="section-title">图标设置</div>
        <div class="section-tip">支持上传 1 张图片，建议 124*32px</div>
        <div class="icon-row">
          <div class="icon-preview" v-if="local.icon">
            <img :src="local.icon" alt="" />
          </div>
          <div class="icon-placeholder" v-else>图标</div>
          <el-button plain type="primary" @click="pickImage()">上传图标</el-button>
        </div>
      </div>

      <div class="panel-card" v-if="isPintuan">
        <div class="section-title">头部设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">选择风格</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.headBgType">
              <el-radio value="color">背景色</el-radio>
              <el-radio value="image">背景图片</el-radio>
            </el-radio-group>
          </div>
        </div>
        <template v-if="local.headBgType === 'image'">
          <div class="ctrl-row">
            <div class="ctrl-label">背景图片</div>
            <div class="ctrl-body">
              <div class="bg-preview" v-if="local.headBgImage">
                <img :src="local.headBgImage" alt="" />
              </div>
              <el-button plain type="primary" @click="pickImage('headBg')">上传背景图</el-button>
            </div>
          </div>
          <div class="section-tip">建议 710px*96px</div>
        </template>
        <gradient-field
          v-else
          v-model:start="local.headBgColor1"
          v-model:end="local.headBgColor2"
          :default-start="defaults.headBgColor1"
          :default-end="defaults.headBgColor2"
          label="头部背景"
        />
        <div class="ctrl-row">
          <div class="ctrl-label">标题类型</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.headTitleType">
              <el-radio value="text">文字</el-radio>
              <el-radio value="image">图片</el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="ctrl-row" v-if="local.headTitleType !== 'image'">
          <div class="ctrl-label">标题文字</div>
          <div class="ctrl-body">
            <el-input v-model="firstItem.title" maxlength="10" placeholder="超值拼团" />
          </div>
        </div>
        <template v-else>
          <div class="ctrl-row">
            <div class="ctrl-label">标题图片</div>
            <div class="ctrl-body">
              <div class="bg-preview" v-if="local.headTitleImage">
                <img :src="local.headTitleImage" alt="" />
              </div>
              <el-button plain type="primary" @click="pickImage('headTitle')">上传标题图</el-button>
            </div>
          </div>
          <div class="section-tip">建议 200px*40px</div>
        </template>
      </div>

      <div class="panel-card" v-if="!isPintuan">
        <div class="section-title">标题设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">标题内容</div>
          <div class="ctrl-body">
            <el-input
              v-model="firstItem.title1"
              maxlength="10"
              :placeholder="isSeckill ? '邀请你的好友来参与' : (isKanjia ? '邀请好友来砍价' : '精彩抢先看')"
            />
          </div>
        </div>
        <div class="ctrl-row" v-if="!isLive && !isSeckill && !isKanjia">
          <div class="ctrl-label">更多链接</div>
          <div class="ctrl-body">
            <span class="link-text" v-if="local.moreUrl && local.moreUrl.___type">
              {{ linkText(local.moreUrl) }}
            </span>
            <el-button plain type="primary" @click="pickLink">选择链接</el-button>
          </div>
        </div>
      </div>

      <div class="panel-card panel-card-fill" v-if="!isLive">
        <div class="section-title">显示内容</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展示信息</div>
          <div class="ctrl-body">
            <el-checkbox v-model="local.showGoodsName">商品名称</el-checkbox>
            <el-checkbox v-model="local.showGoodsPrice">商品价格</el-checkbox>
            <template v-if="isPintuan">
              <el-checkbox v-model="local.showGroupTag">活动标签</el-checkbox>
              <el-checkbox v-model="local.showOriginalPrice">商品原价</el-checkbox>
            </template>
          </div>
        </div>
        <div class="ctrl-row" v-if="isPintuan">
          <div class="ctrl-label">拼团按钮</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.showGroupBtn">
              <el-radio :value="true">显示</el-radio>
              <el-radio :value="false">隐藏</el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="panel-card" v-if="isPintuan || isLive || isSeckill || isKanjia">
        <div class="section-title">布局设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展示样式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg" :class="{ 'layout-seg-3': isLive && !isPintuan }">
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
          :default-start="defaults.bgColor1"
          :default-end="defaults.bgColor2"
        />
        <color-field
          v-model="local.titleColor"
          label="标题颜色"
          :default-value="defaults.titleColor"
        />
        <color-field
          v-if="!isSeckill && !isKanjia"
          v-model="local.moreColor"
          label="更多按钮颜色"
          :default-value="defaults.moreColor"
        />
        <color-field
          v-model="local.nameColor"
          label="商品名称颜色"
          :default-value="defaults.nameColor"
        />
      </div>

      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingTop" label="上边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingBottom" label="下边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.contentGap" label="内容间距" :min="0" :max="20" unit="rpx" />
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.imgRadius" label="图片圆角" :min="0" :max="30" unit="rpx" />
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
import GradientField from "../controls/gradient-field.vue";
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";

defineOptions({ name: "PanelPromotion", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

/** 链接对象（选择链接后写回） */
type PromotionLink = {
  ___type?: string;
  url?: string;
  title?: string;
  name?: string;
  goodsName?: string;
  memberName?: string;
  [key: string]: unknown;
};

/** 促销内容项 */
type PromotionItem = {
  type?: string;
  title?: string;
  title1?: string;
  bk_color?: string;
  color1?: string;
  data?: unknown[];
  groupSuccess?: unknown;
};

/** 面板配置 */
type PanelOptions = {
  list: PromotionItem[];
  /** 图标 / 头图等图片地址 */
  icon?: string;
  headBgType?: string | number | boolean;
  headBgColor1?: string;
  headBgColor2?: string;
  headBgImage?: string;
  headTitleType?: string | number | boolean;
  headTitleImage?: string;
  layoutStyle?: string | number | boolean;
  titleColor?: string;
  moreColor?: string;
  nameColor?: string;
  /** 更多按钮的链接对象 */
  moreUrl?: PromotionLink;
  bgColor1?: string;
  bgColor2?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  contentGap?: number;
  pageGap?: number;
  borderRadius?: number;
  imgRadius?: number;
  /** 各区块显示开关（el-switch 值域更宽） */
  showGoodsName?: string | number | boolean;
  showGoodsPrice?: string | number | boolean;
  showGroupTag?: string | number | boolean;
  showOriginalPrice?: string | number | boolean;
  showGroupBtn?: string | number | boolean;
};

const props = defineProps<{
  res: {
    name?: string;
    type?: string;
    /** 秒杀 / 拼团 / 砍价 等促销类型 */
    promotionsType?: string;
    options?: PanelOptions;
  };
}>();

const emit = defineEmits<{ "update:options": [patch: Record<string, unknown>] }>();

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, unknown> = {};

const SECKILL_DEFAULTS: Record<string, unknown> = {};

const defaults = ref<Record<string, string>>(DEFAULTS as Record<string, string>);
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);
const picModelFlag = ref(false);
const pickTarget = ref("icon");

const firstItem = computed(() => {
      return (local.list && local.list?.[0]) || {};
    });
const isPintuan = computed(() => {
      return props.res.promotionsType === "PINTUAN" || firstItem.value.type === "PINTUAN";
    });
const isLive = computed(() => {
      return props.res.promotionsType === "LIVE" || firstItem.value.type === "LIVE";
    });
const isSeckill = computed(() => {
      return (
        props.res.promotionsType === "SECKILL" || firstItem.value.type === "SECKILL"
      );
    });
const isKanjia = computed(() => {
      return (
        props.res.promotionsType === "KANJIA" || firstItem.value.type === "KANJIA"
      );
    });
const layoutOptions = computed(() => {
      if (isLive.value && !isPintuan.value) {
        return [
          { value: "1", title: "单行" },
          { value: "2", title: "多行" },
          { value: "3", title: "双排" },
        ];
      }
      if ((isSeckill.value || isKanjia) && !isPintuan.value) {
        return [
          { value: "1", title: "样式一" },
          { value: "2", title: "样式二" },
        ];
      }
      return [
        { value: "1", title: "样式一" },
        { value: "2", title: "样式二" },
        { value: "3", title: "样式三" },
        { value: "4", title: "样式四" },
      ];
    });

function linkText(url: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      const way = ways.find((e) => e.name === url.___type);
      const typeTitle = way ? way.title : "发现";
      const name =
        url.name || url.goodsName || url.memberName || url.title || "";
      return name ? `${typeTitle} - ${name}` : typeTitle;
    
}

/** 打开素材选择器（只选图片）；target 记录这次要写哪个字段 */
function pickImage(target = "icon") {
  pickTarget.value = target;
  picModelFlag.value = true;
}

function callbackSelected(val: { url?: string }) {
      picModelFlag.value = false;
      if (val && val.url) {
        const target = pickTarget.value || "icon";
        if (target === "headBg") {
          local.headBgImage = val.url;
        } else if (target === "headTitle") {
          local.headTitleImage = val.url;
        } else {
          local.icon = val.url;
        }
      }
    
}

function pickLink() {
  linkDialogRef.value?.openPicker("link");
}

function selectedLink(val: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      delete val.selected;
      delete val.intro;
      delete val.mobileIntro;
      local.moreUrl = val;
    
}

/**
 * 促销类型不同，默认值也不同（秒杀/砍价用 SECKILL_DEFAULTS，其余用 DEFAULTS）
 */
const panelDefaults =
  ["SECKILL", "KANJIA"].includes(props.res.promotionsType ?? "")
    ? SECKILL_DEFAULTS
    : DEFAULTS;

/**
 * 本地副本：初始化时取「类型默认值 + props.res.options」的浅拷贝，
 * 之后单向 local -> emit -> 父组件。
 */
/** 本地副本：保留组件已有的促销项（不能初始化成空数组，否则面板一打开就清空画布） */
const local = reactive<PanelOptions>({
  ...panelDefaults,
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

.panel-promotion {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
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

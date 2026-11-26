<template>
  <div class="panel-shop">
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
        <div class="section-tip">支持上传 1 张图片，建议 124*32px</div>
        <div class="icon-row">
          <div class="icon-preview" v-if="firstItem.icon">
            <img :src="firstItem.icon" alt="" />
          </div>
          <div class="icon-placeholder" v-else>图标</div>
          <el-button plain type="primary" @click="pickImage">上传图标</el-button>
        </div>
      </div>

      <div class="panel-card">
        <div class="section-title">标题设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">标题内容</div>
          <div class="ctrl-body">
            <el-input v-model="firstItem.title" />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">更多链接</div>
          <div class="ctrl-body">
            <span class="link-text" v-if="firstItem.moreUrl && firstItem.moreUrl.___type">
              {{ linkText(firstItem.moreUrl) }}
            </span>
            <el-button plain type="primary" @click="pickLink">选择链接</el-button>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="section-title">显示内容</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展示信息</div>
          <div class="ctrl-body">
            <el-checkbox v-model="firstItem.showLogo">店铺logo</el-checkbox>
            <el-checkbox v-model="firstItem.showName">店铺名称</el-checkbox>
          </div>
        </div>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">店铺数据</div>
        <div class="ctrl-row">
          <div class="ctrl-label">店铺数据</div>
          <div class="ctrl-body">
            <el-radio-group v-model="firstItem.dataMode">
              <el-radio value="default">默认规则</el-radio>
              <el-radio value="custom">自定义</el-radio>
            </el-radio-group>
          </div>
        </div>
        <slider-field
          v-if="firstItem.dataMode !== 'custom'"
          v-model="firstItem.count"
          label="展示数量"
          :min="1"
          :max="20"
        />
        <template v-else>
          <div class="ctrl-row">
            <div class="ctrl-label">选择店铺</div>
            <div class="ctrl-body">
              <el-button plain type="primary" @click="openShops">选择店铺</el-button>
            </div>
          </div>
          <div class="shop-chips" v-if="firstItem.shopList && firstItem.shopList.length">
            <el-tag
              v-for="(shop, i) in firstItem.shopList"
              :key="shop.id"
              closable
              class="shop-chip"
              @close="removeShop(i)"
            >
              {{ shop.storeName }}
            </el-tag>
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <div class="panel-card">
        <div class="section-title">布局设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展示样式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: (firstItem.shopStyle || 'one') === 'one' }"
                @click="firstItem.shopStyle = 'one'"
              >
                样式一
              </div>
              <div
                class="seg-item"
                :class="{ active: firstItem.shopStyle === 'two' }"
                @click="firstItem.shopStyle = 'two'"
              >
                样式二
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
          v-model="local.nameColor"
          label="店铺名称颜色"
          :default-value="defaults.nameColor"
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

    <StoreSelector ref="storeSelectorRef" :query-params="{ storeDisable: 'OPEN' }" @selected="confirmShops" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import GradientField from "../controls/gradient-field.vue";
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";
import StoreSelector from "@/components/store-selector/index.vue";

defineOptions({ name: "PanelShop", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);
// 店铺选择器：同样用模板 ref，不再读 $refs
const storeSelectorRef = ref<{ open: (selected?: unknown) => void } | null>(null);

/** 店铺项 */
type ShopEntry = {
  id?: string | number;
  storeName?: string;
  logo?: string;
  /** 老字段：店铺 logo */
  storeLogo?: string;
  selfOperated?: boolean;
  storeBanner?: string;
  [key: string]: unknown;
};

/** 内容项（一个版块） */
type ShopItem = {
  title?: string;
  count?: number;
  showLogo?: boolean | string | number;
  showName?: boolean | string | number;
  shopStyle?: string;
  /** AUTO / MANUAL */
  dataMode?: string | number | boolean;
  shopList?: ShopEntry[];
  /** 图标（自定义上传时用） */
  icon?: string;
  moreUrl?: { ___type?: string; url?: string; title?: string; [key: string]: unknown };
};

/** 面板配置 */
type PanelOptions = {
  list: ShopItem[];
  bgColor1?: string;
  bgColor2?: string;
  titleColor?: string;
  nameColor?: string;
  moreColor?: string;
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
const picModelFlag = ref(false);

const firstItem = computed(() => {
      return local.list?.[0];
    });

/** 打开店铺选择器：通过模板 ref 调用子组件暴露的 open(已选列表) */
function openShops() {
  if (!storeSelectorRef.value) return;
  storeSelectorRef.value.open(firstItem.value?.shopList ?? []);
}

function confirmShops(rows: Array<Record<string, unknown>>) {
  firstItem.value.shopList = rows.map((s) => ({
    id: s.id as string | number | undefined,
    storeName: s.storeName as string | undefined,
    // 老字段名是 storeLogo，新结构里叫 logo，两个都保留
    logo: (s.storeLogo ?? s.logo) as string | undefined,
    storeLogo: s.storeLogo as string | undefined,
    selfOperated: s.selfOperated as boolean | undefined,
    storeBanner: (s.storeBanner as string | undefined) ?? "",
  }));
    
}

function removeShop(index: number) {
  const list = firstItem.value.shopList;
  if (!Array.isArray(list)) return;
  list.splice(index, 1);
    
}

function linkText(url: { ___type?: string; [key: string]: unknown }) {
      const way = ways.find((e) => e.name === url.___type);
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
        firstItem.value.icon = val.url;
      }
    
}

function pickLink() {
  linkDialogRef.value?.openPicker("link");
}

function selectedLink(val: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      delete val.selected;
      delete val.intro;
      delete val.mobileIntro;
      firstItem.value.moreUrl = val;
    
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
const item = firstItem;
if (item.value.showLogo === undefined) item.value.showLogo = true;
if (item.value.showName === undefined) item.value.showName = true;
if (!item.value.shopStyle) item.value.shopStyle = "one";
if (!item.value.dataMode) item.value.dataMode = "default";
if (!Array.isArray(item.value.shopList)) item.value.shopList = [];

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
.shop-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.shop-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  .shop-cell-logo {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    object-fit: cover;
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
  margin-right: 10px;
}
</style>

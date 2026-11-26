<template>
  <div class="panel-home-comb">
    <div class="panel-header">
      <span class="panel-name">{{ res.name || "头部组件" }}</span>
    </div>

    <!-- 顶部子组件切换：搜索框 / 选项卡 / 轮播图 -->
    <div class="panel-card">
      <div class="section-title">设置内容</div>
      <div class="ctrl-row">
        <div class="ctrl-label">选择组件</div>
        <div class="ctrl-body">
          <div class="seg layout-seg-3">
            <div
              v-for="tab in subTabs"
              :key="tab.key"
              class="seg-item"
              :class="{ active: activeSub === tab.key }"
              @click="activeSub = tab.key"
            >
              {{ tab.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 1. 搜索框 ==================== -->
    <template v-if="activeSub === 'search'">
      <div class="panel-card">
        <div class="section-title">布局设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">选择模板</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: local.searType !== 'logo' }"
                @click="local.searType = 'full'"
              >
                通栏
              </div>
              <div
                class="seg-item"
                :class="{ active: local.searType === 'logo' }"
                @click="local.searType = 'logo'"
              >
                logo
              </div>
            </div>
          </div>
        </div>

        <template v-if="local.searType === 'logo'">
          <div class="logo-row">
            <div class="logo-label">
              <div>默认logo图</div>
              <div class="logo-tip">建议 138*48px</div>
            </div>
            <div class="logo-box" @click="pickLogo('logoUrl')">
              <img v-if="local.logoUrl" :src="local.logoUrl" alt="logo" />
              <span v-else class="logo-add">+ 选择图片</span>
            </div>
          </div>
          <div class="logo-row">
            <div class="logo-label">
              <div>吸顶logo图</div>
              <div class="logo-tip">建议 138*48px</div>
            </div>
            <div class="logo-box" @click="pickLogo('logoFixUrl')">
              <img v-if="local.logoFixUrl" :src="local.logoFixUrl" alt="logo" />
              <span v-else class="logo-add">+ 选择图片</span>
            </div>
          </div>
        </template>
      </div>

      <div class="panel-card">
        <div class="section-title">提示文字设置</div>
        <div class="field-row">
          <div class="field-label">提示文字</div>
          <el-input
            v-model="local.placeWords"
            maxlength="20"
            placeholder="搜索商品名称"
          />
        </div>
      </div>

      <div class="panel-card">
        <div class="section-title">搜索热词</div>
        <div class="section-tip">最多可设置 20 个热词，前端按切换时间轮播显示</div>
        <div
          class="hot-word"
          v-for="(word, index) in local.hotWords"
          :key="index"
        >
          <el-input
            v-model="local.hotWords[index]"
            maxlength="10"
            placeholder="选填，不超过10个字"
          />
          <el-icon class="del" @click="removeHotWord(index)"><CircleClose /></el-icon>
        </div>
        <el-button
          v-if="local.hotWords.length < 20"
          class="add-btn"
          plain
          type="primary"
          @click="addHotWord"
        >
          + 添加热词
        </el-button>
        <div class="field-row interval-row">
          <div class="field-label">切换时间</div>
          <el-input-number
            class="interval-input"
            v-model="local.hotInterval"
            :min="1"
            :max="60"
            controls-position="right"
          />
          <span class="unit">秒</span>
        </div>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">样式设置</div>
        <color-field
          v-model="local.textColor"
          label="文字颜色"
          :default-value="defaults.textColor"
        />
        <color-field
          v-model="local.boxColor"
          label="框体颜色"
          :default-value="defaults.boxColor"
        />
        <div class="ctrl-row">
          <div class="ctrl-label">文本位置</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in textAlignOptions"
                :key="opt.value"
                class="seg-item"
                :class="{ active: local.textAlign === opt.value }"
                @click="local.textAlign = opt.value"
              >
                {{ opt.title }}
              </div>
            </div>
          </div>
        </div>
        <slider-field
          v-model="local.searchRadius"
          label="内容圆角"
          unit="rpx"
          :min="0"
          :max="60"
        />
      </div>
    </template>

    <!-- ==================== 2. 选项卡 ==================== -->
    <template v-else-if="activeSub === 'tabs'">
      <div class="panel-card">
        <div class="section-title">选项卡设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">选项卡</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.showTabs">
              <el-radio :value="true">显示</el-radio>
              <el-radio :value="false">隐藏</el-radio>
            </el-radio-group>
          </div>
        </div>
        <color-field
          v-model="local.tabColor"
          label="文字颜色"
          :default-value="defaults.tabColor"
        />
        <color-field
          v-model="local.tabActiveColor"
          label="选中颜色"
          :default-value="defaults.tabActiveColor"
        />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">分类导航列表</div>
        <div class="section-tip">首项默认固定为「首页」，最多可添加 10 个分类选项卡</div>
        <div
          class="tab-card"
          v-for="(tab, index) in local.tabList"
          :key="index"
        >
          <div class="tab-card-head">
            <span>选项卡 {{ index + 1 }}</span>
            <div class="tab-card-ops">
              <el-icon
                :class="{ disabled: index === 0 }"
                @click="moveTab(index, -1)"
                ><Top
              /></el-icon>
              <el-icon
                :class="{ disabled: index === local.tabList.length - 1 }"
                @click="moveTab(index, 1)"
                ><Bottom
              /></el-icon>
              <el-icon class="del" @click="removeTab(index)"><Delete /></el-icon>
            </div>
          </div>

          <div class="ctrl-row">
            <div class="ctrl-label">显示文字</div>
            <div class="ctrl-body">
              <el-input
                v-model="tab.title"
                maxlength="5"
                placeholder="请输入标签名称，5字以内"
              />
            </div>
          </div>

          <div class="ctrl-row">
            <div class="ctrl-label">数据类型</div>
            <div class="ctrl-body">
              <el-radio-group
                :model-value="tab.dataType"
                @update:model-value="(v: string | number | boolean | undefined) => { tab.dataType = String(v ?? ''); tab.value = '' }"
              >
                <el-radio value="special">微页面</el-radio>
                <el-radio value="category">商品分类</el-radio>
              </el-radio-group>
            </div>
          </div>

          <div class="ctrl-row" v-if="tab.dataType === 'special'">
            <div class="ctrl-label">微页面</div>
            <div class="ctrl-body">
              <el-select
                v-model="tab.value"
                placeholder="请选择专题微页面"
                clearable
                filterable
              >
                <el-option
                  v-for="sp in specialList"
                  :key="String(sp.id ?? '')"
                  :label="String(sp.name ?? '')"
                  :value="String(sp.id ?? '')"
                />
              </el-select>
            </div>
          </div>

          <div class="ctrl-row" v-else>
            <div class="ctrl-label">商品分类</div>
            <div class="ctrl-body">
              <el-cascader
                :model-value="tab.value"
                @update:model-value="(v: unknown) => (tab.value = String(v ?? ''))"
                :options="categoryTree"
                :props="cascaderProps"
                placeholder="请选择商品分类"
                clearable
              />
            </div>
          </div>
        </div>

        <el-button
          v-if="local.tabList.length < 10"
          class="add-btn"
          plain
          type="primary"
          @click="addTab"
        >
          + 添加模块
        </el-button>
      </div>
    </template>

    <!-- ==================== 3. 轮播图 ==================== -->
    <template v-else>
      <div class="panel-card">
        <div class="section-title">内容设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">选择风格</div>
          <div class="ctrl-body">
            <el-radio-group v-model="local.swiperStyle">
              <el-radio value="card">样式1（卡片露边）</el-radio>
              <el-radio value="full">样式2（通栏）</el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="section-tip">最多可添加 10 张图片，建议尺寸 750*332px</div>

        <div
          class="img-item"
          v-for="(item, index) in local.list"
          :key="index"
        >
          <div class="img-item-head">
            <span>图片 {{ index + 1 }}</span>
            <div class="img-item-ops">
              <el-icon
                :class="{ disabled: index === 0 }"
                @click="moveBanner(index, -1)"
                ><Top
              /></el-icon>
              <el-icon
                :class="{ disabled: index === local.list.length - 1 }"
                @click="moveBanner(index, 1)"
                ><Bottom
              /></el-icon>
              <el-icon class="del" @click="removeBanner(index)"><Delete /></el-icon>
            </div>
          </div>
          <div class="img-item-body">
            <div class="img-thumb" v-if="item.img">
              <img :src="item.img" alt="" />
            </div>
            <div class="img-thumb placeholder" v-else>750*332</div>
            <div class="img-item-fields">
              <div class="btn-row">
                <el-button plain type="primary" @click="pickBannerImage(item)"
                  >选择照片</el-button
                >
                <el-button plain type="primary" @click="pickBannerLink(item)"
                  >选择链接</el-button
                >
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
          @click="addBanner"
        >
          + 添加图片
        </el-button>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">样式设置</div>
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
        <color-field
          v-if="local.indicatorStyle !== 'none'"
          v-model="local.indicatorColor"
          label="指示器颜色"
          :default-value="defaults.indicatorColor"
        />
        <slider-field
          v-model="local.bannerRadius"
          label="内容圆角"
          unit="rpx"
          :min="0"
          :max="40"
        />
        <slider-field
          v-model="local.pageGap"
          label="下边距"
          unit="rpx"
          :min="0"
          :max="60"
        />
      </div>
    </template>

    <liliDialog ref="linkDialogRef" @selectedLink="onSelectedLink" />

    <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <!-- 选择器由 props 驱动：打开时 initialize=true，mediaType 固定为图片 -->
      <ossManage
        @callback="onOssSelected"
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
import { Top, Bottom, Delete, CircleClose } from "@element-plus/icons-vue";
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import ways from "@/components/lili-dialog/wap.js";
import { getCategoryTree } from "@/api/goods";
import { getHomeList } from "@/api/other";

defineOptions({ name: "PanelHomeComb", hideDecorateTitle: true });

/** 轮播项 */
type CombSlide = {
  img?: string;
  /** 链接对象（选择链接后写回） */
  url?: { ___type?: string; url?: string; title?: string; [key: string]: unknown };
  size?: string;
  model?: string;
  [key: string]: unknown;
};

/** 搜索页签 */
type CombTab = {
  key?: string | number;
  title?: string;
  /** category / keyword / ... */
  dataType?: string;
  value?: string;
  [key: string]: unknown;
};

/** 头部组件（首页搜索 + 轮播）配置 */
type PanelOptions = {
  list: CombSlide[];
  /** 顶部搜索样式：full / simple */
  searType?: string | number | boolean;
  logoUrl?: string;
  logoFixUrl?: string;
  placeWords?: string;
  /** 热门搜索词（数组，模板里会增删） */
  hotWords: string[];
  hotInterval?: number;
  textColor?: string;
  boxColor?: string;
  textAlign?: string | number | boolean;
  searchRadius?: number;
  showTabs?: string | number | boolean;
  tabColor?: string;
  tabActiveColor?: string;
  tabList: CombTab[];
  swiperStyle?: string | number | boolean;
  indicatorStyle?: string | number | boolean;
  indicatorPosition?: string | number | boolean;
  indicatorColor?: string;
  bannerRadius?: number;
  pageGap?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Record<string, unknown>] }>();

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, string> = {};

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。

const defaults = ref(DEFAULTS);
const activeSub = ref("search");
const subTabs = ref([
        { key: "search", title: "搜索框" },
        { key: "tabs", title: "选项卡" },
        { key: "banner", title: "轮播图" },
      ]);
const textAlignOptions = ref([
        { value: "left", title: "居左" },
        { value: "center", title: "居中" },
        { value: "right", title: "居右" },
      ]);
const indicatorStyleOptions = ref([
        { value: "round", title: "圆形" },
        { value: "line", title: "直线" },
        { value: "none", title: "无" },
      ]);
const indicatorPositionOptions = ref([
        { value: "left", title: "居左" },
        { value: "center", title: "居中" },
        { value: "right", title: "居右" },
      ]);
const cascaderProps = ref({
        value: "id",
        label: "name",
        children: "children",
        emitPath: false,
        checkStrictly: true,
      });
const categoryTree = ref<Array<Record<string, unknown>>>([]);
const specialList = ref<Array<Record<string, unknown>>>([]);
const picModelFlag = ref(false);
/** 当前要写入的目标：Logo 字段名，或某张轮播图 */
type PicTarget =
  | { type: "logo"; key: string }
  | { type: "banner"; item: Record<string, unknown> };
const picTarget = ref<PicTarget | null>(null);
// 链接选择器与当前正在配置的轮播项：用 ref 变量，不再读 $refs / 挂到 this 上
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);
const currentBannerItem = ref<Record<string, unknown> | null>(null);

function loadSelectData() {
      getCategoryTree()
        .then((res) => {
          if (res && res.success) {
            categoryTree.value = res.result || [];
          }
        })
        .catch(() => {});
      getHomeList({
        pageClientType: "H5",
        pageType: "SPECIAL",
        pageNumber: 1,
        pageSize: 100,
      })
        .then((res) => {
          if (res && res.success && res.result) {
            specialList.value = res.result.records || [];
          }
        })
        .catch(() => {});
    
}

// 原生成代码把 addHotWord 注释在 TODO 块里，但模板仍然绑定 @click="addHotWord"
function addHotWord() {
  const options = local;
  if (!Array.isArray(options.hotWords)) options.hotWords = [];
  options.hotWords.push("");
}

function removeHotWord(index: number) {
      local.hotWords.splice(index, 1);
    
}

/** 新增一个选项卡 */
function addTab() {
  const options = local;
  if (!Array.isArray(options.tabList)) options.tabList = [];
  options.tabList.push({ title: "新选项卡", key: `tab_${Date.now()}`, dataType: "goods", value: "" });
}

function removeTab(index: number) {
      local.tabList.splice(index, 1);
    
}

function moveTab(index: number, dir: number) {
  const list = local.tabList;
  if (!list) return;
  const target = index + dir;
  if (target < 0 || target >= list.length) return;
  list.splice(target, 1, ...list.splice(index, 1, list[target]));
    
}

/** 新增一张轮播图 */
function addBanner() {
  const options = local;
  if (!Array.isArray(options.list)) options.list = [];
  options.list.push({ img: "", url: {} });
}

function removeBanner(index: number) {
      local.list.splice(index, 1);
    
}

function moveBanner(index: number, dir: number) {
      const list = local.list;
      const target = index + dir;
      if (target < 0 || target >= list.length) return;
      list.splice(target, 1, ...list.splice(index, 1, list[target]));
    
}

/** 选 Logo：记住要写回的字段名，然后打开素材库 */
function pickLogo(key: string) {
  picTarget.value = { type: "logo", key };
  openOssDialog();
}

function pickBannerImage(item: CombSlide) {
      picTarget.value = { type: "banner", item };
      openOssDialog();
    
}

/** 打开素材选择器（首页组合只支持图片） */
function openOssDialog() {
  picModelFlag.value = true;
}

function onOssSelected(val: { url?: string }) {
  picModelFlag.value = false;
  if (!val || !val.url || !picTarget.value) return;
  if (picTarget.value.type === "logo") {
    (local as Record<string, unknown>)[String(picTarget.value.key ?? "")] = val.url;
      } else if (picTarget.value.type === "banner" && picTarget.value.item) {
        picTarget.value.item.img = val.url;
      }
    
}

/** 选轮播链接：记住当前条目，再打开链接选择器 */
function pickBannerLink(item: CombSlide) {
  currentBannerItem.value = item;
  linkDialogRef.value?.openPicker("link");
}

function onSelectedLink(val: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      const target = currentBannerItem.value;
      if (!target || !val) return;
      delete val.selected;
      delete val.intro;
      delete val.mobileIntro;
      target.url = val;
    
}

function linkText(url: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
      const way = ways.find((e) => e.name === url.___type);
      const typeTitle = way ? way.title : "链接";
      const name =
        url.name || url.goodsName || url.memberName || url.title || "";
      return name ? `${typeTitle} - ${name}` : typeTitle;
    
}

/**
 * 本地副本：初始化时取 local 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/** 本地副本：保留已有轮播项/页签/热词（不能初始化成空数组，否则面板一打开就清空画布） */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
  tabList: Array.isArray(props.res.options?.tabList) ? props.res.options.tabList : [],
  hotWords: Array.isArray(props.res.options?.hotWords) ? props.res.options.hotWords : [],
});

if (!Array.isArray(local.hotWords)) {
  local.hotWords = ["兰蔻小黑瓶"];
}
if (!Array.isArray(local.tabList)) {
  local.tabList = JSON.parse(JSON.stringify(DEFAULTS.tabList));
}
if (!Array.isArray(local.list) || !local.list.length) {
  local.list = [
    {
      img: "https://i.loli.net/2020/12/05/fKH4CwImpbuD5Xj.png",
      link: "",
      size: "750*332",
      model: "link",
    },
    {
      img: "https://i.loli.net/2020/12/05/12kleCgrSLfKoQs.png",
      link: "",
      size: "750*332",
      model: "link",
    },
  ];
}
loadSelectData();

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

.panel-home-comb {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  .logo-label {
    font-size: 13px;
    color: #606266;
    .logo-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
  .logo-box {
    width: 120px;
    height: 44px;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    background: #fafafa;
    &:hover {
      border-color: #409eff;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .logo-add {
      font-size: 12px;
      color: #409eff;
    }
  }
}

.field-row {
  display: flex;
  align-items: center;
  .field-label {
    font-size: 14px;
    color: #606266;
    margin-right: 10px;
    flex-shrink: 0;
  }
}

.hot-word {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  .del {
    cursor: pointer;
    color: #909399;
    font-size: 18px;
    flex-shrink: 0;
    &:hover {
      color: #e1251b;
    }
  }
}

.interval-row {
  margin-top: 12px;
  .interval-input {
    flex: 1;
    min-width: 0;
  }
  .unit {
    margin-left: 8px;
    font-size: 13px;
    color: #909399;
  }
}

.tab-card,
.img-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: #fafafa;
}

.tab-card-head,
.img-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.tab-card-ops,
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
  background: #fff;
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
}

.btn-row {
  display: flex;
  gap: 8px;
}

.link-view {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-btn {
  width: 100%;
  margin-top: 4px;
}
</style>

<template>
  <div class="panel-goods">
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

    <!-- 旧版数据提示：保留原渲染，手动升级后才按新版配置 -->
    <div v-if="legacy" class="panel-card panel-card-fill">
      <div class="section-title">商品列表</div>
      <div class="section-tip">
        该楼层为旧版商品列表（分类标签 + 绑定商品），当前仍按旧版展示。
        升级后可使用展现形式、购物车按钮、商品筛选等新版功能，旧的分类与商品绑定将被清空。
      </div>
      <el-button type="primary" plain @click="upgradeLegacy">升级为新版</el-button>
    </div>

    <template v-else-if="activeTab === 'content'">
      <div class="panel-card">
        <div class="section-title">展现形式</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展现形式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                v-for="opt in layoutOptions"
                :key="opt.value"
                class="seg-item seg-icon"
                :class="{ active: firstItem.layout === opt.value }"
                @click="changeLayout(opt.value)"
              >
                <span class="ly-ico" :class="'ly-' + opt.value"><i></i><i></i><i></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="section-title">显示内容</div>
        <div class="ctrl-row">
          <div class="ctrl-label">展示信息</div>
          <div class="ctrl-body">
            <el-checkbox v-model="firstItem.showName">商品名称</el-checkbox>
            <el-checkbox v-model="firstItem.showPrice">商品价格</el-checkbox>
            <el-checkbox v-model="firstItem.showSales">已售数量</el-checkbox>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="section-title">购物车按钮</div>
        <div class="ctrl-row">
          <div class="ctrl-label">是否显示</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: firstItem.cartShow !== false }"
                @click="firstItem.cartShow = true"
              >
                显示
              </div>
              <div
                class="seg-item"
                :class="{ active: firstItem.cartShow === false }"
                @click="firstItem.cartShow = false"
              >
                隐藏
              </div>
            </div>
          </div>
        </div>
        <div class="ctrl-row" v-if="firstItem.cartShow !== false">
          <div class="ctrl-label">按钮样式</div>
          <div class="ctrl-body">
            <div class="seg layout-seg-3">
              <div
                v-for="opt in cartStyleOptions"
                :key="opt.value"
                class="seg-item seg-icon"
                :class="{ active: firstItem.cartStyle === opt.value }"
                @click="firstItem.cartStyle = opt.value"
              >
                <span v-if="opt.value === 'text'" class="cart-text-ico">加购</span>
                <span v-else-if="opt.value === 'plus'" class="cart-plus-ico">+</span>
                <span v-else class="cart-cart-ico">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path
                      d="M7 4h-2l-1 2h2l2.4 9.6a2 2 0 0 0 1.9 1.4h7.9a2 2 0 0 0 1.9-1.5l1.6-6.5h-12l-.8-3h11.5l.5-2h-13.4l-.0-.0zM10 20a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="ctrl-row" v-if="firstItem.cartShow !== false">
          <div class="ctrl-label">按钮效果</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: firstItem.cartAction !== 'add' }"
                @click="firstItem.cartAction = 'detail'"
              >
                进入商品详情页
              </div>
              <div
                class="seg-item"
                :class="{ active: firstItem.cartAction === 'add' }"
                @click="firstItem.cartAction = 'add'"
              >
                商品加购
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">商品设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">选择方式</div>
          <div class="ctrl-body">
            <el-radio-group v-model="firstItem.dataMode">
              <el-radio value="category">商品分类</el-radio>
              <el-radio value="brand">商品品牌</el-radio>
              <el-radio value="store">指定商户</el-radio>
              <el-radio value="goods">指定商品</el-radio>
            </el-radio-group>
          </div>
        </div>

        <template v-if="firstItem.dataMode === 'category'">
          <div class="ctrl-row">
            <div class="ctrl-label">商品分类</div>
            <div class="ctrl-body">
              <el-cascader
                :model-value="firstItem.categoryId"
                @update:model-value="(v: unknown) => (firstItem.categoryId = v as string | number | undefined)"
                :options="categoryTree"
                :props="cascaderProps"
                placeholder="全部分类"
                clearable
              />
            </div>
          </div>
          <slider-field v-model="firstItem.count" label="商品数量" :min="1" :max="50" />
          <div class="ctrl-row">
            <div class="ctrl-label">商品排序</div>
            <div class="ctrl-body">
              <div class="seg layout-seg-3">
                <div
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  class="seg-item"
                  :class="{ active: firstItem.sortType === opt.value }"
                  @click="firstItem.sortType = opt.value"
                >
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="firstItem.dataMode === 'brand'">
          <div class="ctrl-row">
            <div class="ctrl-label">商品品牌</div>
            <div class="ctrl-body">
              <el-select v-model="firstItem.brandId" placeholder="全部品牌" clearable filterable>
                <el-option
                  v-for="b in brandList"
                  :key="String(b.id ?? '')"
                  :label="b.name"
                  :value="String(b.id ?? '')"
                />
              </el-select>
            </div>
          </div>
          <slider-field v-model="firstItem.count" label="商品数量" :min="1" :max="50" />
          <div class="ctrl-row">
            <div class="ctrl-label">商品排序</div>
            <div class="ctrl-body">
              <div class="seg layout-seg-3">
                <div
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  class="seg-item"
                  :class="{ active: firstItem.sortType === opt.value }"
                  @click="firstItem.sortType = opt.value"
                >
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="firstItem.dataMode === 'store'">
          <div class="ctrl-row">
            <div class="ctrl-label">指定商户</div>
            <div class="ctrl-body">
              <el-select v-model="firstItem.storeId" placeholder="全部商户" clearable filterable>
                <el-option
                  v-for="s in storeList"
                  :key="String(s.id ?? '')"
                  :label="s.storeName"
                  :value="String(s.id ?? '')"
                />
              </el-select>
            </div>
          </div>
          <slider-field v-model="firstItem.count" label="商品数量" :min="1" :max="50" />
          <div class="ctrl-row">
            <div class="ctrl-label">商品排序</div>
            <div class="ctrl-body">
              <div class="seg layout-seg-3">
                <div
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  class="seg-item"
                  :class="{ active: firstItem.sortType === opt.value }"
                  @click="firstItem.sortType = opt.value"
                >
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="goods-wall">
            <div
              class="goods-wall-item"
              v-for="(g, i) in firstItem.goodsList"
              :key="String(g.id ?? i)"
            >
              <img :src="String(g.thumbnail ?? '')" alt="" />
              <div class="goods-wall-del" @click="firstItem.goodsList.splice(i, 1)">
                <el-icon><Close /></el-icon>
              </div>
            </div>
            <div class="goods-wall-add" @click="pickGoods">
              <el-icon><Plus /></el-icon>
            </div>
          </div>
          <div class="section-tip">最多选择 50 个商品，展示顺序与选择顺序一致</div>
        </template>
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
        <color-field
          v-model="local.titleColor"
          label="商品标题颜色"
          :default-value="defaults.titleColor"
        />
        <div class="ctrl-row">
          <div class="ctrl-label">色调</div>
          <div class="ctrl-body">
            <div class="seg layout-seg">
              <div
                class="seg-item"
                :class="{ active: local.toneMode !== 'custom' }"
                @click="local.toneMode = 'theme'"
              >
                跟随主题风格
              </div>
              <div
                class="seg-item"
                :class="{ active: local.toneMode === 'custom' }"
                @click="local.toneMode = 'custom'"
              >
                自定义
              </div>
            </div>
          </div>
        </div>
        <color-field
          v-if="local.toneMode === 'custom'"
          v-model="local.priceColor"
          label="价格颜色"
          :default-value="defaults.priceColor"
        />
        <color-field
          v-model="local.salesColor"
          label="已售数量颜色"
          :default-value="defaults.salesColor"
        />
      </div>

      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingTop" label="上边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingBottom" label="下边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.contentGap" label="内容间距" :min="0" :max="50" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
        <slider-field v-model="local.contentRadius" label="内容圆角" :min="0" :max="30" unit="rpx" />
      </div>
    </template>

    <liliDialog ref="linkDialogRef" @selectedGoodsData="onGoodsSelected"></liliDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import { Close, Plus } from "@element-plus/icons-vue";
import GradientField from "../controls/gradient-field.vue";
import ColorField from "../controls/color-field.vue";
import SliderField from "../controls/slider-field.vue";
import { getCategoryTree, getBrandListData } from "@/api/goods";
import { getShopListData } from "@/api/shops";

defineOptions({ name: "PanelGoods", hideDecorateTitle: true });

// 链接选择器：模板 ref 指向真正的 ref 变量，调用其暴露的 open(mode)
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

/** 商品项（含"数据来源"配置，模板里都直接绑定） */
type GoodsItem = {
  id?: string | number;
  goodsId?: string | number;
  goodsName?: string;
  price?: number | string;
  thumbnail?: string;
  img?: string;
  buyCount?: number | string;
  active?: boolean;
  value?: unknown;

  // —— 展示开关（el-checkbox 值域宽）——
  showName?: string | number | boolean;
  showPrice?: string | number | boolean;
  showSales?: string | number | boolean;

  // —— 数据来源 ——
  /** manual / category / brand / store / goods */
  dataMode?: string | number | boolean;
  categoryId?: string | number;
  brandId?: string | number;
  storeId?: string | number;
  /** new / sales / price */
  sortType?: string | number | boolean;
  /** 展示数量 */
  count?: number;
  /** 布局（card / big / two / three） */
  layout?: string | number | boolean;
  /** 购物车按钮样式 */
  cartStyle?: string | number | boolean;
  /** 购物车按钮动作 */
  cartAction?: string | number | boolean;
  /** 是否显示购物车按钮 */
  cartShow?: string | number | boolean;
  /** 手动选择的商品 */
  goodsList: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

/** 面板配置 */
type PanelOptions = {
  /** 商品列表（内部还可能有 type 等字段） */
  list: Array<GoodsItem & Record<string, unknown>>;
  titleColor?: string;
  priceColor?: string;
  salesColor?: string;
  /** 色调模式 */
  toneMode?: string | number | boolean;
  bgColor1?: string;
  bgColor2?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  contentGap?: number;
  pageGap?: number;
  borderRadius?: number;
  contentRadius?: number;
  [key: string]: unknown;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Record<string, unknown>] }>();

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, string> = {};
// 同理：原代码引用了未定义的 DEFAULT_ITEM（列表默认项），显式声明为空对象
const DEFAULT_ITEM: Record<string, unknown> = {};

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。

// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。

const defaults = ref(DEFAULTS);
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);
const legacy = ref(false);
const layoutOptions = ref([
        { value: "card", label: "卡片" },
        { value: "list", label: "列表" },
        { value: "three", label: "三列" },
        { value: "big", label: "大图" },
      ]);
const sortOptions = ref([
        { value: "default", label: "综合" },
        { value: "sales", label: "销量" },
        { value: "price", label: "价格" },
      ]);
const cascaderProps = ref({
        label: "name",
        value: "id",
        children: "children",
        checkStrictly: true,
        emitPath: false,
      });
/** 分类树节点 */
type CategoryOption = { id?: string | number; name?: string; children?: CategoryOption[] };

/** 品牌 / 店铺选项（下拉用） */
type OptionItem = { id?: string | number; name?: string; storeName?: string };

const categoryTree = ref<CategoryOption[]>([]);
const brandList = ref<OptionItem[]>([]);
const storeList = ref<OptionItem[]>([]);

const firstItem = computed(() => {
      return local.list?.[0];
    });
/** 卡片/大图支持文字按钮，两列/三列只保留图标按钮 */
const cartStyleOptions = computed(() => {
  const base = [
    { value: "plus", label: "加号" },
    { value: "cart", label: "购物车" },
    { value: "text", label: "文字" },
  ];
  const layout = firstItem.value?.layout;
  const iconOnly = layout === "three" || layout === "two";
  return iconOnly ? base.filter((opt) => opt.value !== "text") : base;
});

function fillItemDefaults(item: Record<string, unknown>) {
      Object.keys(DEFAULT_ITEM).forEach((key) => {
        if (item[key] === undefined) {
          item[key] = Array.isArray(DEFAULT_ITEM[key])
            ? [...DEFAULT_ITEM[key]]
            : DEFAULT_ITEM[key];
        }
      });
    
}

function upgradeLegacy() {
      const item = firstItem;
      delete item.value.titleWay;
      delete item.value.listWay;
      if (item.value) fillItemDefaults(item.value);
      legacy.value = false;
      getCategoryTree().then((res) => {
        if (res && res.success) categoryTree.value = res.result || [];
      });
      getBrandListData().then((res) => {
        brandList.value = Array.isArray(res) ? res : (res && res.result) || [];
      });
      getShopListData({ pageNumber: 1, pageSize: 100, status: "OPEN" }).then((res) => {
        const records = (res && res.result && res.result.records) || [];
        storeList.value = records.map((r) => ({ id: r.id, storeName: r.storeName }));
      });
    
}

function changeLayout(val: string | number | boolean) {
      firstItem.value.layout = val;
      // 两列/三列不支持文字按钮，切布局时兜底
      if (
        (val === "list" || val === "three") &&
        firstItem.value.cartStyle === "text"
      ) {
        firstItem.value.cartStyle = "plus";
      }
    
}

function pickGoods() {
  linkDialogRef.value?.openPicker("goods");
}

function onGoodsSelected(val: Array<Record<string, unknown>>) {
      if (!Array.isArray(val) || !val.length) return;
      const list = val.map((item) => ({
        id: item.id,
        goodsId: item.goodsId,
        goodsName: item.goodsName,
        price: item.price,
        thumbnail: item.thumbnail,
        buyCount: item.buyCount,
      }));
      if (!firstItem.value) return;
      const exist = new Set(firstItem.value.goodsList.map((g) => g.id));
      const merged = firstItem.value.goodsList.concat(
        list.filter((g) => !exist.has(g.id))
      );
      firstItem.value.goodsList = merged.slice(0, 50);
    
}

/**
 * 本地副本：初始化时取 local 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/** 本地副本：保留已有商品（不能初始化成空数组，否则面板一打开就清空画布） */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
});

if (!Array.isArray(local.list) || !local.list?.[0]) {
  local.list = [{ ...DEFAULT_ITEM, goodsList: [] }];
}
const item = firstItem;
// 老数据（没有 layout 但有 titleWay）标记 legacy，并跳过新版默认值补全
// 原本这段在 IIFE 里用 return 提前退出，提到顶层后改成 if/else，语义不变
const isLegacyData =
  item.value.layout === undefined && Array.isArray(item.value.titleWay);
if (isLegacyData) {
  legacy.value = true;
} else {
  if (item.value) fillItemDefaults(item.value);
  getCategoryTree().then((res) => {
    if (res && res.success) categoryTree.value = res.result || [];
  });
  getBrandListData().then((res) => {
    brandList.value = Array.isArray(res) ? res : (res && res.result) || [];
  });
  getShopListData({ pageNumber: 1, pageSize: 100, status: "OPEN" }).then((res) => {
    const records = (res && res.result && res.result.records) || [];
    storeList.value = records.map((r) => ({ id: r.id, storeName: r.storeName }));
  });
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

.seg-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 6px 10px;
}

// 展现形式小图标
.ly-ico {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 14px;
  i {
    display: block;
    background: currentColor;
    border-radius: 1px;
  }
}
.ly-card {
  i:first-child {
    width: 8px;
    height: 10px;
  }
  i:not(:first-child) {
    width: 12px;
    height: 2px;
  }
  flex-wrap: wrap;
  width: 24px;
  align-content: center;
}
.ly-list {
  i {
    width: 8px;
    height: 10px;
    &:nth-child(3) {
      display: none;
    }
  }
}
.ly-three {
  i {
    width: 6px;
    height: 10px;
  }
}
.ly-big {
  i:first-child {
    width: 22px;
    height: 10px;
  }
  i:not(:first-child) {
    display: none;
  }
}

// 购物车按钮样式小图标
.cart-text-ico {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 8px;
  background: #c0c4cc;
  color: #fff;
  font-size: 11px;
  line-height: 14px;
}
.cart-plus-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #c0c4cc;
  color: #fff;
  font-size: 12px;
  line-height: 1;
}
.seg-item.active .cart-text-ico,
.seg-item.active .cart-plus-ico {
  background: #409eff;
}
.cart-cart-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.goods-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.goods-wall-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .goods-wall-del {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
  }
}
.goods-wall-add {
  width: 72px;
  height: 72px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 22px;
  cursor: pointer;
  &:hover {
    border-color: #409eff;
    color: #409eff;
  }
}
</style>

<template>
  <div class="panel-article">
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
        <div class="section-title">文章设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">标题</div>
          <div class="ctrl-body">
            <el-input v-model="firstItem.title" />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label">文章分类</div>
          <div class="ctrl-body">
            <el-select
              v-model="firstItem.categoryId"
              placeholder="全部分类"
              clearable
             
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </div>
        </div>
        <slider-field
          v-model="firstItem.count"
          label="文章数量"
          :min="1"
          :max="10"
        />
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
          label="标题颜色"
          :default-value="defaults.titleColor"
        />
      </div>

      <div class="panel-card">
        <div class="section-title">边距设置</div>
        <slider-field v-model="local.paddingTop" label="上边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.paddingBottom" label="下边距" :min="0" :max="100" unit="rpx" />
        <slider-field v-model="local.contentGap" label="文章间距" :min="0" :max="50" unit="rpx" />
        <slider-field v-model="local.paddingX" label="左右边距" :min="0" :max="40" unit="rpx" />
        <slider-field v-model="local.pageGap" label="页面间距" :min="0" :max="100" unit="rpx" />
      </div>

      <div class="panel-card panel-card-fill">
        <div class="section-title">圆角设置</div>
        <slider-field v-model="local.borderRadius" label="背景圆角" :min="0" :max="30" unit="rpx" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import { getArticleCategory } from "@/api/pages";
import ColorField from "../controls/color-field.vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";

defineOptions({ name: "PanelArticle", hideDecorateTitle: true });

/** 单篇文章/列表项 */
type ArticleItem = {
  title?: string;
  categoryId?: string | number;
  count?: number;
};

/** 面板配置 */
type PanelOptions = {
  list: ArticleItem[];
  bgColor1?: string;
  bgColor2?: string;
  titleColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  contentGap?: number;
  pageGap?: number;
  borderRadius?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

// 该面板原先引用了不存在的全局 DEFAULTS / DEFAULT_ITEM（打开即 ReferenceError），
// 这里显式声明：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Partial<PanelOptions> = {};
const DEFAULT_ITEM: ArticleItem = {};

/**
 * 本地副本：初始化时取 props.res.options 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/** 本地副本：必须保留组件已有的文章配置（不能初始化成空数组，否则面板一打开就清空画布） */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
});
if (!local.list[0]) {
  local.list = [{ ...DEFAULT_ITEM }];
}

const defaults = ref<Partial<PanelOptions>>(DEFAULTS);
type ArticleCategoryNode = {
  id?: string | number;
  articleCategoryName?: string;
  children?: ArticleCategoryNode[];
};
type CategoryOption = { id: string; name: string };

/** 文章分类是树结构，下拉里要拍平；子级用全角空格缩进，保留层级感 */
function flattenCategories(tree: ArticleCategoryNode[], depth = 0): CategoryOption[] {
  const nodes = Array.isArray(tree) ? tree : [];
  return nodes.flatMap((node) => {
    const label = node?.articleCategoryName ?? "";
    const option: CategoryOption = {
      id: String(node?.id ?? ""),
      name: `${"　".repeat(depth)}${label}`,
    };
    const children = Array.isArray(node?.children)
      ? flattenCategories(node.children, depth + 1)
      : [];
    return [option, ...children];
  });
}

const categories = ref<CategoryOption[]>([]);

// 分类是异步拉取的，放在声明之后调用，避免 TDZ
getArticleCategory().then((res: { success?: boolean; result?: ArticleCategoryNode[] }) => {
  if (res?.success) {
    categories.value = flattenCategories(res.result ?? []);
  }
});
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);

const firstItem = computed<ArticleItem>(() => local.list?.[0] ?? {} );

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
</style>

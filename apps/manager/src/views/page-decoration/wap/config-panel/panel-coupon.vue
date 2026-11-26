<template>
  <div class="panel-coupon">
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
        <div class="section-title">展示设置</div>
        <div class="ctrl-row">
          <div class="ctrl-label">标题</div>
          <div class="ctrl-body">
            <el-input v-model="firstItem.title" />
          </div>
        </div>
        <slider-field v-model="firstItem.count" label="展示数量" :min="1" :max="10" />
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
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import GradientField from "../controls/gradient-field.vue";
import SliderField from "../controls/slider-field.vue";

defineOptions({ name: "PanelCoupon", hideDecorateTitle: true });

/** 优惠券列表项 */
type CouponItem = {
  title?: string;
  count?: number;
};

/** 面板配置 */
type PanelOptions = {
  list: CouponItem[];
  layoutStyle?: string;
  bgColor1?: string;
  bgColor2?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  contentGap?: number;
  pageGap?: number;
  borderRadius?: number;
};

const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 props.res.options 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
/** 列表默认项：不臆造设计值，只保证新加项是空对象 */
const DEFAULT_ITEM: CouponItem = {};

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
// 该面板原先引用了一个不存在的全局 DEFAULTS（打开会 ReferenceError），
// 这里显式声明为空对象：不臆造设计默认值，仅保证面板可正常加载。
const DEFAULTS: Record<string, unknown> = {};
// 同理：原代码引用了未定义的 DEFAULT_ITEM（列表默认项），显式声明为空对象
const defaults = ref<Record<string, string>>(DEFAULTS as Record<string, string>);
const activeTab = ref("content");
const tabs = ref([
        { key: "content", title: "内容" },
        { key: "style", title: "样式" },
      ]);
const layoutOptions = ref([
        { value: "1", title: "样式一" },
        { value: "2", title: "样式二" },
        { value: "3", title: "样式三" },
        { value: "4", title: "样式四" },
      ]);

const firstItem = computed<CouponItem>(() => local.list?.[0] ?? {});

</script>

<style scoped lang="scss">
@import "../controls/field-common.scss";
@import "../controls/panel-common.scss";

.panel-coupon {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 0 12px 12px;
  min-height: 100%;
  box-sizing: border-box;
}
</style>

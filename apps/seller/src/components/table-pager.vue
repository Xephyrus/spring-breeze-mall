<template>
  <!-- 列表页统一分页条：49 个列表页里 44 处 layout 完全一致，抽成组件避免各处手写属性 -->
  <el-pagination
    v-model:current-page="page"
    v-model:page-size="size"
    :class="className"
    :page-sizes="pageSizes"
    :total="total"
    :layout="layout"
    :size="small ? 'small' : 'default'"
    @current-change="onCurrentChange"
    @size-change="onSizeChange"
  />
</template>

<script setup lang="ts">
/**
 * 列表页统一分页条（与 manager 的 `table-pager.vue` 同源，便于后续抽到 packages/shared）。
 *
 * 用法：
 * ```vue
 * <TablePager
 *   v-model:page="searchForm.pageNumber"
 *   v-model:size="searchForm.pageSize"
 *   :total="total"
 *   @current-change="loadData"
 *   @size-change="handleSizeChange"
 * />
 * ```
 *
 * 约定：`size-change` 时是否重置到第 1 页由调用方决定（各页逻辑不同，组件不猜）。
 */
defineOptions({ name: "TablePager" });

const page = defineModel<number>("page", { required: true });
const size = defineModel<number>("size", { required: true });

withDefaults(
  defineProps<{
    total?: number;
    pageSizes?: number[];
    layout?: string;
    small?: boolean;
    className?: string;
  }>(),
  {
    total: 0,
    pageSizes: () => [20, 50, 100],
    // 商家端列表页的主流布局（44/49）
    layout: "total, sizes, prev, pager, next, jumper",
    small: true,
    className: "",
  }
);

const emit = defineEmits<{
  (e: "current-change", value: number): void;
  (e: "size-change", value: number): void;
}>();

function onCurrentChange(value: number): void {
  emit("current-change", value);
}

function onSizeChange(value: number): void {
  emit("size-change", value);
}
</script>

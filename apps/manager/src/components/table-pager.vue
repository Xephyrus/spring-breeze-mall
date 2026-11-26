<template>
  <!-- 统一分页条：全站 95 个列表页共用同一套 layout / 每页条数 / 交互事件 -->
  <el-pagination
    v-model:current-page="page"
    v-model:page-size="size"
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
 * 列表页统一分页条。
 *
 * 背景：全站 95 个列表页各写一遍 `<el-pagination>`，
 * 其中 **43 处的属性完全一样**、10 处只差回调、5 处只差 layout。
 *
 * 用法：
 * ```vue
 * <TablePager
 *   v-model:page="searchForm.pageNumber"
 *   v-model:size="searchForm.pageSize"
 *   :total="total"
 *   @current-change="getDataList"
 *   @size-change="handleSizeChange"
 * />
 * ```
 *
 * 约定：`size-change` 时把页码重置为 1 由调用方决定（不同页面逻辑不同，不在这里猜）。
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
  }>(),
  {
    total: 0,
    pageSizes: () => [20, 50, 100],
    layout: "total, sizes, prev, pager, next, jumper",
    small: true,
  }
);

const emit = defineEmits<{
  (e: "current-change", value: number): void;
  (e: "size-change", value: number): void;
}>();

function onCurrentChange(value: number) {
  emit("current-change", value);
}

function onSizeChange(value: number) {
  emit("size-change", value);
}
</script>

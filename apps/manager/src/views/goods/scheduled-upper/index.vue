<template>
  <goods-list :key="`${activeStatus}-${refreshKey}`" scheduled-only read-only :scheduled-status="activeStatus" @delete-schedule="deleteSchedule">
    <template #scheduled-controls>
      <el-tabs
        :model-value="activeStatus"
        @update:model-value="(v: string | number | undefined) => (activeStatus = String(v ?? 'SCHEDULED_UPPER'))"
      >
        <el-tab-pane label="定时上架" name="SCHEDULED_UPPER" />
        <el-tab-pane label="定时下架" name="SCHEDULED_DOWN" />
      </el-tabs>
    </template>
  </goods-list>
</template>

<script setup lang="ts">
/**
 * 平台商品定时上架列表。
 * @author Bulbasaur
 * @since 2026-11-03
 */
import GoodsList from "@/views/goods/goods-info/goods.vue";
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { cancelGoodsMarketSchedule } from "@/api/goods";

defineOptions({ name: "goodsScheduledUpper" });

const activeStatus = ref<string>("SCHEDULED_UPPER");
const refreshKey = ref(0);

async function deleteSchedule(row: { id?: string | number; goodsName?: string }) {
  const status = activeStatus.value === "SCHEDULED_UPPER" ? "UPPER" : "DOWN";
  try {
    await ElMessageBox.confirm(`确认删除“${row.goodsName}”的定时${status === 'UPPER' ? '上架' : '下架'}计划？`, "删除定时计划", { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" });
  } catch {
    return;
  }
  try {
    const res = await cancelGoodsMarketSchedule(String(row.id ?? ""), status);
    if (res.success) {
      ElMessage.success("定时计划已删除");
      refreshKey.value++;
    }
  } catch {
    // 接口错误由统一拦截器提示。
  }
}
</script>

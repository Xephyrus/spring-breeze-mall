<!--
  小程序订单同步日志抽屉：按支付流水展示审计记录，不显示原始身份或支付凭据。
  @author Bulbasaur
  @since 2026-11-09
-->
<template>
  <el-drawer :model-value="modelValue" title="微信订单同步日志" size="min(1100px, 95vw)" @update:model-value="emit('update:modelValue', $event)">
    <p>订单：{{ orderSn }}。日志包含同笔微信支付下的关联子订单操作；上报成功仅代表微信接口已受理。</p>
    <el-button :loading="loading" @click="load">刷新</el-button>
    <el-alert v-if="failed" title="日志加载失败，请点击刷新重试" type="error" :closable="false" class="mt_10" />
    <el-table v-loading="loading" :data="records" class="mt_10" empty-text="暂无本地同步记录，历史上报结果需核查">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="log-detail">
            <p>触发订单：{{ row.orderSn }}</p>
            <p>请求摘要：{{ row.summary || '—' }}</p>
            <p>错误码：{{ row.errorCode || '—' }}</p>
            <p>处理原因：{{ row.errorMessage || '—' }}</p>
            <p>结束时间：{{ row.finishTime || '—' }}；耗时：{{ row.durationMs == null ? '—' : `${row.durationMs} 毫秒` }}</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="操作时间" width="175" />
      <el-table-column label="操作" width="110">
        <template #default="{ row }">{{ row.operation === 'RECEIVE' ? '收货通知' : '发货上报' }}</template>
      </el-table-column>
      <el-table-column label="来源" width="110">
        <template #default="{ row }">{{ row.triggerType === 'MANUAL' ? '人工补报' : '自动事件' }}</template>
      </el-table-column>
      <el-table-column prop="operatorName" label="操作人" min-width="100" />
      <el-table-column label="结果" min-width="120">
        <template #default="{ row }"><el-tag :type="wechatSyncTag(row.status)">{{ wechatSyncLabel(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="errorMessage" label="处理原因" min-width="220" show-overflow-tooltip />
    </el-table>
    <el-pagination v-model:current-page="searchForm.pageNumber" :page-size="20" :total="total" layout="total, prev, pager, next" class="mt_10" @current-change="handleCurrentChange" />
  </el-drawer>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref, watch } from "vue";
import { getWechatOrderLogs } from "@/api/order";
import { wechatSyncLabel, wechatSyncTag } from "@/utils/wechat-order-sync";

const props = defineProps({ modelValue: Boolean, orderSn: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue"]);
const failed = ref(false);
// 抽屉内列表：immediate false（打开抽屉时才加载），失败态由本组件维护
const {
  loading,
  data: records,
  total,
  searchForm,
  getDataList: loadLogs,
  handleCurrentChange,
} = useTable<Record<string, unknown>>(
  // 原接口是 (orderSn, params) 两参形式，这里包一层适配成 fetcher(params)
  (params) => getWechatOrderLogs(props.orderSn, params),
  {
    form: { pageNumber: 1 },
    pageSize: 20,
    immediate: false,
  }
);


/** 加载日志（失败时置 failed，供抽屉顶部提示）。 */
async function load() {
  if (!props.modelValue || !props.orderSn) return;
  failed.value = false;
  try {
    const res = (await loadLogs()) as { success?: boolean } | undefined;
    if (res && res.success === false) throw new Error("日志加载失败");
  } catch {
    failed.value = true;
  }
}

watch(
  () => [props.modelValue, props.orderSn],
  () => {
    searchForm.pageNumber = 1;
    if (props.modelValue) load();
  },
  { immediate: true }
);
</script>

<style scoped>
.log-detail { padding: 0 20px; overflow-wrap: anywhere; }
</style>

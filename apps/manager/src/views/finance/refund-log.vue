<template>
  <div class="search">
    <el-card>
      <el-form inline @keyup.enter="handleSearch">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderSn" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="mt_10">
      <el-table v-loading="loading" border :data="data">
        <el-table-column prop="afterSaleNo" label="售后单号" min-width="160" />
        <el-table-column prop="orderSn" label="订单号" min-width="160" />
        <el-table-column prop="totalAmount" label="退款金额" width="110" />
        <el-table-column prop="paymentName" label="退款方式" width="120" />
        <el-table-column prop="isRefund" label="已退款" width="90" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
      </el-table>
      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, prev, pager, next" @current-change="getDataList" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import * as API_Finance from "@/api/finance";
import { downloadBlob } from "@/utils/download-blob";

defineOptions({ name: "finance-refund-log" });

const { loading, data, total, searchForm, getDataList, handleSearch } = useTable(
  API_Finance.refundLogPage,
  { pageSize: 20, form: { orderSn: "" } }
);


function handleExport() {
  const { pageNumber: _pageNumber, pageSize: _pageSize, ...rest } = searchForm;
  API_Finance.exportRefundFlow(rest).then((res) => {
    const blob = res as unknown as Blob;
    downloadBlob(blob, "退款流水.xlsx");
  });
}
</script>

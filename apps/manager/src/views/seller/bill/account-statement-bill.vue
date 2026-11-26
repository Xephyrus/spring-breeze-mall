<template>
  <div class="search">
    <el-card>
      <el-form ref="searchFormRef" :model="searchForm" inline label-width="70px" class="search-form" @keyup.enter="handleSearch">
        <el-form-item label="账单编号" prop="sn">
          <el-input v-model="searchForm.sn" placeholder="请输入账单编号" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="出帐时间" prop="createTime">
          <el-date-picker
            v-model="selectDate"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 240px"
            @change="selectDateRange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
          <el-button class="search-btn" @click="handleExportList">导出列表</el-button>
          <el-button class="search-btn" :disabled="selectCount === 0" @click="handleBatchDownload">批量下载</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
        @selection-change="changeSelect"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="sn" label="账单号" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="生成时间" width="120" />
        <el-table-column label="结算时间段" width="200">
          <template #default="{ row }">
            <span v-if="row">{{ row.startTime }}~{{ row.endTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="店铺名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="结算金额" width="130">
          <template #default="{ row }">
            <priceColorScheme v-if="row" :value="row.billPrice" :color="$mainColor" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row" :type="billStatusTagType(row.billStatus)">{{ billStatusText(row.billStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <a v-if="row" class="link-text" @click="detail(row)">详细</a>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="onPageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as API_Shop from "@/api/shops";
import * as API_Finance from "@/api/finance";
import { downloadBlob } from "@/utils/download-blob";
import { ElMessage } from "element-plus";
import type { FormInstance, TableInstance } from "element-plus";
import { unixToDate } from "@/utils/filters";

defineOptions({ name: "bill" });

const router = useRouter();

type BillRow = { id?: string | number; [key: string]: unknown };

const searchFormRef = ref<FormInstance | null>(null);
const table = ref<TableInstance | null>(null);

// 分页 / loading / data / total / 查询 交给 useTable；
// 时间格式转换与 billStatus 固定值放在 beforeRequest 里，行为与原来一致
const {
  loading,
  data,
  total,
  searchForm,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<BillRow>(API_Shop.getBuyBillPage, {
  form: { sort: "createTime", order: "desc", startDate: "", endDate: "", sn: "" },
  pageSize: 20,
  beforeRequest: (params: Record<string, unknown>) => {
    if (params.startTime) {
      params.startTime = unixToDate(Number(params.startTime) / 1000);
    }
    if (params.endTime) {
      params.endTime = unixToDate(Number(params.endTime) / 1000);
    }
    params.billStatus = "CHECK";
    return params;
  },
});
const selectDate = ref<string[] | null>(null);
const selectList = ref<BillRow[]>([]);
const selectCount = ref(0);

function billStatusText(v: string | undefined) {
  const map: Record<string, string> = { OUT: "已出账", CHECK: "已对账", COMPLETE: "已付款" };
  return map[v ?? ""] || "已付款";
}
function billStatusTagType(v: string | undefined): "primary" | "success" | "warning" | "info" | "danger" {
  const map: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = { OUT: "primary", CHECK: "warning", COMPLETE: "success" };
  return map[v ?? ""] || "success";
}
function onPageChange(page: number) {
  handleCurrentChange(page);
  clearSelectAll();
}
function clearSelectAll() {
  table.value?.clearSelection();
}
function changeSelect(e: BillRow[]) {
  selectList.value = e;
  selectCount.value = e.length;
}
function selectDateRange(v: string[] | null) {
  if (v && v.length === 2) {
    searchForm.startDate = v[0];
    searchForm.endDate = v[1];
  } else {
    searchForm.startDate = "";
    searchForm.endDate = "";
  }
}
function detail(v: BillRow) {
  router.push({
    name: "bill-detail",
    query: { id: v.id },
  });
}
function handleExportList() {
  const params: Record<string, unknown> = { ...searchForm };
  delete params.billStatus;
  API_Finance.exportBillList(params).then((res) => {
    downloadBlob(res as unknown as Blob, "结算单列表.xlsx");
  });
}
function handleBatchDownload() {
  if (selectCount.value <= 0) {
    ElMessage.warning("请先选择结算单");
    return;
  }
  const billIds = selectList.value
    .map((item) => item.id)
    .filter((id): id is string | number => id !== undefined && id !== null && id !== "");
  API_Finance.batchDownloadBills(billIds).then((res) => {
    downloadBlob(res as unknown as Blob, "结算单批量下载.zip");
  });
}

// 首屏数据由 useTable 的 immediate 负责
</script>
<style lang="scss" scoped>
.link-text {
  color: #2d8cf0;
  cursor: pointer;
  text-decoration: none;
}
</style>

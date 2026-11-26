<template>
  <div class="search">
    <el-card>
      <el-form inline>
        <el-form-item label="发生日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="defaultTime"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="params.orderSn" clearable placeholder="订单编号" style="width: 160px" />
        </el-form-item>
        <el-form-item label="买家">
          <el-input v-model="params.memberName" clearable placeholder="买家名称" style="width: 140px" />
        </el-form-item>
        <el-form-item label="商品关键词">
          <el-input v-model="params.keyword" clearable placeholder="商品名称" style="width: 160px" />
        </el-form-item>
        <el-form-item label="店铺">
          <el-select v-model="params.storeId" clearable filterable placeholder="全部店铺" style="width: 180px">
            <el-option v-for="item in shops" :key="item.id" :label="item.storeName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="mt_10">
      <el-table v-loading="loading" border :data="data" style="width: 100%">
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ (params.pageNumber - 1) * params.pageSize + Number($index) + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="orderRefundSn" label="订单编号|售后单号" min-width="200" show-overflow-tooltip />
        <el-table-column prop="occurTime" label="发生时间" width="160" />
        <el-table-column prop="flowTypeName" label="交易类型" width="90" />
        <el-table-column prop="num" label="成交数量" width="90" align="right" />
        <el-table-column label="成交金额" width="110" align="right">
          <template #default="{ row }">{{ formatMoney(asRow(row).transactionAmount) }}</template>
        </el-table-column>
        <el-table-column label="售价金额" width="110" align="right">
          <template #default="{ row }">{{ formatMoney(asRow(row).salePriceAmount) }}</template>
        </el-table-column>
        <el-table-column label="优惠金额" width="110" align="right">
          <template #default="{ row }">{{ formatMoney(asRow(row).discountAmount) }}</template>
        </el-table-column>
        <el-table-column prop="paymentDetail" label="收款明细" width="120" show-overflow-tooltip />
        <el-table-column prop="discountDetail" label="优惠明细" min-width="160" show-overflow-tooltip />
        <el-table-column label="订单来源" width="100">
          <template #default="{ row }">{{ clientTypeText(asRow(row).clientType) }}</template>
        </el-table-column>
      </el-table>
      <TablePager v-model:page="params.pageNumber" v-model:size="params.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" :small="false" @current-change="loadData" @size-change="loadData" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useTable } from "@/utils/use-table";
import * as API_Statistics from "@/api/statistics";
import { getShopListData } from "@/api/shops";
import { downloadBlob } from "@/utils/download-blob";
import { unitPrice } from "@/utils/filters";

defineOptions({ name: "sales-order-detail-report" });

type SalesOrderDetailRow = {
  orderRefundSn?: string;
  occurTime?: string;
  flowTypeName?: string;
  num?: number;
  transactionAmount?: number | string;
  salePriceAmount?: number | string;
  discountAmount?: number | string;
  paymentDetail?: string;
  discountDetail?: string;
  clientType?: string;
};

type ShopOption = {
  id: string | number;
  storeName?: string;
};

type ShopPageResult = {
  success?: boolean;
  result?: {
    records?: ShopOption[];
  };
};

type ReportParams = Record<string, unknown> & {
  pageNumber?: number;
  pageSize?: number;
  storeId?: string;
  orderSn?: string;
  memberName?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
};

function asRow(row: unknown): SalesOrderDetailRow {
  return row as SalesOrderDetailRow;
}

const dateRange = ref<string[]>([]);
const defaultTime = ref<[Date, Date]>([
  new Date(2000, 0, 1, 0, 0, 0),
  new Date(2000, 0, 1, 23, 59, 59),
]);
const { loading, data, total, searchForm: params, getDataList: loadData, handleSearch } = useTable(
  API_Statistics.getSalesOrderDetailReport,
  {
    pageSize: 20,
    immediate: false,
    form: { storeId: "", orderSn: "", memberName: "", keyword: "" },
    beforeRequest: buildParams,
  }
);
const shops = ref<ShopOption[]>([]);

onMounted(() => {
  initDefaultRange();
  loadShops();
  loadData();
});

function initDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  dateRange.value = [formatDate(start, true), formatDate(end, false)];
}
function formatDate(date: Date, startOfDay: boolean) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return startOfDay ? `${y}-${m}-${d} 00:00:00` : `${y}-${m}-${d} 23:59:59`;
}
function loadShops() {
  getShopListData({ pageNumber: 1, pageSize: 200 }).then((res) => {
    const result = res as ShopPageResult;
    if (result.success) {
      shops.value = (result.result?.records || []).map((item) => ({
        id: item.id,
        storeName: item.storeName,
      }));
    }
  });
}
function buildParams(base: ReportParams = params as ReportParams) {
  const p: ReportParams = { ...base };
  if (dateRange.value && dateRange.value.length === 2) {
    p.startTime = dateRange.value[0];
    p.endTime = dateRange.value[1];
  }
  return p;
}
function handleExport() {
  API_Statistics.exportSalesOrderDetailReport(buildParams()).then((res) => {
    downloadBlob(res as unknown as Blob, "销售订单明细报表.xlsx");
  });
}
function formatMoney(val: number | string | undefined) {
  return unitPrice(val, "￥");
}
function clientTypeText(val: string | undefined) {
  const map: Record<string, string> = {
    H5: "移动端",
    PC: "PC端",
    WECHAT_MP: "小程序",
    APP: "移动应用端",
    UNKNOWN: "未知",
  };
  return map[val ?? ""] || val || "";
}
</script>

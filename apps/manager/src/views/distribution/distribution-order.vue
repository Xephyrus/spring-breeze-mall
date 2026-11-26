<template>
  <div class="search">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="70px"
        class="search-form"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="订单编号" prop="orderSn">
          <el-input
            v-model="searchForm.orderSn"
            placeholder="请输入订单编号"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="分销员" prop="distributionName">
          <el-input
            v-model="searchForm.distributionName"
            placeholder="请输入分销员名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="店铺名称">
          <el-select
            v-model="searchForm.storeId"
            placeholder="请选择"
            filterable
            remote
            :remote-method="searchChange"
            clearable
            style="width: 240px"
          >
            <el-option
              v-for="item in shopList"
              :key="String(item.id ?? '')"
              :label="item.storeName || ''"
              :value="item.id ?? ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单时间">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            placeholder="选择时间"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <el-tabs v-model="currentStatus" class="status-tabs" @tab-change="onStatusTabChange">
        <el-tab-pane label="全部" name="ALL" />
        <el-tab-pane label="未完成" name="NO_COMPLETED" />
        <el-tab-pane label="完成" name="COMPLETE" />
        <el-tab-pane label="退款" name="REFUND" />
      </el-tabs>
      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
      >
        <el-table-column
          prop="orderSn"
          label="订单编号"
          min-width="180"
          fixed="left"
          show-overflow-tooltip
        />
        <el-table-column label="客户信息" min-width="180">
          <template #default="{ row }">
            <div v-if="row" class="member-cell">
              <div class="member-name">{{ row.memberName || "-" }}</div>
              <div class="member-id">客户ID：{{ row.memberId || "-" }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div v-if="row" class="goods-msg">
              <img v-if="row.image" :src="row.image" class="goods-thumb" alt="" />
              <span v-else class="goods-thumb-empty">无图</span>
              <div class="goods-info">
                <div class="goods-name">{{ row.goodsName }}</div>
                <div class="goods-num">数量：x{{ row.num }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="一级分销员" min-width="180">
          <template #default="{ row }">
            <div v-if="row" class="member-cell">
              <div class="member-name">{{ row.distributionName || "-" }}</div>
              <div class="member-id">分销员ID：{{ row.distributionId || "-" }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="二级分销员" min-width="180">
          <template #default="{ row }">
            <div v-if="row" class="member-cell">
              <div class="member-name">{{ row.inviteDistributionName || "-" }}</div>
              <div class="member-id">分销员ID：{{ row.inviteDistributionId || "-" }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="店铺名称" min-width="100" show-overflow-tooltip />
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag v-if="row" :type="filterStatusTagType(row.distributionOrderStatus)">
              {{ filterStatus(row.distributionOrderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="一级佣金" min-width="100">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">
              {{ formatCommission(row.directCommission) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="二级佣金" min-width="100">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">
              {{ formatCommission(row.inviteCommission) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" fixed="right" />
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import type { LocationQuery, LocationQueryValue } from "vue-router";
import { getDistributionOrder } from "@/api/distribution";
import { getShopListData } from "@/api/shops";
import { unixToDate, unitPrice } from "@/utils/filters";
import type { FormInstance, TableInstance, TabPaneName } from "element-plus";

defineOptions({ name: "distributionOrder" });

type ShopOption = { id?: string | number; storeName?: string };

type OrderRow = {
  distributionOrderStatus?: string;
  directCommission?: number | string | null;
  inviteCommission?: number | string | null;
  inviteDistributionName?: string;
  inviteDistributionId?: string | number;
};


type ApiResult = {
  success?: boolean;
  result?: { records?: OrderRow[]; total?: number };
};

const route = useRoute();

const searchFormRef = ref<FormInstance | null>(null);
const table = ref<TableInstance | null>(null);

const timeRange = ref<string[]>([]);
const shopList = ref<ShopOption[]>([]);
const distributionId = ref<string | number | LocationQueryValue | LocationQueryValue[] | undefined>(
  route.query.id
);
const currentStatus = ref<TabPaneName>("ALL");
// 分页 / loading / data / total / 查询 交给 useTable；
// distributionId 注入与时间区间转换放在 beforeRequest，行为与原来一致
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<OrderRow>(getDistributionOrder, {
  form: { sort: "create_time", order: "desc", distributionOrderStatus: "", orderSn: "", distributionName: "", storeId: "" },
  pageSize: 20,
  beforeRequest: (params: Record<string, unknown>) => {
    if (distributionId.value) {
      params.distributionId = Array.isArray(distributionId.value)
        ? distributionId.value[0]
        : distributionId.value;
    } else {
      delete params.distributionId;
    }
    const range = timeRange.value;
    if (range && range[0] && range[1]) {
      params.startTime = unixToDate(new Date(range[0]).getTime() / 1000);
      params.endTime = unixToDate(new Date(range[1]).getTime() / 1000);
    } else {
      params.startTime = null;
      params.endTime = null;
    }
    return params;
  },
});

watch(
  () => route.query,
  (query: LocationQuery) => {
    distributionId.value = query.id ? query.id : undefined;
    getDataList();
  }
);

function init() {
  // 列表由 useTable 的 immediate 负责，这里只加载店铺下拉
  getShopList();
}
function onStatusTabChange(name: TabPaneName) {
  currentStatus.value = name;
  const key = String(name);
  searchForm.distributionOrderStatus = key === "ALL" ? "" : key;
  // 切 tab 回到第一页（useTable 的 searchForm 是 reactive，可直接写）
  searchForm.pageNumber = 1;
  getDataList();
}
function getShopList(val?: string) {
  const params = {
    pageNumber: 1,
    pageSize: 20,
    storeName: val || "",
  };
  getShopListData(params).then((res: ApiResult & { result?: { records?: ShopOption[] } }) => {
    shopList.value = res.result?.records || [];
  });
}
function searchChange(val: string) {
  getShopList(val);
}
function filterStatus(status: string | undefined) {
  const map: Record<string, string> = {
    NO_COMPLETED: "未完成",
    COMPLETE: "完成",
    REFUND: "退款",
  };
  return map[status ?? ""] || "未完成";
}
function filterStatusTagType(
  status: string | undefined
): "success" | "warning" | "info" | "danger" {
  const map: Record<string, "success" | "warning" | "danger"> = {
    NO_COMPLETED: "warning",
    COMPLETE: "success",
    REFUND: "danger",
  };
  return map[status ?? ""] || "warning";
}
function formatCommission(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined || amount === "") {
    return "-";
  }
  return unitPrice(amount, "￥");
}

onMounted(() => {
  init();
});
</script>

<style scoped lang="scss">
.member-cell {
  line-height: 1.4;
}
.member-name {
  color: #303133;
}
.member-id {
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}
.goods-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}
.goods-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  flex-shrink: 0;
}
.goods-thumb-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}
.goods-info {
  min-width: 0;
}
.goods-name {
  line-height: 1.4;
  word-break: break-word;
}
.goods-num {
  color: #999;
  font-size: 12px;
  margin-top: 2px;
}

.mt_10 {
  margin-top: 10px;
}

.list-card {
  margin-top: 16px;
}

.status-tabs {
  margin-bottom: 4px;

  :deep(.el-tabs__content) {
    display: none;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}
</style>

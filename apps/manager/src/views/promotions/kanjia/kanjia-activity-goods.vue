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
        <el-form-item label="商品名称" prop="goodsName">
          <el-input
            v-model="searchForm.goodsName"
            placeholder="请输入商品名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="活动状态" prop="promotionStatus">
          <el-select
            v-model="searchForm.promotionStatus"
            placeholder="请选择"
            clearable
            style="width: 240px"
          >
            <el-option label="未开始" value="NEW" />
            <el-option label="已开始/上架" value="START" />
            <el-option label="已结束/下架" value="END" />
            <el-option label="紧急关闭/作废" value="CLOSE" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="selectDate"
            type="daterange"
            clearable
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div class="operation padding-row">
        <el-button type="primary" @click="add">添加砍价</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
        @sort-change="changeSort"
      >
        <el-table-column prop="goodsId" label="商品编号" width="180" show-overflow-tooltip />
        <el-table-column label="商品图片" width="100" align="center">
          <template #default="{ row }">
            <img alt="商品图片"
              v-if="row && asRow(row).thumbnail"
              :src="asRow(row).thumbnail"
              style="height: 50px; width: 50px; object-fit: cover"
            />
          </template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <a v-if="row" class="link-text" @click="linkTo(asRow(row).goodsId, asRow(row).skuId)">{{ asRow(row).goodsName }}</a>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="100">
          <template #default="{ row }">
            <span v-if="row">{{ asRow(row).stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="剩余活动库存" width="120" />
        <el-table-column label="每人最低砍" min-width="110">
          <template #default="{ row }">
            <span v-if="row">{{ $filters.unitPrice(asRow(row).lowestPrice, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="每人最高砍" min-width="110">
          <template #default="{ row }">
            <span v-if="row">{{ $filters.unitPrice(asRow(row).highestPrice, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结算价格" min-width="110">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">
              {{ $filters.unitPrice(asRow(row).settlementPrice, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="活动开始时间" min-width="160">
          <template #default="{ row }">
            <template v-if="row">
              <div>{{ asRow(row).startTime }}</div>
              <div>{{ asRow(row).endTime }}</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row" :type="promotionStatusTagType(asRow(row).promotionStatus)">
              {{ promotionStatusText(asRow(row).promotionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a
                v-if="asRow(row).promotionStatus === 'CLOSE' || asRow(row).promotionStatus === 'NEW'"
                class="link-text"
                @click="edit(row)"
              >
                编辑
              </a>
              <a v-else class="link-text" @click="edit(row, 'onlyView')">查看</a>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="page mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePage" @size-change="changePageSize" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getKanJiaGoodsList } from "@/api/promotion";
import type { FormInstance, TableInstance } from "element-plus";

defineOptions({ name: "kanjia-activity-goods" });

defineEmits(["selected"]);

type PromotionStatus = "NEW" | "START" | "END" | "CLOSE" | string;

type KanjiaGoodsRow = {
  id?: string | number;
  goodsId?: string | number;
  skuId?: string | number;
  goodsName?: string;
  thumbnail?: string;
  stock?: number;
  lowestPrice?: number;
  highestPrice?: number;
  settlementPrice?: number;
  startTime?: string;
  endTime?: string;
  promotionStatus?: PromotionStatus;
};

type KanjiaSearchForm = {
  pageNumber: number;
  pageSize: number;
  sort: string;
  order: string;
  goodsName: string;
  promotionStatus: string;
  startTime?: number | null;
  endTime?: number | null;
};


function asRow(row: unknown): KanjiaGoodsRow {
  return row as KanjiaGoodsRow;
}

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance()!;

const searchFormRef = ref<FormInstance | null>(null);
const tableRef = ref<TableInstance | null>(null);

const selectDate = ref<Date[] | string[]>([]);
const loading = ref(true);
const searchForm = reactive<KanjiaSearchForm>({
  pageNumber: 1,
  pageSize: 20,
  sort: "createTime",
  order: "desc",
  goodsName: "",
  promotionStatus: "",
});
const data = ref<KanjiaGoodsRow[]>([]);
const total = ref(0);
const _selectCoupon = ref<unknown[]>([]);

watch(
  () => route.fullPath,
  (to: string) => {
    // 历史遗留：该路径与本页（砍价商品）路由不符，原样保留
    if (to == "/promotions/manager-coupon") {
      init();
    }
  }
);

function linkTo(goodsId?: string | number, skuId?: string | number) {
  const fn = (proxy as { linkTo?: (g: string | number, s?: string | number) => void })?.linkTo;
  if (typeof fn === "function" && goodsId != null) {
    fn(goodsId, skuId);
  }
}

function promotionStatusText(status: PromotionStatus | undefined) {
  const map: Record<string, string> = {
    NEW: "未开始",
    START: "已开始",
    END: "已结束",
    CLOSE: "已关闭",
  };
  return map[status ?? ""] || "未知";
}
function promotionStatusTagType(
  status: PromotionStatus | undefined
): "info" | "success" | "danger" | "warning" | "primary" {
  const map: Record<string, "info" | "success" | "danger"> = {
    NEW: "info",
    START: "success",
    END: "danger",
    CLOSE: "danger",
  };
  return map[status ?? ""] || "danger";
}
function init() {
  getDataList();
}
function add() {
  router.push({ name: "add-kan-jia-activity-goods" });
}
function changePage(v: number) {
  searchForm.pageNumber = v;
  getDataList();
}
function changePageSize(v: number) {
  searchForm.pageNumber = 1;
  searchForm.pageSize = v;
  getDataList();
}
function handleSearch() {
  searchForm.pageNumber = 1;
  searchForm.pageSize = 20;
  getDataList();
}
function changeSort(data: { prop: string | null; order: string | null }) {
  if (!data.order) {
    searchForm.sort = "createTime";
    searchForm.order = "desc";
  } else {
    searchForm.sort = data.prop ?? "createTime";
    searchForm.order = data.order === "ascending" ? "asc" : "desc";
  }
  getDataList();
}
function getDataList() {
  loading.value = true;
  if (selectDate.value && selectDate.value[0] && selectDate.value[1]) {
    searchForm.startTime = new Date(selectDate.value[0]).getTime();
    searchForm.endTime = new Date(selectDate.value[1]).getTime();
  } else {
    searchForm.startTime = null;
    searchForm.endTime = null;
  }
  getKanJiaGoodsList(searchForm)
    .then((res) => {
      if (res.success && res.result) {
        data.value = res.result.records ?? [];
        total.value = res.result.total ?? 0;
      }
    })
    .finally(() => {
      loading.value = false;
    });
}
function edit(v: unknown, type?: string) {
  const row = asRow(v);
  const params: Record<string, string | boolean> = { id: String(row.id ?? "") };
  if (type) params.onlyView = true;
  router.push({
    name: "edit-kan-jia-activity-goods",
    query: params as Record<string, string>,
  });
}

onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.padding-row {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
</style>

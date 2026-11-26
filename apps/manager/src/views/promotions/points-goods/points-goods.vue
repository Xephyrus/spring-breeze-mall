<template>
  <div class="search">
    <el-card class="mall-tab-card">
      <el-tabs v-model="mallTab" class="mall-tabs">
        <el-tab-pane label="积分商品列表" name="goods" />
        <el-tab-pane label="积分商品分类" name="category" />
        <el-tab-pane label="积分兑换券" name="coupons" />
      </el-tabs>
    </el-card>
    <PointsGoodsCategory v-if="mallTab === 'category'" class="mt_10" />
    <PointsCouponManage v-if="mallTab === 'coupons'" class="mt_10" />
    <div v-show="mallTab === 'goods'" class="goods-pane mt_10">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="70px"
        class="search-form"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="商品名称">
          <el-input
            v-model="searchForm.goodsName"
            placeholder="请输入商品名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="积分区间">
          <el-input
            v-model="searchForm.pointsS"
            placeholder="开始"
            clearable
            style="width: 110px"
          />
          <span style="margin: 0 6px">-</span>
          <el-input
            v-model="searchForm.pointsE"
            placeholder="结束"
            clearable
            style="width: 110px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.promotionStatus" clearable style="width: 240px">
            <el-option
              v-for="item in statusList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="SKU编码">
          <el-input
            v-model="searchForm.skuId"
            placeholder="请输入SKU编码"
            clearable
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
        <el-button type="primary" @click="addPointsGoods">添加积分商品</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
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
        <el-table-column label="市场价" width="110">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">
              {{ $filters.unitPrice(asRow(row).originalPrice, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结算价" width="110">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">
              {{ $filters.unitPrice(asRow(row).settlementPrice, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="100">
          <template #default="{ row }">
            <span v-if="row">{{ asRow(row).activeStock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="activeStock" label="活动剩余库存" width="130" />
        <el-table-column prop="points" label="兑换积分" width="100" />
        <el-table-column prop="storeName" label="所属店铺" width="120" show-overflow-tooltip />
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
        <el-table-column prop="pointsGoodsCategoryName" label="分类" width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a
                v-if="asRow(row).promotionStatus === 'CLOSE' || asRow(row).promotionStatus === 'NEW'"
                class="link-text"
                @click="edit(asRow(row).id)"
              >
                编辑
              </a>
              <template v-if="asRow(row).promotionStatus === 'START' || asRow(row).promotionStatus === 'NEW'">
                <span class="op-split">|</span>
                <a class="link-text" @click="statusChanged(asRow(row).id, 'CLOSE')">关闭</a>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePage" @size-change="changePageSize" />
      </div>
    </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref } from "vue";
import PointsGoodsCategory from '../points-goods-category/points-goods-category.vue';
import PointsCouponManage from './points-coupon-manage.vue';
import { useTable } from "@/utils/use-table";
import { useRouter } from "vue-router";
import {
  getPointsGoodsList,
  editPointsGoodsStatus,
} from "@/api/promotion";
import { ElMessage } from "element-plus";
import type { FormInstance, TableInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "pointsGoods" });

type PromotionStatus = "NEW" | "START" | "END" | "CLOSE" | string;

type PointsGoodsRow = {
  id?: string | number;
  goodsId?: string | number;
  skuId?: string | number;
  goodsName?: string;
  thumbnail?: string;
  originalPrice?: number;
  settlementPrice?: number;
  activeStock?: number;
  points?: number;
  storeName?: string;
  startTime?: string;
  endTime?: string;
  promotionStatus?: PromotionStatus;
  pointsGoodsCategoryName?: string;
};


function asRow(row: unknown): PointsGoodsRow {
  return row as PointsGoodsRow;
}

const router = useRouter();
const { proxy } = getCurrentInstance()!;

const mallTab = ref<string | number>('goods');

// 模板 ref，与 data 字段同名会互相覆盖，改为 searchFormRef / tableRef
const searchFormRef = ref<FormInstance | null>(null);
const tableRef = ref<TableInstance | null>(null);

const { loading, data, total, searchForm, getDataList } = useTable(
  getPointsGoodsList,
  {
    pageSize: 20,
    immediate: false,
    form: { sort: "createTime", order: "desc" },
  }
);
const statusList = ref([
  { label: "未开始", value: "NEW" },
  { label: "已开始", value: "START" },
  { label: "已结束", value: "END" },
  { label: "已关闭", value: "CLOSE" },
]);

onMounted(() => {
  init();
});

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
function promotionStatusTagType(status: PromotionStatus | undefined): "info" | "success" | "danger" | "warning" | "primary" {
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
function addPointsGoods() {
  router.push({ name: "add-points-goods" });
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
  if (searchForm.pointsS) {
    searchForm.points =
      searchForm.pointsS + "_" + (searchForm.pointsE ? searchForm.pointsE : "");
  }
  getDataList();
}
function edit(id: string | number | undefined) {
  router.push({ name: "edit-points-goods", query: { id: String(id ?? "") } });
}
function statusChanged(
  id: string | number | undefined,
  status: string,
  startTime?: string,
  endTime?: string
) {
  let text = "";
  let params: Record<string, string> = {};
  if (status == "START") {
    text = "开启";
    params = { startTime: startTime ?? "", endTime: endTime ?? "" };
  } else if (status == "CLOSE") {
    text = "关闭";
  }
  Modal.confirm({
    title: "确认" + text,
    content: "您确认要" + text + "此积分商品?",
    onOk: () => {
      editPointsGoodsStatus(id!, params).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success(text + "成功");
          getDataList();
        }
      });
    },
  });
}
</script>

<style scoped>
.mall-tab-card :deep(.el-card__body) {
  padding-top: 8px;
  padding-bottom: 0;
}
.mall-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.goods-pane > .el-card + .el-card {
  margin-top: 10px;
}
.link-text {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
}
.op-split {
  margin: 0 8px;
  color: #dcdee2;
}
.padding-row {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
</style>

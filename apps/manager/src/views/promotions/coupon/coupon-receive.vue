<template>
  <div class="search">
    <el-button style="margin-bottom: 10px" @click="back()">返回</el-button>

    <el-card>
      <el-form ref="searchFormRef" :model="searchForm" inline label-width="90px" class="search-form mb_10">
        <el-form-item label="优惠券名称" prop="couponName">
          <el-input
            v-model="searchForm.couponName"
            placeholder="请输入优惠券名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="会员名称" prop="memberName">
          <el-input
            v-model="searchForm.memberName"
            placeholder="请输入会员名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="获取方式" prop="getType">
          <el-select v-model="searchForm.getType" placeholder="请选择" clearable style="width: 240px">
            <el-option label="免费获取" value="FREE" />
            <el-option label="活动获取" value="ACTIVITY" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券状态" prop="memberCouponStatus">
          <el-select v-model="searchForm.memberCouponStatus" placeholder="请选择" clearable style="width: 240px">
            <el-option label="已领取" value="NEW" />
            <el-option label="已使用" value="USED" />
            <el-option label="已过期" value="EXPIRE" />
            <el-option label="已作废" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="selectDate"
            type="daterange"
            clearable
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            placeholder="选择起始时间"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table
        v-if="refreshTable"
        ref="tableRef"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
        @selection-change="changeSelect"
      >
        <el-table-column prop="memberName" label="会员名称" min-width="130" fixed="left" />
        <el-table-column prop="couponName" label="优惠券名称" min-width="100" show-overflow-tooltip />
        <el-table-column label="发布店铺" min-width="100">
          <template #default="{ row }">
            <span v-if="row">{{ (asRow(row).storeName === "platform" && "平台") || asRow(row).storeName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="面额/折扣" width="100">
          <template #default="{ row }">
            <priceColorScheme
              v-if="row && asRow(row).couponType === 'PRICE'"
              :value="asRow(row).price"
              :color="$mainColor"
            />
            <span v-else-if="row">{{ asRow(row).discount }}折</span>
          </template>
        </el-table-column>
        <el-table-column prop="consumeThreshold" label="使用门槛" width="130" />
        <el-table-column label="获取方式" width="120">
          <template #default="{ row }">
            <template v-if="row">
              <el-tag v-if="asRow(row).getType === 'FREE'" type="danger">免费获取</el-tag>
              <el-tag v-else-if="asRow(row).getType === 'ACTIVITY'" type="warning">活动获取</el-tag>
              <el-tag v-else-if="asRow(row).getType === 'INSIDE'" type="success">内购</el-tag>
              <el-tag v-else>未知</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="会员优惠券状态" width="130">
          <template #default="{ row }">
            <template v-if="row">
              <el-tag v-if="asRow(row).memberCouponStatus == 'NEW'" type="primary">已领取</el-tag>
              <el-tag v-else-if="asRow(row).memberCouponStatus == 'USED'" type="success">已使用</el-tag>
              <el-tag v-else-if="asRow(row).memberCouponStatus == 'EXPIRE'" type="danger">已过期</el-tag>
              <el-tag v-else-if="asRow(row).memberCouponStatus == 'CLOSED'" type="info">已作废</el-tag>
              <el-tag v-else type="danger">未知</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="优惠券类型" width="120">
          <template #default="{ row }">
            <template v-if="row">
              <el-tag v-if="asRow(row).couponType === 'DISCOUNT'" type="warning">打折</el-tag>
              <el-tag v-else-if="asRow(row).couponType === 'PRICE'" type="danger">减免现金</el-tag>
              <el-tag v-else>未知</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="品类描述" width="120">
          <template #default="{ row }">
            <template v-if="row">
              <el-tag v-if="asRow(row).scopeType == 'ALL'">全品类</el-tag>
              <el-tag v-else-if="asRow(row).scopeType == 'PORTION_GOODS_CATEGORY'" type="warning">商品分类</el-tag>
              <el-tag v-else-if="asRow(row).scopeType == 'PORTION_SHOP_CATEGORY'" type="danger">店铺分类</el-tag>
              <el-tag v-else-if="asRow(row).scopeType == 'PORTION_GOODS'" type="danger">指定商品</el-tag>
              <el-tag v-else type="danger">未知</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="有效时间" width="200">
          <template #default="{ row }">
            <template v-if="row">
              <span v-if="asRow(row).getType === 'ACTIVITY' && asRow(row).rangeDayType === 'DYNAMICTIME'">长期有效</span>
              <div v-else-if="asRow(row).startTime && asRow(row).endTime">
                {{ asRow(row).startTime }}<br />{{ asRow(row).endTime }}
              </div>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { LocationQuery } from "vue-router";
import { getCouponReceiveList } from "@/api/promotion";
import type { FormInstance, TableInstance } from "element-plus";
import { useAppStore } from "@/stores/app";

defineOptions({ name: "coupon-recevie" });

type CouponReceiveRow = {
  memberName?: string;
  couponName?: string;
  storeName?: string;
  couponType?: string;
  price?: number | string;
  discount?: number | string;
  consumeThreshold?: number | string;
  getType?: string;
  memberCouponStatus?: string;
  scopeType?: string;
  rangeDayType?: string;
  startTime?: string;
  endTime?: string;
};



function asRow(row: unknown): CouponReceiveRow {
  return row as CouponReceiveRow;
}

const emit = defineEmits(["selected"]);

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const selectList = ref<CouponReceiveRow[]>([]);
const selectCount = ref(0);
// 分页 / loading / data / total / 查询 统一交给 useTable；
// 日期区间 → startTime/endTime 的转换放在 beforeRequest 里
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<CouponReceiveRow>(getCouponReceiveList, {
  form: {
    sort: "create_time",
    order: "desc",
    getType: "",
    couponId: route.query.couponId as string | undefined,
  },
  pageSize: 20,
  beforeRequest: (params: Record<string, unknown>) => {
    const range = selectDate.value;
    if (range && range[0] && range[1]) {
      params.startTime = range[0].getTime();
      params.endTime = range[1].getTime();
    } else {
      params.startTime = null;
      params.endTime = null;
    }
    return params;
  },
});
const refreshTable = ref(true);
const selectDate = ref<Date[]>([]);

// 历史遗留：原代码读取未定义属性 this.couponId，恒为 falsy，原样保留
const couponId: undefined = undefined;
// 历史遗留：原代码读取未定义属性 this.getType，恒为 falsy，原样保留
const getType: undefined = undefined;

const searchFormRef = ref<FormInstance | null>(null);
const tableRef = ref<TableInstance | null>(null);

watch(
  () => route.query,
  (e: LocationQuery) => {
    searchForm.couponId = e.couponId;
    if (couponId) {
      getDataList();
    } else {
      searchFormRef.value?.resetFields();
    }
  }
);

function back() {
  appStore.removeTag("coupon-receive");
  router.go(-1);
}

function check() {
  emit("selected", selectList.value);
}


function changeSelect(e: CouponReceiveRow[]) {
  selectList.value = e;
  selectCount.value = e.length;
  if (getType === "ACTIVITY") check();
}


// 首屏数据由 useTable 的 immediate 负责
</script>

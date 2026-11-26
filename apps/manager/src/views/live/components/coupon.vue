<template>
  <div class="live-coupon">
    <div class="toolbar">
      <el-button type="primary" @click="openCouponSelector">添加优惠券</el-button>
      <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchRemove">
        批量移除
      </el-button>
    </div>

    <el-table
      ref="table"
      v-loading="loading"
      border
      :data="couponList"
      row-key="id"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="52" align="center" />
      <el-table-column prop="couponName" label="优惠券名称" min-width="200" show-overflow-tooltip />
      <el-table-column label="面额" width="120">
        <template #default="{ row }">{{ formatPrice(row.couponPrice) }}</template>
      </el-table-column>
      <el-table-column label="推荐" width="90">
        <template #default="{ row }">
          <el-tag :type="row.recommend ? 'success' : 'info'">
            {{ row.recommend ? "是" : "否" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <a v-if="!row.recommend" class="link-text" @click="handleRecommend(row)">推荐</a>
          <a v-else class="link-text" @click="handleCancelRecommend(row)">取消推荐</a>
          <span class="op-split">|</span>
          <a class="link-text" @click="handleRemove(row)">移除</a>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && !couponList.length" description="暂无直播优惠券" />

    <el-dialog v-model="pickerVisible" title="选择优惠券" width="800px" append-to-body destroy-on-close>
      <el-form inline class="mb_10">
        <el-form-item label="优惠券名称">
          <el-input
            v-model="pickerSearch.couponName"
            placeholder="请输入优惠券名称"
            clearable
            style="width: 200px"
            @keyup.enter="loadPickerCoupons"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPickerCoupons">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table
        ref="pickerTable"
        v-loading="pickerLoading"
        border
        :data="pickerList"
        row-key="id"
        max-height="400"
        @selection-change="handlePickerSelectionChange"
      >
        <el-table-column type="selection" width="52" align="center" />
        <el-table-column prop="couponName" label="优惠券名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="面额/折扣" width="120">
          <template #default="{ row }">
            <span v-if="row.price">{{ formatPrice(row.price) }}</span>
            <span v-else>{{ row.couponDiscount }}折</span>
          </template>
        </el-table-column>
        <el-table-column label="已领取/总量" width="140">
          <template #default="{ row }">
            {{ row.receivedNum }}/{{ row.publishNum === 0 ? "不限制" : row.publishNum }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="promotionStatusTagType(row.promotionStatus)">
              {{ promotionStatusText(row.promotionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="pickerSearch.pageNumber" v-model:size="pickerSearch.pageSize" :total="pickerTotal" layout="total, prev, pager, next" :page-sizes="[10, 20, 50]" @current-change="loadPickerCoupons" @size-change="onPickerPageSizeChange" />
      </div>
      <template #footer>
        <el-button @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" :loading="pickerSubmitting" @click="confirmPicker">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { LiveCouponRow } from "@/types/vo/live";
import type { ApiResult } from "@/types/api";
import { onMounted, reactive, ref, watch } from "vue";
import {
  cancelRecommendLiveCoupon,
  getLiveCouponList,
  removeBatchLiveCoupon,
  saveBatchLiveCoupon,
  setRecommendLiveCoupon,
} from "@/api/live";
import { getPlatformCouponList } from "@/api/promotion";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";
import { unitPrice } from "@/utils/filters";

defineOptions({ name: "LiveCoupon" });


/** 平台优惠券（选择器列表） */
type PlatformCouponRow = {
  id?: string | number;
  couponName?: string;
  price?: number | string;
  promotionStatus?: string;
  [key: string]: unknown;
};

/** el-table 实例：只用到清空选中 */
type CouponTableInstance = {
  clearSelection: () => void;
};

const props = withDefaults(
  defineProps<{
    liveId: string;
    liveRoomName?: string;
  }>(),
  { liveRoomName: "" }
);

const table = ref<CouponTableInstance | null>(null);
const pickerTable = ref<CouponTableInstance | null>(null);

const loading = ref(false);
const couponList = ref<LiveCouponRow[]>([]);
const selectedIds = ref<Array<string | number>>([]);
const pickerVisible = ref(false);
const pickerLoading = ref(false);
const pickerSubmitting = ref(false);
const pickerList = ref<PlatformCouponRow[]>([]);
const pickerTotal = ref(0);
const pickerSelected = ref<PlatformCouponRow[]>([]);
const pickerSearch = reactive({
  pageNumber: 1,
  pageSize: 10,
  couponName: "",
  promotionStatus: "START",
  sort: "create_time",
  order: "desc",
});

watch(
  () => props.liveId,
  () => {
    loadCoupons();
  }
);

onMounted(() => {
  loadCoupons();
});

/** 关联记录的 id 一定存在（后端主键），集中收窄一次 */
function idOf(row: LiveCouponRow): string | number {
  return row.id as string | number;
}

function formatPrice(price?: number | string) {
  return unitPrice(price, "￥");
}
const PROMOTION_STATUS_TEXT: Record<string, string> = {
  NEW: "未开始",
  START: "已开始",
  END: "已结束",
  CLOSE: "已关闭",
};

const PROMOTION_STATUS_TAG: Record<string, "info" | "success" | "warning" | "danger"> = {
  NEW: "info",
  START: "success",
  END: "warning",
  CLOSE: "danger",
};

function promotionStatusText(status?: string) {
  return (status && PROMOTION_STATUS_TEXT[status]) || "未知";
}

function promotionStatusTagType(status?: string) {
  return (status && PROMOTION_STATUS_TAG[status]) || "info";
}
function loadCoupons() {
  if (!props.liveId) return;
  loading.value = true;
  getLiveCouponList(props.liveId)
    .then((res) => {
      loading.value = false;
      if (res.success) {
        couponList.value = res.result ?? [];
      }
    })
    .catch(() => {
      loading.value = false;
    });
}
function handleSelectionChange(rows: LiveCouponRow[]) {
  selectedIds.value = (rows || [])
    .map((row) => row.id)
    .filter((id): id is string | number => id !== undefined);
}
function openCouponSelector() {
  pickerVisible.value = true;
  pickerSelected.value = [];
  pickerSearch.pageNumber = 1;
  loadPickerCoupons();
}
function loadPickerCoupons() {
  pickerLoading.value = true;
  getPlatformCouponList(pickerSearch)
    // api 层已标注返回类型（ResultMessage<PageResult<Coupon>>），这里交给推断
    .then((res) => {
      pickerLoading.value = false;
      if (res.success) {
        pickerList.value = (res.result?.records ?? []) as PlatformCouponRow[];
        pickerTotal.value = res.result?.total ?? 0;
      }
    })
    .catch(() => {
      pickerLoading.value = false;
    });
}
function onPickerPageSizeChange() {
  pickerSearch.pageNumber = 1;
  loadPickerCoupons();
}
function handlePickerSelectionChange(rows: PlatformCouponRow[]) {
  pickerSelected.value = rows || [];
}
function buildLiveCouponPayload(item: PlatformCouponRow) {
  return {
    couponId: item.id,
    couponPrice: Number(item.price ?? 0),
    couponName: item.couponName || "",
    liveRoomId: props.liveId,
    liveRoomName: props.liveRoomName || "",
    hideFlag: false,
    recommend: false,
  };
}
function confirmPicker() {
  if (!pickerSelected.value.length) {
    ElMessage.warning("请选择优惠券");
    return;
  }
  const existingCouponIds = new Set(couponList.value.map((row) => String(row.couponId)));
  const payload = pickerSelected.value
    .filter((item) => !existingCouponIds.has(String(item.id)))
    .map((item) => buildLiveCouponPayload(item));
  if (!payload.length) {
    ElMessage.warning("所选优惠券均已添加");
    return;
  }
  pickerSubmitting.value = true;
  saveBatchLiveCoupon(payload)
    .then((res) => {
      pickerSubmitting.value = false;
      if (res.success) {
        ElMessage.success("添加成功");
        pickerVisible.value = false;
        loadCoupons();
      }
    })
    .catch(() => {
      pickerSubmitting.value = false;
    });
}
function handleRemove(record: LiveCouponRow) {
  Modal.confirm({
    title: "确认移除",
    content: "确定要移除该优惠券吗？",
    onOk: () => {
      // deleteRequestWithBody 声明返回 Blob（带 responseType），实际被拦截器换成了 ResultMessage
      return removeBatchLiveCoupon([idOf(record)]).then((raw) => {
        const res = raw as unknown as ApiResult;
        if (res.success) {
          ElMessage.success("移除成功");
          loadCoupons();
        }
      });
    },
  });
}
function handleBatchRemove() {
  Modal.confirm({
    title: "确认批量移除",
    content: `确定要移除选中的 ${selectedIds.value.length} 个优惠券吗？`,
    onOk: () => {
      return removeBatchLiveCoupon(selectedIds.value).then((raw) => {
        const res = raw as unknown as ApiResult;
        if (res.success) {
          ElMessage.success("移除成功");
          selectedIds.value = [];
          loadCoupons();
        }
      });
    },
  });
}
function handleRecommend(record: LiveCouponRow) {
  setRecommendLiveCoupon(idOf(record)).then((res) => {
    if (res.success) {
      ElMessage.success("已设为推荐");
      loadCoupons();
    }
  });
}
function handleCancelRecommend(record: LiveCouponRow) {
  cancelRecommendLiveCoupon(idOf(record)).then((res) => {
    if (res.success) {
      ElMessage.success("已取消推荐");
      loadCoupons();
    }
  });
}
</script>

<style lang="scss" scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>

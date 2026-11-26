<template>
  <div class="search">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="90px"
        class="search-form mb_10"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="优惠券名称" prop="couponName">
          <el-input
            v-model="searchForm.couponName"
            placeholder="请输入优惠券名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="获取方式" prop="getType">
          <el-select
            v-model="searchForm.getType"
            placeholder="请选择"
            :clearable="!isGetTypeFilterLocked"
            :disabled="isGetTypeFilterLocked"
            popper-class="coupon-filter-popper"
            style="width: 240px"
          >
            <el-option
              v-for="item in getTypeFilterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动状态" prop="promotionStatus">
          <el-select
            v-model="searchForm.promotionStatus"
            placeholder="请选择"
            :clearable="!isPromotionStatusFilterLocked"
            :disabled="isPromotionStatusFilterLocked"
            popper-class="coupon-filter-popper"
            style="width: 240px"
          >
            <el-option
              v-for="item in promotionStatusFilterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="selectDate"
            type="daterange"
            clearable
            popper-class="coupon-filter-popper"
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
      <list-action-bar v-if="getType !== 'ACTIVITY'">
        <el-button type="primary" @click="add">添加优惠券</el-button>
        <el-button class="activity-coupon-button" @click="addActivityCoupon">添加活动优惠券</el-button>
        <el-button @click="delAll">批量关闭</el-button>
        <el-button type="warning" @click="receivePage()">优惠券领取记录</el-button>
      </list-action-bar>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        style="width: 100%"
        row-key="id"
        @selection-change="changeSelect"
      >
        <el-table-column type="selection" width="52" align="center" />
        <el-table-column prop="couponName" label="优惠券名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="面额/折扣" width="150">
          <template #default="{ row }">
            <span v-if="row">
              <span v-if="row.couponType === 'PRICE'" :style="{ color: $mainColor }">
                {{ $filters.unitPrice(row.price, "￥") }}</span>
              <span v-else>{{ row.couponDiscount }}折</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="已领取数量/总数量" width="180">
          <template #default="{ row }">
            <span v-if="row">
              {{ row.receivedNum }}/{{ row.publishNum === 0 ? "不限制" : row.publishNum }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已被使用的数量/已领取数量" width="200">
          <template #default="{ row }">
            <span v-if="row">{{ row.usedNum }}/{{ row.receivedNum }}</span>
          </template>
        </el-table-column>
        <el-table-column label="获取方式" width="120">
          <template #default="{ row }">
            <el-tag v-if="row" :type="getTypeTagType(row.getType)">{{ getTypeText(row.getType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠券类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row" :type="couponTypeTagType(row.couponType)">
              {{ couponTypeText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="品类描述" width="120">
          <template #default="{ row }">
            <el-tag v-if="row" :type="scopeTypeTagType(row.scopeType)">
              {{ scopeTypeText(row.scopeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="200">
          <template #default="{ row }">
            <div v-if="row" class="activity-time" v-html="formatActivityTime(row)"></div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="showStatusColumn"
          label="状态"
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-tag v-if="row" :type="promotionStatusTagType(row.promotionStatus)">
              {{ promotionStatusText(row.promotionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="showActionColumn"
          label="操作"
          width="250"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <template v-if="row">
              <a
                v-if="row.promotionStatus === 'CLOSE' || row.promotionStatus === 'NEW'"
                class="link-text"
                @click="see(row)"
              >
                编辑
              </a>
              <a v-else class="link-text" @click="see(row, 'onlyView')">查看</a>
              <span
                v-if="row.promotionStatus === 'START' || row.promotionStatus === 'NEW'"
                class="op-split"
              >
                |
              </span>
              <a
                v-if="row.promotionStatus === 'START' || row.promotionStatus === 'NEW'"
                class="link-text"
                @click="close(row)"
              >
                关闭
              </a>
              <span class="op-split">|</span>
              <a class="link-text" @click="receivePage(row.id)">领取记录</a>
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
import ListActionBar from "@/components/list-action-bar.vue";
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getPlatformCouponList,
  updatePlatformCouponStatus,
  deletePlatformCoupon,
} from "@/api/promotion";
import {
  formatPromotionCouponValidityHtml,
  type PromotionValidityRow,
} from "@/utils/promotions";
import { ElMessage } from "element-plus";
import type { FormInstance, TableInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "coupon" });

type CouponRow = {
  id?: string | number;
  couponName?: string;
  couponType?: string;
  consumeThreshold?: number | string;
  promotionStatus?: string;
  getType?: string;
  scopeType?: string;
  startTime?: string;
  endTime?: string;
};



function asRow(row: unknown): CouponRow {
  return row as CouponRow;
}

const props = defineProps({
  getType: {
    type: String,
    default: "",
  },
  promotionStatus: {
    type: String,
    default: "",
  },
  selectedList: {
    type: Array,
    default: () => [],
  },
  manualConfirm: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["selected"]);

const route = useRoute();
const router = useRouter();

const searchFormRef = ref<FormInstance | null>(null);
const table = ref<TableInstance | null>(null);

const selectList = ref<CouponRow[]>([]);
const selectCount = ref(0);
// 分页 / loading / data / total / 查询 交给 useTable（searchForm 由 ref 变 reactive，脚本里的 .value 已同步去掉）
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<CouponRow>(getPlatformCouponList, {
  form: { sort: "create_time", order: "desc", getType: "", promotionStatus: "", couponName: "" },
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
  onSuccess: () => {
    // 勾选状态回显（原逻辑保持不变）
    nextTick(() => {
      if (props.selectedList.length) {
        syncTableSelection(props.selectedList as CouponRow[]);
      }
    });
  },
});
const selectDate = ref<Date[]>([]);
const showActionColumn = ref(true);
const showStatusColumn = ref(true);
const isSyncingSelection = ref(false);

const getTypeFilterOptions = computed(() => {
  const all = [
    { label: "免费获取", value: "FREE" },
    { label: "活动获取", value: "ACTIVITY" },
  ];
  if (props.getType) {
    return all.filter((item) => item.value === props.getType);
  }
  return all;
});
const promotionStatusFilterOptions = computed(() => {
  const all = [
    { label: "未开始", value: "NEW" },
    { label: "已开始/上架", value: "START" },
    { label: "已结束/下架", value: "END" },
    { label: "紧急关闭/作废", value: "CLOSE" },
  ];
  if (props.promotionStatus) {
    return all.filter((item) => item.value === props.promotionStatus);
  }
  return all;
});
const isGetTypeFilterLocked = computed(() => !!props.getType);
const isPromotionStatusFilterLocked = computed(() => !!props.promotionStatus);

watch(
  () => route.fullPath,
  (fullPath: string) => {
    if (fullPath == "/promotions/manager-coupon") {
      init();
    }
  }
);
watch(
  () => props.selectedList,
  (val) => {
    if (isSyncingSelection.value) return;
    if (isSameSelection(val as CouponRow[], selectList.value)) return;
    nextTick(() => {
      syncTableSelection(val as CouponRow[]);
    });
  },
  { deep: true }
);

/** 表格列：活动时间 / 有效期 */
function formatActivityTime(row: unknown) {
  return formatPromotionCouponValidityHtml(row as PromotionValidityRow);
}
function promotionStatusText(status: string | undefined) {
  const map: Record<string, string> = {
    NEW: "未开始",
    START: "已开始",
    END: "已结束",
    CLOSE: "已关闭",
  };
  return map[status ?? ""] || "未知";
}
function promotionStatusTagType(
  status: string | undefined
): "info" | "success" | "danger" | "warning" {
  const map: Record<string, "info" | "success" | "danger"> = {
    NEW: "info",
    START: "success",
    END: "danger",
    CLOSE: "danger",
  };
  return map[status ?? ""] || "danger";
}
function scopeTypeText(type: string | undefined) {
  const map: Record<string, string> = {
    ALL: "全品类",
    PORTION_GOODS_CATEGORY: "商品分类",
    PORTION_SHOP_CATEGORY: "店铺分类",
    PORTION_GOODS: "指定商品",
  };
  return map[type ?? ""] || "未知";
}
function scopeTypeTagType(
  type: string | undefined
): "info" | "success" | "danger" | "warning" | "primary" {
  const map: Record<string, "info" | "warning" | "primary"> = {
    ALL: "info",
    PORTION_GOODS_CATEGORY: "warning",
    PORTION_SHOP_CATEGORY: "warning",
    PORTION_GOODS: "primary",
  };
  return map[type ?? ""] || "danger";
}
function getTypeText(type: string | undefined) {
  const map: Record<string, string> = {
    FREE: "免费获取",
    ACTIVITY: "活动获取",
    INSIDE: "内购",
    IGAME: "游戏人生",
  };
  return map[type ?? ""] || "未知";
}
function getTypeTagType(
  type: string | undefined
): "danger" | "warning" | "success" | "info" | "primary" | undefined {
  const map: Record<string, "danger" | "warning" | "success"> = {
    FREE: "danger",
    ACTIVITY: "warning",
    INSIDE: "success",
    IGAME: "success",
  };
  return map[type ?? ""] || undefined;
}
function couponTypeText(row: unknown) {
  const r = asRow(row);
  if (r.couponType === "DISCOUNT") return "满折优惠券";
  if (r.couponType === "PRICE")
    return Number(r.consumeThreshold) === 0 ? "立减优惠券" : "满减优惠券";
  return "未知";
}
function couponTypeTagType(
  type: string | undefined
): "primary" | "info" | "success" | "warning" | "danger" | undefined {
  const map: Record<string, "primary" | "info"> = {
    DISCOUNT: "primary",
    PRICE: "info",
  };
  return map[type ?? ""] || undefined;
}
function isSameSelection(next: CouponRow[] | undefined | null, current: CouponRow[]) {
  const a = next || [];
  const b = current || [];
  if (a.length !== b.length) return false;
  const nextIds = a
    .map((item) => item.id)
    .sort()
    .join(",");
  const currentIds = b
    .map((item) => item.id)
    .sort()
    .join(",");
  return nextIds === currentIds;
}
function syncTableSelection(selected: CouponRow[] | undefined | null) {
  const tableEl = table.value;
  if (!tableEl) return;
  const nextList = selected ? [...selected] : [];
  isSyncingSelection.value = true;
  tableEl.clearSelection();
  if (nextList.length) {
    data.value.forEach((row) => {
      if (nextList.some((item) => item.id === row.id)) {
        tableEl.toggleRowSelection(row, true);
      }
    });
  }
  selectList.value = nextList;
  selectCount.value = nextList.length;
  nextTick(() => {
    nextTick(() => {
      isSyncingSelection.value = false;
    });
  });
}
function check() {
  emit("selected", selectList.value);
}
function getSelection() {
  return [...selectList.value];
}
function receivePage(id?: string | number) {
  if (id) {
    router.push({ name: "coupon-receive", query: { couponId: String(id) } });
  } else {
    router.push({ name: "coupon-receive" });
  }
}
function init() {
  getDataList();
}
function add() {
  router.push({ name: "add-platform-coupon" });
}

function addActivityCoupon() {
  router.push({ name: "add-platform-coupon", query: { getType: "ACTIVITY" } });
}
function clearSelectAll() {
  table.value?.clearSelection();
}
function changeSelect(e: CouponRow[]) {
  if (isSyncingSelection.value) return;
  selectList.value = e;
  selectCount.value = e.length;
  if (props.getType === "ACTIVITY" && !props.manualConfirm) check();
}
function see(v: unknown, only?: string) {
  const row = asRow(v);
  const query = only
    ? { onlyView: "true", id: String(row.id ?? "") }
    : { id: String(row.id ?? "") };
  router.push({ name: "edit-platform-coupon", query });
}
function close(v: unknown) {
  const row = asRow(v);
  Modal.confirm({
    title: "确认关闭",
    content: "确认要关闭此优惠券么?",
    onOk: () => {
      updatePlatformCouponStatus({
        couponIds: row.id,
        effectiveDays: 0,
      })
        .then((res) => {
          Modal.remove();
          if (res.success) {
            ElMessage.success("优惠券已关闭");
            getDataList();
          }
        })
        .catch(() => {
          Modal.remove();
        });
    },
  });
}
function _remove(v: unknown) {
  const row = asRow(v);
  Modal.confirm({
    title: "确认删除",
    content: "确认要删除此优惠券么?",
    onOk: () => {
      deletePlatformCoupon(row.id!)
        .then((res) => {
          Modal.remove();
          if (res.success) {
            ElMessage.success("优惠券已删除");
            getDataList();
          }
        })
        .catch(() => {
          Modal.remove();
        });
    },
  });
}
function delAll() {
  if (selectCount.value <= 0) {
    ElMessage.warning("您还未选择要下架的优惠券");
    return;
  }
  Modal.confirm({
    title: "确认下架",
    content: "您确认要下架所选的 " + selectCount.value + " 条数据?",
    onOk: () => {
      const ids = selectList.value.map((e) => e.id);
      updatePlatformCouponStatus({
        couponIds: ids.toString(),
        promotionStatus: "CLOSE",
      }).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("下架成功");
          clearSelectAll();
          getDataList();
        }
      });
    },
  });
}

onMounted(() => {
  if (props.getType) {
    searchForm.getType = props.getType;
    showActionColumn.value = false;
  }
  if (props.promotionStatus) {
    searchForm.promotionStatus = props.promotionStatus;
    showStatusColumn.value = false;
  }
  init();
});

defineExpose({ check, getSelection, clearSelectAll });
</script>

<style scoped>
.activity-coupon-button {
  --el-button-text-color: #b35c12;
  --el-button-bg-color: #fff7ed;
  --el-button-border-color: #fed7aa;
  --el-button-hover-text-color: #9a4b0b;
  --el-button-hover-bg-color: #ffedd5;
  --el-button-hover-border-color: #fdba74;
  --el-button-active-text-color: #9a4b0b;
  --el-button-active-bg-color: #fed7aa;
  --el-button-active-border-color: #fb923c;
  font-weight: 500;
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
.activity-time {
  line-height: 1.5;
  word-break: break-all;
}
.mb_10 {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
</style>

<style lang="scss">
.coupon-filter-popper {
  z-index: 4000 !important;
}
</style>

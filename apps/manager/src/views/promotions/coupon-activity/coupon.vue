<template>
  <div class="search">
    <el-card>
      <div class="operation padding-row">
        <el-button type="primary" plain @click="addRegistered">注册赠券</el-button>
        <el-button type="primary" plain @click="addSpecify">精准发券</el-button>
        <el-button type="primary" plain @click="addAutoCoupon">自动赠券</el-button>
        <el-button type="success" plain @click="addCouponPackage">创建券礼包</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
      >
        <el-table-column prop="promotionName" label="活动名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="活动类型" min-width="120">
          <template #default="{ row }">
            <span v-if="row">{{ activityTypeText(row.couponActivityType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="活动范围" min-width="120">
          <template #default="{ row }">
            <span v-if="row">{{ activityScopeText(row.activityScope) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="领取频率" min-width="120">
          <template #default="{ row }">
            <span v-if="row">{{ couponFrequencyText(row.couponFrequencyEnum) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" min-width="160">
          <template #default="{ row }">
            <div v-if="row" class="activity-time" v-html="formatActivityTime(row)"></div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-tag v-if="row" :type="promotionStatusTagType(row.promotionStatus)">
              {{ promotionStatusText(row.promotionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" @click="info(row)">查看</a>
              <template v-if="row.couponActivityType === 'COUPON_PACKAGE'">
                <span class="op-split">|</span>
                <a class="link-text" @click="openQrCode(row)">推广码</a>
              </template>
              <template
                v-if="(!checked && row.promotionStatus === 'START') || row.promotionStatus === 'NEW'"
              >
                <span class="op-split">|</span>
                <a class="link-text" @click="remove(row)">关闭</a>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
          <!-- 推广二维码弹窗 -->
      <el-dialog v-model="qrCodeDialogVisible" title="券礼包推广码" width="min(600px, 95vw)" align-center>
        <div style="text-align: center; padding: 10px 0;">
          <div v-if="qrCodeLoading" style="padding: 30px 0;">
            <div style="color: #999;">正在生成推广二维码...</div>
          </div>
          <div v-else-if="qrCodeInfo.qrCodeBase64">
            <div class="promotion-code-grid">
              <div>
                <div class="promotion-code-title">H5 二维码</div>
                <img :src="qrCodeInfo.qrCodeBase64" alt="H5推广二维码" class="promotion-code-image" />
              </div>
              <div>
                <div class="promotion-code-title">微信小程序葵花码</div>
                <img v-if="qrCodeInfo.miniProgramCodeBase64" :src="qrCodeInfo.miniProgramCodeBase64" alt="微信小程序葵花码" class="promotion-code-image" />
                <div v-else class="promotion-code-error">
                  <p>{{ qrCodeInfo.miniProgramCodeError || '暂未生成葵花码，请更新后端服务后重试' }}</p>
                  <el-button @click="openQrCode({ id: qrCodeInfo.activityId })">重新生成</el-button>
                </div>
              </div>
            </div>
            <div style="margin-top: 15px; font-size: 13px; color: #555; word-break: break-all; text-align: left; background: #f8f9fa; padding: 10px; border-radius: 6px;">
              <div style="font-weight: bold; margin-bottom: 4px;">H5 访问链接：</div>
              <div style="color: #409eff;">{{ qrCodeInfo.h5Url }}</div>
            </div>
            <el-button type="primary" style="margin-top: 15px; width: 100%;" @click="copyH5Url">复制 H5 访问链接</el-button>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { getCouponActivityList, closeActivity, getCouponPackageQrCode } from "@/api/promotion";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "coupon-activity" });

type PromotionStatus = "NEW" | "START" | "END" | "CLOSE" | string;

type CouponActivityRow = {
  id?: string | number;
  startTime?: string;
  endTime?: string;
  couponActivityType?: string;
  activityScope?: string;
  couponFrequency?: string;
  promotionStatus?: PromotionStatus;
};



function asRow(row: unknown): CouponActivityRow {
  return row as CouponActivityRow;
}

defineProps({
  checked: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

// 分页 / loading / data / total / 查询 交给 useTable；
// 日期区间 → startTime/endTime 的转换放在 beforeRequest（与原来一致）
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
} = useTable<CouponActivityRow>(getCouponActivityList, {
  form: { sort: "createTime", order: "desc", startTime: null, endTime: null },
  pageSize: 20,
  beforeRequest: (params: Record<string, unknown>) => {
    const range = selectDate.value;
    if (range && range[0] && range[1]) {
      params.startTime = new Date(range[0]).getTime();
      params.endTime = new Date(range[1]).getTime();
    } else {
      params.startTime = null;
      params.endTime = null;
    }
    return params;
  },
});
const selectDate = ref<(string | Date | number)[]>([]);

function activityTypeText(type: string | undefined) {
  const map: Record<string, string> = {
    REGISTERED: "注册赠券",
    COUPON_PACKAGE: "优惠券礼包",
    AUTO_COUPON: "自动发券",
  };
  return map[type ?? ""] || "精准发券";
}
function activityScopeText(scope: string | undefined) {
  return scope === "DESIGNATED" ? "指定会员" : "全部会员";
}
function couponFrequencyText(freq: string | undefined) {
  const map: Record<string, string> = {
    DAY: "每日",
    WEEK: "每周",
    MONTH: "每月",
  };
  return map[freq ?? ""] || "/";
}
function formatActivityTime(row: unknown) {
  const r = asRow(row);
  if (r.startTime && r.endTime) {
    return `${r.startTime}<br/>${r.endTime}`;
  }
  return "/";
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
): "info" | "success" | "danger" | "warning" {
  const map: Record<string, "info" | "success" | "danger"> = {
    NEW: "info",
    START: "success",
    END: "danger",
    CLOSE: "danger",
  };
  return map[status ?? ""] || "danger";
}
const qrCodeDialogVisible = ref(false);
const qrCodeLoading = ref(false);
let qrCodeRequestId = 0;
const qrCodeInfo = reactive({
  activityId: "",
  h5Url: "",
  qrCodeBase64: "",
  miniProgramCodeBase64: "",
  miniProgramCodeError: "",
});

function addCouponPackage() {
  router.push({
    name: "add-coupon-activity",
    query: { couponActivityType: "COUPON_PACKAGE" },
  });
}

/** 生成当前礼包的H5二维码及葵花码，忽略切换礼包前的旧请求结果。 */
function openQrCode(row: unknown) {
  const r = asRow(row);
  qrCodeDialogVisible.value = true;
  qrCodeLoading.value = true;
  qrCodeInfo.activityId = String(r.id ?? "");
  qrCodeInfo.h5Url = "";
  qrCodeInfo.qrCodeBase64 = "";
  qrCodeInfo.miniProgramCodeBase64 = "";
  qrCodeInfo.miniProgramCodeError = "";

  const requestId = ++qrCodeRequestId;
  getCouponPackageQrCode(r.id!)
    .then((res) => {
      if (requestId !== qrCodeRequestId) return;
      if (res.success && res.result) {
        qrCodeInfo.h5Url = res.result.h5Url || "";
        qrCodeInfo.qrCodeBase64 = res.result.qrCodeBase64 || "";
        qrCodeInfo.miniProgramCodeBase64 = res.result.miniProgramCodeBase64 || "";
        qrCodeInfo.miniProgramCodeError = res.result.miniProgramCodeError || "";
      } else {
        ElMessage.error(res.message || "生成推广二维码失败");
      }
    })
    .catch(() => {
      if (requestId !== qrCodeRequestId) return;
      ElMessage.error("获取二维码异常");
    })
    .finally(() => {
      if (requestId !== qrCodeRequestId) return;
      qrCodeLoading.value = false;
    });
}

function copyH5Url() {
  if (!qrCodeInfo.h5Url) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(qrCodeInfo.h5Url).then(() => {
      ElMessage.success("H5 访问链接已复制到剪贴板！");
    });
  } else {
    ElMessage.success("链接：" + qrCodeInfo.h5Url);
  }
}

function addRegistered() {
  router.push({
    name: "add-coupon-activity",
    query: { couponActivityType: "REGISTERED" },
  });
}
function addSpecify() {
  router.push({
    name: "add-coupon-activity",
    query: { couponActivityType: "SPECIFY" },
  });
}
function addAutoCoupon() {
  router.push({
    name: "add-coupon-activity",
    query: { couponActivityType: "AUTO_COUPON" },
  });
}
function info(v: unknown) {
  const row = asRow(v);
  router.push({ name: "coupon-activity-info", query: { id: String(row.id ?? "") } });
}
function remove(v: unknown) {
  const row = asRow(v);
  Modal.confirm({
    title: "确认关闭",
    content: "确认要关闭此优惠券活动么?关闭活动只能重新创建",
    onOk: () => {
      closeActivity(row.id!)
        .then((res) => {
          if (res.success) {
            ElMessage.success("优惠券活动已关闭");
            getDataList();
          }
          Modal.remove();
        })
        .catch(() => {
          Modal.remove();
        });
    },
  });
}

// 首屏数据由 useTable 的 immediate 负责
</script>

<style scoped>
.promotion-code-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.promotion-code-title {
  margin-bottom: 12px;
}
.promotion-code-image {
  width: 220px;
  height: 220px;
}
.promotion-code-error {
  max-width: 240px;
  margin: 0 auto;
  line-height: 1.6;
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
}
.padding-row {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
</style>

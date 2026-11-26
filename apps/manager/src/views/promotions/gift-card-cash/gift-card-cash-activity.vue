<template>
  <div class="search">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="100px"
        class="search-form mb_10"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="礼品卡名称" prop="giftCardName">
          <el-input
            v-model="searchForm.giftCardName"
            placeholder="模糊搜索礼品卡名称"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div class="operation padding-row">
        <el-button type="primary" @click="addActivity('PICKUP')">添加提货卡</el-button>
        <el-button type="primary" @click="addActivity('CASH')">添加现金卡</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        style="width: 100%"
      >
        <el-table-column prop="giftCardName" label="礼品卡名称" min-width="100" show-overflow-tooltip />
        <el-table-column label="礼品卡类型" width="120">
          <template #default="{ row }">
            <span v-if="row">{{ cardTypeText(row.cardType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="面值" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row">
              <span
                v-if="row.cardType !== 'PICKUP' && row.faceValue != null && row.faceValue !== ''"
                :style="{ color: $mainColor }"
              >
                {{ $filters.unitPrice(row.faceValue, "￥") }}</span>
              <span v-else-if="row.cardType === 'PICKUP'">兑换 {{ row.pickupCount }} 种</span>
              <span v-else>-</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="180">
          <template #default="{ row }">
            <span v-if="row">{{ formatValidity(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总库存" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ fmtInt(row.stockTotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批量制卡数" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ fmtInt(row.producedQuantity) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批量发卡数" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ fmtInt(row.issuedCardQuantity) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余库存" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ fmtInt(row.remainingStock) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <template v-if="row">
              <el-tag v-if="isFixedValidityExpired(row)" type="danger">已过期</el-tag>
              <el-tag v-else type="success">正常</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" align="right" width="380" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <template v-if="canEdit(row)">
                <a class="link-text" @click.prevent="goEdit(row)">编辑</a>
                <span class="op-split">|</span>
              </template>
              <a class="link-text" @click.prevent="goView(row)">查看</a>
              <template v-if="canBatchCreate(row)">
                <span class="op-split">|</span>
                <a class="link-text" @click.prevent="openBatchCreate(row)">批量制卡</a>
              </template>
              <template v-if="canBatchIssue(row)">
                <span class="op-split">|</span>
                <a class="link-text" @click.prevent="openBatchIssue(row)">批量发卡</a>
              </template>
              <span class="op-split">|</span>
              <a class="link-text" @click.prevent="goRecords(row)">查看记录</a>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePage" @size-change="changePageSize" />
      </div>
    </el-card>

    <el-dialog
      v-model="batchCreateVisible"
      title="批量制卡"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="onBatchCreateClosed"
    >
      <el-form ref="batchFormRef" :model="batchForm" :rules="batchFormRule" label-width="100px">
        <el-form-item label="礼品卡名称">
          <span>{{ batchCtx.giftCardName || "-" }}</span>
        </el-form-item>
        <el-form-item label="面值">
          <template v-if="batchCtx.faceValue != null && batchCtx.faceValue !== ''">
            <span :style="{ color: $mainColor }">
              {{ $filters.unitPrice(batchCtx.faceValue, "￥") }}</span>
          </template>
          <span v-else>-</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ fmtInt(batchCtx.headroom) }}</span>
        </el-form-item>
        <el-form-item label="制卡张数" prop="quantity">
          <el-input-number
            v-model="batchForm.quantity"
            :min="1"
            :max="batchQuantityMax"
            :precision="0"
            placeholder="请输入制卡张数"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="本批备注" prop="batchRemark">
          <el-input
            v-model="batchForm.batchRemark"
            type="textarea"
            :rows="2"
            maxlength="64"
            show-word-limit
            placeholder="选填，最多64字"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchCreateVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchCreateSubmitting" @click="submitBatchCreate">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchIssueVisible"
      title="批量发卡"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="onBatchIssueClosed"
    >
      <div class="gcc-batch-issue-body">
        <el-form label-width="100px">
          <el-form-item label="礼品卡名称">
            <span>{{ issueCtx.giftCardName || "-" }}</span>
          </el-form-item>
        </el-form>
        <el-alert type="info" show-icon class="mb_10" :closable="false">
          请先下载模板，按列填写<strong>手机号</strong>、<strong>发卡数量</strong>后上传；发卡不区分制卡批次。
        </el-alert>
        <div class="gcc-batch-issue-actions">
          <el-button
            type="primary"
            plain
            :loading="issueTemplateDownloading"
            @click="downloadIssueTemplate"
          >
            下载 Excel 模板
          </el-button>
        </div>
        <div class="gcc-batch-issue-upload">
          <span class="gcc-batch-issue-upload-label">上传已填写的 Excel</span>
          <el-upload
            :before-upload="onIssueImportBeforeUpload"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            :show-file-list="false"
          >
            <el-button type="default">选择文件</el-button>
          </el-upload>
          <span v-if="issueFileName" class="gcc-batch-issue-filename">{{ issueFileName }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchIssueVisible = false">取消</el-button>
        <el-button type="primary" :loading="issueImportSubmitting" @click="submitIssueImport">
          开始发卡
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getGiftCardCashActivityPage,
  giftCardCashBatchCreate,
  downloadGiftCardCashIssueTemplate,
  giftCardCashIssueImportByActivity,
} from "@/api/promotion";
import { ElMessage } from "element-plus";
import type { FormInstance, FormItemRule } from "element-plus";

defineOptions({ name: "GiftCardCashActivity" });

const router = useRouter();

type ActivityRow = {
  id?: string | number;
  giftCardName?: string;
  faceValue?: number | string | null;
  remainingStock?: number | string | null;
  cardType?: string;
  validityType?: string;
  validEndTime?: string | null;
  validMonthsAfterActivate?: number | string | null;
};

type BatchCtx = {
  id: string | number;
  giftCardName: string;
  faceValue: number | string | null;
  remainingStock: number | string | null;
  headroom: number | string | null;
};

type SearchForm = {
  pageNumber: number;
  pageSize: number;
  sort: string;
  order: string;
  giftCardName?: string;
};


const searchFormRef = ref<FormInstance | null>(null);
const batchFormRef = ref<FormInstance | null>(null);

const loading = ref(false);
const searchForm = reactive<SearchForm>({
  pageNumber: 1,
  pageSize: 20,
  sort: "createTime",
  order: "desc",
  giftCardName: "",
});
const data = ref<ActivityRow[]>([]);
const total = ref(0);
const batchCreateVisible = ref(false);
const batchCreateSubmitting = ref(false);
const batchCtx = ref<BatchCtx>({
  id: "",
  giftCardName: "",
  faceValue: null,
  remainingStock: null,
  headroom: null,
});
const batchForm = reactive<{ quantity: number | null | undefined; batchRemark: string }>({
  quantity: null,
  batchRemark: "",
});
const batchFormRule = ref<Partial<Record<string, FormItemRule[]>>>({});
const batchIssueVisible = ref(false);
const issueTemplateDownloading = ref(false);
const issueImportSubmitting = ref(false);
const issueCtx = ref({
  id: "" as string | number,
  giftCardName: "",
});
const issueFile = ref<File | null>(null);
const issueFileName = ref("");

const batchQuantityMax = computed(() => {
  const cap = 10000;
  const h = batchCtx.value.headroom;
  if (h !== null && h !== undefined && h !== "" && Number(h) >= 1) {
    return Math.min(cap, Number(h));
  }
  return cap;
});

batchFormRule.value = {
  quantity: [{ validator: validateBatchQuantity, trigger: "change" }],
  batchRemark: [{ type: "string", max: 64, message: "备注过长", trigger: "blur" }],
};

onMounted(() => {
  getDataList();
});

function cardTypeText(type: string | undefined) {
  const map: Record<string, string> = { CASH: "现金卡", PICKUP: "提货卡" };
  return map[type ?? ""] || type || "-";
}
function validateBatchQuantity(_rule: unknown, value: unknown, callback: (e?: Error) => void) {
  if (value === null || value === undefined || value === "") {
    callback(new Error("请填写制卡张数"));
    return;
  }
  const n = Number(value);
  if (Number.isNaN(n) || n < 1) {
    callback(new Error("制卡张数至少为 1"));
    return;
  }
  const maxQ = batchQuantityMax.value;
  if (n > maxQ) {
    callback(new Error(`制卡张数不能超过 ${maxQ}（可制卡上限与单次上限）`));
    return;
  }
  if (n > 10000) {
    callback(new Error("单次制卡不超过 10000 张"));
    return;
  }
  callback();
}
function fmtInt(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") {
    return "-";
  }
  return n;
}
function isFixedValidityExpired(row: ActivityRow) {
  if (!row || !row.validityType || row.validEndTime == null || row.validEndTime === "") {
    return false;
  }
  const type = String(row.validityType).toUpperCase();
  const fixedEndTypes = [
    "FIXED_UNTIL",
    "FIXED_END",
    "FIXED",
    "BY_END_TIME",
    "FIXED_DATE",
  ];
  if (!fixedEndTypes.includes(type)) {
    return false;
  }
  const end = new Date(row.validEndTime);
  if (Number.isNaN(end.getTime())) {
    return false;
  }
  return end.getTime() < Date.now();
}
function formatValidity(row: ActivityRow) {
  if (!row || !row.validityType) {
    return "-";
  }
  const type = String(row.validityType).toUpperCase();
  if (type === "LONG_TERM") {
    return "长期有效";
  }
  if (type === "FIXED_UNTIL") {
    return row.validEndTime ? String(row.validEndTime) : "固定到期";
  }
  if (type === "AFTER_ACTIVATE_MONTHS") {
    const m = row.validMonthsAfterActivate;
    return m != null && m !== "" ? `激活后${m}个月有效` : "激活后按月";
  }
  if (
    type === "FIXED_END" ||
    type === "FIXED" ||
    type === "BY_END_TIME" ||
    type === "FIXED_DATE"
  ) {
    return row.validEndTime ? String(row.validEndTime) : type;
  }
  if (
    type === "AFTER_ACTIVATE" ||
    type === "MONTHS_AFTER_ACTIVATE" ||
    type === "RELATIVE"
  ) {
    const m = row.validMonthsAfterActivate;
    return m != null && m !== "" ? `激活后${m}个月有效` : type;
  }
  const parts = [row.validityType];
  if (row.validEndTime) {
    parts.push(String(row.validEndTime));
  }
  if (row.validMonthsAfterActivate != null && row.validMonthsAfterActivate !== "") {
    parts.push(`激活后${row.validMonthsAfterActivate}个月`);
  }
  return parts.join(" ");
}
/** 从独立入口创建指定类型的卡，类型在创建页固定展示。 */
function addActivity(cardType: string) {
  router.push({ name: "add-gift-card-cash-activity", query: { cardType } });
}
function goEdit(row: ActivityRow) {
  if (!canEdit(row)) {
    return;
  }
  router.push({
    name: "edit-gift-card-cash-activity",
    query: { id: row.id },
  });
}
function goView(row: ActivityRow) {
  router.push({
    name: "edit-gift-card-cash-activity",
    query: { id: row.id, onlyView: "true" },
  });
}
function goRecords(row: ActivityRow) {
  router.push({
    name: "gift-card-cash-records",
    query: {
      activityId: row.id,
      giftCardName: row.giftCardName || "",
    },
  });
}
function getRemainingStock(row: ActivityRow) {
  if (!row || row.remainingStock === null || row.remainingStock === undefined || row.remainingStock === "") {
    return 0;
  }
  const n = Number(row.remainingStock);
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.max(0, Math.floor(n));
}
function hasRemainingStock(row: ActivityRow) {
  return getRemainingStock(row) >= 1;
}
function canEdit(row: ActivityRow) {
  return hasRemainingStock(row);
}
function getBatchCreateHeadroom(row: ActivityRow) {
  return getRemainingStock(row);
}
function canBatchCreate(row: ActivityRow) {
  return hasRemainingStock(row);
}
function canBatchIssue(row: ActivityRow) {
  if (isFixedValidityExpired(row)) {
    return false;
  }
  return hasRemainingStock(row);
}
function openBatchIssue(row: ActivityRow) {
  if (!canBatchIssue(row)) {
    return;
  }
  issueCtx.value = {
    id: row.id ?? "",
    giftCardName: row.giftCardName || "",
  };
  issueFile.value = null;
  issueFileName.value = "";
  batchIssueVisible.value = true;
}
function onBatchIssueClosed() {
  issueFile.value = null;
  issueFileName.value = "";
}
function downloadIssueTemplate() {
  issueTemplateDownloading.value = true;
  downloadGiftCardCashIssueTemplate()
    .then((res) => {
      issueTemplateDownloading.value = false;
      if (!res) {
        return;
      }
      const raw = res as unknown as Blob;
      if (raw instanceof Blob && raw.type && raw.type.indexOf("json") !== -1) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const j = JSON.parse(String(reader.result)) as { message?: string };
            if (j && j.message) {
              ElMessage.error(j.message);
            } else {
              ElMessage.error("模板下载失败");
            }
          } catch {
            ElMessage.error("模板下载失败");
          }
        };
        reader.readAsText(raw);
        return;
      }
      const blob =
        raw instanceof Blob
          ? raw
          : new Blob([raw as unknown as BlobPart], {
              type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
            });
      const name = "批量发卡模板.xlsx";
      if ("download" in document.createElement("a")) {
        const link = document.createElement("a");
        link.download = name;
        link.style.display = "none";
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      } else {
        const nav = navigator as Navigator & {
          msSaveBlob?: (b: Blob, n: string) => void;
        };
        if (nav.msSaveBlob) {
          nav.msSaveBlob(blob, name);
        }
      }
      ElMessage.success("模板已开始下载");
    })
    .catch(() => {
      issueTemplateDownloading.value = false;
    });
}
function onIssueImportBeforeUpload(file: File) {
  issueFile.value = file;
  issueFileName.value = file.name;
  return false;
}
function submitIssueImport() {
  if (!issueCtx.value.id) {
    return;
  }
  if (!issueFile.value) {
    ElMessage.warning("请先选择要上传的 Excel 文件");
    return;
  }
  const fd = new FormData();
  fd.append("file", issueFile.value);
  issueImportSubmitting.value = true;
  giftCardCashIssueImportByActivity(issueCtx.value.id, fd)
    .then((res) => {
      issueImportSubmitting.value = false;
      if (res && res.success) {
        ElMessage.success(
          res.result ? `发卡任务已提交，发卡批次号：${res.result}` : "发卡任务已提交"
        );
        batchIssueVisible.value = false;
        issueFile.value = null;
        issueFileName.value = "";
        getDataList();
      }
    })
    .catch(() => {
      issueImportSubmitting.value = false;
    });
}
function openBatchCreate(row: ActivityRow) {
  if (!canBatchCreate(row)) {
    return;
  }
  const headroom = getBatchCreateHeadroom(row);
  batchCtx.value = {
    id: row.id ?? "",
    giftCardName: row.giftCardName || "",
    faceValue: row.faceValue ?? null,
    remainingStock: row.remainingStock ?? null,
    headroom,
  };
  batchForm.quantity = null;
  batchForm.batchRemark = "";
  batchCreateVisible.value = true;
}
function onBatchCreateClosed() {
  batchFormRef.value?.resetFields();
}
function submitBatchCreate() {
  if (!batchFormRef.value) {
    return;
  }
  batchFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    const q = batchForm.quantity;
    const payload: { quantity: number | null | undefined; batchRemark?: string } = { quantity: q };
    const remark = (batchForm.batchRemark || "").trim();
    if (remark) {
      payload.batchRemark = remark;
    }
    batchCreateSubmitting.value = true;
    giftCardCashBatchCreate(batchCtx.value.id, payload)
      .then((res) => {
        batchCreateSubmitting.value = false;
        if (res.success) {
          ElMessage.success(
            res.result ? `制卡成功，批次号：${res.result}` : "制卡成功"
          );
          batchCreateVisible.value = false;
          getDataList();
        }
      })
      .catch(() => {
        batchCreateSubmitting.value = false;
      });
  });
}
function changePage() {
  getDataList();
}
function changePageSize() {
  searchForm.pageNumber = 1;
  getDataList();
}
function handleSearch() {
  searchForm.pageNumber = 1;
  getDataList();
}
function getDataList() {
  loading.value = true;
  const params: SearchForm = { ...searchForm };
  if (!params.giftCardName) {
    delete params.giftCardName;
  }
  getGiftCardCashActivityPage(params)
    .then((res) => {
      loading.value = false;
      if (res.success && res.result && typeof res.result === "object" && "records" in res.result) {
        data.value = res.result.records || [];
        total.value = res.result.total || 0;
      }
    })
    .catch(() => {
      loading.value = false;
    });
}
</script>

<style scoped>
.gcc-batch-issue-body {
  padding: 0 4px;
}
.gcc-batch-issue-actions {
  margin-bottom: 20px;
}
.gcc-batch-issue-upload {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.gcc-batch-issue-upload-label {
  color: #515a6e;
  font-size: 14px;
}
.gcc-batch-issue-filename {
  color: #409eff;
  font-size: 13px;
  word-break: break-all;
}
.mb_10 {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
.padding-row {
  margin-bottom: 10px;
}
</style>

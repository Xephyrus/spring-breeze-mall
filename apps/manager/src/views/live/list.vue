<template>
  <div class="live-list search">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="90px"
        class="search-form"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="直播标题" prop="title">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入直播标题"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="店铺名称" prop="storeName">
          <el-input
            v-model="searchForm.storeName"
            placeholder="请输入店铺名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="mt_10">
      <el-tabs v-model="activeStatus" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="未开始" name="NEW" />
        <el-tab-pane label="直播中" name="LIVING" />
        <el-tab-pane label="已结束" name="ENDED" />
      </el-tabs>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">创建直播</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
      >
        <el-table-column prop="id" label="直播间ID" width="120" />
        <el-table-column label="直播封面" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row && row.coverImg"
              :src="row.coverImg"
              style="width: 80px; height: 60px"
              fit="cover"
            />
            <span v-else class="text-muted">暂无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="直播标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="直播状态" width="110">
          <template #default="{ row }">
            <el-tag v-if="row" :type="liveStatusTagType(row.liveStatus)">
              {{ liveStatusText(row.liveStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170">
          <template #default="{ row }">{{ row.startTime }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="170">
          <template #default="{ row }">{{ row.endTime }}</template>
        </el-table-column>
        <el-table-column prop="storeName" label="店铺名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <!-- <a class="link-text" @click="_handleView(row)">查看</a>
              <span class="op-split">|</span> -->
              <template v-if="row.liveStatus === 'NEW'">
                <a class="link-text" @click="handleEdit(row)">编辑</a>
                <span class="op-split">|</span>
              </template>
              <a class="link-text" @click="handleControl(row)">中控台</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="handleShare(row)">分享</a>
              <template v-if="row.liveStatus === 'NEW'">
                <span class="op-split">|</span>
                <a class="link-text" @click="handleStart(row)">开播</a>
              </template>
              <template v-if="row.liveStatus === 'LIVING'">
                <span class="op-split">|</span>
                <a class="link-text" @click="handleEnd(row)">结束</a>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" @current-change="getData" @size-change="changePageSize" />
      </div>
    </el-card>

    <el-dialog v-model="shareVisible" title="分享直播" width="560px">
      <p class="share-title">{{ shareTitle }}</p>
      <el-form label-width="60px">
        <el-form-item label="H5">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input :model-value="shareH5Url" readonly />
            <el-button type="primary" @click="copyShareUrl">复制</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="shareVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { queryLivePage, startLive, endLive } from "@/api/live";
import { getSetting } from "@/api/index";
import { ElMessage } from "element-plus";
import type { FormInstance, TabPaneName } from "element-plus";
import { Modal } from "@/utils/message";
import config from "@/config/index";

defineOptions({ name: "live-list" });

const router = useRouter();

type LiveRow = {
  id?: string | number;
  title?: string;
  liveStatus?: string;
};

declare const BASE: { WAP_URL?: string } | undefined;

const searchFormRef = ref<FormInstance | null>(null);

const loading = ref(false);
const data = ref<LiveRow[]>([]);
const total = ref(0);
const activeStatus = ref<TabPaneName>("");
const searchForm = reactive({
  pageNumber: 1,
  pageSize: 20,
  title: "",
  storeName: "",
});
const shareVisible = ref(false);
const shareTitle = ref("");
const shareH5Url = ref("");
const wapUrl = ref("");

onMounted(() => {
  loadWapSetting();
  getData();
});

function liveStatusText(status: string | undefined) {
  const map: Record<string, string> = { NEW: "未开始", LIVING: "直播中", ENDED: "已结束" };
  return map[status ?? ""] || "未知";
}
function liveStatusTagType(status: string | undefined): "primary" | "success" | "warning" | "info" | "danger" {
  const map: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = { NEW: "info", LIVING: "success", ENDED: "warning" };
  return map[status ?? ""] || "info";
}
function buildParams() {
  const params: Record<string, unknown> = {
    pageNumber: searchForm.pageNumber,
    pageSize: searchForm.pageSize,
  };
  if (searchForm.title) params.title = searchForm.title;
  if (searchForm.storeName) params.storeName = searchForm.storeName;
  if (activeStatus.value) params.liveStatus = activeStatus.value;
  return params;
}
function getData() {
  loading.value = true;
  queryLivePage(buildParams())
    .then((res) => {
      loading.value = false;
      if (res.success) {
        data.value = res.result?.records || [];
        total.value = res.result?.total || 0;
      }
    })
    .catch(() => {
      loading.value = false;
    });
}
function handleSearch() {
  searchForm.pageNumber = 1;
  getData();
}
function handleReset() {
  searchForm.title = "";
  searchForm.storeName = "";
  searchForm.pageNumber = 1;
  getData();
}
function handleTabChange() {
  searchForm.pageNumber = 1;
  getData();
}
function changePageSize() {
  searchForm.pageNumber = 1;
  getData();
}
function handleAdd() {
  router.push({ path: "/live-add" });
}
function _handleView(row: LiveRow) {
  router.push({ path: "/live-manage-detail", query: { id: row.id } });
}
function handleEdit(row: LiveRow) {
  router.push({ path: "/live-edit", query: { id: row.id } });
}
function handleControl(row: LiveRow) {
  const route = router.resolve({
    path: "/live-control-panel",
    query: { id: row.id },
  });
  window.open(route.href, "_blank");
}
function buildH5ShareUrl(liveId: string | number | undefined) {
  // 历史遗留：BASE 未定义，wapUrl 为空时会抛 ReferenceError，保持原样
  const base = (wapUrl.value || BASE?.WAP_URL || localStorage.getItem("website") || config.website || "").replace(/\/?$/, "/");
  return `${base}pages/promotion/live/room?id=${liveId}`;
}
function handleShare(row: LiveRow) {
  shareTitle.value = row.title || "";
  shareH5Url.value = buildH5ShareUrl(row.id);
  shareVisible.value = true;
}
function copyShareUrl() {
  if (!shareH5Url.value) return;
  copyText(shareH5Url.value);
}
function copyText(text: string) {
  const onSuccess = () => ElMessage.success("链接已复制");
  const onFail = () => ElMessage.error("复制失败，请手动复制");

  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(onSuccess)
      .catch(() => {
        copyTextFallback(text) ? onSuccess() : onFail();
      });
    return;
  }

  copyTextFallback(text) ? onSuccess() : onFail();
}
function copyTextFallback(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textArea);
  return ok;
}
function handleStart(row: LiveRow) {
  if (row.liveStatus === "LIVING") {
    ElMessage.warning("直播间已在直播中");
    return;
  }
  if (row.liveStatus === "ENDED") {
    ElMessage.warning("直播已结束，无法开播");
    return;
  }
  Modal.confirm({
    title: "确认开播",
    content: "确定要开始该直播吗？",
    onOk: () => {
      return startLive(row.id ?? "").then((res) => {
        if (res.success) {
          ElMessage.success("开播成功");
          getData();
        }
      });
    },
  });
}
function handleEnd(row: LiveRow) {
  if (row.liveStatus !== "LIVING") {
    ElMessage.warning("仅直播中的直播间可以结束");
    return;
  }
  Modal.confirm({
    title: "确认结束",
    content: "确定要结束该直播吗？",
    onOk: () => {
      return endLive(row.id ?? "").then((res) => {
        if (res.success) {
          ElMessage.success("直播已结束");
          getData();
        }
      });
    },
  });
}
function loadWapSetting() {
  getSetting("BASE_SETTING")
    .then((res) => {
      if (res.success && res.result?.buyerDomain) {
        wapUrl.value = res.result.buyerDomain;
      }
    });
}
</script>

<style lang="scss" scoped>
.live-list {
  .toolbar {
    margin-bottom: 12px;
  }
  .text-muted {
    color: #909399;
    font-size: 12px;
  }
  .share-title {
    margin: 0 0 16px;
    color: #606266;
  }
}
</style>

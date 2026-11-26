<template>
  <div class="search">
    <el-card shadow="never">
      <el-tabs
        :model-value="params.pageType"
        class="page-type-tabs"
        @update:model-value="(name: string | number) => (params.pageType = String(name))"
        @tab-change="handleTabChange"
      >
        <el-tab-pane
          v-for="typeItem in pageTypes"
          :key="typeItem.type"
          :name="typeItem.type"
          :label="typeItem.title"
        />
      </el-tabs>
      <div class="operation mb_10">
        <el-link type="primary" :href="addHref" target="_blank" class="add-page-btn">添加页面</el-link>
      </div>
      <div class="page-table-wrap">
        <el-table v-loading="loading" :data="list" style="width: 100%">
        <el-table-column prop="name" label="页面名称" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row">{{ row.name || "暂无模板昵称" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="修改时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="row"
              v-model="row.pageShow"
              inline-prompt
              active-text="开"
              inactive-text="关"
              :before-change="() => Boolean(beforeRelease(row))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" :href="editHref(row)" target="_blank">修改</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="confirmDel(row)">删除</a>
            </template>
          </template>
        </el-table-column>
        </el-table>
      </div>
      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="params.pageNumber" v-model:size="params.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePageNum" @size-change="changePageSize" />
      </div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import * as API_Other from "@/api/other";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";
import { unixToDate } from "@/utils/filters";

const router = useRouter();

const loading = ref(false);
const pageTypes = ref([
  { type: "INDEX", title: "首页" },
  { type: "SPECIAL", title: "专题" },
]);
const params = reactive({
  pageNumber: 1,
  pageSize: 20,
  sort: "createTime",
  order: "desc",
  pageType: "INDEX",
  pageClientType: "H5",
});
const total = ref(0);
/** 页面模板行 */
type WapRow = { id?: string | number; name?: string; pageData?: string; [key: string]: unknown };

const list = ref<WapRow[]>([]);

onMounted(() => {
  init();
});

function handleTabChange(val: string | number) {
  if (val == "ALERT") {
    router.push({
      path: "/floor-list/main",
      query: { pagetype: val },
    });
    return;
  }
  if (val == "OPEN_SCREEN_ANIMATION") {
    router.push({
      path: "/floor-list/main",
      query: { pagetype: val },
    });
    return;
  }
  params.pageNumber = 1;
  params.pageType = String(val);
  init();
}

function changePageNum(val: number) {
  params.pageNumber = val;
  init();
}
function beforeRelease(row: WapRow) {
  if (row.pageShow) {
    ElMessage.warning(
      total.value === 1
        ? "当前为唯一页面，无法关闭"
        : "请直接开启其他页面，当前页面会自动关闭"
    );
    return false;
  }
  return new Promise<boolean>((resolve, reject) => {
    API_Other.releasePageHome(String(row.id ?? "")).then((res) => {
      if (res && res.success) {
        ElMessage.success("发布成功");
        resolve(true);
        init();
      } else {
        reject(new Error("release failed"));
      }
    }).catch(() => {
      reject(new Error("release failed"));
    });
  });
}
function formatTime(time: string | number | Date | undefined) {
  if (!time) return "—";
  const ts = new Date(time).getTime();
  if (Number.isNaN(ts)) return time;
  return unixToDate(ts / 1000);
}
function init() {
  loading.value = true;
  API_Other.getHomeList(params).then((res) => {
    loading.value = false;
    if (!res.result) return false;
    const rows = res.result.records as unknown as Array<Record<string, unknown>>;
    rows.forEach((item) => {
      item.pageShow = item.pageShow === "OPEN";
    });
    list.value = rows as unknown as WapRow[];
    total.value = res.result.total;
  });
}
function editHref(val: WapRow) {
  const { href } = router.resolve({
    path: "/floor-list/main",
    query: {
      id: val.id,
      name: val.name,
      type: String(val.pageShow ?? ""),
      pagetype: params.pageType,
    },
  });
  return href;
}
const addHref = computed(
  () =>
    router.resolve({
      path: "/floor-list/main",
      query: { pagetype: params.pageType, mode: "add" },
    }).href
);
function changePageSize(v: number) {
  params.pageNumber = 1;
  params.pageSize = v;
  init();
}
function confirmDel(row: WapRow) {
  Modal.confirm({
    title: "提示",
    content: "删除此模板？",
    onOk: () => handleDel(row),
  });
}
function handleDel(val: WapRow) {
  loading.value = true;
  API_Other.removePageHome(String(val.id ?? "")).then((res) => {
    loading.value = false;
    if (res.result) {
      init();
      ElMessage.success("删除成功");
    }
  });
}
</script>
<style scoped lang="scss">
.page-type-tabs {
  margin-bottom: 16px;
}
.add-page-btn {
  text-decoration: none;
}
.page-table-wrap {
  max-width: 100%;
  overflow-x: auto;
}
</style>

<template>
  <div class="search">
    <el-card shadow="never">
      <el-tabs
        :model-value="searchForm.pageType"
        class="page-type-tabs"
        @update:model-value="(name: string | number) => (searchForm.pageType = String(name))"
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
      <el-table v-loading="loading" :data="list" style="width: 100%">
        <el-table-column prop="name" label="页面名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row">{{ row.name || "暂无模板昵称" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row?.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="修改时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row?.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="searchForm.pageType !== 'SPECIAL'"
          label="状态"
          width="120"
          align="center"
        >
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
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" :href="decorateHref(row)" target="_blank">装修</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="confirmDel(row.id)">删除</a>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePageNum" @size-change="changePageSize" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import * as API_floor from "@/api/other";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";
import { unixToDate } from "@/utils/filters";

defineOptions({ name: "floorList" });

const router = useRouter();

const total = ref(0);
const searchForm = reactive({
  pageNumber: 1,
  pageSize: 20,
  sort: "createTime",
  order: "desc",
  pageType: "INDEX",
  pageClientType: "PC",
});
const loading = ref(false);
const pageTypes = ref([
  { type: "INDEX", title: "首页" },
  { type: "SPECIAL", title: "专题" },
]);
/** 页面模板行 */
type FloorRow = { id?: string | number; name?: string; pageData?: string; [key: string]: unknown };

const list = ref<FloorRow[]>([]);

const addHref = computed(() => {
  return router.resolve({
    path: "/floor-list/renovation",
    query: {
      pageType: searchForm.pageType,
      mode: "add",
    },
  }).href;
});

function decorateHref(row: FloorRow) {
  return router.resolve({
    path: "/floor-list/renovation",
    query: {
      id: row.id,
      name: row.name,
      pageType: searchForm.pageType,
    },
  }).href;
}

onMounted(() => {
  getTemplateList();
  window.addEventListener("focus", onWindowFocus);
});

onBeforeUnmount(() => {
  window.removeEventListener("focus", onWindowFocus);
});

function onWindowFocus() {
  getTemplateList();
}

function formatTime(time: string | number | Date | undefined) {
  if (!time) return "—";
  if (typeof time === "string" && time.includes("-")) {
    return time;
  }
  const ts = new Date(time).getTime();
  if (Number.isNaN(ts)) return time;
  return unixToDate(ts / 1000);
}

function handleTabChange(type: string | number) {
  searchForm.pageNumber = 1;
  searchForm.pageType = String(type);
  getTemplateList();
}

function changePageNum(val: number) {
  searchForm.pageNumber = val;
  getTemplateList();
}
function changePageSize(val: number) {
  searchForm.pageNumber = 1;
  searchForm.pageSize = val;
  getTemplateList();
}
function getTemplateList() {
  loading.value = true;
  API_floor.getHomeList(searchForm).then((res) => {
    loading.value = false;
    if (res.success && res.result) {
      total.value = res.result.total || 0;
      list.value = res.result.records || [];
      list.value.forEach((e) => {
        if (e.pageShow === "OPEN") {
          e.pageShow = true;
        } else {
          e.pageShow = false;
        }
      });
    }
  }).catch(() => {
    loading.value = false;
  });
}

function beforeRelease(row: FloorRow) {
  if (row.pageShow) {
    ElMessage.warning(
      total.value === 1
        ? "当前为唯一页面，无法关闭"
        : "请直接开启其他页面，当前页面会自动关闭"
    );
    return false;
  }
  return new Promise<boolean>((resolve, reject) => {
    API_floor.releasePageHome(String(row.id ?? "")).then((res) => {
      if (res && res.success) {
        ElMessage.success("发布模板成功");
        resolve(true);
        getTemplateList();
      } else {
        reject(new Error("release failed"));
      }
    }).catch(() => {
      reject(new Error("release failed"));
    });
  });
}

function confirmDel(id: string | number) {
  Modal.confirm({
    title: "提示",
    content: "删除此模板？",
    onOk: () => delTemplate(id),
  });
}

function delTemplate(id: string | number) {
  API_floor.removePageHome(id).then((res) => {
    if (res.success) {
      ElMessage.success("删除模板成功");
      getTemplateList();
    }
  });
}
</script>

<style lang="scss" scoped>
.page-type-tabs {
  margin-bottom: 16px;
}

.add-page-btn {
  text-decoration: none;
}
</style>

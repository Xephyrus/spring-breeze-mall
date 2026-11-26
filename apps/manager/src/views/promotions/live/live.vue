<template>
  <div>
    <el-card>
      <el-tabs v-model="searchForm.status">
        <el-tab-pane
          v-for="(item, index) in tabs"
          :key="index"
          :name="item.status"
          :label="item.title"
        />
      </el-tabs>

      <el-table :data="liveData" style="width: 100%">
        <el-table-column prop="name" label="直播标题" />
        <el-table-column prop="anchorName" label="主播昵称" />
        <el-table-column label="直播开始时间">
          <template #default="{ row }">
            <span v-if="row">{{ $filters.unixToDate(asLive(row).startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="直播结束时间">
          <template #default="{ row }">
            <span v-if="row">{{ $filters.unixToDate(asLive(row).endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="是否推荐" align="center">
          <template #default="{ row, $index }">
            <el-switch
              v-if="row"
              v-model="asLive(row).recommend"
              inline-prompt
              active-text="是"
              inactive-text="否"
              @change="star(row, Number($index))"
            />
          </template>
        </el-table-column>
        <el-table-column label="直播状态">
          <template #default="{ row }">
            <template v-if="row">
              <el-tag v-if="asLive(row).status == 'NEW'" type="primary">未开始</el-tag>
              <el-tag v-else-if="asLive(row).status == 'START'" type="success">直播中</el-tag>
              <el-tag v-else type="warning">已结束</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <a v-if="row" class="link-text" @click="getLiveDetail(row)">查看</a>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10 page" style="display: flex; justify-content: flex-end; margin: 20px 0">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePageNumber" @size-change="changePageSize" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getLiveList, whetherStar } from "@/api/promotion";

type LiveRow = {
  id?: string | number;
  name?: string;
  anchorName?: string;
  startTime?: number | string;
  endTime?: number | string;
  recommend?: boolean | string | number;
  status?: string;
  [key: string]: unknown;
};

type LiveSearchForm = {
  pageSize: number;
  pageNumber: number;
  status: string | number;
};

type PageResult = {
  success?: boolean;
  result?: {
    records?: LiveRow[];
    total?: number;
  };
};

function asLive(row: unknown): LiveRow {
  return row as LiveRow;
}

const router = useRouter();

const total = ref(0);
const searchForm = reactive<LiveSearchForm>({
  pageSize: 20,
  pageNumber: 1,
  status: "NEW",
});
const tabs = ref([
  { title: "直播中", status: "START" },
  { title: "未开始", status: "NEW" },
  { title: "已结束", status: "END" },
]);
const liveData = ref<LiveRow[]>([]);

watch(
  () => searchForm.status,
  () => {
    liveData.value = [];
    getStoreLives();
  },
  { deep: true }
);

onMounted(() => {
  getStoreLives();
});

async function star(val: unknown, index: number) {
  const switched = liveData.value[index].recommend;
  await whetherStar({ id: asLive(val).id, recommend: switched });
  getStoreLives();
}
function changePageSize() {
  getStoreLives();
}
function changePageNumber() {
  getStoreLives();
}
async function getStoreLives() {
  const result = (await getLiveList(searchForm)) as PageResult;
  if (result.success && result.result) {
    liveData.value = result.result.records ?? [];
    total.value = result.result.total ?? 0;
  }
}
function getLiveDetail(val: unknown) {
  const row = asLive(val);
  router.push({
    path: "/live-detail",
    query: {
      id: row.id != null ? String(row.id) : "",
      liveStatus: String(searchForm.status),
    },
  });
}
</script>

<style lang="scss" scoped>
.btns {
  margin-bottom: 10px;
  margin-top: 10px;
}
.page {
  margin-top: 20px;
}
</style>

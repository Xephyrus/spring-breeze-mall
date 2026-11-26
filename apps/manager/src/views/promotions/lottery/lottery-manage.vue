<!-- 平台抽奖活动独立管理页，配置活动、奖池与查询流水。作者 Bulbasaur，2026-11-14。 -->
<template>
  <div class="search lottery-page">
    <el-card>
      <el-tabs v-model="mode" @tab-change="reset">
        <el-tab-pane label="抽奖活动" name="activities" />
        <el-tab-pane label="抽奖记录" name="records" />
      </el-tabs>
      <ListActionBar v-if="mode === 'activities'">
        <el-button v-if="mode === 'activities'" type="primary" @click="edit()">新增抽奖活动</el-button>
      </ListActionBar>
    <el-alert v-if="failed" class="notice" type="error" title="加载失败" :closable="false"><el-button link type="primary" @click="load">重试</el-button></el-alert>
    <el-table v-if="mode === 'activities'" v-loading="loading" :data="activityRows" row-key="id" border empty-text="暂无抽奖活动" style="width: 100%">
      <el-table-column prop="name" label="活动名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="dailyLimit" label="每日免费次数" width="130" />
      <el-table-column prop="startTime" label="开始时间" width="170" show-overflow-tooltip />
      <el-table-column prop="endTime" label="结束时间" width="170" show-overflow-tooltip />
      <el-table-column label="活动状态" width="100"><template #default="{ row }"><el-tag :type="statusTagType(row)">{{ statusText(row) }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right"><template #default="{ row }">
        <a class="link-text" @click="view(row)">查看</a><span class="op-split">|</span>
        <template v-if="!row.published"><a class="link-text" @click="edit(row)">编辑</a><span class="op-split">|</span></template>
        <a class="link-text" :class="{ disabled: busy }" :aria-disabled="busy" @click="toggle(row)">{{ row.enabled ? '下架' : '上架' }}</a>
      </template></el-table-column>
    </el-table>
    <template v-else>
      <el-table v-loading="loading" :data="recordRows" row-key="id" border empty-text="暂无抽奖记录" style="width: 100%">
        <el-table-column prop="activityName" label="活动" min-width="150" /><el-table-column prop="memberId" label="会员ID" min-width="180" />
        <el-table-column prop="prizeName" label="结果" min-width="150" /><el-table-column prop="points" label="发放积分" width="100" />
        <el-table-column prop="createTime" label="抽奖时间" width="180" />
      </el-table>
    </template>
    <div class="pagination mt_10">
      <TablePager v-model:page="pageNumber" v-model:size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="load" @size-change="reset" />
    </div>
    </el-card>
    <el-drawer v-model="drawer" :title="readOnly ? '抽奖活动详情' : '编辑抽奖草稿'" size="min(850px, 100vw)" append-to-body destroy-on-close :close-on-click-modal="false">
      <LotteryForm v-if="drawer" ref="editor" :activity="editingActivity ?? undefined" :read-only="readOnly" :show-actions="false" @saved="edited" />
      <template #footer><el-button :disabled="editor?.saving" @click="drawer = false">{{ readOnly ? '关闭' : '取消' }}</el-button><el-button v-if="!readOnly" type="primary" :loading="editor?.saving" @click="editor?.save()">保存草稿</el-button></template>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessageBox } from 'element-plus';
import type { TabPaneName } from 'element-plus';
import { useRouter } from 'vue-router';
import LotteryForm from './lottery-form.vue';
import ListActionBar from '@/components/list-action-bar.vue';
import { listLottery, setLotteryStatus, listLotteryRecords } from '@/api/lottery';

type LotteryActivityRow = {
  id: string | number;
  name: string;
  dailyLimit?: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
  published: boolean;
};

type LotteryRecordRow = {
  id: string | number;
  activityName?: string;
  memberId?: string;
  prizeName?: string;
  points?: number;
  createTime?: string;
};

type PageResult<T> = {
  success?: boolean;
  message?: string;
  result?: {
    records?: T[];
    total?: number;
  };
};

type LotteryFormExpose = {
  save: () => void | Promise<void>;
  saving: boolean;
};

const mode = ref<string | number>('activities');
const activityRows = ref<LotteryActivityRow[]>([]);
const recordRows = ref<LotteryRecordRow[]>([]);
const total = ref(0);
const pageNumber = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const failed = ref(false);
const drawer = ref(false);
const busy = ref(false);
const editingActivity = ref<LotteryActivityRow | null>(null);
const editor = ref<LotteryFormExpose | null>(null);
const router = useRouter();
const readOnly = ref(false);
let version = 0;

/** 查询当前筛选，旧响应不得覆盖新视图。 */
async function load() {
  const current = ++version;
  loading.value = true;
  failed.value = false;
  try {
    if (mode.value === 'activities') {
      const res = (await listLottery({
        pageNumber: pageNumber.value,
        pageSize: pageSize.value,
      })) as PageResult<LotteryActivityRow>;
      if (current !== version) return;
      if (!res.success) throw new Error(res.message);
      activityRows.value = res.result?.records || [];
      total.value = res.result?.total || 0;
    } else {
      const res = (await listLotteryRecords({
        pageNumber: pageNumber.value,
        pageSize: pageSize.value,
      })) as PageResult<LotteryRecordRow>;
      if (current !== version) return;
      if (!res.success) throw new Error(res.message);
      recordRows.value = res.result?.records || [];
      total.value = res.result?.total || 0;
    }
  } catch {
    if (current === version) {
      failed.value = true;
      activityRows.value = [];
      recordRows.value = [];
      total.value = 0;
    }
  } finally {
    if (current === version) loading.value = false;
  }
}

/** 重置分页再加载。 */
function reset(_name?: TabPaneName) {
  pageNumber.value = 1;
  activityRows.value = [];
  recordRows.value = [];
  load();
}

function asActivity(row: unknown): LotteryActivityRow {
  return row as LotteryActivityRow;
}

/** 新增进入独立页面；已有草稿复用同一表单在抽屉编辑，取消不修改列表。 */
function edit(row?: unknown) {
  if (!row) {
    router.push({ name: 'add-lottery-activity' });
    return;
  }
  readOnly.value = false;
  editingActivity.value = asActivity(row);
  drawer.value = true;
}

/** 所有状态的活动均可查看，复用表单只读展示且不提供保存入口。 */
function view(row: unknown) {
  readOnly.value = true;
  editingActivity.value = asActivity(row);
  drawer.value = true;
}

/** 草稿编辑成功后关闭抽屉并刷新列表。 */
function edited() {
  drawer.value = false;
  load();
}

/** 发布前明确冻结规则，避免误上架。 */
async function toggle(row: unknown) {
  if (busy.value) return;
  const activity = asActivity(row);
  try {
    await ElMessageBox.confirm(
      activity.enabled
        ? '下架后停止新抽奖，已发奖励保留。'
        : '确认上架？首次发布后活动规则和奖池不可修改。',
      '每日抽奖'
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    const res = (await setLotteryStatus(activity.id, !activity.enabled)) as { success?: boolean };
    if (res.success) await load();
  } catch {
    /* 请求封装展示错误。 */
  } finally {
    busy.value = false;
  }
}

/** 上下架与北京时间活动区间共同决定展示状态。 */
function statusText(row: unknown) {
  const activity = asActivity(row);
  if (!activity.enabled) return activity.published ? '已下架' : '草稿';
  const now = Date.now();
  if (now < Date.parse(activity.startTime.replace(' ', 'T') + '+08:00')) return '未开始';
  return now >= Date.parse(activity.endTime.replace(' ', 'T') + '+08:00') ? '已结束' : '进行中';
}

/** 与现有营销列表一致，用状态标签区分进行中、待开始和停止活动。 */
function statusTagType(row: unknown) {
  const status = statusText(row);
  return status === '进行中' ? 'success' : status === '未开始' ? 'warning' : 'info';
}

onMounted(load);
onBeforeUnmount(() => {
  version++;
});
</script>
<style scoped>
.notice { margin: 16px 0; }.pagination { display: flex; justify-content: flex-end; }
</style>

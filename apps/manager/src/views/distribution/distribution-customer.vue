<template>
  <div class="search">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="客户绑定" name="customer">
        <el-card>
          <el-form ref="searchFormRef" :model="searchForm" inline class="search-form" @keyup.enter="handleSearch">
            <el-form-item label="客户昵称">
              <el-input v-model="searchForm.memberName" clearable placeholder="客户昵称" style="width: 180px" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="searchForm.memberMobile" clearable placeholder="手机号" style="width: 180px" />
            </el-form-item>
            <el-form-item label="分销员">
              <el-input v-model="searchForm.distributionName" clearable placeholder="分销员名称" style="width: 180px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" clearable style="width: 120px">
                <el-option v-for="item in bindStatusList" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item label="来源">
              <el-select v-model="searchForm.bindSource" clearable style="width: 140px">
                <el-option v-for="item in bindSourceList" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <el-table v-loading="loading" border :data="data" class="mt_10">
            <el-table-column prop="memberName" label="客户昵称" min-width="120" />
            <el-table-column prop="memberMobile" label="手机号" min-width="120" />
            <el-table-column prop="distributionName" label="归属分销员" min-width="120" />
            <el-table-column label="绑定来源" min-width="100">
              <template #default="{ row }">{{ bindSourceLabel(row.bindSource) }}</template>
            </el-table-column>
            <el-table-column label="绑定类型" min-width="90">
              <template #default="{ row }">
                {{ row.bindType === 'PERMANENT' ? '永久' : '短期' }}
              </template>
            </el-table-column>
            <el-table-column prop="bindStartTime" label="绑定时间" min-width="160" />
            <el-table-column prop="bindExpireTime" label="到期时间" min-width="160" />
            <el-table-column label="保护期剩余" min-width="100">
              <template #default="{ row }">
                <span v-if="row.protectRemainDays != null">{{ row.protectRemainDays }} 天</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'ACTIVE'" type="success">有效</el-tag>
                <el-tag v-else type="info">已过期</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
                <a class="link-text" @click="openRebind(row)">换绑</a>
                <span class="split">|</span>
                <a class="link-text" @click="viewMemberLog(row)">日志</a>
              </template>
            </el-table-column>
          </el-table>
          <div class="mt_10 page padding-row" style="display: flex; justify-content: flex-end">
            <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" :small="false" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="绑定日志" name="log">
        <el-card>
          <el-form ref="logSearchFormRef" :model="logSearchForm" inline class="search-form" @keyup.enter="handleLogSearch">
            <el-form-item label="客户昵称">
              <el-input v-model="logSearchForm.memberName" clearable placeholder="客户昵称" style="width: 180px" />
            </el-form-item>
            <el-form-item label="变更类型">
              <el-select v-model="logSearchForm.changeType" clearable style="width: 140px">
                <el-option v-for="item in bindChangeTypeList" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间">
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogSearch">搜索</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <el-table v-loading="logLoading" border :data="logData" class="mt_10">
            <el-table-column prop="createTime" label="时间" min-width="160" />
            <el-table-column prop="memberName" label="客户" min-width="100" />
            <el-table-column prop="fromDistributionName" label="原分销员" min-width="110" />
            <el-table-column prop="toDistributionName" label="新分销员" min-width="110" />
            <el-table-column label="变更类型" min-width="100">
              <template #default="{ row }">{{ bindChangeTypeLabel(row.changeType) }}</template>
            </el-table-column>
            <el-table-column prop="operatorType" label="操作方" width="90" />
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
          </el-table>
          <div class="mt_10 page padding-row" style="display: flex; justify-content: flex-end">
            <TablePager v-model:page="logSearchForm.pageNumber" v-model:size="logSearchForm.pageSize" :total="logTotal" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" :small="false" @current-change="handleLogPageChange" @size-change="handleLogSizeChange" />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="rebindVisible" title="手动换绑" width="520px">
      <el-form ref="rebindFormRef" :model="rebindForm" :rules="rebindRules" label-width="100px">
        <el-form-item label="客户">
          <el-input :model-value="rebindForm.memberLabel" disabled />
        </el-form-item>
        <el-form-item label="新分销员" prop="distributionId">
          <el-select
            v-model="rebindForm.distributionId"
            filterable
            remote
            reserve-keyword
            placeholder="输入分销员名称搜索"
            :remote-method="searchDistributor"
            :loading="distributorLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in distributorOptions"
              :key="item.id"
              :label="item.memberName || item.nickname || ''"
              :value="item.id ?? ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rebindForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rebindVisible = false">取消</el-button>
        <el-button type="primary" :loading="rebindSubmitting" @click="submitRebind">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref, onMounted } from "vue";
import {
  getDistributionCustomerPage,
  getDistributionBindLogPage,
  getDistributionListData,
  rebindDistributionCustomer,
} from "@/api/distribution";
import { bindStatusList, bindSourceList, bindChangeTypeList } from "./data-json";
import { ElMessage } from "element-plus";
import type { FormInstance, TabPaneName } from "element-plus";

defineOptions({ name: "distributionCustomer" });

type CustomerRow = {
  id?: string | number;
  memberId?: string | number;
  memberName?: string;
  memberMobile?: string;
  distributionId?: string | number;
  distributionName?: string;
  status?: string;
  bindSource?: string;
};

type LogRow = {
  id?: string | number;
  memberId?: string | number;
  memberName?: string;
  changeType?: string;
};

type DistributorOption = {
  id?: string | number;
  nickname?: string;
  mobile?: string;
  memberName?: string;
};

type ApiResult<T = unknown> = {
  success?: boolean;
  message?: string;
  result?: T;
};

type PageResult<T> = { records?: T[]; total?: number };

type LabelItem = { value: string; label: string };

// 模板 el-form 的 ref（原 ref="searchForm"/"logSearchForm"，与 data 同名会互相覆盖，改名为 searchFormRef/logSearchFormRef）
const searchFormRef = ref<FormInstance | null>(null);
const logSearchFormRef = ref<FormInstance | null>(null);
const rebindFormRef = ref<FormInstance | null>(null);

const activeTab = ref<TabPaneName>("customer");
const logDateRange = ref<string[]>([]);
// 一页两表：客户列表 + 绑定日志，各自一个 useTable（互不干扰）
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<CustomerRow>(getDistributionCustomerPage, {
  form: {
    sort: "bindStartTime",
    order: "desc",
    memberName: "",
    memberMobile: "",
    distributionName: "",
    status: "",
    bindSource: "",
  },
  pageSize: 20,
  immediate: true,
});

const {
  loading: logLoading,
  data: logData,
  total: logTotal,
  searchForm: logSearchForm,
  getDataList: getLogList,
  handleCurrentChange: handleLogPageChange,
  handleSizeChange: handleLogSizeChange,
} = useTable<LogRow>(getDistributionBindLogPage, {
  // immediate: false —— 日志 tab 首次切过去才加载（原行为）
  form: {
    sort: "createTime",
    order: "desc",
    memberName: "",
    memberId: "",
    changeType: "",
    startDate: "",
    endDate: "",
  },
  pageSize: 20,
  immediate: false,
  beforeRequest: (params: Record<string, unknown>) => {
    const range = logDateRange.value;
    if (range && range.length === 2) {
      params.startDate = range[0];
      params.endDate = range[1];
    } else {
      params.startDate = "";
      params.endDate = "";
    }
    return params;
  },
});
const rebindVisible = ref(false);
const rebindSubmitting = ref(false);
const distributorLoading = ref(false);
const distributorOptions = ref<DistributorOption[]>([]);
const rebindForm = ref({
  memberId: "" as string | number,
  memberLabel: "",
  distributionId: "" as string | number,
  remark: "",
});
const rebindRules = {
  distributionId: [{ required: true, message: "请选择分销员", trigger: "change" }],
};

function bindSourceLabel(value: string | undefined) {
  const item = (bindSourceList as LabelItem[]).find((i) => i.value === value);
  return item ? item.label : value;
}
function bindChangeTypeLabel(value: string | undefined) {
  const item = (bindChangeTypeList as LabelItem[]).find((i) => i.value === value);
  return item ? item.label : value;
}
function handleTabChange(name: TabPaneName) {
  if (name === "log" && logData.value.length === 0) {
    getLogList();
  }
}
// 日志查询：日期区间在 beforeRequest 里统一处理，这里只需回到第一页再查
function handleLogSearch() {
  logSearchForm.pageNumber = 1;
  getLogList();
}
function openRebind(row: CustomerRow) {
  rebindForm.value = {
    memberId: row.memberId ?? "",
    memberLabel: `${row.memberName || ""}${row.memberMobile ? " / " + row.memberMobile : ""}`,
    distributionId: "",
    remark: "",
  };
  distributorOptions.value = [];
  rebindVisible.value = true;
}
function searchDistributor(query: string) {
  if (!query) {
    distributorOptions.value = [];
    return;
  }
  distributorLoading.value = true;
  getDistributionListData({
    memberName: query,
    distributionStatus: "PASS",
    pageNumber: 1,
    pageSize: 20,
  }).then((res: ApiResult<PageResult<DistributorOption>>) => {
    distributorLoading.value = false;
    if (res.success) {
      distributorOptions.value = (res.result?.records || []).filter(
        (item) => item.id !== rebindForm.value.distributionId
      );
    }
  });
}
function submitRebind() {
  rebindFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    rebindSubmitting.value = true;
    rebindDistributionCustomer({
      memberId: rebindForm.value.memberId,
      distributionId: rebindForm.value.distributionId,
      remark: rebindForm.value.remark,
    }).then((res) => {
      rebindSubmitting.value = false;
      if (res.success) {
        ElMessage.success("换绑成功");
        rebindVisible.value = false;
        getDataList();
      }
    }).catch(() => {
      rebindSubmitting.value = false;
    });
  });
}
function viewMemberLog(row: CustomerRow) {
  activeTab.value = "log";
  logSearchForm.memberId = row.memberId ?? "";
  logSearchForm.memberName = "";
  logSearchForm.pageNumber = 1;
  getLogList();
}

onMounted(() => {
  getDataList();
});
</script>

<style lang="scss" scoped>
.link-text {
  color: #2d8cf0;
  cursor: pointer;
}
.split {
  margin: 0 8px;
  color: #dcdee2;
}
</style>

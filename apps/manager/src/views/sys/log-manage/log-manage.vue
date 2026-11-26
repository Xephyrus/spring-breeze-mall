<template>
  <div class="search">
    <el-card>
      <el-form ref="searchFormRef" :model="searchForm" inline label-width="70px" class="search-form" @keyup.enter="handleSearch">
        <el-form-item label="搜索日志" prop="searchKey">
          <el-input v-model="searchForm.searchKey" placeholder="请输入搜索日志内容" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="操作人" prop="operatorName">
          <el-input v-model="searchForm.operatorName" placeholder="请输入操作人" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="selectDate"
            type="daterange"
            value-format="YYYY-MM-DD"
            clearable
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            @change="selectDateRange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table
        v-loading="loading"
        border
        :data="data"
        ref="tableRef"
        style="width: 100%"
      >
        <el-table-column prop="name" label="操作名称" min-width="100" fixed="left" show-overflow-tooltip />
        <el-table-column prop="customerLog" label="日志内容" min-width="120" fixed="left" show-overflow-tooltip />
        <el-table-column prop="username" label="操作用户" width="115" />
        <el-table-column prop="ip" label="IP" width="150" />
        <el-table-column prop="ipInfo" label="IP信息" width="150" show-overflow-tooltip />
        <el-table-column prop="requestUrl" label="请求路径" width="150" show-overflow-tooltip />
        <el-table-column prop="requestType" label="请求类型" width="130" align="center" />
        <el-table-column prop="requestParam" label="请求参数" min-width="100" show-overflow-tooltip />
        <el-table-column prop="costTime" label="耗时-毫秒" width="140" align="center" />
        <el-table-column label="操作时间" width="170" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ unixToDate(row.createTime / 1000) }}</span>
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
import { ref } from "vue";
import type { FormInstance, TableInstance } from "element-plus";
import { unixToDate } from "@/utils/filters";
import { getLogListData } from "@/api/index";

defineOptions({ name: "log-manage" });

type LogRow = {
  id?: string | number;
  createTime?: string | number;
  [key: string]: unknown;
};


const selectDate = ref<string[] | null>(null);
// 分页 / loading / data / total / 查询 交给 useTable
const {
  loading,
  data,
  total,
  searchForm,
  getDataList: getLogList,
  handleCurrentChange,
  handleSizeChange,
} = useTable<LogRow>(getLogListData, {
  form: {
    type: 1,
    searchKey: "",
    operatorName: "",
    startDate: "",
    endDate: "",
    sort: "createTime",
    order: "desc",
  },
  pageSize: 20,
});

// 模板 ref：searchForm 与 reactive 数据同名，改名避免互相覆盖；table 未被 script 使用，仅为保留模板 ref 声明
const searchFormRef = ref<FormInstance | null>(null);
const tableRef = ref<TableInstance | null>(null);

function selectDateRange(v: string[] | null) {
  if (v && v.length === 2) {
    searchForm.startDate = v[0];
    searchForm.endDate = v[1];
  } else {
    searchForm.startDate = "";
    searchForm.endDate = "";
  }
}
function handleSearch() {
  searchForm.pageNumber = 1;
  if (selectDate.value && selectDate.value.length === 2) {
    searchForm.startDate = selectDate.value[0];
    searchForm.endDate = selectDate.value[1];
  }
  getLogList();
}

// 首屏数据由 useTable 的 immediate 负责
</script>

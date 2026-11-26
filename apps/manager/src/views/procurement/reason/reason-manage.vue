<template>
  <div class="stock-reason-page search">
    <el-card shadow="never" class="filter-card">
      <el-form :model="searchForm" inline class="filter-form" @submit.prevent @keyup.enter="handleSearch">
        <el-form-item label="原因">
          <el-input v-model="searchForm.reason" placeholder="请输入原因" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="searchForm.category" placeholder="全部类别" clearable style="width: 160px">
            <el-option label="入库" value="INBOUND" />
            <el-option label="出库" value="OUTBOUND" />
            <el-option label="报损" value="DAMAGE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card mt_10">
      <list-action-bar>
        <el-button type="primary" @click="openAdd">添加原因</el-button>
      </list-action-bar>
      <el-table v-loading="loading" :data="data" row-key="id" border stripe empty-text="暂无数据" style="width: 100%">
        <el-table-column prop="reason" label="原因" min-width="240" show-overflow-tooltip />
        <el-table-column label="类别" width="120" align="center">
          <template #default="{ row }">{{ stockReasonCategoryText(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="170" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <a class="link-text" @click="openEdit(row)">编辑</a>
            <span class="op-split">|</span>
            <a class="link-text" @click="handleDelete(row)">删除</a>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap mt_10">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-drawer v-model="modalVisible" :title="modalTitle" size="min(480px, 100vw)" append-to-body :close-on-click-modal="false" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="原因" required>
          <el-input v-model="form.reason" placeholder="请输入出入库原因" />
        </el-form-item>
        <el-form-item label="类别" required>
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="入库" value="INBOUND" />
            <el-option label="出库" value="OUTBOUND" />
            <el-option label="报损" value="DAMAGE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref, onMounted } from "vue";
import ListActionBar from "@/components/list-action-bar.vue";
import {
  getStockReasonPage,
  addStockReason,
  updateStockReason,
  deleteStockReason,
} from "@/api/procurement";
import { stockReasonCategoryText } from "../constants";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "manager-stock-reason-manage" });

type ReasonRow = {
  id?: string | number;
  reason?: string;
  category?: string;
};


const submitLoading = ref(false);
const modalVisible = ref(false);
const modalTitle = ref("添加原因");
// 分页 / loading / data / total / 查询 / 重置 统一交给 useTable
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
  resetSearch: handleReset,
} = useTable<ReasonRow>(getStockReasonPage, {
  form: { reason: "", category: "" },
  pageSize: 10,
});
const form = ref({ id: "" as string | number, reason: "", category: "INBOUND" });

const formRef = ref<FormInstance | null>(null);

function asRow(row: unknown): ReasonRow {
  return row as ReasonRow;
}


/** 打开新增抽屉并清空上次表单。 */
function openAdd() {
  modalTitle.value = "添加原因";
  form.value = { id: "", reason: "", category: "INBOUND" };
  modalVisible.value = true;
}

/** 将所选原因回显到编辑抽屉。 */
function openEdit(row: unknown) {
  const r = asRow(row);
  modalTitle.value = "编辑原因";
  form.value = { id: r.id ?? "", reason: r.reason || "", category: r.category || "INBOUND" };
  modalVisible.value = true;
}

/** 保存原因，成功后关闭抽屉并刷新当前列表。 */
function handleSubmit() {
  if (!form.value.reason || !form.value.category) {
    ElMessage.warning("请填写完整信息");
    return;
  }
  submitLoading.value = true;
  const req = form.value.id
    ? updateStockReason(form.value)
    : addStockReason({ reason: form.value.reason, category: form.value.category });
  req
    .then((res) => {
      if (res.success) {
        ElMessage.success("保存成功");
        modalVisible.value = false;
        getDataList();
      }
    })
    .finally(() => {
      submitLoading.value = false;
    });
}

/** 用户确认后删除所选原因并刷新列表。 */
function handleDelete(row: unknown) {
  const r = asRow(row);
  Modal.confirm({
    title: "删除确认",
    content: `确认删除原因「${r.reason}」？`,
    onOk: () => {
      deleteStockReason(r.id!).then((res) => {
        if (res.success) {
          ElMessage.success("删除成功");
          getDataList();
        }
      });
    },
  });
}

onMounted(() => {
  getDataList();
});
</script>

<style scoped>
.filter-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.filter-form :deep(.el-form-item) {
  margin: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  overflow-x: auto;
}

.op-split {
  margin: 0 6px;
  color: #dcdfe6;
}
</style>

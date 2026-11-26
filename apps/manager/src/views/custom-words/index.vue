<template>
  <div class="search">
    <el-card>
      <div class="operation">
        <el-button type="primary" @click="add">添加</el-button>
        <el-button v-if="selectCount > 0" type="danger" @click="delAll">批量删除</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        style="width: 100%"
        row-key="id"
        @selection-change="changeSelect"
      >
        <el-table-column type="selection" width="60" align="center" />
        <el-table-column prop="name" label="自定义分词" min-width="120" />
        <el-table-column prop="createTime" label="创建时间" width="200" />
        <el-table-column prop="updateTime" label="更新时间" width="200" />
        <el-table-column prop="createBy" label="操作人" min-width="150" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" @click="detail(row)">修改</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="remove(row)">删除</a>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="getDataList" @size-change="() => { searchForm.pageNumber = 1; getDataList(); }" />
      </div>
    </el-card>

    <el-drawer
      v-model="modalVisible"
      :title="modalTitle"
      size="500px"
      :close-on-click-modal="false"
      destroy-on-close
      append-to-body
    >
      <el-form ref="formRef" :model="form" label-width="100px" :rules="formValidate">
        <el-form-item label="自定义分词" prop="name">
          <el-input v-model="form.name" clearable style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useTable } from "@/utils/use-table";
import {
  getCustomWordsPage,
  delCustom,
  insertCustomWords,
  updateCustomWords,
} from "@/api/index";
import { regular } from "@/utils/index";
import { ElMessage } from "element-plus";
import type { FormInstance, TableInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "custom-words" });

type CustomWordRow = {
  id?: string | number;
  name?: string;
};


const table = ref<TableInstance | null>(null);
const formRef = ref<FormInstance | null>(null);

const modalType = ref(0);
const modalVisible = ref(false);
const modalTitle = ref("");
const currentId = ref("");

const form = ref<{ name: string }>({
  name: "",
});
const formValidate = reactive({
  name: [regular.REQUIRED, regular.VARCHAR20],
});
const submitLoading = ref(false);
const selectList = ref<CustomWordRow[]>([]);
const selectCount = ref(0);

const { loading, data, total, searchForm, getDataList } = useTable(
  getCustomWordsPage,
  {
    pageSize: 20,
    sort: "createTime",
    order: "desc",
    form: { words: "" },
  }
);

function clearSelectAll() {
  table.value?.clearSelection();
}

function changeSelect(e: CustomWordRow[]) {
  selectList.value = e;
  selectCount.value = e.length;
}

function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      if (modalType.value === 0) {
        insertCustomWords(form.value)
          .then((res) => {
            if (res.success) {
              ElMessage.success("操作成功");
              getDataList();
              modalVisible.value = false;
            }
          })
          .finally(() => {
            submitLoading.value = false;
          });
      } else {
        updateCustomWords({ ...form.value, id: currentId.value })
          .then((res) => {
            if (res.success) {
              ElMessage.success("操作成功");
              getDataList();
              modalVisible.value = false;
            }
          })
          .finally(() => {
            submitLoading.value = false;
          });
      }
    }
  });
}

function add() {
  modalType.value = 0;
  modalTitle.value = "添加";
  currentId.value = "";
  form.value = { name: "" };
  formRef.value?.resetFields();
  modalVisible.value = true;
}

function detail(v: CustomWordRow) {
  modalType.value = 1;
  currentId.value = String(v.id ?? "");
  modalTitle.value = "修改";
  form.value = { name: v.name || "" };
  modalVisible.value = true;
}

function remove(v: CustomWordRow) {
  Modal.confirm({
    title: "确认删除",
    content: "您确认要删除 " + v.name + " ?",
    onOk: () => {
      delCustom(v.id!).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
        }
      });
    },
  });
}

function delAll() {
  if (selectCount.value <= 0) {
    ElMessage.warning("您还未选择要删除的数据");
    return;
  }
  Modal.confirm({
    title: "确认删除",
    content: "您确认要删除所选的 " + selectCount.value + " 条数据?",
    onOk: () => {
      const ids = selectList.value.map((e) => e.id).join(",");
      delCustom(ids).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          clearSelectAll();
          getDataList();
        }
      });
    },
  });
}
</script>

<style lang="scss" scoped>
.link-text {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
}
.op-split {
  margin: 0 8px;
  color: #dcdee2;
}
.operation {
  margin-bottom: 10px;
}
</style>

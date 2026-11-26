<template>
  <div class="search">
    <el-card>
      <list-action-bar>
        <el-button type="primary" @click="add">添加</el-button>
        <el-button @click="delAll">批量删除</el-button>
      </list-action-bar>

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
        <el-table-column prop="name" label="计量单位" min-width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column prop="createBy" label="操作人" min-width="150" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" @click="edit(row)">修改</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="remove(row)">删除</a>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog
      v-model="modalVisible"
      :title="modalTitle"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="100px" :rules="formValidate">
        <el-form-item label="计量单位" prop="name">
          <el-input v-model="form.name" clearable style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ListActionBar from "@/components/list-action-bar.vue";
import { ref, reactive } from "vue";
import {
  addGoodsUnit,
  getGoodsUnitPage,
  updateGoodsUnit,
  delGoodsUnit,
} from "@/api/index";
import { useTable } from "@/utils/use-table";
import { regular } from "@/utils/index";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, TableInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "goods-unit" });

type GoodsUnitRow = {
  id?: string | number;
  name: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
};

type GoodsUnitForm = {
  id?: string | number;
  name: string;
};



function asRow(row: unknown): GoodsUnitRow {
  return row as GoodsUnitRow;
}

const modalVisible = ref(false);
const modalTitle = ref("");
// 分页 / loading / data / total / 查询 / 重置 统一交给 useTable
// （sort/order 通过 form 初始值传入，和原来一致）
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
} = useTable<GoodsUnitRow>(getGoodsUnitPage, {
  form: { sort: "createTime", order: "desc", name: "" },
  pageSize: 20,
});
const form = ref<GoodsUnitForm>({
  name: "",
});
const formValidate = reactive<FormRules>({
  name: [regular.REQUIRED, regular.VARCHAR5],
});
const submitLoading = ref(false);
const selectList = ref<GoodsUnitRow[]>([]);
const selectCount = ref(0);

const table = ref<TableInstance | null>(null);
const formRef = ref<FormInstance | null>(null);

// 未在 data 中声明、原代码直接挂载到 this 上的字段
let id: string | number | null = null;

function clearSelectAll() {
  table.value?.clearSelection();
}
function changeSelect(e: GoodsUnitRow[]) {
  selectList.value = e;
  selectCount.value = e.length;
}
function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      if (modalTitle.value == "添加") {
        if (data.value.find((item: GoodsUnitRow) => item.name == form.value.name)) {
          ElMessage.error("请勿添加重复计量单位!");
          submitLoading.value = false;
          return;
        }
        delete form.value.id;
        addGoodsUnit(form.value).then((res) => {
          submitLoading.value = false;
          if (res.success) {
            ElMessage.success("操作成功");
            getDataList();
            modalVisible.value = false;
          }
        });
      } else {
        updateGoodsUnit(id!, form.value).then((res) => {
          submitLoading.value = false;
          if (res.success) {
            ElMessage.success("操作成功");
            getDataList();
            modalVisible.value = false;
          }
        });
      }
    }
  });
}
function add() {
  modalTitle.value = "添加";
  form.value = { name: "" };
  formRef.value?.resetFields();
  modalVisible.value = true;
}
function edit(v: unknown) {
  const row = asRow(v);
  id = row.id ?? null;
  modalTitle.value = "修改";
  modalVisible.value = true;
  form.value.name = row.name;
}
function remove(v: unknown) {
  const row = asRow(v);
  Modal.confirm({
    title: "确认删除",
    content: "您确认要删除 " + row.name + " ?",
    onOk: () => {
      delGoodsUnit(row.id!).then((res) => {
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
      let ids = "";
      selectList.value.forEach((e) => {
        ids += e.id + ",";
      });
      ids = ids.substring(0, ids.length - 1);
      delGoodsUnit(ids).then((res) => {
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

// 首屏数据由 useTable 的 immediate 负责，这里不再手动 init()
</script>

<template>
  <div>
    <el-card>
      <div class="operation mb_10">
        <el-button type="primary" @click="addParent">添加积分商品分类</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
        style="width: 100%"
      >
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="sortOrder" label="排序值" min-width="120" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" @click="edit(row)">编辑</a>
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
      <el-form ref="formRef" :model="formAdd" label-width="100px" :rules="formValidate">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formAdd.name" clearable />
        </el-form-item>
        <el-form-item label="排序值" prop="sortOrder">
          <el-input-number v-model="formAdd.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="Submit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { nextTick, reactive, ref } from "vue";
import {
  getPointsGoodsCategoryList,
  addPointsGoodsCategory,
  updatePointsGoodsCategory,
  deletePointsGoodsCategoryById,
} from "@/api/promotion";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "pointsGoodsCategory" });

type CategoryRow = {
  id?: string | number;
  name: string;
  sortOrder?: number | null;
  parentId?: number;
  deleteFlag?: number;
  level?: number;
  children?: CategoryRow[];
};

type CategoryForm = {
  id?: string | number;
  parentId: number;
  name: string;
  deleteFlag: number;
  level: number;
  sortOrder?: number | null;
};



const buildDefaultFormAdd = (): CategoryForm => ({
  parentId: 0,
  name: "",
  deleteFlag: 0,
  level: 0,
  sortOrder: 1,
});

const formRef = ref<FormInstance | null>(null);

const submitLoading = ref(false);
const modalType = ref(0);
const modalVisible = ref(false);
const modalTitle = ref("");
const formAdd = ref<CategoryForm>(buildDefaultFormAdd());
// 分页 / loading / total / 查询 交给 useTable；列表仍叫 tableData，模板不用改。
// 递归排序逻辑放在 resolve 里，行为与原来一致。
const {
  loading,
  data: tableData,
  total,
  searchForm,
  getDataList: getAllList,
  handleCurrentChange,
  handleSizeChange,
} = useTable<CategoryRow>(getPointsGoodsCategoryList, {
  form: { sort: "sortOrder", order: "asc" },
  pageSize: 20,
  resolve: (res) => {
    const r = res as { success?: boolean; result?: { records?: CategoryRow[]; total?: number } };
    if (!r?.success || !r.result) return null;
    return {
      records: sortRecursively(r.result.records || []),
      total: r.result.total || 0,
    };
  },
});
const formValidate = reactive<FormRules>({
  name: [{ required: true, message: "商品分类名称不能为空", trigger: "blur" }],
});


function asCategory(row: unknown): CategoryRow {
  return row as CategoryRow;
}

function edit(v: unknown) {
  const row = asCategory(v);
  modalType.value = 1;
  modalTitle.value = "编辑";
  formAdd.value = {
    ...buildDefaultFormAdd(),
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
  };
  modalVisible.value = true;
}
function addParent() {
  modalType.value = 0;
  modalTitle.value = "添加积分商品分类";
  formAdd.value = buildDefaultFormAdd();
  modalVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}
function Submit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    if (modalType.value === 0) {
      delete formAdd.value.id;
      addPointsGoodsCategory(formAdd.value).then((res) => {
        submitLoading.value = false;
        if (res.success) {
          ElMessage.success("添加成功");
          getAllList();
          modalVisible.value = false;
          formAdd.value = buildDefaultFormAdd();
        }
      });
    } else {
      updatePointsGoodsCategory(formAdd.value).then((res) => {
        submitLoading.value = false;
        if (res.success) {
          ElMessage.success("修改成功");
          getAllList();
          modalVisible.value = false;
          formAdd.value = buildDefaultFormAdd();
        }
      });
    }
  });
}
function remove(v: unknown) {
  const row = asCategory(v);
  Modal.confirm({
    title: "确认删除",
    content: "您确认要删除 " + row.name + " ?",
    onOk: () => {
      deletePointsGoodsCategoryById(row.id!).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          getAllList();
        }
      });
    },
  });
}

// 首屏数据由 useTable 的 immediate 负责

/** 按 sortOrder 递归排序（原逻辑保持不变，供 useTable 的 resolve 使用）。 */
function sortRecursively(list: CategoryRow[] = []): CategoryRow[] {
  const sortFn = (a: CategoryRow, b: CategoryRow) => (a.sortOrder || 0) - (b.sortOrder || 0);
  list.sort(sortFn);
  list.forEach((item) => {
    if (Array.isArray(item.children) && item.children.length) {
      sortRecursively(item.children);
    }
  });
  return list;
}
</script>
<style scoped>
.link-text {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
}
.op-split {
  margin: 0 8px;
  color: #dcdee2;
}
.mb_10 {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
</style>

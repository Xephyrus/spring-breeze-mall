<template>
  <div>
    <el-card>
      <div class="operation mb_10">
        <el-button type="primary" @click="addParent">添加一级分类</el-button>
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
        <el-table-column prop="articleCategoryName" label="分类名称" min-width="200" />
        <el-table-column prop="sort" label="排序" width="120" />
        <el-table-column label="操作" width="320" align="right">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" @click="edit(row)">编辑</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="remove(row)">删除</a>
              <template v-if="row.level != 1">
                <span class="op-split">|</span>
                <a class="link-text" @click="addChildren(row)">添加子分类</a>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer
      v-model="modalVisible"
      :title="modalTitle"
      size="500px"
      :close-on-click-modal="false"
      destroy-on-close
      append-to-body
    >
      <el-form ref="formRef" :model="formAdd" label-width="100px" :rules="formValidate">
        <el-form-item v-if="showParent" label="上级分类" prop="parentId">
          {{ parentTitle }}
          <el-input v-model="formAdd.parentId" style="display: none" />
        </el-form-item>
        <el-form-item label="分类名称" prop="articleCategoryName">
          <el-input v-model="formAdd.articleCategoryName" clearable />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="formAdd.sort" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="Submit">提交</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { saveArticleCategory, getArticleCategory, delArticleCategory, updateArticleCategory } from "@/api/pages";
import { regular } from "@/utils/index";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "lili-components" });

const submitLoading = ref(false);
const loading = ref(false);
const modalType = ref(0);
const modalVisible = ref(false);
const modalTitle = ref("");
const showParent = ref(false);
const parentTitle = ref("");
import type { FormInstance, FormRules } from "element-plus";

type CategoryForm = {
  id?: string | number;
  parentId: string | number;
  sort: number | undefined;
  level: number | undefined;
  articleCategoryName: string;
};

type CategoryRow = CategoryForm & { children?: CategoryRow[] };


const formAdd = ref<CategoryForm>({
  parentId: "",
  sort: 1,
  level: 0,
  articleCategoryName: "",
});
const formValidate = ref<FormRules>({
  articleCategoryName: [regular.REQUIRED],
  sort: [regular.REQUIRED, regular.INTEGER],
});
const tableData = ref<CategoryRow[]>([]);

// 模板 el-form 的 ref（原 ref="form"，避免与顶层变量重名，改名为 formRef）
const formRef = ref<FormInstance | null>(null);

function asRow(row: unknown): CategoryRow {
  return row as CategoryRow;
}

function init() {
  getAllList();
}
function addChildren(v: unknown) {
  const row = asRow(v);
  modalType.value = 0;
  modalTitle.value = "添加子分类";
  formAdd.value.articleCategoryName = "";
  parentTitle.value = row.articleCategoryName || "";
  formAdd.value.level = Number(row.level) + 1;
  showParent.value = true;
  delete formAdd.value.id;
  formAdd.value.parentId = row.id ?? "";
  modalVisible.value = true;
}
function edit(v: unknown) {
  const row = asRow(v);
  modalType.value = 1;
  modalTitle.value = "编辑";
  formAdd.value.id = row.id;
  formAdd.value.articleCategoryName = row.articleCategoryName;
  formAdd.value.level = row.level;
  formAdd.value.parentId = row.parentId;
  formAdd.value.sort = row.sort;
  showParent.value = false;
  modalVisible.value = true;
}
function addParent() {
  modalType.value = 0;
  modalTitle.value = "添加一级分类";
  parentTitle.value = "顶级分类";
  showParent.value = true;
  formRef.value?.resetFields();
  delete formAdd.value.id;
  formAdd.value.parentId = 0;
  modalVisible.value = true;
}
function Submit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    if (modalType.value === 0) {
      delete formAdd.value.id;
      saveArticleCategory(formAdd.value).then((res) => {
        submitLoading.value = false;
        if (res.success) {
          ElMessage.success("添加成功");
          formAdd.value = {
            parentId: "",
            sort: 1,
            level: 0,
            articleCategoryName: "",
          };
        }
        getAllList();
        modalVisible.value = false;
      });
    } else {
      updateArticleCategory(formAdd.value, formAdd.value.id!).then((res) => {
        submitLoading.value = false;
        if (res.success) {
          ElMessage.success("修改成功");
        }
        getAllList();
        modalVisible.value = false;
        formRef.value?.resetFields();
      });
    }
  });
}
function remove(v: unknown) {
  const row = asRow(v);
  Modal.confirm({
    title: "确认删除",
    content: "您确认要删除 " + row.articleCategoryName + " ?",
    onOk: () => {
      delArticleCategory(row.id!).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          getAllList();
        }
      });
    },
  });
}
function getAllList() {
  loading.value = true;
  getArticleCategory()
    .then((res) => {
      if (res.success) {
        tableData.value = (res.result ?? []) as unknown as typeof tableData.value;
      }
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  init();
});
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
.mb_10 {
  margin-bottom: 10px;
}
</style>

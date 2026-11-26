<template>
  <div class="search">
    <el-card>
      <div class="operation padding-row" style="margin-bottom: 10px">
        <el-button type="primary" @click="add">添加</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        style="width: 100%"
      >
        <el-table-column prop="name" label="物流公司名称" min-width="120" />
        <el-table-column prop="code" label="物流公司编码" min-width="120" />
        <el-table-column label="状态" width="150" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="row"
              v-model="row.switch"
              inline-prompt
              active-text="开启"
              inactive-text="禁用"
              @change="changeSwitch(asLogisticsRow(row))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text"  @click="detail(asLogisticsRow(row))">修改</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="remove(asLogisticsRow(row))">删除</a>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-drawer
      v-model="modalVisible"
      :title="modalTitle"
      size="500px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formValidate" label-width="120px">
        <el-form-item label="物流公司名称" prop="name">
          <el-input v-model="form.name" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="物流公司代码" prop="code">
          <el-input v-model="form.code" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="支持电子面单">
          <el-switch
            v-model="form.standBy"
            active-value="true"
            inactive-value="false"
            inline-prompt
            active-text="开"
            inactive-text="关"
          />
        </el-form-item>
        <el-form-item label="禁用状态" prop="disabled">
          <el-switch
            v-model="form.disabled"
            inline-prompt
            active-value="OPEN"
            inactive-value="CLOSE"
            active-text="开启"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          提交
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { nextTick, reactive, ref } from "vue";
import {
  getLogisticsPage,
  updateLogistics,
  addLogistics,
  delLogistics,
} from "@/api/logistics";
import { ElMessage } from "element-plus";
import type { FormInstance, TableInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "logistics" });

type LogisticsForm = {
  name: string;
  code: string;
  standBy: string | number | boolean;
  disabled: string | number | boolean;
  formItems?: unknown;
};

type LogisticsRow = LogisticsForm & {
  id?: string | number;
  switch?: boolean;
};

function asLogisticsRow(row: unknown): LogisticsRow {
  return row as LogisticsRow;
}



const defaultForm = (): LogisticsForm => ({
  name: "",
  code: "",
  standBy: "false",
  disabled: "CLOSE",
});

const normalizeStandBy = (value: unknown) => (value === true || value === "true" ? "true" : "false");

const table = ref<TableInstance | null>(null);
const formRef = ref<FormInstance | null>(null);

const modalVisible = ref(false);
const modalTitle = ref("");
// 分页 / loading / data / total / 查询 交给 useTable；
// 行的 switch / standBy 字段加工放在 resolve 里，行为与原来一致
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
} = useTable<LogisticsRow>(getLogisticsPage, {
  form: { sort: "createTime", order: "desc", name: "" },
  pageSize: 20,
  resolve: (res) => {
    const r = res as { success?: boolean; result?: { records?: LogisticsRow[]; total?: number } };
    if (!r?.success) return null;
    const records = (r.result?.records ?? []) as LogisticsRow[];
    records.forEach((e) => {
      e.switch = e.disabled === "OPEN";
      e.standBy = normalizeStandBy(e.standBy);
    });
    return { records, total: r.result?.total || 0 };
  },
});
const form = ref(defaultForm());
const formValidate = reactive({
  name: [
    {
      required: true,
      message: "请输入物流公司名称",
      trigger: "blur",
    },
  ],
  code: [
    {
      required: true,
      message: "请输入物流公司编码",
      trigger: "blur",
    },
  ],
});
const submitLoading = ref(false);
const id = ref<string | number>("");

function changeSwitch(row: LogisticsRow) {
  updateLogistics(row.id ?? "", {
    name: row.name,
    code: row.code,
    standBy: normalizeStandBy(row.standBy),
    disabled: row.disabled === "CLOSE" ? "OPEN" : "CLOSE",
  }).then((res) => {
    if (res.success) {
      ElMessage.success("操作成功");
      getDataList();
    } else {
      row.switch = !row.switch;
    }
  });
}
function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;

    if (modalTitle.value === "添加") {
      const payload = {
        name: form.value.name,
        code: form.value.code,
        disabled: form.value.disabled,
        standBy: normalizeStandBy(form.value.standBy),
        formItems: form.value.formItems,
      };
      addLogistics(payload).then((res) => {
        submitLoading.value = false;
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
          modalVisible.value = false;
        }
      });
    } else {
      updateLogistics(id.value, {
        ...form.value,
        standBy: normalizeStandBy(form.value.standBy),
      }).then((res) => {
        submitLoading.value = false;
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
          modalVisible.value = false;
        }
      });
    }
  });
}
function add() {
  modalTitle.value = "添加";
  form.value = defaultForm();
  nextTick(() => {
    formRef.value?.resetFields();
  });
  modalVisible.value = true;
}
function detail(v: LogisticsRow) {
  id.value = v.id ?? "";
  modalTitle.value = "修改";
  form.value = {
    name: v.name,
    code: v.code,
    standBy: normalizeStandBy(v.standBy),
    disabled: v.disabled,
  };
  modalVisible.value = true;
}
function remove(v: LogisticsRow) {
  Modal.confirm({
    title: "确认删除",
    content: "您确认要删除 " + v.name + " ?",
    onOk: () => {
      return delLogistics(v.id ?? "").then((res) => {
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
        }
      });
    },
  });
}

// 首屏数据由 useTable 的 immediate 负责
</script>

<template>
  <div>
    <el-cascader
      :model-value="selectDep ?? []"
      :options="department"
      :props="cascaderProps"
      filterable
      clearable
      placeholder="请选择"
      style="width: 100%"
      @update:model-value="onValueChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { initDepartment } from "@/api/index";
import type { CascaderValue } from "element-plus";

defineOptions({ name: "departmentChoose" });

const emit = defineEmits(["on-change"]);

/** 部门节点：后端返回 title/id/children，级联需要 value/label */
type DepartmentNode = {
  id?: string | number;
  title?: string;
  value?: string | number;
  label?: string;
  children?: DepartmentNode[];
  [key: string]: unknown;
};

/** el-cascader 的值：路径数组（清空时可能为 null） */
const selectDep = ref<Array<string | number> | null>([]);

function onValueChange(val: CascaderValue | null | undefined) {
  selectDep.value = Array.isArray(val) ? (val as Array<string | number>) : [];
  handleChangeDep(selectDep.value);
}
const department = ref<DepartmentNode[]>([]);
const cascaderProps = ref({
  value: "value",
  label: "label",
  children: "children",
  checkStrictly: true,
  emitPath: true,
});

function initDepartmentData() {
  initDepartment().then((res) => {
    if (res.success && res.result) {
      const arr = res.result;
      filterData(arr);
      department.value = arr;
    }
  });
}
function handleChangeDep(value?: Array<string | number> | null) {
  let departmentId: string | number = "";
  if (value && value.length > 0) {
    departmentId = value[value.length - 1];
  }
  emit("on-change", departmentId);
}
function clearSelect() {
  selectDep.value = [];
}
function filterData(data: DepartmentNode[]) {
  data.forEach((node) => {
    node.value = node.id;
    node.label = node.title;
    if (node.children) {
      filterData(node.children);
    }
  });
}

initDepartmentData();

// userManage.vue 通过 depRef 引用本组件（当前未实际调用方法），作为公共组件 API 保留
defineExpose({ clearSelect, selectDep });
</script>

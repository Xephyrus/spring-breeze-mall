<template>
  <div>
    <div style="display: flex">
      <el-input
        v-model="departmentTitle"
        readonly
        style="margin-right: 10px; flex: 1"
        :placeholder="placeholder"
        :clearable="clearable"
        @clear="clearSelect"
      />
      <el-popover trigger="click" placement="right" title="选择部门" :width="280">
        <template #reference>
          <el-button>选择部门</el-button>
        </template>
        <el-input
          v-model="searchKey"
          placeholder="输入部门名搜索"
          clearable
          style="margin-bottom: 8px"
          @input="searchDep"
        />
        <div v-loading="depLoading" class="dep-tree-bar">
          <el-tree
            :data="dataDep"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            @node-click="selectTree"
          />
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { initDepartment } from "@/api/index";

defineOptions({ name: "departmentTreeChoose" });

/** 部门树节点：后端返回 title/id/children */
type DepartmentNode = {
  id?: string | number;
  title?: string;
  children?: DepartmentNode[];
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    multiple?: boolean;
    clearable?: boolean;
    placeholder?: string;
  }>(),
  {
    multiple: false,
    clearable: true,
    placeholder: "点击选择部门",
  }
);
const emit = defineEmits(["on-change", "on-clear"]);

const depLoading = ref(false);
const departmentTitle = ref("");
const searchKey = ref("");
const dataDep = ref<DepartmentNode[]>([]);
const cloneDep = ref<DepartmentNode[]>([]);
/** 已选部门 id（多选时是数组，单选时只有一个元素） */
const departmentId = ref<Array<string | number>>([]);
const treeProps = {
  label: "title",
  children: "children",
};

function initDepartmentData() {
  depLoading.value = true;
  initDepartment()
    .then((res) => {
      if (res.success && res.result) {
        dataDep.value = res.result;
        cloneDep.value = JSON.parse(JSON.stringify(dataDep.value));
      }
    })
    .finally(() => {
      depLoading.value = false;
    });
}
function searchDep() {
  if (searchKey.value) {
    dataDep.value = cloneDep.value.filter(
      (item) => (item.title ?? "").indexOf(searchKey.value) > -1
    );
  } else {
    dataDep.value = JSON.parse(JSON.stringify(cloneDep.value));
  }
}
function selectTree(node?: DepartmentNode | null) {
  if (!node) {
    emit("on-change", null);
    departmentId.value = [];
    departmentTitle.value = "";
    return;
  }
  departmentId.value = node.id === undefined ? [] : [node.id];
  departmentTitle.value = node.title ?? "";
  emit("on-change", {
    departmentId: departmentId.value,
    departmentTitle: departmentTitle.value,
  });
}
function clearSelect() {
  departmentId.value = [];
  departmentTitle.value = "";
  initDepartmentData();
  if (props.multiple) {
    emit("on-change", []);
  } else {
    emit("on-change", "");
  }
  emit("on-clear");
}
/** 父组件回显：ids 多选时是数组，单选时是单个 id */
function setData(ids: string | number | Array<string | number> | null, title?: string) {
  departmentTitle.value = title ?? "";
  if (props.multiple) {
    departmentId.value = Array.isArray(ids) ? ids : ids === null ? [] : [ids];
  } else {
    departmentId.value = [];
    if (ids !== null && ids !== undefined && !Array.isArray(ids)) {
      departmentId.value.push(ids);
    } else if (Array.isArray(ids)) {
      departmentId.value.push(...ids);
    }
  }
}

initDepartmentData();

// 父组件（userManage）通过 ref 调用 setData / clearSelect
defineExpose({ setData, clearSelect });
</script>

<style lang="scss" scoped>
.dep-tree-bar {
  position: relative;
  min-height: 80px;
  max-height: 500px;
  overflow: auto;
  margin-top: 5px;
}

.dep-tree-bar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.dep-tree-bar::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #e4e4e4;
}
</style>

<template>
  <div>
    <el-cascader
      :model-value="addr ?? []"
      :options="data"
      :props="cascaderProps"
      placeholder="请选择地址"
      style="width: 350px"
      @update:model-value="onValueChange"
    />
  </div>
</template>
<script setup lang="ts">
import type { ApiResult } from "@/types/api";
import { computed, ref, watch } from "vue";
import type { CascaderProps, CascaderValue } from "element-plus";
import { getChildRegion } from "@/api/common";

/** 级联选项节点：value/label 供 el-cascader 使用，children 为下一级。 */
type RegionNode = {
  value: string | number;
  label: string;
  leaf?: boolean;
  children?: RegionNode[];
};
/** 区域接口返回项。 */
type RegionApiItem = { id: string | number; name: string; level?: string };

const props = defineProps<{ addressId?: string }>();
const emit = defineEmits(["selected"]);

const data = ref<RegionNode[]>([]);
/** el-cascader 的选中值：路径上的 value 数组 */
const addr = ref<Array<string | number> | null>([]);

const cascaderProps = computed<CascaderProps>(() => {
  return {
    value: "value",
    label: "label",
    lazy: true,
    lazyLoad: loadData as CascaderProps["lazyLoad"],
  };
});

/** el-cascader 的回传值可能是 null（清空），统一归一后再处理 */
function onValueChange(val: CascaderValue | null | undefined) {
  addr.value = Array.isArray(val) ? (val as Array<string | number>) : [];
  change(addr.value);
}

function change(val: unknown) {
  const values = Array.isArray(val) ? (val as Array<string | number>) : [];
  if (!values.length) {
    emit("selected", [[], []]);
    return;
  }
  const labels = resolveLabels(values);
  emit("selected", [values, labels]);
}

function resolveLabels(values: Array<string | number>) {
  const labels: string[] = [];
  let options = data.value;
  for (const v of values) {
    const node = options.find((item) => item.value === v);
    if (!node) break;
    labels.push(node.label);
    options = node.children || [];
  }
  return labels;
}

function loadData(
  node: { level: number; value?: string | number; label?: string },
  resolve: (nodes: RegionNode[]) => void
) {
  const parentId = node.level === 0 ? 0 : (node.value ?? 0);
  getChildRegion(parentId).then((res) => {
    if (!res.result || res.result.length <= 0) {
      resolve([]);
      return;
    }
    const nodes = (res.result ?? []).map((child: RegionApiItem) => {
      const isLeaf =
        child.level === "street" ||
        node.label === "香港特别行政区" ||
        child.name === "台湾省";
      return {
        value: child.id,
        label: child.name,
        leaf: isLeaf,
      };
    });
    resolve(nodes);
  });
}

async function init() {
  const res = (await getChildRegion(0)) as ApiResult<RegionApiItem[]>;
  data.value = (res.result ?? []).map((item) => ({
    value: item.id,
    label: item.name,
    leaf: item.name === "台湾省",
  }));
}

async function reviewData() {
  const addrArr = JSON.parse(JSON.stringify((props.addressId ?? "").split(",")));
  const length = addrArr.length;
  const root = (await getChildRegion(0)) as ApiResult<RegionApiItem[]>;
  const arr0: RegionNode[] = (root.result ?? []).map((item) => ({
    value: item.id,
    label: item.name,
    leaf: item.name === "台湾省",
    children: [],
  }));

  if (length > 0) {
    const children = (await getChildRegion(addrArr[0])) as ApiResult<RegionApiItem[]>;
    const arr1 = handleData(children.result ?? []);
    arr0.forEach((e) => {
      if (e.value === addrArr[0]) {
        e.children = arr1;
      }
    });
  }
  if (length > 1) {
    let arr1 = arr0.find((e) => e.value === addrArr[0])?.children || [];
    const children = (await getChildRegion(addrArr[1])) as ApiResult<RegionApiItem[]>;
    const arr2 = handleData(children.result ?? []);
    arr1.forEach((e) => {
      if (e.value === addrArr[1]) {
        e.children = arr2;
      }
    });
  }
  if (length > 2) {
    const arr1 = arr0.find((e) => e.value === addrArr[0])?.children || [];
    const arr2 = arr1.find((e) => e.value === addrArr[1])?.children || [];
    const children = (await getChildRegion(addrArr[2])) as ApiResult<RegionApiItem[]>;
    const arr3 = handleData(children.result ?? []);
    arr2.forEach((e) => {
      if (e.value === addrArr[2]) {
        e.children = arr3;
      }
    });
  }
  data.value = arr0;
  addr.value = addrArr;
}

function handleData(list: RegionApiItem[]): RegionNode[] {
  return list.map((child) => ({
    value: child.id,
    label: child.name,
    leaf: child.level === "street",
    children: child.level === "street" ? undefined : [],
  }));
}

watch(
  () => props.addressId,
  (v) => {
    if (v) {
      reviewData();
    } else {
      init();
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-card>
    <div class="operation mb_10">
      <el-button type="primary" :loading="asyncLoading" @click="handleAsyncRegion">
        同步数据
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      border
      lazy
      :load="loadChildren"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      style="width: 100%"
    >
      <el-table-column prop="name" label="地区名称" min-width="200" />
      <el-table-column label="级别" width="100">
        <template #default="{ row }">
          <span v-if="row">{{ levelLabel(row.level) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="adCode" label="区域编码" min-width="120" />
      <el-table-column label="城市代码" min-width="120">
        <template #default="{ row }">
          <span v-if="row">{{ row.cityCode && row.cityCode !== "null" ? row.cityCode : "" }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="center" label="经纬度" min-width="140" show-overflow-tooltip />
      <el-table-column prop="orderNum" label="排序" width="80" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import type { RegionNode } from "@/types/vo/common";
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";
import { getChildRegion, asyncRegion } from "@/api/index";

type RegionRow = {
  id?: string | number;
  name?: string;
  level?: string;
  adCode?: string;
  cityCode?: string;
  center?: string;
  orderNum?: number;
  hasChildren?: boolean;
  children?: RegionRow[];
};


type MessageHandle = { close: () => void };

const loading = ref(false);
const asyncLoading = ref(false);
const num = ref(10);
const tableData = ref<RegionRow[]>([]);
const levelMap: Record<string, string> = {
  country: "国家",
  province: "省份",
  city: "市",
  district: "区县",
  street: "街道",
};

function levelLabel(level: string | undefined) {
  return levelMap[level ?? ""] || level || "";
}

function isLeafRegion(child: RegionRow, parentName = "") {
  return (
    child.level === "street" ||
    child.name === "台湾省" ||
    parentName === "香港特别行政区" ||
    parentName === "澳门特别行政区"
  );
}

function mapRegionRow(child: RegionRow, parentName = ""): RegionRow {
  return {
    ...child,
    cityCode: child.cityCode === "null" ? "" : child.cityCode,
    hasChildren: !isLeafRegion(child, parentName),
  };
}

function loadRoot() {
  loading.value = true;
  getChildRegion(0)
    .then((res) => {
      tableData.value = (res.result || []).map((item: RegionNode) => mapRegionRow(item));
    })
    .finally(() => {
      loading.value = false;
    });
}

function loadChildren(
  row: RegionRow,
  _treeNode: unknown,
  resolve: (data: RegionRow[]) => void
) {
  getChildRegion(row.id!).then((res) => {
    if (!res.result?.length) {
      resolve([]);
      return;
    }
    resolve(res.result.map((child: RegionNode) => mapRegionRow(child, row.name)));
  });
}

function handleAsyncRegion() {
  num.value = 10;
  Modal.confirm({
    title: "确定更新？",
    content: "更新后店铺以及用户地区绑定数据将全部错乱",
    onOk: () => {
      asyncLoading.value = true;
      let messageInstance: MessageHandle | null = null;
      const showCountdown = () => {
        if (messageInstance) messageInstance.close();
        messageInstance = ElMessage.info({
          message: `地区数据将在 ${num.value} 秒后更新`,
          duration: 0,
          showClose: true,
        }) as MessageHandle;
      };
      showCountdown();
      const number = setInterval(() => {
        num.value--;
        showCountdown();
      }, 1000);
      setTimeout(() => {
        clearInterval(number);
        if (messageInstance) messageInstance.close();
        ElMessage.closeAll();
        asyncRegion().then(() => {
          asyncLoading.value = false;
          ElMessage.success("地区数据正在更新中！");
          loadRoot();
        });
      }, 10000);
    },
  });
}

onMounted(() => {
  loadRoot();
});
</script>

<style scoped lang="scss">
.operation {
  margin-bottom: 12px;
}
</style>

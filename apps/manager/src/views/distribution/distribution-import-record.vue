<template>
  <div class="search">
    <el-card>
      <el-table v-loading="loading" border :data="data" class="mt_10" style="width: 100%">
        <el-table-column prop="id" label="ID" min-width="200" class-name="id-column" show-overflow-tooltip />
        <el-table-column prop="totalCount" label="导入总数" width="110" />
        <el-table-column prop="successCount" label="成功数" width="100" />
        <el-table-column prop="failCount" label="失败数" width="100" />
        <el-table-column label="导入状态" width="120">
          <template #default="{ row }">
            <span v-if="row">{{ statusLabel(asRow(row).status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" label="导入时间" min-width="170" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a
                v-if="asRow(row).failCount && asRow(row).failCount! > 0"
                class="link-text"
                @click="downloadFailList(row)"
              >下载失败列表</a>
              <span v-else>-</span>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="changePage" @size-change="changePageSize" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import {
  downloadDistributionImportFailItems,
  getDistributionImportBatches,
} from "@/api/distribution";
import { downloadBlob } from "@/utils/download-blob";
import { ElMessage } from "element-plus";

defineOptions({ name: "distributionImportRecord" });

const { loading, data, total, searchForm, getDataList } = useTable(
  getDistributionImportBatches,
  { pageSize: 20 }
);


interface ImportBatchRow {
  id: string | number;
  failCount?: number;
  status?: string;
}

function asRow(row: unknown): ImportBatchRow {
  return row as ImportBatchRow;
}

function statusLabel(status: string | undefined) {
  const map: Record<string, string> = {
    PROCESSING: "处理中",
    DONE: "已完成",
    FAILED: "失败",
  };
  if (!status) return "-";
  return map[status] || status || "-";
}
function changePage() {
  getDataList();
}
function changePageSize() {
  searchForm.pageNumber = 1;
  getDataList();
}
function downloadFailList(row: unknown) {
  const r = asRow(row);
  if (!r || !r.failCount) return;
  downloadDistributionImportFailItems(r.id)
    .then((res) => {
      const blob = res as unknown as Blob;
      if (blob && blob.type && blob.type.includes("application/json")) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = JSON.parse(String(reader.result)) as { message?: string };
            ElMessage.error(result.message || "下载失败");
          } catch {
            ElMessage.error("下载失败");
          }
        };
        reader.readAsText(blob);
        return;
      }
      downloadBlob(blob, `分销员导入失败列表_${r.id}.xlsx`);
      ElMessage.success("下载成功");
    })
    .catch(() => {
      ElMessage.error("下载失败");
    });
}
</script>

<style scoped lang="scss">
.link-text {
  color: #2d8cf0;
  cursor: pointer;
  text-decoration: none;
}
.mt_10 {
  margin-top: 10px;
}
</style>

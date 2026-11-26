<template>
  <div class="search">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="70px"
        class="search-form"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="活动名称" prop="promotionName">
          <el-input
            v-model="searchForm.promotionName"
            placeholder="请输入活动名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="活动状态" prop="promotionStatus">
          <el-select
            v-model="searchForm.promotionStatus"
            placeholder="请选择"
            clearable
            style="width: 240px"
          >
            <el-option label="未开始" value="NEW" />
            <el-option label="已开始/上架" value="START" />
            <el-option label="已结束/下架" value="END" />
            <el-option label="紧急关闭/作废" value="CLOSE" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="selectDate"
            type="daterange"
            clearable
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
      >
        <el-table-column
          prop="promotionName"
          label="活动名称"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag v-if="row" :type="promotionStatusTagType(asRow(row).promotionStatus)">
              {{ promotionStatusText(asRow(row).promotionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="所属店铺" min-width="120" show-overflow-tooltip />
        <el-table-column prop="startTime" label="活动开始时间" width="180" />
        <el-table-column prop="endTime" label="活动结束时间" width="180" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a class="link-text" @click="view(row)">查看</a>
              <template v-if="asRow(row).promotionStatus === 'START' || asRow(row).promotionStatus === 'NEW'">
                <span class="op-split">|</span>
                <a class="link-text" @click="close(row)">关闭</a>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getPintuanList, updatePintuanStatus } from "@/api/promotion";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "pintuan" });

type PromotionStatus = "NEW" | "START" | "END" | "CLOSE" | string;

type PintuanRow = {
  id?: string | number;
  promotionName?: string;
  promotionStatus?: PromotionStatus;
  storeName?: string;
  startTime?: string;
  endTime?: string;
};




function asRow(row: unknown): PintuanRow {
  return row as PintuanRow;
}

const router = useRouter();

const searchFormRef = ref<FormInstance | null>(null);

const selectDate = ref<Date[] | string[]>([]);
// 分页 / loading / data / total / 查询 统一交给 useTable；
// 日期区间 → startTime/endTime 的转换放在 beforeRequest 里，行为与原来一致
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<PintuanRow>(getPintuanList, {
  form: { sort: "createTime", order: "desc", promotionName: "", promotionStatus: "" },
  pageSize: 20,
  beforeRequest: (params: Record<string, unknown>) => {
    const range = selectDate.value;
    if (range && range[0] && range[1]) {
      params.startTime = new Date(range[0]).getTime();
      params.endTime = new Date(range[1]).getTime();
    } else {
      params.startTime = null;
      params.endTime = null;
    }
    return params;
  },
});

function promotionStatusText(status: PromotionStatus | undefined) {
  const map: Record<string, string> = {
    NEW: "未开始",
    START: "已开始",
    END: "已结束",
    CLOSE: "已关闭",
  };
  return map[status ?? ""] || "未知";
}
function promotionStatusTagType(status: PromotionStatus | undefined): "info" | "success" | "danger" | "warning" | "primary" {
  const map: Record<string, "info" | "success" | "danger"> = {
    NEW: "info",
    START: "success",
    END: "danger",
    CLOSE: "danger",
  };
  return map[status ?? ""] || "danger";
}
function view(v: unknown) {
  const row = asRow(v);
  router.push({ name: "pintuan-goods", query: { id: String(row.id) } });
}
function close(v: unknown) {
  const row = asRow(v);
  Modal.confirm({
    title: "确认关闭",
    content: "您确认要关闭此拼团活动?",
    onOk: () => {
      updatePintuanStatus(row.id!).then((res) => {
        Modal.remove();
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

<style lang="scss" scoped>
.mt_10 {
  margin-top: 10px;
}
</style>

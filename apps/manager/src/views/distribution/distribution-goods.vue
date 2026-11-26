<template>
  <div>
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="70px"
        class="search-form"
        @keyup.enter.prevent="handleSearch"
      >
        <el-form-item label="商品名称" prop="goodsName">
          <el-input
            v-model="searchForm.goodsName"
            placeholder="请输入商品名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="店铺名称" prop="storeName">
          <el-input
            v-model="searchForm.storeName"
            placeholder="请输入店铺名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="平台类目" prop="categoryId">
          <el-cascader
            :model-value="searchForm.categoryId"
            @update:model-value="(v: unknown) => (searchForm.categoryId = String(Array.isArray(v) ? v[0] ?? '' : v ?? ''))"
            :options="categoryList"
            :props="categoryProps"
            clearable
            filterable
            placeholder="请选择平台类目"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="商品品牌" prop="brandId">
          <el-select
            v-model="searchForm.brandId"
            clearable
            filterable
            placeholder="请选择商品品牌"
            style="width: 240px"
          >
            <el-option
              v-for="item in brandList"
              :key="String(item.id ?? '')"
              :label="String(item.name ?? '')"
              :value="String(item.id ?? '')"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <el-tabs
        :model-value="currentAuthStatus"
        class="auth-tabs"
        @update:model-value="(v: string | number | undefined) => (currentAuthStatus = String(v ?? ''))"
        @tab-change="onAuthStatusChange"
      >
        <el-tab-pane label="全部" name="ALL" />
        <el-tab-pane label="待审核" name="TOBEAUDITED" />
        <el-tab-pane label="已审核" name="PASS" />
        <el-tab-pane label="审核未通过" name="REFUSE" />
      </el-tabs>

      <div class="operation" style="margin: 10px 0">
        <el-button type="primary" @click="openBatchAudit" :disabled="!hasPendingAuditSelection">批量审核</el-button>
        <el-button type="primary" style="margin-left: 10px" @click="delAll">批量下架</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10 distribution-goods-table"
        style="width: 100%"
        @selection-change="changeSelect"
      >
        <el-table-column type="selection" width="55" align="center" fixed="left" />
        <el-table-column label="商品图片" width="80" align="center" fixed="left">
          <template #default="{ row }">
            <img
              v-if="row?.thumbnail"
              :src="row.thumbnail"
              alt="商品图"
              class="goods-thumbnail"
            />
            <span v-else class="goods-thumbnail-empty">无图</span>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="200" show-overflow-tooltip fixed="left">
          <template #default="{ row }">
            <span v-if="row">{{ row.goodsName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="goodsId" label="商品编号" min-width="200" show-overflow-tooltip />
        <el-table-column label="商品类型" min-width="110">
          <template #default="{ row }">
            <span v-if="row">{{ goodsTypeText(row.goodsType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="平台类目" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row">{{ row.platformCategoryName || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="品牌" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row">{{ row.brandName || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品价格" min-width="110">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">{{ $filters.unitPrice(row.price, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="店铺名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="佣金金额" min-width="110">
          <template #default="{ row }">
            <span v-if="row" :style="{ color: $mainColor }">{{ $filters.unitPrice(row.commission, "￥") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row" :type="authStatusTagType(row.authStatus)" size="small">
              {{ authStatusText(row.authStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <a v-if="row.authStatus === 'TOBEAUDITED'" class="link-text" @click.prevent="openAudit(row)">审核</a>
              <span v-if="row.authStatus === 'TOBEAUDITED'" class="op-split">|</span>
              <a class="link-text" @click.prevent="remove(row)">下架</a>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="onPageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog
      v-model="auditModalVisible"
      :title="auditTargetIds.length > 1 ? '批量审核分销商品' : '审核分销商品'"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="auditForm" label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group
            :model-value="auditForm.authStatus"
            @update:model-value="(v: string | number | boolean | undefined) => (auditForm.authStatus = String(v ?? 'PASS'))"
          >
            <el-radio value="PASS">通过</el-radio>
            <el-radio value="REFUSE">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.authStatus === 'REFUSE'" label="审核备注">
          <el-input
            v-model="auditForm.authRemark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditModalVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditLoading" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import type { FormRefLike, TableRefLike } from "@/types/el-refs";
import { ref, reactive, computed, onMounted } from "vue";
import { auditDistributionGoods, delDistributionGoods, getDistributionGoods } from "@/api/distribution";
import { getBrandListData, getCategoryTree } from "@/api/goods";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "distributionGoods" });

// 模板 el-form 的 ref（原 ref="searchForm"，与 data 同名会互相覆盖，改名为 searchFormRef）
/** 分销商品行（后端分页返回） */
type DistributionGoodsRow = {
  id?: string | number;
  goodsId?: string | number;
  authStatus?: string;
  goodsName?: string;
  goodsType?: string;
  storeName?: string;
  [key: string]: unknown;
};

/** 审核表单 */
type AuditForm = { authStatus: string; authRemark: string };

/** 商品搜索条件 */

const searchFormRef = ref<FormRefLike | null>(null);
const table = ref<TableRefLike | null>(null);

const currentAuthStatus = ref<string>("ALL");
const auditModalVisible = ref(false);
const auditLoading = ref(false);
const auditTargetIds = ref<Array<string | number>>([]);
const auditForm = ref<AuditForm>({
  authStatus: "PASS",
  authRemark: "",
});
// 分页 / loading / data / total / 查询 交给 useTable
const {
  loading,
  data,
  total,
  searchForm,
  getDataList,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<DistributionGoodsRow>(getDistributionGoods, {
  form: { sort: "createTime", order: "desc", goodsName: "", storeName: "", categoryId: "", brandId: "", authStatus: "" },
  pageSize: 20,
});
const categoryList = ref<Array<Record<string, unknown>>>([]);
const categoryProps = reactive({
  value: "id",
  label: "name",
  children: "children",
  checkStrictly: true,
  emitPath: false,
});
const brandList = ref<Array<Record<string, unknown>>>([]);
const selectList = ref<DistributionGoodsRow[]>([]);
const selectCount = ref(0);

const hasPendingAuditSelection = computed(() =>
  selectList.value.some((item) => item.authStatus === "TOBEAUDITED")
);

function authStatusText(value: string | undefined) {
  if (value === "TOBEAUDITED") return "待审核";
  if (value === "REFUSE") return "审核未通过";
  return "已审核";
}
function authStatusTagType(value: string | undefined): "primary" | "success" | "warning" | "info" | "danger" {
  if (value === "TOBEAUDITED") return "warning";
  if (value === "REFUSE") return "danger";
  return "success";
}
function onAuthStatusChange(name: string | number | undefined) {
  searchForm.authStatus = name === "ALL" ? "" : String(name);
  searchForm.pageNumber = 1;
  getDataList();
  clearSelectAll();
}
function openAudit(row: DistributionGoodsRow) {
  if (row.id !== undefined) auditTargetIds.value = [row.id];
  auditForm.value = { authStatus: "PASS", authRemark: "" };
  auditModalVisible.value = true;
}
function openBatchAudit() {
  const pendingRows = selectList.value.filter((item) => item.authStatus === "TOBEAUDITED");
  if (!pendingRows.length) {
    ElMessage.warning("请选择待审核的分销商品");
    return;
  }
  auditTargetIds.value = pendingRows.map((item) => item.id).filter((id): id is string | number => id !== undefined);
  auditForm.value = { authStatus: "PASS", authRemark: "" };
  auditModalVisible.value = true;
}
function submitAudit() {
  if (auditForm.value.authStatus === "REFUSE" && !auditForm.value.authRemark.trim()) {
    ElMessage.warning("请填写驳回原因");
    return;
  }
  auditLoading.value = true;
  auditDistributionGoods({
    ids: auditTargetIds.value,
    authStatus: auditForm.value.authStatus,
    authRemark: auditForm.value.authRemark.trim(),
  })
    .then((res) => {
      if (res.success) {
        ElMessage.success("审核成功");
        auditModalVisible.value = false;
        clearSelectAll();
        getDataList();
      }
    })
    .finally(() => {
      auditLoading.value = false;
    });
}
function goodsTypeText(value: string | undefined) {
  if (value === "PHYSICAL_GOODS") return "实物商品";
  if (value === "VIRTUAL_GOODS") return "虚拟商品";
  if (value === "E_COUPON") return "电子卡券";
  return "-";
}
function loadFilterOptions() {
  getCategoryTree().then((res) => {
    if (res.success) {
      categoryList.value = res.result || [];
    }
  });
  getBrandListData().then((res) => {
    brandList.value = Array.isArray(res) ? res : res.result || [];
  });
}
// 翻页时清空勾选（原行为）
function onPageChange(page: number) {
  handleCurrentChange(page);
  clearSelectAll();
}
function clearSelectAll() {
  table.value?.clearSelection?.();
}
function changeSelect(e: DistributionGoodsRow[]) {
  selectList.value = e;
  selectCount.value = e.length;
}
function remove(v: DistributionGoodsRow) {
  Modal.confirm({
    title: "确认下架",
    content: "您确认要下架么?",
    onOk: () => {
      delDistributionGoods(String(v.id ?? "")).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("下架成功");
          getDataList();
        }
      });
    },
  });
}
function delAll() {
  if (selectCount.value <= 0) {
    ElMessage.warning("您还未选择要下架的数据");
    return;
  }
  Modal.confirm({
    title: "确认下架",
    content: "您确认要下架所选的 " + selectCount.value + " 条数据?",
    onOk: () => {
      const ids = selectList.value.map((item) => item.id);
      delDistributionGoods(ids.toString()).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("下架成功");
          clearSelectAll();
          getDataList();
        }
      });
    },
  });
}


onMounted(() => {
  // 列表由 useTable 的 immediate 负责，这里只加载分类/品牌筛选项
  loadFilterOptions();
});
</script>
<style lang="scss" scoped>
.link-text {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
}

.goods-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  vertical-align: middle;
}

.goods-thumbnail-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.mt_10 {
  margin-top: 10px;
}

.auth-tabs {
  margin-bottom: 4px;
}

.list-card {
  margin-top: 16px;
}

.op-split {
  margin: 0 6px;
  color: #dcdfe6;
}
</style>

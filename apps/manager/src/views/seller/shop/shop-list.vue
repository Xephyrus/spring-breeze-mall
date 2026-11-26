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
        <el-form-item label="会员名称" prop="memberName">
          <el-input
            v-model="searchForm.memberName"
            placeholder="请输入会员名称"
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
        <el-form-item label="店铺状态">
          <el-select v-model="searchForm.storeDisable" clearable style="width: 240px">
            <el-option label="开启中" value="OPEN" />
            <el-option label="已关闭" value="CLOSED" />
            <el-option label="审核中" value="APPLYING" />
            <el-option label="审核拒绝" value="REFUSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="selectDate"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
            @change="selectDateRange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div class="operation padding-row">
        <el-button type="primary" @click="add">添加</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
      >
        <el-table-column prop="storeName" label="店铺名称" min-width="120" align="left" />
        <el-table-column prop="memberName" label="会员名称" min-width="130" show-overflow-tooltip />
        <el-table-column label="店铺地址" width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-if="row" type="info">{{ row.storeAddressPath || "暂未填写" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否自营" width="120" align="left">
          <template #default="{ row }">
            <span v-if="row">{{ row.selfOperated ? "自营" : "非自营" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="店铺状态" width="130" align="left">
          <template #default="{ row }">
            <span v-if="row">{{ storeDisableText(row.storeDisable) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="goodsNum" label="上架商品数" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.goodsNum ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="订单总数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.orderNum ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="left" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row">
              <template v-if="row.storeDisable === 'APPLYING'">
                <a class="link-text" @click="audit(row)">审核</a>
                <span class="op-split">|</span>
                <a class="link-text" @click="edit(row)">修改</a>
              </template>
              <template v-else>
                <a v-if="selectedShop" class="link-text" @click="callback(row)">选择</a>
                <span v-if="selectedShop" class="op-split">|</span>
                <a class="link-text" @click="detail(row)">查看</a>
                <span class="op-split">|</span>
                <a class="link-text" @click="edit(row)">修改</a>
                <template v-if="row.storeDisable === 'OPEN' || row.storeDisable === 'CLOSED'">
                  <span class="op-split">|</span>
                  <a v-if="row.storeDisable === 'OPEN'" class="link-text" @click="disable(row)">关闭</a>
                  <a v-else-if="row.storeDisable === 'CLOSED'" class="link-text" @click="enable(row)">开启</a>
                </template>
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
import { getShopListData, disableShop, enableBrand, shopAudit } from "@/api/shops";
import { ElMessage } from "element-plus";
import type { FormInstance, TableInstance } from "element-plus";
import { Modal } from "@/utils/message";

defineOptions({ name: "shop" });

const emit = defineEmits(["callback"]);

const router = useRouter();

type ShopRow = {
  id?: string | number;
  storeName?: string;
  [key: string]: unknown;
};

const selectDate = ref<string[] | null>(null);
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
} = useTable<ShopRow>(getShopListData, {
  form: {
    sort: "createTime",
    order: "desc",
    startDate: "",
    endDate: "",
    memberName: "",
    storeName: "",
    storeDisable: "",
  },
  pageSize: 20,
});
const selectedShop = ref(false);

// 模板 ref（原 ref="searchForm" / ref="table"，script 内未使用，仅改名避免与 data 同名覆盖）
const searchFormRef = ref<FormInstance | null>(null);
const tableRef = ref<TableInstance | null>(null);

function storeDisableText(v: string | undefined) {
  const map: Record<string, string> = {
    OPEN: "开启中",
    CLOSED: "已关闭",
    APPLY: "申请中",
    APPLYING: "审核中",
    REFUSED: "审核拒绝",
  };
  return map[v ?? ""] || v || "-";
}

function callback(val: unknown) {
  emit("callback", val);
}


function selectDateRange(v: string[] | null) {
  if (v && v.length === 2) {
    searchForm.startDate = v[0];
    searchForm.endDate = v[1];
  } else {
    searchForm.startDate = "";
    searchForm.endDate = "";
  }
}


function add() {
  router.push({ path: "/shop-operation" });
}

function edit(v: ShopRow) {
  router.push({ path: "/shop-operation", query: { shopId: v.id ?? "" } });
}

function disable(v: ShopRow) {
  Modal.confirm({
    title: "确认关闭",
    content: "您确认要关闭店铺 " + v.storeName + " ?",
    onOk: () => {
      disableShop(v.id ?? "").then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
        }
      });
    },
  });
}

function detail(row: ShopRow) {
  router.push({ name: "shop-detail", query: { id: row.id ?? "" } });
}

function audit(v: ShopRow) {
  Modal.confirm({
    title: "审核店铺",
    content: "您确认要审核通过店铺 " + v.storeName + " ?",
    okText: "通过",
    cancelText: "驳回",
    onOk: () => {
      shopAudit(v.id ?? "", false).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
        }
      });
    },
    onCancel: () => {
      shopAudit(v.id ?? "", true).then((res) => {
        Modal.remove();
        if (res.success) {
          ElMessage.success("操作成功");
          getDataList();
        }
      });
    },
  });
}

function enable(v: ShopRow) {
  Modal.confirm({
    title: "确认开启",
    content: "您确认要开启店铺 " + v.storeName + " ?",
    onOk: () => {
      enableBrand(v.id ?? "").then((res) => {
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
.padding-row {
  margin-bottom: 10px;
}
.mt_10 {
  margin-top: 10px;
}
</style>

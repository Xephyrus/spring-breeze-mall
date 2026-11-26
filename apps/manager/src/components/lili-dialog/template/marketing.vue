<!--
  楼层装修链接选择器-营销活动选择面板（满额活动拆分为满减、满折、满赠三项）
  @author Bulbasaur
  @since 2026-11-09
-->
<template>
  <div class="wrapper">
    <div class="list">
      <div
        v-for="(item, index) in promotionKeys"
        :key="index"
        class="list-item"
        :class="{ active: selectedIndex == index }"
        @click="clickPromotion(item, index)"
      >
        {{ typeOption(item).title }}
      </div>
    </div>
    <div class="content">
      <div v-if="showPromotionList">
        <div class="tables">
          <el-table v-loading="loading" border height="350" :data="showPromotionList" style="width: 100%">
            <template v-if="isSeckillMode">
              <el-table-column prop="goodsName" label="商品名称" min-width="200" show-overflow-tooltip />
              <el-table-column prop="storeName" label="店铺名称" show-overflow-tooltip />
              <el-table-column label="活动时间" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row">{{ row.timeLine }}点</span>
                </template>
              </el-table-column>
              <el-table-column label="原价" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row">{{ $filters.unitPrice(row.originalPrice) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="现价" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row">{{ $filters.unitPrice(row.price, "￥") }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row">{{ seckillStatusText(row.promotionApplyStatus) }}</span>
                </template>
              </el-table-column>
            </template>
            <template v-else>
              <el-table-column prop="goodsName" label="商品名称" show-overflow-tooltip />
              <el-table-column prop="storeName" label="店铺名称" show-overflow-tooltip />
              <el-table-column prop="startTime" label="开始时间" show-overflow-tooltip />
              <el-table-column prop="endTime" label="结束时间" show-overflow-tooltip />
            </template>
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row, $index }">
                <a v-if="row" class="link-text" @click="selectedPromotion({ row, index: $index })">
                  {{ index === $index ? "已选" : "选择" }}
                </a>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="params.pageNumber"
            v-model:page-size="params.pageSize"
            class="mt_10"
            :total="Number(totals)"
            layout="prev, pager, next, jumper"
            size="small"
            @current-change="(val: number) => { params.pageNumber = val; }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getAllPromotion } from "@/api/promotion";

const emit = defineEmits(["selected"]);

/** 活动商品行（装修链接只需透传） */
type PromotionRow = Record<string, unknown> & {
  ___type?: string;
  ___promotion?: string;
  id?: string | number;
};

const totals = ref("");
const loading = ref(true);
const promotionList = ref<Record<string, PromotionRow[] | PromotionRow | undefined>>({});
const selectedIndex = ref(0);
const promotions = ref("");
const index = ref(999);
const params = ref({
  pageNumber: 1,
  pageSize: 20,
});
const showPromotionList = ref<PromotionRow[]>([]);

const promotionKeys = computed(() => {
  return Object.keys(promotionList.value || {}).filter(
    (k) => k !== "FULL_DISCOUNT" && Boolean(typeOption(k).title)
  );
});

const isSeckillMode = computed(() => {
  return promotions.value === "SECKILL";
});

watch(
  params,
  () => {
    index.value = 999;
    typeOption(promotions.value) && typeOption(promotions.value).methodsed();
  },
  { deep: true }
);

function seckillStatusText(v?: string) {
  if (v === "APPLY") return "申请";
  if (v === "PASS") return "通过";
  return "拒绝";
}
function sortGoods(type: string) {
  loading.value = false;
  const bucket = promotionList.value[type];
  showPromotionList.value = Array.isArray(bucket) ? bucket : [];
}
function typeOption(type: string) {
  const run = (kind: string) => (_id?: unknown) => {
    showPromotionList.value = [];
    sortGoods(kind);
  };
  switch (type) {
    case "FULL_MINUS":
      return { title: "满减活动", methodsed: run("FULL_MINUS") };
    case "FULL_RATE":
      return { title: "满折活动", methodsed: run("FULL_RATE") };
    case "FULL_GIFT":
      return { title: "满赠活动", methodsed: run("FULL_GIFT") };
    case "FULL_DISCOUNT":
      return { title: "满减活动", methodsed: run("FULL_DISCOUNT") };
    case "PINTUAN":
      return { title: "拼团", methodsed: run("PINTUAN") };
    case "KANJIA":
      return { title: "砍价", methodsed: run("KANJIA") };
    case "SECKILL":
      return { title: "秒杀", methodsed: run("SECKILL") };
    case "POINTS_GOODS":
      return { title: "积分商品", methodsed: run("POINTS_GOODS") };
    default:
      return { title: "", methodsed: (_id?: unknown) => {} };
  }
}
function selectedPromotion(payload: { row: PromotionRow; index: number }) {
  const row = payload.row;
  row.___type = "marketing";
  row.___promotion = promotions.value;
  emit("selected", [row]);
  index.value = payload.index;
}
async function init() {
  const res = await getAllPromotion();
  if (res.success) {
    loading.value = false;
    getPromotion(res);
  } else {
    loading.value = false;
  }
}
function getPromotion(res: { result?: Record<string, PromotionRow[] | PromotionRow> }) {
  if (res.result) {
    promotionList.value = res.result;
    delete promotionList.value.COUPON;
    const keys = promotionKeys.value;
    if (keys.length) {
      promotions.value = keys[0];
      typeOption(keys[0]) && typeOption(keys[0]).methodsed();
    }
  }
}
function clickPromotion(val: string, i: number) {
  promotions.value = val;
  selectedIndex.value = i;
  params.value.pageNumber = 1;
  const bucket = promotionList.value[val];
  const bucketId =
    bucket && typeof bucket === "object" && !Array.isArray(bucket)
      ? (bucket as { id?: string | number }).id
      : undefined;
  typeOption(val) && typeOption(val).methodsed(bucketId);
}

onMounted(() => {
  init();
});
</script>
<style lang="scss" scoped>
.link-text {
  color: #2d8cf0;
  cursor: pointer;
  text-decoration: none;
}
.tables {
  height: 400px;
  margin-top: 20px;
  overflow: auto;
  width: 100%;
}
.list {
  margin: 0 1.5%;
  height: 400px;
  overflow: auto;
  flex: 1;
  width: auto;
  > .list-item {
    padding: 10px;
    transition: 0.35s;
    cursor: pointer;
  }
  .list-item:hover {
    background: #ededed;
  }
}
.content {
  overflow: hidden;
  flex: 4;
}
.active {
  background: #ededed;
}
.wrapper {
  overflow: hidden;
  display: flex;
}
</style>

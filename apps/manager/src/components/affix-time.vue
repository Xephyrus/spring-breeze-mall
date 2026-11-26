<template>
  <div>
    <div class="breadcrumb">
      <span
        v-for="(item, index) in dateList"
        :key="index"
        :class="{ active: item.selected }"
        @click="clickBreadcrumb(item)"
      >
        {{ item.title }}
      </span>
      <div class="date-picker">
        <el-select
          v-model="month"
          placeholder="年月查询"
          clearable
          style="width: 200px; margin-left: 10px"
          @change="changeSelect"
        >
          <el-option
            v-for="(item, i) in dates"
            :key="i"
            :label="item.year + '年' + item.month + '月'"
            :value="item.year + '-' + item.month"
          />
        </el-select>
      </div>
      <div v-if="!closeShop" class="shop-list">
        <el-select
          v-model="storeId"
          placeholder="店铺查询"
          clearable
          filterable
          style="width: 200px; margin-left: 10px"
          @change="changeshop"
        >
          <el-option
            v-for="(item, index) in shopsData"
            :key="index"
            :label="item.storeName"
            :value="String(item.id)"
          />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getShopListData } from "@/api/shops";

defineProps<{ closeShop?: boolean }>();
// 事件名用数组形式：下游（statistics/order、statistics/traffic）各自有更宽的参数类型，
// 写死 payload 类型会与它们的 handler 逆变不兼容
const emit = defineEmits(["selected"]);

const month = ref("");
type TimeWay = {
  title: string;
  selected: boolean;
  searchType: string;
  storeId?: string;
  year?: string;
  month?: string;
};
/** 年月下拉项 */
type YearMonth = { year: number; month: number };

/** 店铺下拉项（只用到这两个字段） */
type ShopOption = { id?: string | number; storeName?: string };

const selectedWay = ref<TimeWay>({
  title: "过去7天",
  selected: true,
  searchType: "LAST_SEVEN",
});
const storeId = ref("");
const dates = ref<YearMonth[]>([]);
const params = ref({
  pageNumber: 1,
  pageSize: 100,
  storeName: "",
});
const dateList = ref([
  { title: "今天", selected: false, searchType: "TODAY" },
  { title: "昨天", selected: false, searchType: "YESTERDAY" },
  { title: "过去7天", selected: true, searchType: "LAST_SEVEN" },
  { title: "过去30天", selected: false, searchType: "LAST_THIRTY" },
]);
const originDateList = ref([
  { title: "今天", selected: false, searchType: "TODAY" },
  { title: "昨天", selected: false, searchType: "YESTERDAY" },
  { title: "过去7天", selected: true, searchType: "LAST_SEVEN" },
  { title: "过去30天", selected: false, searchType: "LAST_THIRTY" },
]);
const shopTotal = ref(0);
const shopsData = ref<ShopOption[]>([]);

onMounted(() => {
  getFiveYears();
  getShopList();
});

function getShopList() {
  getShopListData(params.value).then((res) => {
    if (res.success) {
      const page = res.result ?? { records: [], total: 0 };
      shopTotal.value = Number(page.total) || 0;
      shopsData.value = page.records || [];
    }
  });
}
function changeshop() {
  selectedWay.value.storeId = storeId.value;
  emit("selected", selectedWay.value);
}
function getFiveYears() {
  const getYear = new Date().getFullYear();
  const lastFiveYear = getYear - 5;
  const maxMonth = new Date().getMonth() + 1;
  const list: YearMonth[] = [];
  for (let year = lastFiveYear; year <= getYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === getYear && month > maxMonth) {
        continue;
      }
      list.push({ year, month });
    }
  }
  dates.value = list.reverse();
}
function changeSelect(e: string) {
  month.value = e;
  if (month.value) {
    dateList.value.forEach((entry) => {
      entry.selected = false;
    });
    const parts = String(month.value).split("-");
    selectedWay.value = {
      ...selectedWay.value,
      year: parts[0],
      month: parts[1],
      searchType: "",
      storeId: storeId.value,
    };
    emit("selected", selectedWay.value);
  } else {
    const current =
      dateList.value.find((item) => item.selected) ||
      dateList.value.find((item) => item.title === selectedWay.value.title) ||
      dateList.value.find((item) => item.searchType === "LAST_SEVEN");
    clickBreadcrumb(current);
  }
}
function clickBreadcrumb(item?: TimeWay) {
  if (!item) return;
  let currentIndex = -1;
  dateList.value.forEach((entry, index) => {
    entry.selected = false;
    if (entry.title === item.title) {
      currentIndex = index;
    }
  });
  item.selected = true;
  item.storeId = storeId.value;
  month.value = "";
  if (item.searchType === "") {
    const origin = originDateList.value[currentIndex];
    item.searchType = (origin && origin.searchType) || "LAST_SEVEN";
  }
  selectedWay.value = item;
  selectedWay.value.year = String(new Date().getFullYear());
  selectedWay.value.month = "";
  emit("selected", selectedWay.value);
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  display: flex;
  align-items: center;

  > span {
    margin-right: 15px;
    cursor: pointer;
  }
}

.active {
  color: var(--el-color-primary);
  position: relative;
}

.active:before {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--el-color-primary);
}
</style>

<template>
  <div class="search box">
    <el-card>
      <el-date-picker
        v-model="params.date"
        type="date"
        placeholder="选择查看日期"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
        style="width: 200px"
        @change="search"
      />
      <el-alert
        class="mt_10"
        type="success"
        :closable="false"
        show-icon
        title="这里展示历史某一天的热词数据统计，可根据需求配置每日持久化多少条数据。"
      />
      <div id="container"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Chart } from "@antv/g2";
import { getHotWordsHistory } from "@/api/index";
import { ElMessage } from "element-plus";
import { unixToDate } from "@/utils/filters";

defineOptions({ name: "HOTWORDS_HISTORY" });

type HotWordPoint = Record<string, unknown>;

const params = ref<{ date: string }>({
  date: "",
});
const hotWordsChart = ref<Chart | null>(null);
const hotWordsData = ref<HotWordPoint[]>([]);
const endMonth = ref<string | null>(null);

// 原 created
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
params.value.date = unixToDate(Math.floor(yesterday.getTime() / 1000), "yyyy-MM-dd");

function disabledDate(date: Date) {
  if (endMonth.value) {
    const endDate = getDate(endMonth.value);
    return (date && date > endDate) || date > new Date();
  }
  return date && date > new Date();
}
function getDate(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return new Date(Number(year), Number(month), 0);
}
async function search(val: string | undefined = undefined) {
  if (val) {
    params.value.date = val;
  }
  const res = (await getHotWordsHistory(params.value)) as {
    success?: boolean;
    result?: HotWordPoint[];
  };
  if (res.success) {
    hotWordsData.value = res.result || [];
    if (hotWordsChart.value) {
      hotWordsChart.value.changeData(hotWordsData.value);
      hotWordsChart.value.render();
    }
    if (!hotWordsData.value.length) {
      ElMessage.error("暂无数据");
    }
  }
}
function init() {
  const chart = new Chart({
    container: "container",
    autoFit: true,
    height: 500,
    padding: [50, 20, 50, 20],
  });
  chart.scale("score", {
    alias: "搜索次数",
  });
  chart.axis("keywords", {
    tickLine: {
      alignTick: false,
    },
  });
  chart.axis("score", false);
  chart.tooltip({
    showMarkers: false,
  });
  chart.interval().position("keywords*score").color("#f59b99");
  chart.interaction("element-active");
  hotWordsChart.value = chart;
  search();
}

onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.box {
  min-height: 400px;
}
</style>

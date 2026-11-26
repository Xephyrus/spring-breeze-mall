<template>
  <div class="home-container">
    <!-- 统计 -->
    <div class="card">
      <h4>基本信息</h4>
      <div class="count-list flex">
        <div class="count-item" @click="navigateTo('manager-goods')">
          <div>
            <el-icon class="icon" :size="31"><Picture /></el-icon>
          </div>
          <div>
            <div class="counts">{{ homeData.goodsNum || 0 }}</div>
            <div>商品数量</div>
          </div>
        </div>
        <div class="count-item" @click="navigateTo('member-list')">
          <div>
            <el-icon class="icon" :size="31"><User /></el-icon>
          </div>
          <div>
            <div class="counts">{{ homeData.memberNum || 0 }}</div>
            <div>会员数量</div>
          </div>
        </div>
        <div class="count-item" @click="navigateTo('order-list')">
          <div>
            <el-icon class="icon" :size="31"><List /></el-icon>
          </div>
          <div>
            <div class="counts">{{ homeData.orderNum || 0 }}</div>
            <div>订单数量</div>
          </div>
        </div>
        <div class="count-item" @click="navigateTo('shop-list')">
          <div>
            <el-icon class="icon" :size="31"><DataLine /></el-icon>
          </div>
          <div>
            <div class="counts">{{ homeData.storeNum || 0 }}</div>
            <div>店铺数量</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日待办 -->
    <div class="card">
      <h4>今日待办</h4>
      <div class="todo-list flex">
        <div class="todo-item" @click="navigateTo('apply-goods')">
          <div class="counts">{{ notices.goods || 0 }}</div>
          <div>待审核商品</div>
        </div>
        <div class="todo-item" @click="navigateTo('shopAuth')">
          <div class="counts">{{ notices.store || 0 }}</div>
          <div>待审核店铺</div>
        </div>
        <div class="todo-item" @click="navigateTo('order-complaint')">
          <div class="counts">{{ notices.complain || 0 }}</div>
          <div>待审核投诉</div>
        </div>
        <div class="todo-item" @click="navigateTo('after-sale-order')">
          <div class="counts">{{ notices.refund || 0 }}</div>
          <div>待审核售后</div>
        </div>
        <div class="todo-item" @click="goDistributionCash">
          <div class="counts">
            {{ notices.distributionCash || 0 }}
          </div>
          <div>待审核分销提现</div>
        </div>
        <div class="todo-item" @click="navigateTo('accountStatementBill')">
          <div class="counts">{{ notices.waitPayBill || 0 }}</div>
          <div>待审核分账</div>
        </div>
        <div class="todo-item" @click="goAppointmentWorkOrders">
          <div class="counts">{{ notices.appointmentWorkOrder || 0 }}</div>
          <div>未完成预约工单</div>
        </div>
        <div class="todo-item" @click="goMemberWithdrawApply">
          <div class="counts">{{ notices.balanceCash || 0 }}</div>
          <div>待审核会员提现</div>
        </div>
      </div>
    </div>

    <!-- 今日，流量概括 -->
    <div class="card flow">
      <div class="flow-list flex">
        <div class="flow-item">
          <div class="flow-member">
            <div>当前在线人数</div>
            <span>
              {{ homeData.currentNumberPeopleOnline || 0 }}</span>
          </div>
          <div class="flow-wrapper">
            <h4>流量概括</h4>
            <div class="card flow-box flex">
              <div class="flow-box-item">
                <div>今日访客数</div>
                <div class="counts">
                  {{ homeData.todayUV || 0 }}
                </div>
              </div>
              <div class="flow-box-item">
                <div>昨日访客数</div>
                <div class="counts">
                  {{ homeData.yesterdayUV || 0 }}
                </div>
              </div>
            </div>

            <div class="flow-splice flex">
              <div class="flow-box-splice">
                <div>前七日访客数</div>
                <div class="counts">
                  {{ homeData.lastSevenUV || 0 }}
                </div>
              </div>
              <div class="flow-box-splice">
                <div>前三十日访客数</div>
                <div class="counts">
                  {{ homeData.lastThirtyUV || 0 }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="today-box">
          <h4>今日概括</h4>
          <div class="today-list flex">
            <div class="today-item">
              <div>今日订单数</div>
              <span>{{ homeData.todayOrderNum || 0 }}</span>
            </div>
            <div class="today-item">
              <div>今日交易额</div>
              <span>{{ $filters.unitPrice(homeData.todayOrderPrice || 0, "￥") }}</span>
            </div>
            <div class="today-item">
              <div>今日新增店铺</div>
              <span>{{ homeData.todayStoreNum || 0 }}</span>
            </div>
            <div class="today-item">
              <div>今日新增会员数</div>
              <span>{{ homeData.todayMemberNum || 0 }}</span>
            </div>
            <div class="today-item">
              <div>今日上架商品数量</div>
              <span>{{ homeData.todayGoodsNum || 0 }}</span>
            </div>
            <div class="today-item">
              <div>今日新增评论</div>
              <span>{{ homeData.todayMemberEvaluation || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- chart -->
    <div class="card transform">
      <div>
        <h4>最近48小时在线人数（整点为准）</h4>
        <div id="historyMemberChart"></div>
      </div>
    </div>
    <div class="card range-card">
      <div class="range-bar">
        <h4>统计范围</h4>
        <div class="range-options">
          <span
            v-for="item in rangeOptions"
            :key="item.searchType"
            :class="{ active: !rangeMonth && rangeKey === item.searchType }"
            @click="changeRange(item)"
          >{{ item.title }}</span>
          <el-select
            v-model="rangeMonth"
            clearable
            placeholder="按月"
            style="width: 140px"
            @change="changeMonth"
          >
            <el-option
              v-for="item in recentMonths"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <p class="range-tip">流量走势、交易趋势和热卖 TOP10 使用同一时间范围，当前为{{ rangeTitle }}。</p>
    </div>
    <!-- chart -->
    <div class="charts flex">
      <div class="chart-item">
        <h4>流量走势</h4>
        <div id="pvChart"></div>
      </div>
      <div class="chart-item">
        <h4>交易趋势</h4>
        <div id="orderChart"></div>
      </div>
    </div>

    <!-- top10商品 -->
    <div class="card transform">
      <h4>热卖商品TOP10 · {{ rangeTitle }}</h4>
      <el-table stripe :data="topHotGoodsData" style="width: 100%">
        <el-table-column type="index" label="排名" width="100" align="center" />
        <el-table-column prop="goodsName" label="商品名称" />
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">
            <span :style="{ color: $mainColor }">{{ $filters.unitPrice(row.price, '￥') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="num" label="销量" width="100" sortable />
      </el-table>
    </div>

    <!-- top10店铺 -->
    <div class="card transform">
      <h4>热卖店铺TOP10 · {{ rangeTitle }}</h4>
      <el-table stripe :data="topHotShopsData" style="width: 100%">
        <el-table-column type="index" label="排名" width="100" align="center" />
        <el-table-column prop="storeName" label="店铺名称" />
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">
            <span :style="{ color: $mainColor }">{{ $filters.unitPrice(row.price, '￥') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="num" label="销量" width="100" sortable />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartRow } from "@/types/vo/misc";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Picture, User, List, DataLine } from "@element-plus/icons-vue";
import { homeStatistics, hotGoods, hotShops, getNoticePage } from "@/api/index";
import * as API_Goods from "@/api/goods";
// @antv/g2 体积较大（约 589KB），改为首次画图时按需加载，避免拖慢首页首屏
type G2Chart = import("@antv/g2").Chart;
let g2ChartCtor: typeof import("@antv/g2").Chart | null = null;
async function getChartCtor() {
  if (!g2ChartCtor) {
    const g2 = await import("@antv/g2");
    g2ChartCtor = g2.Chart;
  }
  return g2ChartCtor;
}
import * as API_Member from "@/api/member";
import { useAppStore } from "@/stores/app";

defineOptions({ name: "home" });

type HomeStats = {
  goodsNum?: number | string;
  memberNum?: number | string;
  orderNum?: number | string;
  storeNum?: number | string;
  currentNumberPeopleOnline?: number | string;
  todayUV?: number | string;
  yesterdayUV?: number | string;
  lastSevenUV?: number | string;
  lastThirtyUV?: number | string;
  todayOrderNum?: number | string;
  todayOrderPrice?: number | string;
  todayStoreNum?: number | string;
  todayMemberNum?: number | string;
  todayGoodsNum?: number | string;
  todayMemberEvaluation?: number | string;
  [key: string]: unknown;
};

type AwaitTodo = {
  goods?: number | string;
  store?: number | string;
  complain?: number | string;
  refund?: number | string;
  distributionCash?: number | string;
  waitPayBill?: number | string;
  appointmentWorkOrder?: number | string;
  balanceCash?: number | string;
  [key: string]: unknown;
};


type HotItem = {
  goodsName?: string;
  storeName?: string;
  price?: number | string;
  num?: number | string;
  [key: string]: unknown;
};


type RangeOption = { title: string; searchType: string };
type MonthOption = { value: string; label: string };

const router = useRouter();
const appStore = useAppStore();

const topHotGoodsData = ref<HotItem[]>([]);
const topHotShopsData = ref<HotItem[]>([]);
const awaitTodoData = ref<AwaitTodo>({});
const homeData = ref<HomeStats>({});
const pvChart = ref<G2Chart | null>(null);
const orderChart = ref<G2Chart | null>(null);
const historyMemberChart = ref<G2Chart | null>(null);
const rangeKey = ref("LAST_SEVEN");
const rangeMonth = ref("");
const rangeOptions = ref<RangeOption[]>([
  { title: "今天", searchType: "TODAY" },
  { title: "昨天", searchType: "YESTERDAY" },
  { title: "过去7天", searchType: "LAST_SEVEN" },
  { title: "过去30天", searchType: "LAST_THIRTY" },
]);

let orderChartData: ChartRow[] = [];
let data: ChartRow[] = [];
let chartList: ChartRow[] = [];

const notices = computed(() => (appStore.notices || {}) as Record<string, unknown>);

const recentMonths = computed(() => {
  const list: MonthOption[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    list.push({
      value: `${year}-${month}`,
      label: `${year}年${month}月`,
    });
  }
  return list;
});

const rangeTitle = computed(() => {
  if (rangeMonth.value) {
    const found = recentMonths.value.find((item) => item.value === rangeMonth.value);
    return found ? found.label : rangeMonth.value;
  }
  const found = rangeOptions.value.find((item) => item.searchType === rangeKey.value);
  return found ? found.title : "过去7天";
});

function navigateTo(name: string) {
  router.push({
    name,
  });
}

function goDistributionCash() {
  router.push({
    name: "distribution-cash",
    query: { tabStatus: "APPLY" },
  });
}

function goAppointmentWorkOrders() {
  router.push({
    name: "manager-appointment-work-orders",
    query: { serviceStatus: "OPEN" },
  });
}

function goMemberWithdrawApply() {
  router.push({
    name: "withdraw-apply",
    query: { applyStatus: "APPLY" },
  });
}

function rangeQuery() {
  if (rangeMonth.value) {
    const [year, month] = rangeMonth.value.split("-");
    return { year, month };
  }
  return { searchType: rangeKey.value || "LAST_SEVEN" };
}

function changeRange(item: RangeOption) {
  rangeMonth.value = "";
  rangeKey.value = item.searchType;
  reloadRange();
}

function changeMonth(value: string | null | undefined) {
  rangeMonth.value = value || "";
  if (!rangeMonth.value) {
    rangeKey.value = "LAST_SEVEN";
  }
  reloadRange();
}

function reloadRange() {
  toHotGoods();
  topHotShops();
  getPvChart();
  initOrderChartList();
}

// top10热卖商品
async function toHotGoods() {
  let res = await hotGoods(rangeQuery());
  topHotGoodsData.value = res.success ? res.result || [] : [];
}

// top10热卖店铺
async function topHotShops() {
  let res = await hotShops(rangeQuery());
  topHotShopsData.value = res.success ? res.result || [] : [];
}

// 今日待办
async function awaitTodo() {
  let res = await getNoticePage();
  if (res.success) awaitTodoData.value = res.result;
}

//首页统计数据
async function getHomeData() {
  let res = await homeStatistics();
  if (res.success) {
    const price = res.result.todayOrderPrice;
    const amount = price === null || price === undefined || price === "" || price === "null"
      ? 0
      : Number(price);
    res.result.todayOrderPrice = Number.isNaN(amount) ? 0 : amount;
    homeData.value = res.result;
  }
}

// 实例化订单图表
async function initOrderChartList() {
  if (orderChart.value) orderChart.value.clear();
  const res = await API_Goods.getOrderChart(rangeQuery());
  if (res.success) {
    orderChartData = res.result || [];

    if (!orderChart.value) {
      orderChart.value = new (await getChartCtor())({
        container: "orderChart",
        autoFit: true,
        height: 500,
        padding: [70, 70, 70, 70],
      });
    }

    initOrderChart(); //订单表
  }
}

// 订单表
function initOrderChart() {
  let chartData = orderChartData || [];

  chartData.forEach((item) => {
    const time = item.createTime ? String(item.createTime) : "";
    item.createTime = time.includes(" ") ? time.split(" ")[0] : time;
    item.title = "交易额";
  });
  orderChart.value!.data(chartData);

  orderChart.value!.tooltip({
    showCrosshairs: true,
    shared: true,
  });

  orderChart.value!
    .line()
    .position("createTime*price")
    .label("price")
    .color("title")
    .shape("smooth");

  orderChart.value!
    .point()
    .position("createTime*price")
    .label("price")
    .color("title")
    .shape("circle")
    .style({
      stroke: "#fff",
      lineWidth: 1,
    });
  orderChart.value!.area().position("createTime*price").color("title").shape("smooth");

  orderChart.value!.render();
}

// 浏览量统计图
function initPvChart() {
  const uv: Record<string, unknown>[] = [];
  const pv: Record<string, unknown>[] = [];
  const rows = Array.isArray(data) ? data : [];
  rows.forEach((item) => {
    uv.push({
      date: item.date,
      uvNum: item.uvNum,
      title: "访客数UV",
      pv: item.uvNum,
    });

    pv.push({
      date: item.date,
      pvNum: item.pvNum,
      pv: item.pvNum,
      title: "浏览量PV",
    });
  });

  let chartData = [...uv, ...pv];

  pvChart.value!.data(chartData);

  pvChart.value!.tooltip({
    showCrosshairs: true,
    shared: true,
  });

  pvChart.value!
    .line()
    .position("date*pv")
    .color("title")
    .label("pv")
    .shape("smooth");

  pvChart.value!
    .point()
    .position("date*pv")
    .color("title")
    .label("pv")
    .shape("circle")
    .style({
      stroke: "#fff",
      lineWidth: 1,
    });
  pvChart.value!.area().position("date*pv").color("title").shape("smooth");

  pvChart.value!.render();
}

// 浏览量
async function getPvChart() {
  if (pvChart.value) pvChart.value.clear();
  API_Member.getStatisticsList(rangeQuery()).then(async (res) => {
    if (res.result) {
      data = (res.result ?? []) as unknown as typeof data;

      if (!pvChart.value) {
        pvChart.value = new (await getChartCtor())({
          container: "pvChart",
          autoFit: true,
          height: 500,
          padding: [70, 70, 70, 70],
        });
      }
      initPvChart();
    }
  });
}

// 实例化会员流量图表
async function initHistoryMemberChartList() {
  if (historyMemberChart.value) historyMemberChart.value.clear();
  const res = await API_Member.historyMemberChartList();
  if (res.success) {
    chartList = (res.result ?? []) as unknown as typeof chartList;

    if (!historyMemberChart.value) {
      historyMemberChart.value = new (await getChartCtor())({
        container: "historyMemberChart",
        autoFit: true,
        height: 500,
        padding: [70, 70, 70, 70],
      });
    }

    initHistoryMemberChart();
  }
}

// 历史在线人数
function initHistoryMemberChart() {
  // 默认已经加载 legend-filter 交互
  const chartData = chartList;
  const num: Record<string, unknown>[] = [];
  const lastNum: Record<string, unknown>[] = [];
  chartData.forEach((item) => {
    const dateStr = String(item.date ?? "");
    num.push({
      date: dateStr.substring(5),
      title: "最近48小时",
      num: item.num,
      res: item.num,
    });

    lastNum.push({
      date: dateStr.substring(5),
      title: "上一周期",
      lastNum: item.lastNum || 0,
      res: item.lastNum || 0,
    });
  });
  let params = [...num, ...lastNum];
  historyMemberChart.value!.data(params);

  historyMemberChart.value!.tooltip({
    showCrosshairs: true,
    shared: true,
  });

  historyMemberChart.value!
    .line()
    .position("date*res")
    .color("title")
    .label("res")
    .shape("smooth");
  historyMemberChart.value!
    .point()
    .position("date*res")
    .color("title")
    .label("res")
    .shape("circle");

  historyMemberChart.value!
    .area()
    .position("date*res")
    .color("title")
    .shape("smooth");

  historyMemberChart.value!.render();
}

// 初始化信息
function init() {
  toHotGoods();
  topHotShops();
  awaitTodo();
  getHomeData();
  getPvChart();
  initOrderChartList();
  initHistoryMemberChartList();
}

function destroyCharts() {
  if (pvChart.value) {
    pvChart.value.destroy();
    pvChart.value = null;
  }
  if (orderChart.value) {
    orderChart.value.destroy();
    orderChart.value = null;
  }
  if (historyMemberChart.value) {
    historyMemberChart.value.destroy();
    historyMemberChart.value = null;
  }
}

onBeforeUnmount(() => {
  destroyCharts();
});

onMounted(() => {
  init();
});
</script>
<style lang="scss" scoped>
@import "./home.scss";
</style>

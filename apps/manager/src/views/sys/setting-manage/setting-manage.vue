
<template>
  <el-card v-if="show">
    <el-tabs v-model="selected" @tab-change="clickTab">
      <el-tab-pane
        v-for="(tabItem, tabIndex) in tabWay"
        :key="tabIndex"
        :label="tabItem.name"
        :name="tabItem.type"
      >
        <component
          v-if="settingData && selected === tabItem.type"
          :is="resolveTemplate(tabItem.type)"
          :res="settingData"
          :type="tabItem.type"
        />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getSetting } from "@/api/index";
import templateSetting from "./template";

const route = useRoute();

type SettingTab = { type: string; name: string };
type ApiResult = { success?: boolean; result?: unknown };
type TemplateMap = Record<string, unknown>;

const selected = ref<string | number>(""); // 已选
const settingData = ref(""); // 模板数据
const show = ref(true); // 是否显示
const setting = ref<SettingTab[]>([
  //基础配置
  {
    type: "BASE_SETTING",
    name: "基础配置",
  },
  //商品设置
  {
    type: "GOODS_SETTING",
    name: "商品设置",
  },
  //订单配置
  {
    type: "ORDER_SETTING",
    name: "订单配置",
  },
  //积分设置
  { type: "POINT_SETTING", name: "积分设置" },
  {
    type: "WITHDRAWAL_SETTING",
    name: "提现设置",
  },
  //  快递查询设置
  {
    type: "LOGISTICS_SETTING",
    name: "快递查询设置",
  },
  //静态资源配置
  {
    type: "OSS_SETTING",
    name: "静态资源配置",
  },
  //短信配置
  {
    type: "SMS_SETTING",
    name: "短信配置",
  },
  //阿里短信配置
  {
    type: "IM_SETTING",
    name: "客服设置",
  },
  {
    type: "LIVE_SETTING",
    name: "直播设置",
  },
  {
    type: "VERIFICATION_SETTING",
    name: "验证码设置",
  },
  {
    type: "SECURITY_SETTING",
    name: "安全设置",
  },
]);
const authLogin = ref<SettingTab[]>([
  // 登录设置
  { type: "CONNECT_SETTING", name: "登录设置" },
  // 微信设置
  { type: "WECHAT_CONNECT", name: "微信设置" },
  // QQ设置
  { type: "QQ_CONNECT", name: "QQ设置" },
]);
const pay = ref<SettingTab[]>([
  //支付宝支付设置
  { type: "PAYMENT_SUPPORT", name: "支付开启/关闭" },
  //支付宝支付设置
  { type: "ALIPAY_PAYMENT", name: "支付宝支付设置" },
  //微信支付设置
  { type: "WECHAT_PAYMENT", name: "微信支付设置" },
]);
const tabWay = ref<SettingTab[]>([]); // tab数据
const settingRequestSeq = ref(0);

function resolveTemplate(type: string) {
  return (templateSetting as TemplateMap)[type];
}

watch(route, () => {
  selected.value = "";
  show.value = false;
  getSettingData(String(selected.value || ""));
  nextTick(() => {
    show.value = true;
  });
});

onMounted(() => {
  clickTab(String(selected.value || ""));
});

// tab切换
function clickTab(name: string | number) {
  selected.value = name;
  getSettingData(String(name || ""));
}

function resolveTabWay() {
  const tabMap: Record<string, SettingTab[]> = {
    setting: setting.value,
    "auth-login": authLogin.value,
    pay: pay.value,
  };
  // 路由 name 可能因为菜单改名而变化，这里用 path 兜底，避免整页空白
  const path = String(route.path || "");
  const fallback = path.includes("auth-login")
    ? authLogin.value
    : path.includes("pay")
      ? pay.value
      : setting.value;
  tabWay.value = tabMap[String(route.name || "")] || fallback;
}

function normalizeSettingResult(res: ApiResult) {
  if (!res || res.result == null) {
    return {};
  }
  const raw = res.result;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

/**
 * 进入页面请求第一个配置
 */
function getSettingData(name: string) {
  settingData.value = "";
  resolveTabWay();

  if (!name) {
    if (!tabWay.value.length) {
      return;
    }
    name = tabWay.value[0].type;
    selected.value = name;
  }

  const requestId = ++settingRequestSeq.value;
  getSetting(name)
    .then((res) => {
      if (requestId !== settingRequestSeq.value) {
        return;
      }
      settingData.value = JSON.stringify(normalizeSettingResult(res));
    })
    .catch(() => {
      if (requestId !== settingRequestSeq.value) {
        return;
      }
      settingData.value = "{}";
    });
}
</script>

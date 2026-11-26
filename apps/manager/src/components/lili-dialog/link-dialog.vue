<template>
  <div class="wrapper">
    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane
        :label="item.title"
        :name="item.title"
        v-for="(item, i) in wap"
        :key="i"
      >
        <component
          ref="liliComponentRef"
          :is="templateWay[item.name]"
          @selected="
            (val: unknown) => {
              changed = val;
            }
          "
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import wapList from "./wap";
import templateWay from "./template/index";
import type { WapLinkTab } from "./wap";

const emit = defineEmits(["selectedLink"]);

const route = useRoute();

// 子组件 selected 回传的是选中项数组（链接弹窗只需第一个）
const changed = ref<unknown>(null);
// 选择链接不再提供“活动”tab，wap.js 中的配置保留用于已有链接的名称展示
const wap = ref<WapLinkTab[]>(wapList.filter((item) => item.name !== "marketing")); // tab标签
const activeTab = ref<string | number>(wapList[0]?.title || "");
// v-for 内模板 ref 收集为数组；原名 lili-component 含连字符，改名并同步 script
/** 各 tab 的面板实例：只用到 type 字段（商品页设置成单选） */
const liliComponentRef = ref<Array<{ type?: string }>>([]);

/** 按 title 去重（原实现用对象记录已出现的 title） */
function dedupeByTitle(list: WapLinkTab[]): WapLinkTab[] {
  const seen: Record<string, boolean> = {};
  return list.reduce<WapLinkTab[]>((acc, tab) => {
    if (tab.title !== undefined && !seen[tab.title]) {
      seen[tab.title] = true;
      acc.push(tab);
    }
    return acc;
  }, []);
}

watch(
  changed,
  (val) => {
    // 因为是单选，所以直接返回第一个
    if (import.meta.env.DEV) console.info("[link-dialog] changed", { val, first: Array.isArray(val) ? val[0] : val });
    emit("selectedLink", Array.isArray(val) ? val[0] : val);
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    if (liliComponentRef.value?.[0]) {
      liliComponentRef.value[0].type = "single"; //商品页面设置成为单选
    }
  });
  let url = window.location.href;
  if (url.indexOf("/floor-list/renovation") != -1) {
    //此处去重防止移动楼层多次点击push 太多数据
    wap.value = dedupeByTitle(wap.value);
    if (route.path !== "/floor-list/main") {
      wap.value.forEach((tab, index) => {
        if (tab.title == "活动") {
          wap.value.splice(index, 1);
        }
      });
    }
  } else {
    wap.value = dedupeByTitle(wap.value);
  }
  wap.value.forEach((tab) => {
    if (tab) {
      tab.selected = false;
    }
  });
});

/**
 * 供父组件（lili-dialog）在点「确定」时兜底取值：
 * 万一 @selectedLink 的赋值链没走到，也能拿到当前选中项。
 */
function getSelected() {
  const val = changed.value;
  return Array.isArray(val) ? val[0] : val;
}

defineExpose({ getSelected });
</script>
<style scoped lang="scss">
@import "./style.scss";
.wap-content-list {
  display: flex;
  flex-wrap: wrap;
}
.wap-flex {
  margin: 2px;
}
.tabs {
  width: 100%;
}

:deep(.el-tabs__content) {
  height: 500px;
  overflow: auto;
}
</style>

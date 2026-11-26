<template>
  <div class="box">
    <!-- 顶部栏 -->
    <navbar @selected="selected" :pagetype="pagetype" />

    <component :is="pageMap[name]"></component>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Component } from "vue";
import { useRoute } from "vue-router";
import layout from "./index.vue";
import Advertising from "./advertising.vue";
import AlertAdvertising from "./alert-advertising.vue";
import navbar from "./navbar.vue";

/**
 * 按 pagetype 切换的页面集合。
 * 原写法是 `import layout from "./index.vue"` 后直接用 `layout[name]`，
 * 但 layout 是组件本身而不是映射表，取值恒为 undefined，
 * 浏览器里表现为「只有顶栏、内容区整块空白」。
 */
const pageMap: Record<string, Component> = {
  index: layout,
  advertising: Advertising,
  alertAdvertising: AlertAdvertising,
};

const route = useRoute();

const name = ref("index");
const pagetype = ref("INDEX");

onMounted(() => {
  const queryType = route.query.pagetype;
  const type = Array.isArray(queryType) ? queryType[0] : queryType;
  if (type == "ALERT") {
    name.value = "alertAdvertising";
  }
  if (type == "OPEN_SCREEN_ANIMATION") {
    name.value = "advertising";
  }
  if (typeof type === "string" && type) {
    pagetype.value = type;
  }
});

/** navbar 传来的 name 与组件 key 的对应关系（ALERT / OPEN_SCREEN_ANIMATION 是历史命名） */
const PAGE_ALIAS: Record<string, string> = {
  index: "index",
  advertising: "advertising",
  alertAdvertising: "alertAdvertising",
  ALERT: "alertAdvertising",
  alert: "alertAdvertising",
  OPEN_SCREEN_ANIMATION: "advertising",
};

function selected(val: string) {
  const key = String(val || "index");
  name.value =
    PAGE_ALIAS[key] ??
    PAGE_ALIAS[key.charAt(0).toLowerCase() + key.slice(1)] ??
    "index";
}
</script>
<style scoped lang="scss">
.box {
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0 20px;
  background: #f5f7fa;
  overflow: hidden;
  box-sizing: border-box;
}
</style>

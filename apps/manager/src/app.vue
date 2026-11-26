<template>
  <!-- 按需模式下不再 app.use(ElementPlus)，中文语言包通过 config-provider 提供给所有 el-* 组件 -->
  <el-config-provider :locale="zhCn">
    <div id="main" class="app-main">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, onUpdated } from "vue";
import { useRoute } from "vue-router";
import Cookies from "js-cookie";
import { getCategoryTree } from "@/api/goods";
import util from "@/libs/util";
import { getStore } from "@/libs/storage";
import { useAppStore } from "@/stores/app";
import zhCn from "element-plus/es/locale/lang/zh-cn";

defineOptions({ name: "App" });

const route = useRoute();
const appStore = useAppStore();

onUpdated(() => {
  if (!localStorage.getItem("category") && route.path !== "/login") {
    getCategoryTree(0).then((res) => {
      if (res.success) {
        localStorage.setItem("category", JSON.stringify(res.result));
      }
    });
  }
});

onMounted(() => {
  const loggedIn = getStore("accessToken") || Cookies.get("userInfoManager");
  if (loggedIn) {
    util.bootstrapDynamicRoutesFromCache();
    util.initRouter();
    appStore.setOpenedList();
    appStore.initCachePage();
  }
});
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  font-size: 14px;
}

.app-main {
  width: 100%;
  height: 100%;
}

.br button {
  margin-right: 5px;
}

.operation button {
  margin-right: 5px;
}

.tox-notifications-container {
  display: none !important;
}
</style>

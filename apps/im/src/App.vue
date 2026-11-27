<template>
  <!-- element-plus 改为按需引入后，语言包通过 ConfigProvider 提供（原来是 app.use(ElementPlus, { locale })） -->
  <el-config-provider :locale="zhCn">
    <div id="app">
      <router-view v-if="showView" />
    </div>
  </el-config-provider>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { setRefreshView } from "@/utils/view-refresh";

defineOptions({ name: 'App' });

// 用于点击当前页的router时，刷新当前页
const showView = ref(true);
let beforeUnload = '';
let Handler = '';

// 刷新当前路由方法
function refreshView () {
  showView.value = false
  nextTick(() => (showView.value = true))
}
function beforeunloadHandler () {
  beforeUnload = new Date().getTime();
}
// 页面关闭后 重置btnHide
function unloadHandler (e) {
  Handler = new Date().getTime() - beforeUnload;
  if (Handler <= 5) {
    var storage = window.localStorage;
    storage.clear()
    localStorage.setItem('btnHide', 1)
  }
}

onMounted(() => {
  setRefreshView(refreshView);
  window.addEventListener('beforeunload', beforeunloadHandler)
  // unload 事件已被 Chrome 弃用（Permissions-Policy 禁止），改用 pagehide
  window.addEventListener('pagehide', unloadHandler)
});
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeunloadHandler)
  window.removeEventListener('pagehide', unloadHandler)
});
</script>

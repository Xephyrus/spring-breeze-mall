<template>
  <el-tabs
      :model-value="activeTab"
      @update:model-value="(v: string | number | undefined) => (activeTab = String(v ?? 'platform'))">
    <el-tab-pane label="平台菜单" name="platform">
      <managerMenu />
    </el-tab-pane>
    <el-tab-pane label="店铺菜单" name="store">
      <storeMenu />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from "vue";
import managerMenu from "./menu.vue";
import storeMenu from "./store-menu.vue";

const activeTab = ref<string>("platform");
</script>

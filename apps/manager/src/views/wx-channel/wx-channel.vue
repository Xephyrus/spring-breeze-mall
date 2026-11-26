<template>
  <el-card>
    <el-tabs
      :model-value="selectedTab"
      @update:model-value="(v: string | number | undefined) => (selectedTab = String(v ?? 'WX_CHANNELS'))">
      <el-tab-pane label="视频号概括" name="WX_CHANNELS_OVERVIEW">
        <WxChannelsOverviewTab v-if="selectedTab === 'WX_CHANNELS_OVERVIEW'" />
      </el-tab-pane>
      <el-tab-pane label="视频号订单" name="WX_CHANNELS_ORDER">
        <WxChannelsOrderTab v-if="selectedTab === 'WX_CHANNELS_ORDER'" />
      </el-tab-pane>
      <el-tab-pane label="视频号退单" name="WX_CHANNELS_REFUND">
        <WxChannelsRefundTab v-if="selectedTab === 'WX_CHANNELS_REFUND'" />
      </el-tab-pane>
      <el-tab-pane label="视频号商品" name="WX_CHANNELS_GOODS">
        <WxChannelsGoodsTab v-if="selectedTab === 'WX_CHANNELS_GOODS'" />
      </el-tab-pane>
      <el-tab-pane label="视频号分类列表" name="WX_CHANNELS_CATEGORY">
        <WxChannelsCategoryTab v-if="selectedTab === 'WX_CHANNELS_CATEGORY'" />
      </el-tab-pane>
      <el-tab-pane label="视频号设置" name="WX_CHANNELS">
        <WxChannelsSettingTab v-if="selectedTab === 'WX_CHANNELS'" />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WxChannelsSettingTab from "./components/wx-channels-setting-tab.vue";
import WxChannelsCategoryTab from "./components/wx-channels-category-tab.vue";
import WxChannelsGoodsTab from "./components/wx-channels-goods-tab.vue";
import WxChannelsOrderTab from "./components/wx-channels-order-tab.vue";
import WxChannelsOverviewTab from "./components/wx-channels-overview-tab.vue";
import WxChannelsRefundTab from "./components/wx-channels-refund-tab.vue";

defineOptions({ name: "wx-channel" });

const selectedTab = ref<string>("WX_CHANNELS");
</script>

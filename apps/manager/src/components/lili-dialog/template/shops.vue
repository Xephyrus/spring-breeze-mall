<template>
  <StoreSelector embedded :multiple="false" :query-params="shopQuery" @selected="selectShop" />
</template>
<script setup lang="ts">
import StoreSelector from '@/components/store-selector/index.vue';
// Author: Bulbasaur; 2026-11-05. 装修链接复用统一店铺选择组件，保留单选及启用店铺范围。
const emit = defineEmits(['selected']);
const shopQuery = { storeDisable: 'OPEN' };
/** 店铺选择器回传的行（只需要 id/storeName 等字段） */
type ShopRow = Record<string, unknown>;

function selectShop(rows: ShopRow[]) {
  emit(
    'selected',
    rows.map((row) => ({ ...row, ___type: 'shops' }))
  );
}
</script>

<template>
  <view v-if="items.length" class="verify-codes">
    <view v-for="(item, index) in items" :key="item.key" class="verify-code">
      <text class="verify-code__label">{{ index === 0 ? '核销码' : '' }}</text>
      <text class="verify-code__text" :class="{ 'is-struck': item.struck }">{{ item.code }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 等价改写自 defineProps({ items: { type: Array, default: () => [] } })：
// 类型版 props 不支持 default，用 withDefaults 保住「父组件不传时为空数组」的运行时行为
withDefaults(
  defineProps<{
    items?: { key?: string | number; code?: string; struck?: boolean }[]
  }>(),
  { items: () => [] }
)
</script>

<style lang="scss" scoped>
.verify-code {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  margin-bottom: 12rpx;
  line-height: 1.5;
}
.verify-code__label {
  color: #999;
  width: 140rpx;
  flex-shrink: 0;
}
.verify-code__text {
  flex: 1;
  min-width: 0;
  font-weight: bold;
  letter-spacing: 2rpx;
  color: #333;
}
.verify-code__text.is-struck {
  color: #999;
  font-weight: normal;
  text-decoration: line-through;
}
</style>

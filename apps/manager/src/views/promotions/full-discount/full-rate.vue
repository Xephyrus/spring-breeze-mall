<!--
  管理端-满折活动列表页
  @author Bulbasaur
  @since 2026-11-09
-->
<template>
  <FullDiscountList default-activity-type="FULL_RATE" />
</template>

<script setup lang="ts">
import FullDiscountList from "./full-discount.vue";

defineOptions({ name: "manager-full-rate" });
</script>


<template>
  <div class="layout" :style="[wrapperStyle, gapStyle]">
    <div class="view-height-150" :style="imgStyle">
      <img alt="模板图片" class="image-mode" :src="res.list?.[0]?.img ?? undefined" />
    </div>
    <div class="view-height-150">
      <div class="view-height-75" :style="imgStyle">
        <img class="image-mode" :src="res.list?.[1]?.img ?? undefined" alt="" />
      </div>
      <div class="view-height-75" :style="imgStyle">
        <img class="image-mode" :src="res.list?.[2]?.img ?? undefined" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { cubeWrapperStyle, cubeImgStyle, cubeGapStyle } from "./cube-style";
import type { CubeStyleRes, WapTemplateRes } from "../../types";

defineOptions({ title: "左一右二" });
const props = defineProps<{
  res: WapTemplateRes & CubeStyleRes & { list?: Array<{ img?: string }> };
}>();

const wrapperStyle = computed(() => cubeWrapperStyle(props.res));
const imgStyle = computed(() => cubeImgStyle(props.res));
const gapStyle = computed(() => cubeGapStyle(props.res));
</script>
<style lang="scss" scoped>
@import "./tpl.scss";
.layout {
  display: flex;
  align-items: center;
  justify-content: center;

  background-size: cover;
}
.view-height-150 {
  min-width: 0;
}

</style>

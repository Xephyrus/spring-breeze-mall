<template>
  <div class="layout" :style="[wrapperStyle, gapStyle]">
    <div class="view-width-100" :style="gapStyle">
      <div class="view-height-85" :style="imgStyle">
        <img class="image-mode" :src="res.list?.[0]?.img ?? undefined" alt="" />
      </div>
      <div class="view-height-85" :style="imgStyle">
        <img class="image-mode" :src="res.list?.[1]?.img ?? undefined" alt="" />
      </div>
    </div>
    <div class="view-width-100" :style="imgStyle">
      <img alt="模板图片" class="image-mode" :src="res.list?.[2]?.img ?? undefined" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { cubeWrapperStyle, cubeImgStyle, cubeGapStyle } from "./cube-style";
import type { CubeStyleRes, WapTemplateRes } from "../../types";

defineOptions({ title: "上二下一" });
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
  flex-direction: column;
}
img {
  width: 100% !important;
  height: 85px !important;
}
.view-width-100 {
  padding: 1px 0;
  display: flex;
  height: 85px;
  width: 100%;
}
.view-height-85 {
  padding: 0 1px;
  flex: 1;
  min-width: 0;
}
</style>

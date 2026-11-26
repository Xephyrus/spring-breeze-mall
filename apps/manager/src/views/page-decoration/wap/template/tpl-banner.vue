<template>
  <div class="layout" :style="wrapperStyle">
    <div class="banner-box" :style="cardMode ? {} : boxStyle">
      <el-carousel
        class="carousel"
        v-if="res && !cardMode"
        autoplay
        :interval="5000"
        height="150px"
        :indicator-position="customIndicator ? 'none' : ''"
        @change="onChange"
      >
        <el-carousel-item v-for="(item, index) in res.list" :key="index">
          <div class="slide-wrap">
            <img alt="轮播图" class="image-mode" :style="boxStyle" :src="item.img" />
          </div>
        </el-carousel-item>
      </el-carousel>
      <!-- 卡片风格：当前图 82% 居中放大，两侧 9% 露出并缩小，循环切换 -->
      <div
        v-if="res && cardMode"
        ref="cardPreview"
        class="card-preview"
        @mouseenter="stopAuto"
        @mouseleave="startAuto"
      >
        <div class="card-track" :style="{ transform: `translateX(${trackOffset}px)` }">
          <div
            class="card-slide"
            :class="{ active: index === current }"
            v-for="(item, index) in res.list"
            :key="index"
          >
            <img alt="轮播图" class="card-img" :style="boxStyle" :src="item.img" />
          </div>
        </div>
      </div>
      <div
        v-if="customIndicator && res?.indicatorStyle !== 'none' && (res?.list?.length ?? 0) > 1"
        class="indicator"
        :class="'pos-' + (res?.indicatorPosition || 'center')"
      >
        <div
          v-for="(item, i) in res?.list"
          :key="i"
          class="dot"
          :class="[res?.indicatorStyle || 'round', { active: i === current }]"
          :style="i === current ? { background: indicatorColor } : {}"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";

defineOptions({ title: "导航栏" });

type BannerItem = { img?: string };
type BannerRes = {
  list?: BannerItem[];
  swiperStyle?: string;
  indicatorStyle?: string;
  indicatorPosition?: string;
  indicatorColorMode?: string;
  indicatorColor?: string;
  paddingTop?: number;
  paddingX?: number;
  paddingBottom?: number;
  pageGap?: number;
  borderRadius?: number;
  bgColor1?: string;
  bgColor2?: string;
  imgRadius?: number;
};

const props = defineProps<{ res?: BannerRes }>();

const current = ref(0);
const previewWidth = ref(0);
const cardPreview = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const customIndicator = computed(() => props.res?.indicatorStyle !== undefined);
const cardMode = computed(() => props.res?.swiperStyle === "card");
const indicatorColor = computed(() =>
  props.res?.indicatorColorMode === "custom" && props.res.indicatorColor
    ? props.res.indicatorColor
    : "#409eff"
);
const trackOffset = computed(
  () => previewWidth.value * 0.09 - current.value * previewWidth.value * 0.82
);
const wrapperStyle = computed(() => {
  const res = props.res || {};
  if (res.paddingTop === undefined) return {};
  const bg =
    !res.bgColor2 || res.bgColor1 === res.bgColor2
      ? res.bgColor1
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;
  return {
    padding: `${px(res.paddingTop)} ${px(res.paddingX)} ${px(res.paddingBottom)}`,
    background: bg,
    borderRadius: px(res.borderRadius),
    marginBottom: px(res.pageGap),
  };
});
const boxStyle = computed(() => {
  const res = props.res || {};
  if (res.imgRadius === undefined) return {};
  return { borderRadius: `${(Number(res.imgRadius) || 0) / 2}px` };
});

function onChange(index: number) {
  current.value = index;
}

function measure() {
  if (cardPreview.value) {
    previewWidth.value = cardPreview.value.offsetWidth;
  }
}

function startAuto() {
  stopAuto();
  if (!cardMode.value || !props.res?.list || props.res.list.length < 2) return;
  timer = setInterval(() => {
    current.value = (current.value + 1) % (props.res?.list?.length || 1);
  }, 5000);
}

function stopAuto() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(
  cardMode,
  (val: unknown) => {
    stopAuto();
    if (val) {
      measure();
      startAuto();
    }
  },
  { immediate: true, flush: "post" }
);

watch(
  () => props.res?.list?.length ?? 0,
  (len: number) => {
    if (current.value >= len) current.value = 0;
  }
);

onBeforeUnmount(stopAuto);
</script>

<style lang="scss" scoped>
@import "./tpl.scss";
.carousel,
.image-mode {
  height: 150px;
}
.banner-box {
  position: relative;
  overflow: hidden;
}
.slide-wrap {
  height: 100%;
  padding: 0 3px;
  box-sizing: border-box;
}
.image-mode {
  width: 100%;
  display: block;
  overflow: hidden;
}
.card-preview {
  overflow: hidden;
  height: 150px;
  display: flex;
  align-items: center;
}
.card-track {
  display: flex;
  align-items: center;
  transition: transform 0.5s ease;
  width: 100%;
}
.card-slide {
  flex: 0 0 82%;
  padding: 0 3px;
  box-sizing: border-box;
  transform: scale(0.9);
  transition: transform 0.4s ease;
  &.active {
    transform: scale(1);
  }
}
.card-img {
  width: 100%;
  height: 150px;
  display: block;
  overflow: hidden;
}
.indicator {
  position: absolute;
  bottom: 8px;
  display: flex;
  align-items: center;
  z-index: 2;
  &.pos-left {
    left: 12px;
  }
  &.pos-center {
    left: 50%;
    transform: translateX(-50%);
  }
  &.pos-right {
    right: 12px;
  }
  .dot {
    background: rgba(255, 255, 255, 0.7);
    transition: background 0.3s ease;
    &.round {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin: 0 3px;
    }
    &.line {
      width: 12px;
      height: 3px;
      border-radius: 2px;
      margin: 0 2px;
    }
  }
}
</style>

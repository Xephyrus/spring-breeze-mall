<template>
  <div
    class="tpl-carousel"
    :class="[isMini ? 'is-mini' : isCompact ? 'is-compact' : '']"
    :style="customStyle"
  >
    <div class="carousel-container">
      <transition name="carousel-fade" mode="out-in">
        <div :key="currentIdx" class="slide-view">
          <img
            :src="currentSlide.img"
            :alt="currentSlide.title || 'banner'"
            class="slide-img"
          />
        </div>
      </transition>

      <template v-if="options.showArrow !== false && slidesList.length > 1">
        <div class="arrow-btn prev-btn" @click.stop="prevSlide">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div class="arrow-btn next-btn" @click.stop="nextSlide">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </template>

      <div
        v-if="options.showIndicator !== false && slidesList.length > 1"
        class="carousel-indicators"
      >
        <span
          v-for="(_, idx) in slidesList"
          :key="idx"
          class="indicator-dot"
          :class="{ active: currentIdx === idx }"
          @click.stop="currentIdx = idx"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

type Slide = { title?: string; img?: string; url?: string };
type CarouselOptions = {
  list?: Slide[];
  banners?: Array<{ title?: string; image?: string; img?: string; url?: string; link?: string }>;
  autoPlay?: boolean;
  interval?: number;
  showArrow?: boolean;
  showIndicator?: boolean;
  fitMode?: string;
  aspectRatio?: string;
  height?: number;
};

const props = withDefaults(
  defineProps<{
    options?: CarouselOptions;
    componentStyle?: {
      widthRatio?: string;
      radius?: number[];
      backgroundColor?: string;
    };
    rowStyle?: { height?: number | string };
  }>(),
  {
    options: () => ({}),
    componentStyle: () => ({}),
    rowStyle: () => ({}),
  }
);

const currentIdx = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const isMini = computed(() => props.componentStyle?.widthRatio === "16.67%");
const isCompact = computed(() => props.componentStyle?.widthRatio === "33.33%");

const slidesList = computed<Slide[]>(() => {
  if (Array.isArray(props.options.list) && props.options.list.length > 0) {
    return props.options.list;
  }
  if (Array.isArray(props.options.banners) && props.options.banners.length > 0) {
    return props.options.banners.map((b) => ({
      title: b.title,
      img: b.image || b.img || b.url,
      url: b.url || b.link,
    }));
  }
  return [
    {
      title: "潮流数码",
      img: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_1.png",
      url: "/goodsList?category=1",
    },
    {
      title: "奢宠美妆",
      img: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_2.png",
      url: "/goodsList?category=2",
    },
    {
      title: "运动潮流",
      img: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_3.png",
      url: "/goodsList?category=3",
    },
    {
      title: "居家生活",
      img: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_4.png",
      url: "/goodsList?category=4",
    },
  ];
});

const currentSlide = computed(() => slidesList.value[currentIdx.value] || slidesList.value[0]);

const customStyle = computed(() => {
  const s = props.componentStyle || {};
  const fit = props.options.fitMode || "cover";
  const hasRowHeight = Boolean(props.rowStyle?.height && Number(props.rowStyle.height) > 0);
  const styleObj: Record<string, string> = {
    borderRadius:
      Array.isArray(s.radius) && s.radius.some((r) => r > 0)
        ? `${s.radius[0]}px ${s.radius[1]}px ${s.radius[2]}px ${s.radius[3]}px`
        : "8px",
    backgroundColor:
      s.backgroundColor && s.backgroundColor !== "transparent" ? s.backgroundColor : "#ffffff",
    "--carousel-fit": fit,
    height: "100%",
    minHeight: hasRowHeight ? "0" : "420px",
  };
  if (props.options.aspectRatio === "custom" && props.options.height) {
    styleObj.height = `${props.options.height}px`;
    styleObj.minHeight = `${props.options.height}px`;
  }
  return styleObj;
});

function prevSlide() {
  const len = slidesList.value.length;
  currentIdx.value = (currentIdx.value - 1 + len) % len;
  resetTimer();
}

function nextSlide() {
  const len = slidesList.value.length;
  currentIdx.value = (currentIdx.value + 1) % len;
  resetTimer();
}

function startTimer() {
  stopTimer();
  if (props.options.autoPlay !== false && slidesList.value.length > 1) {
    const interval = Number(props.options.interval) || 4000;
    timer = setInterval(() => {
      const len = slidesList.value.length;
      currentIdx.value = (currentIdx.value + 1) % len;
    }, interval);
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function resetTimer() {
  stopTimer();
  startTimer();
}

watch(
  () => [props.options.autoPlay, props.options.interval, slidesList.value.length] as const,
  () => {
    startTimer();
  }
);

onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<style lang="scss" scoped>
.tpl-carousel {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .carousel-container {
    width: 100%;
    height: 100%;
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .slide-view {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;

      .slide-img {
        width: 100%;
        height: 100%;
        object-fit: var(--carousel-fit, cover);
        display: block;
      }
    }

    .arrow-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.35);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
      &.prev-btn {
        left: 12px;
      }
      &.next-btn {
        right: 12px;
      }
    }

    .carousel-indicators {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      z-index: 2;

      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.55);
        cursor: pointer;
        &.active {
          background: #ffffff;
        }
      }
    }
  }

  &.is-compact .arrow-btn {
    width: 24px;
    height: 24px;
  }

  &.is-mini {
    .arrow-btn,
    .carousel-indicators {
      display: none;
    }
  }
}

.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.35s ease;
}
.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}
</style>

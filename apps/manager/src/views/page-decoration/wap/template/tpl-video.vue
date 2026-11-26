<template>
  <div class="layout" :style="wrapperStyle">
    <div class="video-shell" :style="boxStyle">
      <div
        class="video-ratio"
        :style="{ paddingBottom: aspectPadding + '%' }"
      >
        <div class="video-ratio-inner">
          <video
            v-if="item.videoUrl"
            class="video-media"
            :src="item.videoUrl"
            :poster="item.poster"
            muted
          />
          <template v-else>
            <img
              v-if="item.poster"
              class="video-media"
              :src="item.poster"
              alt=""
            />
            <div v-else class="video-placeholder">视频楼层</div>
          </template>
          <div class="play-icon">▶</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import type { CubeStyleRes } from "../../types";
import type { VideoItem } from "../video-style";
import {
  ensureVideoItem,
  getVideoWrapperStyle,
  getVideoBoxStyle,
  getAspectPadding,
} from "../video-style";

/** 视频模板 res：list 项在视频项基础上带 videoUrl/poster */
type VideoTemplateRes = CubeStyleRes & {
  list?: Array<VideoItem & { videoUrl?: string; poster?: string }>;
};

const props = defineProps<{ res: VideoTemplateRes }>();

const item = computed(() => {
  const data = props.res.list?.[0] ?? {};
  ensureVideoItem(data);
  return data;
});

// 画布 375px ≈ 750rpx，预览按一半像素呈现
const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;
/** 该字段是否由面板设置过（0 也算设置） */
const has = (v: unknown) => v !== undefined && v !== null && v !== "";

/**
 * 外层样式：**逐字段合并**，老数据（item.style）打底，面板设置过的字段覆盖。
 *
 * 早期用一个隐藏开关判断（`paddingTop !== undefined` → 整块走新样式），
 * 但面板并不会写 paddingTop —— 用户只调圆角时整块新样式都不生效，
 * 圆角/背景/边距全部"设置无效"。逐字段合并后，调哪项就哪项生效。
 */
const wrapperStyle = computed<CSSProperties>(() => {
  const res = props.res || {};
  const legacy = getVideoWrapperStyle(item.value);
  const legacyBox = getVideoBoxStyle(item.value);
  // 老数据的圆角记在 item.style.bgRadius 上（内层视频框），新面板记在 options 上
  const radius = has(res.borderRadius)
    ? px(res.borderRadius)
    : String(legacyBox.borderRadius ?? "0px");
  const background = !has(res.bgColor1)
    ? legacy.background
    : !has(res.bgColor2) || res.bgColor1 === res.bgColor2
      ? String(res.bgColor1)
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  const padding = [res.paddingTop, res.paddingX, res.paddingBottom].some(has)
    ? `${px(res.paddingTop)} ${px(res.paddingX)} ${px(res.paddingBottom)}`
    : legacy.padding;
  const style: CSSProperties = {
    ...legacy,
    padding,
    background,
    borderRadius: radius,
    overflow: Number.parseFloat(radius) > 0 ? "hidden" : "visible",
    boxSizing: "border-box",
  };
  // 页面间距只在面板设置过时才覆盖（老数据没有这个字段）
  if (has(res.pageGap)) style.marginBottom = px(res.pageGap);
  return style;
});

/** 视频本体（内层）：内容圆角，同样逐字段合并 */
const boxStyle = computed<CSSProperties>(() => {
  const legacy = getVideoBoxStyle(item.value);
  return {
    ...legacy,
    borderRadius: has(props.res?.imgRadius)
      ? px(props.res?.imgRadius)
      : legacy.borderRadius,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  };
});
const aspectPadding = computed(() => getAspectPadding(item.value.aspectRatio));
</script>
<style lang="scss" scoped>
.layout {
  padding: 0;
  margin: 0;
  background: transparent;
}

.video-shell {
  width: 100%;
}

.video-ratio {
  width: 100%;
  height: 0;
  position: relative;
}

.video-ratio-inner {
  position: absolute;
  inset: 0;
}

.video-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #000;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  background: #f5f5f5;
}

.play-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  line-height: 44px;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  font-size: 18px;
  pointer-events: none;
}
</style>

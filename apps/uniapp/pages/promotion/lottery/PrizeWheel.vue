<!-- 按概率绘制圆形转盘和固定指针；跨端使用uni Canvas，旋转角度由抽奖页控制。作者 Bulbasaur，2026-11-15。 -->
<template>
  <view class="prize-wheel">
    <canvas :id="canvasId" :canvas-id="canvasId" class="wheel-canvas" :style="{ height: `${canvasSize}px` }" />
  </view>
</template>
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onResize } from '@dcloudio/uni-app';
import { createWheelSegments, layoutRadialLabel } from './wheel';
const props = defineProps({ prizes: { type: Array, default: () => [] }, rotation: { type: Number, default: 0 } });
const instance = getCurrentInstance(), canvasId = `lottery-wheel-${instance.uid}`;
const canvasSize = ref(300), segments = computed(() => createWheelSegments(props.prizes));
let context, alive = true, drawing = false, queued = false;
const labelCache = new Map();

/** 读取组件实际宽度，统一H5、小程序与App的画布坐标，窗口变化时重新适配。 */
function measure() {
  if (!alive) return;
  uni.createSelectorQuery().in(instance.proxy).select('.wheel-canvas').boundingClientRect(async rect => {
    if (!alive || !rect?.width) return;
    canvasSize.value = Math.floor(rect.width);
    await nextTick();
    if (!alive) return;
    context = uni.createCanvasContext(canvasId, instance.proxy);
    paint();
  }).exec();
}

/** 按真实占比绘制扇区，名称沿半径排成最多两行，不显示比例或图例；极窄扇区通过奖品详情查看。 */
function paint() {
  if (!alive || !context) return;
  if (drawing) { queued = true; return; }
  drawing = true;
  const ctx = context, size = canvasSize.value, center = size / 2, radius = center - 8;
  ctx.clearRect(0, 0, size, size);
  ctx.save(); ctx.translate(center, center); ctx.rotate(props.rotation * Math.PI / 180);
  ctx.setLineWidth(1); ctx.setStrokeStyle('#fff9ec');
  for (const prize of segments.value) {
    const start = (prize.startAngle - 90) * Math.PI / 180, end = (prize.endAngle - 90) * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, start, end, false); ctx.closePath();
    ctx.setFillStyle(prize.color); ctx.fill(); ctx.stroke();
    const span = prize.endAngle - prize.startAngle;
    const key = JSON.stringify([prize.name, radius, span]);
    if (!labelCache.has(key)) labelCache.set(key, layoutRadialLabel(prize.name, radius, span, (text, fontSize) => {
      ctx.setFontSize(fontSize); return ctx.measureText(text).width;
    }));
    const label = labelCache.get(key);
    if (!label) continue;
    ctx.save(); ctx.rotate((prize.midAngle - 90) * Math.PI / 180);
    ctx.setFillStyle('#71321e'); ctx.setTextAlign('center'); ctx.setTextBaseline('middle'); ctx.setFontSize(label.fontSize);
    label.lines.forEach((line, index) => ctx.fillText(line, label.center, (index - (label.lines.length - 1) / 2) * label.lineHeight));
    ctx.restore();
  }
  ctx.restore();
  // 外圈、圆心和顶部指针保持固定，只有奖品扇区随角度旋转。
  ctx.beginPath(); ctx.arc(center, center, radius, 0, Math.PI * 2); ctx.setStrokeStyle('#b94028'); ctx.setLineWidth(7); ctx.stroke();
  ctx.beginPath(); ctx.arc(center, center, radius * 0.16, 0, Math.PI * 2); ctx.setFillStyle('#b94028'); ctx.fill();
  ctx.beginPath(); ctx.arc(center, center, radius * 0.10, 0, Math.PI * 2); ctx.setFillStyle('#ffda79'); ctx.fill();
  ctx.beginPath(); ctx.moveTo(center - 9, 1); ctx.lineTo(center + 9, 1); ctx.lineTo(center, 28); ctx.closePath(); ctx.setFillStyle('#9d2f1d'); ctx.fill();
  ctx.draw(false, () => { drawing = false; if (queued && alive) { queued = false; paint(); } });
}
watch([segments, () => props.rotation], paint, { deep: true });
onMounted(() => nextTick(measure));
onResize(() => nextTick(measure));
onBeforeUnmount(() => { alive = false; context = undefined; labelCache.clear(); });
</script>
<style scoped>
.wheel-canvas { display: block; width: 100%; }
</style>

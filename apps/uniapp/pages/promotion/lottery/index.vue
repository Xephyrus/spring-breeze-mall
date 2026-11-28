<!-- 独立抽奖活动页，展示按概率占比的大转盘、免费次数与本人流水；动画只展示服务端结果。作者 Bulbasaur，2026-11-14。 -->
<template>
  <view class="lottery-page">
    <view class="toolbar"><text :class="{ selected: mode === 'activities' }" @click="switchMode('activities')">每日抽奖</text><text :class="{ selected: mode === 'records' }" @click="switchMode('records')">抽奖记录</text></view>
    <view v-if="pending" class="pending"><text>上次抽奖结果待确认，请先查询结果。</text><button size="mini" :disabled="!!busy" @click="draw(null)">确认上次结果</button></view>
    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="failed" class="state" @click="load">加载失败，点击重试</view>
    <view v-else-if="!rows.length" class="state">{{ mode === 'activities' ? '暂无进行中的抽奖活动' : '暂无抽奖记录' }}</view>
    <view v-for="item in rows" :key="item.id" class="card">
      <template v-if="mode === 'activities'">
        <view class="activity-heading"><view class="title">{{ item.name }}</view><button class="prize-details" :disabled="!!busy" @click="showPrizeDetails(item)">奖品详情</button></view><view v-if="item.description && item.description !== item.name" class="description">{{ item.description }}</view>
        <view class="chance">每日免费{{ item.dailyLimit }}次 · 今日剩余{{ chances[item.id] == null ? '--' : chances[item.id] }}次</view>
        <view v-if="!loading && chances[item.id] == null" class="chance-retry" @click="load">次数加载失败，点击重试</view>
        <PrizeWheel :prizes="item.prizes" :rotation="rotations[item.id] || 0" />
        <button class="draw" :disabled="!!busy || !!pending || chances[item.id] == null || chances[item.id] <= 0" @click="draw(item)">{{ busy === item.id ? '抽奖中' : '免费抽奖' }}</button>
        <view class="time">{{ item.startTime }} 至 {{ item.endTime }}</view>
      </template>
      <template v-else><view class="title">{{ item.prizeName }}</view><view class="description">{{ item.activityName }}</view><view v-if="item.prizeType === 'POINTS'" class="chance">已发放{{ item.points }}积分</view><view v-if="item.prizeType === 'COUPON'" class="chance" @click="myCoupons">优惠券已到账，查看我的优惠券 ›</view><view class="time">{{ item.createTime }}</view></template>
    </view>
    <view v-if="total > 10 || pageNumber > 1" class="pager"><button size="mini" :disabled="loading || !!busy || pageNumber <= 1" @click="turn(-1)">上一页</button><text>{{ pageNumber }} / {{ Math.max(1, Math.ceil(total / 10)) }}</text><button size="mini" :disabled="loading || !!busy || pageNumber * 10 >= total" @click="turn(1)">下一页</button></view>
    <u-popup v-model:show="prizeDetailsVisible" mode="center" width="620rpx" border-radius="24" :safe-area-inset-bottom="false">
      <view class="prize-dialog">
        <view class="prize-dialog-title">奖品详情</view>
        <scroll-view scroll-y class="prize-list">
          <view v-for="(prize, index) in detailPrizes" :key="prize.id || index" class="prize-row">
            <text class="prize-number">{{ index + 1 }}.</text>
            <view class="prize-info"><text>{{ prize.name }}</text><text v-if="prize.type === 'POINTS'" class="prize-reward">{{ prize.points }}积分</text></view>
          </view>
          <view v-if="!detailPrizes.length" class="prize-row">暂无奖品</view>
        </scroll-view>
        <button class="prize-confirm" @click="prizeDetailsVisible = false">确定</button>
      </view>
    </u-popup>
  </view>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';
import storage from '@/utils/storage';
import uuid from '@/utils/uuid-modified';
import { listLottery, lotteryChances, drawLottery, lotteryRecords } from '@/api/lottery';
import PrizeWheel from './PrizeWheel.vue';
import { createWheelSegments, wheelLandingRotation } from './wheel';
const mode = ref('activities'), rows = ref([]), total = ref(0), pageNumber = ref(1), loading = ref(false), failed = ref(false);
const chances = ref<Record<string, any>>({}), busy = ref(''), pending = ref<any>(null), rotations = ref<Record<string, number>>({});
const prizeDetailsVisible = ref(false), detailPrizes = ref([]);
let version = 0, drawVersion = 0, alive = true, visible = true, timer, owner = '';
/** 当前身份用于隔离本地待确认请求及所有异步结果。 */
function account() { return String(storage.getUserInfo()?.id || ''); }
/** 会员级待确认请求键，跨页面重开仍可安全确认原结果。 */
function pendingKey(user) { return `lottery-pending:${user}`; }
/** 清理动画，离开页面后不再弹出结果。 */
function stopAnimation() { if (timer) { clearInterval(timer); clearTimeout(timer); } timer = undefined; }
/** 加载活动或记录，同时刷新每项次数，丢弃旧账号和旧筛选响应。 */
async function load() {
  const current = ++version, user = account(); owner = user;
  pending.value = user ? uni.getStorageSync(pendingKey(user)) || null : null;
  loading.value = true; failed.value = false;
  try {
    const res = await (mode.value === 'activities' ? listLottery : lotteryRecords)({ pageNumber: pageNumber.value, pageSize: 10 });
    if (!alive || !visible || current !== version || user !== account()) return;
    if (!res.data?.success) throw new Error('加载失败');
    rows.value = res.data.result.records || []; total.value = res.data.result.total || 0; chances.value = {};
    if (mode.value === 'activities' && user) {
      await Promise.all(rows.value.map(async item => {
        try { const res = await lotteryChances(item.id); if (alive && visible && current === version && user === account() && res.data?.success) chances.value[item.id] = res.data.result.remaining; }
        catch { /* 次数查询失败时禁用抽奖，刷新可重试。 */ }
      }));
    }
  } catch { if (alive && current === version && user === account()) { rows.value = []; total.value = 0; failed.value = true; } }
  finally { if (alive && current === version) loading.value = false; }
}
/** 切换列表，先清空旧记录再查询。 */
function switchMode(value) { if (busy.value || mode.value === value) return; mode.value = value; rows.value = []; pageNumber.value = 1; load(); }
/** 显式分页兼容嵌套滚动页面。 */
function turn(step) { pageNumber.value += step; rows.value = []; load(); }
/** 查看已到账优惠券，使用已有页面。 */
function myCoupons() { uni.navigateTo({ url: '/pages/cart/coupon/myCoupon' }); }
/** 使用独立列表逐项展示完整奖品名称，避免原生提示框在部分端忽略换行。 */
function showPrizeDetails(item) {
  if (busy.value) return;
  detailPrizes.value = item.prizes || [];
  prizeDetailsVisible.value = true;
}
/** 成功结果展示，奖励由服务端提交，动画不参与判奖。 */
function showResult(result, user) {
  stopAnimation(); busy.value = '';
  if (!alive || !visible || user !== account()) return;
  uni.showModal({ title: result.prizeType === 'THANKS' ? '谢谢参与' : '恭喜中奖', content: result.prizeType === 'POINTS' ? `${result.prizeName}，${result.points}积分已到账。` : result.prizeType === 'COUPON' ? `${result.prizeName}，优惠券已到账。` : '本次未中奖，下次再试试好运。', showCancel: false });
  load();
}
/** 依据后端最终奖项停在对应占比扇区中心；减速动画不判奖，账号或页面变化立即停止。 */
function animate(item, result, user) {
  if (!item?.prizes?.length) return showResult(result, user);
  const from = rotations.value[item.id] || 0;
  const end = wheelLandingRotation(createWheelSegments(item.prizes), result.prizeId, from);
  if (end == null) return showResult(result, user);
  const started = Date.now(), duration = 4200;
  timer = setInterval(() => {
    if (!alive || !visible || user !== account()) { stopAnimation(); busy.value = ''; return; }
    const progress = Math.min(1, (Date.now() - started) / duration);
    rotations.value[item.id] = from + (end - from) * (1 - Math.pow(1 - progress, 4));
    if (progress === 1) {
      clearInterval(timer); rotations.value[item.id] = end % 360;
      timer = setTimeout(() => showResult(result, user), 250);
    }
  }, 32);
}
/** 先持久化请求号再提交；结果不明时禁止新抽，先确认旧结果，包括活动下架或结束后。 */
async function draw(item) {
  if (busy.value) return;
  const user = account(), operation = ++drawVersion;
  if (!user) { uni.showToast({ title: '请先登录', icon: 'none' }); return; }
  let request = uni.getStorageSync(pendingKey(user));
  if (!request) {
    if (!item) return;
    request = { activityId: item.id, requestId: (uuid as any).v4() }; uni.setStorageSync(pendingKey(user), request);
  }
  pending.value = request; busy.value = request.activityId;
  try {
    const res = await drawLottery(request.activityId, request.requestId);
    if (!alive || !visible || operation !== drawVersion || user !== account()) return;
    if (res.data?.success) {
      uni.removeStorageSync(pendingKey(user)); pending.value = null;
      animate(item?.id === request.activityId ? item : null, res.data.result, user);
    } else {
      if (res.data?.success === false) { uni.removeStorageSync(pendingKey(user)); pending.value = null; }
      busy.value = ''; await load();
    }
  } catch {
    if (alive && visible && operation === drawVersion && user === account()) { busy.value = ''; uni.showToast({ title: '结果待确认，请重试确认', icon: 'none' }); }
  }
}
onMounted(() => { if (!version) load(); });
onShow(() => { visible = true; if (owner !== account()) { drawVersion++; rows.value = []; chances.value = {}; rotations.value = {}; pageNumber.value = 1; busy.value = ''; stopAnimation(); } load(); });
onHide(() => { visible = false; prizeDetailsVisible.value = false; version++; drawVersion++; stopAnimation(); busy.value = ''; });
onBeforeUnmount(() => { alive = false; version++; drawVersion++; stopAnimation(); });
</script>
<style scoped lang="scss">
.prize-dialog { padding: 32rpx; background: #fff; }
.prize-dialog-title { margin-bottom: 24rpx; text-align: center; font-size: 32rpx; font-weight: bold; color: #71321e; }
.prize-list { max-height: 55vh; }
.prize-row { display: flex; align-items: flex-start; gap: 16rpx; padding: 22rpx 0; border-bottom: 1rpx solid #f3e9e1; font-size: 28rpx; line-height: 1.6; color: #71321e; }
.prize-row:last-child { border-bottom: 0; }
.prize-number { flex-shrink: 0; }
.prize-info { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.prize-reward { margin-left: 12rpx; color: #a08a79; font-size: 24rpx; }
.prize-confirm { margin-top: 24rpx; border: 0; border-radius: 40rpx; background: #b94028; color: #fff; font-size: 28rpx; }
.prize-confirm::after { border: none; }
.lottery-page { min-height: calc(100vh - var(--window-top, 0px)); background: #fff5ec; padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box; }.toolbar { display: flex; background: #fff; font-size: 28rpx; }.toolbar > text { flex: 1; padding: 26rpx 12rpx; text-align: center; }.selected { color: #c74326; font-weight: bold; }.state { padding: 24rpx 28rpx; font-size: 24rpx; color: #936e59; line-height: 1.8; }.pending { padding: 24rpx; background: #fff0c9; font-size: 25rpx; }.pending button { margin-top: 12rpx; }.card { margin: 24rpx; padding: 28rpx; background: #fff; border-radius: 24rpx; }.activity-heading { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }.activity-heading .title { flex: 1; min-width: 0; }.prize-details { border: 0; border-radius: 0; flex-shrink: 0; padding: 8rpx 0 8rpx 12rpx; margin: 0; background: transparent; color: #b94028; font-size: 24rpx; line-height: 40rpx; }.prize-details::after { border: none; }.title { font-size: 34rpx; font-weight: bold; color: #71321e; }.description { margin-top: 14rpx; white-space: pre-wrap; font-size: 26rpx; color: #7b6b60; line-height: 1.7; }.chance { margin: 22rpx 0; color: #c74326; font-size: 26rpx; }.chance-retry { margin-bottom: 16rpx; color: #936e59; font-size: 24rpx; }.draw { width: 100%; margin: 12rpx 0 0; padding: 0 12rpx; height: 80rpx; line-height: 80rpx; border-radius: 40rpx; background: #b94028; color: #fff; font-weight: bold; font-size: 30rpx; }.draw[disabled] { background: #cd9688; color: #fff; }.draw::after { border: none; }.time { font-size: 22rpx; color: #a08e80; line-height: 1.8; margin-top: 20rpx; }.pager { display: flex; align-items: center; justify-content: space-around; padding: 20rpx 0 60rpx; font-size: 24rpx; }

</style>

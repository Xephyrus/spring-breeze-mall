<!-- 积分商城兑券列表，兼容H5、小程序和App，采用移动端标准滚动加载分页。作者 Bulbasaur，2026-11-14。 -->
<template>
  <!-- #ifdef H5 -->
  <view class="coupon-list-h5">
    <view v-if="failed && !rows.length" class="state" @click="refresh">加载失败，点击重试</view>
    <view v-else-if="loadStatus !== 'loading' && !rows.length" class="state">暂无可兑换优惠券</view>
    <view v-for="item in rows" :key="item.id" class="coupon-card">
      <view class="name">{{ item.couponName || item.name }}</view>
      <view class="value">{{ item.couponType === 'DISCOUNT' ? `${item.couponDiscount}折` : `¥${item.price}` }}</view>
      <view class="detail">{{ item.consumeThreshold ? `满${item.consumeThreshold}元可用` : '无门槛使用' }}</view>
      <view class="detail">适用范围：{{ scopeText(item.scopeType) }}</view>
      <view class="detail">{{ item.rangeDayType === 'DYNAMICTIME' ? `领取当日起${item.effectiveDays}天有效` : `券有效至${item.couponEndTime || ''}` }}</view>
      <view v-if="item.description" class="detail">{{ item.description }}</view>
      <view class="detail">剩余{{ item.remaining }}张 · 每人限兑{{ item.memberLimit }}次</view>
      <button class="exchange" :disabled="!!busy || item.remaining === 0" :loading="busy === item.id" @click="exchange(item)">{{ item.points }}积分兑换</button>
    </view>
    <uni-load-more v-if="rows.length || loadStatus === 'loading'" :status="loadStatus" @clickLoadMore="loadMore" />
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <scroll-view class="coupon-scroll" scroll-y enable-back-to-top @scrolltolower="loadMore">
    <view v-if="failed && !rows.length" class="state" @click="refresh">加载失败，点击重试</view>
    <view v-else-if="loadStatus !== 'loading' && !rows.length" class="state">暂无可兑换优惠券</view>
    <view v-for="item in rows" :key="item.id" class="coupon-card">
      <view class="name">{{ item.couponName || item.name }}</view>
      <view class="value">{{ item.couponType === 'DISCOUNT' ? `${item.couponDiscount}折` : `¥${item.price}` }}</view>
      <view class="detail">{{ item.consumeThreshold ? `满${item.consumeThreshold}元可用` : '无门槛使用' }}</view>
      <view class="detail">适用范围：{{ scopeText(item.scopeType) }}</view>
      <view class="detail">{{ item.rangeDayType === 'DYNAMICTIME' ? `领取当日起${item.effectiveDays}天有效` : `券有效至${item.couponEndTime || ''}` }}</view>
      <view v-if="item.description" class="detail">{{ item.description }}</view>
      <view class="detail">剩余{{ item.remaining }}张 · 每人限兑{{ item.memberLimit }}次</view>
      <button class="exchange" :disabled="!!busy || item.remaining === 0" :loading="busy === item.id" @click="exchange(item)">{{ item.points }}积分兑换</button>
    </view>
    <uni-load-more v-if="rows.length || loadStatus === 'loading'" :status="loadStatus" @clickLoadMore="loadMore" />
  </scroll-view>
  <!-- #endif -->
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import storage from '@/utils/storage';
import uuid from '@/utils/uuid-modified';
import { listPointsCoupons, exchangePointsCoupon } from '@/api/points-coupon';

const emit = defineEmits(['redeemed']);
const rows = ref([]), pageNumber = ref(1), loadStatus = ref('more'), failed = ref(false), busy = ref('');
const pageSize = 10;
let version = 0, alive = true, owner = '';

/** 用稳定会员ID隔离请求号和异步响应。 */
function account() { return String(storage.getUserInfo()?.id || ''); }

/** 加载指定页，支持首页刷新与上拉追加。 */
async function fetchPage(reset) {
  const current = ++version, user = account();
  owner = user;
  if (reset) {
    pageNumber.value = 1;
    loadStatus.value = 'more';
  }
  loadStatus.value = 'loading';
  failed.value = false;
  try {
    const res = await listPointsCoupons({ pageNumber: pageNumber.value, pageSize });
    if (!alive || current !== version || user !== account()) return;
    if (!res.data?.success) throw new Error('加载失败');
    const records = res.data.result?.records || [];
    const total = Number(res.data.result?.total || 0);
    rows.value = reset ? records : rows.value.concat(records);
    loadStatus.value = rows.value.length >= total || records.length < pageSize ? 'noMore' : 'more';
  } catch {
    if (alive && current === version && user === account()) {
      failed.value = true;
      loadStatus.value = 'more';
    }
  }
}

/** 刷新第一页。 */
function refresh() {
  return fetchPage(true);
}

/** 滚动到底部加载下一页。 */
function loadMore() {
  if (loadStatus.value !== 'more') return;
  pageNumber.value += 1;
  fetchPage(false);
}

/** 展示券模板适用范围，实际可用性沿用服务端结算校验。 */
function scopeText(type) { return ({ ALL: '全品类', PORTION_GOODS: '指定商品', PORTION_GOODS_CATEGORY: '指定商品分类', PORTION_SHOP_CATEGORY: '指定店铺分类' })[type] || '以优惠券规则为准'; }

/** 确认消费积分，网络结果不明确时持久保留请求号供安全重试。 */
async function exchange(item) {
  if (busy.value) return;
  const user = account();
  if (!user) return uni.showToast({ title: '请先登录后兑换', icon: 'none' });
  busy.value = item.id;
  const key = `points-coupon:${user}:${item.id}`;
  try {
    const confirmation = await new Promise(resolve => uni.showModal({ title: '积分兑券', content: `确认消耗${item.points}积分兑换“${item.couponName}”一张？兑换成功后不支持主动退兑。`, success: resolve, fail: () => resolve({ confirm: false }) }));
    if (!confirmation.confirm || user !== account()) return;
    let pending = uni.getStorageSync(key);
    if (!pending) { pending = { requestId: uuid.v4(), points: item.points }; uni.setStorageSync(key, pending); }
    const res = await exchangePointsCoupon(item.id, pending);
    if (!alive || user !== account()) return;
    if (res.data?.success) {
      uni.removeStorageSync(key);
      uni.showToast({ title: '兑换成功', icon: 'success' });
      emit('redeemed');
      await refresh();
    } else if (res.data?.success === false) {
      uni.removeStorageSync(key);
      await refresh();
    }
  } catch { /* 网络失败保留请求号，下一次重试先由服务端返回原兑换结果。 */ }
  finally { if (alive) busy.value = ''; }
}

onMounted(() => { if (!version) refresh(); });
onShow(() => {
  if (owner && owner !== account()) {
    rows.value = [];
    refresh();
  }
});
onBeforeUnmount(() => { alive = false; version++; });
defineExpose({ refresh, loadMore });
</script>
<style scoped lang="scss">
.coupon-scroll {
  height: 100%;
  background: #f6f7f9;
  padding: 8rpx 0 24rpx;
  box-sizing: border-box;
}
.coupon-list-h5 {
  min-height: 55vh;
  background: #f6f7f9;
  padding: 8rpx 0 24rpx;
  box-sizing: border-box;
}
.state {
  padding: 60rpx 28rpx;
  font-size: 26rpx;
  color: #888;
  text-align: center;
}
.coupon-card {
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx;
  padding: 28rpx;
}
.name { font-size: 30rpx; font-weight: bold; }
.value { font-size: 48rpx; color: #e74646; margin: 16rpx 0; }
.detail { color: #777; font-size: 25rpx; margin-top: 12rpx; }
.exchange { background: #e74646; color: #fff; margin-top: 24rpx; font-size: 28rpx; }
</style>

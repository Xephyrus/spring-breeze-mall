<!--
  移动端商品详情页-促销信息摘要栏（支持满减、满折、满赠及三级阶梯文案）
  @author Bulbasaur
  @since 2026-11-09
-->
<template>
	<view>
		<view v-for="(promotionItem, promotionIndex) in promotion" :key="promotionIndex" class="promotion_row" @click="shutMask(1)">
			<view v-if="res != null" v-for="(item, index) in Object.keys(res)" :key="index">
				<div class="promotion_col" v-if="item.split('-')[0] == promotionItem.value && item.split('-')[0] == 'FULL_DISCOUNT'">
					<!-- 满减 / 满折 / 满赠 / 多件优惠 -->
					<div class="flex">
						<view class="deg_tag">{{ resolveFullDiscountTag(res[item]) }}</view>
						<div class="text proText">{{ formatFullDiscountSummary(res[item]) }}</div>
					</div>
				</div>
                <div class="promotion_col" v-if="item.split('-')[0] == promotionItem.value && item.split('-')[0] == 'SINGLE_REDUCTION'">
                  <view class="flex"><view class="deg_tag">单品立减</view><view class="text proText">每件立减{{ formatNumber(res[item].fullMinus) }}元</view></view>
                </div>
				<div class="promotion_col" v-if="item.split('-')[0] == promotionItem.value && item.split('-')[0] == 'PINTUAN'">
					<!-- 拼团 -->
					<div class="flex">
						<view class="deg_tag">{{ promotionItem.title }}</view>
						<div class="text proText">{{ res[item].promotionName }}</div>
					</div>
				</div>
				<div class="promotion_col" v-if="item.split('-')[0] == promotionItem.value && item.split('-')[0] == 'POINTS_GOODS'">
					<!-- 积分活动 -->
					<div class="flex">
						<view class="deg_tag">{{ promotionItem.title }}</view>
						<div class="text proText">{{ res[item].promotionName }}</div>
					</div>
				</div>
				<div class="promotion_col" v-if="item.split('-')[0] == promotionItem.value && item.split('-')[0] == 'KANJIA'">
					<!-- 砍价活动 -->
					<div class="flex">
						<view class="deg_tag">{{ promotionItem.title }}</view>
						<div class="text proText"></div>
					</div>
				</div>
				<div class="promotion_col" v-if="item.split('-')[0] == promotionItem.value && item.split('-')[0] == 'SECKILL'">
					<!-- 限时抢购 -->
					<div class="flex">
						<view class="deg_tag">{{ promotionItem.title }}</view>
						<div class="text proText">{{ res[item].promotionName }}</div>
					</div>
				</div>
			</view>

			<view class="promotion_row">
				<view>
					<div class="promotion_col coupon" v-if="couponList && promotionIndex == 1">
						<!-- 优惠券 -->
						<div><view class="deg_tag">优惠券</view></div>
					</div>
				</view>
			</view>
		</view>

		<view v-if="res != null && Object.keys(res).length == 0">暂无促销信息</view>
	</view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import promotion from './promotion_type'

const props = defineProps<{
  res?: any
}>()

const emit = defineEmits<{
  shutMasks: [val: number]
}>()

const couponList = ref('')

watch(
  () => props.res,
  (res) => {
    couponList.value = ''
    if (res && res.length != 0 && res != null) {
      Object.keys(res).forEach((item) => {
        const key = item.split('-')[0]
        res[item].__key = key

        if (item.split('-')[0] == 'COUPON') {
          couponList.value = 'COUPON'
        }
      })
    }
  },
  { immediate: true }
)

function resolveFullDiscountTag(act: any): string {
  if (!act) return '满减'
  if (act.activityType === 'FULL_COUNT_MINUS') return '多件优惠'
  if (act.activityType === 'FULL_RATE' || act.fullRateFlag) return '满折'
  if (act.activityType === 'FULL_GIFT' || (!act.fullMinusFlag && act.giftFlag)) return '满赠'
  return '满减'
}

function formatNumber(val: any): string {
  if (val == null || val === '') return ''
  const num = Number(val)
  if (isNaN(num)) return String(val)
  return String(parseFloat(num.toFixed(2)))
}

function formatFullDiscountSummary(act: any): string {
  if (!act) return ''
  let rules: any[] = []
  if (act.rulesJson) {
    try {
      rules = typeof act.rulesJson === 'string' ? JSON.parse(act.rulesJson) : act.rulesJson
    } catch (e) {
      rules = []
    }
  }
  if (Array.isArray(rules) && rules.length) {
    return rules
      .map((r: any) => {
        const minus = formatNumber(r.fullMinus)
        const money = formatNumber(r.fullMoney)
        if (act.activityType === 'FULL_COUNT_MINUS') return `满${r.fullNum}件减${minus}元`
        if (act.activityType === 'FULL_RATE' || act.fullRateFlag) {
          return `满${money}元打${r.fullRate}折`
        }
        if (act.activityType === 'FULL_GIFT' || act.giftFlag) {
          return `满${money}元享好礼`
        }
        return `满${money}元减${minus}元`
      })
      .join('；')
  }
  if (act.title) {
    return act.title.replace(/\.0+(?=[元折件])/g, '')
  }
  return `满${formatNumber(act.fullMoney)}元，立享优惠`
}

function shutMask(val: number) {
  emit('shutMasks', val)
}
</script>

<style lang="scss" scoped>
.deg_tag {
  flex-shrink: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: $price-color;
  padding: 2rpx 10rpx;
  border: 2rpx solid $price-color;
  border-radius: 4rpx;
  font-size: 22rpx;
  line-height: 1.4;
  height: fit-content;
  margin-top: 4rpx;
}

.promotion_col {
  padding: 0 !important;
  margin: 10rpx 0;
}
.promotion_row {
}
.flex {
  display: flex;
  align-items: flex-start;
}
.proText {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  font-family: PingFang SC, PingFang SC-Regular;
  font-weight: 400;
  text-align: left;
  color: #333333;
  margin-left: 16rpx;
  line-height: 1.5;
}
::v-deep .u-mode-light-error {
  border: none;
}
.coupon {
  display: flex;
}
</style>

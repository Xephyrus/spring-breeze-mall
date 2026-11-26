<!--
  移动端商品详情页-促销详情弹窗内容（支持满减、满折、满赠及三级阶梯与赠品明细展示）
  @author Bulbasaur
  @since 2026-11-09
-->
<template>
  <view class="wrapper" v-if="res">
    <view v-for="prom in promotionKeys" :key="prom">
      <view v-if="getPromType(prom) == 'FULL_DISCOUNT'">
        <view class="res_prom_item">
          <view class="deg_tag">{{ resolveFullDiscountTag(res[prom]) }}</view>
          <view class="pro-text">
            <view
              v-for="(tierText, idx) in formatFullDiscountTiers(res[prom])"
              :key="idx"
              class="tier-line"
            >
              {{ tierText }}
            </view>
          </view>
        </view>
      </view>

      <view v-if="getPromType(prom) == 'SINGLE_REDUCTION'" class="res_prom_item">
        <view class="deg_tag">单品立减</view>
        <text class="pro-text">每件立减{{ formatNumber(res[prom].fullMinus) }}元，可与满足条件的满额/多件优惠及优惠券叠加</text>
      </view>
      <view v-if="getPromType(prom) == 'PINTUAN'">
        <view class="res_prom_item" v-if="res[prom].requiredNum">
          <view class="deg_tag">拼团</view>
          <text class="pro-text">
            {{ res[prom].requiredNum }}人拼团 限购
            <text class="price">{{ res[prom].limitNum }}件</text>
          </text>
        </view>
      </view>

      <view v-if="getPromType(prom) == 'SECKILL'">
        <view class="res_prom_item">
          <view class="deg_tag">限时抢购</view>
          <text class="pro-text">限时抢购</text>
        </view>
      </view>

      <view v-if="getPromType(prom) == 'POINTS_GOODS'">
        <view class="res_prom_item">
          <view class="deg_tag">积分活动</view>
          <text class="pro-text">
            当前商品参与积分活动。
            <text @tap="handClickToJoinPromotion(prom)" class="href">点击此处参与活动</text>
          </text>
        </view>
      </view>

      <view v-if="getPromType(prom) == 'KANJIA'">
        <view class="res_prom_item">
          <view class="deg_tag">砍价活动</view>
          <text class="pro-text">
            当前商品参与砍价活动。
            <text @tap="handClickToJoinPromotion(prom)" class="href">点击此处参与活动</text>
          </text>
        </view>
      </view>
    </view>
    <view v-if="!promotionKeys.length">暂无促销活动</view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  res?: any
}>()

const promotionKeys = computed(() => {
  if (!props.res || typeof props.res !== 'object') return []
  return Object.keys(props.res).filter((key) =>
    ['SINGLE_REDUCTION', 'FULL_DISCOUNT', 'PINTUAN', 'SECKILL', 'POINTS_GOODS', 'KANJIA'].includes(getPromType(key))
  )
})

function getPromType(key: string) {
  return key.split('-')[0]
}

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

function formatFullDiscountTiers(act: any): string[] {
  if (!act) return []
  let rules: any[] = Array.isArray(act.ruleList) ? act.ruleList : []
  if (!rules.length && act.rulesJson) {
    try {
      rules = JSON.parse(act.rulesJson) || []
    } catch (e) {
      rules = []
    }
  }
  const tag = resolveFullDiscountTag(act)
  if (rules.length) {
    return rules.map((r: any, i: number) => {
      const prefix = rules.length > 1 ? `阶梯${i + 1}：` : ''
      const minus = formatNumber(r.fullMinus)
      const money = formatNumber(r.fullMoney)
      if (tag === '多件优惠') return `${prefix}满${r.fullNum}件，立减现金${minus}元`
      if (tag === '满折') {
        return `${prefix}满${money}元，立享${r.fullRate}折优惠`
      }
      if (tag === '满赠') {
        const gifts = Array.isArray(r.giftItems)
          ? r.giftItems
              .map((g: any) => `${g.goodsName || '赠品'}×${g.num || 1}`)
              .join('、')
          : '赠品'
        return `${prefix}满${money}元，赠送[${gifts}]`
      }
      return `${prefix}满${money}元，立减现金${minus}元`
    })
  }
  if (act.fullRateFlag && act.fullRate) {
    return [`满${formatNumber(act.fullMoney)}元，立享${act.fullRate}折优惠`]
  }
  if (act.giftFlag) {
    return [`满${formatNumber(act.fullMoney)}元，赠送商品`]
  }
  return [`满${formatNumber(act.fullMoney)}元，立减现金${formatNumber(act.fullMinus) || 0}元`]
}

function handClickToJoinPromotion(val: string) {
  const type = getPromType(val)
  const promotionMap: Record<string, string> = {
    POINTS_GOODS: `/pages/promotion/point/detail?id=${props.res[val].id}`,
    KANJIA: `/pages/promotion/bargain/detail?id=${props.res[val].id}`,
  }
  const url = promotionMap[type]
  if (url) {
    uni.navigateTo({ url })
  }
}
</script>

<style lang="scss" scoped>
.deg_tag {
  flex-shrink: 0;
  color: $price-color;
  padding: 4rpx 12rpx;
  border: 2rpx solid $price-color;
  border-radius: 6rpx;
  font-size: 22rpx;
  line-height: 1.4;
  white-space: nowrap;
}

.pro-text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  line-height: 1.6;
  color: #333333;
}

.tier-line {
  margin-bottom: 6rpx;
}

.wrapper {
  display: block;
}

.res_prom_item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin: 20rpx 0;
}

.price {
  color: $price-color;
}

.href {
  color: $main-color;
}
</style>

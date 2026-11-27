<template>
  <view :style="themeStyle" class="payment-success">
    <view class="result-card">
      <u-icon :name="view.status === 'PAID' ? 'checkmark-circle-fill' : 'info-circle'" size="42" :color="view.status === 'PAID' ? '#23a877' : '#909399'" />
      <text class="result-title">{{ resultTitle }}</text>
      <text v-if="view.status === 'PAID'" class="pay-money">¥{{ unitPrice(Number(view.amount || 0)) }}</text>
      <text class="result-hint">{{ view.status === 'PAID' ? paymentTypeFilter(view.paymentMethod) : error || '支付结果以订单记录为准，请勿重复支付' }}</text>
      <view class="pay-actions"><button class="main-button" @click="checkOrder">查看{{ orderType === 'RECHARGE' ? '余额' : '订单' }}</button><button class="home-button" @click="goHome">回到首页</button></view>
      <button v-if="view.status === 'PENDING'" :key="loading ? 'confirming' : 'ready'" class="refresh-button" :disabled="loading" @click="refresh">{{ loading ? '正在确认' : '刷新支付结果' }}</button>
    </view>
    <view v-if="view.status === 'PAID' && view.promotion && !imageFailed" class="promotion-card" @click="openPromotion">
      <image :src="view.promotion.image" mode="widthFix" class="promotion-image" @error="imageFailed = true" />
    </view>
    <view v-if="view.status === 'PAID' && view.goods?.length" class="recommend-section"><text class="recommend-title">{{ view.goodsTitle || '为你推荐' }}</text><GoodsList :res="view.goods" :tab-bar-gap="false" /></view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import GoodsList from '@/components/m-goods-list/list.vue'
import { useStore } from '@/store'
import storage from '@/utils/storage'
import { unitPrice } from '@/utils/filters'
import { getThemeStyle } from '@/utils/theme'
import { getPaymentSuccessPage } from '@/api/payment-success'
import { navigatePaymentPromotion } from '@/utils/payment-success'
import { prefetchMpMessageTemplates, subscribePayMessageThen } from '@/js_sdk/lili-pay/wx-pay.js'

const store=useStore()
const themeStyle=computed(()=>getThemeStyle(store.state.theme))
const emptyView=()=>({status:'PENDING',amount:0,paymentMethod:'',goodsTitle:'',goods:[] as any[],promotion:null as any})
const view=ref(emptyView()),sn=ref(''),orderType=ref(''),orderPromotionType=ref(''),error=ref(''),loading=ref(false),imageFailed=ref(false),openingPromotion=ref(false)
let visible=false,version=0,pollTimer:ReturnType<typeof setTimeout> | undefined
let clientType='H5'
// #ifdef MP-WEIXIN
clientType='WECHAT_MP'
// #endif
// #ifdef APP-PLUS
clientType='APP'
// #endif
const resultTitle=computed(()=>view.value.status==='PAID' ? '支付成功' : view.value.status==='CLOSED' ? '订单已关闭' : '支付结果确认中')

/** 返回当前登录身份；异步请求只允许更新发起请求时的账号。 */
function account(){return storage.getHasLogin() ? String(storage.getUserInfo()?.id || '') : ''}
/** 停止轮询并使离页前的异步响应失效。 */
function stop(){version++;if(pollTimer)clearTimeout(pollTimer);pollTimer=undefined;loading.value=false;openingPromotion.value=false}
/** 清理旧账号与旧订单视图，再核对服务端支付结果。 */
function refresh(){stop();view.value=emptyView();imageFailed.value=false;error.value='';if(!sn.value || !['ORDER','TRADE','RECHARGE'].includes(orderType.value)){error.value='请前往订单查看实际支付结果';return;}if(!account()){error.value='请登录支付时使用的账号后查看订单';return;}load(version,account(),0)}
/** 查询支付与推广，最多在1、2、3秒后重试待确认状态，不再次发起支付。 */
async function load(current:number,owner:string,attempt:number){
  loading.value=true
  try{
    const response=await getPaymentSuccessPage({sn:sn.value,orderType:orderType.value,clientType})
    if(!visible || current!==version || owner!==account())return
    if(!response.data?.success)throw new Error('query failed')
    view.value=response.data.result || emptyView()
    if(view.value.status==='PENDING' && attempt<3){pollTimer=setTimeout(()=>load(current,owner,attempt+1),(attempt+1)*1000)}
  }catch{if(visible && current===version && owner===account())error.value='暂时无法确认支付结果，请查看订单或稍后刷新'}
  finally{if(current===version)loading.value=false}
}
/** 再次校验推广仍有效且目标未变，才执行内部路由跳转。 */
async function openPromotion(){
  if(openingPromotion.value || !view.value.promotion)return
  const current=version,owner=account(),previous=JSON.stringify(view.value.promotion)
  openingPromotion.value=true
  try{const response=await getPaymentSuccessPage({sn:sn.value,orderType:orderType.value,clientType});if(!visible || current!==version || owner!==account())return;const promotion=response.data?.success ? response.data.result?.promotion : null;if(!promotion || JSON.stringify(promotion)!==previous){view.value.promotion=null;uni.showToast({title:'活动已更新或结束，请刷新查看',icon:'none'});return;}if(!navigatePaymentPromotion(promotion,{fail:()=>uni.showToast({title:'内容暂不可用',icon:'none'})}))uni.showToast({title:'内容暂不可用',icon:'none'});}catch{if(current===version)uni.showToast({title:'暂时无法打开，请稍后重试',icon:'none'})}finally{if(current===version)openingPromotion.value=false}
}
/** 支付方式仅展示服务端确认后的记录。 */
function paymentTypeFilter(value:string){return ({WECHAT:'微信支付',ALIPAY:'支付宝支付',WALLET:'余额支付'} as Record<string,string>)[value] || '支付已完成'}
/** 保留现有订单消息订阅，再进入订单或余额查询。 */
function checkOrder(){const go=()=>{if(orderType.value==='RECHARGE')uni.navigateTo({url:'/pages/mine/deposit/operation'});else uni.navigateTo({url:'/pages/order/myOrder?status=0'})};
  // #ifdef MP-WEIXIN
  if(orderType.value!=='RECHARGE'){subscribePayMessageThen(go,{orderPromotionType:orderPromotionType.value});return}
  // #endif
  go()
}
/** 返回商城首页，沿用微信消息订阅流程。 */
function goHome(){const go=()=>uni.switchTab({url:'/pages/tabbar/home/index'});
  // #ifdef MP-WEIXIN
  if(orderType.value!=='RECHARGE'){subscribePayMessageThen(go,{orderPromotionType:orderPromotionType.value});return}
  // #endif
  go()
}
onLoad(options=>{sn.value=options?.sn || '';orderType.value=options?.orderType || '';orderPromotionType.value=options?.orderPromotionType || '';
  // #ifdef MP-WEIXIN
  prefetchMpMessageTemplates()
  // #endif
})
onShow(()=>{visible=true;refresh()})
onHide(()=>{visible=false;stop();view.value=emptyView()})
onUnload(()=>{visible=false;stop()})
watch(()=>[store.state.hasLogin,store.state.userInfo?.id],()=>{stop();view.value=emptyView();if(visible)refresh()})
</script>
<style scoped lang="scss">
/* 两个操作按钮统一尺寸与对齐，清除微信原生伪元素边框，首页按钮使用明确的描边样式。 */
.pay-actions button{display:flex;align-items:center;justify-content:center;min-width:176rpx;height:72rpx;line-height:normal;box-sizing:border-box;border:1rpx solid transparent}
.pay-actions button::after{border:0}
.pay-actions .home-button{color:#606266;background:#fff;border-color:#dcdfe6}
.payment-success{min-height:100vh;padding:24rpx 20rpx calc(40rpx + env(safe-area-inset-bottom));background:#f7f8fa;box-sizing:border-box}.result-card{background:#fff;border-radius:20rpx;padding:44rpx 28rpx;display:flex;flex-direction:column;align-items:center;gap:20rpx}.result-title{font-size:36rpx;font-weight:600;color:#303133}.pay-money{font-size:54rpx;font-weight:600;color:#303133}.result-hint{font-size:24rpx;color:#909399;text-align:center}.pay-actions{display:flex;justify-content:center;gap:24rpx;margin-top:12rpx;flex-wrap:wrap}.pay-actions button,.refresh-button{font-size:26rpx;padding:0 32rpx;border-radius:40rpx;margin:0}.pay-actions .main-button{color:#fff;background:$main-color}.refresh-button{background:transparent;color:$main-color}.promotion-card{margin-top:24rpx;background:#fff;border-radius:20rpx;overflow:hidden}.promotion-image{display:block;width:100%;height:auto}.recommend-title{display:block;text-align:center;font-size:32rpx;font-weight:600;margin:36rpx 0 24rpx;color:#303133}.recommend-section{margin-top:24rpx}
</style>

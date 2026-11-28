<template>
  <view :style="themeStyle" class="wrapper">
    <u-navbar
      class="my-title"
      title-size="32"
      :title="toUser.name"
      :fixed="true"
      :placeholder="true"
      :border="false"
      :auto-back="true"
    ></u-navbar>
    <!-- 空盒子用来防止消息过少时 拉起键盘会遮盖消息 -->
    <view :animation="anData" style="height:0;">
    </view>
    <!-- 消息体 -->
    <!-- 用来获取消息体高度 -->
    <view id="msgList">
      <!-- 消息 -->
      <view class="flex-column-start" v-if="msgList.length" v-for="(item, index) in msgList" :key="index">
        <view class="flex-row-start column-time">
          <!--  <view v-show="compareTime(index, item.createTime)" class="flex-row-start date-text"
            v-text="beautifyTime(item.createTime)">
          </view> -->
        </view>
        <!-- 用户消息 -->
        <view v-if="item.my" class="msg-row msg-row-self">
          <view class="msg-col msg-col-self">
            <view class="user-name">{{ user.nickName }}</view>
            <view v-if="item.messageType === 'MESSAGE'" class="bubble bubble-self">
              <text style="word-break: break-all;"
                v-if="!emojistwo.includes(item.text)">{{ item.text }}</text>
              <view v-else v-html="textReplaceEmoji(item.text)"></view>
            </view>
            <image v-else-if="item.messageType === 'PICTURE'" class="msg-image" :src="item.text" mode="widthFix"
              @click="previewImage(item.text)"></image>
            <view v-else-if="item.messageType == 'GOODS'" class="msg-card" @click="jumpGoodDesc(item)">
              <view class="goods-card">
                <view class="image-box">
                  <image class="image" :src="JSON.parse(item.text)['thumbnail']" mode="aspectFill"></image>
                </view>
                <view class="goods-desc">
                  <view class="goods-desc-name">
                    <text class="goods-card-goods-name">{{ JSON.parse(item.text)['goodsName'] }}</text>
                  </view>
                  <view class="goods-desc-rice">￥{{ unitPrice(JSON.parse(item.text)['price']) }}</view>
                </view>
              </view>
            </view>
            <view v-else-if="item.messageType == 'ORDER'" class="msg-card" @click="linkTosOrders(item.text)">
              <view class="order-sn">
                <div class="wes order-sn-title">订单号：{{ JSON.parse(item.text)['sn'] }}</div>
                <div class='order-item flex' v-if="JSON.parse(item.text).orderItems.length" v-for='(order,orderIndex) in JSON.parse(item.text).orderItems' :key="orderIndex">
                  <u-image mode="aspectFill" width='112rpx' height='112rpx' border-radius="12" :src="order.image" />
                  <view class="name-or-time">
                    <div class="wes-2 order-goods-name">{{ order.name }}</div>
                    <div class="main-color goods-desc-rice">{{ unitPrice(order.goodsPrice, "￥") }}</div>
                  </view>
                </div>
                <view class="order-list">
                  <view class="order-time">
                    <text>{{ JSON.parse(item.text)['paymentTime'] }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view class="msg-avatar">
            <u-avatar size="38" :src="user.face" :text="user.face ? '' : user.name" bg-color="#E5E7EB"></u-avatar>
          </view>
        </view>
        <!-- 接收人消息 -->
        <view v-else class="msg-row msg-row-other">
          <view class="msg-avatar">
            <u-avatar size="38" :src="toUser.face" :text="toUser.face ? '' : toUser.name" bg-color="#E5E7EB"></u-avatar>
          </view>
          <view class="msg-col msg-col-other">
            <view class="other-name">{{ toUser.name }}</view>
            <view v-if="item.messageType === 'MESSAGE'" class="bubble bubble-other">
              <text style="word-break: break-all;"
                v-if="!emojistwo.includes(item.text)">{{ item.text }}</text>
              <view v-else v-html="textReplaceEmoji(item.text)"></view>
            </view>
            <image v-else-if="item.messageType === 'PICTURE'" class="msg-image" :src="item.text" mode="widthFix"
              @click="previewImage(item.text)"></image>
            <view v-else-if="item.messageType === 'GOODS'" class="msg-card" @click="jumpGoodDesc(item)">
              <view class="goods-card">
                <view class="image-box">
                  <image class="image" :src="JSON.parse(item.text)['thumbnail']" mode="aspectFill"></image>
                </view>
                <view class="goods-desc">
                  <view class="goods-desc-name">
                    <text class="goods-card-goods-name">{{ JSON.parse(item.text)['goodsName'] }}</text>
                  </view>
                  <view class="goods-desc-rice">¥{{ JSON.parse(item.text)['price'] }}</view>
                </view>
              </view>
            </view>
            <view v-else-if="item.messageType === 'ORDER'" class="msg-card" @click="linkTosOrders(item.text)">
              <view class="order-sn">
                <text class="order-sn-title">订单号：{{ JSON.parse(item.text)['sn'] }}</text>
                <view class="order-list">
                  <image class="order-thumb" :src="JSON.parse(item.text)['groupImages']" mode="aspectFill" />
                  <view class="name-or-time">
                    <text class="order-goods-name">{{ JSON.parse(item.text)['groupName'] }}</text>
                    <view class="order-time">
                      <text>{{ JSON.parse(item.text)['paymentTime'] }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <!-- 防止消息底部被遮 -->
      <view v-if="showHide && !localImGoodsId && showHideModel" class="flex-row-start margin-left margin-top"
        style="height: 120rpx;">
      </view>
      <!-- 如果没有聊天记录，定位到底部 -->
      <view
        :style="{ position:'fixed' , bottom:(inputHeight+66)+'px' , width:  '100%' }">
        <view class="cart-message" v-if="showHide && !localImGoodsId && showHideModel">
          <view class="goods-card float-goods-card">
            <view class="image-box" @click="jumpGoodDesc(item)">
              <image class="image" :src="goodListData.thumbnail" mode="aspectFill"></image>
            </view>
            <view class="goods-desc" @click="jumpGoodDesc(item)">
              <view class="goods-desc-name">
                <text class="goods-card-goods-name">{{ goodListData.goodsName }}</text>
              </view>
              <view class="goods-desc-rice">￥{{ unitPrice(goodListData.price) }}</view>
            </view>
            <view class="float-goods-actions">
              <view class="cancel" @click="cancelModel">
                <u-icon name="close" size="24" color="#999999"></u-icon>
              </view>
              <view class="send-goods" @click="sendGoodsMessage">发送商品</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 防止消息底部被遮 -->
      <view style="height: 140rpx;"></view>
    </view>
    <!-- 底部导航栏 -->
    <view :style="{position: 'fixed', bottom:inputHeight+'px'}" class="bottom-dh" :animation="animationData">
      <view class="bottom-dh-char">
        <!-- vue无法使用软键盘"发送" -->

        <!-- #ifndef MP-WEIXIN -->
         <div v-if="!isShow" @click="navigateToBottom" class="dh-input dh-input-placeholder">
          用一句简短的话描述您的问题
         </div>
         <input v-show="isShow" ref="inputRef" :focus="isShow" @focus="inputBindFocus" @blur="eventHandle" :adjust-position="false" v-model="msg" class="dh-input" type="text" @confirm="sendMessage"
         confirm-type="send" placeholder="用一句简短的话描述您的问题" />
         <!-- #endif  -->

         <!-- #ifdef MP-WEIXIN -->
         <input ref="inputRef" @focus="inputBindFocus" @blur="eventHandle" :adjust-position="false" v-model="msg" class="dh-input" type="text" @confirm="sendMessage"
         confirm-type="send" placeholder="用一句简短的话描述您的问题" />
         <!-- #endif -->

        <view class="im-image-btn" @click="chooseAndSendImage">
          <u-icon name="photo" size="44" color="#555555"></u-icon>
        </view>
        <view @click="sendMessage" class="send">
          发送
        </view>
      </view>
    </view>
    <div id="bottom"></div>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick, getCurrentInstance, computed } from 'vue'
import {
  onLoad,
  onShow,
  onUnload,
  onPullDownRefresh,
  onPageScroll,
} from '@dcloudio/uni-app'
import {
  getTalkMessage as fetchTalkMessageApi,
  getTalkByUser,
  jumpObtain,
  uploadImImage,
} from '@/api/im.js'
import SocketService from '@/utils/socket_service'
import storage from '@/utils/storage'
import { beautifyTime, unitPrice } from '@/utils/filters'
import config from '@/config/config'
import { textReplaceEmoji, emojistwo } from '@/utils/emojis'
import { useStore } from '@/store'
import { getThemeStyle } from '@/utils/theme'
const store = useStore()
const themeStyle = computed(() => getThemeStyle(store.state.theme))

// rpx和px的比率
let l: number
// 可用窗口高度
let wh: number
// 顶部空盒子的高度
let mgUpHeight: number

const { proxy } = getCurrentInstance()!

const socketOpen = ref(false)
let socketTask: UniApp.SocketTask | null = null
let isUnloading = false
const showHideModel = ref<string | undefined>(undefined)
const localImGoodsId = ref('')
const showHide = ref(true)
const anData = ref<Record<string, any>>({})
const animationData = ref<Record<string, any>>({})
const msgList = ref<any[]>([])
const oldHeight = ref(0)
const params = ref({
  talkId: '',
  pageSize: 10,
  pageNumber: 1,
})
const msg = ref('')
const go = ref(0)
const user = ref<Record<string, any>>({})
const toUser = ref<Record<string, any>>({})
const scrollHeight = ref<string | number>(0)
const ws = new SocketService()
const resolve = ref<Record<string, any>>({})
const goodListData = ref<Record<string, any>>({})
// 模板中 jumpGoodDesc(item) 引用的 item 不在当前作用域（历史遗留），
// 保留原行为：点击时取到 undefined，交由 handler 自行处理；此处显式声明以通过类型检查。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const item: any = undefined
const reconnectCount = ref(0)
const inputHeight = ref(0)
const isShow = ref(false)
const uploadingImage = ref(false)

onLoad((options: Record<string, string | undefined> = {}) => {
  showHideModel.value = options.goodsid
  // #ifdef H5
  localImGoodsId.value = uni.getStorageSync('imGoodId')
  // #endif
  resolve.value = options
  if (resolve.value.goodsid) {
    commodityDetails()
  }

  const query = uni.getSystemInfoSync()
  l = query.screenWidth / 750
  wh = query.windowHeight
  scrollHeight.value = query.windowHeight - 44 + 'px'
  user.value = storage.getUserInfo()
  toUser.value = storage.getTalkToUser()

  if (options.talkId) {
    params.value.talkId = options.talkId
    fetchTalkMessages()
  } else {
    getTalk(options.userId!)
  }

  socket()
})

// 仅关闭当前页面持有的 SocketTask，避免与开发模式日志回显 socket 冲突。
function safeCloseSocket() {
  socketOpen.value = false
  if (!socketTask) return
  const task = socketTask
  socketTask = null
  task.close({ fail: () => {} })
}

// 切回页面时若连接已断开（如系统后台回收），自动重连；不放在 onHide 关闭，避免选择/预览图片触发断开。
onShow(() => {
  isUnloading = false
  if (!socketOpen.value && params.value.talkId) {
    socket()
  }
})

onUnload(() => {
  isUnloading = true
  // #ifdef H5
  uni.setStorageSync('imGoodId', '')
  // #endif
  safeCloseSocket()
})

onPullDownRefresh(() => {
  params.value.pageNumber = params.value.pageNumber + 1
  fetchTalkMessages()
  setTimeout(() => {
    uni.stopPullDownRefresh()
  }, 1000)
})

onPageScroll(() => {
  // #ifdef APP-PLUS
  uni.hideKeyboard()
  isShow.value = false
  // #endif
})

function navigateToBottom() {
  // #ifdef H5
  isShow.value = true
  ;(proxy as any).$refs.inputRef?.focus()
  // #endif

  // #ifdef APP-PLUS
  nextTick(() => {
    uni.pageScrollTo({
      scrollTop: 5000000,
      duration: 50,
      success: () => {
        setTimeout(() => {
          isShow.value = true
        }, 200)
      },
      fail: () => {},
      complete: () => {},
    })
  })
  // #endif
}

function eventHandle() {
  inputHeight.value = 0
  isShow.value = false
}

function inputBindFocus(e: any) {
  if (e.detail.height) {
    // #ifdef APP-PLUS
    if (uni.getSystemInfoSync().platform == 'ios') {
      inputHeight.value = e.detail.height - 40
    } else {
      inputHeight.value = e.detail.height
    }
    // #endif

    // #ifndef APP-PLUS
    inputHeight.value = e.detail.height
    // #endif
  }
}

function sendMessage() {
  if (msg.value == '') {
    return 0
  }
  if (!socketOpen.value || !socketTask) {
    return
  }
  const text = msg.value
  const payload = {
    operation_type: 'MESSAGE',
    to: toUser.value.userId,
    from: user.value.id,
    message_type: 'MESSAGE',
    context: text,
    talk_id: params.value.talkId,
  }
  socketTask.send({
    data: JSON.stringify(payload),
    success: () => {
      msgList.value.push({
        text,
        my: true,
        messageType: 'MESSAGE',
      })
      msgGo('down')
      msg.value = ''
    },
    fail: () => {
      socketOpen.value = false
      uni.showToast({ title: '连接已断开，正在重连', icon: 'none' })
      socket()
    },
  })
}

function previewImage(url: string) {
  if (!url) return
  const urls = msgList.value
    .filter((item) => item.messageType === 'PICTURE' && item.text)
    .map((item) => item.text)
  uni.previewImage({
    current: url,
    urls: urls.length ? urls : [url],
  })
}

function chooseAndSendImage() {
  if (uploadingImage.value) return
  if (!params.value.talkId) {
    uni.showToast({ title: '会话尚未建立，请稍后重试', icon: 'none' })
    return
  }
  if (!socketOpen.value || !socketTask) {
    uni.showToast({ title: '连接尚未就绪，请稍后重试', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: async (chooseRes) => {
      const tempFilePath = chooseRes.tempFilePaths?.[0]
      const tempFile = (chooseRes.tempFiles as any)?.[0]
      if (!tempFilePath) return
      if (tempFile?.size && tempFile.size > 10 * 1024 * 1024) {
        uni.showToast({ title: '图片不能大于10MB', icon: 'none' })
        return
      }
      uploadingImage.value = true
      uni.showLoading({ title: '上传中...', mask: true })
      try {
        const uploadRes: any = await uploadImImage(params.value.talkId, tempFilePath)
        const data = typeof uploadRes?.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes?.data
        if (!data?.success || !data?.result) {
          uni.showToast({ title: data?.message || '图片上传失败', icon: 'none' })
          return
        }
        const imageUrl = data.result
        const payload = {
          operation_type: 'MESSAGE',
          to: toUser.value.userId,
          from: user.value.id,
          message_type: 'PICTURE',
          context: imageUrl,
          talk_id: params.value.talkId,
        }
        if (!socketTask) {
          uni.showToast({ title: '连接已断开，正在重连', icon: 'none' })
          socket()
          return
        }
        socketTask.send({
          data: JSON.stringify(payload),
          success: () => {
            msgList.value.push({
              text: imageUrl,
              my: true,
              messageType: 'PICTURE',
            })
            msgGo('down')
          },
          fail: () => {
            socketOpen.value = false
            uni.showToast({ title: '连接已断开，正在重连', icon: 'none' })
            socket()
          },
        })
      } catch (e) {
        uni.showToast({ title: '图片上传失败，请重试', icon: 'none' })
      } finally {
        uni.hideLoading()
        uploadingImage.value = false
      }
    },
  })
}

function sendGoodsMessage() {
  const payload = {
    operation_type: 'MESSAGE',
    to: toUser.value.userId,
    from: user.value.id,
    message_type: 'GOODS',
    context: goodListData.value,
    talk_id: params.value.talkId,
  }
  if (!socketTask) return
  const data = JSON.stringify(payload)
  socketTask.send({
    data: data,
  })
  msgList.value.push({
    text: JSON.stringify(goodListData.value),
    my: true,
    messageType: 'GOODS',
  })
  showHide.value = false
  // #ifdef H5
  uni.setStorageSync('imGoodId', 1111111)
  // #endif
  nextTick(() => {
    uni.pageScrollTo({
      scrollTop: 2000000,
      duration: 300,
    })
  })
}

function socket() {
  safeCloseSocket()
  try {
    const url = config.baseWsUrl + '/' + storage.getAccessToken()
    const task = uni.connectSocket({
      url: url,
      complete: () => {},
    })
    socketTask = task
    task.onOpen(function () {
      if (socketTask !== task) return
      socketOpen.value = true
      reconnectCount.value = 0
    })
    task.onError(function () {
      if (socketTask !== task) return
      socketOpen.value = false
      if (reconnectCount.value < 3 && !isUnloading) {
        reconnectCount.value++
        setTimeout(() => {
          if (!isUnloading && !socketOpen.value) {
            socket()
          }
        }, 2000)
      } else {
        safeCloseSocket()
      }
    })
    task.onMessage(function (res) {
      if (socketTask !== task) return
      const data = JSON.parse(res.data as string)
      console.log(data.result)
      if (data.messageResultType == 'MESSAGE') {
        msgList.value.push(data.result)
        console.log(msgList.value)
      } else if (data.messageResultType == 'SYSTEM_TIPS') {
        uni.showToast({
          title: data.result?.message || '消息发送失败',
          icon: 'none',
        })
      }
      console.log(data)
      msgGo()
    })
    task.onClose((res) => {
      if (socketTask !== task) return
      socketTask = null
      socketOpen.value = false
      if (!isUnloading && res.code != null && res.code != 1000) {
        socket()
      }
    })
  } catch (e) {
    safeCloseSocket()
  }
}

function linkTosOrders(val: string) {
  const order = JSON.parse(val)
  uni.navigateTo({
    url: '/pages/order/orderDetail?sn=' + order.sn,
  })
}

function jumpGoodDesc(item: any) {
  const info = JSON.parse(item.text)
  uni.navigateTo({
    url: `/pages/product/goods?id=${info.id}&goodsId=${info.goodsId}`,
  })
}

function cancelModel() {
  showHide.value = false
}

function commodityDetails() {
  jumpObtain(resolve.value.skuid, resolve.value.goodsid).then((res) => {
    goodListData.value = res.data.result.data
  })
}

function messageBoxMove(x: number, t: number) {
  const animation = uni.createAnimation({
    duration: t,
    timingFunction: 'linear',
  })
  animation.height(x).step()
  anData.value = animation.export()
}

function msgGo(type?: string) {
  const query = uni.createSelectorQuery()
  setTimeout(() => {
    query
      .select('#msgList')
      .boundingClientRect((data: any) => {
        if (type == 'up') {
          go.value = data.height - oldHeight.value
        } else if (type == 'down') {
          go.value = data.height - wh + 120
        }
        const moveY = wh - data.height
        if (moveY - mgUpHeight < 0) {
          if (moveY < 0) {
            messageBoxMove(0, 200)
          } else {
            messageBoxMove(moveY, 200)
          }
        }
        uni.pageScrollTo({
          scrollTop: go.value,
          duration: 0,
        })
        oldHeight.value = data.height
      })
      .exec()
  }, 100)
}

async function fetchTalkMessages() {
  let type = ''
  await fetchTalkMessageApi(params.value).then((res) => {
    if (res.data.success) {
      if (msgList.value.length >= 10) {
        msgList.value.unshift(...res.data.result)
        type = 'up'
      } else {
        msgList.value.unshift(...res.data.result)
        type = 'down'
      }
      msgList.value.forEach((item) => {
        if (item.fromUser === user.value.id) {
          item.my = true
        }
      })
    }
  })
  console.log(msgList.value)
  msgGo(type)
}

function getTalk(userId: string) {
  getTalkByUser(userId).then((res) => {
    if (res.data.success) {
      toUser.value = res.data.result
      params.value.talkId = res.data.result.id
      fetchTalkMessages()
    }
  })
}
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100vh;
  background-color: #f5f6f8;
}

#msgList {
  padding: 16rpx 24rpx 24rpx;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  margin-top: 24rpx;
}

.msg-row-self {
  justify-content: flex-end;
}

.msg-row-other {
  justify-content: flex-start;
}

.msg-avatar {
  flex-shrink: 0;
}

.msg-col {
  display: flex;
  flex-direction: column;
  max-width: 500rpx;
}

.msg-col-self {
  align-items: flex-end;
  margin-right: 16rpx;
}

.msg-col-other {
  align-items: flex-start;
  margin-left: 16rpx;
}

.user-name,
.other-name {
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 8rpx;
  line-height: 1.2;
}

.bubble {
  padding: 18rpx 24rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-all;
}

.bubble-self {
  background: linear-gradient(135deg, #ff5b3c, $main-color);
  color: #ffffff;
  border-radius: 24rpx 6rpx 24rpx 24rpx;
  box-shadow: 0 4rpx 14rpx rgba(255, 60, 42, 0.16);
}

.bubble-other {
  background-color: #ffffff;
  color: #222222;
  border-radius: 6rpx 24rpx 24rpx 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}

.msg-image {
  max-width: 340rpx;
  min-width: 140rpx;
  border-radius: 16rpx;
  display: block;
  box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.06);
}

.msg-card {
  width: 460rpx;
  background-color: #ffffff;
  border-radius: 18rpx;
  padding: 18rpx;
  box-sizing: border-box;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.goods-card {
  display: flex;
  align-items: center;
  width: 100%;
  color: #222222;

  .image-box {
    width: 116rpx;
    height: 116rpx;
    flex-shrink: 0;
    border-radius: 12rpx;
    overflow: hidden;
    background-color: #f5f6f8;

    .image {
      width: 116rpx;
      height: 116rpx;
      display: block;
    }
  }

  .goods-desc {
    flex: 1;
    min-width: 0;
    margin-left: 16rpx;

    .goods-desc-name {
      margin-bottom: 10rpx;

      .goods-card-goods-name {
        color: #222222;
        font-size: 26rpx;
        font-weight: 600;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
  }
}

.goods-desc-rice {
  font-size: 26rpx;
  color: $main-color;
  font-weight: 700;
  margin-top: 6rpx;
}

.order-sn {
  width: 100%;
}

.order-sn-title {
  font-size: 22rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.order-item {
  margin: 10rpx 0;
  align-items: center;
}

.order-list {
  display: flex;
  align-items: center;
  color: #333333;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.order-thumb {
  width: 112rpx;
  height: 112rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.name-or-time {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
}

.order-goods-name {
  font-size: 25rpx;
  color: #222222;
  font-weight: 500;
  line-height: 1.4;
}

.order-time {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999999;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.cart-message {
  padding: 0 24rpx 12rpx;
  box-sizing: border-box;
}

.float-goods-card {
  background-color: #ffffff;
  border-radius: 18rpx;
  padding: 18rpx 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.float-goods-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  margin-left: 16rpx;
  flex-shrink: 0;
  height: 116rpx;
}

.cancel {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f4f5f7;
}

.send-goods {
  color: #ffffff;
  height: 52rpx;
  line-height: 52rpx;
  padding: 0 22rpx;
  background-color: $main-color;
  font-size: 24rpx;
  font-weight: 500;
  border-radius: 26rpx;
  text-align: center;
}

.column-time {
  justify-content: center;
}

.bottom-dh {
  position: fixed;
  flex-shrink: 0;
  width: 100%;
  left: 0;
  bottom: 0;
  z-index: 199;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #ffffff;
  border-top: 1rpx solid #ebedf0;
  box-sizing: border-box;
}

.bottom-dh-char {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}

.dh-input {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
  color: #222222;
  background-color: #f4f5f7;
  box-sizing: border-box;
}

.dh-input-placeholder {
  color: #999999;
}

.im-image-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: #f4f5f7;
  flex-shrink: 0;
}

.send {
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 32rpx;
  border-radius: 36rpx;
  background-color: $main-color;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
  flex-shrink: 0;
}

uni-page-head {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}
</style>

<style lang="scss" scoped>
@import "./index-app.scss";
</style>

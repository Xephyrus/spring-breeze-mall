import type { LiveRoom, PageResult } from '@spring-breeze/shared';
import axios from 'axios'
import { getStore } from '@/libs/storage'
import {
  deleteRequest,
  getRequest,
  managerUrl,
  postRequest,
  putRequest,
} from '@/libs/axios'
import type { ApiParams, Id } from '@/types/api';
import type { LiveCouponRow, LiveGoodsRow } from '@/types/vo/live';
import type { PageRows, VoRow } from '@/types/vo/common';

function deleteRequestWithBody(url: string, data: unknown) {
  const accessToken = getStore('accessToken')
  return axios({
    method: 'delete',
    baseURL: managerUrl,
    url,
    data,
    headers: {
      accessToken,
      'Content-Type': 'application/json',
    },
  }).then((res: { data: Blob }) => res.data)
}

// ========== 直播间 ==========
export const queryLivePage = (params: ApiParams) => getRequest<PageResult<LiveRoom>>('/live/room/page', params)

export const getLiveInfo = (id: Id) => getRequest<LiveRoom>(`/live/room/${id}`)

export const createLive = (params: ApiParams) => postRequest('/live/room', params, { 'Content-type': 'application/json' })

export const updateLive = (id: string | number, params?: Record<string, unknown>) => putRequest(`/live/room/${id}`, params, { 'Content-type': 'application/json' })

export const startLive = (id: Id) => putRequest(`/live/room/start/${id}`)

export const endLive = (id: Id) => putRequest(`/live/room/end/${id}`)

export const deleteLive = (id: Id) => deleteRequest<null>(`/live/room/${id}`)

// ========== 直播商品 ==========
export const getLiveGoodsList = (liveId: Id) => getRequest<LiveGoodsRow[]>(`/live/goods/list/${liveId}`)

export const saveBatchLiveGoods = (params: ApiParams) => postRequest<null>('/live/goods/batch', params, { 'Content-type': 'application/json' })

export const removeBatchLiveGoods = (ids: Id | Id[]) => deleteRequestWithBody('/live/goods/batch', ids)

export const setRecommendLiveGoods = (id: Id) => putRequest<null>(`/live/goods/recommend/${id}`)

export const cancelRecommendLiveGoods = (id: Id) => deleteRequest<null>(`/live/goods/recommend/${id}`)

export const setLiveGoodsSoldOut = (id: Id, soldOutFlag: boolean) => putRequest<null>(`/live/goods/sold-out/${id}`, { soldOutFlag })

export const getLiveGoodsPopularity = (id: Id, liveId: Id) =>
  getRequest<VoRow>(`/live/goods/popularity/${id}`, { liveId })

export const setLiveGoodsPopularity = (id: Id, liveId: Id, popularity: number) => putRequest<null>(`/live/goods/set/popularity/${id}`, { liveId, popularity })

// ========== 直播优惠券 ==========
export const getLiveCouponList = (liveId: Id) => getRequest<LiveCouponRow[]>(`/live/coupon/list/${liveId}`)

export const saveBatchLiveCoupon = (params: ApiParams) => postRequest<null>('/live/coupon/batch', params, { 'Content-type': 'application/json' })

export const removeBatchLiveCoupon = (ids: Id | Id[]) => deleteRequest<null>('/live/coupon/batch', { ids: (Array.isArray(ids) ? ids : [ids]).join(',') })

export const setRecommendLiveCoupon = (id: Id) => putRequest<null>(`/live/coupon/recommend/${id}`)

export const cancelRecommendLiveCoupon = (id: Id) => deleteRequest<null>(`/live/coupon/recommend/${id}`)

// ========== 直播消息 ==========
export const queryLiveMessagePage = (params: ApiParams) => getRequest<PageRows>('/live/message/page', params)

export const authLiveMessage = (params: ApiParams) => putRequest('/live/message/auth', params, { 'Content-type': 'application/json' })

export const postSendMessage = (params: ApiParams) => postRequest('/live/message/send', params, { 'Content-type': 'application/json' })

// ========== 直播用户 / 拉黑 ==========
export const liveUserList = (params: ApiParams) => getRequest<PageRows>('/live/user/page', params)

export const editLiveUserMute = (params: ApiParams) => putRequest('/live/user/edit/mute', params)

export const getLiveBlockPage = (params: ApiParams) => postRequest('/live/block/page', params, { 'Content-type': 'application/json' })

export const blockUser = (params: ApiParams) => postRequest('/live/block/user', params)

export const unblockUser = (params: ApiParams) => postRequest('/live/block/user/unblock', params)

// ========== 直播订单 ==========
export const queryLiveOrderPage = (params: ApiParams) => getRequest<PageRows>('/live/order/page', params)

export const getLiveOrderStatistics = (liveRoomId: Id) =>
  getRequest<VoRow>('/live/order/statistics', { liveRoomId })

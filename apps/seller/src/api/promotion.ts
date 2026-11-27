// 统一请求路径前缀在libs/axios.js中修改
import { getRequest, postRequest, postRequestWithNoForm, putRequest, deleteRequest } from '@/libs/axios';
import type { Query } from "@/types/api";


// 获取店铺直播间列表
export const getLiveList = (params: Query) => {
    return getRequest('/broadcast/studio', params)
}

// 是否推荐直播间
export const whetherStar = (params: Query) => {
    return putRequest(`/broadcast/studio/recommend/${params.id}`, params)
}

// 添加直播间
export const addLive = (params: Query) => {
    return postRequest('/broadcast/studio', params)
}

// 获取直播间详情
export const getLiveInfo = (studioId: string | number) => {
    return getRequest(`/broadcast/studio/studioInfo/${studioId}`)
}

// 修改直播间
export const editLive = (params: Query) => {
    return putRequest('/broadcast/studio/edit', params)
}

// 获取店铺直播商品
export const getLiveGoods = (params: Query) => {
    return getRequest('/broadcast/commodity', params)
}

// 店铺直播间删除商品
export const delLiveGoods = (goodsId: string | number) => {
    return deleteRequest(`/broadcast/commodity/${goodsId}`)
}

// 直播间删除商品
export const delRoomLiveGoods = (roomId: string | number, liveGoodsId: string | number) => {
    return deleteRequest(`/broadcast/studio/deleteInRoom/${roomId}/${liveGoodsId}`)
}

// 添加店铺直播商品
export const addLiveStoreGoods = (params: Query) => {
    return postRequestWithNoForm('/broadcast/commodity', params)
}

// 店铺直播间添加
export const addLiveGoods = (params: Query) => {

    return putRequest(`/broadcast/studio/push/${params.roomId}/${params.liveGoodsId}`, { goodsId: params.goodsId })
}

// 获取拼团列表
export const getPintuanList = (params: Query) => {
    return getRequest('/promotion/pintuan', params)
}
// 新建 拼团
export const savePintuan = (params: Query) => {
    return postRequest('/promotion/pintuan', params, { 'Content-type': 'application/json' })
}
// 编辑 拼团
export const editPintuan = (params: Query) => {
    return putRequest('/promotion/pintuan', params, { 'Content-type': 'application/json' })
}
// 手动开启拼团活动
export const editPintuanStatus = (pintuanId: string | number, params: Query) => {
    return putRequest(`/promotion/pintuan/status/${pintuanId}`, params)
}

// 删除拼团活动
export const deletePintuan = (pintuanId: string | number) => {
    return deleteRequest(`/promotion/pintuan/${pintuanId}`)
}

// 根据id获取拼团信息
export const getPintuanDetail = (id: string | number) => {
    return getRequest(`/promotion/pintuan/${id}`)
}

// 获取拼团商品列表
export const getPintuanGoodsList = (params: Query) => {
    return getRequest(`/promotion/pintuan/goods/${params.pintuanId}`, params)
}

// 新增优惠券
export const saveShopCoupon = (params: Query) => {
    return postRequest('/promotion/coupon', params, { 'Content-type': 'application/json' })
}

// 修改优惠券
export const editShopCoupon = (params: Query) => {
    return putRequest('/promotion/coupon', params, { 'Content-type': 'application/json' })
}

// 获取优惠券列表
export const getShopCouponList = (params: Query) => {
    return getRequest('/promotion/coupon', params)
}

//  更新优惠券状态
export const updateCouponStatus = (params: Query) => {
    return putRequest(`/promotion/coupon/status`, params)
}

//  作废优惠券
export const deleteShopCoupon = (ids: Query) => {
    return deleteRequest(`/promotion/coupon/${ids}`)
}
//  上架优惠券
export const upShopCoupon = (ids: Query, params: Query) => {
    return postRequest(`/promotion/coupon/up/${ids}`, params)
}
//  获取单个优惠券
export const getShopCoupon = (id: string | number) => {
    return getRequest(`/promotion/coupon/${id}`)
}

// 获取优惠券领取详情
export const getMemberReceiveCouponList = (id: string | number) => {
    return getRequest(`/promotion/memberCoupon/getByPage/${id}`)
}
//  作废会员优惠券
export const deleteMemberReceiveCoupon = (ids: Query, params: Query) => {
    return deleteRequest(`/promotion/memberCoupon/delByIds/${ids}`, params)
}

// 限时秒杀活动列表
export const seckillList = (params: Query) => {
    return getRequest(`/promotion/seckill`, params)
}

// 限时秒杀活动商品
export const seckillGoodsList = (params: Query) => {
    return getRequest(`/promotion/seckill/apply`, params)
}

// 添加限时抢购 商品
export const setSeckillGoods = (params: Query) => {
    return postRequest(`/promotion/seckill/apply/${params.seckillId}`, params.applyVos, { 'Content-type': 'application/json' })
}

// 添加限时抢购 商品
export const removeSeckillGoods = (seckillId: string | number, ids: Query) => {
    return deleteRequest(`/promotion/seckill/apply/${seckillId}/${ids}`)
}

// 限时秒杀活动详情
export const seckillDetail = (seckillId: string | number) => {
    return getRequest(`/promotion/seckill/${seckillId}`)
}

// 删除秒杀活动
export const delSeckill = (id: string | number) => {
    return deleteRequest(`/promotion/seckill/${id}`)
}

// 关闭秒杀活动
export const updateSeckillStatus = (id: string | number, params: Query) => {
    return putRequest(`/promotion/seckill/status/${id}`, params)
}

// 删除秒杀商品
export const delSeckillGoods = (params: Query) => {
    return deleteRequest(`/promotion/seckill/apply/${params.seckillId}/${params.id}`);
};
// 满减满赠活动列表
export const getFullDiscountList = (params: Query) => {
    return getRequest(`/promotion/fullDiscount`, params)
}

// 新增满减活动
export const newFullDiscount = (params: Query) => {
    return postRequest(`/promotion/fullDiscount`, params, { 'Content-type': 'application/json' })
}

// 编辑满减活动
export const editFullDiscount = (params: Query) => {
    return putRequest(`/promotion/fullDiscount`, params, { 'Content-type': 'application/json' })
}

// 通过id获取满减活动
export const getFullDiscountById = (id: string | number) => {
    return getRequest(`/promotion/fullDiscount/${id}`)
}

// 删除满减活动
export const delFullDiscount = (id: string | number) => {
    return deleteRequest(`/promotion/fullDiscount/${id}`)
}
// 开启、关闭满减活动
export const updateFullDiscount = (id: string | number, params: Query) => {
    return putRequest(`/promotion/fullDiscount/status/${id}`, params)
}

// 获取优惠券领取记录
export const getCouponReceiveList = (params: Query) => {
    return getRequest("/promotion/coupon/received", params);
};



// 兼容平台优惠券命名（商家端实际调用店铺优惠券接口）
export const getPlatformCouponList = getShopCouponList
export const savePlatformCoupon = saveShopCoupon
export const editPlatformCoupon = editShopCoupon
export const getPlatformCoupon = getShopCoupon
export const deletePlatformCoupon = deleteShopCoupon
export const updatePlatformCouponStatus = updateCouponStatus

// 统一请求路径前缀在libs/axios.js中修改
import type { Goods, PageResult, GoodsSku } from '@spring-breeze/shared';
import { getRequest, postRequest, putRequest, deleteRequest} from '@/libs/axios';
import type { Id } from '@/types/api';
import type { BrandItem } from '@/types/vo/misc';
import type { PageRows, VoRow } from '@/types/vo/common';
import type { GoodsGroupInfo, GoodsNumVO, GoodsParameterRow, GoodsParamsDTO, OrderOverviewVO } from '@/types/vo/goods';

export const cancelGoodsMarketSchedule = (goodsId: string | number, status: string | number) => {
    return deleteRequest<null>(`/goods/goods/schedule/market/${goodsId}`, { status });
};

//  获取商品品牌分页列表
export const getManagerBrandPage = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/goods/brand/getByPage', params)
}

// 批量删除
export const delBrand = (ids: string | number) => {
  return deleteRequest<null>(`/goods/brand/delByIds/${ids}`)
}


//  添加
export const addBrand = (params?: Record<string, unknown>) => {
    return postRequest<null>('/goods/brand', params)
}
// 修改品牌设置
export const updateBrand = (params?: Record<string, unknown>) => {
    return putRequest<null>(`/goods/brand/${params!.id}`!, params)
}
// 禁用品牌
export const disableBrand = (id: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/goods/brand/disable/${id}`, params)
}
//根据分类id获取关联品牌
export const getCategoryBrandListData = (category_id: string | number, params?: Record<string, unknown>) => {
    return getRequest<VoRow[]>(`/goods/categoryBrand/${category_id}`, params)
}
//保存获取关联品牌
export const saveCategoryBrand = (category_id: string | number, params?: Record<string, unknown>) => {
    return postRequest<null>(`/goods/categoryBrand/${category_id}`, params)
}
// 根据品牌id获取关联分类
export const getBrandCategoryListData = (brand_id: string | number, params?: Record<string, unknown>) => {
    return getRequest<VoRow[]>(`/goods/categoryBrand/${brand_id}`, params)
}
// 保存品牌分类关联
export const saveBrandCategory = (brand_id: Id, categoryIds: Id | Id[]) => {
    return postRequest<null>(`/goods/categoryBrand/${brand_id}`, categoryIds, {
      "Content-Type": "application/json"
    })
}

export const getParameterCategoryListData = (parameter_id: string | number, params?: Record<string, unknown>) => {
    return getRequest<GoodsParameterRow[]>(`/goods/parameters/category/${parameter_id}`, params)
}

export const saveParameterCategory = (parameter_id: Id, categoryIds: Id | Id[]) => {
    return postRequest<null>(`/goods/parameters/category/${parameter_id}`, categoryIds, {
      "Content-Type": "application/json"
    })
}

//获取所有可用品牌
export const getBrandListData = (params?: Record<string, unknown>) => {
    return getRequest<BrandItem[]>('/goods/brand/all', params)
}

//获取分类列表数据
export const getAllCategoryList = (parent_id: Id) => {
  return getRequest<VoRow[]>(`/goods/category/${parent_id}/all-children`)
}

//获取分类列表数据
export const getCategoryTree = (_parentId?: string | number) => {
  return getRequest<VoRow[]>(`/goods/category/allChildren`)
}

//  添加商品分类
export const insertCategory = (params?: Record<string, unknown>) => {
    return postRequest('/goods/category', params)
}
//  添加商品分类
export const updateCategory = (params?: Record<string, unknown>) => {
    return putRequest<null>('/goods/category', params)
}
//删除商品分类
export const delCategory = (id: string | number) => {
    return deleteRequest<null>(`/goods/category/${id}`)
}
// 禁用分类
export const disableCategory = (id: Id, params: Record<string, unknown> | string | boolean | number) => {
    return putRequest<null>(`/goods/category/disable/${id}`, params)
}

// 查询某分类下的全部子分类列表
export const getGoodsCategory = (parent_id: Id) => {
    return getRequest<VoRow[]>(`/goods/category/${parent_id}/all-children`)
}

//  上架商品
export const upGoods = (params?: Record<string, unknown>) => {
    return putRequest<null>(`/goods/goods/up`, params)
}

//  下架商品
export const lowGoods = (params?: Record<string, unknown>) => {
return putRequest<null>(`/goods/goods/under`, params)
}

//  获取商品sku分页列表
export const getGoodsSkuData = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/goods/goods/sku/list', params)
}

// 设置单个商品规格虚拟销量
export const updateGoodsSkuVirtualSales = (skuId: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/goods/goods/virtualSales/${skuId}`, params)
}

// 批量设置商品规格虚拟销量
export const batchUpdateGoodsSkuVirtualSales = (params?: Record<string, unknown>) => {
    return putRequest<null>('/goods/goods/virtualSales', params, {
        "Content-Type": "application/json"
    })
}
// 获取商品数量
export const getGoodsNumerData = (params?: Record<string, unknown>) => {
    return getRequest<GoodsNumVO>('/goods/goods/goodsNumber', params)
}
//  获取商品分页列表
export const getGoodsListData = (params?: Record<string, unknown>) => {
    return getRequest<PageResult<Goods>>('/goods/goods/list', params)
}
// 商品分组分页
export const getGoodsGroupByPage = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/goods/goodsGroup/getByPage', params)
}
// 商品分组详情
export const getGoodsGroup = (id: string | number) => {
    return getRequest<GoodsGroupInfo>(`/goods/goodsGroup/get/${id}`)
}
// 新增商品分组
export const addGoodsGroup = (params?: Record<string, unknown>) => {
    return postRequest<null>('/goods/goodsGroup', params)
}
// 修改商品分组
export const updateGoodsGroup = (id: string | number, params?: Record<string, unknown>) => {
    return putRequest<null>(`/goods/goodsGroup/update/${id}`, params)
}
// 删除商品分组
export const deleteGoodsGroup = (id: string | number) => {
    return deleteRequest<null>(`/goods/goodsGroup/delete/${id}`)
}
// 设定商品分组（批量）
export const addGoodsGroupItems = (groupId: Id, goodsIds: Id | Id[]) => {
    return postRequest<null>(`/goods/goodsGroup/${groupId}/goods`, {
        goodsIds: Array.isArray(goodsIds) ? goodsIds.join(",") : goodsIds,
    })
}
//  获取待审核商品分页列表
export const getAuthGoodsListData = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/goods/goods/auth/list', params)
}
//  审核商品
export const authGoods = (params?: Record<string, unknown> | FormData) => {
  return putRequest<null>('/goods/goods/auth', params, { 'Content-Type': 'application/x-www-form-urlencoded' })
}

//查询分类绑定参数信息
export const getCategoryParamsListData = (id: string | number, params?: Record<string, unknown>) => {
    return getRequest(`/goods/categoryParameters/${id}`, params)
}

// 参数组分页列表
export const getCategoryParametersGroupPage = (params?: Record<string, unknown>) => {
    return getRequest(`/goods/categoryParameters`, params)
}

//查询商品绑定参数信息
export const getCategoryParamsByGoodsId = (goodsId: Id, categoryId: Id) => {
    return getRequest(`/goods/parameters/${goodsId}/${categoryId}`)
}
export const getGoodsParamsPage = (params?: Record<string, unknown>) => {
    return getRequest(`/goods/parameters`, params)
}
export const getGoodsParamsDetail = (id: string | number, params?: Record<string, unknown>) => {
    return getRequest<GoodsParamsDTO>(`/goods/parameters/${id}`, params)
}
//保存参数
export const insertGoodsParams = (params?: Record<string, unknown>, headers?: Record<string, string>) => {
    return postRequest<null>('/goods/parameters', params, headers)
}
//更新参数
export const updateGoodsParams = (params?: Record<string, unknown>, headers?: Record<string, string>) => {
    return putRequest<null>('/goods/parameters', params, headers)
}
//删除参数
export const deleteParams = (id: string | number, params?: Record<string, unknown>) => {
    return deleteRequest<null>(`/goods/parameters/${id}`, params)
}
//保存参数组
export const insertParamsGroup = (params?: Record<string, unknown>) => {
    return postRequest<null>('/goods/categoryParameters', params)
}
//更新参数组
export const updateParamsGroup = (params?: Record<string, unknown>) => {
    return putRequest<null>('/goods/categoryParameters', params)
}
//删除参数组
export const deleteParamsGroup = (id: string | number, params?: Record<string, unknown>) => {
    return deleteRequest<null>(`/goods/categoryParameters/${id}`, params)
}

//获取sku列表
export const getSkuPage = (params?: Record<string, unknown>) => {
  return getRequest<PageResult<GoodsSku>>(`/goodsSku/getByPage`, params)
}


//查看商品详情
export const getGoodsDetail = (id: string | number) => {
  return getRequest<Goods>(`/goods/goods/get/${id}`)
}



// 获取订单统计图表
export const getOrderChart = (params?: Record<string, unknown>) => {
  return getRequest(`/statistics/order`, params)
}


// 订单统计概览
export const getOrderOverView = (params?: Record<string, unknown>) => {
  return getRequest<OrderOverviewVO>(`/statistics/order/overview`, params)
}

// 统计相关订单统计

export const statisticsOrderList = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/statistics/order/order`, params)
}

// 统计相关退单统计

export const statisticsOrderRefundList = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/statistics/order/refund`, params)
}


// 获取行业统计列表
export const goodsCategoryStatistics = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>(`/statistics/goods/getCategoryByPage`, params)
}

// 获取统计列表,排行前一百的数据
export const goodsStatistics = (params?: Record<string, unknown>) => {
    return getRequest(`/statistics/goods`, params)
}


// 获取退款统计列表
export const refundStatistics = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>(`/statistics/refund/order/getByPage`, params)
}

// 获取退款统计金额
export const refundPriceStatistics = (params?: Record<string, unknown>) => {
    return getRequest(`/statistics/refund/order/getPrice`, params)
}

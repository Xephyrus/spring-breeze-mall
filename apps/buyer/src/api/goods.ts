import type { Query, BuyerResponse } from "@/types/api";
import request, {
  Method
} from '@/plugins/request.js';

// 商品列表
export function goodsList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/goods/goods/search',
    method: Method.GET,
    needToken: false,
    optionalToken: true,
    params
  });
}

// 商品分类 筛选条件  品牌， 尺寸等
export function filterList(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: '/buyer/goods/goods/search/related',
    method: Method.GET,
    needToken: false,
    optionalToken: true,
    params
  });
}

// id获取商品详情
export function goodsDetail(goodsId: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/goods/goods/get/${goodsId}`,
    method: Method.GET,
    needToken: false
  });
}

// id获取商品Sku详情（支持未登录浏览，登录后可选携带 token）
export function goodsSkuDetail(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/goods/goods/sku/${params.goodsId}/${params.skuId}`,
    method: Method.GET,
    needToken: false,
    optionalToken: true,
    params
  });
}

// 获取所有商品分类
export function getCategory(parentId: Query): Promise<BuyerResponse> {
  return request({
    url: `/buyer/goods/category/get/${parentId}`,
    method: Method.GET,
    needToken: false
  });
}

/**
 * 获取搜索热词
 * @param {Number} count 获取搜索热词数量
 */
export function hotWords(params: Query = {}): Promise<BuyerResponse> {
  return request({
    url: `/buyer/goods/goods/hot-words`,
    method: Method.GET,
    needToken: false,
    params
  });
}

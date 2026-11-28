/**
 * 文章相关API
 */

import {http,Method} from '@/utils/request';

/**
 * 获取文章详情
 * @param type
 */
export function getArticleDetail(type) {
  return http.request({
    url: `/other/article/get/${type}`,
    method: Method.GET,
  });
}

/**
 * 获取文章详情
 * @param type
 */
 export function getArticleDetailByType(type) {
  return http.request({
    url: `/other/article/type/${type}`,
    method: Method.GET,
  });
}

/**
 * 分页获取文章列表（楼层装修用）
 * @param params { pageNumber, pageSize, categoryId? }
 */
export function getArticleList(params) {
  return http.request({
    url: `/other/article`,
    method: Method.GET,
    params,
  });
}




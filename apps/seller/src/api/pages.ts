// 统一请求路径前缀在libs/axios.js中修改
import {getRequest, postRequest, putRequest, deleteRequest} from '@/libs/axios';
import type { Query } from "@/types/api";

//保存导航栏
export const save = (params: Query) => {
    return postRequest('/siteNavigation/save', params)
}
//保存导航栏
export const update = (params: Query) => {
    return postRequest('/siteNavigation/update', params)
}
//查询导航栏
export const getNavigationData = (params: Query) => {
    return getRequest('/siteNavigation/getByPage', params)
}
//禁用导航栏
export const disableNavigation = (ids: Query) => {
    return deleteRequest(`/siteNavigation/disable/${ids}`)
}
//启用导航栏
export const enableNavigation = (ids: Query) => {
    return deleteRequest(`/siteNavigation/enable/${ids}`)
}
//删除导航栏
export const delNavigation = (ids: Query) => {
    return deleteRequest(`/siteNavigation/remove/${ids}`)
}

//
export const saveFocus = (params: Query) => {
    return deleteRequest('/siteNavigation/remove/${ids}', params)
}

//查询焦点图
export const getFocusData = (params: Query) => {
    return getRequest('/focus/getByPage', params)
}
//查询焦点图
export const saveFocusData = (params: Query) => {
    return postRequest('/focus/insertOrUpdate', params)
}
//禁用导航栏
export const disableFocus = (ids: Query) => {
    return putRequest(`/focus/disable/${ids}`)
}
//启用导航栏
export const enableFocus = (ids: Query) => {
    return putRequest(`/focus/enable/${ids}`)
}
//删除导航栏
export const delFocus = (ids: Query) => {
    return deleteRequest(`/focus/delByIds/${ids}`)
}

//根据店铺编号查询页面数据（店铺编号为0则为平台）
export const getPageData = (id: string | number) => {
    return getRequest(`/page/get/${id}`)
}

//保存页面数据
export const savePageData = (params: Query) => {
    return postRequest('/page/insertOrUpdate', params)
}
//获取分类列表数据
export const getArticleCategory = (parent_id: Query) => {
  return getRequest(`/article-category/${parent_id}/all-children`)
}
//文章分类添加
export const saveArticleCategory = (params: Query) => {
    return postRequest('/article-category', params)
}

//删除文章分类
export const delArticleCategory = (id: string | number) => {
    return deleteRequest(`/article-category/${id}`)
}
//修改文章分类
export const updateArticleCategory = (params: Query, id: string | number) => {
    return putRequest(`/article-category/update/${id}`, params)
}
//文章添加
export const saveArticle = (params: Query) => {
    return postRequest('/other/article', params)
}
//文章修改
export const updateArticle = (params: Query) => {
    return putRequest(`/other/article/update/${params.id}`, params)
}
//查看文章
export const seeArticle = (id: string | number) => {
    return getRequest(`/other/article/${id}`)
}
//获取文章列表数据
export const getArticle = (params: Query) => {
    return getRequest('/other/article/getByPage', params)
}




//删除文章数据
export const delArticle = (ids: Query) => {
    return deleteRequest(`/other/article/delByIds/${ids}`)
}










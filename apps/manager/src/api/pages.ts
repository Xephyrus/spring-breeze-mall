// 统一请求路径前缀在libs/axios.js中修改
import {getRequest, postRequest, putRequest, deleteRequest} from '@/libs/axios';
import type { ArticleRow } from '@/types/vo/page';
import type { Id } from '@/types/api';
import type { PageRows, VoRow } from '@/types/vo/common';

//保存导航栏
export const save = (params?: Record<string, unknown>) => {
    return postRequest<null>('/siteNavigation/save', params)
}
//保存导航栏
export const update = (params?: Record<string, unknown>) => {
    return postRequest<null>('/siteNavigation/update', params)
}
//查询导航栏
export const getNavigationData = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/siteNavigation/getByPage', params)
}
//禁用导航栏
export const disableNavigation = (ids: string | number) => {
    return deleteRequest<null>(`/siteNavigation/disable/${ids}`)
}
//启用导航栏
export const enableNavigation = (ids: string | number) => {
    return deleteRequest<null>(`/siteNavigation/enable/${ids}`)
}
//删除导航栏
export const delNavigation = (ids: string | number) => {
    return deleteRequest<null>(`/siteNavigation/remove/${ids}`)
}

//
export const saveFocus = (params?: Record<string, unknown>) => {
    return deleteRequest<null>('/siteNavigation/remove/${ids}', params)
}

//查询焦点图
export const getFocusData = (params?: Record<string, unknown>) => {
    return getRequest<PageRows>('/focus/getByPage', params)
}
//查询焦点图
export const saveFocusData = (params?: Record<string, unknown>) => {
    return postRequest<null>('/focus/insertOrUpdate', params)
}
//禁用导航栏
export const disableFocus = (ids: string | number) => {
    return putRequest<null>(`/focus/disable/${ids}`)
}
//启用导航栏
export const enableFocus = (ids: string | number) => {
    return putRequest<null>(`/focus/enable/${ids}`)
}
//删除导航栏
export const delFocus = (ids: string | number) => {
    return deleteRequest<null>(`/focus/delByIds/${ids}`)
}

//根据店铺编号查询页面数据（店铺编号为0则为平台）
export const getPageData = (id: string | number) => {
    return getRequest<PageRows>(`/page/get/${id}`)
}

//保存页面数据
export const savePageData = (params?: Record<string, unknown>) => {
    return postRequest<null>('/page/insertOrUpdate', params)
}
//获取分类列表数据
export const getArticleCategory = () => {
  return getRequest<VoRow[]>(`/other/articleCategory/all-children`)
}
//文章分类添加
export const saveArticleCategory = (params?: Record<string, unknown>) => {
    return postRequest<null>('/other/articleCategory', params)
}

//删除文章分类
export const delArticleCategory = (id: string | number) => {
    return deleteRequest<null>(`/other/articleCategory/${id}`)
}
//修改文章分类
export const updateArticleCategory = (params?: Record<string, unknown>, id?: Id) => {
    return putRequest<null>(`/other/articleCategory/update/${id}`, params)
}
//文章添加
export const saveArticle = (params?: Record<string, unknown>) => {
    return postRequest<null>('/other/article', params, {"Content-Type": "application/json"})
}
//文章修改
export const updateArticle = (params?: Record<string, unknown>) => {
    return putRequest<null>(`/other/article/update/${params!.id}`!, params, {"Content-Type": "application/json"})
}
//文章是否展示修改
export const updateArticleStatus = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/other/article/update/status/${id}`, params)
}
//查看文章
export const seeArticle = (id: string | number) => {
    return getRequest(`/other/article/${id}`)
}
//获取文章列表数据
export const getArticle = (params?: Record<string, unknown>) => {
    return getRequest<{ records?: ArticleRow[]; total?: number }>('/other/article/getByPage', params)
}



//删除文章数据
export const delArticle = (ids: string | number) => {
    return deleteRequest<null>(`/other/article/delByIds/${ids}`)
}



//获取隐私协议数据
export const getPrivacy = (type: string | number) => {
    return getRequest(`/other/article/type/${type}`)
}
//修改隐私协议数据
export const updatePrivacy = (id: Id, type: string, params?: Record<string, unknown>) => {
    return putRequest<null>(`/other/article/updateArticle/${type}/${id}`, params, {"Content-Type": "application/json"})
}
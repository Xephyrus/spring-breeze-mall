// 统一请求路径前缀在libs/axios.js中修改
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
  importRequest,
  getRequestWithNoToken,
  putRequestWithNoForm,
  postRequestWithNoTokenData,
  postRequestWithNoForm,
  managerUrl,
  managerApiUrl
} from "@/libs/axios";
import type { ApiParams, Id } from '@/types/api';
import type { PageRows, VoRow } from '@/types/vo/common';

// 文件上传接口
export const uploadFile = managerApiUrl + "/manager/common/upload/file";
// Websocket
export const ws = managerUrl + "/ws";

//获取所有city
export const getAllCity = (params?: Record<string, unknown>) => {
  return getRequest(managerApiUrl + '/manager/common/region/allCity', params)
}


// 获取首页查询数据
export const homeStatistics = (params?: Record<string, unknown>) => {
  return getRequest("/statistics/index", params);
};

// 获取首页tpo10商品
export const hotGoods = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/statistics/index/goodsStatistics", params);
};
// 获取首页tpo10店铺
export const hotShops = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/statistics/index/storeStatistics", params);
};


// 通知提示信息
export const getNoticePage = (params?: Record<string, unknown>) => {
  return getRequest("/statistics/index/notice", params);
};

// 登陆
export const login = (params?: FormData | Record<string, unknown>) => {
  return postRequestWithNoTokenData("/passport/user/login", params);
};

// 登出
export const logout = () => {
  return postRequest<null>("/passport/user/logout");
};

// 刷新token
export const handleRefreshToken = (token: string | number) => {
  return getRequestWithNoToken(`/passport/user/refresh/${token}`);
};
// 获取用户登录信息
export const userInfo = (params?: Record<string, unknown>) => {
  return getRequest("/passport/user/info", params);
};
// 注册
export const regist = (params?: Record<string, unknown>) => {
  return postRequest<null>("/user/regist", params);
};
// 初始化验证码
export const initCaptcha = (params?: Record<string, unknown>) => {
  return getRequestWithNoToken("/common/captcha/init", params);
};
// 发送登录短信验证码
export const sendLoginSms = (mobile: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/common/captcha/sendLoginSms/${mobile}`, params);
};
// 发送注册短信验证码
export const sendRegistSms = (mobile: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/common/captcha/sendRegistSms/${mobile}`, params);
};
// 发送重置密码短信验证码
export const sendResetSms = (mobile: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/common/captcha/sendResetSms/${mobile}`, params);
};
// 发送修改绑定手机短信验证码
export const sendEditMobileSms = (mobile: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/common/captcha/sendEditMobileSms/${mobile}`, params);
};
// 通过手机重置密码
export const resetByMobile = (params?: Record<string, unknown>) => {
  return postRequest<null>("/user/resetByMobile", params);
};

// IP天气信息
export const ipInfo = (params?: Record<string, unknown>) => {
  return getRequest("/common/ip/info", params);
};
// 个人中心编辑
export const userInfoEdit = (params?: Record<string, unknown>) => {
  return putRequest<null>("/passport/user/edit", params);
};
// 个人中心修改密码
export const changePass = (params?: Record<string, unknown>) => {
  return putRequest<null>("/passport/user/editPassword", params);
};
// 个人中心修改手机
export const changeMobile = (params?: Record<string, unknown>) => {
  return postRequest<null>("/passport/user/changeMobile", params);
};
// 获取用户数据 多条件
export const getUserListData = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>("/passport/user/getByCondition", params);
};
// 通过用户名搜索
export const searchUserByName = (username: string | number, params?: Record<string, unknown>) => {
  return getRequest("/passport/user/searchByName/" + username, params);
};
// 获取全部用户数据
export const getAllUserData = (params?: Record<string, unknown>) => {
  return getRequest("/passport/user/getAll", params);
};

function buildUserRegisterFormBody(params: ApiParams = {}) {
  const parts: string[] = [];
  const appendField = (key: string, value: string | number | boolean) => {
    if (value === undefined || value === null || value === "") return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  };
  appendField("username", params.username);
  appendField("password", params.password);
  appendField("nickName", params.nickName);
  appendField("mobile", params.mobile);
  appendField("email", params.email);
  appendField("avatar", params.avatar);
  appendField("description", params.description);
  if (params.departmentId !== undefined && params.departmentId !== null && params.departmentId !== "" && params.departmentId !== 0) {
    appendField("departmentId", params.departmentId);
  }
  if (params.isSuper !== undefined && params.isSuper !== null) {
    appendField("isSuper", params.isSuper);
  }
  if (Array.isArray(params.roles)) {
    params.roles.forEach((roleId: Id) => appendField("roles", roleId));
  }
  return parts.join("&");
}

// 添加用户
export const addUser = (params?: Record<string, unknown>) => {
  const body = buildUserRegisterFormBody(params);
  return postRequest<null>("/passport/user/register", body, {
    "Content-Type": "application/x-www-form-urlencoded",
  });
};
// 编辑管理员自身
export const editUser = (params?: Record<string, unknown>) => {
  return putRequest<null>("/passport/user/edit", params);
};
// 编辑用户
export const editOtherUser = (params?: Record<string, unknown>) => {
  return putRequest<null>("/passport/user/admin/edit", params);
};
// 启用用户
export const enableUser = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/passport/user/enable/${id}`, params);
};
// 删除用户
export const deleteUser = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/passport/user/${ids}`, params);
};
// 导入用户
export const importUserData = (params?: Record<string, unknown>) => {
  return importRequest("/passport/user/importData", params);
};
/****************************** 部门 */
// 通过部门获取全部角色数据
export const getUserByDepartmentId = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>(`/permission/departmentRole/${id}`, params);
};

// 通过部门修改绑定角色
export const updateDepartmentRole = (id: string | number, params?: unknown) => {
  return putRequestWithNoForm(`/permission/departmentRole/${id}`, params);
};

// 获取一级部门
export const initDepartment = (params?: Record<string, unknown>) => {
  return getRequest("/permission/department", params);
};
// 加载部门子级数据
export const loadDepartment = (id: string | number) => {
  return getRequest(`/permission/department/${id}`);
};
// 添加部门
export const addDepartment = (params?: Record<string, unknown>) => {
  return postRequest<null>("/permission/department", params);
};
// 编辑部门
export const editDepartment = (ids: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/permission/department/${ids} `, params);
};
// 删除部门
export const deleteDepartment = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/permission/department/${ids}`, params);
};
// 搜索部门
export const searchDepartment = (params?: Record<string, unknown>) => {
  return getRequest("/permission/department/search", params);
};

/****************************** 部门结束 */

// 获取全部角色数据
export const getAllRoleList = (params?: Record<string, unknown>) => {
  return getRequest("/permission/role", params);
};
// 分页获取角色数据
export const getRoleList = (params?: Record<string, unknown>) => {
  return getRequest("/permission/role", params);
};

// 添加角色
export const addRole = (params?: Record<string, unknown>) => {
  return postRequest<null>("/permission/role", params);
};

// 编辑角色
export const editRole = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/permission/role/${params!.roleId}`!, params);
};

// 查看某角色拥有的菜单
export const selectRoleMenu = (roleId: string | number) => {
  return getRequest<VoRow[]>(`/permission/roleMenu/${roleId}`);
};

// 保存角色菜单
export const saveRoleMenu = (id: string | number, params?: unknown) => {
  return postRequestWithNoForm(`/permission/roleMenu/${id}`, params);
};

// 分配角色权限
export const editRolePerm = (params?: Record<string, unknown>) => {
  return postRequest<null>("/permission/role/editRolePerm", params);
};
// 分配角色数据权限
export const editRoleDep = (params?: Record<string, unknown>) => {
  return postRequest<null>("/permission/role/editRoleDep", params);
};
// 删除角色
export const deleteRole = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/permission/role/${ids}`, params);
};

/****************************** 角色结束 */


/****************************** 权限 */
// 获取全部权限数据
export const getAllPermissionList = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/permission/menu/tree", params);
};

// 获取全部权限数据
export const getCurrentPermissionList = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/permission/menu/memberMenu", params);
};

// 添加权限
export const addPermission = (params?: Record<string, unknown>) => {
  return postRequest<null>("/permission/menu", params);
};

// 编辑权限
export const editPermission = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/permission/menu/${params!.id}`!, params);
};
// 删除权限
export const deletePermission = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/permission/menu/${ids}`, params);
};
// 搜索权限
export const searchPermission = (params?: Record<string, unknown>) => {
  return getRequest("/permission/menu", params);
};

/****************************** 权限结束 */


/****************************** 店铺权限 */
// 获取全部权限数据
export const getStoreAllPermissionList = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>("/permission/storeMenu/tree", params);
};

// 获取全部权限数据
export const getStoreCurrentPermissionList = (params?: Record<string, unknown>) => {
  return getRequest("/permission/storeMenu/memberMenu", params);
};

// 添加权限
export const addStorePermission = (params?: Record<string, unknown>) => {
  return postRequest<null>("/permission/storeMenu", params);
};

// 编辑权限
export const editStorePermission = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/permission/storeMenu/${params!.id}`!, params);
};
// 删除权限
export const deleteStorePermission = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/permission/storeMenu/${ids}`, params);
};
// 搜索权限
export const searchStorePermission = (params?: Record<string, unknown>) => {
  return getRequest("/permission/storeMenu", params);
};

/****************************** 权限结束 */


// 分页获取日志数据
export const getLogListData = (params?: Record<string, unknown>) => {
  return getRequest("/setting/log/getAllByPage", params);
};
// 删除日志
export const deleteLog = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/setting/log/${ids}`, params);
};
// 清空日志
export const deleteAllLog = (params?: Record<string, unknown>) => {
  return deleteRequest<null>("/setting/log", params);
};


// 分页获取消息数据
export const getMessageData = (params?: Record<string, unknown>) => {
  return getRequest("/other/message/getByCondition", params);
};
// 获取单个消息详情
export const getMessageDataById = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/other/message/get/${id}`, params);
};
// 发送消息
export const addMessage = (params?: Record<string, unknown>) => {
  return postRequest<null>("/messageSend/send", params);
};
// 编辑消息
export const editMessage = (params?: Record<string, unknown>) => {
  return postRequest<null>("/other/message/edit", params);
};
// 删除消息
export const deleteMessage = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/other/message/delByIds/${ids}`, params);
};
// 编辑发送消息
export const editMessageSend = (params?: Record<string, unknown>) => {
  return putRequest<null>("/messageSend/update", params);
};
// 删除发送消息
export const deleteMessageSend = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/manager/messageSend/delByIds/${ids}`, params);
};

// 分页获取文件数据
export const getFileListData = (params?: Record<string, unknown>) => {
  return getRequest("/common/file", params);
};

// 重命名文件
export const renameFile = (params?: Record<string, unknown>) => {
  return postRequest<null>("/common/file/rename", params);
};
// 删除文件
export const deleteFile = (ids: string | number, params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/common/file/delete/${ids}`, params);
};
// 下载文件
export const aliDownloadFile = (fKey: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/file/ali/download/${fKey}`, params);
};

// base64上传
export const base64Upload = (params?: Record<string, unknown>) => {
  return postRequest<null>("/common/upload/file", params);
};

// 系统设置
export const getSetting = (key: string) => {
  return getRequest(`/setting/setting/get/${key}`);
};
// 更新系统配置
export const setSetting = (key: string | number, params?: Record<string, unknown>) => {
  return putRequestWithNoForm(`/setting/setting/put/${key}`, params);
};

// 微信视频号小店类目（三级）
export const getWxChannelsThirdCategory = (params?: Record<string, unknown>) => {
  return getRequest<VoRow[]>(`/wxchannels/category/third`, params);
};

// 微信视频号商品分页
export const getWxChannelsGoodsPage = (params?: Record<string, unknown>) => {
  return getRequest(`/wxchannels/goods`, params);
};

// 微信视频号订单分页
export const getWxChannelsOrderPage = (params?: Record<string, unknown>) => {
  return getRequest(`/wxchannels/order`, params);
};

// 微信视频号概况
export const getWxChannelsOverviewSummary = (params?: Record<string, unknown>) => {
  return getRequest(`/wxchannels/overview/summary`, params);
};

// 微信视频号退单分页
export const getWxChannelsRefundPage = (params?: Record<string, unknown>) => {
  return getRequest(`/wxchannels/refund`, params);
};

// 分页查询敏感词

export const getSensitiveWordsPage = (params?: Record<string, unknown>) => {
  return getRequest(`/other/sensitiveWords`, params);
};

// 分页查询敏感词
export const insertSensitiveWords = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/other/sensitiveWords`, params);
};

// 修改
export const updateSensitiveWords = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/other/sensitiveWords/${id}`, params);
};

// 删除敏感词
export const delSensitive = (ids: string | number) => {
  return deleteRequest<null>(`/other/sensitiveWords/delByIds/${ids}`);
};

// 添加商品计量单位
export const addGoodsUnit = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/goods/goodsUnit`, params);
};
// 分页获取商品计量单位
export const getGoodsUnitPage = (params?: Record<string, unknown>) => {
  return getRequest(`/goods/goodsUnit`, params);
};
// 编辑商品计量单位
export const updateGoodsUnit = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/goods/goodsUnit/${id}`, params);
};
// 删除商品计量单位
export const delGoodsUnit = (ids: string | number) => {
  return deleteRequest<null>(`/goods/goodsUnit/delete/${ids}`);
};

// 同步高德行政地区数据
export const asyncRegion = () => {
  return postRequest(`/setting/region/sync`);
};

// 批量id删除
export const delRegion = (ids: string | number) => {
  return deleteRequest<null>(`/setting/region/${ids}`);
};

// 更新地区
export const updateRegion = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/setting/region/${id}`, params);
};
// 添加地区
export const addRegion = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/setting/region`, params);
};

// 通过id获取子地区
export const getChildRegion = (id: string | number) => {
  return getRequest<VoRow[]>(`/setting/region/item/${id}`);
};

// 重置用户密码
export const resetPassword = (ids: string) => {
  return postRequest(`/passport/user/resetPassword/${ids}`);
};

// 分页查询自定义分词
export const getCustomWordsPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/other/customWords/page`, params);
};

// 添加自定义分词
export const insertCustomWords = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/other/customWords`, params);
};

// 修改自定义分词
export const updateCustomWords = (params?: Record<string, unknown>) => {
  return putRequest<null>(`/other/customWords`, params);
};

// 删除自定义分词
export const delCustom = (id: string | number) => {
  return deleteRequest<null>(`/other/customWords/${id}`);
};

// 设置热搜词
export const setHotWords = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/hotwords/hotwords`, params);
};

// 删除热搜词
export const deleteHotWords = (params?: Record<string, unknown>) => {
  return deleteRequest<null>(`/hotwords/hotwords`,params);
};

// 获取热搜词
export const getHotWords = () => {
  return getRequest(`/hotwords/hotwords`);
};

// 获取热词统计
export const getHotWordsStatistics = (params?: Record<string, unknown>) => {
  return getRequest(`/hotwords/hotwords/statistics`,params);
};

// 获取历史热词
export const getHotWordsHistory = (params?: Record<string, unknown>) => {
  return getRequest(`/hotwords/hotwords/history`,params);
};

// 获取文件目录列表
export const getFileDirectory = () => {
  return getRequest(managerApiUrl+`/manager/common/fileDirectory`);
};

// 添加文件目录
export const addFileDirectory = (params?: Record<string, unknown>) => {
  return postRequestWithNoForm(managerApiUrl+`/manager/common/fileDirectory`,params);
};


// 修改文件目录
export const updateFileDirectory = (params?: Record<string, unknown>) => {
  return putRequestWithNoForm(managerApiUrl+`/manager/common/fileDirectory`,params);
};


// 删除文件目录
export const delFileDirectory = (id: string | number) => {
  return deleteRequest<null>(managerApiUrl+`/manager/common/fileDirectory/${id}`);
};

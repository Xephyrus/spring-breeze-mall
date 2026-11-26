import {
  getRequest,
  putRequest,
  deleteRequest,
  postRequest
} from '@/libs/axios';
import type { ApiParams, Id } from '@/types/api';
import type { PageRows, VoRow } from '@/types/vo/common';

// 查询站内信信息
export const getMessageData = (params: ApiParams) => {
  return getRequest("/other/message", params);
};
//修改站内信模板
export const editNoticeMessage = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/setting/noticeMessage/${id}`, params)
}

//微信消息同步
export const wechatMessageSync = (params?: Record<string, unknown>) => {
  return getRequest("/wechat/wechatMessage/init", params)
}

//微信消息码同步
export const wechatMPMessageSync = (params?: Record<string, unknown>) => {
  return getRequest("/wechat/wechatMPMessage/init", params)
}


// 查询站内信模板信息
export const getNoticeMessageData = (params: ApiParams) => {
  return getRequest("/setting/noticeMessage", params);
};
//删除站内信
export const deleteMessage = (id: string | number) => {
  return deleteRequest<null>(`/other/message/${id}`);
};
// 开启站内信模板
export const openNoticeMessage = (id: string | number) => {
  return putRequest<null>(`/setting/noticeMessage/${id}/open`);
};
// 修改站内信状态
export const updateMessageStatus = (id: Id, status: string) => {
  return putRequest<null>(`/setting/noticeMessage/${id}/${status}`);
};
//获取设置
export const getSetting = (key: string) => {
  return getRequest<VoRow>(`/setting/setting/get/${key}`);
};
//根据类型查看配置信息
export const getSettingList = (params?: Record<string, unknown>) => {
  return getRequest<VoRow>(`/setting/setting/all`, params);
};
//设置配置信息
export const setSetting = (key: string | number, params?: Record<string, unknown>) => {
  // 后端 SettingManagerController 的保存接口是 PUT /setting/setting/put/{key}
  return putRequest<null>(`/setting/setting/put/${key}`, params);
};

//获取设置
export const getExperienceData = (key: string) => {
  return getRequest(`/setting/experience/get/${key}`);
};
//保存
export const setExperienceData = (key: string | number, params?: Record<string, unknown>) => {
  return postRequest<null>(`/setting/experience/put/${key}`, params);
};

//根据类型获取积分设置
export const getPointData = (key: string) => {
  return getRequest(`/setting/point/get/${key}`);
};
//保存
export const setPointData = (key: string | number, params?: Record<string, unknown>) => {
  return postRequest<null>(`/setting/point/put/${key}`, params);
};

//根据类型获取积分设置
export const getKuaidiSetting = (key: string) => {
  return getRequest(`/setting/kuaidi/get/${key}`);
};
//保存
export const setKuaidiSetting = (key: string | number, params?: Record<string, unknown>) => {
  return postRequest<null>(`/setting/kuaidi/put/${key}`, params);
};

//获取所有的物流公司
export const getLogisticsList = () => {
  return getRequest(`/setting/logistics/all`);
};
//分页获取物流公司
export const getLogisticsPage = (params?: Record<string, unknown>) => {
  return getRequest<PageRows>(`/setting/logistics/getByPage`, params);
};
//添加物流公司
export const addLogistics = (params?: Record<string, unknown>) => {
  return postRequest(`/setting/logistics`, params);
};
//获取物流公司详情
export const getLogisticsDetail = (id: string | number) => {
  return getRequest(`/setting/logistics/get/${id}`);
};
//编辑物流公司
export const editLogistics = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest(`/setting/logistics/${id}`, params);
};
//删除物流公司
export const delLogistics = (id: string | number) => {
  return deleteRequest(`/setting/logistics/delete/${id}`);
};

//禁用启用物流公司
export const openLogistics = (id: string | number) => {
  return putRequest<null>(`/setting/logistics/open/${id}`);
};

//获取所有的物流公司
export const getLogisticsAll = () => {
  return getRequest(`/setting/logistics/all`);
};

// 验证码源文件添加
export const createVerification = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/other/verificationSource`, params)
}
// 验证码源文件修改
export const updateVerification = (id: string | number, params?: Record<string, unknown>) => {
  return putRequest<null>(`/other/verificationSource/${id}`, params)
}
// 验证码源文件删除
export const deleteVerification = (id: string | number) => {
  return deleteRequest<null>(`/other/verificationSource/${id}`)
}
// 验证码源文件列表
export const verificationPage = (params?: Record<string, unknown>) => {
  return getRequest(`/other/verificationSource`, params)
}

//获取通知类站内信
export const getNoticeMessageDetail = (id: string | number, params?: Record<string, unknown>) => {
  return getRequest(`/setting/noticeMessage/${id}`, params)
}

// 统一消息模板聚合分页（站内信 + 短信 + 微信服务号 + 小程序订阅）
export const getMessageTemplateAggregatePage = (params: ApiParams) => {
  return getRequest<PageRows>("/setting/messageTemplate/page", params);
};

// 快速切换渠道开关 (channel: NOTICE / SMS / WECHAT_OA / WECHAT_MP, status: OPEN / CLOSE)
export const updateMessageChannelSwitch = (params: ApiParams) => {
  return putRequest<null>("/setting/messageTemplate/switch", params);
};

// 保存站内信配置 (title, content, status)
export const updateNoticeMessageTemplate = (params: ApiParams) => {
  return putRequest<null>("/setting/messageTemplate/notice", params);
};

// 保存短信配置 (smsTemplateCode, status; 内容只读不可编辑)
export const updateSmsMessageTemplateConfig = (params: ApiParams) => {
  return putRequest<null>("/setting/messageTemplate/sms", params);
};

// 保存微信公众号服务号配置 (code, enable; 内容只读)
export const updateWechatOaMessageTemplate = (params: ApiParams) => {
  return putRequest<null>("/setting/messageTemplate/wechat-oa", params);
};

// 保存微信小程序订阅消息配置 (code, enable; 内容只读)
export const updateWechatMpMessageTemplate = (params: ApiParams) => {
  return putRequest<null>("/setting/messageTemplate/wechat-mp", params);
};


// -------------------------------------------------------------
// 补充缺失的系统配置、版本及验证码 API
// -------------------------------------------------------------




// 支付支持方式表单 (PAYMENT_SUPPORT.vue)
export const getPaymentSupportForm = () => {
  return getRequest(`/setting/settingx/paymentSupport`);
};

// 验证码源管理别名 (slider.vue)
export const addVerification = createVerification;
export const editVerification = updateVerification;
export const delVerification = deleteVerification;

// APP版本管理 (appVersion.vue)
export const appVersionPage = (params?: Record<string, unknown>) => {
  return getRequest(`/other/appVersion`, params);
};
export const addVersion = (params?: Record<string, unknown>) => {
  return postRequest<null>(`/other/appVersion`, params);
};
export const editVersion = (params?: Record<string, unknown>, id?: Id) => {
  return putRequest<null>(`/other/appVersion/${id}`, params);
};
export const deleteVersion = (id: string | number) => {
  return deleteRequest<null>(`/other/appVersion/${id}`);
};

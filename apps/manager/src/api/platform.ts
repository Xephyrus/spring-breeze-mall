// 统一请求路径前缀在libs/axios.js中修改
import { getRequest, postRequest } from '@/libs/axios';

// 验证码渲染图片接口
export const drawCodeImage = "/lili/common/captcha/draw/"


/**
 * 获取平台配置。
 *
 * 参数会拼进 URL 路径，必须是类型字符串（base / point / order / goods / ...）。
 */
export const getParams = (type: string) => {
    return getRequest('/platformSetting/get/'+type)
}
/**
 * 保存平台配置。
 *
 * method 会拼进 URL 路径，必须是类型字符串。
 */
export const editParams = (params: Record<string, unknown>, method: string) => {
    return postRequest<null>('/platformSetting/insertOrUpdate/'+method, params)
}

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import config from "@/config/config";
import { getToken, removeAll } from "@/utils/auth";
import type { ResultMessage } from "@/types/api";

import { ElNotification, ElMessageBox } from "element-plus";
import qs from "qs";

/** 额外请求选项：`apiBase` 仅 upload 使用；`skipAuthDialog` 让调用方自行处理 403 */
export interface RequestOptions extends AxiosRequestConfig {
  apiBase?: string;
  skipAuthDialog?: boolean;
}

/** 创建 axios 实例 */
const request: AxiosInstance = axios.create({
  // API 请求的默认前缀
  baseURL: config.BASE_API_URL,

  // 请求超时时间
  timeout: 20000,
});

let isRefreshing = false;

/**
 * 异常拦截处理器。
 *
 * 401 清本地缓存并刷新页面；403 提示「登录已失效」（可按 config.skipAuthDialog 跳过）；
 * 400 直接把后端 message 弹出来。
 */
const errorHandler = (error: AxiosError<ResultMessage>): Promise<never> => {
  console.log(error);
  const response = error.response;
  if (response) {
    if (response.status === 401) {
      removeAll();
      location.reload();
    } else if (response.status === 403) {
      const cfg = error.config as (InternalAxiosRequestConfig & { skipAuthDialog?: boolean }) | undefined;
      if (cfg?.skipAuthDialog) {
        return Promise.reject(error);
      }
      if (!isRefreshing) {
        /**
         * 403 提示将重新从商家移动端进入当前页面
         */
        ElMessageBox({
          message: "当前登录已失效，请从关闭重新进入。",
          title: "提示",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          closeOnPressEscape: false,
          closeOnClickModal: false,
          type: "warning",
        })
          .then(() => {
            isRefreshing = true;
            window.close();
            ElNotification({
              title: "登录失效提示",
              message: "请手动关闭当前页面",
              type: "error",
              position: "top-right",
            });
          })
          .catch(() => {
            isRefreshing = true;
            ElNotification({
              title: "登录失效提示",
              message: "请手动关闭当前页面",
              type: "error",
              position: "top-right",
            });
          });
        isRefreshing = false;
      }
    } else if (response.status === 400) {
      ElNotification({
        message: response.data?.message ?? "请求参数有误",
        position: "top-right",
        type: "error",
      });
    }
  }

  return Promise.reject(error);
};

// 请求拦截器
request.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = getToken();

  if (token) {
    cfg.headers.accessToken = `${token}`;
  }
  return cfg;
}, errorHandler);

// 响应拦截器：直接返回后端 body
request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  errorHandler
);

/** GET 请求 */
export const get = <T = ResultMessage>(
  url: string,
  data: Record<string, unknown> = {},
  options: RequestOptions = {}
): Promise<T> =>
  request({
    url,
    params: data,
    method: "get",
    ...options,
  }) as unknown as Promise<T>;

/** POST 请求（表单编码） */
export const post = <T = ResultMessage>(
  url: string,
  data: Record<string, unknown> | unknown = {},
  options: RequestOptions = {}
): Promise<T> =>
  request({
    url,
    method: "post",
    data: qs.stringify(data as Record<string, unknown>),
    ...options,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }) as unknown as Promise<T>;

/** DELETE 请求 */
export const del = <T = ResultMessage>(
  url: string,
  data: Record<string, unknown> | unknown = {},
  options: RequestOptions = {}
): Promise<T> =>
  request({
    url,
    method: "delete",
    data,
    ...options,
  }) as unknown as Promise<T>;

/** 上传文件 POST 请求（默认发往买家端上传入口，可用 apiBase 覆盖） */
export const upload = <T = ResultMessage>(
  url: string,
  data: FormData | Record<string, unknown> = {},
  options: RequestOptions = {}
): Promise<T> => {
  // 默认沿用买家上传地址；客服图片显式选择 IM 服务，不将文件发往通用上传入口。
  const { apiBase = config.BASE_BUYER, ...requestOptions } = options;
  return request({
    url: apiBase + url,
    method: "post",
    data,
    ...requestOptions,
  }) as unknown as Promise<T>;
};

export default request;

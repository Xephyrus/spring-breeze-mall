import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ResultMessage } from "@spring-breeze/shared";
import { getStore, setStore } from "@spring-breeze/shared";
import { router } from "../router/index";
import { Message } from "@/utils/message";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

/** 刷新 token 时挂在 config 上的内部标记 */
type RefreshableConfig = InternalAxiosRequestConfig & {
  _isRefreshRequest?: boolean;
  _retryAfterRefresh?: boolean;
};

/** 统一请求路径前缀（Vite：用 import.meta.env.DEV 替代 process.env.NODE_ENV） */
export const sellerUrl = import.meta.env.DEV
  ? BASE.API_DEV.seller
  : BASE.API_PROD.seller;
export const baseUrl = sellerUrl + BASE.PREFIX;
/** 文件上传接口 */
export const uploadFile = sellerUrl + "/store/common/upload/file";

const service: AxiosInstance = axios.create({
  // 实例级超时：商家端有 Excel 导入导出、文件上传等慢操作，给 60s
  timeout: 60000,
  baseURL: baseUrl,
});

const recordCurrentPath = (): string => router.currentRoute.value.fullPath;

/** 跳转登录页（带 redirect 回跳） */
const redirectLogin = (message?: string | null): void => {
  if (router.currentRoute.value.name !== "login") {
    if (message) {
      Message.error(message);
    }
    router.push({ path: "/login", query: { redirect: recordCurrentPath() } });
  }
};

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.method === "get") {
      config.params = {
        _t: Date.parse(String(new Date())) / 1000,
        ...config.params,
      };
    }
    let uuid = getStore("uuid");
    if (!uuid) {
      uuid = uuidv4();
      setStore("uuid", uuid);
    }
    config.headers.uuid = uuid;
    return config;
  },
  (err: unknown) => {
    Message.error("请求超时");
    return Promise.reject(err);
  }
);

// http response 拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ResultMessage>) => {
    const data = response.data;
    // 根据返回的 code 做不同处理（与后端约定）
    switch (data?.code) {
      case 401:
        // 未登录：清除登录状态
        Cookies.set("userInfoSeller", "");
        setStore("accessToken", "");
        redirectLogin(data.message || "未知错误，请重新登录");
        return data as unknown as AxiosResponse;
      case 400:
      case 500:
        Message.error(data.message || "系统异常");
        return data as unknown as AxiosResponse;
      default:
        if (!data?.success && data?.message) {
          Message.error(data.message);
        }
        return data as unknown as AxiosResponse;
    }
  },
  async (error: unknown) => {
    // 状态码非 200 的错误处理
    const axiosError = error as AxiosError<ResultMessage>;
    const response = axiosError.response;
    const config = axiosError.config as RefreshableConfig | undefined;
    if (response) {
      if (response.status === 401) {
        redirectLogin("登录状态已过期，请重新登录");
      } else if (
        response.status === 403 &&
        config &&
        !config._isRefreshRequest &&
        !config._retryAfterRefresh
      ) {
        // accessToken 过期：刷新 token 后重试原请求
        config._retryAfterRefresh = true;
        const result = await refreshToken();
        if (result === "success") {
          config.headers.accessToken = getStore("accessToken");
          return service(config);
        }
        Cookies.set("userInfoSeller", "");
        redirectLogin();
      } else if (response.status === 404) {
        // 刷新请求已用 _isRefreshRequest 标记隔离，这里的 404 都是真实业务请求
        Message.error(response.data?.message || "请求的资源不存在");
      } else {
        Message.error(response.data?.message || "系统异常，请稍后重试");
      }
    } else {
      // 断网/超时等无响应的错误
      Message.error(
        axiosError.code === "ECONNABORTED"
          ? "请求超时，请稍后重试"
          : "网络异常，请检查网络连接"
      );
    }
    return Promise.reject(error);
  }
);

/** 刷新 token 单例 Promise：并发 403 时共享同一次刷新，避免重复请求与轮询 */
let refreshTokenPromise: Promise<string> | null = null;
function refreshToken(): Promise<string> {
  if (!refreshTokenPromise) {
    const oldRefreshToken = getStore("refreshToken");
    refreshTokenPromise = service({
      method: "get",
      url: `/passport/login/refresh/${oldRefreshToken}`,
      _isRefreshRequest: true,
    } as RefreshableConfig)
      .then((res) => {
        const body = res as unknown as ResultMessage<{
          accessToken: string;
          refreshToken: string;
        }>;
        if (body.success && body.result) {
          setStore("accessToken", body.result.accessToken);
          setStore("refreshToken", body.result.refreshToken);
          return "success";
        }
        return "fail";
      })
      .catch(() => "fail")
      .finally(() => {
        refreshTokenPromise = null;
      });
  }
  return refreshTokenPromise;
}

/** 将对象序列化为 application/x-www-form-urlencoded 格式 */
const formSerialize = (data: Record<string, unknown>): string => {
  let ret = "";
  for (const it in data) {
    ret += encodeURIComponent(it) + "=" + encodeURIComponent(String(data[it])) + "&";
  }
  return ret.substring(0, ret.length - 1);
};

type Params = Record<string, unknown> | undefined;

export const getRequest = <T = unknown>(
  url: string,
  params?: Params,
  resBlob?: string
): Promise<ResultMessage<T>> => {
  const data: AxiosRequestConfig = {
    method: "get",
    url: `${url}`,
    params,
    headers: { accessToken: getStore("accessToken") },
    responseType: "blob",
  };
  if (resBlob !== "blob") {
    delete data.responseType;
  }
  return service(data) as Promise<ResultMessage<T>>;
};

export const getRequestHasHeader = <T = unknown>(
  url: string,
  params?: Params,
  headers?: Record<string, string>
): Promise<ResultMessage<T>> => {
  return service({
    method: "get",
    url: `${url}`,
    params,
    transformRequest: headers ? undefined : [formSerialize],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accessToken: getStore("accessToken"),
      ...headers,
    },
    responseType: "blob",
  }) as Promise<ResultMessage<T>>;
};

export const postRequest = <T = unknown>(
  url: string,
  params?: unknown,
  headers?: Record<string, string>
): Promise<ResultMessage<T>> =>
  service({
    method: "post",
    url: `${url}`,
    data: params,
    transformRequest: headers
      ? undefined
      : [formSerialize as unknown as (data: unknown) => unknown],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accessToken: getStore("accessToken"),
      ...headers,
    },
  }) as Promise<ResultMessage<T>>;

/** 不带 form 表单、不走 transformRequest */
export const postRequestWithNoForm = <T = unknown>(
  url: string,
  params?: unknown
): Promise<ResultMessage<T>> =>
  service({
    method: "post",
    url: `${url}`,
    data: params,
    headers: { accessToken: getStore("accessToken") },
  }) as Promise<ResultMessage<T>>;

export const putRequest = <T = unknown>(
  url: string,
  params?: unknown,
  headers?: Record<string, string>
): Promise<ResultMessage<T>> =>
  service({
    method: "put",
    url: `${url}`,
    data: params,
    transformRequest: headers
      ? undefined
      : [formSerialize as unknown as (data: unknown) => unknown],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accessToken: getStore("accessToken"),
      ...headers,
    },
  }) as Promise<ResultMessage<T>>;

export const putRequestWithNoForm = <T = unknown>(
  url: string,
  params?: unknown
): Promise<ResultMessage<T>> =>
  service({
    method: "put",
    url: `${url}`,
    data: params,
    headers: { accessToken: getStore("accessToken") },
  }) as Promise<ResultMessage<T>>;

export const deleteRequest = <T = unknown>(
  url: string,
  params?: Params
): Promise<ResultMessage<T>> =>
  service({
    method: "delete",
    url: `${url}`,
    params,
    headers: { accessToken: getStore("accessToken") },
  }) as Promise<ResultMessage<T>>;

export const importRequest = <T = unknown>(
  url: string,
  params?: unknown
): Promise<ResultMessage<T>> =>
  service({
    method: "post",
    url: `${url}`,
    data: params,
    headers: { accessToken: getStore("accessToken") },
  }) as Promise<ResultMessage<T>>;

export const uploadFileRequest = <T = unknown>(
  url: string,
  params?: unknown
): Promise<ResultMessage<T>> =>
  service({
    method: "post",
    url: `${url}`,
    data: params,
    headers: {
      accessToken: getStore("accessToken"),
      "Content-Type": "multipart/form-data",
    },
  }) as Promise<ResultMessage<T>>;

/**
 * 无需 token 验证的请求，避免旧 token 过期导致请求失败
 */
export const getRequestWithNoToken = <T = unknown>(
  url: string,
  params?: Params
): Promise<ResultMessage<T>> =>
  service({ method: "get", url: `${url}`, params }) as Promise<ResultMessage<T>>;

/** 无需 token 验证的请求，避免旧 token 过期导致请求失败 */
export const postRequestWithNoToken = <T = unknown>(
  url: string,
  params?: Params
): Promise<ResultMessage<T>> =>
  service({ method: "post", url: `${url}`, params }) as Promise<ResultMessage<T>>;

/** 无需 token 验证的请求，避免旧 token 过期导致请求失败 */
export const postRequestWithNoTokenData = <T = unknown>(
  url: string,
  params?: unknown
): Promise<ResultMessage<T>> =>
  service({
    method: "post",
    url: `${url}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: params,
  }) as Promise<ResultMessage<T>>;

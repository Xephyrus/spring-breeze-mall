/**
 * axios 客户端工厂（manager / seller / buyer / im 共用）。
 *
 * 各端的差异点（baseUrl、token 存储、未登录跳转、消息提示、刷新 token、uuid 头）
 * 全部通过 hooks 注入，请求/响应拦截与 12 个请求方法的行为保持与 manager 现有实现一致，
 * 便于其它端平滑切换而不产生行为变化。
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ResultMessage } from "./types";

/** 刷新 token 时附加在 config 上的内部标记 */
type RefreshableConfig = InternalAxiosRequestConfig & {
  _isRefreshRequest?: boolean;
  _retryAfterRefresh?: boolean;
};

export interface HttpClientHooks {
  /** 取 accessToken（各端存储位置不同：localStorage / cookie） */
  getToken: () => string;
  /** 统一错误提示，通常接 ElMessage.error */
  onMessage?: (message: string) => void;
  /** 未登录/登录过期处理：清 token + 跳登录页 */
  onUnauthorized?: (message?: string | null) => void;
  /** 可选：401/403 时刷新 token；返回 true 表示刷新成功，可重试原请求 */
  refreshAccessToken?: () => Promise<boolean>;
  /** 可选：请求头 uuid（各端生成/存储方式不同） */
  withUuidHeader?: () => string | undefined;
}

export interface HttpClientOptions extends HttpClientHooks {
  /** 完整基址，例如 BASE.API_DEV.manager + BASE.PREFIX */
  baseUrl: string;
  /** 默认 8000ms，与 manager 现有一致 */
  timeout?: number;
}

export interface HttpClient {
  readonly service: AxiosInstance;
  getRequest: <T = any>(
    url: string,
    params?: Record<string, unknown>,
    resBlob?: string
  ) => Promise<ResultMessage<T>>;
  postRequest: <T = any>(
    url: string,
    params?: Record<string, unknown> | unknown,
    headers?: Record<string, string>,
    timeout?: number
  ) => Promise<ResultMessage<T>>;
  postRequestWithNoForm: <T = any>(url: string, params?: unknown) => Promise<ResultMessage<T>>;
  putRequest: <T = any>(
    url: string,
    params?: Record<string, unknown> | unknown,
    headers?: Record<string, string>
  ) => Promise<ResultMessage<T>>;
  putRequestWithNoForm: <T = any>(url: string, params?: unknown) => Promise<ResultMessage<T>>;
  deleteRequest: <T = any>(
    url: string,
    params?: Record<string, unknown>
  ) => Promise<ResultMessage<T>>;
  importRequest: <T = any>(url: string, params?: unknown) => Promise<ResultMessage<T>>;
  uploadFileRequest: <T = any>(url: string, params?: unknown) => Promise<ResultMessage<T>>;
  postBlobRequest: (url: string, data: unknown) => Promise<unknown>;
  getRequestWithNoToken: <T = any>(
    url: string,
    params?: Record<string, unknown>
  ) => Promise<ResultMessage<T>>;
  postRequestWithNoToken: <T = any>(
    url: string,
    params?: Record<string, unknown>
  ) => Promise<ResultMessage<T>>;
  postRequestWithNoTokenData: <T = any>(
    url: string,
    params?: unknown
  ) => Promise<ResultMessage<T>>;
}

/** 表单序列化（与原实现完全一致，包括不做空值过滤） */
function formTransform(data: Record<string, unknown>): string {
  let ret = "";
  for (const it in data) {
    ret +=
      encodeURIComponent(it) +
      "=" +
      encodeURIComponent(data[it] as unknown as string) +
      "&";
  }
  return ret.substring(0, ret.length - 1);
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const {
    baseUrl,
    timeout = 8000,
    getToken,
    onMessage,
    onUnauthorized,
    refreshAccessToken,
    withUuidHeader,
  } = options;

  const service = axios.create({ timeout, baseURL: baseUrl });
  const notify = onMessage ?? (() => undefined);

  let refreshPromise: Promise<boolean> | null = null;
  const refresh = () => {
    if (!refreshAccessToken) return Promise.resolve(false);
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  };

  service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (config.method === "get") {
        config.params = {
          _t: Date.parse(String(new Date())) / 1000,
          ...config.params,
        };
      }
      if (!config.headers) {
        config.headers = {} as typeof config.headers;
      }
      const uuid = withUuidHeader?.();
      if (uuid) config.headers.uuid = uuid;
      return config;
    },
    (err: unknown) => {
      notify("请求超时");
      return Promise.reject(err);
    }
  );

  service.interceptors.response.use(
    (response: AxiosResponse<ResultMessage>) => {
      const data = response.data;
      switch (data?.code) {
        case 401:
        case 20004:
          onUnauthorized?.(data.message || null);
          return data as unknown as AxiosResponse;
        case 400:
        case 500:
          notify(data.message || "系统异常");
          return data as unknown as AxiosResponse;
        default:
          if (!data?.success && data?.message) {
            notify(data.message);
          }
          return data as unknown as AxiosResponse;
      }
    },
    async (error: unknown) => {
      const axiosError = error as AxiosError<ResultMessage>;
      const response = axiosError.response;
      const config = axiosError.config as RefreshableConfig | undefined;
      if (response) {
        const body = response.data;
        const code = body && body.code;
        if (response.status === 401) {
          onUnauthorized?.("登录状态已过期，请重新登录");
        } else if (
          (response.status === 403 || code === 20004) &&
          config &&
          !config._isRefreshRequest &&
          !config._retryAfterRefresh
        ) {
          config._retryAfterRefresh = true;
          const ok = await refresh();
          if (ok) {
            if (!config.headers) {
              config.headers = {} as typeof config.headers;
            }
            config.headers.accessToken = getToken();
            return service(config);
          }
          onUnauthorized?.(null);
        } else if (response.status === 404) {
          notify("请求的资源不存在");
        } else {
          notify((body && body.message) || "系统异常，请稍后重试");
        }
      } else {
        notify(
          axiosError.code === "ECONNABORTED"
            ? "请求超时，请稍后重试"
            : "网络异常，请检查网络连接"
        );
      }
      return Promise.reject(error);
    }
  );

  const authHeaders = () => ({ accessToken: getToken() });

  const getRequest = <T = any>(
    url: string,
    params?: Record<string, unknown>,
    resBlob?: string
  ) => {
    const data: AxiosRequestConfig = {
      method: "get",
      url,
      params,
      headers: authHeaders(),
      responseType: "blob",
    };
    if (resBlob !== "blob") delete data.responseType;
    return service(data) as Promise<ResultMessage<T>>;
  };

  const postBlobRequest = (url: string, data: unknown) =>
    service({
      method: "post",
      url,
      data,
      responseType: "blob",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    }) as unknown as Promise<unknown>;

  const postRequest = <T = any>(
    url: string,
    params?: Record<string, unknown> | unknown,
    headers?: Record<string, string>,
    timeoutMs: number = 8000
  ) =>
    service({
      method: "post",
      timeout: timeoutMs,
      url,
      data: params,
      transformRequest: headers
        ? undefined
        : [formTransform as unknown as (data: unknown) => unknown],
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...authHeaders(),
        ...headers,
      },
    }) as Promise<ResultMessage<T>>;

  const postRequestWithNoForm = <T = any>(url: string, params?: unknown) =>
    service({
      method: "post",
      url,
      data: params,
      headers: authHeaders(),
    }) as Promise<ResultMessage<T>>;

  const putRequest = <T = any>(
    url: string,
    params?: Record<string, unknown> | unknown,
    headers?: Record<string, string>
  ) =>
    service({
      method: "put",
      url,
      data: params,
      transformRequest: headers
        ? undefined
        : [formTransform as unknown as (data: unknown) => unknown],
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...authHeaders(),
        ...headers,
      },
    }) as Promise<ResultMessage<T>>;

  const putRequestWithNoForm = <T = any>(url: string, params?: unknown) =>
    service({
      method: "put",
      url,
      data: params,
      headers: authHeaders(),
    }) as Promise<ResultMessage<T>>;

  const deleteRequest = <T = any>(url: string, params?: Record<string, unknown>) =>
    service({
      method: "delete",
      url,
      params,
      headers: authHeaders(),
    }) as Promise<ResultMessage<T>>;

  const importRequest = <T = any>(url: string, params?: unknown) =>
    service({
      method: "post",
      url,
      data: params,
      headers: authHeaders(),
    }) as Promise<ResultMessage<T>>;

  const uploadFileRequest = <T = any>(url: string, params?: unknown) =>
    service({
      method: "post",
      url,
      data: params,
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    }) as Promise<ResultMessage<T>>;

  const getRequestWithNoToken = <T = any>(
    url: string,
    params?: Record<string, unknown>
  ) => service({ method: "get", url, params }) as Promise<ResultMessage<T>>;

  const postRequestWithNoToken = <T = any>(
    url: string,
    params?: Record<string, unknown>
  ) => service({ method: "post", url, params }) as Promise<ResultMessage<T>>;

  const postRequestWithNoTokenData = <T = any>(url: string, params?: unknown) =>
    service({
      method: "post",
      url,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: params,
    }) as Promise<ResultMessage<T>>;

  return {
    service,
    getRequest,
    postRequest,
    postRequestWithNoForm,
    putRequest,
    putRequestWithNoForm,
    deleteRequest,
    importRequest,
    uploadFileRequest,
    postBlobRequest,
    getRequestWithNoToken,
    postRequestWithNoToken,
    postRequestWithNoTokenData,
  };
}

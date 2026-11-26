import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ResultMessage } from "@spring-breeze/shared";
import { getStore, setStore } from "./storage";
import { getRouter } from "./router-holder";
import { ElMessage } from "element-plus";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

type RefreshableConfig = InternalAxiosRequestConfig & {
  _isRefreshRequest?: boolean;
  _retryAfterRefresh?: boolean;
};

export const managerApiUrl = import.meta.env.DEV
  ? BASE.API_DEV.manager
  : BASE.API_PROD.manager;
export const managerUrl = managerApiUrl + BASE.PREFIX;
export const uploadFile = managerApiUrl + "/manager/common/upload/file";

const service = axios.create({
  timeout: 8000,
  baseURL: managerUrl,
});

function refreshAccessToken(token: string) {
  return service({
    method: "get",
    url: `/passport/user/refresh/${token}`,
    _isRefreshRequest: true,
  } as AxiosRequestConfig);
}

function redirectToLogin(message: string | null) {
  const router = getRouter();
  Cookies.set("userInfoManager", "");
  setStore("accessToken", "");
  if (router && router.currentRoute.value.name !== "login") {
    ElMessage.error(message || "未知错误，请重新登录");
    router.push("/login");
  }
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.method == "get") {
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
    if (!config.headers) {
      config.headers = {} as typeof config.headers;
    }
    config.headers["uuid"] = uuid;
    return config;
  },
  (err: unknown) => {
    ElMessage.error("请求超时");
    return Promise.reject(err);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse<ResultMessage>) => {
    const data = response.data;
    switch (data.code) {
      case 401:
      case 20004:
        redirectToLogin(data.message || null);
        return data as unknown as AxiosResponse;
      case 400:
      case 500:
        ElMessage.error(data.message || "系统异常");
        return data as unknown as AxiosResponse;
      default:
        if (!data.success && data.message) {
          ElMessage.error(data.message);
        }
        return data as unknown as AxiosResponse;
    }
  },
  async (error: unknown) => {
    // 统一按 AxiosError 处理；非 axios 抛出的错误没有 response/config
    const axiosError = error as AxiosError<ResultMessage>;
    const response = axiosError.response;
    const config = axiosError.config as RefreshableConfig | undefined;
    if (response) {
      const body = response.data;
      const code = body && body.code;
      if (response.status === 401) {
        redirectToLogin("登录状态已过期，请重新登录");
      } else if (
        (response.status === 403 || code === 20004) &&
        config &&
        !config._isRefreshRequest &&
        !config._retryAfterRefresh
      ) {
        config._retryAfterRefresh = true;
        const result = await refreshToken();
        if (result === "success") {
          if (!config.headers) {
            config.headers = {} as typeof config.headers;
          }
          config.headers.accessToken = getStore("accessToken");
          return service(config);
        }
        redirectToLogin(null);
      } else if (response.status === 404) {
        ElMessage.error("请求的资源不存在");
      } else {
        ElMessage.error((body && body.message) || "系统异常，请稍后重试");
      }
    } else {
      ElMessage.error(
        axiosError.code === "ECONNABORTED"
          ? "请求超时，请稍后重试"
          : "网络异常，请检查网络连接"
      );
    }
    return Promise.reject(error);
  }
);

let refreshTokenPromise: Promise<"success" | "fail"> | null = null;
function refreshToken() {
  if (!refreshTokenPromise) {
    const oldRefreshToken = getStore("refreshToken");
    refreshTokenPromise = refreshAccessToken(oldRefreshToken)
      .then((res: { data?: unknown }) => {
        const data = res as unknown as ResultMessage<{
          accessToken: string;
          refreshToken: string;
        }>;
        if (data.success && data.result) {
          const { accessToken, refreshToken: newRefreshToken } = data.result;
          setStore("accessToken", accessToken);
          setStore("refreshToken", newRefreshToken);
          return "success" as const;
        }
        return "fail" as const;
      })
      .catch(() => "fail" as const)
      .finally(() => {
        refreshTokenPromise = null;
      });
  }
  return refreshTokenPromise;
}

/**
 * 泛型默认值暂保持 any：api 层尚未逐个标注返回类型，
 * 若改成 unknown，调用方 `(res: ApiResult<X>) => ...` 会因逆变不兼容而大面积报错。
 * 下一步先把 api/*.ts 的返回类型标出来，再把默认值收敛成 unknown。
 */
export const getRequest = <T = any>(
  url: string,
  params?: Record<string, unknown>,
  resBlob?: string
) => {
  const accessToken = getStore("accessToken");
  const data: AxiosRequestConfig = {
    method: "get",
    url: `${url}`,
    params,
    headers: {
      accessToken,
    },
    responseType: "blob",
  };
  if (resBlob != "blob") {
    delete data.responseType;
  }
  return service(data) as Promise<ResultMessage<T>>;
};

export const postBlobRequest = (url: string, data: unknown) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "post",
    url: `${url}`,
    data,
    responseType: "blob",
    headers: {
      "Content-Type": "application/json",
      accessToken,
    },
  });
};

export const postRequest = <T = any>(
  url: string,
  params?: Record<string, unknown> | unknown,
  headers?: Record<string, string>,
  timeout: number = 8000
) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "post",
    timeout,
    url: `${url}`,
    data: params,
    transformRequest: headers
      ? undefined
      : [
          function (data: Record<string, unknown>) {
            let ret = "";
            for (const it in (data as Record<string, unknown>)) {
              ret +=
                encodeURIComponent(it) +
                "=" +
                encodeURIComponent((data as Record<string, unknown>)[it] as string) +
                "&";
            }
            ret = ret.substring(0, ret.length - 1);
            return ret;
          },
        ],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accessToken,
      ...headers,
    },
  }) as Promise<ResultMessage<T>>;
};

export const postRequestWithNoForm = <T = any>(url: string, params?: unknown) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "post",
    url: `${url}`,
    data: params,
    headers: {
      accessToken,
    },
  }) as Promise<ResultMessage<T>>;
};

export const putRequest = <T = any>(
  url: string,
  params?: Record<string, unknown> | unknown,
  headers?: Record<string, string>
) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "put",
    url: `${url}`,
    data: params,
    transformRequest: headers
      ? undefined
      : [
          function (data: Record<string, unknown>) {
            let ret = "";
            for (const it in (data as Record<string, unknown>)) {
              ret +=
                encodeURIComponent(it) +
                "=" +
                encodeURIComponent((data as Record<string, unknown>)[it] as string) +
                "&";
            }
            ret = ret.substring(0, ret.length - 1);
            return ret;
          },
        ],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accessToken,
      ...headers,
    },
  }) as Promise<ResultMessage<T>>;
};

export const putRequestWithNoForm = <T = any>(url: string, params?: unknown) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "put",
    url: `${url}`,
    data: params,
    headers: {
      accessToken,
    },
  }) as Promise<ResultMessage<T>>;
};

export const deleteRequest = <T = any>(url: string, params?: Record<string, unknown>) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "delete",
    url: `${url}`,
    params,
    headers: {
      accessToken,
    },
  }) as Promise<ResultMessage<T>>;
};

export const importRequest = <T = any>(url: string, params?: unknown) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "post",
    url: `${url}`,
    data: params,
    headers: {
      accessToken,
    },
  }) as Promise<ResultMessage<T>>;
};

export const uploadFileRequest = <T = any>(url: string, params?: unknown) => {
  const accessToken = getStore("accessToken");
  return service({
    method: "post",
    url: `${url}`,
    data: params,
    headers: {
      accessToken,
      "Content-Type": "multipart/form-data",
    },
  }) as Promise<ResultMessage<T>>;
};

export const getRequestWithNoToken = <T = any>(
  url: string,
  params?: Record<string, unknown>
) => {
  return service({
    method: "get",
    url: `${url}`,
    params,
  }) as Promise<ResultMessage<T>>;
};

export const postRequestWithNoToken = <T = any>(
  url: string,
  params?: Record<string, unknown>
) => {
  return service({
    method: "post",
    url: `${url}`,
    params,
  }) as Promise<ResultMessage<T>>;
};

export const postRequestWithNoTokenData = <T = any>(url: string, params?: unknown) => {
  return service({
    method: "post",
    url: `${url}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: params,
  }) as Promise<ResultMessage<T>>;
};
import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { markHandledRequestError, isHandledRequestError } from "@/utils/requestError";
import { ElLoading } from "element-plus";
import { Message, Modal } from "@/utils/message";
import Storage from "./storage";
import { router } from "../router/index.js";
import { useAppStore } from "@/stores/app";
import { handleRefreshToken } from "@/api/index";
import { v4 as uuidv4 } from "uuid";

import qs from "qs";

/** 后端统一响应结构 */
export interface BuyerResponse<T = unknown> {
  success: boolean;
  code?: number;
  message?: string;
  result: T;
}

export const buyerUrl = import.meta.env.DEV ? BASE.API_DEV.buyer : BASE.API_PROD.buyer;

/** 登录引导弹窗句柄（并发失败时复用同一个） */
let loginPrompt: Promise<unknown> | null = null;
const refreshToken = getTokenDebounce();

/** 会员中心（/home/*）页面使用局部 loading，不启用全屏遮罩 */
function isMemberCenterRoute(): boolean {
  try {
    const path = router.currentRoute?.value?.path || "";
    return path === "/home" || path.startsWith("/home/");
  } catch {
    return false;
  }
}

const service: AxiosInstance = axios.create({
  timeout: 10000,
  baseURL: buyerUrl,
  paramsSerializer: (params) =>
    qs.stringify(params, {
      arrayFormat: "repeat",
    }),
});

service.interceptors.request.use(
  async (config) => {
    const { loading } = config;
    const isPutPost = config.method === "put" || config.method === "post";
    const isJson = config.headers["Content-Type"] === "application/json";
    const isFile = config.headers["Content-Type"] === "multipart/form-data";
    if (!config._dataSerialized && isPutPost && isJson) {
      config.data = JSON.stringify(config.data);
    }
    if (!config._dataSerialized && isPutPost && !isFile && !isJson) {
      config.data = qs.stringify(config.data, {
        arrayFormat: "repeat",
      });
    }

    config._dataSerialized = true;

    const method = (config.method || "get").toLowerCase();
    const isReadRequest = method === "get" || method === "head";
    const shouldShowLoading =
      loading === true || (!isReadRequest && loading !== false && !isMemberCenterRoute());

    if (typeof window !== "undefined" && shouldShowLoading) {
      config._loadingInstance = ElLoading.service({ fullscreen: true });
    }

    let uuid = Storage.getItem("uuid") ?? "";
    if (!uuid) {
      uuid = uuidv4();
      Storage.setItem("uuid", uuid);
    }
    config.headers["uuid"] = uuid;

    const accessToken = Storage.getItem("accessToken") ?? "";
    if (accessToken && (config.needToken || config.optionalToken)) {
      try {
        const jwtData = JSON.parse(
          decodeURIComponent(
            escape(window.atob(String(accessToken).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
          )
        ) as { exp: number };
        const expired = jwtData.exp < Math.round(Number(new Date()) / 1000);
        if (expired) {
          if (config.needToken) {
            return refresh(config);
          }
          // 公开接口：丢弃过期 token，匿名继续请求，避免浏览商品时被引导登录
          Storage.removeItem("accessToken");
          Storage.removeItem("refreshToken");
        } else {
          config.headers["accessToken"] = accessToken;
        }
      } catch {
        Storage.removeItem("accessToken");
        Storage.removeItem("refreshToken");
        if (config.needToken) {
          return refresh(config);
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/** 保留请求配置、状态与错误码，供页面判断业务失败并定位原因。 */
function buildRejectError(
  error: AxiosError<BuyerResponse>,
  errorData: { message?: string } = {}
): Error {
  const message =
    errorData.message ||
    (error?.code === "ECONNABORTED" ? "连接超时，请稍候再试！" : "网络错误，请稍后再试！");
  return Object.assign(new Error(message), {
    data: errorData,
    config: error.config,
    response: error.response,
    code: error.code,
  });
}

/**
 * 刷新凭证并返回请求配置；请求拦截器不能返回业务响应。每个业务请求最多刷新一次。
 * 刷新失败时保持 Promise 拒绝，阻止后续支付、订单等成功回调继续执行。
 */
async function refresh(config: AxiosRequestConfigWithFlags): Promise<AxiosRequestConfigWithFlags> {
  if (!config._retryAfterRefresh) {
    config._retryAfterRefresh = true;
    const result = await refreshToken();
    if (result === "success") {
      config.headers.accessToken = Storage.getItem("accessToken") ?? "";
      return config;
    }
  }
  Storage.removeItem("accessToken");
  Storage.removeItem("refreshToken");
  Storage.removeItem("userInfo");
  Storage.setItem("cartNum", "0");
  useAppStore().setCartNum(0);
  // 多个受保护接口同时失败时共用一个弹窗，关闭后允许再次提示。
  if (!loginPrompt) {
    const currentRoute = router.currentRoute.value;
    loginPrompt = Modal.confirm({
      title: "请登录",
      content: "请登录后执行此操作",
      okText: "立即登录",
      cancelText: "继续浏览",
      onOk: () =>
        router.push({
          path: "/login",
          query: { rePath: currentRoute.path, query: JSON.stringify(currentRoute.query) },
        }),
      onCancel: () => router.push("/"),
    }).finally(() => {
      loginPrompt = null;
    });
  }
  const error = Object.assign(new Error("登录已过期"), { code: "AUTH_EXPIRED", config });
  throw markHandledRequestError(error);
}

// 说明：本拦截器直接把后端 body 返回给调用方（而非 AxiosResponse），
// axios 的类型定义不允许这种返回值，因此整体断言为合法的 fulfilled 处理器，
// 以保留原有运行时行为（调用方拿到的就是响应的 data）。
const onFulfilled = async (response: AxiosResponse<BuyerResponse>): Promise<unknown> => {
  await closeLoading(response as LoadingTarget);
  const config = response.config;
  if (!config.skipAuthHandler && [401, 403, 20004].includes(response.data?.code ?? 0)) {
    return service(await refresh(config));
  }
  return response.data;
};

const onRejected = async (error: AxiosError<BuyerResponse>): Promise<unknown> => {
  if (typeof window === "undefined") return Promise.reject(error);
  await closeLoading(error as unknown as LoadingTarget);
  if (isHandledRequestError(error)) return Promise.reject(error);
  const errorResponse = error.response || ({} as AxiosResponse<BuyerResponse>);
  const errorData = errorResponse.data || ({} as BuyerResponse);

  if (
    !error.config?.skipAuthHandler &&
    (errorResponse.status === 401 ||
      errorResponse.status === 403 ||
      error.response?.data?.code === 20004)
  ) {
    return service(
      await refresh((error.config || errorResponse.config) as AxiosRequestConfigWithFlags)
    );
  }
  if (!axios.isAxiosError(error) || axios.isCancel(error)) return Promise.reject(error);
  const rejected = buildRejectError(
    error,
    errorResponse.status === 404 ? { ...errorData, message: "请求的资源不存在" } : errorData
  );
  if (!error.config?.skipMessage && axios.isAxiosError(error) && !axios.isCancel(error)) {
    Message.error(rejected.message);
    markHandledRequestError(rejected);
  }
  return Promise.reject(rejected);
};

service.interceptors.response.use(
  onFulfilled as unknown as (response: AxiosResponse) => AxiosResponse,
  onRejected
);

interface LoadingTarget {
  config?: { _loadingInstance?: { close: () => void } };
}

const closeLoading = (target: LoadingTarget): true | Promise<void> => {
  if (typeof target.config?._loadingInstance?.close !== "function") return true;
  return new Promise((resolve) => {
    setTimeout(() => {
      target.config?._loadingInstance?.close();
      delete target.config!._loadingInstance;
      resolve();
    }, 200);
  });
};

export const Method = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
} as const;

export type RequestMethod = (typeof Method)[keyof typeof Method];

/** 带业务开关的请求配置（声明见 types/axios.d.ts） */
type AxiosRequestConfigWithFlags = import("axios").InternalAxiosRequestConfig;

export default function request<T = BuyerResponse>(
  options: import("axios").AxiosRequestConfig
): Promise<T> {
  return service(options) as unknown as Promise<T>;
}

/** 并发刷新共用同一个 Promise；不轮询，不保留上次刷新结果，失败后允许下次重试。 */
function getTokenDebounce(): () => Promise<"success" | "fail"> {
  let pending: Promise<"success" | "fail"> | null = null;
  return function () {
    if (pending) return pending;
    const token = Storage.getItem("refreshToken") ?? "";
    if (!token) return Promise.resolve("fail");
    pending = (handleRefreshToken(token) as Promise<BuyerResponse<{ accessToken: string; refreshToken: string }>>)
      .then((res) => {
        if (!res.success || !res.result?.accessToken || !res.result?.refreshToken) return "fail";
        Storage.setItem("accessToken", res.result.accessToken);
        Storage.setItem("refreshToken", res.result.refreshToken);
        return "success";
      })
      .catch(() => "fail")
      .finally(() => {
        pending = null;
      }) as Promise<"success" | "fail">;
    return pending;
  };
}

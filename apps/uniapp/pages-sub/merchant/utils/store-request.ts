import api from "@/config/api";
import Request from "@/lib/request/index";
import Foundation from "@/utils/foundation";
import { md5 } from "@/utils/md5";
import storage from "@/utils/storage";
import uuid from "@/utils/uuid-modified";
import { hideLoading } from '@/utils/loading'

let isStoreNavigateTo = false;

function cleanStoreAuth() {
  uni.showToast({
    title: "商家登录状态已过期，请重新登录",
    icon: "none",
    duration: 1800,
  });

  storage.clearStoreAuth();

  if (!isStoreNavigateTo) {
    isStoreNavigateTo = true;
    setTimeout(() => {
      isStoreNavigateTo = false;
      uni.reLaunch({
        url: "/pages-sub/merchant/pages/login/index",
      });
    }, 1200);
  }
}

const storeHttp = new Request() as unknown as InstanceType<typeof Request> & {
  interceptors: { request: { use: (a?: any, b?: any) => void }; response: { use: (a?: any, b?: any) => void } };
};

const ensureUuid = () => {
  if (!storage.getUuid()) {
    storage.setUuid((uuid as any).v1());
  }
};

storeHttp.setConfig((config) => {
  ensureUuid();
  config.baseURL = api.store;
  config.header = {
    ...config.header,
  };
  config.validateStatus = () => true;
  return config;
});

storeHttp.interceptors.request.use(
  (config) => {
    ensureUuid();
    const token = storage.getStoreAccessToken();
    if (token) {
      const nonce = Foundation.randomString(6);
      const timestamp = parseInt(String(new Date().getTime() / 1000), 10);
      const sign = md5(nonce + timestamp + token);
      const _params = { nonce, timestamp, sign };
      config.params = { ...(config.params || {}), ..._params };
      config.header.accessToken = token;
    }
    config.header = {
      ...config.header,
      uuid: storage.getUuid(),
    };
    return config;
  },
  (config) => Promise.reject(config)
);

let isStoreRefreshing = false;
let storeRequests = [];

function refreshTokenApi(refreshToken) {
  // uni.request 在类型上返回 RequestTask；这里显式包成 Promise，
  // 否则调用处的 `const [err, res] = await ...` 解构出来是 undefined（刷新流程静默失效）
  return new Promise<any>((resolve, reject) => {
    uni.request({
      url: `${api.store}/passport/login/refresh/${refreshToken}`,
      method: "GET",
      header: {
        uuid: storage.getUuid(),
      },
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

storeHttp.interceptors.response.use(
  async (response) => {
    isStoreNavigateTo = false;
    try {
      hideLoading();
    } catch (e) {}

    const token = storage.getStoreAccessToken();
    const refreshToken = storage.getStoreRefreshToken();

    // 403 / 401 并且有 refreshToken，尝试刷新
    if (
      token &&
      refreshToken &&
      (response.statusCode === 403 || response.statusCode === 401 || response.data?.code === 403)
    ) {
      if (!isStoreRefreshing) {
        isStoreRefreshing = true;
        storage.removeStoreAccessToken();
        try {
          const res = await refreshTokenApi(refreshToken);
          const data = res?.data;
          if (data && data.success && data.result) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.result;
            storage.setStoreAccessToken(newAccessToken);
            if (newRefreshToken) {
              storage.setStoreRefreshToken(newRefreshToken);
            }
            response.header = response.header || {};
            response.header.accessToken = `${newAccessToken}`;
            storeRequests.forEach((cb) => cb(newAccessToken));
            storeRequests = [];
            return storeHttp.request(response.config);
          } else {
            cleanStoreAuth();
            return Promise.reject(data);
          }
        } catch (e) {
          cleanStoreAuth();
          return Promise.reject(e);
        } finally {
          isStoreRefreshing = false;
        }
      } else {
        return new Promise((resolve) => {
          storeRequests.push((newToken) => {
            response.header = response.header || {};
            response.header.accessToken = `${newToken}`;
            resolve(storeHttp.request(response.config));
          });
        });
      }
    } else if (
      (!token && (response.statusCode === 403 || response.statusCode === 401)) ||
      response.data?.code === 403 ||
      response.data?.code === 401
    ) {
      cleanStoreAuth();
    } else if ((response.statusCode === 200 && response.data && !response.data.success) || response.statusCode === 400) {
      if (response.data?.message) {
        uni.showToast({
          title: response.data.message,
          icon: "none",
          duration: 2000,
        });
      }
    }
    return response;
  },
  (error) => error
);

export { storeHttp };
export default storeHttp;

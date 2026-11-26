import type { ResultMessage } from "@spring-breeze/shared";

declare module "vue" {
  interface ComponentCustomProperties {
    getRequest: (
      url: string,
      params?: Record<string, unknown>,
      resBlob?: string
    ) => Promise<ResultMessage>;
    postRequest: (
      url: string,
      params?: unknown,
      headers?: Record<string, string>,
      timeout?: number
    ) => Promise<ResultMessage>;
    putRequest: (
      url: string,
      params?: unknown,
      headers?: Record<string, string>
    ) => Promise<ResultMessage>;
    deleteRequest: (
      url: string,
      params?: Record<string, unknown>
    ) => Promise<ResultMessage>;
    importRequest: (url: string, params?: unknown) => Promise<ResultMessage>;
    uploadFileRequest: (url: string, params?: unknown) => Promise<ResultMessage>;
    setStore: (name: string, content: unknown) => void;
    getStore: (name: string) => string;
    removeStore: (name: string) => void;
    $mainColor: string;
    md5: (value: string) => string;
    $filters: Record<string, any>;
    linkTo: (goodsId: string | number, skuId?: string | number) => void;
    wapLinkTo: (goodsId: string | number, skuId?: string | number) => string;
    $t: (key: string) => string;
  }
}

export {};


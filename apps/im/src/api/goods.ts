import { post, get, upload, del } from "@/utils/request";
import type { GoodsSkuQuery } from "@/types/api";

export const ServeGetGoodsDetail = (data: GoodsSkuQuery) => {
    return get(`/im/goods/goods/sku/${data.goodsId}/${data.skuId}`);
  };

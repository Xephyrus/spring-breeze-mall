import request, { Method, buyerUrl } from "@/plugins/request";
import storage from "@/plugins/storage";
import type { BuyerResponse, Query } from "@/types/api";

/** 获取拼图验证图 */
export function getVerifyImg(verificationEnums: string): Promise<BuyerResponse> {
  return request({
    url: `${buyerUrl}/buyer/common/slider/${verificationEnums}`,
    method: Method.GET,
    needToken: false,
    headers: { uuid: storage.getItem("uuid") ?? "" },
  });
}

/** 校验拼图验证码 */
export function postVerifyImg(params: Query): Promise<BuyerResponse> {
  return request({
    url: `${buyerUrl}/buyer/common/slider/${String(params.verificationEnums)}`,
    method: Method.POST,
    needToken: false,
    params,
    headers: { uuid: storage.getItem("uuid") ?? "" },
  });
}

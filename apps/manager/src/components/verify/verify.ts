
import {managerApiUrl, getRequestWithNoToken, postRequestWithNoToken} from '@/libs/axios';


// 获取拼图验证
/** 拼图验证的类型枚举，见后端 VerificationEnums */
export const getVerifyImg = (verificationEnums: string | number) => {
  return getRequestWithNoToken(`${managerApiUrl}/manager/common/slider/${verificationEnums}`);
};

// 拼图验证
/** 拼图验证提交参数 */
export type VerifyParams = {
  verificationEnums: string | number;
  [key: string]: unknown;
};

export const postVerifyImg = (params: VerifyParams) => {
  return postRequestWithNoToken(`${managerApiUrl}/manager/common/slider/${params.verificationEnums}`, params);
};

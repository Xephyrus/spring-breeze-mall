import { markRaw } from "vue";
import BASE_SETTING from "./setting/base-setting.vue";
import GOODS_SETTING from "./setting/goods-setting.vue";
import ORDER_SETTING from "./setting/order-setting.vue";
import POINT_SETTING from "./setting/point-setting.vue";
import LOGISTICS_SETTING from "./setting/logistics-setting.vue";
import OSS_SETTING from "./setting/oss-setting.vue";
import SMS_SETTING from "./setting/sms-setting.vue";
import IM_SETTING from "./setting/im-setting.vue";
import LIVE_SETTING from "./setting/live-setting.vue";
import WITHDRAWAL_SETTING from "./setting/withdrawal-setting.vue";
import VERIFICATION_SETTING from "./setting/verification-setting.vue";
import SECURITY_SETTING from "./setting/security-setting.vue";
import ALIPAY_PAYMENT from "./pay/alipay-payment.vue";
import WECHAT_PAYMENT from "./pay/wechat-payment.vue";
import PAYMENT_SUPPORT from "./pay/payment-support.vue";
import WECHAT_CONNECT from "./authLogin/wechat-connect.vue";
import QQ_CONNECT from "./authLogin/qq-connect.vue";
import CONNECT_SETTING from "./authLogin/connect-setting.vue";

export default {
  BASE_SETTING: markRaw(BASE_SETTING),
  GOODS_SETTING: markRaw(GOODS_SETTING),
  ORDER_SETTING: markRaw(ORDER_SETTING),
  POINT_SETTING: markRaw(POINT_SETTING),
  LOGISTICS_SETTING: markRaw(LOGISTICS_SETTING),
  OSS_SETTING: markRaw(OSS_SETTING),
  SMS_SETTING: markRaw(SMS_SETTING),
  IM_SETTING: markRaw(IM_SETTING),
  LIVE_SETTING: markRaw(LIVE_SETTING),
  WITHDRAWAL_SETTING: markRaw(WITHDRAWAL_SETTING),
  VERIFICATION_SETTING: markRaw(VERIFICATION_SETTING),
  SECURITY_SETTING: markRaw(SECURITY_SETTING),
  PAYMENT_SUPPORT: markRaw(PAYMENT_SUPPORT),
  WECHAT_PAYMENT: markRaw(WECHAT_PAYMENT),
  ALIPAY_PAYMENT: markRaw(ALIPAY_PAYMENT),
  WECHAT_CONNECT: markRaw(WECHAT_CONNECT),
  CONNECT_SETTING: markRaw(CONNECT_SETTING),
  QQ_CONNECT: markRaw(QQ_CONNECT),
};

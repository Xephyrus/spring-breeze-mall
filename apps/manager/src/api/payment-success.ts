/**
 * 支付成功页配置辅助接口，保存配置复用系统设置API。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import { getRequest, postRequestWithNoForm } from '@/libs/axios';
import type { ApiParams } from '@/types/api';
import type { VoRow } from '@/types/vo/common';

/** 获取已选商品，含失效项，供配置回显。 */
export const getPaymentSuccessGoods = () => getRequest<VoRow[]>('/payment/success-page/goods');

/** 预览当前选品规则，不保存配置或触发推广；memberId 用于演示"排除已购商品"。 */
export const previewPaymentSuccessGoods = (config: ApiParams, memberId?: string) =>
  postRequestWithNoForm(
    `/payment/success-page/preview${memberId ? `?memberId=${encodeURIComponent(memberId)}` : ''}`,
    config
  );

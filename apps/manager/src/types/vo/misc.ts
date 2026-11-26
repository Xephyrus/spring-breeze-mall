/**
 * 零散模块的共用 VO。
 *
 * 只收「多个页面用法一致」的类型；页面专属形状（积分商品表单、定时任务行、
 * 商品分组行、直播统计、反馈详情、隐私协议）留在各自页面里 ——
 * 强行合并会引入一堆用不到的字段，反而更容易写错。
 */

/** 品牌（下拉 / 列表用，多页共用） */
export type BrandItem = {
  id?: string | number;
  name?: string;
  [key: string]: unknown;
};

/** 首页 / 统计图表行（首页与数据报表共用） */
export type ChartRow = {
  createTime?: string;
  date?: string;
  price?: number | string;
  title?: string;
  num?: number | string;
  lastNum?: number | string;
  uvNum?: number | string;
  pvNum?: number | string;
  [key: string]: unknown;
};

/** 积分统计结果 */
export type StatsResult = { totalPoint?: number; unUsedPoint?: number; [key: string]: unknown };

// 统一请求路径前缀在libs/axios.js中修改
import {getRequest} from '@/libs/axios';
import type { Query } from "@/types/api";

//商品统计
export const getGoodsStatisticsData = (params: Query) => {
  return getRequest(`/statistics/goods`, params)
}

//获取订单统计金额
export const getOrderStatisticsPrice = (params: Query) => {
  return getRequest(`/statistics/order/getPrice`, params)
}

//订单统计列表
export const getOrderStatistics = (params: Query) => {
  return getRequest(`/statistics/order/getByPage`, params)
}

/** 店铺业绩报表 */
export const getStorePerformanceReport = (params: Query) => {
  return getRequest('/statistics/report/store-performance', params);
};

export const exportStorePerformanceReport = (params: Query) => {
  return getRequest('/statistics/report/store-performance/export', params, 'blob');
};

/** 商品同比环比报表 */
export const getGoodsComparisonReport = (params: Query) => {
  return getRequest('/statistics/report/goods-comparison', params);
};

export const exportGoodsComparisonReport = (params: Query) => {
  return getRequest('/statistics/report/goods-comparison/export', params, 'blob');
};

/** 销售订单明细报表 */
export const getSalesOrderDetailReport = (params: Query) => {
  return getRequest('/statistics/report/sales-order-detail', params);
};

export const exportSalesOrderDetailReport = (params: Query) => {
  return getRequest('/statistics/report/sales-order-detail/export', params, 'blob');
};

/** 商品销售汇总报表 */
export const getGoodsSalesSummaryReport = (params: Query) => {
  return getRequest('/statistics/report/goods-sales-summary', params);
};

export const exportGoodsSalesSummaryReport = (params: Query) => {
  return getRequest('/statistics/report/goods-sales-summary/export', params, 'blob');
};

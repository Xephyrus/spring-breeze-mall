-- =============================================================================
-- li_store_menu.path 统一为 kebab-case（幂等）
--
-- 背景：前端路由 path 由菜单 path 拼装（util.registerDynamicRoutes），
--       文件名/name 已 kebab 化，path 不统一会让 URL 风格混杂。
--
-- 注意：这是**破坏性**变更——旧 URL（如 /orderList）会 404，属计划内确认项。
-- 共 33 条；只用 UPDATE ... WHERE 旧值，可重复执行。
-- 用法：mysql -u root -p lilishop < backend/DB/store-menu-kebab-paths.sql
-- =============================================================================

UPDATE li_store_menu SET path = 'procurement-purchase-order-list' WHERE path = 'procurementPurchaseOrderList';
UPDATE li_store_menu SET path = 'procurement-inbound-list' WHERE path = 'procurementInboundList';
UPDATE li_store_menu SET path = 'procurement-inventory-count-list' WHERE path = 'procurementInventoryCountList';
UPDATE li_store_menu SET path = 'procurement-damage-report-list' WHERE path = 'procurementDamageReportList';
UPDATE li_store_menu SET path = 'alert-quantity-warn' WHERE path = 'alertQuantityWarn';
UPDATE li_store_menu SET path = 'stock-outbound-list' WHERE path = 'stockOutboundList';
UPDATE li_store_menu SET path = 'stock-flow-list' WHERE path = 'stockFlowList';
UPDATE li_store_menu SET path = 'oss-manage' WHERE path = 'ossManage';
UPDATE li_store_menu SET path = 'order-verification' WHERE path = 'orderVerification';
UPDATE li_store_menu SET path = 'address-manage' WHERE path = 'addressManage';
UPDATE li_store_menu SET path = 'shop-info' WHERE path = 'shopInfo';
UPDATE li_store_menu SET path = 'data-report' WHERE path = 'dataReport';
UPDATE li_store_menu SET path = 'order-list' WHERE path = 'orderList';
UPDATE li_store_menu SET path = 'member-comment' WHERE path = 'memberComment';
UPDATE li_store_menu SET path = 'return-goods-order' WHERE path = 'returnGoodsOrder';
UPDATE li_store_menu SET path = 'return-money-order' WHERE path = 'returnMoneyOrder';
UPDATE li_store_menu SET path = 'order-complaint' WHERE path = 'orderComplaint';
UPDATE li_store_menu SET path = 'store-bill' WHERE path = 'storeBill';
UPDATE li_store_menu SET path = 'live-goods' WHERE path = 'liveGoods';
UPDATE li_store_menu SET path = 'distribution-goods' WHERE path = 'distributionGoods';
UPDATE li_store_menu SET path = 'distribution-order' WHERE path = 'distributionOrder';
UPDATE li_store_menu SET path = 'goods-statistics' WHERE path = 'goodsStatistics';
UPDATE li_store_menu SET path = 'order-statistics' WHERE path = 'orderStatistics';
UPDATE li_store_menu SET path = 'traffic-statistics' WHERE path = 'trafficStatistics';
UPDATE li_store_menu SET path = 'ship-template' WHERE path = 'shipTemplate';
UPDATE li_store_menu SET path = 'shop-setting' WHERE path = 'shopSetting';
UPDATE li_store_menu SET path = 'shop-address' WHERE path = 'shopAddress';
UPDATE li_store_menu SET path = 'clerk-manage' WHERE path = '\nclerkManage';
UPDATE li_store_menu SET path = 'store-department-manage' WHERE path = 'storeDepartmentManage';
UPDATE li_store_menu SET path = 'store-role-manage' WHERE path = 'storeRoleManage';
UPDATE li_store_menu SET path = 'floor-list' WHERE path = 'floorList';
UPDATE li_store_menu SET path = 'wap-list' WHERE path = 'wapList';
UPDATE li_store_menu SET path = 'forget-password' WHERE path = 'forgetPassword';

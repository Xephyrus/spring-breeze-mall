-- =============================================================================
-- li_store_menu.name 统一为 kebab-case（幂等）
--
-- 背景：前端路由名与菜单 name 一一对应（util.initRouterNode 直接拿 name 注册路由），
--       改名后必须同步数据库，否则动态路由注册的名字与代码里的 name 引用对不上。
--
-- 共 40 条；只用 UPDATE ... WHERE 旧值，可重复执行。
-- 用法：mysql -u root -p lilishop < backend/DB/store-menu-kebab-names.sql
-- =============================================================================

UPDATE li_store_menu SET name = 'procurement-stock-list' WHERE name = 'procurementStockList';
UPDATE li_store_menu SET name = 'procurement-purchase-order-list' WHERE name = 'procurementPurchaseOrderList';
UPDATE li_store_menu SET name = 'procurement-inbound-list' WHERE name = 'procurementInboundList';
UPDATE li_store_menu SET name = 'procurement-inventory-count-list' WHERE name = 'procurementInventoryCountList';
UPDATE li_store_menu SET name = 'procurement-damage-report-list' WHERE name = 'procurementDamageReportList';
UPDATE li_store_menu SET name = 'stock-warning-manage' WHERE name = 'stockWarningManage';
UPDATE li_store_menu SET name = 'alert-quantity-warn' WHERE name = 'alertQuantityWarn';
UPDATE li_store_menu SET name = 'stock-manage' WHERE name = 'stockManage';
UPDATE li_store_menu SET name = 'stock-outbound-list' WHERE name = 'stockOutboundList';
UPDATE li_store_menu SET name = 'stock-flow-list' WHERE name = 'stockFlowList';
UPDATE li_store_menu SET name = 'oss-manage' WHERE name = 'ossManage';
UPDATE li_store_menu SET name = 'order-verification' WHERE name = 'orderVerification';
UPDATE li_store_menu SET name = 'address-manage' WHERE name = 'addressManage';
UPDATE li_store_menu SET name = 'shop-info' WHERE name = 'shopInfo';
UPDATE li_store_menu SET name = 'data-report' WHERE name = 'dataReport';
UPDATE li_store_menu SET name = 'main' WHERE name = 'Main';
UPDATE li_store_menu SET name = 'order-list' WHERE name = 'orderList';
UPDATE li_store_menu SET name = 'member-comment' WHERE name = 'memberComment';
UPDATE li_store_menu SET name = 'return-goods-order' WHERE name = 'returnGoodsOrder';
UPDATE li_store_menu SET name = 'return-money-order' WHERE name = 'returnMoneyOrder';
UPDATE li_store_menu SET name = 'order-complaint' WHERE name = 'orderComplaint';
UPDATE li_store_menu SET name = 'store-bill' WHERE name = 'storeBill';
UPDATE li_store_menu SET name = 'live-goods' WHERE name = 'liveGoods';
UPDATE li_store_menu SET name = 'distribution-goods' WHERE name = 'distributionGoods';
UPDATE li_store_menu SET name = 'distribution-order' WHERE name = 'distributionOrder';
UPDATE li_store_menu SET name = 'goods-statistics' WHERE name = 'goodsStatistics';
UPDATE li_store_menu SET name = 'order-statistics' WHERE name = 'orderStatistics';
UPDATE li_store_menu SET name = 'traffic-statistics' WHERE name = 'trafficStatistics';
UPDATE li_store_menu SET name = 'ship-template' WHERE name = 'shipTemplate';
UPDATE li_store_menu SET name = 'shop-setting' WHERE name = 'shopSetting';
UPDATE li_store_menu SET name = 'shop-address' WHERE name = 'shopAddress';
UPDATE li_store_menu SET name = 'message-index' WHERE name = 'message_index';
UPDATE li_store_menu SET name = 'clerk-manage' WHERE name = '\nclerkManage';
UPDATE li_store_menu SET name = 'store-department-manage' WHERE name = 'storeDepartmentManage';
UPDATE li_store_menu SET name = 'store-role-manage' WHERE name = 'storeRoleManage';
UPDATE li_store_menu SET name = 'floor-list' WHERE name = 'floorList';
UPDATE li_store_menu SET name = 'wap-list' WHERE name = 'wapList';
UPDATE li_store_menu SET name = 'forget-password' WHERE name = 'forgetPassword';
UPDATE li_store_menu SET name = 'home-index' WHERE name = 'home_index';
UPDATE li_store_menu SET name = 'change-password' WHERE name = 'change_pass';

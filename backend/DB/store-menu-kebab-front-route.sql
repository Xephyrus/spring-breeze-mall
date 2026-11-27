-- =============================================================================
-- li_store_menu.front_route 统一为 kebab-case（幂等）
--
-- 背景：商家端 views/ 下的页面文件已统一 kebab-case，菜单表存的是视图相对路径，
--       因此必须同步，否则菜单点进去会空白（lazyLoading 找不到视图）。
--
-- 由 scripts 依据重命名映射生成；只用 UPDATE ... WHERE 旧值，可重复执行。
-- 用法：mysql -u root -p lilishop < backend/DB/store-menu-kebab-front-route.sql
--
-- 共 53 条
-- =============================================================================

UPDATE li_store_menu SET front_route = 'appointment/components/service-area-fence' WHERE front_route = 'appointment/components/ServiceAreaFence';
UPDATE li_store_menu SET front_route = 'appointment/components/system-form-field-preview' WHERE front_route = 'appointment/components/SystemFormFieldPreview';
UPDATE li_store_menu SET front_route = 'appointment/in-store-settings' WHERE front_route = 'appointment/inStoreSettings';
UPDATE li_store_menu SET front_route = 'appointment/on-site-settings' WHERE front_route = 'appointment/onSiteSettings';
UPDATE li_store_menu SET front_route = 'appointment/service-calendar' WHERE front_route = 'appointment/serviceCalendar';
UPDATE li_store_menu SET front_route = 'appointment/service-staff-list' WHERE front_route = 'appointment/serviceStaffList';
UPDATE li_store_menu SET front_route = 'appointment/system-form-designer' WHERE front_route = 'appointment/systemFormDesigner';
UPDATE li_store_menu SET front_route = 'appointment/system-form-list' WHERE front_route = 'appointment/systemFormList';
UPDATE li_store_menu SET front_route = 'appointment/work-order-list' WHERE front_route = 'appointment/workOrderList';
UPDATE li_store_menu SET front_route = 'distribution/data-json' WHERE front_route = 'distribution/dataJson';
UPDATE li_store_menu SET front_route = 'distribution/distribution-goods' WHERE front_route = 'distribution/distributionGoods';
UPDATE li_store_menu SET front_route = 'distribution/distribution-order' WHERE front_route = 'distribution/distributionOrder';
UPDATE li_store_menu SET front_route = 'forget-password' WHERE front_route = 'ForgetPassword';
UPDATE li_store_menu SET front_route = 'goods/card-key/card-key-pool' WHERE front_route = 'goods/card-key/cardKeyPool';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/alert-quantity' WHERE front_route = 'goods/goods-seller/alertQuantity';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/alert-quantity-warn' WHERE front_route = 'goods/goods-seller/alertQuantityWarn';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/components/appointment-publish-panel' WHERE front_route = 'goods/goods-seller/components/AppointmentPublishPanel';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/components/goods-import-dialog' WHERE front_route = 'goods/goods-seller/components/GoodsImportDialog';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/draft-goods' WHERE front_route = 'goods/goods-seller/draftGoods';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/goods-operation' WHERE front_route = 'goods/goods-seller/goodsOperation';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/goods-operation-first' WHERE front_route = 'goods/goods-seller/goodsOperationFirst';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/goods-operation-sec' WHERE front_route = 'goods/goods-seller/goodsOperationSec';
UPDATE li_store_menu SET front_route = 'goods/goods-seller/goods-operation-third' WHERE front_route = 'goods/goods-seller/goodsOperationThird';
UPDATE li_store_menu SET front_route = 'main' WHERE front_route = 'Main';
UPDATE li_store_menu SET front_route = 'member/member-comment' WHERE front_route = 'member/memberComment';
UPDATE li_store_menu SET front_route = 'order/after-order/order-complaint' WHERE front_route = 'order/after-order/orderComplaint';
UPDATE li_store_menu SET front_route = 'order/after-order/order-complaint-detail' WHERE front_route = 'order/after-order/orderComplaintDetail';
UPDATE li_store_menu SET front_route = 'order/after-order/return-goods-order' WHERE front_route = 'order/after-order/returnGoodsOrder';
UPDATE li_store_menu SET front_route = 'order/after-order/return-money-order' WHERE front_route = 'order/after-order/returnMoneyOrder';
UPDATE li_store_menu SET front_route = 'order/after-order/reurn-goods-order-detail' WHERE front_route = 'order/after-order/reurnGoodsOrderDetail';
UPDATE li_store_menu SET front_route = 'order/order/export-order-deliver' WHERE front_route = 'order/order/exportOrderDeliver';
UPDATE li_store_menu SET front_route = 'order/order/order-detail' WHERE front_route = 'order/order/orderDetail';
UPDATE li_store_menu SET front_route = 'order/order/order-list' WHERE front_route = 'order/order/orderList';
UPDATE li_store_menu SET front_route = 'order/order/order-verification' WHERE front_route = 'order/order/orderVerification';
UPDATE li_store_menu SET front_route = 'order/order/virtual-order-list' WHERE front_route = 'order/order/virtualOrderList';
UPDATE li_store_menu SET front_route = 'promotion/live/add-live' WHERE front_route = 'promotion/live/addLive';
UPDATE li_store_menu SET front_route = 'promotion/live/live-goods' WHERE front_route = 'promotion/live/liveGoods';
UPDATE li_store_menu SET front_route = 'shop/address-manage' WHERE front_route = 'shop/addressManage';
UPDATE li_store_menu SET front_route = 'shop/bill/account-statement-bill' WHERE front_route = 'shop/bill/accountStatementBill';
UPDATE li_store_menu SET front_route = 'shop/bill/bill-detail' WHERE front_route = 'shop/bill/billDetail';
UPDATE li_store_menu SET front_route = 'shop/bill/store-bill' WHERE front_route = 'shop/bill/storeBill';
UPDATE li_store_menu SET front_route = 'shop/floor-list' WHERE front_route = 'shop/floorList';
UPDATE li_store_menu SET front_route = 'shop/ship/ship-template' WHERE front_route = 'shop/ship/shipTemplate';
UPDATE li_store_menu SET front_route = 'shop/shop-address' WHERE front_route = 'shop/shopAddress';
UPDATE li_store_menu SET front_route = 'shop/shop-info' WHERE front_route = 'shop/shopInfo';
UPDATE li_store_menu SET front_route = 'shop/shop-setting' WHERE front_route = 'shop/shopSetting';
UPDATE li_store_menu SET front_route = 'shop/system/clerk/clerk-manage' WHERE front_route = 'shop/system/clerk/clerkManage';
UPDATE li_store_menu SET front_route = 'shop/system/department/store-department-manage' WHERE front_route = 'shop/system/department/storeDepartmentManage';
UPDATE li_store_menu SET front_route = 'shop/system/role/store-role-manage' WHERE front_route = 'shop/system/role/storeRoleManage';
UPDATE li_store_menu SET front_route = 'shop/wap/wap-list' WHERE front_route = 'shop/wap/wapList';
UPDATE li_store_menu SET front_route = 'statistics/order/order-detail' WHERE front_route = 'statistics/order/orderDetail';
UPDATE li_store_menu SET front_route = 'statistics/order/refund-order' WHERE front_route = 'statistics/order/refundOrder';
UPDATE li_store_menu SET front_route = 'sys/oss-manage/oss-manage' WHERE front_route = 'sys/oss-manage/ossManage';

UPDATE li_store_menu SET front_route = 'order/receipt-manager/receipt' WHERE front_route = 'order/receiptManager/receipt';

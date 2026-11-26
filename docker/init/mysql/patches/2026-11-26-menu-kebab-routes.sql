-- =============================================================================
-- 菜单 front_route 与前端文件命名规范对齐（camelCase / PascalCase → kebab-case）
--
-- 背景：apps/manager 的视图文件统一改为 kebab-case
--       例：distributionCash.vue → distribution-cash.vue
--           LotteryManage.vue    → lottery-manage.vue
--       后端菜单 li_menu.front_route 存的是「视图文件路径」，必须同步，
--       否则菜单点进去是空白页。
--
-- 生成时间：2026-11-26
-- 幂等性：每条 UPDATE 都带 WHERE front_route = 旧值，重复执行无副作用。
-- 执行时机：在 docker/init/mysql/lilishop.sql 之后（或对已运行库直接执行）。
--
-- 影响行数：38（li_menu）。另有若干菜单的 front_route 未变（本来就是 kebab），
--   以及 15 条无法直接命中文件的，已确认由前端 VIEW_ALIASES 映射或
--   DEPRECATED_FRONT_ROUTES 跳过，无需改动。
-- =============================================================================
UPDATE li_menu SET front_route = 'procurement/reason/reason-manage' WHERE id = 102162342145425438 AND front_route = 'procurement/reason/reasonManage';
UPDATE li_menu SET front_route = 'promotions/lottery/lottery-manage' WHERE id = 102162342145425439 AND front_route = 'promotions/lottery/LotteryManage';
UPDATE li_menu SET front_route = 'sys/setting-manage/setting-manage' WHERE id = 1349246048900243456 AND front_route = 'sys/setting-manage/settingManage';
UPDATE li_menu SET front_route = 'sys/oss-manage/oss-manage' WHERE id = 1349246347597602816 AND front_route = 'sys/oss-manage/ossManage';
UPDATE li_menu SET front_route = 'sys/setting-manage/setting-manage' WHERE id = 1349246896661356544 AND front_route = 'sys/setting-manage/settingManage';
UPDATE li_menu SET front_route = 'sys/setting-manage/setting-manage' WHERE id = 1349247081504333824 AND front_route = 'sys/setting-manage/settingManage';
UPDATE li_menu SET front_route = 'sys/user-manage/user-manage' WHERE id = 1349254815809298432 AND front_route = 'sys/user-manage/userManage';
UPDATE li_menu SET front_route = 'sys/department-manage/department-manage' WHERE id = 1349255214977015808 AND front_route = 'sys/department-manage/departmentManage';
UPDATE li_menu SET front_route = 'sys/role-manage/role-manage' WHERE id = 1349255404425338880 AND front_route = 'sys/role-manage/roleManage';
UPDATE li_menu SET front_route = 'sys/log-manage/log-manage' WHERE id = 1349256082979840000 AND front_route = 'sys/log-manage/logManage';
UPDATE li_menu SET front_route = 'sys/app-version/app-version' WHERE id = 1357584224760102912 AND front_route = 'sys/app-version/appVersion';
UPDATE li_menu SET front_route = 'sys/menu-manage/menu-manage' WHERE id = 1357873097859923969 AND front_route = 'sys/menu-manage/menuManage';
UPDATE li_menu SET front_route = 'member/advance/wallet-log' WHERE id = 1367042664410644480 AND front_route = 'member/advance/walletLog';
UPDATE li_menu SET front_route = 'member/advance/withdraw-apply' WHERE id = 1367042804944994305 AND front_route = 'member/advance/withdrawApply';
UPDATE li_menu SET front_route = 'order/order/order-list' WHERE id = 1367043642379730944 AND front_route = 'order/order/orderList';
UPDATE li_menu SET front_route = 'order/after-order/after-sale-order' WHERE id = 1367043980407078912 AND front_route = 'order/after-order/afterSaleOrder';
UPDATE li_menu SET front_route = 'order/after-order/order-complaint' WHERE id = 1367044121163726848 AND front_route = 'order/after-order/orderComplaint';
UPDATE li_menu SET front_route = 'order/after-order/after-sale' WHERE id = 1367044247978508288 AND front_route = 'order/after-order/afterSale';
UPDATE li_menu SET front_route = 'goods/goods-info/goods-apply' WHERE id = 1367045630710513664 AND front_route = 'goods/goods-info/goodsApply';
UPDATE li_menu SET front_route = 'seller/shop/shop-list' WHERE id = 1367048832210173952 AND front_route = 'seller/shop/shopList';
UPDATE li_menu SET front_route = 'seller/shop/shop-audit-list' WHERE id = 1367048967635861504 AND front_route = 'seller/shop/shopAuditList';
UPDATE li_menu SET front_route = 'page-decoration/floor-list' WHERE id = 1367050530030878720 AND front_route = 'page-decoration/floorList';
UPDATE li_menu SET front_route = 'page-decoration/wap/wap-list' WHERE id = 1367050673312497664 AND front_route = 'page-decoration/wap/wapList';
UPDATE li_menu SET front_route = 'page/article-manage/hot-words' WHERE id = 1367050829697122304 AND front_route = 'page/article-manage/hotWords';
UPDATE li_menu SET front_route = 'page/article-manage/article-category' WHERE id = 1367050939084570624 AND front_route = 'page/article-manage/ArticleCategory';
UPDATE li_menu SET front_route = 'page/article-manage/article-list' WHERE id = 1367051048232943616 AND front_route = 'page/article-manage/articleList';
UPDATE li_menu SET front_route = 'order/flow/payment-log' WHERE id = 1372808148565360640 AND front_route = 'order/flow/paymentLog';
UPDATE li_menu SET front_route = 'order/flow/refund-log' WHERE id = 1372808352295288832 AND front_route = 'order/flow/refundLog';
UPDATE li_menu SET front_route = 'seller/bill/account-statement-bill' WHERE id = 1373791578371391488 AND front_route = 'seller/bill/accountStatementBill';
UPDATE li_menu SET front_route = 'distribution/distribution-setting' WHERE id = 1374177618072436736 AND front_route = 'distribution/distributionSetting';
UPDATE li_menu SET front_route = 'distribution/distribution-goods' WHERE id = 1374177789581721600 AND front_route = 'distribution/distributionGoods';
UPDATE li_menu SET front_route = 'distribution/distribution-order' WHERE id = 1374177910411231232 AND front_route = 'distribution/distributionOrder';
UPDATE li_menu SET front_route = 'sys/message/notice-message-template' WHERE id = 1376450662098796544 AND front_route = 'sys/message/noticeMessageTemplate';
UPDATE li_menu SET front_route = 'distribution/distribution-cash' WHERE id = 1410862675914764290 AND front_route = 'distribution/distributionCash';
UPDATE li_menu SET front_route = 'distribution/distribution-grade' WHERE id = 1495665663207432193 AND front_route = 'distribution/distributionGrade';
UPDATE li_menu SET front_route = 'finance/wallet-log' WHERE id = 1996010100000000006 AND front_route = 'finance/walletLog';
UPDATE li_menu SET front_route = 'member/benefit/benefit-delivery-records' WHERE id = 2121558191760000006 AND front_route = 'member/benefit/BenefitDeliveryRecords';
UPDATE li_menu SET front_route = 'order/wechat/order-list' WHERE id = 2121900000000000001 AND front_route = 'order/wechat/orderList';


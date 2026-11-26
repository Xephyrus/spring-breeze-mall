-- =============================================================================
-- 菜单 name / path 统一 kebab-case（阶段 2）
--
-- 背景：路由 name 与 path 里仍混用 camelCase / 下划线，例如
--   name=orderList / path=pcFloor / name=home_index
--   统一为 kebab-case：order-list / pc-floor / home-index
--
-- 生成时间：2026-11-26
-- 幂等性：UPDATE 带 WHERE 旧值，重复执行无副作用。
-- 执行时机：在 docker/init/mysql/lilishop.sql 之后。
--
-- 影响：li_menu 的 name（71 条规则）、path（57 条规则）。
-- 注意：前端已同步修改 router.push({ name }) / removeTag() / firstRouterName，
--       若只改库不改前端会出现「菜单点了没反应」。
-- =============================================================================
-- 菜单 name / path 统一 kebab-case（阶段 2）
-- 生成时间：2026-11-26
-- 幂等：UPDATE 带 WHERE 旧值

UPDATE li_menu SET name = 'stock-reason-manage' WHERE name = 'stockReasonManage';
UPDATE li_menu SET name = 'manager-goods-group' WHERE name = 'managerGoodsGroup';
UPDATE li_menu SET name = 'overview-statistics' WHERE name = 'overviewStatistics';
UPDATE li_menu SET name = 'points-statistics' WHERE name = 'pointsStatistics';
UPDATE li_menu SET name = 'deposit-statistics' WHERE name = 'depositStatistics';
UPDATE li_menu SET name = 'marketing-statistics' WHERE name = 'marketingStatistics';
UPDATE li_menu SET name = 'distribution-statistics' WHERE name = 'distributionStatistics';
UPDATE li_menu SET name = 'data-report' WHERE name = 'dataReport';
UPDATE li_menu SET name = 'auth-login' WHERE name = 'authLogin';
UPDATE li_menu SET name = 'sensitive-words' WHERE name = 'sensitiveWords';
UPDATE li_menu SET name = 'app-version' WHERE name = 'appVersion';
UPDATE li_menu SET name = 'menu-manage' WHERE name = 'menuManage';
UPDATE li_menu SET name = 'member-list' WHERE name = 'memberList';
UPDATE li_menu SET name = 'member-recycle' WHERE name = 'memberRecycle';
UPDATE li_menu SET name = 'wallet-log' WHERE name = 'walletLog';
UPDATE li_menu SET name = 'withdraw-apply' WHERE name = 'withdrawApply';
UPDATE li_menu SET name = 'goods-review' WHERE name = 'goodsReview';
UPDATE li_menu SET name = 'order-list' WHERE name = 'orderList';
UPDATE li_menu SET name = 'after-sale-order' WHERE name = 'afterSaleOrder';
UPDATE li_menu SET name = 'order-complaint' WHERE name = 'orderComplaint';
UPDATE li_menu SET name = 'after-sale-reason' WHERE name = 'afterSaleReason';
UPDATE li_menu SET name = 'goods-manager' WHERE name = 'goodsManager';
UPDATE li_menu SET name = 'manager-goods' WHERE name = 'managerGoods';
UPDATE li_menu SET name = 'apply-goods' WHERE name = 'applyGoods';
UPDATE li_menu SET name = 'goods-category' WHERE name = 'goodsCategory';
UPDATE li_menu SET name = 'goods-brand' WHERE name = 'goodsBrand';
UPDATE li_menu SET name = 'goods-spec' WHERE name = 'goodsSpec';
UPDATE li_menu SET name = 'goods-unit' WHERE name = 'goodsUnit';
UPDATE li_menu SET name = 'shop-manager' WHERE name = 'shopManager';
UPDATE li_menu SET name = 'shop-list' WHERE name = 'shopList';
UPDATE li_menu SET name = 'shop-auth' WHERE name = 'shopAuth';
UPDATE li_menu SET name = 'bill-list' WHERE name = 'billList';
UPDATE li_menu SET name = 'promotions-manager' WHERE name = 'promotionsManager';
UPDATE li_menu SET name = 'pc-floor' WHERE name = 'pcFloor';
UPDATE li_menu SET name = 'wap-list' WHERE name = 'wapList';
UPDATE li_menu SET name = 'hot-key-word' WHERE name = 'hotKeyWord';
UPDATE li_menu SET name = 'article-list' WHERE name = 'articleList';
UPDATE li_menu SET name = 'member-statistics' WHERE name = 'memberStatistics';
UPDATE li_menu SET name = 'order-statistics' WHERE name = 'orderStatistics';
UPDATE li_menu SET name = 'goods-statistics' WHERE name = 'goodsStatistics';
UPDATE li_menu SET name = 'traffic-statistics' WHERE name = 'trafficStatistics';
UPDATE li_menu SET name = 'payment-log' WHERE name = 'paymentLog';
UPDATE li_menu SET name = 'refund-log' WHERE name = 'refundLog';
UPDATE li_menu SET name = 'account-statement-bill' WHERE name = 'accountStatementBill';
UPDATE li_menu SET name = 'distribution-manager' WHERE name = 'distributionManager';
UPDATE li_menu SET name = 'distribution-setting' WHERE name = 'distributionSetting';
UPDATE li_menu SET name = 'distribution-goods' WHERE name = 'distributionGoods';
UPDATE li_menu SET name = 'distribution-order' WHERE name = 'distributionOrder';
UPDATE li_menu SET name = 'notice-message-template' WHERE name = 'noticeMessageTemplate';
UPDATE li_menu SET name = 'live-manage' WHERE name = 'liveManage';
UPDATE li_menu SET name = 'point-manage' WHERE name = 'pointManage';
UPDATE li_menu SET name = 'distribution-cash' WHERE name = 'distributionCash';
UPDATE li_menu SET name = 'custom-words' WHERE name = 'customWords';
UPDATE li_menu SET name = 'distribution-grade' WHERE name = 'distributionGrade';
UPDATE li_menu SET name = 'finance-center' WHERE name = 'financeCenter';
UPDATE li_menu SET name = 'timed-task' WHERE name = 'timedTask';
UPDATE li_menu SET name = 'paid-member-manage' WHERE name = 'paidMemberManage';
UPDATE li_menu SET name = 'wechat-order-list' WHERE name = 'wechatOrderList';
UPDATE li_menu SET name = 'wechat-order-manage' WHERE name = 'wechatOrderManage';
UPDATE li_menu SET name = 'other-router' WHERE name = 'otherRouter';
UPDATE li_menu SET name = 'message-template' WHERE name = 'messageTemplate';
UPDATE li_menu SET name = 'home-index' WHERE name = 'home_index';
UPDATE li_menu SET name = 'change-password' WHERE name = 'change_password';
UPDATE li_menu SET name = 'add-kan-jia-activity-goods' WHERE name = 'add-kanJia-activity-goods';
UPDATE li_menu SET name = 'edit-kan-jia-activity-goods' WHERE name = 'edit-kanJia-activity-goods';
UPDATE li_menu SET name = 'store-performance-report' WHERE name = 'storePerformanceReport';
UPDATE li_menu SET name = 'goods-comparison-report' WHERE name = 'goodsComparisonReport';
UPDATE li_menu SET name = 'sales-order-detail-report' WHERE name = 'salesOrderDetailReport';
UPDATE li_menu SET name = 'goods-sales-summary-report' WHERE name = 'goodsSalesSummaryReport';
UPDATE li_menu SET name = 'distribution-import-record' WHERE name = 'distributionImportRecord';
UPDATE li_menu SET name = 'distribution-grade-history' WHERE name = 'distributionGradeHistory';

UPDATE li_menu SET path = 'stock-reason-manage' WHERE path = 'stockReasonManage';
UPDATE li_menu SET path = 'overview-statistics' WHERE path = 'overviewStatistics';
UPDATE li_menu SET path = 'points-statistics' WHERE path = 'pointsStatistics';
UPDATE li_menu SET path = 'deposit-statistics' WHERE path = 'depositStatistics';
UPDATE li_menu SET path = 'marketing-statistics' WHERE path = 'marketingStatistics';
UPDATE li_menu SET path = 'distribution-statistics' WHERE path = 'distributionStatistics';
UPDATE li_menu SET path = 'data-report' WHERE path = 'dataReport';
UPDATE li_menu SET path = 'auth-login' WHERE path = 'authLogin';
UPDATE li_menu SET path = 'sensitive-words' WHERE path = 'sensitiveWords';
UPDATE li_menu SET path = 'app-version' WHERE path = 'appVersion';
UPDATE li_menu SET path = 'member-list' WHERE path = 'memberList';
UPDATE li_menu SET path = 'member-recycle' WHERE path = 'memberRecycle';
UPDATE li_menu SET path = 'wallet-log' WHERE path = 'walletLog';
UPDATE li_menu SET path = 'withdraw-apply' WHERE path = 'withdrawApply';
UPDATE li_menu SET path = 'goods-review' WHERE path = 'goodsReview';
UPDATE li_menu SET path = 'order-list' WHERE path = 'orderList';
UPDATE li_menu SET path = 'after-sale-order' WHERE path = 'afterSaleOrder';
UPDATE li_menu SET path = 'order-complaint' WHERE path = 'orderComplaint';
UPDATE li_menu SET path = 'after-sale-reason' WHERE path = 'afterSaleReason';
UPDATE li_menu SET path = 'manager-goods' WHERE path = 'managerGoods';
UPDATE li_menu SET path = 'apply-goods' WHERE path = 'applyGoods';
UPDATE li_menu SET path = 'goods-category' WHERE path = 'goodsCategory';
UPDATE li_menu SET path = 'goods-brand' WHERE path = 'goodsBrand';
UPDATE li_menu SET path = 'goods-spec' WHERE path = 'goodsSpec';
UPDATE li_menu SET path = 'goods-unit' WHERE path = 'goodsUnit';
UPDATE li_menu SET path = 'shop-list' WHERE path = 'shopList';
UPDATE li_menu SET path = 'shop-auth' WHERE path = 'shopAuth';
UPDATE li_menu SET path = 'bill-list' WHERE path = 'billList';
UPDATE li_menu SET path = 'pc-floor' WHERE path = 'pcFloor';
UPDATE li_menu SET path = 'wap-list' WHERE path = 'wapList';
UPDATE li_menu SET path = 'hot-key-word' WHERE path = 'hotKeyWord';
UPDATE li_menu SET path = 'article-list' WHERE path = 'articleList';
UPDATE li_menu SET path = 'member-statistics' WHERE path = 'memberStatistics';
UPDATE li_menu SET path = 'order-statistics' WHERE path = 'orderStatistics';
UPDATE li_menu SET path = 'goods-statistics' WHERE path = 'goodsStatistics';
UPDATE li_menu SET path = 'traffic-statistics' WHERE path = 'trafficStatistics';
UPDATE li_menu SET path = 'payment-log' WHERE path = 'paymentLog';
UPDATE li_menu SET path = 'refund-log' WHERE path = 'refundLog';
UPDATE li_menu SET path = 'account-statement-bill' WHERE path = 'accountStatementBill';
UPDATE li_menu SET path = 'distribution-setting' WHERE path = 'distributionSetting';
UPDATE li_menu SET path = 'distribution-goods' WHERE path = 'distributionGoods';
UPDATE li_menu SET path = 'distribution-order' WHERE path = 'distributionOrder';
UPDATE li_menu SET path = 'notice-message-template' WHERE path = 'noticeMessageTemplate';
UPDATE li_menu SET path = 'distribution-cash' WHERE path = 'distributionCash';
UPDATE li_menu SET path = 'custom-words' WHERE path = 'customWords';
UPDATE li_menu SET path = 'distribution-grade' WHERE path = 'distributionGrade';
UPDATE li_menu SET path = 'theme-setting' WHERE path = 'themeSetting';
UPDATE li_menu SET path = 'category-setting' WHERE path = 'categorySetting';
UPDATE li_menu SET path = 'wechat-order-list' WHERE path = 'wechatOrderList';
UPDATE li_menu SET path = '/floor-list/main' WHERE path = '/floorList/main';
UPDATE li_menu SET path = '/floor-list/renovation' WHERE path = '/floorList/renovation';
UPDATE li_menu SET path = 'message-template' WHERE path = 'messageTemplate';
UPDATE li_menu SET path = 'goods/goods-info/goods-detail' WHERE path = 'goods/goods-info/goodsDetail';
UPDATE li_menu SET path = 'promotions/add-kan-jia-activity-goods' WHERE path = 'promotions/add-kanJia-activity-goods';
UPDATE li_menu SET path = 'promotions/edit-kan-jia-activity-goods' WHERE path = 'promotions/edit-kanJia-activity-goods';
UPDATE li_menu SET path = 'distribution-import-record' WHERE path = 'distributionImportRecord';
UPDATE li_menu SET path = 'distribution-grade-history' WHERE path = 'distributionGradeHistory';


# VO 契约文档（前端类型 → 后端返回）

> 本文件由 `scripts/gen-vo-contracts.mjs` 从代码自动生成，**不要手改**（改代码后重新生成）。
> 生成时间：2026/11/26 19:08:33

## 这份文档解决什么问题

接口返回什么、页面依赖哪些字段、哪些字段后端可能不返回 —— 过去只散落在代码里。
这里把它固化成一张表：**字段名 / 类型 / 是否必填 / 被哪个接口返回 / 被哪些页面使用**。

## 使用约定

| 约定 | 说明 |
|---|---|
| 字段默认可选 | 后端 DTO 扩容会漏字段，声明为 `?` 可避免页面直接崩 |
| `[key: string]: unknown` | 保留后端新增字段的入口；要读新字段时**就地断言**，不要把整个对象退回 `any` |
| 数字/金额可能是字符串 | 后端 `BigDecimal` 序列化后是字符串，声明为 `number \| string` |
| 枚举是字符串 | 状态类字段（orderStatus 等）是后端枚举 `name()`，不要写成联合字面量 |

## 一、总览

| 类型 | 模块 | 字段数 | 被接口使用 | 被页面使用 | 备注 |
|---|---|---:|---|---|---|
| `CategoryNode` | common | 10 | — | 7 个 |  |
| `DepartmentNode` | common | 7 | — | 1 个 |  |
| `MenuNode` | common | 15 | — | 1 个 |  |
| `PageRows` | common | 5 | 65 个 | — |  |
| `RegionNode` | common | 4 | — | 1 个 |  |
| `DistributionRow` | distribution | 6 | — | 1 个 |  |
| `GradeOption` | distribution | 6 | 1 个 | 1 个 |  |
| `RelationLog` | distribution | 5 | 1 个 | 1 个 |  |
| `RelationRow` | distribution | 14 | 2 个 | 1 个 |  |
| `GoodsGroupInfo` | goods | 3 | 1 个 | — |  |
| `GoodsNumVO` | goods | 4 | 1 个 | — |  |
| `GoodsParameterRow` | goods | 5 | 1 个 | — |  |
| `GoodsParamsDTO` | goods | 1 | 1 个 | — |  |
| `OrderOverviewVO` | goods | 12 | 1 个 | — |  |
| `LiveCouponRow` | live | 5 | 1 个 | 1 个 |  |
| `LiveDetail` | live | 12 | — | 1 个 |  |
| `LiveGoodsRow` | live | 20 | 1 个 | 1 个 |  |
| `MemberAddressRow` | member | 7 | — | 1 个 |  |
| `MemberEvaluation` | member | 9 | 1 个 | — |  |
| `MemberGradeInfo` | member | 4 | 1 个 | — |  |
| `MemberGroupInfo` | member | 3 | 1 个 | — |  |
| `MemberInfo` | member | 15 | 1 个 | 1 个 |  |
| `MemberPointsStatistics` | member | 3 | 1 个 | — |  |
| `MemberWallet` | member | 3 | 1 个 | 1 个 |  |
| `BrandItem` | misc | 2 | 1 个 | 2 个 |  |
| `ChartRow` | misc | 8 | — | 1 个 |  |
| `AfterSaleDetail` | order | 13 | 2 个 | — |  |
| `LogisticsTrace` | order | 3 | 1 个 | — |  |
| `OrderAllowOperation` | order | 6 | — | — |  |
| `OrderComplainDetail` | order | 5 | 1 个 | — |  |
| `OrderCountVO` | order | 4 | 2 个 | — |  |
| `OrderDetail` | order | 11 | 1 个 | — |  |
| `OrderInfo` | order | 40 | — | — |  |
| `OrderItemInfo` | order | 21 | — | — |  |
| `OrderLogInfo` | order | 6 | — | — |  |
| `OrderReceipt` | order | 4 | — | — |  |
| `StoreAfterSaleAddress` | order | 4 | 1 个 | — |  |
| `ArticleForm` | page | 6 | — | 1 个 |  |
| `PageDataDetail` | page | 6 | 2 个 | — |  |
| `DamageDetail` | procurement | 12 | 1 个 | 1 个 |  |
| `DamageItem` | procurement | 5 | 1 个 | 1 个 |  |
| `InboundDetail` | procurement | 4 | 1 个 | — |  |
| `InboundItem` | procurement | 1 | 1 个 | 1 个 |  |
| `BillDetail` | seller | 25 | 2 个 | 1 个 |  |
| `BillFlowRow` | seller | 6 | 1 个 | 1 个 |  |

## 二、按模块明细

### common

#### `CategoryNode`

跨模块共用的 VO 类型。 起因：`CategoryNode` 在 10 个文件里各写了一遍（字段还不完全一致）， api 层因此无法 import，也就无法给 `getCategoryTree` 标返回类型。 这里给出唯一权威定义，各页面改为 import。

**被这些页面使用**：`components/lili-dialog/goods-dialog.vue`、`components/lili-dialog/template/category.vue`、`components/lili-dialog/template/pages.vue`、`views/goods/goods-manage/parameter-edit.vue`、`views/page-decoration/pc/config-panel/PanelGoods.vue`、`views/promotions/payment-success/index.vue`、`views/seller/shop/shopDetail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `name` | `string` |  |  |
| `articleCategoryName` | `string` |  |  |
| `level` | `number` |  |  |
| `parentId` | `string \| number` |  |  |
| `sortOrder` | `number` |  |  |
| `commissionRate` | `number` |  |  |
| `deleteFlag` | `boolean \| number` |  |  |
| `image` | `string` |  |  |
| `children` | `CategoryNode[]` |  |  |

#### `DepartmentNode`

部门树节点

**被这些页面使用**：`views/sys/department-manage/departmentManage.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `title` | `string` |  |  |
| `name` | `string` |  |  |
| `parentId` | `string \| number` |  |  |
| `sortOrder` | `number` |  |  |
| `status` | `number` |  |  |
| `children` | `DepartmentNode[]` |  |  |

#### `MenuNode`

菜单 / 权限节点

**被这些页面使用**：`views/sys/menu-manage/menu.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `title` | `string` |  |  |
| `name` | `string` |  |  |
| `path` | `string` |  |  |
| `parentId` | `string \| number` |  |  |
| `sortOrder` | `number` |  |  |
| `level` | `number` |  |  |
| `permission` | `string` |  |  |
| `icon` | `string` |  |  |
| `frontRoute` | `string` |  |  |
| `frontComponent` | `string` |  |  |
| `buttonType` | `string` |  |  |
| `updateTime` | `string` |  |  |
| `selected` | `boolean` |  |  |
| `children` | `MenuNode[]` |  |  |

#### `PageRows`

通用分页返回

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getManagerWorkOrderPage` | `/appointment/work-orders` | `PageRows` |
| `getDistributionListData` | `/distribution/distribution/getByPage` | `PageRows` |
| `getDistributionMemberPage` | `/distribution/distribution/memberPage` | `PageRows` |
| `importDistributionMembers` | `/distribution/memberImport/batch` | `PageRows` |
| `getDistributionImportItems` | `/distribution/memberImport/batch/${batchId}/items` | `PageRows` |
| `getDistributionOverviewV2` | `/statistics/distribution/v2/behavior` | `PageRows` |
| `getDistributionGoodsV2` | `/statistics/distribution/v2/goods` | `PageRows` |
| `getDistributionWalletLogs` | `/distribution/order/getByPage` | `PageRows` |
| `getDistributionGoods` | `/distribution/goods/getByPage` | `PageRows` |
| `auditDistributionGoods` | `/distribution/cash/getByPage` | `PageRows` |
| `getManagerBrandPage` | `/goods/brand/getByPage` | `PageRows` |
| `getGoodsSkuData` | `/goods/goods/sku/list` | `PageRows` |
| `getGoodsListData` | `/goods/goodsGroup/getByPage` | `PageRows` |
| `getAuthGoodsListData` | `/goods/goods/auth/list` | `PageRows` |
| `statisticsOrderList` | `/statistics/order/order` | `PageRows` |
| `statisticsOrderRefundList` | `/statistics/order/refund` | `PageRows` |
| `goodsCategoryStatistics` | `/statistics/goods/getCategoryByPage` | `PageRows` |
| `goodsStatistics` | `/statistics/refund/order/getByPage` | `PageRows` |
| `getUserListData` | `/passport/user/getByCondition` | `PageRows` |
| `resetPassword` | `/other/customWords/page` | `PageRows` |
| `queryLiveMessagePage` | `/live/message/page` | `PageRows` |
| `postSendMessage` | `/live/user/page` | `PageRows` |
| `blockUser` | `/live/order/page` | `PageRows` |
| `getLogisticsPage` | `/other/logistics/getByPage` | `PageRows` |
| `getMember` | `/member/getByPage` | `PageRows` |
| `getMemberReview` | `/member/evaluation/getByPage` | `PageRows` |
| `getMemberStatistics` | `/statistics/view/list` | `PageRows` |
| `getMemberNum` | `/member/memberPointsHistory/getByPage` | `PageRows` |
| `getMemberAddressData` | `/member/address/${id}` | `PageRows` |
| `getMemberGroupByPage` | `/member/memberGroup/getByPage` | `PageRows` |
| `deleteMemberGroup` | `/member/memberGroup/${groupId}/users` | `PageRows` |
| `getMemberGradeByPage` | `/member/memberGrade/getByPage` | `PageRows` |
| `getMemberExperienceByPage` | `/member/memberGrade/experience/getByPage` | `PageRows` |
| `getMemberBenefitByPage` | `/member/benefit/getByPage` | `PageRows` |
| `getAfterSaleReasonPage` | `/order/afterSaleReason/getByPage` | `PageRows` |
| `retryWechatOrder` | `/order/order/wechat/${encodeURIComponent(sn)}/logs` | `PageRows` |
| `getOrderLog` | `/orderLog/getByPage` | `PageRows` |
| `getAfterSaleOrderPage` | `/order/afterSale/page` | `PageRows` |
| `getHomeList` | `/other/pageData/pageDataList` | `PageRows` |
| `getShopMessage` | `/other/feedback` | `PageRows` |
| `getNavigationData` | `/siteNavigation/getByPage` | `PageRows` |
| `getFocusData` | `/focus/getByPage` | `PageRows` |
| `getPageData` | `/page/get/${id}` | `PageRows` |
| `getProcurementOrderPage` | `/procurement/order` | `PageRows` |
| `getProcurementInboundPage` | `/procurement/inbound` | `PageRows` |
| `getInventoryCountPage` | `/procurement/inventory-count/page` | `PageRows` |
| `getInventoryCountItemsPage` | `/procurement/inventory-count/${id}/items/page` | `PageRows` |
| `getDamageReportPage` | `/procurement/damage-report/page` | `PageRows` |
| `getPromotionSeckill` | `/promotion/seckill/apply` | `PageRows` |
| `getPintuanList` | `/promotion/pintuan/goods/${params.pintuanId}` | `PageRows` |
| `getMemberReceiveCouponList` | `/promotion/coupon/member/${id}` | `PageRows` |
| `getCouponActivity` | `/promotion/seckill/apply` | `PageRows` |
| `getCouponReceiveList` | `/promotion/coupon/received` | `PageRows` |
| `getGiftCardCashActivityPage` | `/promotion/giftCardCash/activity` | `PageRows` |
| `giftCardCashIssueImportByActivity` | `/promotion/giftCardCash/createBatch` | `PageRows` |
| `getGiftCardCashIssueBatchPage` | `/promotion/giftCardCash/issueBatch` | `PageRows` |
| `getGiftCardCashUsageRecordPage` | `/promotion/giftCardCash/usageRecord` | `PageRows` |
| `getGiftCardCashCredentialPage` | `/promotion/giftCardCash/credential` | `PageRows` |
| `getLogisticsList` | `/setting/logistics/getByPage` | `PageRows` |
| `getNoticeMessageDetail` | `/setting/messageTemplate/page` | `PageRows` |
| `getShopClerkPage` | `/store/store/clerk/${id}` | `PageRows` |
| `getStorePerformanceReport` | `/statistics/report/store-performance` | `PageRows` |
| `getGoodsComparisonReport` | `/statistics/report/goods-comparison` | `PageRows` |
| `getSalesOrderDetailReport` | `/statistics/report/sales-order-detail` | `PageRows` |
| `getGoodsSalesSummaryReport` | `/statistics/report/goods-sales-summary` | `PageRows` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `records` | `T[]` | ✅ |  |
| `total` | `number` | ✅ |  |
| `current` | `number` |  |  |
| `size` | `number` |  |  |
| `pages` | `number` |  |  |

#### `RegionNode`

地区节点（省/市/区）

**被这些页面使用**：`views/region/index.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `name` | `string` |  |  |
| `level` | `string` |  |  |
| `children` | `RegionNode[]` |  |  |

### distribution

#### `DistributionRow`

分销商行（列表）

**被这些页面使用**：`views/distribution/distribution.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `mobile` | `string` |  |  |
| `nickname` | `string` |  |  |
| `inviterMobile` | `string` |  |  |
| `gradeId` | `string \| number` |  |  |
| `distributionStatus` | `string` |  |  |

#### `GradeOption`

分销模块的 VO。 从 `views/distribution/*` 搬出来的，目的： 1. 同一类型不再在多处各写一遍 2. `api/distribution.ts` 能标注返回类型（见 apps/manager/API-TYPING-PLAN.md） / /** 分销等级选项 / 等级行

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getDistributionInviteCardSetting` | `/distribution/grade` | `GradeOption[]` |

**被这些页面使用**：`views/distribution/distribution.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` | ✅ |  |
| `value` | `string \| number` |  |  |
| `label` | `string` |  |  |
| `name` | `string` |  |  |
| `gradeName` | `string` |  |  |
| `sortOrder` | `number` |  |  |

#### `RelationLog`

客户关系变更日志

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getCustomerRelationLogs` | `/distribution/customerRelation/${id}/logs` | `RelationLog[]` |

**被这些页面使用**：`views/distribution/distributionCustomerRelation.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `action` | `string` |  |  |
| `reason` | `string` |  |  |
| `createTime` | `string` |  |  |
| `operatorName` | `string` |  |  |

#### `RelationRow`

分销商详情 */ export type DistributionDetail = DistributionRow & { gradeName?: string; joinTime?: string; validSalesAmount?: number | string | null; orderCount?: number | string | null; totalCustomerCount?: number | string | null; validCustomerCount?: number | string | null; inviteCount?: number | string | null; totalCommission?: number | string | null; goodsCommission?: number | string | null; inviteCommission?: number | string | null; promotionAmount?: number | string | null; selfPurchaseAmount?: number | string | null; }; /** 客户关系行

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getDistributionGradeHistoryPage` | `/distribution/customerRelation` | `{ records?: RelationRow[]; total?: number }` |
| `getCustomerRelationDetail` | `/distribution/customerRelation/${id}` | `RelationRow` |

**被这些页面使用**：`views/distribution/distributionCustomerRelation.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `memberId` | `string \| number` |  |  |
| `memberNickname` | `string` |  |  |
| `memberMobile` | `string` |  |  |
| `distributionId` | `string \| number` |  |  |
| `distributionNickname` | `string` |  |  |
| `distributionMobile` | `string` |  |  |
| `relationEffective` | `boolean` |  |  |
| `relationStatus` | `string` |  |  |
| `invalidTime` | `string` |  |  |
| `invalidReason` | `string` |  |  |
| `bindTime` | `string` |  |  |
| `hasDeadline` | `boolean` |  |  |
| `expireAt` | `string` |  |  |

### goods

#### `GoodsGroupInfo`

商品模块的 VO。 说明： - 商品本身用 shared 包的 `Goods`（已存在），这里只补**商品周边**的返回类型。 - 字段按后端 DTO/VO 的真实定义声明，并保留索引签名以兼容扩容。 / /** 商品分组

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getGoodsGroup` | `/goods/goodsGroup/get/${id}` | `GoodsGroupInfo` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `groupName` | `string` |  |  |
| `description` | `string` |  |  |

#### `GoodsNumVO`

商品数量统计（上架/下架/待审核/未通过）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getGoodsNumerData` | `/goods/goods/goodsNumber` | `GoodsNumVO` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `upperGoodsNum` | `number` |  |  |
| `downGoodsNum` | `number` |  |  |
| `auditGoodsNum` | `number` |  |  |
| `refuseGoodsNum` | `number` |  |  |

#### `GoodsParameterRow`

商品参数（按分类）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getParameterCategoryListData` | `/goods/parameters/category/${parameter_id}` | `GoodsParameterRow[]` |

**被这些 VO 嵌套引用**：`GoodsParamsDTO`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `paramName` | `string` |  |  |
| `categoryId` | `string \| number` |  |  |
| `required` | `boolean \| string \| number` |  |  |
| `value` | `unknown` |  |  |

#### `GoodsParamsDTO`

商品参数集合（GET /goods/parameters/{id} 返回）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getGoodsParamsPage` | `/goods/parameters/${id}` | `GoodsParamsDTO` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `categoryParameterList` | `GoodsParameterRow[]` |  |  |

#### `OrderOverviewVO`

订单概览统计（商品/订单报表页顶部）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getOrderChart` | `/statistics/order/overview` | `OrderOverviewVO` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `uvNum` | `number` |  |  |
| `orderNum` | `number` |  |  |
| `orderMemberNum` | `number` |  |  |
| `orderAmount` | `number` |  |  |
| `paymentOrderNum` | `number` |  |  |
| `paymentsNum` | `number` |  |  |
| `paymentAmount` | `number` |  |  |
| `refundOrderNum` | `number` |  |  |
| `refundOrderPrice` | `number` |  |  |
| `orderConversionRate` | `string` |  |  |
| `paymentsConversionRate` | `string` |  |  |
| `overallConversionRate` | `string` |  |  |

### live

#### `LiveCouponRow`

直播间已关联的优惠券行

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getLiveCouponList` | `/live/coupon/list/${liveId}` | `LiveCouponRow[]` |

**被这些页面使用**：`views/live/components/Coupon.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `couponId` | `string \| number` |  |  |
| `couponName` | `string` |  |  |
| `price` | `number \| string` |  |  |
| `promotionStatus` | `string` |  |  |

#### `LiveDetail`

直播模块的 VO。 从 `views/live/*` 搬出来的，目的： 1. 同一类型不再散落各页（`LiveDetail` 原本在 detail.vue / control-panel.vue 各一份） 2. `api/live.ts` 能标注返回类型 / /** 直播间详情

**被这些页面使用**：`views/live/detail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `title` | `string` |  |  |
| `storeName` | `string` |  |  |
| `streamerName` | `string` |  |  |
| `startTime` | `string \| number` |  |  |
| `endTime` | `string \| number` |  |  |
| `pushStreamServer` | `string` |  |  |
| `pushStreamCode` | `string` |  |  |
| `pullStreamUrl` | `string` |  |  |
| `streamUrl` | `string` |  |  |
| `coverImg` | `string` |  |  |
| `liveStatus` | `string` |  |  |
| `status` | `string` |  |  |

#### `LiveGoodsRow`

直播间商品行（li_live_goods + 商品字段）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getLiveGoodsList` | `/live/goods/list/${liveId}` | `LiveGoodsRow[]` |

**被这些页面使用**：`views/live/components/LiveGoods.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `skuId` | `string \| number` |  |  |
| `goodsId` | `string \| number` |  |  |
| `goodsName` | `string` |  |  |
| `thumbnail` | `string` |  |  |
| `price` | `number \| string` |  |  |
| `originPrice` | `number \| string` |  |  |
| `cost` | `number \| string` |  |  |
| `originalPrice` | `number \| string` |  |  |
| `quantity` | `number \| string` |  |  |
| `stock` | `number \| string` |  |  |
| `salesCount` | `number` |  |  |
| `buyCount` | `number` |  |  |
| `storeId` | `string \| number` |  |  |
| `storeName` | `string` |  |  |
| `sellPoint` | `string` |  |  |
| `sellingPoint` | `string` |  |  |
| `popularity` | `number` |  |  |
| `soldOutFlag` | `boolean` |  |  |
| `recommend` | `boolean` |  |  |

### member

#### `MemberAddressRow`

会员收货地址

**被这些页面使用**：`views/member/list/memberDetail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `name` | `string` |  |  |
| `mobile` | `string` |  |  |
| `consigneeAddressPath` | `string` |  |  |
| `consigneeAddressIdPath` | `string` |  |  |
| `detail` | `string` |  |  |
| `isDefault` | `number` |  |  |

#### `MemberEvaluation`

会员商品评价详情

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getMemberInfoReview` | `/member/evaluation/get/${id}` | `MemberEvaluation` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `goodsName` | `string` |  |  |
| `content` | `string` |  |  |
| `grade` | `number \| string` |  |  |
| `images` | `string[]` |  |  |
| `createTime` | `string` |  |  |
| `memberName` | `string` |  |  |
| `reply` | `string` |  |  |
| `status` | `string` |  |  |

#### `MemberGradeInfo`

会员等级

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getMemberGrade` | `/member/memberGrade/get/${id}` | `MemberGradeInfo` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `gradeName` | `string` |  |  |
| `gradePoint` | `number` |  |  |
| `benefitIds` | `Array<string \| number>` |  |  |

#### `MemberGroupInfo`

会员分组

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getMemberGroup` | `/member/memberGroup/get/${id}` | `MemberGroupInfo` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `groupName` | `string` |  |  |
| `remark` | `string` |  |  |

#### `MemberInfo`

会员模块的 VO。 从 `views/member/list/memberDetail.vue` 等页面搬出来的，目的： 1. 同一形状不再各写一遍 2. `api/member.ts` 的单实体接口能标注返回类型 / /** 会员信息（详情页展示字段）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getMemberListData` | `/passport/member/${id}` | `MemberInfo` |

**被这些页面使用**：`views/member/list/memberDetail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `mobile` | `string` |  |  |
| `nickName` | `string` |  |  |
| `username` | `string` |  |  |
| `gradeName` | `string` |  |  |
| `disabled` | `boolean \| string \| number` |  |  |
| `point` | `number` |  |  |
| `experience` | `number` |  |  |
| `face` | `string` |  |  |
| `createTime` | `string` |  |  |
| `lastLoginDate` | `string` |  |  |
| `birthday` | `string` |  |  |
| `sex` | `string \| number` |  |  |
| `region` | `string` |  |  |
| `regionId` | `string` |  |  |

#### `MemberPointsStatistics`

积分统计

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `queryMemberPointsStatistics` | `/member/memberPointsHistory/queryMemberPointsStatistics` | `MemberPointsStatistics` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `totalPoint` | `number` |  |  |
| `unUsedPoint` | `number` |  |  |
| `usedPoint` | `number` |  |  |

#### `MemberWallet`

会员钱包

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getMemberWallet` | `/wallet/wallet` | `MemberWallet` |

**被这些页面使用**：`views/member/list/memberDetail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `memberWallet` | `number` |  |  |
| `memberFrozenWallet` | `number` |  |  |
| `wallet` | `number` |  |  |

### misc

#### `BrandItem`

零散模块的共用 VO。 只收「多个页面用法一致」的类型；页面专属形状（积分商品表单、定时任务行、 商品分组行、直播统计、反馈详情、隐私协议）留在各自页面里 —— 强行合并会引入一堆用不到的字段，反而更容易写错。 / /** 品牌（下拉 / 列表用，多页共用）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getBrandListData` | `/goods/brand/all` | `BrandItem[]` |

**被这些页面使用**：`views/goods/goods-manage/category.vue`、`views/statistics/goods-comparison.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `name` | `string` |  |  |

#### `ChartRow`

首页 / 统计图表行（首页与数据报表共用）

**被这些页面使用**：`views/home/home.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `createTime` | `string` |  |  |
| `date` | `string` |  |  |
| `price` | `number \| string` |  |  |
| `title` | `string` |  |  |
| `num` | `number \| string` |  |  |
| `lastNum` | `number \| string` |  |  |
| `uvNum` | `number \| string` |  |  |
| `pvNum` | `number \| string` |  |  |

### order

#### `AfterSaleDetail`

售后单详情

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `afterSaleOrderDetail` | `/order/afterSale/${sn}` | `AfterSaleDetail` |
| `getAfterSaleOrderDetail` | `/order/afterSale/get/${sn}` | `AfterSaleDetail` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `sn` | `string` |  |  |
| `orderSn` | `string` |  |  |
| `serviceType` | `string` |  |  |
| `serviceStatus` | `string` |  |  |
| `serviceName` | `string` |  |  |
| `reason` | `string` |  |  |
| `afterSaleImage` | `string \| string[]` |  |  |
| `applyRefundPrice` | `number \| string` |  |  |
| `actualRefundPrice` | `number \| string` |  |  |
| `showDelivery` | `boolean` |  |  |
| `auditRemark` | `string` |  |  |
| `applyTime` | `string` |  |  |

#### `LogisticsTrace`

物流轨迹

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getAfterSaleTraces` | `/order/afterSale/getDeliveryTraces/${sn}` | `LogisticsTrace[]` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `time` | `string` |  |  |
| `context` | `string` |  |  |
| `status` | `string` |  |  |

#### `OrderAllowOperation`

订单可执行操作标记

**被这些 VO 嵌套引用**：`OrderDetail`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `canCancel` | `boolean` |  |  |
| `canPay` | `boolean` |  |  |
| `canDeliver` | `boolean` |  |  |
| `canComplete` | `boolean` |  |  |
| `canComment` | `boolean` |  |  |
| `canAfterSale` | `boolean` |  |  |

#### `OrderComplainDetail`

交易投诉详情

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getOrderComplain` | `/order/complain/${id}` | `OrderComplainDetail` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `complainStatus` | `string` |  |  |
| `orderSn` | `string` |  |  |
| `memberName` | `string` |  |  |
| `communicationList` | `Array<Record<string, unknown>>` |  |  |

#### `OrderCountVO`

订单/售后数量统计

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getOrderNum` | `/order/order/orderNum` | `OrderCountVO` |
| `getAfterSaleNumVO` | `/order/afterSale/afterSaleNumVO` | `OrderCountVO` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `waitPayNum` | `number` |  |  |
| `waitDeliveryNum` | `number` |  |  |
| `waitEvaluateNum` | `number` |  |  |
| `afterSaleNum` | `number` |  |  |

#### `OrderDetail`

订单详情（聚合）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `orderDetail` | `/order/order/${sn}` | `OrderDetail` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `order` | `OrderInfo` |  |  |
| `orderItems` | `OrderItemInfo[]` |  |  |
| `orderLogs` | `OrderLogInfo[]` |  |  |
| `receipt` | `OrderReceipt` |  |  |
| `allowOperationVO` | `OrderAllowOperation` |  |  |
| `priceDetail` | `Record<string, unknown>` |  |  |
| `orderStatusValue` | `string` |  |  |
| `payStatusValue` | `string` |  |  |
| `paymentMethodValue` | `string` |  |  |
| `deliverStatusValue` | `string` |  |  |
| `deliveryMethodValue` | `string` |  |  |

#### `OrderInfo`

订单模块的 VO。 关键：**订单详情是一个「聚合对象」**（order + items + logs + priceDetail + 发票）， 字段很多，所以这里按后端 `OrderDetailVO` 的真实结构声明。 / /** 订单主表（详情里的 order 字段）

**被这些 VO 嵌套引用**：`OrderDetail`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `sn` | `string` |  |  |
| `tradeSn` | `string` |  |  |
| `parentOrderSn` | `string` |  |  |
| `memberId` | `string \| number` |  |  |
| `memberName` | `string` |  |  |
| `storeId` | `string \| number` |  |  |
| `storeName` | `string` |  |  |
| `orderStatus` | `string` |  |  |
| `payStatus` | `string` |  |  |
| `deliverStatus` | `string` |  |  |
| `orderType` | `string` |  |  |
| `paymentMethod` | `string` |  |  |
| `deductionMethod` | `string` |  |  |
| `deliveryMethod` | `string` |  |  |
| `clientType` | `string` |  |  |
| `goodsNum` | `number` |  |  |
| `goodsPrice` | `number` |  |  |
| `freightPrice` | `number` |  |  |
| `flowPrice` | `number` |  |  |
| `discountPrice` | `number` |  |  |
| `updatePrice` | `number` |  |  |
| `weight` | `number` |  |  |
| `consigneeName` | `string` |  |  |
| `consigneeMobile` | `string` |  |  |
| `consigneeDetail` | `string` |  |  |
| `consigneeAddressPath` | `string` |  |  |
| `consigneeAddressIdPath` | `string` |  |  |
| `paymentTime` | `string` |  |  |
| `payOrderNo` | `string` |  |  |
| `completeTime` | `string` |  |  |
| `logisticsCode` | `string` |  |  |
| `logisticsName` | `string` |  |  |
| `logisticsNo` | `string` |  |  |
| `logisticsTime` | `string` |  |  |
| `canReturn` | `boolean` |  |  |
| `cancelReason` | `string` |  |  |
| `remark` | `string` |  |  |
| `sellerRemark` | `string` |  |  |
| `createTime` | `string` |  |  |

#### `OrderItemInfo`

订单商品行

**被这些 VO 嵌套引用**：`OrderDetail`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `orderSn` | `string` |  |  |
| `sn` | `string` |  |  |
| `goodsId` | `string \| number` |  |  |
| `skuId` | `string \| number` |  |  |
| `goodsName` | `string` |  |  |
| `image` | `string` |  |  |
| `specs` | `string` |  |  |
| `num` | `number` |  |  |
| `goodsPrice` | `number` |  |  |
| `flowPrice` | `number` |  |  |
| `unitPrice` | `number` |  |  |
| `subTotal` | `number` |  |  |
| `commentStatus` | `string` |  |  |
| `afterSaleStatus` | `string` |  |  |
| `isRefund` | `string` |  |  |
| `refundPrice` | `number` |  |  |
| `deliverNumber` | `number` |  |  |
| `returnGoodsNumber` | `number` |  |  |
| `cardKeyDelivered` | `boolean` |  |  |
| `cardKeys` | `Array<{ cardKey?: string; [key: string]: unknown }>` |  |  |

#### `OrderLogInfo`

订单操作日志

**被这些 VO 嵌套引用**：`OrderDetail`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `message` | `string` |  |  |
| `operatorId` | `string \| number` |  |  |
| `operatorName` | `string` |  |  |
| `operatorType` | `string` |  |  |
| `createTime` | `string` |  |  |

#### `OrderReceipt`

发票信息

**被这些 VO 嵌套引用**：`OrderDetail`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `receiptNo` | `string` |  |  |
| `receiptTitle` | `string` |  |  |
| `receiptType` | `string` |  |  |
| `receiptContent` | `string` |  |  |

#### `StoreAfterSaleAddress`

商家售后收货地址

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `paymentLog` | `/order/afterSale/getStoreAfterSaleAddress/${sn}` | `StoreAfterSaleAddress` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `consigneeName` | `string` |  |  |
| `consigneeMobile` | `string` |  |  |
| `consigneeAddressPath` | `string` |  |  |
| `consigneeDetail` | `string` |  |  |

### page

#### `ArticleForm`

文章 / 内容模块的 VO。 从 `views/page/article-manage/articleEdit.vue`、`articleList.vue` 里搬出来的， 目的是让 `api/pages.ts` 能标注返回类型（见 apps/manager/API-TYPING-PLAN.md）。

**被这些页面使用**：`views/page/article-manage/articleEdit.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `openStatus` | `boolean \| string \| number` | ✅ |  |
| `title` | `string` | ✅ |  |
| `categoryId` | `string \| number` | ✅ |  |
| `sort` | `number \| string` | ✅ |  |
| `content` | `string` | ✅ |  |
| `id` | `string \| number` | ✅ |  |

#### `PageDataDetail`

后端会扩容 */ [key: string]: unknown; }; export type ArticleRow = { id?: string | number; title?: string; openStatus?: boolean; [key: string]: unknown; }; /** 装修页面数据（pageData 是 JSON 字符串，前端 safeParse 后使用）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getHomeData` | `/other/pageData/${id}?t=${Date.now()}` | `PageDataDetail` |
| `getMemberMessage` | `/other/pageData/pageType/${params}` | `PageDataDetail` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `name` | `string` |  |  |
| `pageData` | `string` |  |  |
| `pageType` | `string` |  |  |
| `pageClientType` | `string` |  |  |
| `pageShow` | `string` |  |  |

### procurement

#### `DamageDetail`

采购模块的 VO。 从 `views/procurement/*` 搬出来的，目的： 1. 类型不再散落在各个 .vue 里 2. `api/procurement.ts` 能标注返回类型

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getDamageReportDetail` | `/procurement/damage-report/${id}` | `DamageDetail` |

**被这些页面使用**：`views/procurement/damage-report/detail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `sn` | `string` |  |  |
| `status` | `string` |  |  |
| `makerName` | `string` |  |  |
| `createBy` | `string` |  |  |
| `createTime` | `string` |  |  |
| `auditorName` | `string` |  |  |
| `auditTime` | `string` |  |  |
| `damageDate` | `string` |  |  |
| `totalQuantity` | `number` |  |  |
| `totalAmount` | `number \| string` |  |  |
| `remark` | `string` |  |  |

#### `DamageItem`

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getDamageReportItems` | `/procurement/damage-report/${id}/items` | `DamageItem[]` |

**被这些页面使用**：`views/procurement/damage-report/detail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `goodsName` | `string` |  |  |
| `skuId` | `string \| number` |  |  |
| `quantity` | `number` |  |  |
| `unitPrice` | `number \| string` |  |  |
| `amount` | `number \| string` |  |  |

#### `InboundDetail`

入库单详情（字段较多且会扩容）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getProcurementInboundDetail` | `/procurement/inbound/${id}` | `InboundDetail` |

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | `string \| number` |  |  |
| `sn` | `string` |  |  |
| `status` | `string` |  |  |
| `createTime` | `string` |  |  |

#### `InboundItem`

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getProcurementInboundItems` | `/procurement/inbound/${id}/items` | `InboundItem[]` |

**被这些页面使用**：`views/procurement/inbound/detail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `inboundQuantity` | `number \| string` |  |  |

### seller

#### `BillDetail`

商家模块的 VO。 起点：`views/seller/bill/bill-detail.vue` 里 30+ 字段的结算单详情类型 只在该文件里定义，api 层拿不到，`getBuyBillDetail` 因此没有返回类型。 / /** 结算单详情（字段较多，后端会扩容）

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getBuyBillPage` | `/order/bill/getByPage` | `{ records?: BillDetail[]; total?: number }` |
| `getBuyBillDetail` | `/order/bill/get/${id}` | `BillDetail` |

**被这些页面使用**：`views/seller/bill/bill-detail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `billStatus` | `string` |  |  |
| `sn` | `string` |  |  |
| `storeName` | `string` |  |  |
| `startTime` | `string \| null` |  |  |
| `endTime` | `string \| null` |  |  |
| `bankAccountName` | `string` |  |  |
| `bankAccountNumber` | `string` |  |  |
| `bankName` | `string` |  |  |
| `bankCode` | `string` |  |  |
| `payTime` | `string \| null` |  |  |
| `billPrice` | `number` |  |  |
| `orderPrice` | `number` |  |  |
| `siteCouponCommission` | `number` |  |  |
| `pointSettlementPrice` | `number` |  |  |
| `kanjiaSettlementPrice` | `number` |  |  |
| `giftCardSubsidy` | `number` |  |  |
| `distributionCommission` | `number` |  |  |
| `commissionPrice` | `number` |  |  |
| `refundPrice` | `number` |  |  |
| `siteCouponRefundCommission` | `number` |  |  |
| `pointRefundSettlementPrice` | `number` |  |  |
| `kanjiaRefundSettlementPrice` | `number` |  |  |
| `giftCardRefundSubsidy` | `number` |  |  |
| `distributionRefundCommission` | `number` |  |  |
| `refundCommissionPrice` | `number` |  |  |

#### `BillFlowRow`

结算单流水行

**被这些接口返回**：

| 函数 | 路径 | 实际泛型 |
|---|---|---|
| `getStoreFlow` | `/order/bill/${id}/getStoreFlow` | `{ records?: BillFlowRow[]; total?: number }` |

**被这些页面使用**：`views/seller/bill/bill-detail.vue`

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `flowType` | `string` |  |  |
| `pointSettlementPrice` | `number` |  |  |
| `kanjiaSettlementPrice` | `number` |  |  |
| `siteCouponCommission` | `number` |  |  |
| `commissionPrice` | `number` |  |  |
| `distributionRebate` | `number` |  |  |

## 三、未被任何代码使用的类型

_无 —— 所有 VO 都有实际使用方。_

## 四、还没建 VO 的部分

`api/*.ts` 里仍有一部分接口没有返回类型（`getRequest(...)` 未带泛型）。
它们对应的实体还没有逐字段 VO，属于剩余待办，推进方式见 `API-TYPING-PLAN.md` 第九节。

```
api 文件：23 个
getRequest 调用：142 个，其中已标类型 176 个（124%）
```

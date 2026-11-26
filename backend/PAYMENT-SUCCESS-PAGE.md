# 支付成功页（PAYMENT_SUCCESS_SETTING）

> 一条链路串起三端：运营在管理端配置 → 买家支付完成后看到推荐商品和推广位。
> 本文是这套功能的接口契约与实现说明，改代码前先看这里。

## 1. 相关文件

| 层 | 文件 |
|---|---|
| 配置 DTO | [PaymentSuccessSetting.java](framework/src/main/java/cn/lili/modules/system/entity/dto/PaymentSuccessSetting.java) |
| 配置枚举 | [SettingEnum.java](framework/src/main/java/cn/lili/modules/system/entity/enums/SettingEnum.java)（`PAYMENT_SUCCESS_SETTING`） |
| 配置读写 | [SettingConfigServiceImpl.java](framework/src/main/java/cn/lili/modules/system/serviceimpl/SettingConfigServiceImpl.java)（`getConfig` 的 case） |
| 选品计算 | [PaymentSuccessSupport.java](framework/src/main/java/cn/lili/modules/payment/support/PaymentSuccessSupport.java) |
| 买家端视图 | [PaymentSuccessPageVO.java](framework/src/main/java/cn/lili/modules/payment/entity/vo/PaymentSuccessPageVO.java) |
| 管理端接口 | [PaymentSuccessManagerController.java](manager-api/src/main/java/cn/lili/controller/manager/payment/PaymentSuccessManagerController.java) |
| 买家端接口 | [PaymentSuccessBuyerController.java](buyer-api/src/main/java/cn/lili/controller/payment/PaymentSuccessBuyerController.java) |
| 管理端页面 | [apps/manager/src/views/promotions/payment-success/index.vue](../apps/manager/src/views/promotions/payment-success/index.vue) |
| 买家端页面 | [apps/uniapp/pages/cart/payment/success.vue](../apps/uniapp/pages/cart/payment/success.vue) |

## 2. 配置字段（`PAYMENT_SUCCESS_SETTING`）

存储于 `li_setting`，key 为 `PAYMENT_SUCCESS_SETTING`，值是下面结构的 JSON。

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `goodsEnabled` | Boolean | `true` | 是否展示推荐商品 |
| `goodsTitle` | String | `为你推荐` | 推荐区域标题 |
| `goodsSource` | String | `AUTO` | 选品方式：`AUTO` 智能选品 / `MANUAL` 手动选品 |
| `goodsSort` | String | `NEW` | 排序：`NEW` 最新 / `SALES` 销量 / `PRICE_ASC` / `PRICE_DESC` |
| `goodsLimit` | Integer | `12` | 最多展示数量，**服务端钳制在 1~50** |
| `excludePurchased` | Boolean | `true` | 是否排除该会员已购买的商品 |
| `categoryId` | String | `""` | 限定商品分类（`like` 匹配 `category_path`） |
| `storeIds` | String[] | `[]` | 店铺范围，为空表示全部店铺 |
| `skuIds` | String[] | `[]` | 手动选品的 SKU，**数组顺序即运营排序** |
| `promotionEnabled` | Boolean | `false` | 是否展示推广位 |
| `image` | String | `""` | 推广图片 |
| `startTime` | Long | `null` | 推广开始时间（**毫秒时间戳**） |
| `endTime` | Long | `null` | 推广结束时间（毫秒时间戳） |
| `targetType` | String | `COUPON_CENTER` | 推广位跳转类型，见第 6 节 |
| `targetId` | String | `""` | 跳转目标 ID，为空时推广位不展示 |

## 3. 管理端接口

前缀 `/manager/payment/success-page`，需管理端登录态。

### 3.1 获取已选推荐商品

```
GET /manager/payment/success-page/goods
```

返回按 `skuIds` 顺序排列的 `GoodsSku` 列表。**包含已下架的失效项**，用于让运营在配置页看到"这个商品已失效、需要替换"，而不是静默消失。

### 3.2 预览推荐商品

```
POST /manager/payment/success-page/preview?memberId={可选}
Content-Type: application/json
Body: PaymentSuccessSetting
```

- 不写库、不触发推广；
- `memberId` 传入时，若 `excludePurchased=true`，按该会员已购记录排除（用于演示效果）；
- `memberId` 不传时不做排除（管理端默认场景）。

### 3.3 配置读写（复用系统设置接口）

```
GET /manager/setting/setting/get/PAYMENT_SUCCESS_SETTING
PUT /manager/setting/setting/put/PAYMENT_SUCCESS_SETTING
```

> ⚠️ 保存是 **PUT**，不是 POST。前端 `apps/manager/src/api/setting.ts` 的 `setSetting` 曾经错误地用了 `postRequest`，导致所有设置页保存返回 405，已修正。

## 4. 买家端接口

```
GET /buyer/payment/success-page?sn={支付编号}&orderType={ORDER|TRADE|RECHARGE}&clientType={H5|WECHAT_MP|APP}
```

需会员登录态。**客户端不提交金额**，所有金额与状态只按服务端记录确认。

### 4.1 响应

```json
{
  "success": true,
  "result": {
    "status": "PAID",
    "amount": 128.00,
    "paymentMethod": "WECHAT",
    "goodsTitle": "为你推荐",
    "goods": [
      { "id": "sku-1", "goodsName": "商品名", "price": 99.00, "promotionPrice": 0, "thumbnail": "..." }
    ],
    "promotion": {
      "image": "https://...",
      "targetType": "GOODS",
      "targetId": "goods-1",
      "targetName": "商品名",
      "goodsId": "goods-1"
    }
  }
}
```

`promotion` 在以下任一条件不满足时为 `null`：`promotionEnabled=false`、`targetId` 为空、当前时间不在 `[startTime, endTime]` 内。
`goods` 只在 `status === "PAID"` 时返回，非成功状态一律为空数组。

### 4.2 支付状态机

| 服务端记录 | 返回 `status` |
|---|---|
| `payStatus = PAID` | `PAID` |
| `payStatus = CANCEL` 或订单 `orderStatus = CANCELLED` | `CLOSED` |
| 其他（含 `UNPAID`） | `PENDING` |

- `PENDING` 时前端会按 1s / 2s / 3s 重试三次（见 `success.vue` 的 `load()`），不会重新发起支付；
- 记录不存在、或 `memberId` 与当前登录会员不一致 → 返回 `CLOSED`（**防越权查看他人订单**）。

### 4.3 orderType 与数据来源

| orderType | 数据源 | 金额字段 | 支付方式 |
|---|---|---|---|
| `ORDER` | `OrderService.getBySn(sn)` | `flowPrice` | 订单 `paymentMethod` |
| `TRADE` | `TradeService.getBySn(sn)` | `flowPrice` | 交易 `paymentMethod` |
| `RECHARGE` | `RechargeService.getRecharge(sn)` | `rechargeMoney` | 无 |

## 5. 选品与"排除已购"规则

统一实现在 `PaymentSuccessSupport.recommend(setting, memberId)`，**管理端预览与买家端渲染共用**，保证两边结果一致。

```
goodsSource = MANUAL  →  按 skuIds 顺序取缓存中的 SKU，失效项跳过
goodsSource = AUTO    →  GoodsSkuService.listPaymentSuccessRecommend(setting)
                         market_enable = UPPER
                         + category_path like categoryId（可选）
                         + store_id in storeIds（可选）
                         + 排序（NEW→create_time desc / SALES→buy_count desc / 价格升降）
                         + limit
excludePurchased=true 且 memberId 非空
                      →  回溯该会员最近 50 笔已支付订单的 OrderItem，剔除相同 skuId
最后                      →  截断到 goodsLimit（1~50）
```

> **为什么回溯 50 笔而不是全量**：全量会把会员历史订单全捞一遍，收益递减且慢；50 笔已覆盖"刚买完不重复推荐"的实际场景。需要更精确时应改为按 SKU 维度建购买记录索引，而不是调大这个数。

## 6. 推广位 targetType 映射

| targetType | 名称来源 | 前端路由类型 |
|---|---|---|
| `COUPON_CENTER` | 固定「领券中心」 | `other/coupon` |
| `SECKILL` | 固定「秒杀频道」 | `other/seckill` |
| `PINTUAN` | 固定「拼团频道」 | `other/group` |
| `GOODS` | `Goods.getGoodsName()`，并回填 `goodsId` | `goods` |
| `CATEGORY` | `Category.getName()` | `category` |
| `STORE` | `Store.getStoreName()` | `shops` |
| `ARTICLE` | `Article.getTitle()` | `pages` |
| `SPECIAL` | `PageData.getName()` | `special` |
| `COUPON_PACKAGE` | 未实现（`CouponActivity` 无名称字段） | `couponPackage` |
| `OTHER` | 名称由前端按 `targetId` 映射 | `other` |

名称查不到不影响跳转，前端 `apps/uniapp/utils/payment-success.js` 的 `promotionLink()` 会退回兜底文案；且**不接受服务端下发的外部 URL**，只走内部路由。

## 7. 本地启动与日志

```powershell
cd backend
.\mvnw.cmd -o -pl manager-api -am -DskipTests spring-boot:run > ..\logs\manager-api.log 2>&1
.\mvnw.cmd -o -pl buyer-api   -am -DskipTests spring-boot:run > ..\logs\buyer-api.log 2>&1
```

- `logs/` 已在 `.gitignore` 中忽略，日志不要落在仓库根目录；
- `manager-api` 的 `pom.xml` 把工作目录设为 `backend/`，因此 `backend/config/` 会被当作外部配置目录加载，本地跑必须靠 `backend/config/application-dev.yml` 把 Redis/MySQL 指回 `127.0.0.1`（详见 [config/README.md](config/README.md)）。

## 8. 此功能踩过的坑（排障参考）

| 现象 | 根因 | 处理 |
|---|---|---|
| `GET /manager/payment/success-page/goods` 404 | 后端从未实现该控制器，只有前端页面和菜单 SQL | 补 `PaymentSuccessManagerController` |
| `get/PAYMENT_SUCCESS_SETTING` 500 | `SettingEnum` 缺该枚举值，`valueOf()` 抛异常 | 加枚举 + `getConfig` case |
| 保存任何设置 405 | 前端用 POST，后端 `SettingManagerController` 只映射 PUT | `setSetting` 改 `putRequest` |
| 买家端成功页无数据 | 买家端接口不存在 | 补 `PaymentSuccessBuyerController` |

## 9. 已知限制

1. `COUPON_PACKAGE` 的 `targetName` 未回填（`CouponActivity` 无名称字段，需要关联 `Coupon` 才能取名）；
2. 管理端预览的"排除已购"必须手动传 `memberId`，没有会员选择器（输入框手填）；
3. `excludePurchased` 只回溯 50 笔订单；
4. 买家端推荐按 SKU 展示（一个商品多个规格会各占一格），如果运营希望按 SPU 去重，需要在 `PaymentSuccessSupport` 里按 `goodsId` 聚合。

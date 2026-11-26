# 测试数据说明

> 用途：让 P0 / P1 里「需要数据才能点」的用例能跑起来。
> 所有数据都带 `TEST` 前缀或「可删除」字样，随时可清。

---

## 一、订单（供「订单详情」用例）

**脚本**：`backend/DB/test-data-order.sql`（幂等，可反复执行）

```bash
mysql --default-character-set=utf8mb4 -u root -p lilishop < backend/DB/test-data-order.sql
```

**造出来的数据**：

| 项 | 值 |
|---|---|
| 订单号 | `TEST20261126000001` |
| 状态 | 已付款 / 待发货（`PAID` + `UNDELIVERED`） |
| 金额 | 7474.00 |
| 商品 | Samsung Galaxy S21 Ultra（真实商品，1 件） |
| 会员 | 取库里第一个真实会员 |
| 收货人 | `Tester` / 13800000000 |
| 日志 | 1 条「test data: order paid」 |

**已验证**（走 Manager 接口）：

```
订单列表 total = 1
订单详情 success=true，orderItems=1，orderLogs=1
paymentMethod=ALIPAY，consigneeName=Tester
```

> 注意：脚本里商品名/店铺名/会员名都用**子查询**从库里取，
> 不写中文字面量 —— 否则 mysql 客户端编码不一致会报 `Data too long`。

---

## 二、直播间（供「直播详情 / 面板」用例）

已通过接口创建，也可自行再建：

| 项 | 值 |
|---|---|
| 标题 | `测试直播间-可删除` |
| 状态 | 未开始（`NEW`） |
| 推流地址 | 空（本环境未配腾讯云直播参数，符合预期） |

直播间列表 / 详情接口均已验证 `success=true`。

---

## 三、清理

```sql
-- 清订单
DELETE FROM li_order_item WHERE order_sn LIKE 'TEST%';
DELETE FROM li_order_log  WHERE order_sn LIKE 'TEST%';
DELETE FROM li_order      WHERE sn       LIKE 'TEST%';

-- 清直播间
DELETE FROM li_live_room WHERE title LIKE '%可删除%' OR title LIKE '测试%';
```

---

## 四、现在能测哪些 P0 项

| P0 项 | 之前 | 现在 |
|---|---|---|
| 商品列表 / 上下架 | ✅ | ✅ |
| **订单列表 / 详情** | ❌ 无数据 | ✅ **可测**（1 单） |
| **直播列表 / 详情 / 面板** | ❌ 无数据 | ✅ **可测**（1 间） |
| 平台设置各页 | ✅ | ✅ |
| 装修 / 分销 / 采购 / 文章 | ✅ | ✅ |

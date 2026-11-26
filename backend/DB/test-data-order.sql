-- 测试数据：一条「已付款待发货」订单（供 P0「订单详情」用例）
-- 幂等：先删同 sn 再插；可反复执行
-- 用法：mysql --default-character-set=utf8mb4 -u root -p lilishop < backend/DB/test-data-order.sql
--
-- 说明：商品名/店铺名都从库里取真实值（子查询），避免脚本里的中文受客户端编码影响。

SET @order_sn = 'TEST20261126000001';
SET @trade_sn = 'TESTTRADE20261126000001';
SET @member_id = '1376417684140326912';
SET @store_id = '1376369067769724928';
SET @goods_id = '1376850145118781440';
SET @sku_id = '1376850145177501696';

-- 清理旧数据（可反复执行）
DELETE FROM li_order_item WHERE order_sn = @order_sn;
DELETE FROM li_order_log WHERE order_sn = @order_sn;
DELETE FROM li_order WHERE sn = @order_sn;

-- 订单主表：已付款、待发货
INSERT INTO li_order (
  id, create_by, create_time, delete_flag, update_time,
  sn, trade_sn, member_id, member_name, store_id, store_name,
  order_status, pay_status, deliver_status, can_return,
  client_type, payment_method, deduction_method, delivery_method,
  goods_num, goods_price, freight_price, flow_price, discount_price, update_price, weight,
  consignee_name, consignee_mobile, consignee_detail,
  consignee_address_path, consignee_address_id_path,
  payment_time, pay_order_no, order_type,
  price_detail, remark, seller_remark
) VALUES (
  UNIX_TIMESTAMP() * 1000000 + 1, 'test-data', NOW(), 0, NOW(),
  @order_sn, @trade_sn, @member_id,
  (SELECT username FROM li_member WHERE id = @member_id),
  @store_id,
  (SELECT store_name FROM li_store WHERE id = @store_id),
  'UNDELIVERED', 'PAID', 'UNDELIVERED', 1,
  'PC', 'ALIPAY', 'NORMAL', 'LOGISTICS',
  1, 7474.00, 0.00, 7474.00, 0.00, 0.00, 0.50,
  'Tester', '13800000000', 'Test Road 1-101',
  'Beijing,Beijing,Dongcheng', '1,72,2801',
  NOW(), 'TESTPAY20261126000001', 'NORMAL',
  '{"goodsPrice":7474.00,"freightPrice":0.00,"discountPrice":0.00,"couponPrice":0.00,"pointPrice":0.00,"updatePrice":0.00}',
  'test data - safe to delete', ''
);

-- 订单明细
INSERT INTO li_order_item (
  id, create_by, create_time, delete_flag, update_time,
  order_sn, sn, goods_id, sku_id, goods_name, image, specs, num,
  goods_price, flow_price, unit_price, sub_total,
  comment_status, after_sale_status, is_refund, return_goods_number, is_goods_number, deliver_number
) VALUES (
  UNIX_TIMESTAMP() * 1000000 + 2, 'test-data', NOW(), 0, NOW(),
  @order_sn, @sku_id, @goods_id, @sku_id,
  (SELECT goods_name FROM li_goods WHERE id = @goods_id),
  (SELECT thumbnail FROM li_goods WHERE id = @goods_id),
  'color:black', 1,
  7474.00, 7474.00, 7474.00, 7474.00,
  'NEW', 'NOT_APPLY', 'NO', 0, 0, 0
);

-- 订单操作日志
INSERT INTO li_order_log (
  id, create_by, create_time,
  order_sn, message, operator_id, operator_type, operator_name
) VALUES (
  UNIX_TIMESTAMP() * 1000000 + 3, 'test-data', NOW(),
  @order_sn, 'test data: order paid', @member_id, 'MEMBER',
  (SELECT username FROM li_member WHERE id = @member_id)
);

SELECT sn AS order_sn, order_status, pay_status, flow_price FROM li_order WHERE sn = @order_sn;

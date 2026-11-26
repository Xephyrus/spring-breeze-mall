package cn.lili.modules.payment.support;

import cn.lili.modules.goods.entity.dos.GoodsSku;
import cn.lili.modules.goods.service.GoodsSkuService;
import cn.lili.modules.order.order.entity.dos.Order;
import cn.lili.modules.order.order.entity.dos.OrderItem;
import cn.lili.modules.order.order.entity.enums.PayStatusEnum;
import cn.lili.modules.order.order.service.OrderItemService;
import cn.lili.modules.order.order.service.OrderService;
import cn.lili.modules.system.entity.dto.PaymentSuccessSetting;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 支付成功页推荐商品计算支持
 * <p>
 * 管理端预览与买家端渲染共用同一套选品与排除已购逻辑，
 * 保证"预览看到的"与"买家实际看到的"一致。
 *
 * @author Bulbasaur
 * @since 2026-11-19
 */
@Component
public class PaymentSuccessSupport {

    /**
     * 排除已购商品时回溯的已支付订单数量
     */
    private static final int PURCHASED_LOOKBACK_ORDERS = 50;

    @Autowired
    private GoodsSkuService goodsSkuService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderItemService orderItemService;

    /**
     * 按设置计算推荐商品。
     * <p>
     * 手动选品按运营保存顺序返回；智能选品按分类、店铺范围与排序规则查询。
     * memberId 为空时不做"排除已购"（管理端未指定模拟会员的场景）。
     *
     * @param setting  支付成功页设置
     * @param memberId 会员ID，可为空
     * @return 推荐商品列表
     */
    public List<GoodsSku> recommend(PaymentSuccessSetting setting, String memberId) {
        if (setting == null) {
            return new ArrayList<>();
        }
        int limit = setting.getGoodsLimit() == null
                ? 12 : Math.max(1, Math.min(setting.getGoodsLimit(), 50));
        List<GoodsSku> goods;
        if ("MANUAL".equals(setting.getGoodsSource())) {
            goods = manualGoods(setting.getSkuIds());
        } else {
            goods = goodsSkuService.listPaymentSuccessRecommend(setting);
        }
        if (goods == null) {
            return new ArrayList<>();
        }
        if (Boolean.TRUE.equals(setting.getExcludePurchased()) && memberId != null && !memberId.isEmpty()) {
            goods = excludePurchased(memberId, goods);
        }
        return goods.size() > limit ? new ArrayList<>(goods.subList(0, limit)) : goods;
    }

    /**
     * 按运营保存的顺序还原手动选品，缓存未命中的失效项直接跳过。
     */
    private List<GoodsSku> manualGoods(List<String> skuIds) {
        if (skuIds == null || skuIds.isEmpty()) {
            return new ArrayList<>();
        }
        List<GoodsSku> found = goodsSkuService.getGoodsSkuByIdFromCache(skuIds);
        Map<String, GoodsSku> indexed = new LinkedHashMap<>();
        if (found != null) {
            for (GoodsSku sku : found) {
                if (sku != null && sku.getId() != null) {
                    indexed.putIfAbsent(sku.getId(), sku);
                }
            }
        }
        List<GoodsSku> ordered = new ArrayList<>();
        for (String id : skuIds) {
            GoodsSku sku = indexed.get(id);
            if (sku != null) {
                ordered.add(sku);
            }
        }
        return ordered;
    }

    /**
     * 排除该会员已购买过的SKU，避免支付成功页重复推荐。
     */
    private List<GoodsSku> excludePurchased(String memberId, List<GoodsSku> goods) {
        List<Order> orders = orderService.list(new LambdaQueryWrapper<Order>()
                .eq(Order::getMemberId, memberId)
                .eq(Order::getPayStatus, PayStatusEnum.PAID.name())
                .orderByDesc(Order::getCreateTime)
                .last("limit " + PURCHASED_LOOKBACK_ORDERS));
        if (orders.isEmpty()) {
            return goods;
        }
        List<String> orderSns = orders.stream().map(Order::getSn).filter(Objects::nonNull).toList();
        List<OrderItem> items = orderItemService.list(new LambdaQueryWrapper<OrderItem>()
                .in(OrderItem::getOrderSn, orderSns));
        Set<String> purchased = new HashSet<>();
        for (OrderItem item : items) {
            if (item.getSkuId() != null) {
                purchased.add(item.getSkuId());
            }
        }
        if (purchased.isEmpty()) {
            return goods;
        }
        return goods.stream().filter(sku -> !purchased.contains(sku.getId())).toList();
    }
}

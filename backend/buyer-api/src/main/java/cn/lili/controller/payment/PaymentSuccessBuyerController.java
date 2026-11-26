package cn.lili.controller.payment;

import cn.hutool.core.text.CharSequenceUtil;
import cn.lili.common.enums.ResultCode;
import cn.lili.common.enums.ResultUtil;
import cn.lili.common.exception.ServiceException;
import cn.lili.common.security.AuthUser;
import cn.lili.common.security.context.UserContext;
import cn.lili.common.vo.ResultMessage;
import cn.lili.modules.goods.entity.dos.Category;
import cn.lili.modules.goods.entity.dos.Goods;
import cn.lili.modules.goods.service.CategoryService;
import cn.lili.modules.goods.service.GoodsService;
import cn.lili.modules.order.order.entity.dos.Order;
import cn.lili.modules.order.order.entity.dos.Trade;
import cn.lili.modules.order.order.entity.enums.OrderStatusEnum;
import cn.lili.modules.order.order.entity.enums.PayStatusEnum;
import cn.lili.modules.order.order.service.OrderService;
import cn.lili.modules.order.order.service.TradeService;
import cn.lili.modules.page.entity.dos.Article;
import cn.lili.modules.page.entity.dos.PageData;
import cn.lili.modules.page.service.ArticleService;
import cn.lili.modules.page.service.PageDataService;
import cn.lili.modules.payment.entity.vo.PaymentSuccessPageVO;
import cn.lili.modules.payment.kit.dto.PayParam;
import cn.lili.modules.payment.support.PaymentSuccessSupport;
import cn.lili.modules.store.entity.dos.Store;
import cn.lili.modules.store.service.StoreService;
import cn.lili.modules.system.entity.dto.PaymentSuccessSetting;
import cn.lili.modules.system.entity.enums.SettingEnum;
import cn.lili.modules.system.service.SettingConfigService;
import cn.lili.modules.wallet.entity.dos.Recharge;
import cn.lili.modules.wallet.service.RechargeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

/**
 * 买家端,支付成功页接口
 * <p>
 * 支付状态与金额只按服务端记录确认，客户端不提交任何金额；
 * 推荐商品按 PAYMENT_SUCCESS_SETTING 计算结果，并按需排除该会员已购买的商品。
 *
 * @author Bulbasaur
 * @since 2026-11-19
 */
@RestController
@Tag(name = "买家端,支付成功页接口")
@RequestMapping("/buyer/payment/success-page")
public class PaymentSuccessBuyerController {

    @Autowired
    private SettingConfigService settingConfigService;

    @Autowired
    private PaymentSuccessSupport paymentSuccessSupport;

    @Autowired
    private OrderService orderService;

    @Autowired
    private TradeService tradeService;

    @Autowired
    private RechargeService rechargeService;

    @Autowired
    private GoodsService goodsService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private StoreService storeService;

    @Autowired
    private ArticleService articleService;

    @Autowired
    private PageDataService pageDataService;

    /**
     * 查询支付结果、推荐商品与推广位。
     *
     * @param payParam 支付参数（orderType、sn、clientType）
     * @return 支付成功页数据
     */
    @Operation(summary = "查询支付成功页数据")
    @GetMapping
    public ResultMessage<PaymentSuccessPageVO> page(@Validated PayParam payParam) {
        AuthUser currentUser = Objects.requireNonNull(UserContext.getCurrentUser());
        String memberId = currentUser.getId();
        PaymentSuccessPageVO vo = new PaymentSuccessPageVO();
        resolvePayment(vo, payParam, memberId);

        PaymentSuccessSetting setting =
                (PaymentSuccessSetting) settingConfigService.getConfig(SettingEnum.PAYMENT_SUCCESS_SETTING);

        // 仅支付成功后才返回推荐与推广，支付确认中/已关闭保持空白，避免误导
        if (!"PAID".equals(vo.getStatus()) || setting == null) {
            return ResultUtil.data(vo);
        }
        if (Boolean.TRUE.equals(setting.getGoodsEnabled())) {
            vo.setGoodsTitle(setting.getGoodsTitle());
            vo.setGoods(paymentSuccessSupport.recommend(setting, memberId));
        }
        if (Boolean.TRUE.equals(setting.getPromotionEnabled())
                && CharSequenceUtil.isNotEmpty(setting.getTargetId())
                && inPromotionWindow(setting)) {
            PaymentSuccessPageVO.Promotion promotion = new PaymentSuccessPageVO.Promotion(
                    setting.getImage(), setting.getTargetType(), setting.getTargetId());
            fillPromotionTarget(promotion, setting.getTargetType(), setting.getTargetId());
            vo.setPromotion(promotion);
        }
        return ResultUtil.data(vo);
    }

    /**
     * 按 orderType 从服务端记录确认支付状态、金额与支付方式。
     */
    private void resolvePayment(PaymentSuccessPageVO vo, PayParam payParam, String memberId) {
        String sn = payParam.getSn();
        String orderType = payParam.getOrderType();
        if (CharSequenceUtil.isEmpty(sn) || CharSequenceUtil.isEmpty(orderType)) {
            throw new ServiceException(ResultCode.PARAMS_ERROR);
        }
        switch (orderType) {
            case "ORDER" -> {
                Order order = orderService.getBySn(sn);
                if (order == null || !memberId.equals(order.getMemberId())) {
                    vo.setStatus("CLOSED");
                    return;
                }
                vo.setAmount(order.getFlowPrice());
                vo.setPaymentMethod(order.getPaymentMethod());
                vo.setStatus(resolveStatus(order.getPayStatus(), order.getOrderStatus()));
            }
            case "TRADE" -> {
                Trade trade = tradeService.getBySn(sn);
                if (trade == null || !memberId.equals(trade.getMemberId())) {
                    vo.setStatus("CLOSED");
                    return;
                }
                vo.setAmount(trade.getFlowPrice());
                vo.setPaymentMethod(trade.getPaymentMethod());
                vo.setStatus(resolveStatus(trade.getPayStatus(), null));
            }
            case "RECHARGE" -> {
                Recharge recharge = rechargeService.getRecharge(sn);
                if (recharge == null || !memberId.equals(recharge.getMemberId())) {
                    vo.setStatus("CLOSED");
                    return;
                }
                vo.setAmount(recharge.getRechargeMoney());
                vo.setStatus(resolveStatus(recharge.getPayStatus(), null));
            }
            default -> throw new ServiceException(ResultCode.PARAMS_ERROR);
        }
    }

    /**
     * 支付状态换算：已付款为成功，取消/关闭为失效，其余视为确认中。
     */
    private String resolveStatus(String payStatus, String orderStatus) {
        if (PayStatusEnum.PAID.name().equals(payStatus)) {
            return "PAID";
        }
        if (PayStatusEnum.CANCEL.name().equals(payStatus)
                || OrderStatusEnum.CANCELLED.name().equals(orderStatus)) {
            return "CLOSED";
        }
        return "PENDING";
    }

    /**
     * 回填推广位跳转目标的名称与商品ID，前端据此生成标题和内部路由。
     * <p>
     * 名称查询失败不影响跳转，前端会退回兜底文案。
     */
    private void fillPromotionTarget(PaymentSuccessPageVO.Promotion promotion, String targetType, String targetId) {
        if (CharSequenceUtil.isEmpty(targetType)) {
            return;
        }
        switch (targetType) {
            case "COUPON_CENTER" -> promotion.setTargetName("领券中心");
            case "SECKILL" -> promotion.setTargetName("秒杀频道");
            case "PINTUAN" -> promotion.setTargetName("拼团频道");
            case "GOODS" -> {
                Goods goods = goodsService.getById(targetId);
                if (goods != null) {
                    promotion.setTargetName(goods.getGoodsName());
                    promotion.setGoodsId(goods.getId());
                }
            }
            case "CATEGORY" -> {
                Category category = categoryService.getCategoryById(targetId);
                if (category != null) {
                    promotion.setTargetName(category.getName());
                }
            }
            case "STORE" -> {
                Store store = storeService.getById(targetId);
                if (store != null) {
                    promotion.setTargetName(store.getStoreName());
                }
            }
            case "ARTICLE" -> {
                Article article = articleService.getById(targetId);
                if (article != null) {
                    promotion.setTargetName(article.getTitle());
                }
            }
            case "SPECIAL" -> {
                PageData pageData = pageDataService.getById(targetId);
                if (pageData != null) {
                    promotion.setTargetName(pageData.getName());
                }
            }
            default -> {
                // 其他自定义入口不提供名称，前端按类型展示兜底文案
            }
        }
    }

    /**
     * 推广位是否在有效期内，未配置时间视为长期有效。
     */
    private boolean inPromotionWindow(PaymentSuccessSetting setting) {
        long now = System.currentTimeMillis();
        if (setting.getStartTime() != null && now < setting.getStartTime()) {
            return false;
        }
        return setting.getEndTime() == null || now <= setting.getEndTime();
    }
}

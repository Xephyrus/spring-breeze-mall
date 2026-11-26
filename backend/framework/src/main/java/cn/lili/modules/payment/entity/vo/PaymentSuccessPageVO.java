package cn.lili.modules.payment.entity.vo;

import cn.lili.modules.goods.entity.dos.GoodsSku;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 支付成功页视图
 * <p>
 * 支付状态、金额与支付方式全部由服务端按订单/交易/充值记录确认，
 * 推荐商品与推广位来自系统设置 PAYMENT_SUCCESS_SETTING。
 *
 * @author Bulbasaur
 * @since 2026-11-19
 */
@Data
public class PaymentSuccessPageVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "支付状态：PAID 已支付 / PENDING 确认中 / CLOSED 已关闭")
    private String status = "PENDING";

    @Schema(description = "支付金额")
    private Double amount;

    @Schema(description = "支付方式：WECHAT / ALIPAY / WALLET")
    private String paymentMethod;

    @Schema(description = "推荐区域标题")
    private String goodsTitle;

    @Schema(description = "推荐商品")
    private List<GoodsSku> goods = new ArrayList<>();

    @Schema(description = "推广位，未开启或不在有效期时为空")
    private Promotion promotion;

    /**
     * 推广位信息
     */
    @Data
    public static class Promotion implements Serializable {

        private static final long serialVersionUID = 1L;

        @Schema(description = "推广图片")
        private String image;

        @Schema(description = "跳转类型")
        private String targetType;

        @Schema(description = "跳转目标ID")
        private String targetId;

        @Schema(description = "跳转目标名称，供前端兜底展示")
        private String targetName;

        @Schema(description = "商品ID，跳转商品详情时使用")
        private String goodsId;

        public Promotion() {
        }

        public Promotion(String image, String targetType, String targetId) {
            this.image = image;
            this.targetType = targetType;
            this.targetId = targetId;
        }
    }
}

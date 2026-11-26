package cn.lili.modules.system.entity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 支付成功页设置
 * <p>
 * 对应系统设置 PAYMENT_SUCCESS_SETTING，包含支付成功页的推荐商品规则、
 * 推广位与跳转目标配置。字段与运营后台「支付成功页」表单一一对应。
 *
 * @author Bulbasaur
 * @since 2026-11-19
 */
@Data
public class PaymentSuccessSetting implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "是否展示推荐商品")
    private Boolean goodsEnabled = true;

    @Schema(description = "推荐区域标题")
    private String goodsTitle = "为你推荐";

    @Schema(description = "选品方式：AUTO 智能选品 / MANUAL 手动选品")
    private String goodsSource = "AUTO";

    @Schema(description = "排序方式：NEW 最新 / SALES 销量 / PRICE_ASC 价格升序 / PRICE_DESC 价格降序")
    private String goodsSort = "NEW";

    @Schema(description = "最多展示数量")
    private Integer goodsLimit = 12;

    @Schema(description = "是否排除已购买商品")
    private Boolean excludePurchased = true;

    @Schema(description = "限定的商品分类ID")
    private String categoryId = "";

    @Schema(description = "店铺范围，为空表示全部店铺")
    private List<String> storeIds = new ArrayList<>();

    @Schema(description = "手动选品的SKU ID，按运营排序保存")
    private List<String> skuIds = new ArrayList<>();

    @Schema(description = "是否展示推广位")
    private Boolean promotionEnabled = false;

    @Schema(description = "推广位图片")
    private String image = "";

    @Schema(description = "推广开始时间（毫秒时间戳）")
    private Long startTime;

    @Schema(description = "推广结束时间（毫秒时间戳）")
    private Long endTime;

    @Schema(description = "点击推广位跳转类型")
    private String targetType = "COUPON_CENTER";

    @Schema(description = "点击推广位跳转目标ID")
    private String targetId = "";
}

package cn.lili.controller.manager.payment;

import cn.lili.common.enums.ResultUtil;
import cn.lili.common.vo.ResultMessage;
import cn.lili.modules.goods.entity.dos.GoodsSku;
import cn.lili.modules.goods.service.GoodsSkuService;
import cn.lili.modules.payment.support.PaymentSuccessSupport;
import cn.lili.modules.system.entity.dto.PaymentSuccessSetting;
import cn.lili.modules.system.entity.enums.SettingEnum;
import cn.lili.modules.system.service.SettingConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理端,支付成功页配置接口
 * <p>
 * 配置本身复用系统设置接口（PAYMENT_SUCCESS_SETTING），本控制器只提供两个辅助能力：
 * 配置回显所需的已选商品、以及按选品规则实时预览推荐商品。
 *
 * @author Bulbasaur
 * @since 2026-11-19
 */
@RestController
@Tag(name = "管理端,支付成功页配置接口")
@RequestMapping("/manager/payment/success-page")
public class PaymentSuccessManagerController {

    @Autowired
    private SettingConfigService settingConfigService;

    @Autowired
    private GoodsSkuService goodsSkuService;

    @Autowired
    private PaymentSuccessSupport paymentSuccessSupport;

    /**
     * 已选推荐商品，含已下架的失效项，供运营在配置页识别和替换。
     *
     * @return 按运营保存顺序排列的商品SKU
     */
    @Operation(summary = "获取已选推荐商品（含失效项）")
    @GetMapping("/goods")
    public ResultMessage<List<GoodsSku>> goods() {
        PaymentSuccessSetting setting =
                (PaymentSuccessSetting) settingConfigService.getConfig(SettingEnum.PAYMENT_SUCCESS_SETTING);
        List<String> skuIds = setting == null ? null : setting.getSkuIds();
        if (skuIds == null || skuIds.isEmpty()) {
            return ResultUtil.data(new ArrayList<>());
        }
        List<GoodsSku> found = goodsSkuService.getGoodsSkuByIdFromCache(skuIds);
        if (found == null || found.isEmpty()) {
            return ResultUtil.data(new ArrayList<>());
        }
        Map<String, GoodsSku> indexed = new LinkedHashMap<>();
        for (GoodsSku sku : found) {
            if (sku != null && sku.getId() != null) {
                indexed.putIfAbsent(sku.getId(), sku);
            }
        }
        List<GoodsSku> ordered = new ArrayList<>();
        for (String id : skuIds) {
            GoodsSku sku = indexed.get(id);
            if (sku != null) {
                ordered.add(sku);
            }
        }
        return ResultUtil.data(ordered);
    }

    /**
     * 按提交的选品规则实时计算推荐商品，不写入系统设置。
     *
     * @param setting  当前表单配置
     * @param memberId 模拟会员ID，传值时按该会员的购买记录演示"排除已购"
     * @return 预览商品列表
     */
    @Operation(summary = "预览推荐商品")
    @Parameter(name = "memberId", description = "模拟会员ID，用于演示排除已购商品")
    @PostMapping("/preview")
    public ResultMessage<List<GoodsSku>> preview(
            @RequestBody PaymentSuccessSetting setting,
            @RequestParam(required = false) String memberId) {
        if (setting == null || !Boolean.TRUE.equals(setting.getGoodsEnabled())) {
            return ResultUtil.data(new ArrayList<>());
        }
        return ResultUtil.data(paymentSuccessSupport.recommend(setting, memberId));
    }
}

package cn.lili.common.utils;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import cn.lili.common.exception.ServiceException;
import cn.lili.modules.system.entity.dos.Setting;
import cn.lili.modules.system.entity.enums.SettingEnum;
import cn.lili.modules.system.service.SettingService;

import java.util.EnumMap;
import java.util.Map;

/**
 * 平台配置读取工具。
 *
 * <p>背景：很多业务入口都依赖【平台设置】里的某一份配置（提现、支付、物流、直播、微信登录…）。
 * 新环境里这些配置**默认不存在**，而历史代码是「直接 get().getSettingValue()」，
 * 于是抛出 NPE，被全局异常处理兜成「服务器繁忙」——用户完全不知道要去配什么。</p>
 *
 * <p>这里统一成两种语义：
 * <ul>
 *   <li>{@link #require} —— 配置是业务前提，缺失时给出**可直接照着做**的提示；</li>
 *   <li>{@link #optional} —— 配置可缺省，缺失返回 null，由调用方决定降级行为（如定时任务跳过）。</li>
 * </ul>
 * </p>
 *
 * <p>提示文案统一为：{@code 未配置「提现设置」，请前往【平台设置 → 提现设置】填写并保存后重试}。</p>
 *
 * @author spring-breeze
 */
public final class SettingValues {

    /**
     * 配置项 → 平台设置页里对应的菜单名。
     *
     * <p>没登记过的配置直接用 key 作为菜单名，保证提示里始终有「去哪儿配」。</p>
     */
    private static final Map<SettingEnum, String> PAGE_NAMES = new EnumMap<>(SettingEnum.class);

    static {
        PAGE_NAMES.put(SettingEnum.WITHDRAWAL_SETTING, "提现设置");
        PAGE_NAMES.put(SettingEnum.WECHAT_PAYMENT, "微信支付");
        PAGE_NAMES.put(SettingEnum.WECHAT_CONNECT, "微信登录");
        PAGE_NAMES.put(SettingEnum.QQ_CONNECT, "QQ 登录");
        PAGE_NAMES.put(SettingEnum.CONNECT_SETTING, "登录设置");
        PAGE_NAMES.put(SettingEnum.GOODS_SETTING, "商品设置");
        PAGE_NAMES.put(SettingEnum.LIVE_SETTING, "直播设置");
        PAGE_NAMES.put(SettingEnum.SECKILL_SETTING, "秒杀设置");
        PAGE_NAMES.put(SettingEnum.LOGISTICS_SETTING, "物流设置");
        PAGE_NAMES.put(SettingEnum.PAYMENT_SUPPORT, "支付方式");
        PAGE_NAMES.put(SettingEnum.POINT_SETTING, "积分设置");
        PAGE_NAMES.put(SettingEnum.ORDER_SETTING, "订单设置");
        PAGE_NAMES.put(SettingEnum.OSS_SETTING, "文件存储");
        PAGE_NAMES.put(SettingEnum.IM_SETTING, "即时通讯");
        PAGE_NAMES.put(SettingEnum.SECURITY_SETTING, "安全设置");
        PAGE_NAMES.put(SettingEnum.SMS_SETTING, "短信设置");
    }

    private SettingValues() {
    }

    /**
     * 读取配置并转换为指定类型；配置缺失时抛出可直接照着操作的业务异常。
     *
     * @param settingService 配置服务
     * @param key            配置键
     * @param clazz          目标类型
     */
    public static <T> T require(SettingService settingService, SettingEnum key, Class<T> clazz) {
        return require(settingService, key, clazz, null);
    }

    /**
     * 同上，但允许覆盖提示里显示的「配置名称」（一般不需要）。
     *
     * @param hint 提示里显示的配置名称；为空时按 {@link #PAGE_NAMES} 或 key 推导
     */
    public static <T> T require(SettingService settingService, SettingEnum key, Class<T> clazz, String hint) {
        T value = optional(settingService, key, clazz);
        if (value == null) {
            throw new ServiceException(missingMessage(key, hint));
        }
        return value;
    }

    /**
     * 读取配置并转换为指定类型；配置缺失（或内容为空）时返回 null。
     */
    public static <T> T optional(SettingService settingService, SettingEnum key, Class<T> clazz) {
        if (settingService == null) {
            return null;
        }
        Setting setting = settingService.get(key.name());
        if (setting == null || StrUtil.isBlank(setting.getSettingValue())) {
            return null;
        }
        return JSONUtil.toBean(setting.getSettingValue(), clazz);
    }

    /**
     * 生成「缺失配置」的提示：说清缺什么、去哪配、配完做什么。
     */
    public static String missingMessage(SettingEnum key, String hint) {
        String name = StrUtil.isNotBlank(hint) ? hint : PAGE_NAMES.getOrDefault(key, key.name());
        return "未配置「" + name + "」，请前往【平台设置 → " + name + "】填写并保存后重试";
    }
}

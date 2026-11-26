package cn.lili.common.utils;

import cn.lili.common.exception.ServiceException;
import cn.lili.modules.system.entity.enums.SettingEnum;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * 平台配置读取工具的文案与缺省行为。
 *
 * @author spring-breeze
 */
class SettingValuesTest {

    @Test
    void missingMessageShowsWhereToConfigure() {
        String message = SettingValues.missingMessage(SettingEnum.WITHDRAWAL_SETTING, null);
        Assertions.assertEquals("未配置「提现设置」，请前往【平台设置 → 提现设置】填写并保存后重试", message);
    }

    @Test
    void missingMessageFallsBackToKeyWhenUnknown() {
        String message = SettingValues.missingMessage(SettingEnum.SENSITIVE_WORDS_SETTING, null);
        Assertions.assertTrue(message.contains("SENSITIVE_WORDS_SETTING"), message);
        Assertions.assertTrue(message.contains("平台设置"), message);
    }

    @Test
    void requireThrowsBusinessMessageInsteadOfNpe() {
        ServiceException ex = Assertions.assertThrows(ServiceException.class,
                () -> SettingValues.require(null, SettingEnum.LIVE_SETTING, Object.class));
        Assertions.assertTrue(ex.getMessage().contains("直播设置"), ex.getMessage());
    }

    @Test
    void optionalReturnsNullWhenServiceMissing() {
        Assertions.assertNull(SettingValues.optional(null, SettingEnum.OSS_SETTING, Object.class));
    }
}

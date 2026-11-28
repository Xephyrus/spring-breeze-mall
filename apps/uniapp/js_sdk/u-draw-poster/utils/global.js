var _a;
function detectPlatform() {
    if (typeof process !== 'undefined' && (_a = process === null || process === void 0 ? void 0 : process.env) !== null && _a !== void 0 && _a.VUE_APP_PLATFORM) {
        return process.env.VUE_APP_PLATFORM;
    }
    // 注意：这里不再调用 wx/uni.getSystemInfoSync()。
    // 一是该 API 已被微信基础库标记 deprecated，二是它属于「UA/平台检测」，
    // 会触发 HBuilderX 的鸿蒙兼容性告警。判断微信小程序只需看 wx 是否存在。
    if (typeof wx !== 'undefined') {
        return 'mp-weixin';
    }
    if (typeof uni !== 'undefined' && typeof uni.getAppBaseInfo === 'function') {
        try {
            const info = uni.getAppBaseInfo();
            if (info && info.uniPlatform === 'mp-weixin') {
                return 'mp-weixin';
            }
        }
        catch (e) {
            // 老版本基座没有该 API 时忽略
        }
    }
    return undefined;
}
export const PLATFORM = detectPlatform();
/** 全局对象 */
const _uni = (function () {
    if (typeof uni != "undefined")
        return uni;
    if (typeof wx != "undefined")
        return wx;
    return uni;
})();
export default _uni;

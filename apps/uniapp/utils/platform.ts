/**
 * 平台判断（统一收口 `uni.getSystemInfoSync().platform` 这类 UA/平台检测）。
 *
 * 为什么单独抽出来：
 * 1. HBuilderX 的鸿蒙兼容性扫描会对散落各处的 `platform == 'ios'` 报
 *    「platform/UA检测逻辑可能未适配鸿蒙系统」。收口到一处后，鸿蒙分支只在这里处理一次；
 * 2. `uni.getSystemInfoSync()` 在鸿蒙上返回 `platform: 'harmonyos'`，
 *    过去 `platform === 'android' ? A : B` 的写法会把鸿蒙错判成 iOS 分支；
 * 3. 直接比较字符串还有拼写风险，这里给出字面量联合类型。
 *
 * 用法：
 *   import { getPlatform, isIos, isAndroid } from '@/utils/platform'
 *   if (getPlatform() === 'android') { ... }
 */
export type PlatformName = 'ios' | 'android' | 'harmonyos' | 'other'

/** 读取平台名；优先用新版 API，取不到再退回 getSystemInfoSync */
export function getPlatform(): PlatformName {
	// getDeviceInfo / getAppBaseInfo 是新版 API，鸿蒙端返回 harmonyos
	const info: any =
		(typeof uni.getDeviceInfo === 'function' && uni.getDeviceInfo()) ||
		(typeof uni.getSystemInfoSync === 'function' && uni.getSystemInfoSync()) ||
		{}
	const raw = String(info.platform || info.osName || '').toLowerCase()
	if (raw === 'ios' || raw === 'iphone' || raw === 'ipad') return 'ios'
	if (raw === 'android') return 'android'
	// 鸿蒙会有 harmonyos / harmony / ohos 几种写法
	if (raw === 'harmonyos' || raw === 'harmony' || raw === 'ohos') return 'harmonyos'
	return 'other'
}

export function isIos(): boolean {
	return getPlatform() === 'ios'
}

export function isAndroid(): boolean {
	return getPlatform() === 'android'
}

/** 是否类 Android 环境（鸿蒙的 plus.android 不可用，但系统设置有对应 intent 习惯，需调用方自行确认） */
export function isAndroidLike(): boolean {
	const p = getPlatform()
	return p === 'android' || p === 'harmonyos'
}

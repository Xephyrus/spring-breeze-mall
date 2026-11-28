/**
 * 全局 loading 计数封装。
 *
 * 为什么需要这一层：
 * uni 的 `showLoading` / `hideLoading` 要求 **1:1 配对**，否则控制台会告警
 * 「请注意 showLoading 与 hideLoading 必须配对使用」。
 *
 * 而本项目有多处历史写法是「页面自己 showLoading，请求层在响应里兜底 hide」
 * （例如 `promotion/bargain/detail.vue`、`promotion/point/detail.vue` 只 show 不 hide），
 * 直接调 uni 必然出现 hide 多于 show。
 *
 * 这里用 pending 计数 + visible 状态，保证对 uni 的调用严格 1:1：
 * - `showLoading` 只在「当前不可见」时真正调用一次 `uni.showLoading`
 * - `hideLoading` 只在「计数归零且当前可见」时真正调用一次 `uni.hideLoading`
 *
 * 结果：多出来的 hide 变成 no-op（不再告警），重复的 show 也不会叠加遮罩。
 */
let pending = 0;
let visible = false;

export function showLoading(options: UniApp.ShowLoadingOptions = { title: "加载中" }) {
	pending++;
	if (visible) return;
	visible = true;
	uni.showLoading({ mask: true, ...options });
}

export function hideLoading() {
	if (pending > 0) pending--;
	if (pending > 0 || !visible) return;
	visible = false;
	uni.hideLoading();
}

/** 仅供调试/兜底：强制收起并清零（例如登录态失效时） */
export function resetLoading() {
	pending = 0;
	if (visible) {
		visible = false;
		try {
			uni.hideLoading();
		} catch (e) {
			// ignore
		}
	}
}

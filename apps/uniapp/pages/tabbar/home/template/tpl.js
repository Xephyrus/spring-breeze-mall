import { navigateDecorateLink } from '@/utils/decorate-link';

/** 配置楼层模块的跳转，标准内容和固定入口与支付后推广共用内部导航。 */
export function modelNavigateTo(item) {
  if (navigateDecorateLink(item)) return;
  const val = item?.url && typeof item.url === 'object' ? item.url : item || {};
  if ((val.___type || val.type) === 'marketing') {
    switch (val.___promotion) {
      case 'POINTS_GOODS':
        uni.navigateTo({ url: '/pages/promotion/point/detail?id=' + val.promotionId });
        break;
      case 'KANJIA':
        uni.navigateTo({ url: '/pages/promotion/bargain/detail?id=' + val.promotionId });
        break;
      case 'COUPON':
      case 'FULL_DISCOUNT':
      case 'FULL_MINUS':
      case 'FULL_RATE':
      case 'FULL_GIFT':
      case 'SECKILL':
        uni.navigateTo({ url: '/pages/product/goods?id=' + val.skuId + '&goodsId=' + val.goodsId });
        break;
    }
  } else if ((val.___type || val.type) === 'other') {
    // 装修原有自定义链接继续沿用既有行为；支付后推广不接收此类任意URL。
    // #ifdef H5
    window.location.href = val.url || item.link;
    // #endif
    // #ifdef APP-PLUS
    plus.runtime.openURL(val.url || item.link);
    // #endif
  }
}

import config from "@/config/config";

async function scan() {
  // #ifdef APP-PLUS
  let isIos = plus.os.name == "iOS";
  // 判断是否是Ios
  if (isIos) {
    const iosFirstCamera = uni.getStorageSync("iosFirstCamera"); //是不是第一次开启相机
    if (iosFirstCamera !== "false") {
      uni.setStorageSync("iosFirstCamera", "false"); //设为false就代表不是第一次开启相机
      seacnCode();
    } else {
      if (permision.judgeIosPermission("camera")) {
        seacnCode();
      } else {
        // 没有权限提醒是否去申请权限
        tipsGetSettings();
      }
    }
  } else {
    /**
     * TODO 安卓 权限已经授权了，调用api总是显示用户已永久拒绝申请。人傻了
     * TODO 如果xdm有更好的办法请在 https://gitee.com/beijing_hongye_huicheng/lilishop/issues 提下谢谢
     */
    seacnCode();
  }

  // #endif

  // #ifdef MP-WEIXIN
  seacnCode();
  // #endif
}
/**
 * 提示获取权限
 */
function tipsGetSettings() {
  uni.showModal({
    title: "提示",
    content: "您已经关闭相机权限,去设置",
    success: function (res) {
      if (res.confirm) {
        if (isIos) {
          plus.runtime.openURL("app-settings:");
        } else {
          permision.gotoAppPermissionSetting();
        }
      }
    },
  });
}

function seacnCode() {
  uni.scanCode({
    success: function (res) {
      let path = encodeURIComponent(res.result);

      // WX_CODE 为小程序码
      if (res.scanType == "WX_CODE") {
        console.log(res);
        uni.navigateTo({
          url: `/${res.path}`,
        });
      } else {
        config.scanAuthNavigation.forEach((src) => {
          if (res.result.indexOf(src) != -1) {
            uni.navigateTo({
              url: `/${res.result.substring(src.length)}`,
            });
          } else {
            setTimeout(() => {
              uni.navigateTo({
                url: "/pages/tabbar/home/web-view?src=" + path,
              });
            }, 100);
          }
        });
      }
    },
  });
	}

/** 广告魔方各布局共用的样式字段（装修面板配置；老数据无字段时返回空对象，保持原样） */
export function cubeWrapperStyle(res) {
  if (!res || res.paddingTop === undefined) return {};
  const r = (v) => `${Number(v) || 0}rpx`;
  const bg =
    !res.bgColor2 || res.bgColor1 === res.bgColor2
      ? res.bgColor1
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  return {
    padding: `${r(res.paddingTop)} ${r(res.paddingX)} ${r(res.paddingBottom)}`,
    background: bg,
    borderRadius: r(res.borderRadius),
    marginBottom: r(res.pageGap),
    overflow: Number(res.borderRadius) > 0 ? "hidden" : "visible",
  };
}

/** 内容圆角（作用于单张图片容器） */
export function cubeImgStyle(res) {
  if (!res || res.imgRadius === undefined) return {};
  return {
    borderRadius: `${Number(res.imgRadius) || 0}rpx`,
    overflow: "hidden",
  };
}

/** 内容间距（作用于图片布局容器，flex gap） */
export function cubeGapStyle(res) {
  if (!res || res.contentGap === undefined) return {};
  return { gap: `${Number(res.contentGap) || 0}rpx` };
}

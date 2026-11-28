// 第三方依赖补丁（幂等，重复执行安全）。挂在 postinstall，升级/重装后自动重打。
//
// 必要性：
//  - uni_modules / js_sdk 是仓库内 vendored 代码，重装 HBuilderX 插件会被覆盖；
//  - node_modules/uview-plus 由 pnpm 管理，`pnpm install` 会还原成上游原版。
// 这两类改动都必须可重放，否则下次安装后「小程序样式失效 / 弃用 API 告警」会复现。
//
// 覆盖的补丁：
//  1) js_sdk/u-draw-poster/utils/global.js     去掉 getSystemInfoSync（弃用 + 鸿蒙 UA 告警）
//  2) uni_modules/Sansnn-uQRCode/.../bridge-weex.js  显式识别鸿蒙（行为不变）
//  3) uni_modules/Sansnn-uQRCode/components/u-qrcode|uqrcode   pixelRatio 用 getWindowInfo
//  4) uni_modules/okingtz-cropper/.../okingtz-cropper.vue      sysInfo 用 getWindowInfo
//  5) node_modules/uview-plus 的 5 个 theme-vars.scss          去掉 page/body/[data-up-theme]
//  6) node_modules/uview-plus/components/u-goods-sku           去掉 image 标签选择器
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
let applied = 0
let skipped = 0
let missed = 0

function patch(rel, marker, transform) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) {
    console.log(`skip ${rel} (not found)`)
    return
  }
  const src = fs.readFileSync(abs, 'utf8')
  if (src.includes(marker)) {
    skipped++
    console.log(`skip ${rel} (already patched)`)
    return
  }
  const next = transform(src)
  if (!next || next === src) {
    missed++
    console.log(`MISS ${rel} (pattern not matched — upstream code changed?)`)
    return
  }
  fs.writeFileSync(abs, next, 'utf8')
  applied++
  console.log(`patched ${rel}`)
}

// ---------- 1) u-draw-poster 平台探测 ----------
patch('js_sdk/u-draw-poster/utils/global.js', 'getAppBaseInfo', (src) =>
  src.replace(
    / {4}if \(typeof wx !== 'undefined' && typeof wx\.getSystemInfoSync === 'function'\) \{\r?\n {8}return 'mp-weixin';\r?\n {4}\}\r?\n {4}if \(typeof uni !== 'undefined' && typeof uni\.getSystemInfoSync === 'function'\) \{\r?\n {8}const info = uni\.getSystemInfoSync\(\);\r?\n {8}if \(info && info\.uniPlatform === 'mp-weixin'\) \{\r?\n {12}return 'mp-weixin';\r?\n {8}\}\r?\n {4}\}/,
    `    // 不调用 getSystemInfoSync：该 API 已 deprecated，且属于「UA/平台检测」会触发鸿蒙告警
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
    }`
  )
)

// ---------- 2) gcanvas weex 平台判断 ----------
patch('uni_modules/Sansnn-uQRCode/js_sdk/gcanvas/bridge/bridge-weex.js', 'isWeexHarmony', (src) =>
  src.replace(
    /const isWeex = typeof WXEnvironment !== 'undefined';\r?\nconst isWeexIOS[^\n]*\nconst isWeexAndroid[^\n]*\n/,
    `const isWeex = typeof WXEnvironment !== 'undefined';
// 显式识别鸿蒙（weex 在鸿蒙上的 platform 不是 ios/android）；行为不变：鸿蒙仍走 Android 分支
const weexPlatform = isWeex ? String(WXEnvironment.platform || '').toLowerCase() : '';
const isWeexHarmony = isWeex && (weexPlatform.indexOf('harmony') !== -1 || weexPlatform.indexOf('ohos') !== -1);
const isWeexIOS = isWeex && weexPlatform.indexOf('ios') !== -1;
// 鸿蒙没有单独的 gcanvas 桥接实现，沿用 Android 分支（与原逻辑一致）
const isWeexAndroid = isWeex && !isWeexIOS;
`
  )
)

// ---------- 3) 二维码组件 pixelRatio ----------
for (const rel of [
  'uni_modules/Sansnn-uQRCode/components/u-qrcode/u-qrcode.vue',
  'uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue',
]) {
  patch(rel, 'getWindowInfo().pixelRatio', (src) =>
    src.split('uni.getSystemInfoSync().pixelRatio').join('uni.getWindowInfo().pixelRatio')
  )
}

// ---------- 4) 头像裁剪组件 ----------
patch(
  'uni_modules/okingtz-cropper/components/okingtz-cropper/okingtz-cropper.vue',
  'let sysInfo = uni.getWindowInfo()',
  (src) =>
    src.replace(
      /let sysInfo = uni\.getSystemInfoSync\(\);/,
      '// getSystemInfoSync 已废弃（微信基础库会告警），窗口信息用 getWindowInfo\n\tlet sysInfo = uni.getWindowInfo();'
    )
)

// ---------- 5) uview-plus 组件的 theme-vars.scss ----------
// 这些文件里原本是 `:root, page, body {}` + `[data-up-theme] {}`，
// 被组件 style 引入后进到「组件级 wxss」→ 小程序拒绝标签/属性选择器并告警。
// 主题变量已由 App.vue 全局引入的 uview-plus/index.scss 提供，这里清空即可。
const THEME_COMMENT = `/* 主题变量已由全局 uview-plus/index.scss(app.wxss) 提供。
 * 此处原有 page/body 标签选择器与 [data-up-theme] 属性选择器，
 * 在微信小程序组件级 wxss 中不被允许，会触发编译告警，故移除。 */
`
for (const comp of ['u-navbar', 'u-notice-bar', 'u-subsection', 'u-switch', 'u-tag']) {
  const rel = `node_modules/uview-plus/components/${comp}/theme-vars.scss`
  patch(rel, '组件级 wxss 中不被允许', (src) => (src.includes('page') || src.includes('data-up-theme') ? THEME_COMMENT : src))
}

// ---------- 6) u-goods-sku 的 image 标签选择器 ----------
patch(
  'node_modules/uview-plus/components/u-goods-sku/u-goods-sku.vue',
  'u-goods-sku__image-el',
  (src) =>
    src
      .replace(
        '<image :src="goodsInfo.image || goodsInfo.picture" mode="aspectFill"></image>',
        '<image class="u-goods-sku__image-el" :src="goodsInfo.image || goodsInfo.picture" mode="aspectFill"></image>'
      )
      .replace(
        /(\n\t+)image \{\r?\n\t+width: 100%;\r?\n\t+height: 100%;\r?\n(\t+)\}/,
        '$1/* 组件级 wxss 不允许 image 标签选择器（小程序告警并忽略），改用 class */$1.u-goods-sku__image-el {$1\twidth: 100%;$1\theight: 100%;$2}'
      )
)

console.log(`vendor patch: applied=${applied} skipped=${skipped} missed=${missed}`)
if (missed > 0) {
  console.log('注意：有补丁未命中，说明上游代码结构变了 —— 请检查并更新补丁规则')
  process.exitCode = 1
}

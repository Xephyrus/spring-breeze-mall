// 第三方组件里的「鸿蒙 UA 检测」补丁（可重复执行，幂等）
//
// 背景：HBuilderX 会扫 `platform` / UA 检测，对未处理鸿蒙的写法给出
// 「platform/UA检测逻辑可能未适配鸿蒙系统」告警。项目里剩下 2 处都在 vendored 代码：
//   1. js_sdk/u-draw-poster/utils/global.js      用 wx/uni.getSystemInfoSync 判断平台
//   2. uni_modules/Sansnn-uQRCode/.../bridge-weex.js  用 /ios/i.test(WXEnvironment.platform)
//
// 处理：
//   1. 改成「wx 是否存在」判断；uni 侧改用 getAppBaseInfo（新 API），
//      顺带消掉 getSystemInfoSync 的 deprecation 告警
//   2. 显式识别 harmony/ohos，行为保持不变（鸿蒙仍走 Android 分支）
//
// 为什么要有这个脚本：uni_modules 与 js_sdk 升级/重装会覆盖上述文件，
// 把补丁脚本挂在 postinstall 上，重装后自动重新打（与 patch-mqtt-abort.js 同一思路）。
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
let applied = 0
let skipped = 0

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
    console.log(`skip ${rel} (pattern not matched — upstream code changed?)`)
    return
  }
  fs.writeFileSync(abs, next, 'utf8')
  applied++
  console.log(`patched ${rel}`)
}

// 1) u-draw-poster 的平台探测
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

// 2) gcanvas 的 weex 平台判断
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

console.log(`harmony patch: applied=${applied} skipped=${skipped}`)

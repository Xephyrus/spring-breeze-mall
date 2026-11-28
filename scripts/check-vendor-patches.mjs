// 校验「第三方依赖补丁」是否都在位。
//
// 为什么需要：vendor 补丁（uni_modules / js_sdk / node_modules）会被重装覆盖。
// postinstall 会自动重打（scripts/patch-vendor-harmony.js），但一旦有人用
// `pnpm install --ignore-scripts` 或手动删了 node_modules，补丁就悄悄失效，
// 小程序端会重新出现「标签选择器/属性选择器」告警与 getSystemInfoSync 弃用告警。
//
// 用法：node scripts/check-vendor-patches.mjs（已接入 ci:precheck）
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.argv[2] || 'apps/uniapp')

const CHECKS = [
  {
    file: 'js_sdk/u-draw-poster/utils/global.js',
    mustContain: ['getAppBaseInfo'],
    mustNotContain: ['getSystemInfoSync === '],
    hint: 'u-draw-poster 平台探测未打补丁',
  },
  {
    file: 'uni_modules/Sansnn-uQRCode/js_sdk/gcanvas/bridge/bridge-weex.js',
    mustContain: ['isWeexHarmony'],
    hint: 'gcanvas 鸿蒙判断未打补丁',
  },
  {
    file: 'uni_modules/Sansnn-uQRCode/components/u-qrcode/u-qrcode.vue',
    mustNotContain: ['uni.getSystemInfoSync().pixelRatio'],
    hint: 'u-qrcode 仍在用 getSystemInfoSync',
  },
  {
    file: 'uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue',
    mustNotContain: ['uni.getSystemInfoSync().pixelRatio'],
    hint: 'uqrcode 仍在用 getSystemInfoSync',
  },
  {
    file: 'uni_modules/okingtz-cropper/components/okingtz-cropper/okingtz-cropper.vue',
    mustNotContain: ['uni.getSystemInfoSync()'],
    hint: '头像裁剪组件仍在用 getSystemInfoSync',
  },
  {
    file: 'node_modules/uview-plus/components/u-goods-sku/u-goods-sku.vue',
    mustContain: ['u-goods-sku__image-el'],
    hint: 'u-goods-sku 的 image 标签选择器未改 class',
  },
]

// uview-plus 的 theme-vars：组件级 wxss 不允许 page/body/[data-up-theme]
for (const comp of ['u-navbar', 'u-notice-bar', 'u-subsection', 'u-switch', 'u-tag']) {
  CHECKS.push({
    file: `node_modules/uview-plus/components/${comp}/theme-vars.scss`,
    mustNotContain: ['data-up-theme', 'page,', 'body {'],
    hint: `${comp} 的 theme-vars 仍含组件级 wxss 不允许的选择器`,
  })
}

const problems = []
for (const c of CHECKS) {
  const abs = path.join(ROOT, c.file)
  if (!fs.existsSync(abs)) {
    problems.push(`${c.file}: 文件不存在（${c.hint}）`)
    continue
  }
  const text = fs.readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  for (const s of c.mustContain || []) {
    if (!text.includes(s)) problems.push(`${c.file}: 缺少 "${s}"（${c.hint}）`)
  }
  for (const s of c.mustNotContain || []) {
    if (text.includes(s)) problems.push(`${c.file}: 仍包含 "${s}"（${c.hint}）`)
  }
}

if (problems.length) {
  console.log(`第三方补丁缺失 ${problems.length} 处：`)
  for (const p of problems) console.log(`  - ${p}`)
  console.log('\n修法：node apps/uniapp/scripts/patch-vendor-harmony.js（postinstall 会自动执行）')
  process.exit(1)
}
console.log('OK：第三方依赖补丁全部在位')

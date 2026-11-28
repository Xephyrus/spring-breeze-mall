// CI 预检：uniapp 的 <style> 里不能出现 HTML 标签选择器
//
// 原因：uni-app 编译到小程序时会把 <span>→<text>、<div>→<view> 自动转换，
// 但 WXSS 里的 `span {}` / `div {}` 不会跟着改 —— 规则直接失效，
// HBuilderX 也会报「style 暂不支持 span 标签选择器」。
// 反过来只把选择器改成 text/view，又会让 H5（元素仍是 span/div）丢样式。
// 唯一两端都成立的写法是 **class 选择器**。
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('apps/uniapp')
const SKIP = new Set(['node_modules', 'unpackage', 'uni_modules', 'hybrid', 'js_sdk', 'static', 'scripts', 'patches'])

// 只列「uni 编译到小程序时会改名/转换的 HTML 标签」：
// span→text、div/p→view、img→image、a→navigator…
// button / input / textarea / label / form 是小程序原生组件，选择器有效，不在检查范围
const TAGS = [
  'span', 'div', 'p', 'img', 'a', 'ul', 'ol', 'li', 'em', 'strong', 'small',
  'section', 'header', 'footer', 'nav', 'aside', 'article', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'dt', 'dd', 'pre', 'code', 'blockquote', 'hr',
  'font', 'center', 'i', 'b',
]
const TAG_RE = new RegExp(`(^|[\\s,>+~])((?:${TAGS.join('|')}))(?![\\w-])`, 'gi')
const DECL_RE = /^\s*[-a-z]+\s*:/

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(vue|scss|sass|css)$/.test(e.name)) out.push(p)
  }
  return out
}

/** 从内容里抠出「选择器行」：包含 { 且不是声明行、不是注释 */
function selectorLines(text) {
  const out = []
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed.includes('{')) return
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
    const selector = trimmed.slice(0, trimmed.indexOf('{')).trim()
    if (!selector || DECL_RE.test(selector)) return
    if (/^@/.test(selector)) return // @media / @include 等
    out.push({ lineNo: i + 1, selector })
  })
  return out
}

const findings = []
for (const file of walk(ROOT)) {
  const code = fs.readFileSync(file, 'utf8')
  const rawBlocks = file.endsWith('.vue')
    ? [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
    : [code]
  // `/* #ifdef H5 */ ... /* #endif */` 段只会编译到 H5（H5 支持标签选择器），
  // 小程序构建时已被条件编译裁掉 —— 不算违规
  const blocks = rawBlocks.map((b) => b.replace(/\/\* #ifdef H5 \*\/[\s\S]*?\/\* #endif \*\//g, ''))
  for (const body of blocks) {
    for (const { lineNo, selector } of selectorLines(body)) {
      TAG_RE.lastIndex = 0
      let m
      while ((m = TAG_RE.exec(selector))) {
        findings.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), lineNo, tag: m[2].toLowerCase(), selector })
      }
    }
  }
}

const raw = process.argv.includes('--raw')
if (raw) {
  if (findings.length) {
    console.log(`<style> 里发现 ${findings.length} 处标签选择器（小程序端不生效）：`)
    for (const f of findings) console.log(`  - ${f.file}:${f.lineNo}  <${f.tag}>  ${f.selector}`)
  }
  process.exit(0)
}

// 基线比对：允许「已知债务」存在，但任何文件不得超出基线，也不允许新增文件
const ALLOW_PATH = path.resolve('scripts/tag-selectors-allowlist.json')
let allow = { files: {} }
if (fs.existsSync(ALLOW_PATH)) {
  try {
    allow = JSON.parse(fs.readFileSync(ALLOW_PATH, 'utf8'))
  } catch {
    console.log('⚠️ 基线文件解析失败，按 0 处理')
  }
}
const counts = {}
for (const f of findings) counts[f.file] = (counts[f.file] || 0) + 1

const regressions = []
for (const [file, n] of Object.entries(counts)) {
  const allowed = allow.files?.[file] ?? 0
  if (n > allowed) regressions.push({ file, n, allowed })
}

if (regressions.length) {
  console.log(`标签选择器超出基线（小程序端样式会失效）：`)
  for (const r of regressions) {
    console.log(`  - ${r.file}: 现在 ${r.n} 处，基线允许 ${r.allowed} 处`)
    for (const f of findings.filter((x) => x.file === r.file)) {
      console.log(`      L${f.lineNo}  <${f.tag}>  ${f.selector}`)
    }
  }
  console.log('\n修法：给元素加 class，选择器改成 class（不要改成 text/view —— H5 会丢样式）。')
  process.exit(1)
}

const total = findings.length
const debtFiles = Object.keys(allow.files || {}).length
if (total) {
  console.log(`OK：标签选择器未超出基线（当前 ${total} 处 / ${debtFiles} 个文件，属已知技术债）`)
  console.log('    清理后用 node scripts/gen-tag-selectors-baseline.mjs 收紧基线。')
} else {
  console.log('OK：<style> 里没有标签选择器（小程序端样式不会失效）')
}

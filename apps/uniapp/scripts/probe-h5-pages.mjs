/**
 * H5「全页编译」探测：把 pages.json 里的每个页面模块请求一遍，看 Vite 能否现编译成功。
 *
 * 为什么有用：
 * - `vue-tsc` 只做类型检查，**不覆盖**模板表达式、SCSS、`easycom` 组件解析、资源路径；
 * - 本项目的 `typecheck` / `lint` 都跑在 Windows 上，而 Windows 大小写不敏感，
 *   历史上多次出现「本地全绿、H5 编译才炸」（例如 `./app.vue` vs `App.vue`）；
 * - HBuilderX 的 H5 dev server 是**按需编译**，所以把每个页面都请求一次，
 *   就等于把整个应用（连同其 import 的组件与 `.ts` 模块）编译一遍。
 *
 * 用法（先让 HBuilderX「运行到浏览器」把 dev server 起起来）：
 *   node scripts/probe-h5-pages.mjs                       # 默认 http://localhost:5173
 *   node scripts/probe-h5-pages.mjs http://127.0.0.1:5173
 *
 * 退出码：0 = 全部编译通过；1 = 有页面编译失败（会打印页面路径与 Vite 报错摘要）。
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(HERE, '..')
const BASE = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '')

/**
 * uni-app 的 `pages.json` 允许写注释（JSONC），直接 `JSON.parse` 会抛错。
 * 这里按字符扫一遍：字符串里的 `//`、`/* *\/` 原样保留，其余当注释去掉。
 */
function stripJsonComments(text) {
  let out = ''
  let inString = false
  let quote = ''
  let inLineComment = false
  let inBlockComment = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false
        out += ch
      }
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }
    if (inString) {
      out += ch
      if (ch === '\\') {
        out += text[i + 1] ?? ''
        i++
      } else if (ch === quote) {
        inString = false
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
      out += ch
      continue
    }
    if (ch === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }
    out += ch
  }
  return out
}

/** 从 pages.json 收集所有页面（主包 + 分包） */
function collectPages() {
  const raw = readFileSync(path.join(PROJECT_ROOT, 'pages.json'), 'utf8')
  const json = JSON.parse(stripJsonComments(raw))
  const pages = []
  for (const p of json.pages || []) pages.push(p.path + '.vue')
  const subs = json.subPackages || json.subpackages || []
  for (const sp of subs) {
    if (!sp || !sp.root) continue
    for (const p of sp.pages || []) pages.push(`${sp.root}/${p.path}.vue`)
  }
  return [...new Set(pages)]
}

async function probe(page) {
  const url = `${BASE}/${page}`
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (res.ok) return null
    const body = await res.text()
    const detail = body
      .split('\n')
      .filter((line) => /message|plugin|Error|error/.test(line))
      .slice(0, 2)
      .join(' ')
      .replace(/\s+/g, ' ')
      .slice(0, 200)
    return `${res.status} ${detail}`
  } catch (err) {
    return `请求失败：${err.message}`
  }
}

const pages = collectPages()
console.log(`探测 ${pages.length} 个页面模块 → ${BASE}`)

const failures = []
for (const [index, page] of pages.entries()) {
  const problem = await probe(page)
  if (problem) {
    failures.push([page, problem])
    console.log(`  ✖ [${index + 1}/${pages.length}] ${page}  ${problem}`)
  }
}

if (failures.length) {
  console.log(`\n失败 ${failures.length}/${pages.length}：`)
  for (const [page, problem] of failures) console.log(`  - ${page}  ${problem}`)
  process.exit(1)
}
console.log(`\nOK：${pages.length} 个页面模块全部编译通过`)

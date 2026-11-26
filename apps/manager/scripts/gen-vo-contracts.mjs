// 生成 VO 契约文档：从 types/vo/*.ts + api/*.ts + views 自动汇总
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('apps/manager/src')
const VO_DIR = path.join(ROOT, 'types', 'vo')
const API_DIR = path.join(ROOT, 'api')

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|vue)$/.test(e.name)) out.push(p)
  }
  return out
}

// ---------- 1) 解析 VO ----------
const voFiles = fs.readdirSync(VO_DIR).filter((f) => f.endsWith('.ts'))
const types = [] // { file, module, name, fields: [{name, type, doc, optional}], isAlias }

for (const f of voFiles) {
  const s = fs.readFileSync(path.join(VO_DIR, f), 'utf8').replace(/\r\n/g, '\n')
  const module = f.replace('.ts', '')
  const re = /(?:\/\*\*([\s\S]*?)\*\/\s*)?export (type|interface) (\w+)(?:<[^>]*>)?\s*=?\s*\{([\s\S]*?)\n\};/g
  let m
  while ((m = re.exec(s))) {
    const doc = (m[1] || '').split('\n').map((x) => x.replace(/^\s*\*?\s?/, '').trim()).filter(Boolean).join(' ')
    const name = m[3]
    const body = m[4]
    const fields = []
    for (const line of body.split('\n')) {
      const fm = line.match(/^\s*(\w+)\??\s*:\s*(.+?);\s*(?:\/\/\s*(.*))?$/)
      if (!fm) continue
      if (fm[1] === '') continue
      const optional = line.includes(fm[1] + '?')
      if (/^\[key: string\]: unknown$/.test(line.trim())) {
        fields.push({ name: '[key: string]', type: 'unknown', optional: true, doc: '后端扩容字段（索引签名）' })
        continue
      }
      fields.push({ name: fm[1], type: fm[2].trim(), optional, doc: fm[3] || '' })
    }
    types.push({ file: f, module, name, doc, fields })
  }
}

// ---------- 2) 解析 api：哪些函数用了哪个 VO ----------
const apiUsage = new Map() // VO名 -> [{file, fn, url}]
const apiFiles = fs.readdirSync(API_DIR).filter((f) => f.endsWith('.ts'))
for (const f of apiFiles) {
  const s = fs.readFileSync(path.join(API_DIR, f), 'utf8').replace(/\r\n/g, '\n')
  const re = /export const (\w+)[\s\S]{0,300}?Request<([^>]+)>\(\s*[`'"]([^`'"]+)/g
  let m
  while ((m = re.exec(s))) {
    const fn = m[1]
    const T = m[2]
    const url = m[3]
    for (const t of types) {
      // 直接出现类型名（含数组 / 字面量对象里出现）
      const re2 = new RegExp('\\b' + t.name + '\\b')
      if (re2.test(T)) {
        if (!apiUsage.has(t.name)) apiUsage.set(t.name, [])
        const list = apiUsage.get(t.name)
        if (!list.some((x) => x.fn === fn)) list.push({ file: f, fn, url, raw: T })
      }
    }
  }
}

// ---------- 3) 解析页面引用 ----------
const viewUsage = new Map() // VO名 -> Set(文件)
for (const p of walk(ROOT)) {
  if (p.includes(path.sep + 'types' + path.sep)) continue
  if (p.includes(path.sep + 'api' + path.sep)) continue
  const s = fs.readFileSync(p, 'utf8')
  const imp = s.match(/import type \{([^}]+)\} from ["']@\/types\/vo\/(\w+)["']/)
  if (!imp) continue
  for (const n of imp[1].split(',').map((x) => x.trim())) {
    if (!n) continue
    if (!viewUsage.has(n)) viewUsage.set(n, new Set())
    viewUsage.get(n).add(path.relative(ROOT, p).replace(/\\/g, '/'))
  }
}

// ---------- 3.5) 被其他 VO 嵌套引用 ----------
const nestedUsage = new Map() // VO名 -> Set(引用它的VO名)
for (const t of types) {
  for (const f of t.fields) {
    for (const other of types) {
      if (other.name === t.name) continue
      if (new RegExp('\\b' + other.name + '\\b').test(f.type)) {
        if (!nestedUsage.has(other.name)) nestedUsage.set(other.name, new Set())
        nestedUsage.get(other.name).add(t.name)
      }
    }
  }
}

// ---------- 4) 输出 ----------
const lines = []
lines.push('# VO 契约文档（前端类型 → 后端返回）')
lines.push('')
lines.push('> 本文件由 `scripts/gen-vo-contracts.mjs` 从代码自动生成，**不要手改**（改代码后重新生成）。')
lines.push('> 生成时间：' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))
lines.push('')
lines.push('## 这份文档解决什么问题')
lines.push('')
lines.push('接口返回什么、页面依赖哪些字段、哪些字段后端可能不返回 —— 过去只散落在代码里。')
lines.push('这里把它固化成一张表：**字段名 / 类型 / 是否必填 / 被哪个接口返回 / 被哪些页面使用**。')
lines.push('')
lines.push('## 使用约定')
lines.push('')
lines.push('| 约定 | 说明 |')
lines.push('|---|---|')
lines.push('| 字段默认可选 | 后端 DTO 扩容会漏字段，声明为 `?` 可避免页面直接崩 |')
lines.push('| `[key: string]: unknown` | 保留后端新增字段的入口；要读新字段时**就地断言**，不要把整个对象退回 `any` |')
lines.push('| 数字/金额可能是字符串 | 后端 `BigDecimal` 序列化后是字符串，声明为 `number \\| string` |')
lines.push('| 枚举是字符串 | 状态类字段（orderStatus 等）是后端枚举 `name()`，不要写成联合字面量 |')
lines.push('')

// 总览
lines.push('## 一、总览')
lines.push('')
lines.push('| 类型 | 模块 | 字段数 | 被接口使用 | 被页面使用 | 备注 |')
lines.push('|---|---|---:|---|---|---|')
for (const t of types.sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name))) {
  const apis = apiUsage.get(t.name) || []
  const views = viewUsage.get(t.name) || new Set()
  const nested = nestedUsage.get(t.name) || new Set()
  const unused = !apis.length && !views.size && !nested.size
  lines.push(`| \`${t.name}\` | ${t.module} | ${t.fields.length} | ${apis.length ? apis.length + ' 个' : '—'} | ${views.size ? views.size + ' 个' : '—'} | ${unused ? '⚠️ 未使用' : ''} |`)
}
lines.push('')

// 分模块明细
const byModule = new Map()
for (const t of types) {
  if (!byModule.has(t.module)) byModule.set(t.module, [])
  byModule.get(t.module).push(t)
}

lines.push('## 二、按模块明细')
lines.push('')
for (const [mod, list] of [...byModule.entries()].sort()) {
  lines.push(`### ${mod}`)
  lines.push('')
  for (const t of list.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`#### \`${t.name}\``)
    lines.push('')
    if (t.doc) {
      lines.push(t.doc)
      lines.push('')
    }
    const apis = apiUsage.get(t.name) || []
    if (apis.length) {
      lines.push('**被这些接口返回**：')
      lines.push('')
      lines.push('| 函数 | 路径 | 实际泛型 |')
      lines.push('|---|---|---|')
      for (const a of apis) lines.push(`| \`${a.fn}\` | \`${a.url}\` | \`${a.raw}\` |`)
      lines.push('')
    }
    const nested = [...(nestedUsage.get(t.name) || new Set())]
    if (nested.length) {
      lines.push('**被这些 VO 嵌套引用**：' + nested.map((v) => '`' + v + '`').join('、'))
      lines.push('')
    }
    const views = [...(viewUsage.get(t.name) || new Set())]
    if (views.length) {
      lines.push('**被这些页面使用**：' + views.map((v) => '`' + v + '`').join('、'))
      lines.push('')
    }
    if (!t.fields.length) {
      lines.push('_（无字段声明，或为纯别名）_')
      lines.push('')
      continue
    }
    lines.push('| 字段 | 类型 | 必填 | 说明 |')
    lines.push('|---|---|:--:|---|')
    for (const f of t.fields) {
      const type = f.type.replace(/\|/g, '\\|')
      lines.push(`| \`${f.name}\` | \`${type}\` | ${f.optional ? '' : '✅'} | ${f.doc} |`)
    }
    lines.push('')
  }
}

// 未覆盖清单
const unusedTypes = types.filter((t) => !(apiUsage.get(t.name) || []).length && !(viewUsage.get(t.name) || new Set()).size && !(nestedUsage.get(t.name) || new Set()).size)
lines.push('## 三、未被任何代码使用的类型')
lines.push('')
if (unusedTypes.length === 0) {
  lines.push('_无 —— 所有 VO 都有实际使用方。_')
} else {
  lines.push('这些类型目前没有接口或页面引用，属于**预留 / 待清理**：')
  lines.push('')
  lines.push('| 类型 | 模块 | 字段数 | 建议 |')
  lines.push('|---|---|---:|---|')
  for (const t of unusedTypes) {
    lines.push(`| \`${t.name}\` | ${t.module} | ${t.fields.length} | 若下个模块要用就保留，否则删除 |`)
  }
}
lines.push('')
lines.push('## 四、还没建 VO 的部分')
lines.push('')
lines.push('`api/*.ts` 里仍有一部分接口没有返回类型（`getRequest(...)` 未带泛型）。')
lines.push('它们对应的实体还没有逐字段 VO，属于剩余待办，推进方式见 `API-TYPING-PLAN.md` 第九节。')
lines.push('')
lines.push('```')
const total = apiFiles.reduce((n, f) => {
  const s = fs.readFileSync(path.join(API_DIR, f), 'utf8')
  return n + (s.match(/getRequest\(/g) || []).length
}, 0)
const typed = apiFiles.reduce((n, f) => {
  const s = fs.readFileSync(path.join(API_DIR, f), 'utf8')
  return n + (s.match(/getRequest</g) || []).length
}, 0)
lines.push(`api 文件：${apiFiles.length} 个`)
lines.push(`getRequest 调用：${total} 个，其中已标类型 ${typed} 个（${Math.round((typed / total) * 100)}%）`)
lines.push('```')
lines.push('')

const out = path.resolve('apps/manager/VO-CONTRACTS.md')
fs.writeFileSync(out, lines.join('\n'), 'utf8')
console.log('OK 生成 VO-CONTRACTS.md')
console.log('  类型数: ' + types.length)
console.log('  VO 文件: ' + voFiles.length)
console.log('  被接口使用: ' + apiUsage.size + ' 个类型')
console.log('  被页面引用: ' + viewUsage.size + ' 个类型')
console.log('  行数: ' + lines.length)

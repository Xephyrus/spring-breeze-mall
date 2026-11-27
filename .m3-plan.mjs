// M3-1 预演：生成 kebab 重命名映射，并统计每处引用
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('apps/seller/src')

// 装修子系统：组件名与业务类型一一对应（PanelGoods / TplGoods / tpl_goods …），
// 改名会牵动「组件 name + 动态渲染 + 已存页面 JSON」，本批不动。
const EXEMPT_DIRS = [
  'views/shop/pc/config-panel',
  'views/shop/pc/template',
  'views/shop/pc/controls',
  'views/shop/wap/config-panel',
  'views/shop/wap/template',
  'views/shop/wap/controls',
  'views/shop/hotzone',
]

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(vue|js|ts)$/.test(e.name)) out.push(p)
  }
  return out
}

const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()

const files = walk(SRC)
const all = files.map((f) => path.relative(SRC, f).replace(/\\/g, '/'))
const plan = []

for (const rel of all) {
  const dir = path.posix.dirname(rel)
  if (EXEMPT_DIRS.some((d) => rel.startsWith(d + '/'))) continue
  const base = path.posix.basename(rel)
  const ext = path.posix.extname(base)
  const stem = base.slice(0, -ext.length)
  if (!/[A-Z]/.test(stem) && !stem.includes('_')) continue
  const newStem = kebab(stem)
  if (newStem === stem) continue
  plan.push({ from: rel, to: path.posix.join(dir, newStem + ext) })
}

// 统计引用次数（按旧 basename 搜索）
const contents = new Map()
for (const rel of all) {
  contents.set(rel, fs.readFileSync(path.join(SRC, rel), 'utf8'))
}

const report = plan.map(({ from, to }) => {
  const oldStem = path.posix.basename(from, path.posix.extname(from))
  const oldBase = path.posix.basename(from)
  const newBase = path.posix.basename(to)
  let refs = 0
  for (const text of contents.values()) {
    if (text.includes(oldBase)) refs++
  }
  return { from, to, oldBase, newBase, refs }
})

console.log(`待重命名 ${report.length} 个文件（装修子系统已豁免）\n`)
for (const r of report) {
  console.log(`  ${r.from}  →  ${path.posix.basename(r.to)}   引用文件数 ${r.refs}`)
}

// 豁免清单
const exempt = all.filter(
  (rel) =>
    EXEMPT_DIRS.some((d) => rel.startsWith(d + '/')) &&
    /[A-Z]|_/.test(path.posix.basename(rel))
)
console.log(`\n豁免（装修子系统）${exempt.length} 个，示例：\n  ` + exempt.slice(0, 8).join('\n  '))

fs.writeFileSync('.m3-plan.json', JSON.stringify(report, null, 2), 'utf8')

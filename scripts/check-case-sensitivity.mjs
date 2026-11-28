// 大小写敏感性预检：Windows 上 typecheck 能过、Linux（CI）会挂的典型原因
// 检查所有 .ts/.vue/.js 里的相对/别名 import，逐段比对磁盘上的真实大小写
import fs from 'node:fs'
import path from 'node:path'

const REPO = path.resolve('.')
const APPS = {
  manager: { dir: 'apps/manager/src', alias: '@' },
  seller: { dir: 'apps/seller/src', alias: '@' },
  im: { dir: 'apps/im/src', alias: '@' },
  buyer: { dir: 'apps/buyer/src', alias: '@' },
  uniapp: { dir: 'apps/uniapp', alias: '@' },
}

const EXTS = ['', '.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '/index.ts', '/index.js', '/index.vue']

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'unpackage', 'uni_modules', 'hybrid', 'target'].includes(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|vue|js|jsx)$/.test(e.name)) out.push(p)
  }
  return out
}

/** 逐段检查大小写是否与磁盘一致 */
function casingMismatch(baseDir, relSpec) {
  const segs = relSpec.split('/').filter((s) => s && s !== '.')
  let cur = baseDir
  for (const seg of segs) {
    if (seg === '..') {
      cur = path.dirname(cur)
      continue
    }
    if (!fs.existsSync(cur)) return null
    const entries = fs.readdirSync(cur, { withFileTypes: true })
    const exact = entries.find((e) => e.name === seg)
    if (exact) {
      cur = path.join(cur, seg)
      continue
    }
    const ci = entries.find((e) => e.name.toLowerCase() === seg.toLowerCase())
    if (ci) return `${seg} 实际是 ${ci.name}`
    return null // 文件不存在（可能由扩展名候选处理，交给 TS）
  }
  return null
}

const problems = []
for (const [app, cfg] of Object.entries(APPS)) {
  const root = path.join(REPO, cfg.dir)
  for (const file of walk(root)) {
    const code = fs.readFileSync(file, 'utf8')
    const rel = path.relative(REPO, file).split(path.sep).join('/')
    const re = /(?:from\s+|import\(\s*)(['"])([^'"\n]+)\1/g
    let m
    while ((m = re.exec(code))) {
      const spec = m[2]
      let baseDir
      let target
      if (spec.startsWith('@/')) {
        baseDir = root
        target = spec.slice(2)
      } else if (spec.startsWith('./') || spec.startsWith('../')) {
        baseDir = path.dirname(file)
        target = spec
      } else {
        continue
      }
      const mismatch = casingMismatch(baseDir, target)
      if (mismatch) problems.push(`${rel}  →  ${spec}  （${mismatch}）`)
    }
  }
}

if (problems.length) {
  console.log(`大小写不一致 ${problems.length} 处（Linux/CI 会解析失败）：`)
  problems.forEach((p) => console.log('  - ' + p))
  process.exit(1)
}
console.log('OK：所有 import 的大小写与磁盘一致（Windows 与 Linux 都能解析）')

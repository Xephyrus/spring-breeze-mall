// CI 预检：import 大小写一致性（Windows 通过 / Linux 失败的典型原因）
//
// 关键点：**不要用 fs.existsSync 判断存在性** —— Windows 文件系统大小写不敏感，
// existsSync('./app.vue') 在只有 App.vue 时也返回 true，于是本地检测不出问题。
// 这里改成逐段 readdir + 精确名字比对，因此在 Windows 上也能抓出 CI 才会炸的写法。
import fs from 'node:fs'
import path from 'node:path'

const REPO = path.resolve('.')
const APPS = [
  ['manager', 'apps/manager/src'],
  ['seller', 'apps/seller/src'],
  ['im', 'apps/im/src'],
  ['buyer', 'apps/buyer/src'],
  ['uniapp', 'apps/uniapp'],
]

const SKIP = new Set(['node_modules', 'dist', 'unpackage', 'uni_modules', 'hybrid', 'js_sdk', 'scripts', 'patches', 'target'])
const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '/index.ts', '/index.js', '/index.vue']

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|vue|js|jsx)$/.test(e.name)) out.push(p)
  }
  return out
}

const dirCache = new Map()
function names(dir) {
  if (!dirCache.has(dir)) {
    let list = []
    try {
      list = fs.readdirSync(dir, { withFileTypes: true }).map((e) => e.name)
    } catch {
      list = []
    }
    dirCache.set(dir, list)
  }
  return dirCache.get(dir)
}

/** 把 spec 逐段与磁盘比对；返回 { kind: 'mismatch'|'missing', detail } */
function resolveCaseSensitive(baseDir, spec) {
  const segs = spec.split('/').filter((s) => s && s !== '.')
  let cur = baseDir
  const actual = []
  for (const seg of segs) {
    if (seg === '..') {
      cur = path.dirname(cur)
      actual.push('..')
      continue
    }
    const list = names(cur)
    if (list.includes(seg)) {
      cur = path.join(cur, seg)
      actual.push(seg)
      continue
    }
    const ci = list.find((n) => n.toLowerCase() === seg.toLowerCase())
    if (ci) return { kind: 'mismatch', detail: `"${seg}" 磁盘上是 "${ci}"` }
    return { kind: 'missing', detail: `找不到 "${seg}"` }
  }
  return null
}

const problems = []
for (const [, dir] of APPS) {
  const root = path.join(REPO, dir)
  for (const file of walk(root)) {
    const code = fs.readFileSync(file, 'utf8')
    const rel = path.relative(REPO, file).split(path.sep).join('/')
    const fileDir = path.dirname(file)
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
        baseDir = fileDir
        target = spec
      } else {
        continue
      }

      // 逐个候选后缀尝试；任何一个能命中真实大小写即算通过
      let hit = null
      let mismatch = null
      for (const suffix of CANDIDATE_SUFFIXES) {
        const res = resolveCaseSensitive(baseDir, target + suffix)
        if (!res) {
          hit = suffix
          break
        }
        if (res.kind === 'mismatch' && !mismatch) mismatch = res.detail
      }
      if (!hit && mismatch) problems.push(`${rel}  →  ${spec}  （${mismatch}）`)
    }
  }
}

if (problems.length) {
  console.log(`大小写不一致 ${problems.length} 处（Linux/CI 会解析失败）：`)
  problems.forEach((p) => console.log('  - ' + p))
  process.exit(1)
}
console.log('OK：所有 import 的大小写与磁盘一致（Windows 与 Linux 都能解析）')

// ---------------------------------------------------------------------------
// 第二类检查：git 索引里的文件名 与 工作区实际文件名 是否仅大小写不同
//
// 这次的 CI 失败就出在这里：在 Windows 上用普通重命名改大小写，
// 工作区变成 app.vue，但 git 索引里仍是 App.vue，提交后 Linux 上 checkout 出来是
// App.vue，而 import 写的是 ./app.vue → 解析失败。
// 下面直接用 git 命令比对，Windows/Linux 行为一致。
import { execFileSync } from 'node:child_process'

function detectIndexCaseDrift() {
  let tracked = []
  try {
    tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
  } catch {
    return []
  }
  const drift = []
  for (const rel of tracked) {
    const abs = path.join(REPO, rel)
    if (!fs.existsSync(abs)) continue
    const dir = path.dirname(abs)
    const base = path.basename(rel)
    let actual = null
    try {
      actual = fs.readdirSync(dir, { withFileTypes: true }).find((e) => e.name.toLowerCase() === base.toLowerCase())
    } catch {
      actual = null
    }
    if (actual && actual.name !== base) {
      drift.push(`${rel}  →  工作区实际为 ${actual.name}（索引未记录这次改名）`)
    }
  }
  return drift
}

const drift = detectIndexCaseDrift()
if (drift.length) {
  console.log(`\ngit 索引与工作区的文件名大小写漂移 ${drift.length} 处（提交后 Linux 会解析失败）：`)
  drift.forEach((d) => console.log('  - ' + d))
  console.log('  修法：git update-index --force-remove <旧名> && git add <新名>')
  process.exit(1)
}
console.log('OK：git 索引名与工作区文件名大小写一致')
// 应用仓库里为 uview-plus 维护的补丁（pnpm 结构下 patch-package 不可用，这里自己应用）
//
// 背景：
//  - 项目用 pnpm，没有 package-lock.json / yarn.lock，patch-package 会直接报
//    "No package-lock.json, npm-shrinkwrap.json, or yarn.lock file" 并退出；
//  - pnpm 把包放在 node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>，
//    apps/uniapp/node_modules/<pkg> 只是符号链接，`git apply` 不会跟随符链写入；
//  - 所以这里把补丁里的 `node_modules/uview-plus/...` 路径改写成 store 里的真实路径再应用。
//
// 幂等：先反向 --check，能反向应用说明已打过，直接跳过。
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const APP_DIR = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_DIR, '..', '..')
const PATCH_FILE = path.join(APP_DIR, 'patches', 'uview-plus+3.8.42.patch')

if (!fs.existsSync(PATCH_FILE)) {
  console.log('no uview-plus patch, skip')
  process.exit(0)
}

// 找到 pnpm store 里的真实目录
const storeBase = path.join(REPO_ROOT, 'node_modules', '.pnpm')
let realDir = null
if (fs.existsSync(storeBase)) {
  const hit = fs.readdirSync(storeBase).find((d) => d.startsWith('uview-plus@'))
  if (hit) realDir = path.join('node_modules', '.pnpm', hit, 'node_modules', 'uview-plus')
}
if (!realDir) {
  console.log('uview-plus not installed yet, skip')
  process.exit(0)
}

const original = fs.readFileSync(PATCH_FILE, 'utf8')
const rewritten = original
  .split('node_modules/uview-plus/')
  .join(realDir.split(path.sep).join('/') + '/')
const tmp = path.join(APP_DIR, 'patches', '.tmp-uview-plus.patch')
fs.writeFileSync(tmp, rewritten, 'utf8')

function gitApply(args) {
  return spawnSync('git', ['apply', ...args], { cwd: REPO_ROOT, encoding: 'utf8' })
}

try {
  // 已应用？（反向 check 通过 => 已经打过）
  const reverse = gitApply(['--check', '--reverse', tmp])
  if (reverse.status === 0) {
    console.log('uview-plus patch already applied, skip')
    process.exit(0)
  }
  const forward = gitApply(['--check', tmp])
  if (forward.status !== 0) {
    console.log('uview-plus patch 不匹配当前版本（上游可能升级了）：')
    console.log((forward.stderr || forward.stdout || '').trim().split('\n').slice(0, 5).join('\n'))
    process.exit(0)
  }
  const applied = gitApply([tmp])
  if (applied.status === 0) {
    console.log('uview-plus patch applied')
  } else {
    console.log('uview-plus patch 应用失败：' + (applied.stderr || '').trim())
    process.exitCode = 1
  }
} finally {
  fs.rmSync(tmp, { force: true })
}

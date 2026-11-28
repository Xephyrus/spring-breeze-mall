// 扫描受跟踪文件里疑似「真实凭据」的字面量（微信 AppID/AppSecret、云密钥等）
//
// 设计取向：宁可少报，也不要报出几千条 UUID/图片名 —— 那样没人会看。
// 通用 32 位 hex 只在**同一行出现密钥类字段名**时才报。
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const REPO = path.resolve('.')
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)

const SECRET_FIELD = /(appsecret|app_secret|appSecret|secret|api[_-]?key|access[_-]?key|accessKeyId|private[_-]?key|password|passwd|token)\s*[:=]/i

const RULES = [
  {
    name: '微信小程序 AppID',
    re: /\bwx[0-9a-f]{16}\b/g,
    // 全零是占位值
    allow: (v) => /^wx0{16}$/.test(v),
  },
  {
    name: '阿里云 AccessKey',
    re: /\bLTAI[0-9A-Za-z]{12,}\b/g,
  },
  {
    name: 'AWS AccessKey',
    re: /\bAKIA[0-9A-Z]{16}\b/g,
    allow: (v) => v === 'AKIAIOSFODNN7EXAMPLE',
  },
  {
    name: '私钥块',
    re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
  },
  {
    name: '密钥字段旁的 32 位 hex',
    re: /\b[0-9a-f]{32}\b/g,
    requireFieldInLine: true,
  },
]

const findings = []
for (const rel of tracked) {
  if (/\.(png|jpe?g|gif|webp|mp3|mp4|woff2?|ttf|jar|zip)$/i.test(rel)) continue
  if (rel.endsWith('check-secrets.mjs')) continue
  let text
  try {
    text = fs.readFileSync(path.join(REPO, rel), 'utf8')
  } catch {
    continue
  }
  const lines = text.split('\n')

  for (const rule of RULES) {
    rule.re.lastIndex = 0
    let m
    while ((m = rule.re.exec(text))) {
      const value = m[0]
      if (rule.allow && rule.allow(value)) continue
      const lineNo = text.slice(0, m.index).split('\n').length
      const line = lines[lineNo - 1] ?? ''
      if (rule.requireFieldInLine && !SECRET_FIELD.test(line)) continue
      // 注释里标注「占位 / 示例」的行放行
      if (/占位|placeholder|示例|example|示意/i.test(line)) continue
      // 代码里剥离 PEM 头尾（形如 .replace('-----BEGIN PRIVATE KEY-----', '')）不是私钥
      if (/replace(All)?\s*\(/.test(line)) continue
      findings.push({ rel, lineNo, name: rule.name, value })
    }
  }
}

if (findings.length) {
  console.log(`疑似真实凭据 ${findings.length} 处：`)
  for (const f of findings) {
    const masked = f.value.length > 10 ? f.value.slice(0, 6) + '…' + f.value.slice(-4) : f.value
    console.log(`  - ${f.rel}:${f.lineNo}  [${f.name}]  ${masked}`)
  }
  console.log('\n修法：换成占位值（微信 AppID 用 wx0000000000000000，密钥用空串），')
  console.log('并在 README「安全提醒」里说明该字段去哪填。')
  process.exit(1)
}
console.log('OK：受跟踪文件里没有发现疑似真实凭据')

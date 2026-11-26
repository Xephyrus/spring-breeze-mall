import fs from 'fs'
import path from 'path'

/**
 * One-shot migration: upgrade == / != to === / !== outside strings/comments.
 * Keeps == null / != null / == undefined / != undefined (eslint eqeqeq null:ignore).
 *
 * IMPORTANT: must not touch existing === / !== (otherwise === becomes ====).
 */
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === 'public') continue
      walk(p, acc)
    } else if (/\.(js|vue)$/.test(ent.name)) {
      acc.push(p)
    }
  }
  return acc
}

function transform(code) {
  let out = ''
  let i = 0
  const stack = ['code'] // code | squote | dquote | template | line | block

  const peek = () => stack[stack.length - 1]
  const push = (s) => stack.push(s)
  const pop = () => stack.pop()

  while (i < code.length) {
    const c = code[i]
    const n = code[i + 1]
    const n2 = code[i + 2]
    const state = peek()

    if (state === 'code') {
      if (c === '/' && n === '/') {
        out += '//'
        i += 2
        push('line')
        continue
      }
      if (c === '/' && n === '*') {
        out += '/*'
        i += 2
        push('block')
        continue
      }
      if (c === "'") {
        out += c
        i++
        push('squote')
        continue
      }
      if (c === '"') {
        out += c
        i++
        push('dquote')
        continue
      }
      if (c === '`') {
        out += c
        i++
        push('template')
        continue
      }
      if (c === '}' && stack.length > 1 && stack[stack.length - 2] === 'template') {
        out += c
        i++
        pop()
        continue
      }
      // Already strict: === or !== — copy through unchanged
      if ((c === '=' || c === '!') && n === '=' && n2 === '=') {
        out += c + n + n2
        i += 3
        continue
      }
      // Loose == / != → === / !== (except null/undefined)
      if ((c === '=' || c === '!') && n === '=') {
        let j = i + 2
        while (j < code.length && /\s/.test(code[j])) j++
        const ahead = code.slice(j)
        if (/^(null|undefined)\b/.test(ahead)) {
          out += c + n
          i += 2
          continue
        }
        out += c + n + '='
        i += 2
        continue
      }
      out += c
      i++
      continue
    }

    if (state === 'line') {
      out += c
      i++
      if (c === '\n') pop()
      continue
    }

    if (state === 'block') {
      out += c
      i++
      if (c === '*' && n === '/') {
        out += '/'
        i++
        pop()
      }
      continue
    }

    if (state === 'squote') {
      out += c
      i++
      if (c === '\\') {
        out += code[i] || ''
        i++
        continue
      }
      if (c === "'") pop()
      continue
    }

    if (state === 'dquote') {
      out += c
      i++
      if (c === '\\') {
        out += code[i] || ''
        i++
        continue
      }
      if (c === '"') pop()
      continue
    }

    if (state === 'template') {
      out += c
      i++
      if (c === '\\') {
        out += code[i] || ''
        i++
        continue
      }
      if (c === '`') {
        pop()
        continue
      }
      if (c === '$' && n === '{') {
        out += '{'
        i++
        push('code')
        continue
      }
      continue
    }
  }

  return out
}

const root = path.resolve('src')
const files = walk(root)
let changed = 0
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8')
  const after = transform(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    changed++
    console.log('fixed', path.relative(process.cwd(), file))
  }
}
console.log('files_changed=' + changed)

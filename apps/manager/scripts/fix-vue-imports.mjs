/**
 * Fix SFC import paths for vue-tsc:
 * - file.vue → keep/add .vue
 * - dir/index.vue → use /index.vue (never dir.vue)
 * - undo mistaken dir.vue when dir/index.vue exists
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(vue|ts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function resolveBase(fromFile, spec) {
  if (spec.startsWith("@/")) return path.join(root, spec.slice(2));
  if (spec.startsWith("./") || spec.startsWith("../")) {
    return path.resolve(path.dirname(fromFile), spec);
  }
  return null;
}

function rewriteSpec(fromFile, spec) {
  // Undo mistaken `foo.vue` when `foo/index.vue` exists
  if (spec.endsWith(".vue") && !spec.endsWith("/index.vue")) {
    const without = spec.slice(0, -4);
    const base = resolveBase(fromFile, without);
    if (base && fs.existsSync(path.join(base, "index.vue"))) {
      return `${without}/index.vue`;
    }
    if (base && fs.existsSync(base + ".vue")) return spec;
    // hotzone package entry via index.ts — prefer folder index.vue if present
    return spec;
  }

  if (spec.endsWith(".vue") || spec.endsWith(".ts") || spec.endsWith(".json")) return spec;
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return spec;

  const base = resolveBase(fromFile, spec);
  if (!base) return spec;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return spec;

  if (fs.existsSync(base + ".vue")) return `${spec}.vue`;
  if (fs.existsSync(path.join(base, "index.vue"))) return `${spec}/index.vue`;
  return spec;
}

const re = /from\s+(['"])([^'"]+)\1/g;
let filesChanged = 0;
let importFixed = 0;

for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  let changed = false;
  text = text.replace(re, (full, quote, spec) => {
    const next = rewriteSpec(file, spec);
    if (next === spec) return full;
    changed = true;
    importFixed++;
    return `from ${quote}${next}${quote}`;
  });
  if (changed) {
    fs.writeFileSync(file, text, "utf8");
    filesChanged++;
  }
}

console.log(`fixed ${importFixed} imports in ${filesChanged} files`);

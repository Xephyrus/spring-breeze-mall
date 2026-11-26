/**
 * Rename remaining .js under src to .ts (skip known binary/vendor paths)
 * and lightly annotate common API export shapes.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");
const skipRe = /tinymce|lib-generate-test-usersig|GenerateTestUserSig\.js$/i;

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name.endsWith(".js") && !skipRe.test(p)) out.push(p);
  }
  return out;
}

function annotateApi(content) {
  let next = content;
  // common untyped params
  next = next.replace(
    /export const (\w+) = \(\s*params\s*\)\s*=>/g,
    "export const $1 = (params?: Record<string, unknown>) =>"
  );
  next = next.replace(
    /export const (\w+) = \(\s*(\w+)\s*,\s*params\s*\)\s*=>/g,
    "export const $1 = ($2: string | number, params?: Record<string, unknown>) =>"
  );
  next = next.replace(
    /export const (\w+) = \(\s*(id|ids|mobile|token|type|status|verificationEnums)\s*\)\s*=>/g,
    "export const $1 = ($2: string | number) =>"
  );
  if (!next.includes("Record<string, unknown>") && next.includes("params?: Record")) {
    // already fine
  }
  return next;
}

const files = walk(root);
const renamed = [];
for (const file of files) {
  const dest = file.replace(/\.js$/i, ".ts");
  let content = fs.readFileSync(file, "utf8");
  if (file.includes(`${path.sep}api${path.sep}`)) {
    content = annotateApi(content);
  }
  // drop .js extensions in local relative imports within moved files
  content = content.replace(/(from\s+["'][^"']+)\.js(["'])/g, "$1$2");
  content = content.replace(/(import\s+["'][^"']+)\.js(["'])/g, "$1$2");
  fs.writeFileSync(dest, content, "utf8");
  fs.unlinkSync(file);
  renamed.push(path.relative(root, dest));
}

console.log(`renamed ${renamed.length} files`);
for (const r of renamed) console.log(` - ${r}`);

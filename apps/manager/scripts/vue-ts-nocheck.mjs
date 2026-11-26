/**
 * Insert // @ts-nocheck after opening script tag so vue-tsc can focus on .ts modules
 * during pragmatic migration. Remove file-by-file as domains get proper types.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");
const keepChecked = new Set([
  path.normalize("views/login.vue"),
  path.normalize("views/sys/menu-manage/menuManage.vue"),
  path.normalize("views/sys/user-manage/userManage.vue"),
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".vue")) out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (keepChecked.has(path.normalize(rel))) continue;
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("@ts-nocheck")) continue;
  const next = text.replace(
    /(<script\b[^>]*\blang=["']ts["'][^>]*>)(\r?\n)/,
    "$1$2// @ts-nocheck$2"
  );
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    n++;
  }
}
console.log(`added @ts-nocheck to ${n} vue files`);

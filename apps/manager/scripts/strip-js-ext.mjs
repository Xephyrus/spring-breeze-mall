import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(vue|ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function keepJs(spec) {
  return /GenerateTestUserSig|tinymce|lib-generate/i.test(spec);
}

let n = 0;
for (const file of walk(root)) {
  let t = fs.readFileSync(file, "utf8");
  const before = t;
  t = t.replace(/(from\s+['"][^'"]+?)\.js(['"])/g, (m, a, b) => (keepJs(m) ? m : a + b));
  t = t.replace(/(import\s*\(\s*['"][^'"]+?)\.js(['"]\s*\))/g, (m, a, b) =>
    keepJs(m) ? m : a + b
  );
  if (t !== before) {
    fs.writeFileSync(file, t, "utf8");
    n++;
  }
}
console.log(`updated imports in ${n} files`);

import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(import.meta.dirname, "../src/api");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, "utf8");
  const before = t;
  t = t.replace(/export const (\w+) = \(([^)]*)\) =>/g, (m, name, args) => {
    if (!args.trim()) return m;
    if (args.includes(":")) return m;
    const parts = args.split(",").map((s) => s.trim()).filter(Boolean);
    const typed = parts
      .map((part) => {
        if (part === "params") return "params?: Record<string, unknown>";
        return `${part}: any`;
      })
      .join(", ");
    return `export const ${name} = (${typed}) =>`;
  });
  if (t !== before) fs.writeFileSync(p, t);
}
console.log("api params annotated");

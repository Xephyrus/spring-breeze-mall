import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");
const exts = new Set([".js", ".vue", ".ts"]);
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (exts.has(path.extname(ent.name))) files.push(p);
  }
}

walk(root);

let changed = 0;
for (const file of files) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.endsWith("/utils/message.js") || normalized.endsWith("/utils/message.ts")) {
    continue;
  }

  let text = fs.readFileSync(file, "utf8");
  const orig = text;

  text = text.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']@\/utils\/message["'];?/g,
    (_full, body) => {
      const names = body
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const keep = names.filter((n) => n !== "Message" && n !== "Notice");
      const needEl = names.some((n) => n === "Message" || n === "Notice");
      const lines = [];
      if (needEl) lines.push('import { ElMessage } from "element-plus";');
      if (keep.length) {
        lines.push(`import { ${keep.join(", ")} } from "@/utils/message";`);
      }
      return lines.join("\n");
    }
  );

  text = text.replace(/(?<![.\w])Message\.(success|error|warning|info)\b/g, "ElMessage.$1");

  text = text.replace(
    /(?<![.\w])Notice\.(success|error|warning|info|open)\s*\(\s*\{([\s\S]*?)\}\s*\)/g,
    (_full, method, body) => {
      const typeMatch = body.match(/type\s*:\s*['"](\w+)['"]/);
      const descMatch =
        body.match(/(?:desc|title|content)\s*:\s*([`'"])([\s\S]*?)\1/) ||
        body.match(/(?:desc|title|content)\s*:\s*([^,}\n]+)/);
      let msg = '""';
      if (descMatch) {
        msg = descMatch[2] !== undefined ? JSON.stringify(descMatch[2]) : descMatch[1].trim();
      }
      const m = method === "open" ? (typeMatch ? typeMatch[1] : "info") : method;
      const safe = ["success", "error", "warning", "info"].includes(m) ? m : "info";
      return `ElMessage.${safe}(${msg})`;
    }
  );

  // Deduplicate adjacent ElMessage imports
  text = text.replace(
    /import\s*\{\s*ElMessage\s*\}\s*from\s*["']element-plus["'];\s*\nimport\s*\{\s*ElMessage\s*\}\s*from\s*["']element-plus["'];/g,
    'import { ElMessage } from "element-plus";'
  );

  if (text !== orig) {
    fs.writeFileSync(file, text);
    changed++;
  }
}

console.log(`files_changed=${changed}`);

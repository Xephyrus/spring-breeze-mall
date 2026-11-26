/**
 * Ensure every SFC uses lang="ts" on its script block(s).
 * Does not rewrite Options API → setup (handled separately).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".vue")) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  // <script setup> / <script setup ...> without lang
  text = text.replace(/<script(\s+setup)(?![^>]*\blang=)/g, '<script$1 lang="ts"');
  text = text.replace(/<script(?![\s\S]*?\blang=)(\s|>)/g, (m, tail) => {
    // only plain <script> opening tags without lang already handled above loosely
    if (m.startsWith("<script setup")) return m;
    return `<script lang="ts"${tail === ">" ? ">" : " "}`;
  });
  // Fix accidental double spaces / duplicate lang from naive replace
  text = text.replace(/<script\s+lang="ts"\s+lang="ts"/g, '<script lang="ts"');
  text = text.replace(/<script\s+setup\s+lang="ts"\s+lang="ts"/g, '<script setup lang="ts"');
  // Normalize common orders
  text = text.replace(/<script\s+lang="ts"\s+setup/g, '<script setup lang="ts"');
  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    changed++;
  }
}
console.log(`updated lang=ts on ${changed} vue files`);

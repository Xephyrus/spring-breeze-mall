/**
 * Convert small Options-API SFCs (data/computed/methods only) to script setup.
 * Skips files that are too complex (watch, mixins, components option heavy).
 */
import fs from "node:fs";
import path from "node:path";

const files = [
  "apps/manager/src/views/page-decoration/wap/template/tpl_blank.vue",
  "apps/manager/src/views/page-decoration/wap/template/tpl_line.vue",
  "apps/manager/src/views/page-decoration/wap/template/tpl_rich_text.vue",
];

function convert(file) {
  const raw = fs.readFileSync(file, "utf8");
  const template = raw.match(/<template[\s\S]*?<\/template>/)?.[0] ?? "";
  const style = raw.match(/<style[\s\S]*?<\/style>/)?.[0] ?? "";
  const scriptInner = raw
    .match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1]
    ?.replace(/^\/\/ @ts-nocheck\s*/, "")
    ?.trim();
  if (!scriptInner || !scriptInner.includes("export default")) {
    console.log("skip (no export default)", file);
    return;
  }

  // Pull top-level consts/functions before export default
  const before = scriptInner.split(/export\s+default\s*\{/)[0].trim();
  const name = scriptInner.match(/name:\s*["']([^"']+)["']/)?.[1] ?? path.basename(file, ".vue");

  // props block
  const propsMatch = scriptInner.match(/props:\s*(\{[\s\S]*?\}),?\s*(?=computed:|methods:|data:|watch:|created:|mounted:|components:|$)/);
  const propsObj = propsMatch?.[1] ?? "{ }";

  // computed
  const computedMatch = scriptInner.match(/computed:\s*\{([\s\S]*?)\n\s*\},?\s*(?=methods:|watch:|created:|mounted:|$)/);
  const computedBody = computedMatch?.[1] ?? "";

  // methods  
  const methodsMatch = scriptInner.match(/methods:\s*\{([\s\S]*?)\n\s*\},?\s*(?=computed:|watch:|created:|mounted:|$)/);
  const methodsBody = methodsMatch?.[1] ?? "";

  const computedFns = [];
  const re = /(\w+)\s*\(\)\s*\{/g;
  let m;
  const computedSrc = computedBody;
  // Split computed by top-level function names
  const parts = computedSrc.split(/(?=^\s*\w+\s*\(\)\s*\{)/m).filter((s) => s.trim());
  for (const part of parts) {
    const nm = part.match(/^\s*(\w+)\s*\(\)\s*\{/)?.[1];
    if (!nm) continue;
    let body = part.replace(/^\s*\w+\s*\(\)\s*\{/, "").replace(/\}\s*,?\s*$/, "");
    body = body.replace(/\bthis\.res\b/g, "props.res");
    body = body.replace(/\bthis\.(\w+)/g, (_, p) => {
      if (p === "res") return "props.res";
      return p; // may need props/computed — leave for nocheck
    });
    computedFns.push(`const ${nm} = computed(() => {${body}});`);
  }

  // methods as functions
  const methodFns = [];
  if (methodsBody.trim() === "px," || methodsBody.trim() === "px") {
    // shorthand already in before
  } else {
    const mparts = methodsBody.split(/(?=^\s*\w+\s*\()/m).filter((s) => s.trim());
    for (const part of mparts) {
      if (/^\s*\w+\s*,\s*$/.test(part)) continue;
      const nm = part.match(/^\s*(\w+)\s*\(/)?.[1];
      if (!nm) continue;
      if (part.trim() === `${nm},`) continue;
      let fn = part.replace(/\}\s*,?\s*$/, "}");
      fn = fn.replace(/\bthis\.res\b/g, "props.res");
      fn = fn.replace(/\bthis\./g, "");
      methodFns.push(`function ${fn}`);
    }
  }

  const setup = `<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";
${before ? before + "\n" : ""}
defineOptions({ name: ${JSON.stringify(name)} });

const props = defineProps(${propsObj});

${computedFns.join("\n")}
${methodFns.join("\n")}
</script>`;

  const out = `${template}\n\n${setup}\n\n${style}\n`;
  fs.writeFileSync(file, out, "utf8");
  console.log("converted", file);
}

for (const f of files) convert(f);

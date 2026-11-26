/**
 * Pragmatic Options API -> <script setup lang="ts"> converter for decoration panels.
 * Keeps //@ts-nocheck; does not rewrite templates.
 */
import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node options-to-setup.mjs <file.vue>...");
  process.exit(1);
}

function splitSfc(source) {
  const scriptMatch = source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) throw new Error("no script block");
  const scriptFull = scriptMatch[0];
  const scriptBody = scriptMatch[1];
  const before = source.slice(0, scriptMatch.index);
  const after = source.slice(scriptMatch.index + scriptFull.length);
  return { before, scriptBody, after };
}

function convertScript(body) {
  let code = body.replace(/^\uFEFF/, "").trim();
  if (code.includes("<script setup") || code.includes("defineProps")) {
    return null; // already setup-ish
  }

  // Strip existing nocheck / lang noise
  code = code.replace(/^\/\/\s*@ts-nocheck\s*/m, "");

  // Collect imports (keep as-is)
  const importLines = [];
  code = code.replace(/^import[\s\S]*?;$/gm, (m) => {
    importLines.push(m.trim());
    return "";
  });

  // export default { ... }
  const exp = code.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
  if (!exp) {
    // already not options default export — wrap with nocheck lang only
    return `// @ts-nocheck\n${importLines.join("\n")}${importLines.length ? "\n" : ""}${code}\n`;
  }

  const objSrc = exp[1];

  // name / hideDecorateTitle
  const nameMatch = objSrc.match(/\bname\s*:\s*["'`]([^"'`]+)["'`]/);
  const hideMatch = objSrc.match(/\bhideDecorateTitle\s*:\s*(true|false)/);

  // components: ignore in setup (auto from imports)
  // props
  const propsMatch = objSrc.match(/\bprops\s*:\s*(\{[\s\S]*?\n\s*\})(?=\s*,\s*\n|\s*\n\s*[a-zA-Z])/);
  // fallback simpler props
  let propsBlock = null;
  {
    const m = objSrc.match(/\bprops\s*:\s*(\{[\s\S]*?\})/);
    if (m) {
      // take balanced braces from props
      propsBlock = takeObject(objSrc, objSrc.indexOf("props"));
    }
  }

  const dataBlock = takeFunctionObject(objSrc, "data");
  const computedBlock = takeObjectAfterKey(objSrc, "computed");
  const methodsBlock = takeObjectAfterKey(objSrc, "methods");
  const watchBlock = takeObjectAfterKey(objSrc, "watch");
  const createdBody = takeHookBody(objSrc, "created");
  const mountedBody = takeHookBody(objSrc, "mounted");
  const beforeMountBody = takeHookBody(objSrc, "beforeMount");

  const vueImports = new Set();
  if (dataBlock) vueImports.add("ref");
  if (computedBlock) vueImports.add("computed");
  if (watchBlock) vueImports.add("watch");
  if (mountedBody) vueImports.add("onMounted");
  if (beforeMountBody) vueImports.add("onBeforeMount");

  const out = [];
  out.push("// @ts-nocheck");
  if (vueImports.size) {
    out.push(`import { ${[...vueImports].join(", ")} } from "vue";`);
  }
  for (const line of importLines) {
    if (line.includes('from "vue"') || line.includes("from 'vue'")) continue;
    out.push(line);
  }
  out.push("");

  const defineOpts = [];
  if (nameMatch) defineOpts.push(`name: "${nameMatch[1]}"`);
  if (hideMatch) defineOpts.push(`hideDecorateTitle: ${hideMatch[1]}`);
  if (defineOpts.length) {
    out.push(`defineOptions({ ${defineOpts.join(", ")} });`);
    out.push("");
  }

  if (propsBlock) {
    out.push(`const props = defineProps(${propsBlock});`);
    out.push("");
  } else {
    out.push(`const props = defineProps<{ res?: Record<string, unknown> }>();`);
    out.push("");
  }

  // data -> refs
  const dataKeys = [];
  if (dataBlock) {
    const inner = stripOuterBraces(dataBlock);
    // return { ... }
    const ret = inner.match(/return\s*(\{[\s\S]*\})\s*;?\s*$/);
    const obj = ret ? ret[1] : null;
    if (obj) {
      const entries = splitTopLevelEntries(stripOuterBraces(obj));
      for (const entry of entries) {
        const km = entry.match(/^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
        if (!km) continue;
        const key = km[1];
        const val = km[2].trim().replace(/,$/, "");
        dataKeys.push(key);
        out.push(`const ${key} = ref(${val});`);
      }
      out.push("");
    }
  }

  // computed
  if (computedBlock) {
    const entries = splitTopLevelEntries(stripOuterBraces(computedBlock));
    for (const entry of entries) {
      const named = entry.match(/^([A-Za-z_$][\w$]*)\s*\(\s*\)\s*\{([\s\S]*)\}$/);
      const arrow = entry.match(/^([A-Za-z_$][\w$]*)\s*:\s*function\s*\(\s*\)\s*\{([\s\S]*)\}$/);
      const short = entry.match(/^([A-Za-z_$][\w$]*)\s*\(\s*\)\s*\{([\s\S]*)\}$/);
      const m = named || arrow || short || entry.match(/^([A-Za-z_$][\w$]*)\s*:\s*\{[\s\S]*get\s*\(\)\s*\{([\s\S]*?)\}/);
      if (named || short) {
        const key = (named || short)[1];
        let body = (named || short)[2];
        body = rewriteThis(body, dataKeys);
        out.push(`const ${key} = computed(() => {${body}});`);
      } else if (arrow) {
        const key = arrow[1];
        let body = arrow[2];
        body = rewriteThis(body, dataKeys);
        out.push(`const ${key} = computed(() => {${body}});`);
      } else {
        // leave as comment for manual
        out.push(`/* TODO computed: ${entry.slice(0, 80)} */`);
      }
    }
    out.push("");
  }

  // methods
  if (methodsBlock) {
    const entries = splitTopLevelEntries(stripOuterBraces(methodsBlock));
    for (const entry of entries) {
      const m =
        entry.match(/^([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/) ||
        entry.match(/^([A-Za-z_$][\w$]*)\s*:\s*function\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/) ||
        entry.match(/^async\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/);
      if (!m) {
        out.push(`/* TODO method: ${entry.slice(0, 80)} */`);
        continue;
      }
      const key = m[1];
      const args = m[2] || "";
      let body = m[3];
      body = rewriteThis(body, dataKeys);
      const isAsync = /^\s*async\b/.test(entry) || entry.startsWith("async");
      out.push(`${isAsync ? "async " : ""}function ${key}(${args}) {${body}`);
      out.push(`}`);
      out.push("");
    }
  }

  // hooks
  if (createdBody) {
    // IIFE so early `return` inside created() stays valid at setup top-level
    out.push(`(() => {`);
    out.push(rewriteThis(createdBody, dataKeys));
    out.push(`})();`);
    out.push("");
  }
  if (beforeMountBody) {
    out.push(`onBeforeMount(() => {`);
    out.push(rewriteThis(beforeMountBody, dataKeys));
    out.push(`});`);
    out.push("");
  }
  if (mountedBody) {
    out.push(`onMounted(() => {`);
    out.push(rewriteThis(mountedBody, dataKeys));
    out.push(`});`);
    out.push("");
  }

  if (watchBlock) {
    out.push(`/* TODO watch retained — review manually */`);
    out.push(`/* ${watchBlock.slice(0, 200)} */`);
  }

  return out.join("\n");
}

function takeObject(src, keyIndex) {
  const brace = src.indexOf("{", keyIndex);
  return balance(src, brace);
}

function takeObjectAfterKey(src, key) {
  const re = new RegExp(`\\b${key}\\s*:`);
  const m = re.exec(src);
  if (!m) return null;
  const brace = src.indexOf("{", m.index);
  if (brace < 0) return null;
  return balance(src, brace);
}

function takeFunctionObject(src, key) {
  // data() { return {...} }
  const re = new RegExp(`\\b${key}\\s*\\(\\s*\\)\\s*\\{`);
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  return balance(src, start);
}

function takeHookBody(src, key) {
  const re = new RegExp(`\\b${key}\\s*\\(\\s*\\)\\s*\\{`);
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  const block = balance(src, start);
  return stripOuterBraces(block);
}

function balance(src, start) {
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function stripOuterBraces(s) {
  const t = s.trim();
  if (t.startsWith("{") && t.endsWith("}")) return t.slice(1, -1);
  return t;
}

function splitTopLevelEntries(inner) {
  const entries = [];
  let depth = 0;
  let inStr = null;
  let escape = false;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      const part = inner.slice(start, i).trim();
      if (part) entries.push(part);
      start = i + 1;
    }
  }
  const last = inner.slice(start).trim();
  if (last) entries.push(last);
  return entries;
}

function rewriteThis(body, dataKeys) {
  let b = body;
  // this.res / props
  b = b.replace(/\bthis\.res\b/g, "props.res");
  b = b.replace(/\bthis\.\$/g, "/* $ */ undefined."); // rare; leave broken visible
  // data refs
  for (const key of dataKeys) {
    const re = new RegExp(`\\bthis\\.${key}\\b`, "g");
    b = b.replace(re, `${key}.value`);
  }
  // methods / computed called as this.foo — keep as foo (setup bindings)
  b = b.replace(/\bthis\.([A-Za-z_$][\w$]*)\b/g, "$1");
  return b;
}

for (const file of files) {
  const abs = path.resolve(file);
  const src = fs.readFileSync(abs, "utf8");
  const { before, scriptBody, after } = splitSfc(src);
  const converted = convertScript(scriptBody);
  if (converted == null) {
    console.log("skip(already setup):", file);
    continue;
  }
  // Ensure template closed before script: before should end with </template>
  let head = before;
  if (!/<\/template>\s*$/i.test(head) && /<template[\s>]/.test(head)) {
    // find if script was wrongly inserted; leave as-is since we restored from original
  }
  const next = `${head}<script setup lang="ts">\n${converted}\n</script>${after}`;
  fs.writeFileSync(abs, next, "utf8");
  console.log("converted:", file);
}

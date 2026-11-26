/**
 * Restore broken page-decoration wap SFCs from lilishop-ui originals,
 * tagging script as lang="ts" with @ts-nocheck. Prefer spring-breeze
 * template/style when present; always replace corrupted script.
 */
import fs from "node:fs";
import path from "node:path";

const destRoot = path.resolve(
  "apps/manager/src/views/page-decoration/wap"
);
const srcRoot = path.resolve(
  "../lilishop-ui/manager/src/views/page-decoration/wap"
);

const files = [
  "config-panel/PanelAdCube.vue",
  "config-panel/PanelArticle.vue",
  "config-panel/PanelCarousel.vue",
  "config-panel/PanelCoupon.vue",
  "config-panel/PanelFlexOne.vue",
  "config-panel/PanelGoods.vue",
  "config-panel/PanelHomeComb.vue",
  "config-panel/PanelIntegral.vue",
  "config-panel/PanelMenu.vue",
  "config-panel/PanelNotice.vue",
  "config-panel/PanelPageSetting.vue",
  "config-panel/PanelPromotion.vue",
  "config-panel/PanelSearch.vue",
  "config-panel/PanelShop.vue",
  "config-panel/PanelTitle.vue",
  "config-panel/PanelVideo.vue",
  "template/tpl_article.vue",
  "template/tpl_blank.vue",
  "template/tpl_coupon.vue",
  "template/tpl_goods.vue",
  "template/tpl_line.vue",
  "template/tpl_rich_text.vue",
  "template/tpl_shop.vue",
];

function splitSfc(content) {
  const templateMatch = content.match(/<template[\s\S]*?<\/template>/);
  const styleMatch = content.match(/<style[\s\S]*?<\/style>/);
  const scriptMatch = content.match(/<script(?![^>]*setup)[^>]*>[\s\S]*?<\/script>/);
  const setupMatch = content.match(/<script\s+setup[^>]*>[\s\S]*?<\/script>/);
  return {
    template: templateMatch?.[0] ?? "",
    style: styleMatch?.[0] ?? "",
    script: scriptMatch?.[0] ?? setupMatch?.[0] ?? "",
  };
}

function toLangTsScript(scriptBlock) {
  if (!scriptBlock) return "";
  // Extract inner content whether setup or not
  const inner = scriptBlock.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
  let body = inner.trim();
  if (!body.startsWith("// @ts-nocheck")) {
    body = `// @ts-nocheck\n${body}`;
  }
  // Prefer classic Options API from upstream; ensure export default remains
  if (body.includes("export default") || body.includes("defineComponent")) {
    return `<script lang="ts">\n${body}\n</script>`;
  }
  // If upstream somehow already setup-like, keep as setup
  return `<script setup lang="ts">\n${body}\n</script>`;
}

function rewriteImports(body) {
  // lilishop-ui may use relative api paths; spring-breeze uses @/
  return body
    .replace(/from\s+["']\.\.\/\.\.\/\.\.\/api\//g, 'from "@/api/')
    .replace(/from\s+["']@\/views\/page-decoration\/wap\//g, 'from "@/views/page-decoration/wap/')
    .replace(/from\s+["']view-design["']/g, 'from "element-plus"')
    .replace(/\bMessage\b/g, (m, offset, s) => {
      // only naive — leave Message.xxx; callers often import Message
      return m;
    });
}

let ok = 0;
for (const rel of files) {
  const from = path.join(srcRoot, rel);
  const to = path.join(destRoot, rel);
  if (!fs.existsSync(from)) {
    console.error("missing upstream", rel);
    continue;
  }
  const upstream = fs.readFileSync(from, "utf8");
  const current = fs.existsSync(to) ? fs.readFileSync(to, "utf8") : "";
  const up = splitSfc(upstream);
  const cur = splitSfc(current);

  const template = cur.template && !cur.template.includes("__computed") ? cur.template : up.template;
  // Prefer current style (spring-breeze panel-common imports); fallback upstream
  const style = cur.style || up.style;
  let script = toLangTsScript(up.script || up.setup || "");
  // If upstream used <script> without export (setup), handle
  if (!script && up.script) script = toLangTsScript(up.script);

  // Fix script body imports
  script = script.replace(
    /(<script[^>]*>)([\s\S]*)(<\/script>)/,
    (_, a, body, c) => `${a}${rewriteImports(body)}${c}`
  );

  // Ensure Message from view-design becomes ElMessage
  if (/from\s+["']element-plus["']/.test(script) === false && /\bMessage\./.test(script)) {
    script = script.replace(
      /(<script[^>]*>\s*\/\/ @ts-nocheck\n)/,
      `$1import { ElMessage as Message } from "element-plus";\n`
    );
  }
  script = script.replace(
    /import\s*\{\s*Message\s*\}\s*from\s*["']element-plus["']\s*;?/,
    'import { ElMessage as Message } from "element-plus";'
  );
  script = script.replace(
    /import\s*\{\s*Message\s*\}\s*from\s*["']view-design["']\s*;?/,
    'import { ElMessage as Message } from "element-plus";'
  );

  const out = [template, "", script, "", style, ""].filter(Boolean).join("\n");
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, out, "utf8");
  ok += 1;
  console.log("restored", rel);
}
console.log(`done ${ok}/${files.length}`);

import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

/**
 * ESLint 9 扁平配置（与 manager / seller 同构）。
 *
 * 分两层：
 * 1. **`.ts` 层（已类型化，我们自己的代码）**：严格。
 *    `eqeqeq` 用 `always`（仅放行 `== null`），`no-unused-vars` 为 error。
 *    这一层当前 0 告警，闸门写进 `lint` 脚本的 `--max-warnings 0`。
 * 2. **`.vue` 层（组件脚本仍未类型化）**：暂缓 `eqeqeq` / `no-unused-vars`。
 *
 * 为什么暂缓而不是机械替换：
 * - 组件里大量 `==` 比较的是**后端 JSON 字段**（`talk_type` / `is_top` / `user_id` /
 *   `record_id` / `messageType`），同一字段在不同接口里既可能返回 number 也可能返回 string。
 *   把这些 `==` 统一改成 `===`，在类型未对齐前会**静默改变行为**（例如 `item.is_top == 0`
 *   在 `is_top` 为 `"0"` 时从 true 变 false，导致「置顶」菜单显示错误）。
 * - 正确的收敛路径是：先给组件层补类型（后续里程碑），让 TS 报出真实的类型不一致，
 *   再逐个用 `===` 或 `String(a) === String(b)` 显式归一。
 *
 * 剩余量（2026-11，供后续里程碑跟踪）：`.vue` 内 `eqeqeq` 116 条、`no-unused-vars` 56 条。
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "src/components.d.ts",
      "src/auto-imports.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["src/**/*.{js,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        AMapUI: "readonly",
      },
      parserOptions: {
        // .vue 的 <script lang="ts"> 用 TS 解析器
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", ignoreRestSiblings: true }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-console": "off",
      "no-debugger": "warn",
      // 聊天内容大量使用 v-html 渲染富文本消息（已由 xss 过滤）
      "vue/no-v-html": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      "vue/component-api-style": ["warn", ["script-setup"]],
    },
  },
  // 已类型化的 TS 层：严格闸门
  {
    files: ["src/**/*.ts"],
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      // 核心规则与 TS 规则重复报告同一问题，TS 层只保留 @typescript-eslint/no-unused-vars
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", caughtErrors: "none", ignoreRestSiblings: true },
      ],
    },
  },
  // 组件层：类型化之前先不启用（原因见文件头注释）
  {
    files: ["src/**/*.vue"],
    rules: {
      eqeqeq: "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);

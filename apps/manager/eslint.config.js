import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

/**
 * ESLint 9 扁平配置。
 *
 * 两个关键点（之前配置写错导致所有 .vue 报 "Parsing error: '>' expected"）：
 * 1. `tseslint.configs.recommended` 的第一项不带 files，会把 languageOptions.parser
 *    设成 TS 解析器并作用到**所有**文件，从而覆盖掉 Vue 解析器，`.vue` 被当 JSX 解析。
 *    所以顺序必须是「先 TS 配置，后 Vue 配置」，并在最后给 .vue 显式指定
 *    `parserOptions.parser = tseslint.parser`（让 <script lang="ts"> 走 TS 解析器）。
 * 2. `.eslintignore` 在 ESLint 9 已废弃，忽略项统一写在下面的 ignores 里。
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "public/**",
      "node_modules/**",
      "src/views/live/utils/lib-generate-test-usersig-es.min.js",
      "src/**/*.d.ts",
    ],
  },
  js.configs.recommended,
  // TS 配置必须在 Vue 配置之前：它会把 parser 设成 TS 解析器且不限文件
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        // <script lang="ts"> 交给 TS 解析器，外层仍是 vue-eslint-parser
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    files: ["src/**/*.{ts,vue}"],
    rules: {
      // 迁移期用 any 收口动态边界（表格行、图表配置、第三方 SDK），保留告警但不阻断
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 本项目页面大量通过「传对象给子组件、子组件直接改」的方式做装修编辑，
      // 改成 emit 属于独立重构，先降级为警告避免编辑器满屏红
      "vue/no-mutating-props": "warn",
      // 装修面板里的 computed 会顺手给 props.options 补默认值（历史设计），
      // 改成 watchEffect + 纯 computed 属于独立重构，先降级为警告
      "vue/no-side-effects-in-computed-properties": "warn",
      // 存量 @ts-ignore / @ts-nocheck 需要逐个评估，先保留告警
      "@typescript-eslint/ban-ts-comment": "warn",
      // 短路/三元当语句是本项目常见写法（if (x) y() 的简写）
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "vue/multi-word-component-names": "off",
      "no-undef": "off",
    },
  }
);

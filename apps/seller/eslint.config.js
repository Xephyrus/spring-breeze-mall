import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

/**
 * ESLint 9 扁平配置（与 manager 同构）。
 *
 * 两个关键点：
 * 1. `tseslint.configs.recommended` 的第一项不带 files，会把 parser 设成 TS 解析器并作用到所有文件，
 *    从而覆盖 Vue 解析器。所以顺序必须是「先 TS 配置，后 Vue 配置」，
 *    再给 .vue 显式指定 `parserOptions.parser = tseslint.parser`。
 * 2. `.eslintignore` 在 ESLint 9 已废弃，忽略项统一写在下面的 ignores 里。
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "public/**",
      // 一次性迁移脚本，不纳入业务 lint
      "scripts/**",
      // tree-table 是 JSX 写的旧组件，全项目无引用，待删除，暂不检查
      "src/views/my-components/tree-table/**",
      // Vite 自动生成的组件类型声明
      "src/components.d.ts",
      // 类型声明文件交给 vue-tsc
      "src/**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
      globals: {
        ...globals.browser,
        // public/config.js 通过 <script> 注入
        BASE: "readonly",
        AMapUI: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.{js,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        BASE: "readonly",
        AMapUI: "readonly",
      },
    },
    rules: {
      // 迁移期允许 any（表格行、图表配置、第三方 SDK），保留告警不阻断
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { args: "none", caughtErrors: "none", ignoreRestSiblings: true },
      ],
      "no-unused-vars": "off",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-console": "off",
      "no-debugger": "warn",
      "no-undef": "off",
      // 存量代码大量使用 ==，先告警，逐步治理
      eqeqeq: ["warn", "always", { null: "ignore" }],
      // 项目依赖 v-html 渲染服务端内容，由 xss 过滤兜底
      "vue/no-v-html": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      "vue/no-mutating-props": "warn",
      "vue/component-api-style": ["warn", ["script-setup"]],
      // 装修面板里的 computed 会顺手给 props.options 补默认值（历史设计），先降级为告警
      "vue/no-side-effects-in-computed-properties": "warn",
      // 存量 @ts-ignore / @ts-nocheck 需要逐个评估，先保留告警
      "@typescript-eslint/ban-ts-comment": "warn",
      // 短路/三元当语句是本项目常见写法（if (x) y() 的简写）
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
  },
  {
    // 店铺装修：配置面板就地改 item/options，且部分面板仍用 Options API（与 tpl_* 一致）
    files: [
      "src/views/shop/pc/config-panel/**/*.{js,vue}",
      "src/views/shop/pc/index.vue",
      "src/views/shop/wap/config-panel/**/*.{js,vue}",
      "src/views/shop/wap/template/**/*.{js,vue}",
      "src/views/shop/wap/decorate.vue",
      "src/views/shop/wap/video-config.vue",
    ],
    rules: {
      "vue/no-mutating-props": "off",
      "vue/component-api-style": "off",
    },
  },
  {
    // 根目录构建配置（Vite 时代只剩 postcss 等 CommonJS 配置）
    files: ["*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  }
);

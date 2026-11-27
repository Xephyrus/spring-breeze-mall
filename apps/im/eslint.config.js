import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

/**
 * ESLint 9 扁平配置（与 manager / seller 同构的起步版）。
 *
 * im 此前没有独立 lint 配置（靠 package.json 里的 `eslintConfig`），
 * 这里先建立基线：只启用「必要」规则，告警数写进 lint 脚本做 ratchet。
 */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "scripts/**"],
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["src/**/*.{js,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        AMapUI: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", ignoreRestSiblings: true }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-console": "off",
      "no-debugger": "warn",
      // 存量代码存在 == 比较，先告警
      eqeqeq: ["warn", "always", { null: "ignore" }],
      // 聊天内容大量使用 v-html 渲染富文本消息（已由 xss 过滤）
      "vue/no-v-html": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      "vue/component-api-style": ["warn", ["script-setup"]],
    },
  },
];

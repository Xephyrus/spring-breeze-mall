import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

export default [
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
      // 类型声明文件交给 vue-tsc，eslint 不解析
      "src/**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["src/**/*.{js,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        // public/config.js 通过 <script> 注入，见 index.html
        BASE: "readonly",
        // 高德地图 loader 动态注入
        AMapUI: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", ignoreRestSiblings: true }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-console": "off",
      "no-debugger": "warn",
      "no-undef": "error",
      // 存量代码大量使用 ==，先告警，逐步治理
      eqeqeq: ["warn", "always", { null: "ignore" }],
      // 项目依赖 v-html 渲染服务端内容，由 xss 过滤兜底，不在此处拦截
      "vue/no-v-html": "off",
      // 页面组件多为单词命名且被路由引用，改名成本高
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      // 一般业务代码禁止直接改 prop；装修面板另行覆盖
      "vue/no-mutating-props": "warn",
      // 全端以 <script setup> 为准；装修配置面板/模板有意保留 Options API，见下方 override
      "vue/component-api-style": ["warn", ["script-setup"]],
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
    // 根目录构建配置（已迁移到 Vite，只剩 postcss 等 CommonJS 配置）
    files: ["*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  },
];

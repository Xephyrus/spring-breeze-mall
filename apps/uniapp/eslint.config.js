import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

/**
 * ESLint 9 扁平配置（与 manager / seller / im / buyer 同构）。
 *
 * 与其它 app 的差异：
 * 1. **uni 的全局变量**由 `@dcloudio/types` 在编译期注入，运行时由 HBuilderX /
 *    微信基础库 / HTML5+ 提供，项目里没有对应 npm 包 —— 必须在这里显式声明，
 *    否则 `uni`、`wx`、`plus` 会满屏 `no-undef`。
 * 2. **条件编译注释**（`// #ifdef MP-WEIXIN` 等，共 571 处）是 uni 的语法扩展，
 *    ESLint 不认，但它们只是注释，不影响解析；改代码时不得跨越这些区块。
 * 3. `.vue` 层暂不启用 `eqeqeq` / `no-unused-vars`：小程序端后端字段
 *    number / string 混用普遍，机械把 `==` 改成 `===` 会静默改变行为
 *    （与 im / buyer 的判断一致）。类型化完成后再逐个显式归一。
 */
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "unpackage/**",
      "dist/**",
      "hybrid/**",
      "uni_modules/**",
      "js_sdk/**",
      "scripts/**",
      "patches/**",
      "CustomStartPage/**",
      "CustomStoryboard/**",
      "static/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // uni-app / 小程序 / HTML5+ 的全局对象
        uni: "readonly",
        wx: "readonly",
        plus: "readonly",
        getApp: "readonly",
        getCurrentPages: "readonly",
        uniCloud: "readonly",
        WeixinJSBridge: "readonly",
        UniApp: "readonly",
        // 微信插件 API（requirePlugin 是小程序官方全局，按需由基础库提供）
        requirePlugin: "readonly",
        // App 端原生权限插件注入的全局（仓库内无定义，仅存在于 HBuilderX 打出的 App 运行时）
        permision: "readonly",
        // 业务里注入的运行时配置（public / config 相关）
        BASE: "readonly",
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", ignoreRestSiblings: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { args: "none", caughtErrors: "none", ignoreRestSiblings: true },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-console": "off",
      "no-debugger": "warn",
      // 老代码大量显式 any（含 uni 全局 API 返回值），类型化按目录推进，这里先不设障
      "@typescript-eslint/no-explicit-any": "off",
      // 项目风格常用 a && b()、条件短路表达式
      "@typescript-eslint/no-unused-expressions": "off",
      // 【必须关闭】uni 条件编译（#ifdef / #ifndef）会让同一符号在不同平台分支里各定义一次，
      // ESLint 看不到编译期裁剪，会把 mqtt.js / room.vue 这类写法误报成重复声明
      "no-redeclare": "off",
      "no-useless-assignment": "warn",
      // 存量风格类规则统一降为 warn：不阻塞门禁，但会出现在 lint 输出里逐步清理
      "prefer-const": "warn",
      "no-var": "warn",
      "no-useless-escape": "warn",
      "no-irregular-whitespace": "warn",
      "no-unexpected-multiline": "warn",
      "no-constant-binary-expression": "warn",
      "no-unassigned-vars": "warn",
      "no-case-declarations": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      // 【必须降为 warn】uni 条件编译会让「互斥分支里各写一份」看起来像死代码：
      // 例如 distribution/invite.vue 里 #ifdef 与 #ifndef 各有一个 return，
      // 以及 `if (false) { // 兼容旧逻辑 }` 这类刻意保留的分支。
      // ESLint 看不到编译期裁剪，报 error 只会逼人加 disable 注释。
      "no-unreachable": "warn",
      "no-constant-condition": "warn",
      // v-if 与 v-for 同元素、在组件上用 v-html：需要结合 uview 与具体模板人工判断，
      // 机械重构有视觉回归风险（尤其小程序端）→ 先 warn，逐个在冒烟里确认后处理
      "vue/no-use-v-if-with-v-for": "warn",
      "vue/no-v-text-v-html-on-component": "warn",
      // 无 DOM 输出的副作用组件（uniMap 只做定位、-goods-desc 只挂插槽），
      // Vue 3 / uni 下只渲染注释节点是有效的，不强制要求根元素
      "vue/valid-template-root": "off",
      // uni 的页面/组件名多为单词（pages/order、components/verification）
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      "vue/require-default-prop": "off",
      // 富文本与商品描述大量使用 v-html
      "vue/no-v-html": "off",
      // 所有 SFC 必须用 TS：214 个 .vue 已全部 lang="ts"，
      // 用 lint 兜住回归（否则新页面很容易又写成纯 JS，typecheck 也管不到它的语义）
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
    },
  },
  {
    files: ["**/*.vue"],
    rules: {
      eqeqeq: "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);

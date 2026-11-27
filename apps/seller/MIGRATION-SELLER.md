# seller 迁移记录（M0 / M1 已完成）

> 目标：`apps/seller` 从 **Vue CLI（webpack + babel + JS + Less）** 迁到 **Vite 8 + TS + SCSS**，
> 与 `apps/manager` 工程标准对齐。计划见 `MIGRATION-BASELINE.md` 与根目录会话记录。

---

## M0 · 准备与安全（✅ 2026-11-28）

| 项 | 内容 |
|---|---|
| 地图 Key 外置 | `aMapKey` / `aMapSecurityJsCode` / `tMapKey` 从 `src/config` 移到 `public/config.js` 的 `BASE.MAP`（manager / seller / buyer 三端同步） |
| 共享包扩容 | `packages/shared` 新增 `http.ts`（axios 工厂）、`storage.ts`、`regexp.ts`、`validators.ts`，`index.ts` 统一导出 |
| 基线记录 | `apps/seller/MIGRATION-BASELINE.md` |
| 清理 | 删除本地快照 `apps/manager/.build-check`（66 MB，含旧 Key） |

## M1 · 构建迁移 Vue CLI → Vite（✅ 2026-11-28）

### 新增

| 文件 | 说明 |
|---|---|
| `vite.config.ts` | 端口 10002、`@` 及 4 个别名、SCSS 变量注入、element-plus 按需、生产 gzip、`/files` 代理、分包策略 |
| `index.html` | 静态模板（去掉 `<%= %>` 模板变量），保留加载动画与 `/config.js` |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | 与 manager 同构；M1 阶段 `allowJs: true`、`strictTemplates: false`，M2 再收紧 |
| `src/env.d.ts` | Vite client 类型 + `BASE` 全局 + 图片/`vue` 模块声明 |
| `src/styles/variables.scss` | 从 `common.scss` 抽出的 5 个主题变量（`$theme_color` 等） |
| `src/styles/theme.scss` | 原 `theme.less` 的 CSS 部分（less 变量未被引用，已移除） |

### 修改

| 文件 | 改动 |
|---|---|
| `package.json` | `type: module`；脚本改 `vite` / `vue-tsc`；依赖统一到 `catalog:`；移除 `@vue/cli-*`、`babel`、`webpack`、`less*`、`core-js` |
| `src/config/index.js` | CommonJS → ESM（`export default` + 具名导出），因为 `vite.config.ts` 与业务代码都要 import |
| `src/utils/md5.js` | `module.exports` → `export const md5` + `export default` |
| `src/libs/axios.js` | `process.env.NODE_ENV` → `import.meta.env.DEV` |
| `editor/config.js`、`load-tinymce.js` | `process.env.BASE_URL` → `import.meta.env.BASE_URL` |
| `login.vue`、`main-components/header.vue` | `require("@/assets/x.png")` → 顶部静态 `import` |
| `main.js` | 引入 `styles/common.scss`（原靠 style-resources-loader 注入） |
| `styles/common.scss` | 变量移入 `variables.scss`，改为 `@import "./variables.scss"` |
| `eslint.config.js` | CommonJS → ESM；忽略 `src/**/*.d.ts`、`src/components.d.ts`；`lint` 脚本加 ratchet |
| `postcss.config.js` → `.cjs` | ESM 项目下 CommonJS 配置需 `.cjs` |

### 删除

`vue.config.js`、`babel.config.js`、`src/styles/theme.less`

### 验证结果

| 项 | 结果 |
|---|---|
| `pnpm --filter @spring-breeze/seller build` | ✅ 6.70s |
| `vue-tsc --noEmit -p tsconfig.app.json` | ✅ 0 错误（allowJs 阶段） |
| `eslint src --max-warnings 39` | ✅ 0 error / 39 warning（ratchet 基线） |
| dev server | ✅ `http://localhost:10002/` 返回 200 |
| 产物体积 | 12.82 MB / 394 文件；`element-plus` 822 KB（按需已生效） |

> Vite 8 提示「ESM 语法但按 CJS 加载」的告警已通过 `package.json` 加 `"type": "module"` 消除。

---

## 待办（后续里程碑）

| 里程碑 | 内容 |
|---|---|
| M2 | TS 渐进引入：`libs` → `api` → `stores/router` → `views`（分目录批） |
| M3 | 命名统一 kebab（文件 + 路由 name/path + `li_store_menu` 同步 + 种子 SQL） |
| M4 | 复用落地：消费 `packages/shared`、移植 `TablePager` / `useTable` |
| M5 | 质量门收紧 + CI 增加 seller job |
| M6 | 冒烟清单 `SMOKE-SELLER.md` + 文档收尾 |

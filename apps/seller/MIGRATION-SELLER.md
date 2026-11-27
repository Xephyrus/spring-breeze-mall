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

## M2 · TypeScript 渐进引入

### 2.1 底层 libs 与共享包落地（✅ 2026-11-28）

**改为从 `packages/shared` 转发（删本地实现）**

| 文件 | 处理 |
|---|---|
| `src/libs/storage.js` → `storage.ts` | 转发 `@spring-breeze/shared` 的 `setStore/getStore/removeStore` |
| `src/libs/validate.js` → `validate.ts` | 转发 `validatePassword/validateMobile/validateIDCard/isInteger/isMoney`，保留 `validatetoFixedNew` |
| `src/libs/RegExp.js` → `reg-exp.ts` | 转发 shared 的 `regexp` 命名空间（11 个正则），调用方 2 处 import 同步更新 |

**改为 TS 实现**

| 文件 | 说明 |
|---|---|
| `src/libs/axios.js` → `axios.ts` | 全量类型化：`AxiosInstance`、`ResultMessage<T>`、`RefreshableConfig`；11 个请求方法都带泛型 |
| `src/libs/lazyLoading.js` → `lazyLoading.ts` | 视图懒加载解析器，`Record<string, () => Promise<unknown>>` |

**删除（死代码）**

- `src/libs/emoji.js`（全项目 0 引用）
- `src/utils/validate.js`（全项目 0 引用，且与 libs/validate 重复）

**配套改动**

- `eslint.config.js` 升级为 `typescript-eslint`（与 manager 同构）：TS 解析器先于 Vue，`.vue` 显式 `parserOptions.parser`；`no-unused-expressions` / `ban-ts-comment` / `no-side-effects-in-computed-properties` 降级为告警
- `src/env.d.ts` 修正：全局脚本文件不能再包 `declare global`，改顶层 `declare const BASE`；新增 `declare module "uuid"`

**验证**

| 项 | 结果 |
|---|---|
| `typecheck` | ✅ 0 错误 |
| `lint` | ✅ 0 error / 58 warning（ratchet 58；新增 12 条为 `axios.ts` 的 `<T = any>` 默认泛型） |
| `build` | ✅ 6.60s |
| dev server | ✅ HTTP 200 |

> `libs/util.js`（575 行）、`libs/routerJson.js`（593 行）、`libs/seller-navigation.js`（79 行）留到 2.2/2.3 批次处理。

### 2.2 api 层类型化（✅ 2026-11-28）

| 项 | 结果 |
|---|---|
| 文件 | `src/api/*.js` **20 个 → 全部 `.ts`**（共 2,198 行） |
| 参数类型 | 新增 `src/types/api.ts` 的 `Query = Record<string, unknown>`；id 类参数用 `string \| number`，文件上传用 `Blob` |
| 注解数量 | 三遍脚本自动注解 **约 178 个形参**，编译器报错后手工修 9 处 |
| 引用清理 | 去掉 21 处 `@/api/xxx.js` 的 `.js` 后缀（Vite 虽能兜底解析，显式无后缀更清晰） |
| 新增 lint 告警 | **0**（用 `Query` 而非 `any`，没有推高 ratchet） |

**编译器发现的真实问题（已修）**

| 位置 | 问题 | 修法 |
|---|---|---|
| `logistics.ts` | `getRequestHasHeader(url, null, headers)` 传 null 给 `Params` | 改 `undefined` |
| `logistics.ts` / `shops.ts` | 请求头参数标成 `Query` 但 API 要 `Record<string, string>` | 收窄为 `Record<string, string>` |
| `cardKey.ts` / `goods.ts` | `FormData.append` 收到对象/数字 | `String(skuId)`；文件参数改 `Blob` |
| `procurement.ts` | `encodeURIComponent(remark)` 收到对象 | `String(remark ?? "")` |

**验证**：typecheck 0 错误 / lint 58（未增长）/ build 5.75s / dev server HTTP 200

---

## 待办（后续里程碑）

| 里程碑 | 内容 |
|---|---|
| M2 | TS 渐进引入：`libs` → `api` → `stores/router` → `views`（分目录批） |
| M3 | 命名统一 kebab（文件 + 路由 name/path + `li_store_menu` 同步 + 种子 SQL） |
| M4 | 复用落地：消费 `packages/shared`、移植 `TablePager` / `useTable` |
| M5 | 质量门收紧 + CI 增加 seller job |
| M6 | 冒烟清单 `SMOKE-SELLER.md` + 文档收尾 |

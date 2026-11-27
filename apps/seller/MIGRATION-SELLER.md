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

### 2.3 stores / plugins / composables 类型化（✅ 2026-11-28）

| 文件 | 说明 |
|---|---|
| `plugins/element.js` → `element.ts` | `setupElementPlus(app: App): void` |
| `stores/user.js` → `user.ts` | `LOGOUT_KEYS: string[]`，`logout(): void` |
| `stores/dict.js` → `dict.ts` | 新增 `DictItem` 接口，4 个 setter 显式类型 |
| `stores/setting.js` → `setting.ts` | 新增 `SettingState`；持久化 JSON 用 `Record<string, unknown>` 收口 |
| `stores/app.js` → `app.ts` | 新增 `AppState` / `OpenedTag` / `NavMenuItem`；路由数组用 vue-router 的 `RouteRecordRaw` |
| `composables/useSiteSettings.js` → `useSiteSettings.ts` | 新增 `SiteSettings` / `UseSiteSettings`；`computed` 返回值类型为 `ComputedRef<string>` |

**编译器暴露的问题**：`getBaseSite()` 在 api 层没有声明泛型（返回 `ResultMessage<any>`），
`getBaseSite<T>()` 的写法无效 → 改为在 composable 内收窄 `res.result`。

**验证**：typecheck 0 错误 / lint 58（未增长）/ build 7.88s / dev server HTTP 200

> `router/index.js`（49 行）与 `router/router.js`（359 行）依赖 `libs/util` 的 `frontRoute` 解析，
> 与 M3 命名统一强耦合，留到 M3 一起改。

### 2.4 路由核心类型化（✅ 2026-11-28，M3 前置）

| 文件 | 说明 |
|---|---|
| 新增 `src/types/menu.ts` | `MenuNode`（后端菜单）、`MenuRoute`（转路由后）、`OpenedTag`、`NavItem`、`SellerProfile`。独立成文件是为了打破 `libs/util` ↔ `stores/app` ↔ `router/*` 的循环 import |
| `libs/util.js` → `util.ts`（575 行） | 定义 `UtilApi` 接口约束整个 `util` 对象；`dynamicRouteNames`、`registerDynamicRoutes`、`initRouterNode` 等全部显式类型 |
| `router/router.js` → `router.ts`（359 行） | 7 个静态路由对象标 `MenuRoute`，`routers` 断言为 `RouteRecordRaw[]` 供 `createRouter` |
| `router/index.js` → `index.ts` | 守卫参数用 `RouteLocationNormalized`；`to.meta.title` 收窄为 `string \| undefined` |

**编译器暴露的问题**

| 位置 | 问题 | 修法 |
|---|---|---|
| `getCurrentPermissionList(params)` | 调用处不传参 → TS2554 | 参数改可选 `params?: Query` |
| `router.addRoute` 的 `component` | `unknown` 不可赋值 | 断言 `() => Promise<unknown>` |
| `otherRouter.children` | `MenuRoute.children` 可选 → 展开报错 2 处 | `?? []` |
| `Object.assign({}, item)` | 推断成 `MenuNode` | 断言 `as MenuRoute` |

**验证**：typecheck 0 错误 / lint 58（未增长）/ build 6.21s / dev HTTP 200（含 `util.ts` 转译验证）

---

## M3 · 命名统一（kebab-case）

### M3-1 文件与目录重命名（✅ 2026-11-28）

| 项 | 数值 |
|---|---:|
| 重命名文件 | **66 个**（`.vue` 57 / `.js` 6 / `.ts` 3） |
| 重命名目录 | **1 个**（`order/receiptManager` → `receipt-manager`） |
| 改写 import | 3 遍脚本共 **67 处**（含扩展名 40 + 无扩展名 48 中重叠部分） |
| 当前 `src` 非 kebab 文件 | 91 / 303（**全部是装修子系统，见下方豁免**） |

**豁免：装修子系统 91 个文件**（`views/shop/pc/{config-panel,template,controls}`、
`views/shop/wap/{config-panel,template,controls}`、`views/shop/hotzone`）

理由：这些文件名与**组件 `name` 及页面 JSON 的 type 键一一对应**
（`PanelGoods.vue` ↔ `name: "PanelGoods"` ↔ `"goodsList": PanelGoods`），
且商家已保存的装修页面数据里存的就是这些键。改名需要同时迁移历史页面 JSON，
属于独立的「装修数据迁移」任务，不与本次命名统一混做。

**菜单 SQL 同步（关键）**

| 文件 | 内容 |
|---|---|
| `backend/DB/store-menu-kebab-front-route.sql` | **54 条**幂等 `UPDATE li_store_menu SET front_route = 新 WHERE front_route = 旧`（含 `Main` → `main` 24 行、`receiptManager` 目录） |
| `docker/init/mysql/patches/2026-11-28-store-menu-kebab-front-route.sql` | 同一份补丁，供全新环境初始化 |

**数据完整性校验**

```
li_store_menu 共 81 行，front_route 去重 55 个
逐个比对磁盘文件（含 index.vue 兜底 + 2 个显式映射）：无法解析 0 个 ✅
```

**验证**：typecheck 0 错误 / lint 58（未增长）/ build 6.13s / 产物 12.81 MB

### M3-2a 路由 name 统一 kebab（✅ 2026-11-28）

| 项 | 数值 |
|---|---:|
| DB 改名 | **40 条**（`li_store_menu.name`，含 `Main`→`main`、`message_index`→`message-index`、`home_index`→`home-index`、`change_pass`→`change-password`） |
| 代码替换 | **47 个文件 / 169 处**引号字面量 |
| SQL | `backend/DB/store-menu-kebab-names.sql`（幂等 `UPDATE ... WHERE 旧值`） |
| 数据修复 | 一条历史脏数据：`name` 与 `path` 里存了字面 `\nclerkManage` → 统一为 `clerk-manage` |

**为什么必须同步 DB**：`util.initRouterNode` 直接用菜单 `name` 注册路由
（`router.addRoute("otherRouter", { name: leaf.name })`），
所以「代码里的 `push({ name: "order-list" })`」必须与 DB 的 `name` 同时改，否则跳转 404。

**校验**

```
li_store_menu 81 行；name 去重 64 个，非 kebab 数 0 ✅
代码里 40 个旧 name 的引号字面量残留：0 ✅
```

**验证**：typecheck 0 错误 / lint 58（未增长）/ build 7.74s / dev HTTP 200

### M3-2b 路径（URL）统一 kebab（✅ 2026-11-28）

| 项 | 数值 |
|---|---:|
| DB `path` 改名 | **33 条**（`orderList`→`order-list`、`ossManage`→`oss-manage` 等） |
| 前端路径段替换 | **7 个文件 / 41 处**（`push("/orderList")`、`<router-link to>`、`path:` 字面量） |
| 静态路由补充 | `/pcFloorList/main`→`/pc-floor-list/main`、`alertQuantityWarnList`/`Setting`、`accountStatementBill` |
| 顺带删除死代码 | `libs/router-json.js`（**593 行，全项目 0 引用**，vuex 时代遗留的静态菜单表） |
| SQL | `backend/DB/store-menu-kebab-paths.sql` + docker patch |

**如何避免误伤后端接口地址**：脚本按「URL 段」替换，且**排除 `src/api/**`**；
逐条比对后保留了 `/order/order/batchDeliver`（后端接口）、`/home/Favorites` 等 C 端外链、
`/couponCenter`、`/:pathMatch(.*)*`（路由通配）等非菜单路径。

**终态校验（一次性全量）**

```
li_store_menu 81 行：name 非 kebab 0 / path 非 kebab 0 / front_route 非 kebab 0 ✅
front_route 去重 55 个 → 逐一对磁盘文件：无法解析 0 ✅
typecheck 0 错误 / lint 58（未增长）/ build 7.09s / dev HTTP 200
```

> 破坏性变更提醒：旧 URL（如 `/orderList`）现在 404，与计划确认一致。

---

## M4 · 复用落地

### M4-1 直接消费 `packages/shared`（✅ 2026-11-28）

| 项 | 内容 |
|---|---|
| 改写引用 | **23 个文件**：`@/libs/storage`、`@/libs/validate`、`@/libs/reg-exp` → 直接 `@spring-breeze/shared` |
| 删除中间层 | `libs/storage.ts`、`libs/validate.ts`、`libs/reg-exp.ts`（原本只是转发） |
| 特殊处理 | `import * as RegExp from "@/libs/reg-exp"` → `import { regexp as RegExp } from "@spring-breeze/shared"`（shared 用命名空间导出，避免顶层 `URL` 遮蔽全局） |

结果：seller 不再有稳定工具的三份副本，manager/seller 共用同一实现。

### M4-2 统一分页条 `<TablePager>`（✅ 2026-11-28）

| 项 | 内容 |
|---|---|
| 新增 | `src/components/table-pager.vue`（与 manager 同源，多一个 `className` 透传，便于保留各页 `mt_10` 之类的类名） |
| 默认值调整 | `layout` 默认 `total, sizes, prev, pager, next, jumper` —— 实测 seller **49 个列表页里 44 处**就是这个布局 |
| 首批替换 | `appointment/service-staff-list.vue`、`system-form-list.vue`、`work-order-list.vue` 三页（原本各自手写 6–8 行属性） |
| 自动注册 | `unplugin-vue-components` 已生成 `TablePager` 类型（`components.d.ts`），无需手动 import |

### M4-3 `useTable` 类型化（✅ 2026-11-28）

| 项 | 内容 |
|---|---|
| `utils/use-table.js` → `use-table.ts` | 新增 `TableSearchForm` / `TablePageData<T>` / `UseTableOptions<T>` / `UseTableReturn<T>` |
| 泛型化 | `useTable<T>(fetcher, options)`，`data` 为 `Ref<T[]>`，调用方可 `useTable<OrderVO>(...)` |
| 与 manager 对齐 | 保留「只采纳最后一次请求结果」的并发保护语义 |
| 现状 | seller 已有 **10 个页面**在用（manager 是 54 个），后续按目录推进 |

**验证**：typecheck 0 错误 / lint 58（未增长）/ build 10.81s / dev HTTP 200

---

## M5 · 质量门与持续集成

### M5-1 `.js` 继续收敛（✅ 第一批 2026-11-28）

| 文件 | 说明 |
|---|---|
| `libs/seller-navigation.js` → `.ts` | 新增 `NavigationItem` 接口；`DETAIL_MENUS`、`FULL_DISCOUNT_DETAIL_MENUS` 标 `Record<string, string[]>` |
| `utils/order-fulfill.js` → `.ts` | 导出 `FulfillmentMode` / `FulfillForm`，`validateFulfillForm` 返回 `string \| null` |
| `utils/download-blob.js` → `.ts` | 入参改 `unknown`（调用方拿到的是 `ResultMessage` 断言，运行时实际是 `Blob`） |
| `utils/print.js` → `.ts` | iframe 的 `contentWindow` 显式收窄 |
| `utils/img-fallback.js` → `.ts` | `error` 事件 `target` 收窄为 `HTMLImageElement` |
| `utils/goods-specs.js` → `.ts` | `formatGoodsSpecs(specs: unknown)`，JSON 解析分支显式标注 |

剩余 `.js` **34 个**，分三块：① `libs/util` 相关已完成；② `utils/{filters,message,regular,md5}`、`constants/*`、`main.js`、`config/index.js` 下一批；
③ **装修子系统豁免**（`shop/pc/config.js` 1098 行、`shop/wap/config.js` 654 行、`hotzone/**`、`template/**`）。

### M5-2 CI 增加 seller job（✅ 2026-11-28）

`.github/workflows/ci.yml` 新增 `seller` job，与 manager 同构：

| 步骤 | 命令 |
|---|---|
| 依赖 | `pnpm install --frozen-lockfile`（pnpm 12.14.0 / Node 24） |
| 类型门 | `pnpm --filter @spring-breeze/seller typecheck` |
| Lint 门 | `pnpm --filter @spring-breeze/seller lint`（ratchet 58） |
| 构建门 | `pnpm --filter @spring-breeze/seller build`（`NODE_OPTIONS=--max-old-space-size=3072`） |

触发路径同步加入 `apps/seller/**`。

### M5-3 告警清零（✅ 2026-11-28）

| 规则 | 处理前 | 处理后 |
|---|---:|---:|
| `@typescript-eslint/no-unused-vars` | 36 | **0** |
| `@typescript-eslint/no-explicit-any` | 12 | **0** |
| `@typescript-eslint/no-unused-expressions` | 7 | **0** |
| `eqeqeq` | 3 | **0** |
| **合计** | **58** | **0** ✅ |

ratchet 同步收紧：`"lint": "eslint src --max-warnings 0"`（从此 CI 是零容忍门禁）。

**几处值得记录的修法**

| 位置 | 原写法 | 改法 |
|---|---|---|
| `libs/axios.ts` ×12 | `<T = any>` | `<T = unknown>`（调用方本就未消费 `result`，类型更诚实） |
| `store-role-manage.vue` | 三层三元 `item.children.length !== 0 ? ... : ""` 当语句 | 改成嵌套 `if` + `forEach` |
| `floor-list.vue` | `(a = 1), (b = 2);` 逗号表达式 | 拆成两条赋值 |
| `coupon-publish.vue` / `statistics/*.vue` | `cond ? fn() : ""` 当语句 | `if (cond) fn()` |
| `util.ts` / `clerk-manage.vue` / `tpl_goods.vue` | `== undefined` | `=== undefined` |

**两个坑（已修复，写在这里备查）**

1. **批量删未使用声明时把 import 块删坏了**：脚本用括号配对删除多行函数体，
   但遇到 `import { A, B } from "x"` 这种「一行内花括号」时，配对逻辑把整行连同后面的代码吃掉了。
   受影响 3 个文件（`PanelGoodsGrid.vue`、`BoxModelField.vue`、`shop/wap/index.vue`），
   已按模板里实际用到的组件恢复 import。教训：**删代码的脚本必须逐文件 review diff**，
   不能只看 typecheck 通过（模板里未定义的组件不会报编译错误，只会在运行时静默失败）。
2. **`alignTextRight` 是 eslint-plugin-vue 的误报**：它在嵌套 `<template>` 的
   `:src="alignTextRight"` 里被使用，但插件没识别出来。已加**带说明**的
   `eslint-disable-next-line`，而不是放宽整个规则。

**验证**：typecheck 0 错误 / **lint 0 告警** / build 7.63s / dev HTTP 200

---

## 待办（后续里程碑）

| 里程碑 | 内容 |
|---|---|
| M2 | TS 渐进引入：`libs` → `api` → `stores/router` → `views`（分目录批） |
| M3 | 命名统一 kebab（文件 + 路由 name/path + `li_store_menu` 同步 + 种子 SQL） |
| M4 | 复用落地：消费 `packages/shared`、移植 `TablePager` / `useTable` |
| M5 | 质量门收紧 + CI 增加 seller job |
| M6 | 冒烟清单 `SMOKE-SELLER.md` + 文档收尾 |

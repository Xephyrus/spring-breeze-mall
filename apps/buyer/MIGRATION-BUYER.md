# buyer 迁移记录

> 项目：PC 买家端（`apps/buyer`，dev 端口 **10000**，后端 buyer-api **8888**）
> 起点：Vue 3.5 + Pinia + vue-cli 5（webpack）+ element-plus 按需（已人工按需导入）
> 目标：与 seller / im 对齐 —— Vite + TypeScript + kebab 命名 + 门禁 + 冒烟清单

## 起点体检（迁移前）

| 项 | 数值 |
|---|---|
| `.vue` | 123 个 / 40,550 行 |
| `.js` | 42 个 / 6,337 行（另有 JS 方法内联在 SFC 中） |
| 构建 | vue-cli 5（webpack 5 + babel） |
| element-plus | **已是按需引入**（`plugins/element.js` 显式 import 组件与样式） |
| 状态管理 | 已是 Pinia（`stores/`） |
| ESLint | 0 error / 0 warning（基线已干净） |
| CJS 依赖 | 3 处 `require()`、2 处 `module.exports` |

结论：buyer 在框架层比迁移前的 seller / im 更接近目标状态，主要任务是 **构建器替换** 与 **TS 化**。

## M1：Vite 迁移（已完成）

### 1.1 构建器

| vue-cli 配置 | Vite 对应 |
|---|---|
| `publicPath` | `base`（读 `VUE_APP_PUBLIC_PATH`） |
| `devServer.port` | `server.port = 10000` |
| `css.loaderOptions.sass.additionalData` | `css.preprocessorOptions.scss.additionalData` |
| `css.loaderOptions.less.lessOptions.javascriptEnabled` | `preprocessorOptions.less.javascriptEnabled` |
| `configureWebpack.plugins` 的 `CompressionPlugin` | `vite-plugin-compression`（仅生产，阈值 10 KB） |
| `chainWebpack` 的 `drop_console` | `output.minify.compress.dropConsole / dropDebugger`（仅生产） |
| `runtimeChunk: "single"` + `splitChunks` 按包名拆 vendor | `codeSplitting.groups`（element-plus / vue-vendor） |

删除：`vue.config.js`、`babel.config.js`、`public/index.html`（改为根目录 `index.html`）。
移除依赖：`@vue/cli-service`、`@vue/cli-plugin-babel`、`@vue/compiler-sfc`、`webpack`、
`compression-webpack-plugin`、`less-loader`、`sass-loader`、`core-js`。

### 1.2 CJS → ESM（Vite 不做 CJS 间转换）

| 文件 | 改动 |
|---|---|
| `src/config/index.js` | `require('js-cookie')` → `import`；`module.exports` → `export default` |
| `src/plugins/storage.js` | `require("psl")` → `import psl from "psl"` |
| `src/plugins/request.js` | `require("qs")` → `import qs from "qs"`；`process.env.NODE_ENV` → `import.meta.env.DEV` |
| `src/plugins/md5.js` | `module.exports = { md5 }` → `export { hexMD5 as md5 }` + `export default`（调用方是具名导入，两者都保留） |

### 1.3 两个真实故障

**① 具名导入与默认导出不兼容**

```
[MISSING_EXPORT] "aMapSwitch" is not exported by "src/config/index.js"
  src/components/map/multiple-map.vue:10  import { aMapSwitch } from '@/config/index'
```

webpack 对 `module.exports = {...}` 做了 CJS 互操作，允许这样具名导入；Vite 严格按 ESM 解析。
改为 `import config from '@/config/index'` + `const aMapSwitch = config.aMapSwitch`。

> 教训：CJS→ESM 迁移不能只改导出侧，**必须同时核对所有具名导入**。

**② SCSS 全局注入导致自我递归**

`additionalData` 会把 `global.scss` 注入**每个** SCSS 文件，而 `global-layout.scss` /
`element.scss` 自己已经 `@import "@/assets/styles/global.scss"` → 重复注入，Sass 报大量
`@import` 弃用告警并产生重复 CSS。

改为函数式注入 + 双重跳过：

```ts
additionalData: (content, filepath) => {
  const normalized = filepath.replace(/\\/g, "/");
  if (
    normalized.includes("node_modules") ||
    normalized.endsWith("/assets/styles/global.scss") ||   // 注入自身
    content.includes('@import "@/assets/styles/global.scss"') // 已显式引入
  ) return content;
  return `@import "@/assets/styles/global.scss";\n${content}`;
}
```

### 1.4 验证结果

| 检查 | 结果 |
|---|---|
| `build` | ✅ 5.62s，产物 js+css 合计 **2,988 KB** |
| 产物分布 | element-plus 690 KB / index 491 KB / index.css 377 KB / GoodsDetail 317 KB |
| dev server | ✅ 540 ms 启动，`/` 与 `/home` 均 200 |
| `/config.js` | ✅ 运行时配置正常注入（`var BASE = {...}`） |
| 模块转译 | ✅ `/src/main.js`、`App.vue`、`plugins/request.js`、`router/index.js` 均 200 |
| `lint` | ✅ 0 error / 0 warning（ratchet 收紧到 `--max-warnings 0`） |

### 1.5 已知差异（与 vue-cli 版本）

| 项 | 说明 |
|---|---|
| `devServer.client.overlay.runtimeErrors` 过滤 | vue-cli 版会把「已向用户提示过的请求错误」从运行时遮罩里过滤掉；Vite 的 HMR 遮罩没有等价选项，失败请求可能仍弹遮罩。**仅影响开发体验**，不影响构建产物。 |
| CSS 体积 | `global.scss` 同时含变量与真实样式规则，被注入到每个 SFC，因此规则会重复出现在各 chunk 里。这是 vue-cli 时代就有的行为，本轮**照原样迁移**；拆分「变量文件 + 一次性全局样式」列为 M4 优化项。 |
| `index.html` 里的 `config.js` / `logo.ico` | 目前写死 `/config.js`、`/logo.ico`。若部署到子路径（设置 `VUE_APP_PUBLIC_PATH`），需要改为相对路径或由 base 处理 —— 列为待办。 |

## 后续里程碑（计划）

| 阶段 | 内容 |
|---|---|
| M2 | TypeScript 化：`tsconfig` + 42 个 `.js` 逐步转 `.ts`（api / stores / utils / plugins / router） |
| M3 | kebab 命名：123 个 `.vue`（需先核对组件 `name` 与动态渲染、路由 path 是否耦合） |
| M4 | `global.scss` 拆分为变量 + 全局样式；`packages/shared` 复用评估；产物分包优化 |
| M5 | 门禁接入 CI（typecheck + lint + build） |
| M6 | `SMOKE-BUYER.md` 冒烟清单 |

## M2：TypeScript 化（进行中）

### 2.1 基础设施（已完成）

**新增**
| 文件 | 作用 |
|---|---|
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | `strict: true` + `allowJs: true`（其余 `.js` 逐步迁移） |
| `src/env.d.ts` | `BASE` 运行时全局（来自 `public/config.js`）、`import.meta.env`、无类型第三方包声明 |
| `src/types/axios.d.ts` | 用 declare module 扩展 `AxiosRequestConfig`，声明 buyer 自有开关 |

**转换（4 个文件）**
| 原文件 | 目标 | 要点 |
|---|---|---|
| `plugins/request.js` | `plugins/request.ts` | `BuyerResponse<T>` 响应结构；axios 配置开关（`loading` / `needToken` / `optionalToken` / `skipAuthHandler` / `skipMessage` / `_dataSerialized` / `_retryAfterRefresh` / `_loadingInstance`）用 **declare module 扩展** 而不是 `any` |
| `utils/requestError.js` | `utils/requestError.ts` | `WeakSet<object>` + 泛型 `markHandledRequestError<T>` |
| `plugins/storage.js` | `plugins/storage.ts` | Cookie 选项类型；`psl.parse` 结果收窄 |
| `config/index.js` | `config/index.ts` | 新增 `BuyerConfig` 接口（12 个字段全部显式） |

### 2.2 三个类型层面必须显式处理的地方

**① axios 拦截器「返回 body 而非 response」**

运行时是对的（调用方拿到 `response.data`），但 axios 的类型定义要求 fulfilled 处理器返回
`AxiosResponse`。这里没有用 `@ts-ignore`，而是把两个处理器提取成 `onFulfilled` / `onRejected`
常量，再对 `use()` 的参数做一次**集中断言**，并写清原因：

```ts
service.interceptors.response.use(
  onFulfilled as unknown as (response: AxiosResponse) => AxiosResponse,
  onRejected
);
```

好处：断言只有一处，函数体里仍然全程有类型。

**② 自定义配置字段**

`config.skipAuthHandler`、`config.needToken` 这类字段 axios 不认识。用 `declare module "axios"`
扩展 `AxiosRequestConfig`，所有调用处（含 `api/*.js`）都能直接获得类型与提示，
也避免把整个 config 退化成 `any`。

**③ Cookie 读写的可空性**

`js-cookie` 的 `get` 返回 `string | undefined`，原来直接传给 `escape()` / `Storage.setItem()`。
TS 会报 `string | undefined 不能赋给 string`，这里统一用 `?? ""` 归一 —— 这与原运行时行为一致
（`undefined` 传进 `escape` 会变成字符串 `"undefined"`，反而是隐患）。

### 2.3 验证

| 检查 | 结果 |
|---|---|
| `typecheck` | ✅ 0 错误（`vue-tsc`，8 个初始错误逐个修掉） |
| `build` | ✅ 5.18s |
| `lint` | ✅ 0 error / 0 warning |
| dev | ✅ `/`、`/home`、`/src/plugins/request.ts`、`/src/config/index.ts` 均 200 |

### 2.4 待迁移（按依赖广度排序）

| 顺序 | 目标 | 文件数 |
|---|---|---|
| 1 | `utils/*`（message / theme / buyerLogin / orderFulfill / unreadMessage / iconMap） | 6 |
| 2 | `api/*`（account / address / cart / common / goods / index / login / member / order / pay / pickupCard / pointsCoupon / promotion / shopentry） | 14 |
| 3 | `plugins/*`（element / filters / Foundation / RegExp / md5）+ `stores/app` + `router/index` | 7 |
| 4 | `constants/goodsType`、`pages/home/enumeration`、`pages/user/menu`、`components/*.js`、`composables` | 6 |
| 豁免 | `components/indexDecorate/presets/double11Preset.js`（1,967 行装修预设数据，纯数据表） | 1 |
### 2.5 utils 层（已完成，6 个文件）

| 原文件 | 目标 | 要点 |
|---|---|---|
| `utils/message.js`（149） | `utils/message.ts` | `MessageContent` / `SpinOptions` / `ModalConfirmOptions` / `NoticeOptions` 四个接口；`Message` / `Modal` / `Notice` / `Spin` 四个门面全部带签名 |
| `utils/theme.js`（107） | `utils/theme.ts` | `ThemeSetting` / `ThemeResponse`；`normalizeTheme` 收 `Partial<ThemeSetting>`；`fetchAndApplyTheme(requestFn)` 显式声明请求入参，并发共用 Promise 的行为保留 |
| `utils/buyerLogin.js`（40） | `utils/buyerLogin.ts` | `openLink(url, router: Router)`；`router.resolve().href` 类型正确 |
| `utils/orderFulfill.js`（18） | `utils/orderFulfill.ts` | 新增 `FulfillmentPackage` / `FulfillmentMode` |
| `utils/unreadMessage.js`（24） | `utils/unreadMessage.ts` | `memberMsgList` 的返回用 `UnreadMessageResult` 断言（api 层尚未 TS 化） |
| `utils/iconMap.js`（83） | `utils/iconMap.ts` | `Record<string, Component>`；`resolveIcon(type: string): Component` |
| `assets/iconfont/iconMap.js` | `assets/iconfont/iconMap.ts` | `Record<string, string>` + `getIconUrl(name: string)` |

> `assets/iconfont/iconMap` 一开始漏了索引签名，`iconMap[name]` 直接报 TS7053。
> 这类「查表函数」在 TS 下必须显式声明 `Record<K, V>`，否则字面量推断出的精确形状不能索引。

### 2.6 验证

| 检查 | 结果 |
|---|---|
| `typecheck` | ✅ 0 错误 |
| `build` | ✅ 5.45s |
| `lint` | ✅ 0 error / 0 warning |
| dev | ✅ `/`、`/home` 与 4 个新 `.ts` 模块均 200 |
| 剩余 `.js` | 31 个（M2 起始 42 个） |
### 2.7 api 层（已完成，14 个文件 / 约 1,600 行）

| 处理 | 说明 |
|---|---|
| 新增 `src/types/api.ts` | `BuyerResponse<T>`（统一响应体）、`PageResult<T>`、`Query`、`RequestOptions` |
| 14 个文件 `.js → .ts` | 共 **134 处**形参注解；`export function xxx(params) → (params: Query = {})`、`(id) → (id: string \| number)`、多参逐个补 |
| 返回值统一 | `Promise<BuyerResponse>`（需要精确类型时调用处写 `getXxx<MyVO>()`） |

**批量脚本踩的两个坑（都已复原）**

1. **类型 import 插进了多行 import 中间**

   脚本按「第一条 import 之后插入」，但不少文件的第一条 import 是多行的：

   ```ts
   import request, {
     import type { Query, BuyerResponse } from "@/types/api";   // ← 插到这里
     Method, buyerUrl
   } from '@/plugins/request.js';
   ```

   导致 7 个文件语法错误（TS1003/TS1005）。修法：检测插入点的括号是否平衡，不平衡就把类型 import 放到文件首行。

2. **带默认值的形参被拼成非法语法**

   `options = {}` 追加类型后变成 `options = {}: Query`。修法：单独匹配 `x = {}` / `x = 数字` / `x = '字符串'` 三种形态，改写成 `x: Query = {}` 等。

**类型检查额外抓出的 4 个真实问题**

| 位置 | 问题 | 处理 |
|---|---|---|
| `login.webLogin` | 声明 `Promise<BuyerResponse>` 但函数体只 `window.open` 没有 return | 返回类型改为 `void`（原类型是错的） |
| `promotion.pointGoodsDetail` | 请求配置里多传了一个 `id` 字段（id 已在 url 中） | 删除该字段 |
| `pickupCard.getPickupCard` | `encodeURIComponent(id)` 直接吃 `string \| number` | 改 `String(id)` |
| `request.ts` 刷新 token | `handleRefreshToken` 的形参是 `Query`，实参是 `string` | 显式断言（api 签名与调用处语义本就不同） |

### 2.8 验证

| 检查 | 结果 |
|---|---|
| `typecheck` | ✅ 0 错误 |
| `build` | ✅ 5.49s |
| `lint` | ✅ 0 error / 0 warning |
| dev | ✅ `/`、`/home`、`/goodsDetail` 与 3 个新 api 模块均 200 |
| 剩余 `.js` | **17 个**（M2 起始 42 个，其中 1 个豁免） |

### 2.9 剩余 17 个 `.js` 的归属

| 分类 | 文件 | 行数合计 |
|---|---|---|
| 入口/注册 | `main.js`、`components/global.js` | 76 |
| plugins | `element`(176) / `Foundation`(200) / `filters`(77) / `RegExp`(50) / `md5`(224) | 727 |
| router / stores | `router/index.js`(382) / `stores/app.js`(45) | 427 |
| 常量与枚举 | `constants/goodsType.js`(203) / `pages/home/enumeration.js`(87) / `pages/user/menu.js`(121) | 411 |
| 组件配置 | `components/drawer/config.js`(63) / `components/indexDecorate/registry.js`(73) / `components/verify/verify.js`(28) | 164 |
| composables | `composables/useSiteSettings.js` | 38 |
| **豁免** | `components/indexDecorate/presets/double11Preset.js`（1,967 行装修预设数据） | 1,967 |
### 2.10 plugins + stores（已完成 6 个文件）

| 原文件 | 目标 | 要点 |
|---|---|---|
| `plugins/Foundation.js`（200） | `plugins/Foundation.ts` | 7 个函数全部带签名；**就地注解**，未替换为 im 的实现 |
| `plugins/filters.js`（77） | `plugins/filters.ts` | `unitPrice` / `unixToDate` / `unitAddress` / `secrecyMobile` / `goodsDisplayPrice`；新增 `setupFilters(app)` |
| `plugins/RegExp.js`（50） | `plugins/RegExp.ts` | 纯常量表，直接改名 |
| `plugins/element.js`（176） | `plugins/element.ts` | `components: Plugin[]`（`app.use()` 要的是 Plugin 不是 Component） |
| `plugins/md5.js`（224） | `plugins/md5.ts` | 16 个内部函数补 `number` / `string` / `number[]` 签名；保留 `export { hexMD5 as md5 }` |
| `stores/app.js`（45） | `stores/app.ts` | 新增 `AppState` 接口 + `state: (): AppState => ({...})` |

**关于 Foundation 的一个决定**

buyer 与 im 各有一份 `Foundation.js`，函数名与逻辑高度相似。第一版我直接拿 im 的 TS 版本
替换 buyer 的实现，核对后发现**行数与细节并不完全一致**（buyer 那份是 200 行、im 是 155 行的
带类型版本，`dateToUnix` 等处写法有差异），于是**回滚，改为就地注解 buyer 自己的实现**。

> 判断标准：两个端的同名工具函数看起来一样，不代表实现完全等价。
> 就地补类型是零风险，替换实现是行为风险。

唯一的语义无关改动：`arr[1] - 1`（字符串参与算术）在 TS 下非法，统一写成 `Number(arr[1]) - 1`。

### 2.11 验证

| 检查 | 结果 |
|---|---|
| `typecheck` | ✅ 0 错误 |
| `build` | ✅ 4.95s |
| `lint` | ✅ 0 error / 0 warning |
| dev | ✅ `/`、`/home` 与 element / filters / stores/app / md5 四个新模块均 200 |
| 剩余 `.js` | **11 个**（M2 起始 42 个，含 1 个豁免） |
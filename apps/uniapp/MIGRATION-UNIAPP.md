# uniapp 迁移记录

> 项目：uni-app 移动端（H5 / 微信小程序 / App 三端），版本 `4.5.3`
> 起点：Vue 3 + vuex 4 + HBuilderX 构建；无 tsconfig、无 eslint 配置、无 typecheck 环节

## 一、勘察结论（决定方案的前提）

### 1.1 构建方式与前面四个 app 不同

| 事实 | 依据 |
|---|---|
| **没有 `dev` / `build` 脚本** | `package.json`（只有 `postinstall` + node 测试脚本） |
| `@dcloudio/*` 只装了 `types` | `node_modules/@dcloudio` 下仅 `types` |
| 构建由 **HBuilderX** 完成 | `vite.config.js` 从 HBuilderX 插件目录 `require('@dcloudio/vite-plugin-uni')`，并把 `@vue/*` alias 到 HBuilderX **内置** Vue 包 |
| 编辑器配置是 `jsconfig.json`，注释明确写"本项目没有 tsc / vue-tsc 环节" | `jsconfig.json` |

**因此：不能像 buyer 那样"迁成 Vite 并在本地 build"。HBuilderX 是唯一能产出 H5 / 小程序 / App 产物的工具。**

### 1.2 代码现状

| 项 | 数值 |
|---|---:|
| `.vue` | 214 个 / 63,827 行 |
| `.js` | 115 个 / 13,867 行 |
| `.ts` | 24 个 / 968 行（其中 21 个是 `.d.ts`） |
| `.scss` | 24 个 / 9,110 行 |
| `<script setup>` | 212 / 213 |
| **`lang="ts"` 已用** | **198 个** |
| 未用 TS 的 SFC | 15 个 |
| 状态管理 | vuex 4 |

**关键判断**：TS 不是从零引入——198 个 SFC 早已在写 TS 语法，只是**从来没有类型检查环节**。所以主要工作是「建检查网 + 把 115 个 `.js` 基础设施转 TS」。

### 1.3 四条硬约束

1. **easycom 自动注册**：`easycom.autoscan: true`，`components/<name>/<name>.vue` 按路径自动注册。16 个组件目录只有 **7 个**符合 `dir == 文件名`，其余靠显式 import → 改名必须保持 `dir == file`。
2. **`pages.json` 绑定页面文件路径**：**130 条 `path`** + **9 个 subPackages** → 改页面文件名 = 改小程序/App 页面路由，影响分享链接、扫码落地页、推送跳转。
3. **条件编译 571 处**（`#ifdef MP-WEIXIN` 77、`H5` 39、`APP-PLUS` 32、`#ifndef MP-WEIXIN` 31，含模板注释 47）。
4. **不许动的目录**：`uni_modules/`、`js_sdk/`、`hybrid/`、`CustomStartPage/`、`CustomStoryboard/`、`static/`；`patch-package` 对 `uview-plus@3.8.42` 打补丁，`postinstall` 还 patch `mqtt`（改依赖树必须复核 patch 是否仍 applied）。

## 二、两个决策（已确认，方案按此执行）

### 决策 A：验证方式 = 不新增 CLI 构建依赖

- 门禁 = `typecheck` + `lint` + 5 个 node 测试脚本；三端运行验证由 HBuilderX 按 `SMOKE-UNIAPP.md` 执行。
- 不引入 `@dcloudio/vite-plugin-uni`（版本与 HBuilderX 强耦合、项目 Vue 与内置 Vue 混用风险）。

### 决策 B：**不改** `pages/`、`pages-sub/` 的文件名与 `pages.json`

- 页面路径是运行时路由（小程序页面栈、分享链接、扫码、推送落地页），改了只有 HBuilderX 能验证，风险与收益不匹配。
- 命名统一只在安全范围内做：`api/ utils/ lib/ plugins/ config/ store/` 与 `components/` 中非 easycom 约定的文件。

---

## 三、U0 · 检查网与基线（已完成）

### 3.1 新增配置

| 文件 | 内容 |
|---|---|
| `tsconfig.json` | 面向 typecheck 的配置：`allowJs + checkJs:false`、`noEmit`、`paths @/*`、`types: ["@dcloudio/types"]`、**`strict: false` 起步**；`exclude` 掉 `node_modules/unpackage/hybrid/uni_modules/js_sdk/scripts/patches/Custom*/static` |
| `eslint.config.js` | ESLint 9 flat + `typescript-eslint` + `eslint-plugin-vue`；补 uni 全局（`uni`/`wx`/`plus`/`getApp`/`getCurrentPages`/`uniCloud`/`WeixinJSBridge`/`requirePlugin`/`permision`） |
| `package.json` | 新增 `typecheck` / `lint` / `lint:fix` / `test`；新增 devDeps（`typescript`、`vue-tsc` 走 catalog，`eslint` 系列与其它 app 同版本） |

**刻意不给 uniapp 安装 `vue`**：HBuilderX 编译期注入 Vue，`vite.config.js` 的 `@vue/*` alias 正是在防混用；装进项目反而有风险。

### 3.2 规则取舍（每条都有理由，写进配置注释）

| 规则 | 设置 | 理由 |
|---|---|---|
| `no-redeclare` | **off** | 条件编译会让同一符号在 `#ifdef` / `#ifndef` 分支各定义一次（`mqtt.js` 的 `MqttClient`、`LiveChatService`），ESLint 看不到编译期裁剪 → 纯误报 |
| `no-unreachable` / `no-constant-condition` | warn | 同上：互斥分支各有一个 `return`、以及 `if (false) { // 兼容旧逻辑 }` 这类刻意保留 |
| `vue/no-use-v-if-with-v-for` | warn | 需要结合 uview 与具体模板人工判断，机械重构有视觉回归风险（尤其小程序端） |
| `vue/no-v-text-v-html-on-component` | warn | uview 组件依赖此写法 |
| `vue/valid-template-root` | off | 存在无 DOM 输出的副作用组件（`uniMap` 只做定位、`-goods-desc` 只挂插槽） |
| `@typescript-eslint/no-explicit-any` | off | 存量大量显式 any，类型化按目录推进 |
| `no-var` / `prefer-const` | warn | **不自动 fix**：`var` → `let/const` 会改变作用域语义（函数级 → 块级），历史上靠 hoisting 的代码会静默坏掉 |

### 3.3 首轮就抓到 3 个真实缺陷（不是风格问题）

| 位置 | 问题 | 处理 |
|---|---|---|
| `components/m-share/index.vue:74` | `getCurrentInstance()` 被直接使用，但只 import 了 `ref` → 调用 `weChatShare()` 时 **ReferenceError** | 补 `getCurrentInstance` 导入 |
| `pages/tabbar/home/template/tpl.js:77` | `tipsGetSettings()` 用了 `isIos`，而 `isIos` 声明在另一个函数 `scan()` 里 → App 端点「去设置」就 **ReferenceError** | 函数内就地计算 `plus.os.name === "iOS"` |
| `utils/tools.js:56` | `throttle` 是**箭头函数**，内部 `fn.apply(that, arguments)` 里的 `arguments` 在 ESM 下不存在 → 触发节流分支即 **ReferenceError** | 改成普通 `function`（`this` 未被使用，行为等价） |

> 这三个都是"只有接上 lint 才会暴露"的运行时炸弹，且都属于条件分支（App 端 / 分享 / 节流），平时手点很难碰到。

### 3.4 基线数据（ratchet 的起点）

| 门禁 | 基线 | 说明 |
|---|---:|---|
| `lint` | **0 error / 271 warning** | `lint` 脚本已写 `--max-warnings 271` |
| `typecheck` | **274 error** | 见下表分布；`typecheck` 暂不作为 CI 门禁，U2 清零后再接 |
| node 测试 | **全绿** | 抽奖 / 支付成功 / SKU / 订单评价 / MQTT 运行时 |

`typecheck` 错误构成（按错误码）：

| 错误码 | 数量 | 主要成因 |
|---|---:|---|
| TS2554 | 87 | 项目 `utils/filters.js` 等 JS 函数形参未标可选（`unitPrice(a, b)` 却声明 3 参） |
| TS2339 | 62 | 全局属性未声明（`$u`、`$lightColor`）、`Event.detail`、`plus.android.*`、`Page.__page__` |
| TS2307 | 53 | **无扩展名 `.vue` 导入**（`@/components/m-share/index`）、`@/icon.png` 资源模块 |
| TS2345 | 26 | 类型不匹配（uni API 重载、微信 share 参数枚举） |
| 其它 | 46 | TS2322 / TS2305 / TS2304 / TS2365 |

错误最集中的文件：`pages/tabbar/special/special.vue`(27)、`pages/promotion/live/room.vue`(18)、`pages/product/goods.vue`(16)、`pages/passport/login.vue`(12)、`pages/order/invoice/setInvoice.vue`(11)。

### 3.5 U0 验证

| 检查 | 结果 |
|---|---|
| `pnpm --filter @spring-breeze/uniapp lint` | ✅ exit 0（0 error / 271 warning） |
| `pnpm --filter @spring-breeze/uniapp typecheck` | ✅ 可运行，产出 274 条基线 |
| `pnpm --filter @spring-breeze/uniapp test` | ✅ exit 0，5 个脚本全过 |
| `pnpm install` 后 `postinstall` | ✅ `patch-package` + mqtt patch 仍 applied |

---

## 四、后续阶段（待执行）

### U1 进展（进行中）

| 批次 | 文件 | 状态 | 效果 |
|---|---|---|---|
| U1-a | `utils/filters.js` → `filters.ts`（609 行，25 个导出，78 处引用） | ✅ | TS2554 从 **87 → 8**，全部错误 274 → 215 |
| U1-b | `utils/storage.js` → `storage.ts`（193 行，26 处引用） | ✅ | 引用零残留，错误数持平 |
| U1-c | `utils/tools.js` 修 `throttle` 的 `arguments` 缺陷 | ✅ | lint error 清零的一部分 |

**filters.ts 的转换原则**：函数体一行未改，只做三件事 ——
① 把调用方经常省略的参数标为可选（`unitPrice(val?, unit, location?)`），这是 87 处 TS2554 的根因；
② 把 `let` 改成 `const` 时逐个确认没有被重新赋值；
③ 条件编译注释（`// #ifdef H5` 等）原样保留。

**import 扩展名**：模块从 `.js` 改名 `.ts` 后，78 + 26 处 `@/utils/xxx.js` 引用必须去掉 `.js`。
本轮用一次性脚本处理（`(['"][^'"]*?<模块路径>)\.js(['"])` → 去扩展名），并在改完后 grep 校验零残留。

### U2 进展（已完成核心目标：typecheck 274 → 0）

**曲线：274 → 215（U1）→ 170 → 118 → 93 → 86 → 69 → 52 → 30 → 10 → 0**

| 批次 | 内容 | 效果 |
|---|---|---|
| U2-a | `types/global-augment.d.ts`：`ComponentCustomProperties`、`interface Event`、`Page.PageInstance.__page__`、`PlusAndroidInstanceObject`、`PlusIos.import`、`Plus.cache`、`WeixinJSBridge`、`requirePlugin` | 215 → 170 |
| U2-b | `types/assets.d.ts`：图片/音视频模块 | 同上 |
| U2-c | 53 处无扩展名 `.vue` 导入补 `.vue` | 170 → 118 |
| U2-d | `PageInstance` 命名空间归属修正 | 118 → 116 |
| U2-e | `getPages` 返回类型 + `isLogin` 重载 | 110 → 93 |
| U2-f | 恒假 / 巧合成立的条件判断 | 93 → 86 |
| U2-g | 条件编译重复声明（`hlsInstance` 合并、`@ts-expect-error` 抑制） | 86 → 69 |
| U2-h | 模板 v-for 下标 `string \| number`：批量放宽 25 个下标形参 | 69 → 62 |
| U2-i | `Plus.cache`、`getWindowInfo`、`<button type>`、`getWalletLog` 补接口 | 62 → 52 |
| U2-j | 定点修复 22 处：算术/赋值归一到 `Number()`、`!x > 0` 简化、ref 初始值、`canvasToTempFilePath`/`fields` 重载、`plus.runtime.launchApplication` | 52 → 30 |
| U2-k | 定点修复 18 处：api 形参给默认值（比调用处断言更准）、`:key`、`|` → `||`、`wrapperStyle`、`getUserInfo` 历史多参 | 30 → 10 |
| U2-l | 最后 10 处：`onBackPress` shim 补 `{ from }` 参数、`previewGallery`/`preview` 放宽、`cartList` 补 `themeStyle`、`PlusIos.import` | 10 → **0** |

### 修类型时发现的真实缺陷（累计 8 个）

| 位置 | 问题 | 处理 |
|---|---|---|
| `bank-accounts.vue` / `withdraw-apply.vue` | 导入的 4 个银行卡接口在 `@/api/distribution` **不存在** → 运行时 `TypeError`，页面不可用 | 后端已有对应接口，按既有约定补齐 |
| `wallet-log.vue` | 导入的 `getWalletLog` 不存在 | 后端 `GET /distribution/cash/walletLog`，已补齐 |
| `comment.vue` | `records == []` 恒 false | 删除恒假项 |
| `login.vue` / `payOrder.vue` | `ua.match(...) == 'micromessenger'` 靠数组 toString 偶然成立 | 改 `/MicroMessenger/i.test(ua)` |
| `fetch_coupon.vue` | `coupList.value != ""`（空数组 `== ""` 为 true） | 改 `length > 0` |
| `utils/tools.js` | 箭头函数里用 `arguments` | 改普通 `function` |
| `shareOrderGoods.vue` | `!x > 0`（布尔与数字比较） | 等价简化为 `!x` |
| `cartList.vue` | 模板 `:style="themeStyle"` 但脚本里**从未定义** `themeStyle` → 主题色不生效 | 补 computed（与同文件 `lightColor` 一致） |
| `tpl.js` | `tipsGetSettings` 用了 `scan()` 内的 `isIos` | 就地计算 |
| `m-share/index.vue` | 用了 `getCurrentInstance` 但没 import | 补导入 |

### 被"改类型"打断的测试（已修）

`scripts/test-order-evaluation.mjs` 用正则从 `.vue` 抠函数源码再 eval，写死了
`function renderData(index: number)`；把下标类型放宽后匹配不到 → 测试报 null。
正则改为容忍任意类型注解（`index(?::[^)]*)?`）。

> 教训：用源码文本做断言的测试，对类型注解这类非行为改动也敏感。

### 剩余阶段

| 阶段 | 内容 | 完成标准 |
|---|---|---|
| U1 剩余 | `utils/` 其余 22 个（`Foundation` 292、`md5` 224、`uuid.modified` 247、`appointmentGoods` 703…）、`config/`、`store/`、`api/` 27 个、`lib/` 13 个、`plugins/` 2 个 | 这些目录 typecheck 0 错误 |
| U2 | 15 个非 TS 的 SFC 补 `lang="ts"`；补 `types/` 全局声明（`$u`、`$lightColor`、`Event.detail`、`plus.android`、`Page.__page__`）；`*.png` 资源模块声明；无扩展名 `.vue` 导入补扩展名 | `typecheck` 0 错误后接 CI |
| U3 | 安全范围内命名 kebab 化 | `pages.json` 零改动；typecheck 0；旧路径 0 残留 |
| U4 | CI 增加 `uniapp` job；新增 `SMOKE-UNIAPP.md`（三端） | CI 可跑；清单可执行 |

### 已知风险（U1+ 需持续注意）

| 风险 | 缓解 |
|---|---|
| `.js` → `.ts` 后带 `.js` 扩展名的 import 会断 | 先扫 `from "...js"` 说明符，改名时同步去扩展名 |
| 加 devDeps 影响 HBuilderX 构建 | 不装 `vue`；保留 `vite.config.js` 的 alias；U1 前后各在 HBuilderX 跑一次 H5 冒烟 |
| codemod 破坏条件编译块 | 只做行内注解；改前后 `#ifdef/#endif` 计数必须一致（当前 571） |
| 页面改名导致线上落地页 404 | 决策 B：不改页面路径 |

---

## 五、U2 完成与 CI 接入

`typecheck` 已从 **274 → 0**，因此 `uniapp` 进入了 CI 门禁。

### 5.1 CI job

`.github/workflows/ci.yml` 新增 `uniapp`：

```
typecheck (vue-tsc) → lint (ratchet 261) → 5 个 node 脚本测试
```

并把 `apps/uniapp/**` 加进 `push` / `pull_request` 的 paths 触发。

**CI 里不跑 build**：uni-app 的 H5 / 小程序 / App 产物只能由 HBuilderX 生成；
硬塞 `@dcloudio/vite-plugin-uni` 会与 HBuilderX 内置 Vue 运行时冲突（`vite.config.js` 的 alias 正是在防这个）。
该限制写在 job 注释里，避免后来者误以为是漏配。

本地逐条模拟：`typecheck exit=0` / `lint exit=0` / `test exit=0`。

### 5.2 门禁现状

| 检查 | 结果 |
|---|---|
| `typecheck`（vue-tsc） | ✅ **0 错误** |
| `lint`（ratchet） | ✅ **0 error / 261 warning** |
| node 脚本测试 | ✅ 5 个全绿（抽奖 / 支付 / SKU / 订单评价 / MQTT） |
| 条件编译 | ✅ 全树 `ifdef/endif` 配平 |

### 5.3 下一步

| 阶段 | 内容 |
|---|---|
| U1 剩余 | `utils/` 其余 22 个、`config/`、`store/`、`api/` 27 个、`lib/` 13 个、`plugins/` 2 个 → 转 `.ts` |
| U2 剩余 | 15 个非 TS 的 SFC 补 `lang="ts"`（当前靠 allowJs 通过） |
| U3 | 安全范围内命名 kebab 化（`pages.json` 与页面路径不动） |
| U4 剩余 | `SMOKE-UNIAPP.md`（H5 / 小程序 / App 三端清单） |
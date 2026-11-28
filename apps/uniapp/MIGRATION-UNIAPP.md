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
---

## 六、H5 本地联调配置（CORS 报错修复）

### 6.1 现象

HBuilderX 起 H5 dev（`http://localhost:5173`）后，控制台出现：

```
Access to XMLHttpRequest at 'https://byer-api.pickmall.cn/buyer/common/site/theme'
from origin 'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

首页三条接口（`site/theme`、`site/category-page`、`other/pageData/getIndex`）全部 `ERR_FAILED`。

### 6.2 根因

`config/api.js` 的 **dev 段指向远端域名**，而不是本地后端：

```js
const dev = {
  buyer: "https://byer-api.pickmall.cn",   // 还是把生产域名（且拼错 byer）当开发地址
  store: "https://admin-api.pickmall.cn",
  im:    "https://im-api.pickmall.cn",
}
```

远端不认 `http://localhost:5173` 这个 Origin（预检没有 `Access-Control-Allow-Origin`），
浏览器直接拦掉，与前端代码无关。

### 6.3 修复

dev 段改成本地后端（端口对应 buyer-api 8888、manager-api 8887、im-api 8885）：

```js
const dev = {
  buyer: "http://127.0.0.1:8888",
  store: "http://127.0.0.1:8887",
  im:    "http://127.0.0.1:8885",
  mqtt:  "wss://lilishop-mqtt-pull.dllll.xyz/mqtt", // 本地无 broker，保持远端
}
```

- **只影响 H5 / 开发环境**：`#ifdef MP-WEIXIN || APP-PLUS` 分支会强制 `api = prod`，小程序与 App 打包不受影响。
- 后端 `SecurityBean#corsConfigurationSource` 用 `AllowedOriginPatterns("*")` + `allowCredentials`，
  实测预检返回 `Access-Control-Allow-Origin: http://localhost:5173`，可直接联调。

改完需**重启 H5 dev**（`config/api.js` 在模块加载时求值）。

### 6.4 验证（本地实跑）

| 接口 | 结果 |
|---|---|
| `OPTIONS /buyer/common/site/theme` | 200，`ACAO: http://localhost:5173`，`ACAC: true` |
| `GET /buyer/common/site/theme` | 200，返回主题配置 |
| `GET /buyer/common/site/category-page` | 200 |
| `GET /buyer/other/pageData/getIndex?clientType=H5` | 200，返回装修 pageData |
| `GET /buyer/distribution/bank-card` | 403（说明路由存在，只是未登录 —— 顺带验证上一轮补的接口路径正确） |

> 若后端不在本机，改这三个地址即可；或在 `manifest.json` 的 `h5.devServer.proxy` 里配代理，
> 让浏览器请求同源、由 dev server 转发（跨机调试时更合适）。
### 6.5 IM 地址同样按「H5 + 开发模式」区分

`config/config.js` 的 `baseWsUrl` / `imWebSrc` 原本写死生产地址，H5 dev 点「联系客服」会：
① WS 连生产 IM（聊天内容真的进生产库）；② IM 页面跳到线上站点。

改成：

```js
const PLATFORM = process.env.UNI_PLATFORM || "h5";
const IS_DEV_H5 = process.env.NODE_ENV === "development" && PLATFORM === "h5";
const imWebSrc = IS_DEV_H5 ? "http://localhost:8000" : "https://im.pickmall.cn";
const baseWsUrl = IS_DEV_H5 ? "ws://127.0.0.1:8885/lili/webSocket" : "wss://im-api.pickmall.cn/lili/webSocket";
```

**为什么不用 `#ifdef H5` 写两份常量**：我第一版就是那么写的，结果 lint 报
`no-useless-assignment ×2`（条件编译在构建期裁剪，ESLint 看到的是两份重复声明）。
`NODE_ENV + UNI_PLATFORM` 判断只有一份声明，且 `NODE_ENV` 能挡住「H5 生产包连本地」。

取不到 `UNI_PLATFORM` 时按 `h5` 兜底 —— 仍有 `NODE_ENV` 把关，不会把生产包带偏。
---

## 七、U1：`utils/` 全部转 TS（26/26）

| 批次 | 文件 | 说明 |
|---|---|---|
| 1 | `config/api` `config/config` `store/index` + 11 个小 utils | mpShare、orderEvaluation、payment-success、wechatAddress、form-style、orderDelivery、categoryPageSetting、decorate-link、giftCard、RegExp、socket_service |
| 2 | request、tools、theme、goodsType、emojis、uploadHelper、distributionStatus | 7 个 |
| 3 | Foundation、md5、uuid.modified、distributionBind、appointmentGoods | 5 个 |

**结果：`utils/` 26 个 `.ts` / 0 个 `.js`，typecheck 仍为 0。**

### 7.1 遇到的 5 类问题与处理

| 问题 | 处理 |
|---|---|
| `parseInt(number)` 在 TS 里参数是 string | `parseInt(String(x), 10)`（`Foundation` 11 处、`tools` 5 处、`request` 1 处）—— 数值语义不变 |
| `debounce` / `throttle` 返回的函数没有形参，TS 推成 `() => void`，调用处报「参数过多」 | 改用 **rest 参数** `(...args: Parameters<T>)`，同时保留 `this` 转发 |
| `throttle` 里的 `fn.apply(that, arguments)` | `arguments` 是 throttle 自己的实参（会把 fn/that/gapTime 也传进去）；改 rest 参数后只转发业务参数 —— 实际调用方只传三个参数，行为一致 |
| `uni.setTabBarStyle` 在 `@dcloudio/types` 里返回 `void`，`theme.ts` 却检查了 `.catch` | `const task: any = ...`，保留原判空逻辑 |
| `uuid.modified.ts`（vendored 第三方 247 行） | 文件级 `// @ts-nocheck` —— 逐行补类型等于重写库代码，后续无法与上游 diff；**ESLint 仍然生效** |

### 7.2 测试如何加载 `.ts`

`scripts/test-*.mjs` 原来 `import '../utils/xxx'`（Node 的 ESM 不做扩展名补全，`.ts` 也不会自动尝试）：

- Node 24 能直接跑 `.ts`（类型擦除），但**仅限显式 `.ts` 说明符**；
- 把 `.ts` 写进业务源码需要 `allowImportingTsExtensions`，还要多端编译器都支持 —— 风险大于收益。

所以新增 `scripts/ts-resolve-hook.mjs`：测试进程里注册一个 resolve 钩子，把无扩展名的相对导入补成 `.ts`。
业务源码保持无扩展名，HBuilderX 各端不受影响。

```js
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
register('./ts-resolve-hook.mjs', pathToFileURL('./scripts/'))
const { paymentSuccessUrl } = await import('../utils/payment-success.ts')
```

### 7.3 剩余

| 目录 | 现状 | 下一步 |
|---|---|---|
| `utils/` | ✅ 26/26 `.ts` | — |
| `config/` `store/` | ✅ 全 `.ts` | — |
| `api/` | 27 个 `.js` | 转 `.ts` |
| `lib/request/` | 13 个 `.js` | 转 `.ts` |
| `plugins/APPUpdate/` | 1 个 929 行 `.js` | 转 `.ts` 或 `@ts-nocheck` |
---

## 八、U1 完成：`api/` 与 `lib/` `plugins/` 全部转 TS

| 目录 | 结果 | 处理方式 |
|---|---|---|
| `api/` | **27/27 `.ts`** | 全部类型化；`article.ts` 删掉一个死函数 |
| `lib/request/` | 13/13 `.ts` | 文件级 `@ts-nocheck`（vendored 请求内核） |
| `plugins/APPUpdate/` | 1/1 `.ts` | 文件级 `@ts-nocheck`（DCloud 官方插件，整文件被 `#ifdef APP-PLUS` 包裹） |

**基础设施总计 71 个 `.ts` / 0 个 `.js`：`utils 26 + api 27 + config 2 + store 2 + lib 13 + plugins 1`。**

### 8.1 `api/article.ts` 的死代码

```js
export function getArticleCategory(category_type) {
  return http.request({ url: `${api.base}/pages/article-categories`, ... })
}
```

- `api.base` **不存在**（`config/api` 只导出 `buyer/store/im/mqtt + buyerHost/storeHost`）→ 运行时 URL 会是 `undefined/pages/article-categories`；
- 全仓库 **无调用方**（grep 只有定义处）；
- 后端真实接口是 `GET /buyer/other/article/articleCategory/list`，与同文件其它函数（`/other/article/...`）风格一致。

处理：**删除该函数**（连同只为它引入的 `import api from '@/config/api'`）。
没有"顺手改成新 URL"——那等于凭空实现一个没人调用的功能，行为无从验证。

### 8.2 请求内核为什么整体 `@ts-nocheck`

`lib/request` 是 axios 风格的 `uni.request` 封装（13 文件 728 行），错误集中在：

- `Request` 在构造函数里动态挂 `this.config` / `this.interceptors`，类体没有字段声明；
- `mergeConfig` 靠 `{...defaults, ...arg}` 拼装，形参默认 `{}` 导致属性访问全报错；
- 拦截器链用 `chain.shift()` 动态调度。

逐行补类型 = 重写这一层。而它是**请求路径的唯一出口**，改错一个字段就是全站请求挂掉。

采取的策略：**把类型收在边界上**

| 层 | 类型状态 |
|---|---|
| `lib/request/**` | `@ts-nocheck`（仅关闭类型检查，ESLint 仍跑） |
| `utils/request.ts`（门面） | ✅ 已类型化，并用 `TypedRequest` 别名补上 `interceptors` 的类型 |
| `api/**` | ✅ 已类型化，页面拿到的是有类型的 `http.request()` |

`utils/request.ts` 里那段值得记一笔：做模块增强（`declare module '@/lib/request/index'`）对**路径别名**不生效，
最后用

```ts
type TypedRequest = InstanceType<typeof Request> & { interceptors: { request: { use: ... }; response: { use: ... } } };
let http = new Request() as unknown as TypedRequest;
```

直接断言实例类型，既不改运行时，也一眼能看出为什么。

### 8.3 顺带修的 lint 错误

- `deepMerge` 用 `arguments` → 改 rest 参数 `(...sources: any[])`；
- 用 `eslint . --fix --fix-type directive` 清掉 20 条"未使用的 eslint-disable"（只改注释、不动代码 ——
  **绝不用 `--fix` 全量修**，否则会把 `var` 改成 `let/const`，改变作用域语义）。
- lint ratchet 收紧：**261 → 253**。
---

## 九、U3：安全范围内的命名 kebab 化

### 9.1 改了什么

| 目录 | 改名数 | 例子 |
|---|---:|---|
| `utils/` | 16 | `Foundation` → `foundation`、`RegExp` → `regexp`、`uuid.modified` → `uuid-modified`、`socket_service` → `socket-service`、`mpShare` → `mp-share`、`orderEvaluation` → `order-evaluation` |
| `api/` | 2 | `pickupCard` → `pickup-card`、`pointsCoupon` → `points-coupon` |
| `lib/request/` | 8 | `Request` → `request`、`InterceptorManager` → `interceptor-manager`、`mergeConfig` → `merge-config`、`buildURL` → `build-url`、`isAbsoluteURL` → `is-absolute-url` |
| `plugins/` | 1 | 目录 `APPUpdate/` → `app-update/` |

**总计 25 个文件 / 1 个目录**，同步更新 **69 个文件**里的引用。

### 9.2 刻意不动的部分（决策）

| 范围 | 原因 |
|---|---|
| `pages/`、`pages-sub/` 的文件名 | 它们是 `pages.json` 里的运行时路由，改名 = 线上落地页 404（方案决策 B） |
| `pages.json` | 同上；本轮 `git diff` 校验**零改动** |
| `components/` 下 easycom 组件 | easycom 靠 `components/目录名/目录名.vue` 或 `index.vue` 自动注册标签，改文件名可能让 `<m-goods-list>` 直接失效 |

页面文件本轮只有 **import 语句**变化（引用了改名后的 utils/api），文件本身没动。

### 9.3 两个 Windows / 机械替换的坑

**① 只改大小写的重命名在 Windows 上会"失败但不报错"**

`Foundation.ts → foundation.ts`：文件系统大小写不敏感，`fs.renameSync` 认为源和目标同一个文件，
脚本里 `if (exists(to)) skip` 直接跳过 —— 但 import 已经改成 `@/utils/foundation`，
于是 typecheck 报：

```
TS1149: File name 'utils/regexp.ts' differs from already included file name ... only in casing
TS1261: Already included file name ... differs from file name ... only in casing
```

解法：借道临时名。

```powershell
cmd /c "ren Foundation.ts foundation.tmp && ren foundation.tmp foundation.ts"
```

**② "替换所有引号里的字符串"会误伤模板绑定**

第一版脚本按「引号 + 路径末段匹配」做替换，结果把

```html
:setting="categoryPageSetting"      <!-- 组件 prop 绑定 -->
```

改成了 `:setting="category-page-setting"`（因为属性值也是个引号字符串）。这会让
`tpl-category-goods` 收到一个未定义变量 —— 类型检查立刻报 `Property 'category' does not exist`。

改成只替换 **`from '...'` / `import(...)` 的说明符**，不再扫任意字符串。已恢复该绑定。

> 另外一处是**自洽**的机械替换，保留了：`poster-panel.vue` 的 canvas id
> `distributionPosterCanvas` → `distribution-poster-canvas`（模板 id、`canvas-id`、
> `CANVAS_SELECTOR` 常量 4 处一起改，全仓库无其它引用，符合命名规则）。

### 9.4 验证

| 检查 | 结果 |
|---|---|
| `typecheck` | **0 错误**（改名后所有 import 仍能解析） |
| `lint` | 0 error / 253 warning（ratchet 253） |
| node 测试 | 5 个全绿（含把测试脚本里的 `../utils/orderEvaluation.ts` 同步改名为 `order-evaluation.ts`） |
| `pages.json` | 零改动（git 校验） |
| 旧文件名残留引用 | 0 处 |
| 安全范围内非 kebab 文件 | 0 个（`store/index.d.ts` 属声明文件，`index` 本身即单词名） |
---

## 十、U2 收尾：214 个 SFC 全部 `lang="ts"`

### 10.1 本轮补的 15 个

| 文件 | 行数 | 修的问题 |
|---|---:|---|
| `pages/mine/paidMember.vue` | 79 | `ref({})` 推成 `{}` → 35 个属性错误；改 `ref<Record<string, any>>({})` |
| `pages/mine/memberBenefits.vue` | 230 | `current`/`failedBenefitIcons` 同上；`grades` 补 `any[]` |
| `pages/cart/gift-card/pickupCard.vue` | 118 | `detail` 补 `Record<string, any>`；`selected`/`addresses` 补 `any[]` |
| `pages/promotion/lottery/index.vue` | 152 | `chances` 补 `Record<string, any>`、`rotations` 补 `Record<string, number>` |
| `pages-sub/merchant/pages/index/index.vue` | 812 | `storeInfo` 补 `Record<string, any>` |
| `pages-sub/merchant/pages/evaluation/list.vue` | 650 | `params` 是「分页 + 动态筛选」，补 `Record<string, any>` |
| `pages-sub/merchant/pages/goods/list.vue` | 472 | 同上 |
| `pages/order/components/verificationCodes.vue` | 44 | `defineProps` 改类型版（见 10.2） |
| `pages/promotion/lottery/PrizeWheel.vue` | 70 | `boundingClientRect` 回参是 `NodeInfo \| NodeInfo[]` → 显式 `rect: any` |
| `pages/promotion/point/PointsCouponMall.vue` | 160 | `showModal` 的 `resolve` 给 `any`；`uuid.v4()` 走 `(uuid as any)` |
| 其余 5 个（`paid-member-price`、`coupon-pack`、`experience`、`paidMemberRecords`、`MemberGradeCard`） | — | 加 `lang="ts"` 后本身无错 |

**结果：214 个 `.vue` 全部 `lang="ts"`，typecheck 仍为 0。**

### 10.2 一处必须等价改写的地方（`defineProps`）

原来是运行时声明：

```js
defineProps({ items: { type: Array, default: () => [] } })
```

改成类型版后 **`default` 会丢失** —— 而父组件 `orderDetail.vue` 有一处 `<verification-codes v-else-if="..." :items="..." />`
（总是传），但模板里还有 `v-if="items.length"`，一旦哪天不传就会 `Cannot read properties of undefined`。

所以用 `withDefaults` 保留运行时默认值：

```ts
withDefaults(
  defineProps<{ items?: { key?: string | number; code?: string; struck?: boolean }[] }>(),
  { items: () => [] }
)
```

> 类型版 `defineProps` 不支持 `default`，这是 Vue 3 的既定行为，不是本项目特例。

### 10.3 加了防回归的门禁

`eslint.config.js` 新增：

```js
"vue/block-lang": ["error", { script: { lang: "ts" } }],
```

反向验证过：故意写一个纯 JS 的 SFC，lint 立刻报

```
5:1  error  The 'lang' attribute of '<script>' is missing  vue/block-lang
```

这样后面新增页面不会再悄悄退回纯 JS（typecheck 对纯 JS 的 SFC 是"能过但不检查语义"的）。

### 10.4 剩余 20 个 `.js`（页面局部模块）

`main.js`、`vite.config.js`、`vue.config.js`、`eslint.config.js`（配置/入口，保留），
以及可继续转 TS 的页面局部模块：

```
components/m-buy/popup.js            pages/mine/im/socket.js
pages/product/product/popup/popup.js  pages/product/product/promotion/promotion_type.js
pages/promotion/live/mqtt/mqtt.js     pages/promotion/live/utils/liveChat.js
pages/promotion/live/utils/liveMqtt.js  pages/promotion/live/utils/liveRecommend.js
pages/promotion/live/utils/liveSetting.js  pages/promotion/lottery/wheel.js
pages/tabbar/home/template/tpl.js     pages-sub/merchant/utils/storeRequest.js
pages-sub/merchant/api/{evaluation,goods,order,passport}.js
```

它们目前通过 `allowJs` 被 TS 引用（类型为 `any`），页面侧的 `lang="ts"` 已经有了，
下一轮把这些转成 `.ts` 才算真正收口。
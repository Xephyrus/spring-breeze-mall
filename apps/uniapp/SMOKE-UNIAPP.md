# uniapp 冒烟清单（按验证范围分组）

> **uni-app 的产物只能由 HBuilderX 生成**，所以运行验证只能在本机做。
> 这份清单按「**谁来验**」分组：能自动化的已经自动化，剩下的是必须真人点的。
>
> 勾选方式：把 `[ ]` 改成 `[x]`。

## 范围索引

| 范围 | 章节 | 条目 | 谁来做 |
|---|---|---|---|
| 🤖 **已自动验证** | 九、工程门禁与自动化 + 附录 A | 40–45 | 不用手点，跑一遍命令即可（CI 每次 push 也会跑） |
| 🖐 **H5 手工** | 一～六 | 1–25 | 你，浏览器里点（约 15 分钟） |
| 📱 **微信小程序** | 七 | 26–32c | 你，微信开发者工具（约 10 分钟） |
| 📲 **App** | 八 | 33–39d | 你，真机（约 15 分钟） |
| ⚠️ **已知非问题** | 十 | — | 对照即可，不用处理 |

**建议顺序**：🤖 先跑一遍（30 秒）→ 🖐 H5（最快暴露问题）→ 📱 小程序（覆盖条件编译）→ 📲 App（原生能力）。

> 当前项目**只有本地环境**：开发构建（运行）一律连 `DEV_HOST`（默认 `127.0.0.1`）；
> 发行构建走 `prod` 段（占位，待部署）。后端地址只在 `config/api.ts` 一处改。

## 0、环境准备（通用）

| 项 | 值 |
|---|---|
| H5 dev | HBuilderX 运行到浏览器（默认 `http://localhost:5173`） |
| 微信小程序 | HBuilderX 运行到小程序模拟器（appid `wx32788b91bdb614c0`） |
| App | HBuilderX 运行到手机或模拟器 |
| buyer-api | `http://127.0.0.1:8888`（必须启动） |
| manager-api | `http://127.0.0.1:8887`（店铺/入驻相关页面需要） |
| im-api | `http://127.0.0.1:8885`（客服/聊天相关页面需要） |
| im 前端 | `http://localhost:8000`（IM 页面用 web-view 打开） |

> **改了 `config/api.ts` 或 `config/config.ts` 之后必须重启 H5 dev** —— 这两个文件在模块加载时求值。
> 后端地址只在 `config/api.ts` 的 `DEV_HOST` 一处（默认 `127.0.0.1`）；`prod` 段是占位，部署时替换。

---

## 一、🖐 H5：启动与首页（CORS 修复的直接验证）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 1 | 重新运行 H5 dev，打开 `http://localhost:5173` | 首页正常渲染 | [ ] |
| 2 | F12 → Console | **无 CORS 报错**、无 `ERR_FAILED` | [ ] |
| 3 | F12 → Network 过滤 XHR | 请求域名是 `127.0.0.1:8888`（不是 `pickmall.cn`） | [ ] |
| 4 | 看三条首页接口 | `site/theme`、`site/category-page`、`other/pageData/getIndex` 均 **200** | [ ] |
| 5 | 首页装修楼层 | 轮播/品牌墙/商品楼层/优惠券/公告等**全部渲染**（`getFloorData` 返回 pageData） | [ ] |
| 6 | 主题色 | 与后台配置一致（`theme` 接口生效） | [ ] |
| 7 | 底部 TabBar 切换（首页/分类/购物车/我的） | 四页都能打开，无白屏 | [ ] |

> 第 2–4 条是本轮 CORS 修复的核心验证点。若仍报 CORS，先确认请求域名是不是 `127.0.0.1:8888`。

## 二、🖐 H5：购物车与主题（修的两个真实缺陷）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 8 | 商品详情 → 加入购物车 → 打开购物车 | 列表正常，价格/数量正确 | [ ] |
| 9 | **购物车页主题色** | 顶部导航/按钮使用站点主题色（此前 `themeStyle` 未定义导致不生效） | [ ] |
| 10 | 勾选/全选/改数量/删除 | 均正常，合计金额随之变化 | [ ] |
| 11 | 优惠金额那一行 | `优惠减:￥X` 数值正确（本轮把 `unitPrice` 结果显式转数字） | [ ] |

## 三、🖐 H5：拼团/分享相关（`!x > 0` 条件修正）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 12 | 打开一个拼团商品（shareOrderGoods 页） | 页面正常，无白屏 | [ ] |
| 13 | 检查「待成团人数」提示 | 有剩余人数时显示，为 0 时不显示 | [ ] |

## 四、🖐 H5：评价与订单（index 类型与 splice）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 14 | 我的订单 → 切换各个 Tab（全部/待付款/待发货…） | 切换正常，列表数据正确 | [ ] |
| 15 | 订单列表删除一条订单 | 该条消失，列表索引不错乱 | [ ] |
| 16 | 我的评价 → 切换三个 Tab | 分页/筛选正常 | [ ] |
| 17 | 商品评价列表 → 点击图片预览 | 能打开大图，翻页正常 | [ ] |

## 五、🖐 H5：分销（补的 5 个接口）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 18 | 我的 → 分销中心 → **银行卡管理** | 列表能加载（此前必 `TypeError: getBankCards is not a function`） | [ ] |
| 19 | 添加一张银行卡 → 设为默认 → 删除 | 三步都成功 | [ ] |
| 20 | 分销中心 → **提现申请** | 银行卡下拉能加载 | [ ] |
| 21 | 分销中心 → **钱包流水** | 列表能加载（`getWalletLog` 之前不存在） | [ ] |

> 第 18–21 条是本轮「导入不存在的方法」修复的验证点：修复前这三个页面一进去就报错。

## 六、🖐 H5：IM（WS 指向本地）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 22 | 商品详情 → 联系客服 | 打开 IM 页面（`localhost:8000`），不是线上地址 | [ ] |
| 23 | IM 页面 F12 → Network → WS | 连接 `ws://127.0.0.1:8885/lili/webSocket/<token>`，状态 **101** | [ ] |
| 24 | 发一条消息 | 能发出，服务端 im-api 控制台出现连接日志 | [ ] |
| 25 | （可选）发行构建核对 | 用 HBuilderX 的**发行**再打一次，产物里 IM 地址应变成 `wss://im-api.pickmall.cn`（开发构建是本地） | [ ] |

## 七、📱 微信小程序（条件编译分支）

**前置条件（2026-11-28 起开发构建已切本地后端）**

1. HBuilderX 里 `运行 → 运行到小程序模拟器 → 微信开发者工具`
2. 微信开发者工具 → 右上角「详情 → 本地设置」勾选
   **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**
   （开发构建的接口是 `http://127.0.0.1:8888` / `8885`，不勾选会被域名校验拦住）
3. 后端四个服务要在本机起着：8888 buyer-api、8887 manager-api、8885 im-api、8000 im 前端
4. `发行` 构建仍会自动切回生产域名（`NODE_ENV=production`），不需要改代码

> 校验产物：`apps/uniapp/unpackage/dist/dev/mp-weixin/config/api.js` 里应是
> `http://127.0.0.1:8888`，而不是 `buyer-api.pickmall.cn`。

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 26 | 编译到微信开发者工具 | 编译成功，无 `#ifdef` 相关语法错误 | [ ] |
| 27 | 首页 | 装修楼层渲染；**接口指向 `127.0.0.1:8888`**（Network 面板确认） | [ ] |
| 28 | 登录（`wechatMPLogin` 页） | 微信授权按钮可点、样式正常（本轮从 `v-bind` 对象改回 `:type` 单属性绑定——对象形式 uni 编译器不支持） | [ ] |
| 29 | 微信支付 | 拉起支付面板（`WeixinJSBridge`/`uni.requestPayment` 分支） | [ ] |
| 30 | 分享（`m-share` 组件） | 分享面板弹出，标题/图片正确（本轮修了 `onBackPress` 与 `scene` 类型） | [ ] |
| 31 | 扫码进入（`tpl.ts` 的 `scan()`） | 能拉起相机扫码 | [ ] |
| 32 | 客服消息 / IM | **连 `ws://127.0.0.1:8885`**，可收发（开发构建已切本地） | [ ] |
| 32b | 控制台 | **不再出现 `wx.getSystemInfoSync is deprecated`**（本轮已全部换成 `getDeviceInfo` / `getWindowInfo`） | [ ] |
| 32c | 控制台 | 鸿蒙兼容性提示最多剩 2 条，且都在 `js_sdk/`、`uni_modules/`（第三方，不改） | [ ] |

## 八、📲 App（HTML5+ 原生能力）

> App 端开发构建也走本地（`DEV_HOST = 127.0.0.1`），但 **`127.0.0.1` 在手机上指向手机自身**。
> 真机调试前把 `config/api.ts` 的 `DEV_HOST` 改成电脑的局域网 IP（如 `192.168.1.5`），并确保手机与电脑同网段。

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 33 | 打包/运行到手机 | 启动正常，无白屏 | [ ] |
| 34 | 设置页 → 清理缓存（`setUp.vue` 的 `plus.cache`） | 返回缓存大小并能清理（本轮补了 `Plus.cache` 声明） | [ ] |
| 35 | 权限设置跳转（`add.vue` / `step3.vue`） | 能跳到系统设置页（本轮把 `new Intent` 改成 `new (Intent as any)`，并把平台判断收口到 `utils/platform.ts`；**鸿蒙走 `uni.openAppAuthorizeSetting`**） | [ ] |
| 36 | 退出全屏（`fullScreen.vue` 的 `plus.ios.import`） | iOS 上能退出 | [ ] |
| 37 | 版本更新（`plugins/app-update`） | 能检测到新版本并下载安装（本轮把它裸读的 `platform` 换成 `getPlatform()`，**鸿蒙按 Android 线查版本**） | [ ] |
| 38 | 分享海报（`poster.vue` / `invite.vue`，canvas 2d） | 能生成海报并保存/分享（本轮改了 `fields`/`canvasToTempFilePath` 的调用形状） | [ ] |
| 39 | 直播页（`room.vue`，本轮合并了 `hlsInstance` 声明） | 能播放 HLS 流；App 端用 fallback 实现 | [ ] |
| 39a | 启动全屏引导（`App.vue` 的 `isIos()`，仅 iOS） | iOS 首次启动能进全屏引导页；Android / 鸿蒙不进 | [ ] |
| 39b | IM 聊天输入框（`mine/im/index.vue` 的 `isIos()`） | iOS 键盘弹出时输入框高度扣掉 40，不遮挡；Android 正常 | [ ] |
| 39c | 设置 → 版本信息（`editionIntro.vue`） | iOS 显示 App Store 评分入口、查 `IOS` 版本线；Android / 鸿蒙查 `ANDROID` 线 | [ ] |
| 39d | 设置 → 功能列表（`versionFunctionList.vue`） | 同上：只有 iOS 查 `IOS` 线 | [ ] |

## 九、🤖 工程门禁与自动化（无需手点，跑命令复核即可）

> 最近一次实测（2026-11-28）：typecheck **0 错误**、lint **0 error / 254 warning**、
> 6 个 node 脚本全绿、条件编译全树配平、H5 **128/128** 页面编译通过（附录 A）、
> 微信小程序编译成功（鸿蒙提示仅剩 2 条第三方）。CI 六个 job 全绿（run #39）。

| # | 命令 | 预期 | ✅ |
|---|---|---|:--:|
| 40 | `corepack pnpm --filter @spring-breeze/uniapp typecheck` | **0 错误** | [ ] |
| 41 | `corepack pnpm --filter @spring-breeze/uniapp lint` | 0 error，warning ≤ 254 | [ ] |
| 42 | `corepack pnpm --filter @spring-breeze/uniapp test` | 6 个 node 脚本全绿 | [ ] |
| 43 | 条件编译配平检查 | 每个文件 `#ifdef/#ifndef` 数量 == `#endif` 数量 | [ ] |
| 44 | `git diff` 里 `pages.json` | **零改动**（本轮不碰页面路径） | [ ] |
| 45 | （H5 dev 起着时）`corepack pnpm --filter @spring-breeze/uniapp probe:h5` | **128/128 页面编译通过**（详见附录 A） | [ ] |

## 十、⚠️ 已知非问题（不用处理）

| 现象 | 说明 |
|---|---|
| H5 控制台有 `uview-plus` 的 Vue 开发态告警 | main.js 已用 `warnHandler` 过滤 `enumerating keys`；其余是组件库自身噪音 |
| 小程序端拿不到 `window` / `document` 相关能力 | 条件编译已隔离，属预期 |
| App 端部分原生能力在模拟器不可用 | 用真机验证 |
| H5 从局域网 IP（如 `192.168.x.x:5173`）访问时接口失败 | 浏览器打的是**你自己机器**的 `127.0.0.1`；跨机调试把 `DEV_HOST` 改成局域网 IP（或走 `manifest.json` 的 `h5.devServer.proxy`） |
| 未登录时银行卡/流水页面返回 403 | 需先登录成分销员，属预期 |
| 图片 404（`*.aliyuncs.com` 商品图、`cdn.uviewui.com` 占位图） | 上游示例数据的图片地址已失效，属原项目问题，不影响功能验证 |

---

## 快速回归脚本（复制到 PowerShell）

```powershell
cd <repo-root>

# 1) 静态门禁
corepack pnpm --filter @spring-breeze/uniapp typecheck
corepack pnpm --filter @spring-breeze/uniapp lint
corepack pnpm --filter @spring-breeze/uniapp test

# 2) 本地后端连通性（H5 dev 会打这三个端口）
foreach ($p in 8888, 8887, 8885) {
  "{0} : {1}" -f $p, $(if (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) { 'OK' } else { 'MISSING' })
}

# 3) 首页三条接口（模拟 H5 的 Origin）
$origin = 'http://localhost:5173'
foreach ($u in @(
  'http://127.0.0.1:8888/buyer/common/site/theme',
  'http://127.0.0.1:8888/buyer/common/site/category-page',
  'http://127.0.0.1:8888/buyer/other/pageData/getIndex?clientType=H5'
)) {
  try {
    $r = Invoke-WebRequest -Uri $u -Headers @{ Origin = $origin } -UseBasicParsing -TimeoutSec 8
    "{0} -> {1}  ACAO={2}" -f ($u -replace 'http://127.0.0.1:8888', ''), $r.StatusCode, ($r.Headers['Access-Control-Allow-Origin'] | Select-Object -First 1)
  } catch { "FAIL $u : $($_.Exception.Message)" }
}

# 4) 条件编译配平
$files = Get-ChildItem apps\uniapp -Recurse -File -Include *.vue,*.js,*.ts |
  Where-Object { $_.FullName -notmatch 'node_modules|unpackage|uni_modules|hybrid' }
$bad = @()
foreach ($f in $files) {
  $t = Get-Content $f.FullName -Raw
  $a = ([regex]::Matches($t, '(?m)^\s*(//|<!--)\s*#(ifdef|ifndef)')).Count
  $b = ([regex]::Matches($t, '(?m)^\s*(//|<!--)\s*#endif')).Count
  if ($a -ne $b) { $bad += "$($f.Name): $a vs $b" }
}
if ($bad) { $bad } else { 'ifdef/endif 全部配平' }
```

---

## 附录 A：H5 全页编译探测（2026-11-28 实测）

### A.1 为什么要单独做这一步

| 门禁 | 覆盖 | 不覆盖 |
|---|---|---|
| `typecheck`（vue-tsc） | `.ts` / SFC 脚本块的类型 | 模板表达式、SCSS、easycom 组件解析、资源路径 |
| `lint` | 语法与风格 | 同上 |
| node 测试（6 个） | 少数纯逻辑模块 | 页面级编译 |
| **H5 全页编译探测** | **每个页面模块（连同其 import 的组件与 `.ts`）** | 运行时行为、真实渲染、小程序/App 端 |

HBuilderX 的 H5 dev server 是**按需编译**：请求哪个页面，才编译哪个页面。
所以把 `pages.json` 里的每个页面都请求一遍，等于把整个应用编译一遍 —— 这一步能在
手动冒烟之前，先把「改名/转 TS 造成的编译级断裂」全部暴露出来。

### A.2 做法（可复用脚本）

```bash
# 1) HBuilderX 里「运行 → 运行到浏览器」，或命令行：
cd F:\HBuilderX && cli.exe launch web --project <repo>/apps/uniapp

# 2) 探测全部页面
corepack pnpm --filter @spring-breeze/uniapp probe:h5
# 等价于 node scripts/probe-h5-pages.mjs [http://localhost:5173]
```

脚本会从 `pages.json`（JSONC，已做去注释处理）收集主包 + 8 个分包的页面，
逐个 `fetch` 页面模块：HTTP 200 = 编译通过；500 = 编译失败（打印 Vite 报错摘要）。

### A.3 结果

| 项 | 结果 |
|---|---|
| 页面总数 | **128**（主包 9 + 分包 119） |
| 编译通过 | **128 / 128** |
| dev server 日志报错 | 0 条 |
| 额外抽查 | `verification.vue`、`poster-panel.vue`、`mqtt.ts`、`live-chat.ts`、`tpl.ts`、`popup.ts`、商家端 3 个页面 —— 全部 200 |
| 产物内容抽查 | `cartList.vue` 含 `themeStyle`、`login.vue` 含 `MicroMessenger`、`lottery/index.vue` 含 `wheelLandingRotation`、`loading.ts` 含 `pending`、`store-request.ts` 含 `refreshTokenApi` |

> 说明：编译通过只证明「能构建、import 都能解析」，
> **不证明**渲染正确、交互正确、接口数据正确 —— 下面的手工清单仍需执行。

### A.4 这次探测抓到/排除了什么

- 排除了「25 个文件改名 + 71 个基础设施 `.ts` 转换」造成的 import 断裂（128 个页面全过）
- 排除了上一轮那个 **git 索引大小写漂移**（`App.vue` vs `app.vue`）在 H5 端的影响
- 未覆盖：小程序端条件编译分支（`#ifdef MP-WEIXIN`）、App 端原生能力、真实接口与渲染
---

## 附录 B：小程序端告警修复与「开发构建切本地后端」（2026-11-28）

### B.1 `wx.getSystemInfoSync is deprecated` + 鸿蒙兼容提示

微信开发者工具控制台里两类提示：

```
getSystemInfo API 提示：小程序基础库从 3.7.0 起正式支持 HarmonyOS 平台，
开发者可通过 wx.getDeviceInfo() 判断平台进行兼容处理
wx.getSystemInfoSync is deprecated. Please use wx.getSystemSetting /
wx.getAppAuthorizeSetting / wx.getDeviceInfo / wx.getWindowInfo / wx.getAppBaseInfo instead.
```

**根因**：项目里还有 9 处调用已废弃的 `uni.getSystemInfoSync()` / `wx.getSystemInfoSync()`。

**处理**：按用途逐个换成新 API：

| 用途 | 原调用 | 新 API | 位置 |
|---|---|---|---|
| 窗口宽高、状态栏高度、屏幕宽 | `getSystemInfoSync()` | `uni.getWindowInfo()` | `m-city/m-city.vue`、`verification/verification.vue`、`mine/im/index.vue`、`tabbar/user/my.vue`、`tabbar/category/category.vue` |
| 设备型号 | `getSystemInfoSync().model` | `uni.getDeviceInfo().deviceModel` | `mine/set/securityCenter/{faceLogin,fingerLogin}.vue` |
| 平台名（含 `devtools` 判断） | `wx.getSystemInfoSync().platform` | `uni.getDeviceInfo().platform` | `mine/deposit/withdrawApply.vue` |
| 平台判断（统一收口） | `getSystemInfoSync()` 兜底 | 只用 `getDeviceInfo()` | `utils/platform.ts` |

顺带把 `utils/platform.ts` 里的 `getSystemInfoSync` **兜底分支删掉** —— 只要有这个兜底，
即使平时走的是 `getDeviceInfo()`，打包器仍会保留对废弃 API 的引用，告警照旧。

**结果**：我方代码 0 处 `getSystemInfo*`；鸿蒙兼容提示从 10 条降到 **2 条**，
且都在 `js_sdk/u-draw-poster/utils/global.js` 与 `uni_modules/Sansnn-uQRCode/**`（第三方 verdored，不改）。

### B.2 开发构建切到本地后端

**问题**：`config/api.ts` 里有一段

```ts
// #ifdef MP-WEIXIN || APP-PLUS
api = prod;   // 无条件强制生产
// #endif
```

导致小程序**开发**构建也打生产接口，本地联调无法进行。

**改法**：

```ts
// 只对 App 真机强制生产（127.0.0.1 在手机上指向手机自身）
// #ifdef APP-PLUS
api = prod;
// #endif
```

- 微信小程序：开发构建 → `http://127.0.0.1:8888` / `8885`；发行构建（`NODE_ENV=production`）→ 生产
- H5：开发本地、发行生产（原有逻辑不变）
- App：始终生产（要真机连本地就改 `dev` 段为局域网 IP 并删掉这段）

`config/config.ts` 的 IM 地址同步改为「开发构建且非 App → 本地」：

```ts
const IS_DEV_LOCAL = process.env.NODE_ENV === "development" && PLATFORM !== "app-plus";
```

**验证**（编译产物里直接查字符串）：

```
apps/uniapp/unpackage/dist/dev/mp-weixin/config/api.js
  buyer: "http://127.0.0.1:8888"
  im:    "http://127.0.0.1:8885"
config/config.js
  baseWsUrl = "ws://127.0.0.1:8885/lili/webSocket"
```

### B.3 小程序联调的两个前提

1. 微信开发者工具 → 详情 → 本地设置 → 勾选
   **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**
2. 本机后端起着：`8888` buyer-api、`8887` manager-api、`8885` im-api、`8000` im 前端

### B.4 编译验证

| 平台 | 命令 | 结果 |
|---|---|---|
| H5 | `cli.exe launch web --project <项目> --compile true` | ✅ 编译成功 |
| 微信小程序 | `cli.exe launch mp-weixin --project <项目> --compile true` | ✅ 编译成功；鸿蒙提示 2 条（均为第三方） |
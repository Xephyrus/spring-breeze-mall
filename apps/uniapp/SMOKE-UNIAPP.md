# uniapp 冒烟清单（三端）

> 目标：覆盖本轮改造（TS/Lint 门禁、8 个行为修复、H5 本地联调配置）可能影响的地方。
> **uni-app 的产物只能由 HBuilderX 生成**，所以这份清单是本机唯一能做的运行验证。
>
> 勾选方式：把 `[ ]` 改成 `[x]`。
> 建议顺序：**H5 → 微信小程序 → App**（H5 最快，小程序覆盖条件编译，App 覆盖原生能力）。

## 环境准备

| 项 | 值 |
|---|---|
| H5 dev | HBuilderX 运行到浏览器（默认 `http://localhost:5173`） |
| 微信小程序 | HBuilderX 运行到小程序模拟器（appid `wx32788b91bdb614c0`） |
| App | HBuilderX 运行到手机或模拟器 |
| buyer-api | `http://127.0.0.1:8888`（必须启动） |
| manager-api | `http://127.0.0.1:8887`（店铺/入驻相关页面需要） |
| im-api | `http://127.0.0.1:8885`（客服/聊天相关页面需要） |
| im 前端 | `http://localhost:8000`（IM 页面用 web-view 打开） |

> **改了 `config/api.js` 或 `config/config.js` 之后必须重启 H5 dev** —— 这两个文件在模块加载时求值。

---

## 一、H5：启动与首页（本轮 CORS 修复的直接验证）

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

## 二、H5：购物车与主题（本轮修的两个真实缺陷）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 8 | 商品详情 → 加入购物车 → 打开购物车 | 列表正常，价格/数量正确 | [ ] |
| 9 | **购物车页主题色** | 顶部导航/按钮使用站点主题色（此前 `themeStyle` 未定义导致不生效） | [ ] |
| 10 | 勾选/全选/改数量/删除 | 均正常，合计金额随之变化 | [ ] |
| 11 | 优惠金额那一行 | `优惠减:￥X` 数值正确（本轮把 `unitPrice` 结果显式转数字） | [ ] |

## 三、H5：拼团/分享相关（`!x > 0` 条件修正）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 12 | 打开一个拼团商品（shareOrderGoods 页） | 页面正常，无白屏 | [ ] |
| 13 | 检查「待成团人数」提示 | 有剩余人数时显示，为 0 时不显示 | [ ] |

## 四、H5：评价与订单（本轮改了 index 类型与 splice）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 14 | 我的订单 → 切换各个 Tab（全部/待付款/待发货…） | 切换正常，列表数据正确 | [ ] |
| 15 | 订单列表删除一条订单 | 该条消失，列表索引不错乱 | [ ] |
| 16 | 我的评价 → 切换三个 Tab | 分页/筛选正常 | [ ] |
| 17 | 商品评价列表 → 点击图片预览 | 能打开大图，翻页正常 | [ ] |

## 五、H5：分销（本轮补的 5 个接口）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 18 | 我的 → 分销中心 → **银行卡管理** | 列表能加载（此前必 `TypeError: getBankCards is not a function`） | [ ] |
| 19 | 添加一张银行卡 → 设为默认 → 删除 | 三步都成功 | [ ] |
| 20 | 分销中心 → **提现申请** | 银行卡下拉能加载 | [ ] |
| 21 | 分销中心 → **钱包流水** | 列表能加载（`getWalletLog` 之前不存在） | [ ] |

> 第 18–21 条是本轮「导入不存在的方法」修复的验证点：修复前这三个页面一进去就报错。

## 六、H5：IM（本轮把 WS 指向本地）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 22 | 商品详情 → 联系客服 | 打开 IM 页面（`localhost:8000`），不是线上地址 | [ ] |
| 23 | IM 页面 F12 → Network → WS | 连接 `ws://127.0.0.1:8885/lili/webSocket/<token>`，状态 **101** | [ ] |
| 24 | 发一条消息 | 能发出，服务端 im-api 控制台出现连接日志 | [ ] |
| 25 | App / 小程序端同一入口 | 仍连**生产** IM（`wss://im-api.pickmall.cn`）—— 确认条件没写反 | [ ] |

## 七、微信小程序（条件编译分支）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 26 | 编译到微信开发者工具 | 编译成功，无 `#ifdef` 相关语法错误 | [ ] |
| 27 | 首页 | 装修楼层渲染；接口指向生产域名 | [ ] |
| 28 | 登录（`wechatMPLogin` 页） | 微信授权按钮可点（本轮把 `<button type="primary">` 改成 `v-bind` 对象） | [ ] |
| 29 | 微信支付 | 拉起支付面板（`WeixinJSBridge`/`uni.requestPayment` 分支） | [ ] |
| 30 | 分享（`m-share` 组件） | 分享面板弹出，标题/图片正确（本轮修了 `onBackPress` 与 `scene` 类型） | [ ] |
| 31 | 扫码进入（`tpl.js` 的 `scan()`） | 能拉起相机扫码 | [ ] |
| 32 | 客服消息 / IM | 连生产 IM，可收发 | [ ] |

## 八、App（HTML5+ 原生能力）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 33 | 打包/运行到手机 | 启动正常，无白屏 | [ ] |
| 34 | 设置页 → 清理缓存（`setUp.vue` 的 `plus.cache`） | 返回缓存大小并能清理（本轮补了 `Plus.cache` 声明） | [ ] |
| 35 | 权限设置跳转（`add.vue` / `step3.vue` 的 `plus.android.importClass`） | 能跳到系统设置页（本轮把 `new Intent` 改成 `new (Intent as any)`） | [ ] |
| 36 | 退出全屏（`fullScreen.vue` 的 `plus.ios.import`） | iOS 上能退出 | [ ] |
| 37 | 版本更新（`plugins/app-update`） | 能检测到新版本并下载安装 | [ ] |
| 38 | 分享海报（`poster.vue` / `invite.vue`，canvas 2d） | 能生成海报并保存/分享（本轮改了 `fields`/`canvasToTempFilePath` 的调用形状） | [ ] |
| 39 | 直播页（`room.vue`，本轮合并了 `hlsInstance` 声明） | 能播放 HLS 流；App 端用 fallback 实现 | [ ] |

## 九、工程门禁（提交前必跑，CI 已接入）

| # | 命令 | 预期 | ✅ |
|---|---|---|:--:|
| 40 | `corepack pnpm --filter @spring-breeze/uniapp typecheck` | **0 错误** | [ ] |
| 41 | `corepack pnpm --filter @spring-breeze/uniapp lint` | 0 error，warning ≤ 261 | [ ] |
| 42 | `corepack pnpm --filter @spring-breeze/uniapp test` | 5 个 node 脚本全绿 | [ ] |
| 43 | 条件编译配平检查 | 每个文件 `#ifdef/#ifndef` 数量 == `#endif` 数量 | [ ] |
| 44 | `git diff` 里 `pages.json` | **零改动**（本轮不碰页面路径） | [ ] |

## 十、已知限制（不算失败）

| 现象 | 说明 |
|---|---|
| H5 控制台有 `uview-plus` 的 Vue 开发态告警 | main.js 已用 `warnHandler` 过滤 `enumerating keys`；其余是组件库自身噪音 |
| 小程序端拿不到 `window` / `document` 相关能力 | 条件编译已隔离，属预期 |
| App 端部分原生能力在模拟器不可用 | 用真机验证 |
| H5 从局域网 IP（如 `192.168.x.x:5173`）访问时接口失败 | 浏览器打的是**你自己机器**的 `127.0.0.1`；跨机调试要用 `manifest.json` 的 `h5.devServer.proxy` 走同源代理 |
| 未登录时银行卡/流水页面返回 403 | 需先登录成分销员，属预期 |

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

# buyer 冒烟清单

> 目标：覆盖本轮迁移（vue-cli → Vite、全量 TS、kebab 命名、`global.scss` 拆分）可能破坏的地方。
> 勾选方式：把 `[ ]` 改成 `[x]`。

## 环境

| 服务 | 端口 | 启动方式 |
|---|---|---|
| buyer 前端 | **10000** | `corepack pnpm --filter @spring-breeze/buyer dev` |
| buyer-api | 8888 | `cd backend && java -jar buyer-api/target/buyer-api-5.0.2.jar --spring.profiles.active=dev` |
| manager-api（可选，发货/后台联动） | 8887 | 同上 |
| MySQL / Redis | 3306 / 6379 | 本地 |

> `public/config.js` 里的 `BASE.API_DEV.buyer` 必须指向运行中的 buyer-api（默认 `http://127.0.0.1:8888`）。

---

## 一、启动与骨架（Vite 迁移 + 入口改 .ts）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 1 | 打开 `http://localhost:10000/` | 首页渲染完成，无白屏 | [ ] |
| 2 | F12 Console | 无报错；无 `Failed to resolve component` | [ ] |
| 3 | Network 里 `main.ts` | 200（`index.html` 入口已是 `/src/main.ts`） | [ ] |
| 4 | Network 里 `config.js` | 200，且 `window.BASE` 有 `API_DEV` / `API_PROD` | [ ] |
| 5 | 访问不存在的路径（如 `/abc/def`） | 显示 404 页 | [ ] |
| 6 | 浏览器标签标题 | 显示站点名（`config.title`，可由 Cookie `siteName` 覆盖） | [ ] |

## 二、样式（`global.scss` 拆分是本轮唯一可能造成视觉回归的改动）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 7 | 首页整体排版 | 与迁移前一致，无错位/无裸样式 | [ ] |
| 8 | 商品列表卡片标题超两行 | 出现省略号（`.wes-2` 生效） | [ ] |
| 9 | 主题色按钮 / 价格文字 | 显示主题色（`$theme_color` → `--theme-color`） | [ ] |
| 10 | 切换主题（若站点配置了不同主题色） | 颜色随之变化，刷新后保持 | [ ] |
| 11 | 宽屏下内容区宽度 | 1200/800 等宽度类生效（`.width_1200`） | [ ] |
| 12 | 清除浮动区块 | 无高度塌陷（`.clearfix::after`） | [ ] |
| 13 | 深色主题（如可切换） | `[data-theme="dark"]` 相关样式生效 | [ ] |

> 第 8–12 条对应用户能直接看到的全局类。若某条失效，说明 `main.ts` 没有引入 `global.scss`。

## 三、路由（kebab 改名后重点）

| # | 路径 | 预期 | ✅ |
|---|---|---|:--:|
| 14 | `/` | 首页 | [ ] |
| 15 | `/home` | 会员中心首页 | [ ] |
| 16 | `/login` | 登录页 | [ ] |
| 17 | `/goodsList` | 商品列表（URL 保持 PascalCase，本轮**未改动**路由 path） | [ ] |
| 18 | `/goodsDetail`（带 `?goodsId=&skuId=`） | 商品详情，规格/价格/库存正常 | [ ] |
| 19 | `/cart` | 购物车 | [ ] |
| 20 | `/shoppingCart` | 购物车（另一入口） | [ ] |
| 21 | `/merchant`（带 `?id=`） | 店铺页 | [ ] |
| 22 | `/shopEntry` | 店铺入驻：`first-apply` / `second-apply` / `third-apply` 三个子步骤都能渲染 | [ ] |
| 23 | `/pointMall` | 积分商城 | [ ] |
| 24 | `/MyOrder` | 我的订单（登录后） | [ ] |
| 25 | 会员中心左侧菜单逐项点击 | 每一项都能打开（`pages/user/menu.ts`） | [ ] |

> 路由 `path` / `name` 刻意保持原样：URL 属对外行为，改名会影响外链与分享链接。

## 四、装修楼层（`index-decorate` 目录整体改名）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 26 | 首页楼层逐个滚动查看 | 轮播、品牌墙、热区、商品网格、优惠券、公告等**全部渲染** | [ ] |
| 27 | 商品楼层点击商品 | 跳转商品详情 | [ ] |
| 28 | 视频楼层 | 视频可播放 | [ ] |
| 29 | 后台改装修后刷新前台 | 新装修生效（楼层数据驱动） | [ ] |

> 22 个楼层组件全部位于改名后的 `components/index-decorate/`，由 `registry.ts` 的
> `COMPONENT_MAP` 按 `type` 解析。若有楼层空白，先查该文件里的映射。

## 五、交易主链路（api 层全量 TS 化）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 30 | 登录（账号密码 / 短信） | 成功，右上角显示昵称 | [ ] |
| 31 | 加入购物车 → 购物车列表 | 数量与价格正确，勾选/全选/改数量正常 | [ ] |
| 32 | 结算页 → 选择地址 → 提交订单 | 生成订单号并跳收银台 | [ ] |
| 33 | 支付（可用「货到付款」或测试支付） | 订单状态变更 | [ ] |
| 34 | 订单列表 / 详情 / 物流 | 数据正确，物流轨迹可展开 | [ ] |
| 35 | 申请售后 → 售后列表 | 流程可走通 | [ ] |
| 36 | 卡密商品（E_COUPON）详情与订单 | 卡密区正常展示（`constants/goodsType.ts`） | [ ] |
| 37 | 提货卡兑换 / 积分兑券 | 可用（`api/pickupCard` / `api/pointsCoupon`） | [ ] |
| 38 | token 过期后操作受保护接口 | 自动刷新 token 或引导登录（`plugins/request.ts`） | [ ] |

## 六、其他功能

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 39 | 搜索框输入关键词 | 联想词下拉（`SearchSuggest`） | [ ] |
| 40 | 商品评价列表 / 添加评价 | 正常 | [ ] |
| 41 | 收货地址增删改 | 正常 | [ ] |
| 42 | 个人资料 / 修改密码 | 正常（`md5.ts` 加密路径） | [ ] |
| 43 | 消息中心 / 未读角标 | 显示未读数（`utils/unreadMessage.ts`） | [ ] |
| 44 | 图形验证码（登录） | 拼图可拖动并校验（`components/verify`） | [ ] |
| 45 | 地图定位（若配置了 `BASE.MAP.aMapKey`） | 地图加载；未配置时功能隐藏但不报错 | [ ] |

## 七、工程门禁（提交前必跑）

| # | 命令 | 预期 | ✅ |
|---|---|---|:--:|
| 46 | `corepack pnpm --filter @spring-breeze/buyer typecheck` | 0 错误 | [ ] |
| 47 | `corepack pnpm --filter @spring-breeze/buyer lint` | 0 error / 0 warning（`--max-warnings 0`） | [ ] |
| 48 | `corepack pnpm --filter @spring-breeze/buyer build` | 成功 | [ ] |
| 49 | 检查 `dist` 下 CSS 合计 | ≈ 579 KB（若显著变大，检查 `global.scss` 是否被重复注入） | [ ] |
| 50 | 检查 `dist` 下是否只有一个 chunk 含 `.wes-2` | 只出现 1 次（重复说明拆分被回退） | [ ] |
| 51 | `apps/buyer/src` 下 `*.js` | 只有 `components/index-decorate/presets/double11Preset.js`（纯数据豁免） | [ ] |
| 52 | `apps/buyer/src` 下 `.vue` / 目录命名 | 除 `App.vue` 外全部 kebab-case | [ ] |

## 八、已知差异与限制（不算失败）

| 现象 | 说明 |
|---|---|
| 开发环境请求失败时仍弹 Vite 遮罩 | vue-cli 的 `runtimeErrors` 过滤在 Vite 无等价配置，只影响开发体验 |
| 子路径部署时 `config.js` / `logo.ico` 404 | `index.html` 里写的是绝对路径 `/config.js`，设置 `VUE_APP_PUBLIC_PATH` 时需一并处理 |
| 地图功能不显示 | `public/config.js` 的 `BASE.MAP.aMapKey` 未配置 |

---

## 快速回归脚本（复制到 PowerShell）

```powershell
cd F:\yibase\mall\spring-breeze-mall

# 1) 静态门禁
corepack pnpm --filter @spring-breeze/buyer typecheck
corepack pnpm --filter @spring-breeze/buyer lint
corepack pnpm --filter @spring-breeze/buyer build

# 2) 产物 CSS 体检（应≈579 KB；显著变大说明 global.scss 被重复注入）
$css = (Get-ChildItem apps\buyer\dist -Recurse -Filter *.css | ForEach-Object { $_.Length } | Measure-Object -Sum).Sum
"CSS 合计: {0:N0} KB" -f ($css / 1KB)
$all = (Get-ChildItem apps\buyer\dist -Recurse -Filter *.css | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"
"`.wes-2 出现次数: " + ([regex]::Matches($all, [regex]::Escape('.wes-2'))).Count

# 3) 命名与 JS 残留
"非 kebab .vue: " + (Get-ChildItem apps\buyer\src -Recurse -Filter *.vue |
  Where-Object { $_.BaseName -cmatch '[A-Z]' -and $_.Name -ne 'App.vue' } | Measure-Object).Count
"非 kebab 目录: " + (Get-ChildItem apps\buyer\src -Recurse -Directory |
  Where-Object { $_.Name -cmatch '[A-Z]' } | Measure-Object).Count
"残留 .js: " + (Get-ChildItem apps\buyer\src -Recurse -Filter *.js | Measure-Object).Count
```

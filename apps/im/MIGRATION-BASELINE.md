# im（客服/聊天端）迁移基线与计划

> 记录时间：2026-11-28
> 前置：manager 已完成（Vite + TS + kebab + 告警 0），seller 已完成（同上）。
> 本文是 im 的**迁移前基线**与**分阶段计划**，尚未开始改动代码。

## 1. 现状

| 项 | 值 |
|---|---|
| 包名 | `@spring-breeze/im` 0.1.0 |
| 构建 | `@vue/cli-service` 5（webpack）+ babel |
| Vue | 3.5（**53 个 `.vue` 全部是 `<script setup>`**，无 Options API） |
| UI | element-plus 2.14.1（**未配按需引入**） |
| 状态 | pinia |
| 语言 | 纯 JS（只有 `jsconfig.json`，无 TS） |
| 样式 | **Less**：5 个 `.less` + **50 个 `.vue` 带 `lang="less"`**，靠 `style-resources-loader` 注入 `src/assets/css/variable.less` |
| dev 端口 | **8000** |
| lint | **无配置**（`lint` 脚本是 `vue-cli-service lint`，等同没有规则） |
| 后端 | `im-api` 8885（HTTP） + **WebSocket `ws://127.0.0.1:8885/lili/webSocket`** |
| 运行时配置 | `.env.development` 的 `VUE_APP_*`（API / WS / 商城各端地址） |

## 2. 规模

| 目录 | 文件 | 行数 |
|---|---:|---:|
| `components` | 51 | 9,733 |
| `utils` | 11 | 1,463 |
| `stores` | 8 | 544 |
| `api` | 7 | 319 |
| `router` | 3 | 114 |
| `views` | 3 | 1,563 |
| **合计（src）** | **83** | **≈16,100**（含 less/常量） |

## 3. 与 manager / seller 的关键差异（决定迁移策略）

| 差异 | 影响 |
|---|---|
| **无后端菜单驱动** | 路由是静态的 `router/{index,contacts,settings}.js`（114 行）。kebab 命名**不需要同步数据库**，风险最低 |
| **WebSocket 实时通讯** | 迁移后必须验证连接、断线重连、消息收发（不能用「构建通过」当验收） |
| **Less 重度使用** | 50 个 SFC 用 `lang="less"` + 内联 Less 变量（`@border`、`@bg-left-color` 等）+ 全局 `variable.less` 注入 |
| **未配 element-plus 按需** | 仍全量引入，迁移时可顺带按 manager/seller 的做法改按需 |
| **无 lint 配置** | 需要新建 flat config + ratchet（从「无规则」起步） |
| **VUE_APP_ 环境变量** | Vite 用 `envPrefix: 'VUE_APP_'` 可保留前缀，但代码里的 `process.env.X` 必须改成 `import.meta.env.X` |

## 4. 决策（写下来避免反复）

| # | 决策 | 理由 |
|---|---|---|
| 1 | **im 保留 Less，不转 SCSS** | 50 个 SFC 的 Less 变量是内联声明（`@border: 1px solid`），转 SCSS 要把 `@` 改 `$` 且处理 `~` 引入与 mixin，属纯风险无收益；Vite 原生支持 Less。**与 seller 的去 Less 不冲突**（seller 只有 1 个 15 行文件） |
| 2 | kebab 命名只改**文件名与静态路由**，无 DB 参与 | im 路由不落库 |
| 3 | 环境变量保留 `VUE_APP_` 前缀（`envPrefix`），代码改 `import.meta.env` | 部署脚本/CI 无需重命名变量 |
| 4 | 保持 `.env.development` 文件形态，迁移到 Vite 的 `.env.development`（同名可直接用） | 零改动 |
| 5 | 先 Vite 再 TS（与 seller 同序） | 构建先稳住，类型化才能小步验证 |

## 5. 分阶段计划

### M0 · 准备（0.5 个会话）
- 记录基线（本文）
- `element-plus` 统一到 `catalog:`，与 manager/seller 同版本
- 确认 `im-api`（8885）与 WebSocket 在本地可用（迁移期间需要对照）

### M1 · 构建迁移 Vue CLI → Vite（1–2 个会话）
| vue.config.js 现状 | Vite 对应 |
|---|---|
| `publicPath: VUE_APP_PUBLIC_PATH` | `base: env.VUE_APP_PUBLIC_PATH` |
| `devServer.port = 8000` | `server.port` |
| `style-resources-loader` 注入 `variable.less` | `css.preprocessorOptions.less.additionalData` |
| `less.javascriptEnabled` | `less: { javascriptEnabled: true }`（Vite 的 less 选项） |
| `<%= BASE_URL %>` / `cdn.js` 模板 | 静态 `index.html`（去掉 cdn 循环） |
| `configureWebpack` 分包 | `build.rolldownOptions.output.codeSplitting` |
| — | 新增 `unplugin-vue-components` + `ElementPlusResolver`（按需） |

同时：`process.env.VUE_APP_*` → `import.meta.env.VUE_APP_*`（`src/config/config.js` 等）。
**验收**：`build` 通过 + dev server 起在 8000 + **能连上 WebSocket 收发一条消息**。

### M2 · TypeScript 渐进引入（4–6 个会话）
顺序：`api`（7 个文件）→ `stores`（8 个）→ `utils`（11 个）→ `router` → `components` 按目录批（51 个）。
- 新增 `tsconfig.{json,app.json,node.json}`、`env.d.ts`
- 每批跑 `vue-tsc`，先 `allowJs: true` 过渡，最后关闭

### M3 · 命名统一 kebab（1 个会话）
- 文件名（`TalkPanel.vue` → `talk-panel.vue` 等）+ 静态路由 `path`/`name`
- 无数据库改动；校验方式：`router` 里的 `component: () => import(...)` 全部可解析

### M4 · 复用落地（1–2 个会话）
- 消费 `packages/shared`：`http` 工厂（改造现有 axios 实例）、`storage`、`utils`
- 统一分页/列表组件：im 列表型页面少，按需引入 `<TablePager>` 即可

### M5 · 质量门 + CI（1 个会话）
- 新建 `eslint.config.js`（与 manager/seller 同构）+ 首测告警数写 ratchet
- `.github/workflows/ci.yml` 增加 `im` job

### M6 · 回归清单 + 文档（1 个会话）
- `apps/im/SMOKE-IM.md`：连接（ws 建连/断线重连）、会话列表、消息收发（文本/图片/语音/表情）、
  已读回执、群聊、联系人、设置、消息搜索、多窗口（如有）
- 更新根 README（技术栈表 + 文档索引）

**合计约 9–13 个会话**（im 体量是 seller 的 19%，但 WebSocket 回归成本更高）。

## 6. 风险与对策

| 风险 | 对策 |
|---|---|
| WebSocket 在建连后断线，Vite HMR 下表现不同 | 迁移后优先验证：刷新、断网重连、切页保持连接 |
| Less `javascriptEnabled` 在 Vite 里需显式开启 | `css.preprocessorOptions.less.javascriptEnabled = true` |
| `variable.less` 注入路径 | 用 `additionalData` 绝对路径注入，注意不要重复注入自身 |
| im-api 与 WebSocket 都在 8885 | dev proxy 只配 HTTP（`/lili`），ws 直连（`ws://` 已在 env 里） |
| 无 lint 起点，告警数可能很大 | 首测后写 ratchet，分批清（参考 seller 58 → 0 的经验） |
| 文件重命名影响动态组件 `<component :is>` | im 有大量 `:is` 动态组件，改名时只改文件名与 import，**不动组件 `name`** |

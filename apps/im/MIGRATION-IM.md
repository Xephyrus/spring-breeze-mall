# im 迁移记录

> 计划与基线见 [`MIGRATION-BASELINE.md`](./MIGRATION-BASELINE.md)。

---

## M1 · 构建迁移 Vue CLI → Vite（✅ 2026-11-28）

### 新增

| 文件 | 说明 |
|---|---|
| `vite.config.ts` | 端口 8000、`envPrefix: "VUE_APP_"`、Less 全局变量注入、svg 雪碧图、生产 gzip、element-plus/vue 分包 |
| `index.html` | 静态模板（去掉 `<%= %>` 与 cdn 循环），保留首屏 loading 与两个外链 CSS（iconfont / animate.css） |
| `eslint.config.js` | 新建 flat config（此前只有 package.json 里的 `eslintConfig`，等同无规则） |

### 修改

| 文件 | 改动 |
|---|---|
| `package.json` | scripts 改 `vite`；依赖统一 `catalog:`；移除 `@vue/cli-*` / `babel` / `webpack` / `core-js` / `svg-sprite-loader` / `style-resources-loader`；新增 `vite`、`@vitejs/plugin-vue`、`vite-plugin-compression`、`vite-plugin-svg-icons`、`eslint`(9) |
| `src/config/config.js`、`src/stores/app.js` | `process.env.VUE_APP_*` → `import.meta.env.VUE_APP_*`（8 处） |
| `src/main.js` | 去掉 `import "core-js/stable"`（Vite 不再需要 babel 垫片）；新增 `import "virtual:svg-icons-register"` |
| `src/icons/index.js` | `require.context("./svg", ...)` → 交给 `vite-plugin-svg-icons`（symbolId 仍为 `icon-[name]`） |
| **12 处 `~@/` 前缀** | webpack 的 `~` 前缀 Vite 不认：Less `@import`、`<img src>`、`url()` 全部改为 `@/`（6 个文件） |

### 删除

`vue.config.js`、`babel.config.js`、`jsconfig.json`

### 顺带修掉的 5 个真实缺陷（lint 首次运行暴露）

| 位置 | 问题 | 修法 |
|---|---|---|
| `goodsLink.vue:113` | `content: content` —— **变量不存在**，发送商品卡片且当前不在底部时会抛 `ReferenceError`，未读数更新直接失败 | 改为 `content: context`（同函数里 `text: context` 用的就是它） |
| `TalkSearchRecord.vue`、`InviteMessage.vue`、`VoteMessage.vue`×2、`MeEditorVote.vue` | `v-for` 缺 `:key`（Vue 3 下会告警且复用节点可能错乱） | 用稳定字段（`tab.type`、`user.id`、`option.value`）作 key；`VoteMessage` 顺带删掉未使用的 `index` |

### 验证结果

| 项 | 结果 |
|---|---|
| `pnpm --filter @spring-breeze/im build` | ✅ 4.10s，25 文件 / 2.66 MB |
| svg 雪碧图 | ✅ `icon-not-data` / `icon-mention-down` 已内联进产物 |
| dev server | ✅ `http://127.0.0.1:8000/` HTTP 200 |
| `eslint src` | ✅ 0 error / **249 warning**（ratchet 基线，之前是 257，修完上面 8 个 error 后下降） |
| 入口 HTML | ✅ 无 `<%` 模板残留 |

### WebSocket 验证的边界（重要）

| 已验证 | 结果 |
|---|---|
| 后端端点定义 | `@ServerEndpoint("/lili/webSocket/{accessToken}")`（`WebSocketServer.java:35`） |
| `im-api` 能启动并监听 8885 | ✅ 启动日志 `Started ImApiApplication in 35.3s` |
| 用**假 token** 握手 | ❌ 超时（端点对无效 token 直接拒绝，**属预期行为**，不是迁移回归） |

**未能完成的端到端验证**：连接 → 收发消息需要**真实 accessToken**。
本环境下 `buyer-api`（8888）的 `/buyer/passport/login` 返回 **403**（后端安全过滤拦截，与本次迁移无关），
因此拿不到 token。

→ 这一项改为**手工验收**，已写进 `SMOKE-IM.md` 待办：
用真实账号登录后，在浏览器 Network → WS 面板确认
① 握手 101 ② 发送一条文本消息 ③ 对方能收到 ④ 断网重连后仍可发。

> 已停掉为验证而启动的 `im-api` 进程，未在环境里遗留后台服务。

---

## M1.5 · WebSocket 实测与「疯狂重连」修复（✅ 2026-11-28）

### 一、前端：重连风暴的原因与修复

上游 `plugins/ws-socket.js` 的重连实现有四个叠加问题：

| # | 问题 | 后果 |
|---|---|---|
| 1 | 重连**固定 1s 间隔**，无退避 | 后端一拒就连，连了又拒 |
| 2 | 每次重连都 `ElNotification({ duration: 0 })` **新建常驻通知**，从不关闭 | 屏幕上堆出一片红框，就是「疯狂短线重连」的观感 |
| 3 | `retryCount` 上限 **1000 次** | 可持续空转近 17 分钟 |
| 4 | `onClose` 里 `this.events.onClose(evt)` **被注释掉** | 上层 `updateSocketStatus(false)` 永不触发，UI 一直显示「已连接」，与真实状态不符 |

修复后（`apps/im/src/plugins/ws-socket.js` 重写）：

- **指数退避**：1s → 2s → 4s … 上限 30s
- **通知单例**：全局只保留一个掉线提示，重连成功立即关闭，并显示「第 N/12 次重试」
- **重试上限 12 次**：超限弹一次可操作提示（「刷新页面」/「继续等待」），不再空转 1000 次
- **正确区分主动关闭**：`close()` 置 `manualClosed`，主动断开不再触发重连
- **`onClose` 回调恢复调用**，连接状态与 UI 一致
- 重建连接前先摘掉 `onclose` 监听，避免「主动关闭 → 触发重连」的自激循环

### 二、后端：握手返回 HTTP 400（**迁移之前就存在**）

用真实 token（商家端 `13011111111` 登录所得）做握手实测：

| 请求 | 结果 |
|---|---|
| `GET /lili/webSocket/<token>` + 标准 WS 头 | **HTTP 400**（Spring 的 JSON 错误体） |
| `GET /lili/webSocket/abc`（假 token） | HTTP 400（同上，与 token 无关） |
| `GET /lili/webSocket/abc/`（多尾斜杠） | HTTP 400 |
| `GET /lili/webSocketX/abc`（不存在的前缀） | HTTP 404 |
| `GET /actuator/health` + WS 头 | HTTP 200（actuator 正常） |

**已排除的因素**

| 排查项 | 结论 |
|---|---|
| 端点是否注册 | ✅ 已注册（`--logging.level.org.springframework.web.socket=DEBUG` 打出 `Registering @ServerEndpoint class:`） |
| 依赖是否缺失 | ✅ `tomcat-embed-websocket-11.0.20` / `spring-boot-websocket-4.0.5` 均在 jar 内 |
| token 是否有效 | ✅ Redis 里有 `{ACCESS_TOKEN_STORE}_<memberId>_<token>` 会话 |
| 安全拦截 | ✅ `ImSecurityConfig` 已 `permitAll("/lili/webSocket/**")`，且 403 不符（返回的是 400） |
| im-api 自身健康 | ✅ 启动无异常；修好工作目录后 MySQL/Redis 均正常（之前的 `Access denied` 是因为我最初从仓库根目录启动，`./local-secrets.yml` 没被加载） |

**推论**：请求被「能匹配 `/lili/webSocket/*` 的组件」以 400 拒绝，且未进到 `@ServerEndpoint`（否则应先返回 101 再断开）。属于**升级握手层**问题（Tomcat `WsFilter` / Spring Boot 4 的 WebSocket 升级链路），与本轮前端迁移无关。

**建议的下一步排查**（需要后端一次专门的会话）：

1. 以 `--logging.level.org.apache.tomcat.websocket=TRACE --logging.level.org.springframework.web.socket.server=TRACE` 启动，观察是否有 `WsFilter` / `UpgradeUtil` 日志；
2. 若确认 `WsFilter` 未生效，考虑显式注册 `WsFilter` 或改用 Spring 的 `WebSocketHandler` + `WebSocketHandlerRegistry`（不依赖 `ServerEndpointExporter`）；
3. 用最小 Spring Boot 4 + `@ServerEndpoint` 样例验证该组合是否可用，再回填到 im-api。

---

### 三、TRACE 级别的第二轮定位（关键证据）

按上面的第 1 步做了实测（`--logging.level.org.apache.tomcat.websocket=TRACE`，
`org.springframework.security=DEBUG`），一次握手的完整日志是：

```
FilterChainProxy : Securing GET /lili/webSocket/abc
AnonymousAuthenticationFilter : Set SecurityContextHolder to anonymous SecurityContext
FilterChainProxy : Secured GET /lili/webSocket/abc
FilterChainProxy : Securing GET /error          ← 随后转 /error，说明下游抛了错误
```

**没有任何 `org.apache.tomcat.websocket` / `WsFilter` / `UpgradeUtil` 日志**，说明
Tomcat 的 WebSocket 升级过滤器**不在过滤器链里**（只有启动时 `ServerEndpointExporter` 的
`Registering @ServerEndpoint class:` 一行）。

对照实验（同一时刻、仅改路径或头）：

| 请求 | 结果 | 说明 |
|---|---|---|
| `/im/xxx` + WS 头 | **403** | 安全链生效（该路径需登录） |
| `/lili/other` + WS 头 | 404 | 不在 `securityMatcher` 内，走普通链 → MVC 无映射 |
| `/lili/webSocket/abc` **不带** WS 头 | 404 | MVC 无映射 |
| `/lili/webSocket/abc` **带** WS 头 | **400** | 只有带升级头才 400 |

结论收敛为：**请求 `permitAll` 通过了安全链，但没有走到 Tomcat 的 WS 升级处理，
而是在「安全链之后、MVC 之前」被以 400 拒绝**；而 Tomcat 的 `WsFilter` 全程无日志，
说明它根本没被注册进链。

**因此这不是前端问题，也不是 token 问题**，而是后端 `im-api` 的 **JSR-356 升级通道未生效**。

**修复方向（供后续后端专项）**，按性价比排序：

1. **改用 Spring 原生方式**：把 `@ServerEndpoint` 换成 `WebSocketHandler` +
   `WebSocketHandlerRegistry.addHandler(...).setAllowedOrigins("*")`，
   不依赖 `ServerEndpointExporter` / Tomcat `WsFilter`（改动集中在 `WebSocketServer` 与一个 `@Configuration`）；
2. 保留 JSR-356，但**显式注册 `WsFilter`**（`FilterRegistrationBean<WsFilter>` 映射 `/*`），验证 101 是否恢复；
3. 检查 `WsSci`（`ServletContainerInitializer`）是否被排除（`tomcat-embed-websocket` 在 jar 内，
   `WsFilter.class` 存在，但未进链，属可疑点）。

> 本轮已完成：前端「疯狂重连」修复 + 后端 400 的精确定位（安全链之后、Tomcat WS 升级之前）。
> 后端修复需要改 `im-api` 的 WebSocket 注册方式，属独立任务，未在本轮改动。

> 结论：**前端不再「疯狂重连」**（退避 + 单条提示 + 上限 12 次）；**WS 仍连不上是后端握手返回 400**，需后端单独修。

---

## 待办

| 里程碑 | 内容 |
|---|---|
| M2 | TS 渐进引入：`api` → `stores` → `utils` → `router` → `components` 按目录批 |
| M3 | 文件名与静态路由 kebab（**无数据库参与**） |
| M4 | 消费 `packages/shared`；element-plus 改按需引入 |
| M5 | 告警 249 → 0，ratchet 收紧；CI 增加 im job |
| M6 | `SMOKE-IM.md`（含上面的 WebSocket 手工验收步骤）+ README 更新 |

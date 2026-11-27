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

## 待办

| 里程碑 | 内容 |
|---|---|
| M2 | TS 渐进引入：`api` → `stores` → `utils` → `router` → `components` 按目录批 |
| M3 | 文件名与静态路由 kebab（**无数据库参与**） |
| M4 | 消费 `packages/shared`；element-plus 改按需引入 |
| M5 | 告警 249 → 0，ratchet 收紧；CI 增加 im job |
| M6 | `SMOKE-IM.md`（含上面的 WebSocket 手工验收步骤）+ README 更新 |

# Spring Breeze Mall

![CI](https://github.com/Xephyrus/spring-breeze-mall/actions/workflows/ci.yml/badge.svg)

基于 [Lilishop](https://github.com/lilishop/lilishop) 深度二次开发的开源商城系统 monorepo：**Java 后端 + Vue 管理/商家/买家/IM 前端 + uni-app 移动端**。

本仓库在原始项目基础上完成了 **Vue 3 全量迁移、TypeScript 类型化、性能优化与命名规范统一**，
并修复了大量设置读取的空指针、菜单/路由一致性等问题，可直接用于二次开发。

---

## 目录

- [功能概览](#功能概览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [Docker（可选）](#docker可选)
- [数据库初始化](#数据库初始化)
- [开发命令](#开发命令)
- [开发规范](#开发规范)
- [文档索引](#文档索引)
- [安全提醒](#安全提醒)
- [许可](#许可)

---

## 功能概览

| 端 | 说明 | 状态 |
|---|---|---|
| **manager** 平台运营端 | 商品、订单、会员、营销、分销、直播、装修、统计、系统设置 | ✅ Vue 3 + TS 全量 |
| **seller** 商家端 | 商家入驻、商品、订单、结算 | ✅ Vite 8 + TypeScript |
| **buyer** PC 买家端 | 商城前台 | Vue CLI（待迁移） |
| **im** 客服端 | 在线客服、实时会话 | ✅ Vite 8（TS 迁移中） |
| **uniapp** 移动端 | 小程序 / H5 | uni-app |

---

## 技术栈

| 层 | 选型 |
|---|---|
| 后端 | JDK 25 · Spring Boot · MyBatis-Plus · Maven（`backend/mvnw`） |
| 前端（manager） | Vue 3.5 · TypeScript 5.9 · Vite 8 · Element Plus 2.14 · SCSS |
| 前端（其余） | Vue CLI · Less（计划逐步迁移到 Vite + TS） |
| 包管理 | pnpm 12（workspace + catalog 统一版本） |
| 中间件 | MySQL 9.7 · Redis 8 · Elasticsearch（可选，IK 分词） |
| 富文本 | TinyMCE 6.4.2（**MIT**） |

> manager 前端的关键指标：`vue-tsc` 0 错误、`eslint` 告警数有 **ratchet 上限（67）**，只减不增。

---

## 目录结构

```text
spring-breeze-mall/
├── apps/
│   ├── manager/          # 平台运营端（Vue 3 + TS + Vite 8）
│   ├── seller/           # 商家端（Vite 8 + TS）
│   ├── buyer/            # PC 买家端（Vue CLI）
│   ├── im/               # IM 客服端（Vite 8）
│   └── uniapp/           # 移动端（uni-app）
├── backend/
│   ├── framework/        # 公共框架（业务核心）
│   ├── manager-api/      # 运营端接口
│   ├── seller-api/ buyer-api/ im-api/
│   ├── config/           # 公共配置
│   └── DB/               # 增量 SQL / 种子数据 / 文档
├── docker/               # 可选中间件（mysql / redis / es）与初始化 SQL
├── packages/             # 共享前端包
└── pnpm-workspace.yaml
```

---

## 环境要求

| 组件 | 版本 |
|---|---|
| JDK | **25**（已验证 Temurin 25） |
| Node.js | **>= 24** |
| pnpm | **12.x**（`packageManager` 已固定） |
| MySQL | **9.7.x**（不要使用已移除的 `mysql_native_password`） |
| Redis | **8.x** |
| Maven | 通过 `backend/mvnw`，无需全局安装 |

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动前端（默认端口见下表）
pnpm dev:manager   # http://localhost:10003
pnpm dev:seller    # http://localhost:10002
pnpm dev:buyer     # http://localhost:10000
pnpm dev:im        # http://localhost:8000
# 或一次启动全部：pnpm dev:all-ui

# 3. 启动后端
cd backend
./mvnw -pl manager-api -am package -DskipTests     # Windows: mvnw.cmd
java -jar manager-api/target/manager-api-*.jar     # 默认端口 8887
```

后端就绪判断：`GET http://localhost:8887/manager/live/room/page` 返回 401/403 即为已启动。

## Docker（可选）

本地开发**不需要** Docker，直接用本机 MySQL / Redis 即可。若要用容器起中间件：

```bash
cd docker
docker compose up -d
```

> `docker-compose.yml` 里的 Redis 带 `requirepass=lilishop`，与本机无密码 Redis 不同；
> 启用 Docker Redis 时请同步修改 `backend/config/application-dev.yml`。

### docker-compose 二进制（仓库未包含）

`docker/init/docker-compose/` 预期存放 **docker-compose v2 单文件二进制**（约 52 MB），
为避免仓库膨胀，该文件**未纳入版本控制**（已在 `.gitignore` 中）。

如果所在环境没有 `docker compose` 插件（老版本 Docker / 离线环境），按需下载：

```bash
# Linux x86_64
mkdir -p docker/init/docker-compose
curl -fsSL -o docker/init/docker-compose/docker-compose-linux-x86_64 \
  https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64
chmod +x docker/init/docker-compose/docker-compose-linux-x86_64

# 使用
./docker/init/docker-compose/docker-compose-linux-x86_64 version
```

Windows / macOS 建议直接安装 Docker Desktop（自带 compose 插件），无需该二进制。

### MySQL 初始化脚本挂载

`./docker/init/mysql` 会挂载到容器的 `/docker-entrypoint-initdb.d`，
即 `lilishop.sql` 与 `patches/` 会在容器首次启动时自动执行。

---

## 数据库初始化

```bash
# 1. 建库
CREATE DATABASE lilishop DEFAULT CHARACTER SET utf8mb4;

# 2. 导入官方初始化 SQL
mysql -u root -p lilishop < docker/init/mysql/lilishop.sql   # 约 8 MB

# 3. 按需执行增量补丁（见下）
```

### 增量补丁顺序

| 顺序 | 文件 | 说明 |
|---:|---|---|
| 1 | `docker/init/mysql/lilishop.sql` | 基础库 |
| 2 | `docker/init/mysql/patches/*.sql` | 历史补丁（按文件名日期顺序） |
| 3 | `backend/DB/init-setting-defaults.sql` | 补齐 37 项默认设置（幂等） |
| 4 | `backend/DB/menu-kebab-routes.sql` | 菜单 `front_route` 与前端文件名对齐（幂等） |
| 5 | `backend/DB/menu-kebab-names.sql` | 菜单 `name` / `path` 统一 kebab（幂等） |
| 6 | `backend/DB/menu-kebab-front-route.sql` | `Main` → `main` 等收尾（幂等） |
| 7 | `backend/DB/store-menu-kebab-front-route.sql` | **商家端**菜单 `front_route` 对齐（幂等） |
| 8 | `backend/DB/store-menu-kebab-names.sql` | **商家端**菜单 `name` 统一 kebab（幂等） |
| 9 | `backend/DB/store-menu-kebab-paths.sql` | **商家端**菜单 `path`（URL）统一 kebab（幂等） |
| 10 | `backend/DB/store-menu-orphan-cleanup.sql` | 清理商家端孤儿菜单（父节点已不存在的行，软删除） |

> 第 4–6 个补丁对应 **平台端（manager）**，第 7–9 个对应 **商家端（seller）**，
> 都 **必须执行**，否则菜单点进去是空白页（前端文件已统一 kebab-case，
> 而菜单表里存的是视图文件路径）。所有补丁都带 `WHERE 旧值`，重复执行无副作用。
>
> ⚠️ 第 9 个补丁会让商家端**旧 URL 404**（`/orderList` → `/order-list`），属计划内变更。

测试数据（可选）：

```bash
mysql -u root -p lilishop < backend/DB/test-data-order.sql
```

详见 `backend/DB/TEST-DATA.md`。

---

## 开发命令

```bash
# manager 质量门（提交前建议全跑）
cd apps/manager
pnpm exec vue-tsc --noEmit -p tsconfig.app.json
pnpm exec eslint src --max-warnings 67
pnpm build
```

> 构建大项目时如果遇到 `Zone Allocation failed`（内存不足），用
> `node --max-old-space-size=3072 node_modules/vite/bin/vite.js build`。

后端：

```bash
cd backend
./mvnw -DskipTests package        # 打包
./mvnw -pl manager-api -am spring-boot:run
```

---

## 开发规范

| 项 | 规范 |
|---|---|
| 文件命名 | **kebab-case**（`use-table.ts`、`live-chat-panel.vue`），禁止驼峰/下划线混用 |
| 路由 path/name | **kebab-case**（`/pc-floor`、`order-list`） |
| 菜单 `front_route` | 视图文件路径，kebab-case（`member/list/index`） |
| 类型 | 严格模式；api 返回类型见 `apps/manager/VO-CONTRACTS.md` |
| Lint | 告警数只减不增（`package.json` 里的 `--max-warnings`） |

命名改造的完整记录与例外（`*.d.ts`、语言包、第三方压缩库）见
[`apps/manager/NAMING-CONVENTIONS.md`](apps/manager/NAMING-CONVENTIONS.md)。

---

## 文档索引

| 文档 | 内容 |
|---|---|
| [`apps/manager/NAMING-CONVENTIONS.md`](apps/manager/NAMING-CONVENTIONS.md) | 命名规范 + 四个阶段改造记录 |
| [`apps/manager/API-TYPING-STATUS.md`](apps/manager/API-TYPING-STATUS.md) | api 类型化终报（601 个函数 / 已标注 398） |
| [`apps/manager/VO-CONTRACTS.md`](apps/manager/VO-CONTRACTS.md) | VO 契约（40+ 类型字段表，脚本生成） |
| [`apps/manager/PERF-AUDIT.md`](apps/manager/PERF-AUDIT.md) | 性能体检（首屏 1.9 MB → 约 1 MB） |
| [`apps/manager/COMPONENT-REUSE-STATUS.md`](apps/manager/COMPONENT-REUSE-STATUS.md) | 组件复用终报（TablePager + useTable） |
| [`apps/manager/EDITOR-UPGRADE.md`](apps/manager/EDITOR-UPGRADE.md) | TinyMCE 升级与**回退到 6.4.2（MIT）**记录 |
| [`apps/manager/TEST-CASES.md`](apps/manager/TEST-CASES.md) | 分章测试用例（P0/P1/P2） |
| [`apps/manager/SMOKE-REUSE.md`](apps/manager/SMOKE-REUSE.md) | 合并冒烟清单（78 条可勾选） |
| [`apps/manager/LINT-DEBT.md`](apps/manager/LINT-DEBT.md) | 逐轮改造台账 |
| [`apps/seller/MIGRATION-SELLER.md`](apps/seller/MIGRATION-SELLER.md) | seller 迁移记录（M0–M5，含菜单 SQL 与豁免说明） |
| [`apps/seller/MIGRATION-BASELINE.md`](apps/seller/MIGRATION-BASELINE.md) | seller 迁移前基线（规模/重复面/风险） |
| [`apps/seller/SMOKE-SELLER.md`](apps/seller/SMOKE-SELLER.md) | seller 冒烟清单（72 条可勾选） |
| [`apps/im/MIGRATION-BASELINE.md`](apps/im/MIGRATION-BASELINE.md) | im 迁移基线与计划（含「保留 Less」的决策依据） |
| [`apps/im/MIGRATION-IM.md`](apps/im/MIGRATION-IM.md) | im 迁移记录（M1 完成，含 WebSocket 验证边界） |
| [`backend/SETTING-NPE-AUDIT.md`](backend/SETTING-NPE-AUDIT.md) | 设置读取空指针审计与修复 |
| [`backend/DB/TEST-DATA.md`](backend/DB/TEST-DATA.md) | 测试数据说明与清理 |

---

## 安全提醒

- **不要提交** `.env`、`backend/**/local-secrets.yml`（已在 `.gitignore` 中）
- 数据库密码等敏感信息请放在 `backend/local-secrets.yml`，格式见 `backend/config/README.md`
- `application*.yml` 里的 `password: lilishop` 是上游默认示例值，本地请覆盖
- `docker/init/mysql/lilishop.sql` 里的第三方密钥字段均为空/占位符，可安全提交
- **地图 Key 已从源码外置**：高德 / 腾讯位置服务的 Key 改由各端 `public/config.js` 的
  `BASE.MAP` 运行时注入（`manager` / `seller` / `buyer`），源码里不再出现。
  部署时按需填写，留空只会影响地图相关功能。
  历史上这些 Key 曾硬编码在 `src/config` 中，**请自行到高德/腾讯控制台吊销并重新申请**
  （仓库历史里仍能看到旧值，修改源码不能撤回已公开的记录）。

---

## 许可

- 本项目整体沿用上游 **[Apache-2.0](https://github.com/lilishop/lilishop)**
- 富文本编辑器使用 **TinyMCE 6.4.2（MIT 授权）**，与 Apache-2.0 无冲突
  - 历史说明：曾升级到 8.x，但其自 7.0 起改为 **GPL-2.0-or-later / 商业授权**二选一，
    存在兼容性争议，因此回退到 6.4.2（详见 `apps/manager/EDITOR-UPGRADE.md` 第十节）

---

## 致谢

- [Lilishop](https://github.com/lilishop/lilishop) —— 原始商城框架
- [Element Plus](https://element-plus.org/) · [Vue](https://vuejs.org/) · [Vite](https://vitejs.dev/)
- [TinyMCE](https://www.tiny.cloud/)


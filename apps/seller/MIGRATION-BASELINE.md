# seller 迁移基线（M0 记录）

> 记录时间：2026-11-28
> 用途：迁移前后的对比基线，供 ratchet 与回归参考。

## 1. 工程现状

| 项 | 值 |
|---|---|
| 包名 | `@spring-breeze/seller` |
| 构建 | `@vue/cli-service`（webpack 5）+ babel |
| Vue | 3.5 |
| UI | element-plus 2.14（`unplugin-vue-components` webpack 版） |
| 语言 | 纯 JS（无 tsconfig） |
| 样式 | SCSS + **1 个 less 文件**（`src/styles/theme.less`，15 行） |
| dev 端口 | 10002 |
| API | `http://127.0.0.1:8887`（**manager-api**，前缀 `/store`） |
| 上传接口 | `/store/common/upload/file` |
| 登录 cookie | `userInfoSeller` |
| 路由 | 后端菜单驱动（`li_store_menu`），`libs/util.js` 同 manager |

## 2. 代码规模

| 类型 | 数量 |
|---|---:|
| `.vue` | 223（`<script setup>` 202 / `export default` 21） |
| `.js` | 78 |
| `.ts` | 0 |
| 代码行数 | ≈ 83.5k |
| `src/api` 文件 | 20（16 个与 manager 同名） |
| `views` 一级目录 | 19 个，最大 `shop` 111 个 vue |

## 3. 与 manager 的重复面（迁移时优先消重）

| 文件 | manager | seller |
|---|---:|---:|
| `libs/axios` | 362 行 | 336 行 |
| `libs/util` | 548 行 | 575 行 |
| `libs/emoji` | 77 行 | 77 行（内容一致） |
| `libs/validate` | 92 行 | 80 行 |
| `utils/filters` | 351 行 | 250 行 |
| `libs/storage` | 28 行 | 30 行 |
| `libs/reg-exp` | 47 行 | 47 行 |

## 4. 构建配置差异（M1 逐项对照）

| `vue.config.js` | Vite 目标 |
|---|---|
| `publicPath` / `outputDir` / `assetsDir` | `base` / `build.outDir` / `build.assetsDir` |
| `devServer.port = 10002` | `server.port` |
| `resolve.alias`“@” | 同 |
| `style-resources-loader` 注入 `common.scss` | `css.preprocessorOptions.scss.additionalData` |
| `unplugin-vue-components/webpack` | `unplugin-vue-components/vite`（+ `dts`） |
| `CompressionPlugin` | `vite-plugin-compression` |
| `<%=js%>` / `<%= BASE_URL %>` 模板 | 静态 `index.html` + `/config.js` |

## 5. 迁移后需要达到的指标（对标 manager）

| 指标 | manager（参考） | seller 目标 |
|---|---|---|
| `vue-tsc` 错误 | 0 | **0** |
| `eslint --max-warnings` | 67（ratchet） | 迁移结束实测值（只减不增） |
| 文件命名 | kebab（1 例外：第三方压缩库） | 同 |
| 路由 path/name | 全 kebab | 同 |
| 菜单 `front_route` | `li_menu` 全可解析 | `li_store_menu` 79 条全可解析 |
| 列表页复用 | `useTable` 54 页 / `TablePager` 109 处 | 分批推进，只读小列表不迁 |

## 6. 已知风险

| 风险 | 说明 |
|---|---|
| 共用 manager-api | seller 与 manager 打同一后端，改动需双边回归 |
| 菜单表驱动路由 | `li_store_menu` 必须与前端文件名同步，否则空白页 |
| 上传地址不同 | `/store/common/upload/file`（manager 是 `/manager/...`） |
| 店铺上下文 | `userInfoSeller` + `storeId`，登录态与 manager 不同 |
| element-plus 版本 | seller 直写 `^2.14.1`，需统一到 `catalog:` |

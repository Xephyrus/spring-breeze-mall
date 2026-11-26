# 命名规范与改造记录

> 起始时间：2026-11-26
> 范围：`apps/manager`
> 目标：**统一 kebab-case，不再混用连字符与驼峰**

---

## 一、规范

| 对象 | 规范 | 示例 |
|---|---|---|
| 视图文件 | kebab-case | `distribution-customer.vue` |
| 组件文件 | kebab-case | `live-chat-panel.vue`、`upload-pic-input.vue` |
| TS 模块 | kebab-case | `use-table.ts`（阶段 2） |
| 目录 | kebab-case | `page-decoration/`、`goods-manage/` |
| 路由 path | kebab-case | `/distribution-import-record` |
| 路由 name | kebab-case | `distribution-import-record` |
| 菜单 `front_route` | kebab-case 的视图路径（不含扩展名） | `distribution/distribution-import-record` |

> 例外（保留原样）：`*.d.ts`、`403.vue` / `404.vue` / `500.vue` 这类纯数字页。

---

## 二、阶段 1：视图 + 组件文件重命名（✅ 已完成）

### 结果

| 项 | 数值 |
|---|---:|
| 重命名文件 | **229 个** |
| 修正 import / 动态 import 引用 | **84 个文件 / 285 处** |
| 修正「只有大小写不同」的引用（TS1261） | **32 个文件 / 34 处** |
| 修正 `lazyLoading.ts` 里的别名路径 | **22 处** |
| 视图 + 组件中仍非 kebab 的文件 | **0**（413 个文件全部 kebab） |

### 改法（可复用）

1. 生成映射：`PascalCase|camelCase → kebab-case`
   - 两步正则：`([a-z0-9])([A-Z]) → $1-$2`、`([A-Z]+)([A-Z][a-z]) → $1-$2`
2. 重命名：**Windows 大小写不敏感**，`Coupon.vue → coupon.vue` 必须经临时文件名两步走
3. 修引用：解析每个 specifier（`from "..."` / `import("...")`），
   **解析不到文件时**才尝试把最后一段 kebab 化再解析 —— 这样不会误伤正常引用
4. 再补一轮「大小写对齐」：解析得到真实文件后，按磁盘真实大小写重建 specifier
   （否则 TS 报 `TS1261: differs only in casing`）
5. **字符串形式的路径不会被 import 规则覆盖**：`lazyLoading.ts` 的 `VIEW_ALIASES` 是纯字符串，必须单独处理

### 同步数据库与种子数据

菜单表 `li_menu.front_route` 存的是**视图文件路径**，文件改名后必须同步：

| 项 | 数值 |
|---|---:|
| 库中失配的菜单行 | **38** |
| 应用后仍失配 | **0**（其余 15 条由前端 `VIEW_ALIASES` / `DEPRECATED_FRONT_ROUTES` 处理） |

产物：

- `backend/DB/menu-kebab-routes.sql`（38 条**幂等** UPDATE，带 `WHERE front_route = 旧值`）
- `docker/init/mysql/patches/2026-11-26-menu-kebab-routes.sql`（同内容，供全新初始化后执行）

> 幂等性已验证：重复执行 0 行受影响。

---

## 三、阶段 2：路由 path / name 统一（✅ 已完成）

### 结果（改造前 → 改造后）

| 位置 | 改造前 | 改造后 |
|---|---:|---:|
| `router.ts` 的 path | 9 | **0** |
| `router.ts` 的 name | 13 | **0** |
| `li_menu.path` | 49 | **0** |
| `li_menu.name` | 59 | **0** |
| 前端 `push({name})` / `removeTag` 引用 | 46 处 | **0** |
| 代码里写死的旧 path 字面量 | 4 处 | **0** |

典型变化：

| 现在 | 之前 |
|---|---|
| `/pc-floor` | `/pcFloor` |
| `order-list` | `orderList` |
| `home-index` | `home_index` |
| `/floor-list/main` | `/floorList/main` |
| `overview-statistics` | `overviewStatistics` |

典型待改：

| 现在 | 目标 |
|---|---|
| `/floorList/main` | `/floor-list/main` |
| `messageTemplate` | `message-template` |
| `home_index` | `home-index` |
| `change_password` | `change-password` |
| `add-kanJia-activity-goods` | `add-kanjia-activity-goods` |
| `overviewStatistics`（菜单 path） | `overview-statistics` |
| `managerGoodsGroup`（菜单 name） | `manager-goods-group` |

### 风险点

1. **`name` 是跳转契约**：`router.push({ name: "orderList" })` 遍布全站，
   数据库改名后必须同步改代码，否则跳转报 `No match for name`
2. **`appStore.removeTag("xxx")`** 用 name 关标签页（19 处）
3. **`meta.firstRouterName`** 也用 name
4. 有些菜单 `path` 是纯 id 或 `/`，不该动

### 实际做法（可复用）

1. **只改「路由语境」里的字符串**，不要全局替换 `name: "X"` ——
   `defineOptions({ name })` 是**组件名**，不是路由名，改了会破坏 keep-alive；
2. 精确匹配 5 类写法：`push({ name }` / `replace({ name }` /
   `customRouterPush({ name }` / `removeTag("X")` / `firstRouterName: "X"`；
3. **单双引号都要覆盖**（第一遍只写了双引号，漏了单引号的 `home_index` 1 处）；
4. 字面量路径 `push({ path: "/x" })` 和代码里的 `"/x"` 也要单独扫；
5. 先改代码跑通三件套，**再改库**（改库后前端没改完就会「点了没反应」）。

### 数据库产物

| 文件 | 内容 |
|---|---|
| `backend/DB/menu-kebab-names.sql` | 71 条 name + 57 条 path 的幂等 UPDATE |
| `docker/init/mysql/patches/2026-11-26-menu-kebab-names.sql` | 同内容 |

> 幂等性已验证：重复执行不产生变更。

---

## 三之二、阶段 3：菜单 front_route 收尾（✅ 已完成）

菜单管理页的「前端组件」列展示的就是 `front_route` 字段，仍有 29 行非 kebab：

| 旧值 | 数量 | 新值 |
|---|---:|---|
| `Main` | 28 | `main` |
| `member/list/memberRecycle` | 1 | `member/list/member-recycle` |

### 连带改动

| 位置 | 改动 |
|---|---|
| `libs/util.ts` 的 `DEPRECATED_FRONT_ROUTES` | `member/list/memberRecycle` → `member/list/member-recycle` |
| `views/sys/menu-manage/menu.vue` | 新增菜单默认 `frontRoute: "main"`，placeholder 改为「例如 main 或 goods/index」 |
| `views/sys/menu-manage/store-menu.vue` | 同上 |
| `libs/lazyLoading.ts` | 保留 `Main` / `main` 双别名兼容旧数据 |

### 产物

| 文件 | 内容 |
|---|---|
| `backend/DB/menu-kebab-front-route.sql` | 2 条幂等 UPDATE |
| `docker/init/mysql/patches/2026-11-26-menu-kebab-front-route.sql` | 同内容 |

### 结果

| 项 | 结果 |
|---|---|
| `li_menu.front_route` 含大写/下划线 | **0** |
| `li_menu.front_component` | 全为 `NULL`（该列未使用，菜单页展示的是 front_route） |

---

## 三之三、阶段 4：TS 模块改名（✅ 已完成）

把 `api/ utils/ libs/ composables/ constants/` 下的 12 个 camelCase 模块统一为 kebab：

| 旧名 | 新名 |
|---|---|
| `api/pointsCoupon.ts` | `api/points-coupon.ts` |
| `api/timedTask.ts` | `api/timed-task.ts` |
| `composables/useSiteSettings.ts` | `composables/use-site-settings.ts` |
| `constants/cardKey.ts` | `constants/card-key.ts` |
| `constants/goodsType.ts` | `constants/goods-type.ts` |
| `libs/lazyLoading.ts` | `libs/lazy-loading.ts` |
| `libs/RegExp.ts` | `libs/reg-exp.ts` |
| `utils/downloadBlob.ts` | `utils/download-blob.ts` |
| `utils/imgFallback.ts` | `utils/img-fallback.ts` |
| `utils/useTable.ts` | `utils/use-table.ts` |
| `utils/wechatOrderSync.ts` | `utils/wechat-order-sync.ts` |
| `App.vue` | `app.vue`（仅大小写） |

| 项 | 数值 |
|---|---:|
| 改名文件 | 12 |
| 修正引用 | 76 个文件 / 88 处 |

### 结果

| 项 | 结果 |
|---|---|
| `src` 下非 kebab 源文件 | **1**（`views/live/utils/lib-generate-test-usersig-es.min.js`，第三方压缩库，保留原名） |
| `.d.ts` 声明文件 | 保留（命名规范不适用） |
| `locale/lang/en-US.ts` / `zh-CN.ts` | 保留（语言标识符标准写法） |

---

## 四、验证现状

| 项 | 结果 |
|---|---|
| `vue-tsc --noEmit` | 0 错误 |
| `vite build` | ✅ 通过 |
| `eslint src --max-warnings 67` | 67 告警（ratchet 通过） |
| 菜单 `front_route` 失配 | 0 |
| 文件命名一致性 | 413 / 413 kebab |

> ⚠️ 需要人工确认：**登录后侧边菜单逐个点一遍**（尤其分销、营销、系统设置、订单），
> 因为菜单是靠 `front_route` 找文件的，漏改一个就是空白页。

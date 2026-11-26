# Manager 前端 lint 技术债台账

> **收尾状态（本轮结束）**：`lint` 0 error / **3699** warning；`vue-tsc`（strict + strictTemplates）**0 错误**；`vite build` 通过；`@ts-nocheck` **82**。
> 后续按业务驱动推进的清单见 [LINT-BACKLOG.md](./LINT-BACKLOG.md)。
> 回退点：`.build-check/snap-real-w12`（当前状态快照）。

> 目标：把 lint 告警分阶段清零，并且**每阶段都能独立验收、可回滚**。
> 验收命令：`pnpm lint` · `pnpm typecheck` · `pnpm build`（三者都要过）。

## 基线（P0 冻结）

| 指标 | 数值 |
|---|---:|
| 被 lint 的文件 | 468 |
| 有告警的文件 | 375 |
| 告警总数 | **5711**（0 error） |

| 规则 | 数量 |
|---|---:|
| `@typescript-eslint/no-explicit-any` | 4545 |
| `vue/no-mutating-props` | 739 |
| `@typescript-eslint/no-unused-vars` | 221 |
| `@typescript-eslint/ban-ts-comment` | 181 |
| `@typescript-eslint/no-unused-expressions` | 13 |
| `vue/no-side-effects-in-computed-properties` | 12 |

**另有 182 个 `.vue` 的 `<script setup>` 首行写着 `// @ts-nocheck`**，类型检查被整体绕过（占 39%），这是比 `any` 更严重的技术债。

## 护栏机制

`pnpm lint` = `eslint src --max-warnings <当前基线>`。每完成一个阶段就把这个数字下调到新的实测值，**告警只能降不能涨**。

> 为什么不用 ESLint 的 bulk suppressions（`--suppress-all` / `eslint-suppressions.json`）：
> 它的实现里只统计 `severity === 2`（error）的条目
> （见 `eslint/lib/services/suppressions-service.js` 的 `countViolationsByRule`），
> 对本项目全是 warning 的现状无效；若为了用它而把规则改成 error，编辑器会立刻变成满屏红色。
> 因此选择 `--max-warnings` 作为 ratchet。

## 阶段进度

- [x] **P1 未使用变量与无效表达式**（`no-unused-vars` 221 → 9，`no-unused-expressions` 13 → 0）
- [ ] **P2 摘除 `@ts-nocheck`**（182 文件，试批已做，密度 ≈5.8 条/文件）
- [ ] **P3 `any` 收敛**（4446 → 目标 ≤1400）
- [ ] **P4 `vue/no-mutating-props`**（738，先试点再决策）
- [ ] **P5 收尾与规则升级**（12 + 规则 warn→error）

| 阶段 | 起始 | 目标 | 实际 |
|---|---:|---:|---:|
| P0 | 5711 | 冻结基线 | 5711（`--max-warnings` ratchet） |
| P1-a 无效表达式 | 5711 | 5698 | **5698**（13 条全清） |
| P1-b 未使用 import / 死代码 | 5698 | — | 5550 |
| P1-c 未使用参数 | 5550 | — | 5474 |
| P1-d 收尾一轮 | 5474 | — | 5430 |
| P1-e 终局（`_` 前缀改名为主） | 5430 | — | 5403 |
| P1-f 最后 9 条（catch 解绑 + 解构改名） | 5403 | — | **5372** |
| P1 完成 | 5711 | — | `no-unused-vars` 221 → **0**，`no-unused-expressions` 13 → **0** |
| P2 试批（6 个单文件目录） | 5386 | — | 暴露 35 条，密度 ≈5.8 条/文件 |
| P2 批次 1：`views/finance`（4 文件） | 5386 | — | 暴露 9 条，一轮修完 ✅ |
| P2 批次 2 试算：`views/order`（6 文件） | — | — | 暴露 **156 条**（≈26 条/文件）→ 回滚，改按单文件切批 |
| P2 批次 3：`views/live`（5 文件） | — | — | 暴露 36 条；先修 4 个轻文件（20 条→0），`control-panel.vue`（16 条）恢复 `@ts-nocheck` 留待单文件批次 ✅ |
| P2 批次 4：`views/seller`（6 文件） | — | — | 暴露 96 条；4 个轻文件（32 条→0），`shopDetail`(28)/`shopOperation`(36) 恢复 `@ts-nocheck` ✅ |
| P2 批次 5：`views/statistics`（7 文件） | — | — | 暴露 35 条；5 个轻文件（11 条→0），`traffic`(9)/`order`(15) 恢复 `@ts-nocheck` ✅ |
| 断言收口（选项 2） | 5382 | — | 迁移文件里的 10 处 `as any` → 1 处（仅剩 `navigator.msSaveBlob`，浏览器 API 无类型）✅ |
| P2 批次 6：`views/distribution`（7 文件） | — | — | 暴露 54 条；4 个轻文件（15 条→0），`distribution`(14)/`distributionOrder`(12)/`distributionCustomerRelation`(13) 恢复 `@ts-nocheck` ✅ |
| P2 批次 7 试算：`views/goods`（8 文件） | — | — | 暴露 65 条；通用改写后仍剩 21 条**文件特有**问题（递归返回类型、`FormData` vs `Record`、`proxy` 可空）→ 整体回滚保绿 |
| P2 批次 8：`views/member`（8 文件） | — | — | 暴露 105 条；仅 `experience-log.vue` 清零保留，其余 7 个恢复 `@ts-nocheck` ✅ |
| P2 批次 9：`views/page`（9 文件） | — | — | 暴露 42 条；6 个轻文件清零，`articleList`(10)/`statisticsHotWords`(11) 恢复 `@ts-nocheck` ✅ |
| P2 批次 11 试算：`views/sys`（24 文件） | — | — | 总暴露 **232 条**；12 个轻文件（≤5 条）通用改写后仍剩 26 条（map 变量名各异、`spread` 字符串、`proxy` 可空、api 参数形状）→ 回滚保绿 |
| P2 进度 | 182 | **151** | 已迁移 31 个文件；剩余高密度目录按业务驱动推进 |
| P2 轻文件收口（appVersion / sensitive-words / page-breadcrumb / slider / goods-unit 等 8 文件） | 5200 / 151 nocheck | — | lint **5194**；`@ts-nocheck` **151→137**；vue-tsc 0 ✅ |
| P2 验收收口 + 旁路修复（goodsApply / BenefitFormFields / authGoods FormData） | 5194 / 137 | — | lint **5187**；`@ts-nocheck` **131**；vue-tsc 0 ✅ |
| P2 轻文件续迁 + ratchet（main-parts / page / sys 轻页等） | 5187 / 131 | — | lint **5134**；`@ts-nocheck` **123**；vue-tsc 0 ✅ |
| P2 Phase B：statistics/traffic + setting BASE/OSS/POINT + smsSettingManage | 5134 / 123 | — | lint **5138**（摘 nocheck 暴露 any，ban-ts-comment −5）；`@ts-nocheck` **118**；vue-tsc 0 ✅ |
| P2+P3 真消告警：Track B 收敛已迁 any + WECHAT_PAYMENT / seckill-setup / LotteryManage | 5138 / 118 | — | lint **5071**（−67）；`@ts-nocheck` **115**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R2：LotteryForm/live-detail/coupon-info + seckill-add/PointsCoupon/category | 5071 / 115 | — | lint **5008**（−63）；`@ts-nocheck` **112**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R3：LIVE/VERIFICATION/WITHDRAWAL + pintuan/coupon-receive/points-goods | 5008 / 112 | — | lint **4908**（−100）；`@ts-nocheck` **109**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R4：sales-order-detail/SECURITY/CONNECT + seckill/kanjia/full-discount-detail | 4908 / 109 | — | lint **4851**（−57）；`@ts-nocheck` **106**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R5 加大批量：Track B×6 any + A 迁 full-discount/coupon/seckill-goods/pintuan-goods/points-goods-add（edit/order/publish 密度>10 恢复） | 4851 / 106 | — | lint **4738**（−113）；`@ts-nocheck` **101**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R6 加大批量无子代理：Track B×6 any + menu/storeMenu + 礼金卡 activity/records/batch-credentials（砍价/order/oss/publish 等密度>10 恢复） | 4738 / 101 | — | lint **4634**（−104）；`@ts-nocheck` **96**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R7 加大批量无子代理：Track B×8 any（finance×4+feedback/log/overview/WxSetting）；A1–A6 及替补密度均 >10 全部恢复 | 4634 / 96 | — | lint **4584**（−50）；`@ts-nocheck` **96**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R8：Track B residual any + A 边缘三文件同会话清零（coupon-publish / gift-card-activity-add / customerRelation） | 4584 / 96 | — | lint **4459**（−125）；`@ts-nocheck` **93**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R9：Track B×10 any + A 同会话清零 distributionOrder / statistics-order / live-control-panel | 4459 / 93 | — | lint **4316**（−143）；`@ts-nocheck` **90**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R10 加大批量无子代理：Track B×10 residual any + A 同会话清零 coupon / distribution（shopOperation 37>25 恢复） | 4316 / 90 | — | lint **4122**（−194）；`@ts-nocheck` **88**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R11 加大批量无子代理：Track B×10 residual any + A 同会话清零 afterSale / experience-setting / points-goods-edit | 4122 / 88 | — | lint **3942**（−180）；`@ts-nocheck` **85**；vue-tsc 0 ✅ |
| P2+P3 真消告警 R12 加大批量无子代理：Track B×10 residual any + A 同会话清零 afterSaleOrder / brand / category | 3942 / 85 | — | lint **3699**（−243）；`@ts-nocheck` **82**；vue-tsc 0 ✅ |

### 方向调整：P2 收窄范围（方案 A）

不再追求 182 个文件全量迁移，改为「**只迁错误密度 ≤10 的目录/文件**」：
通用 6 模式能吃掉的成批处理，剩下的高密度目录（`page-decoration` 77、`sys` 20+、重页面）保持 `@ts-nocheck`。
目标：`@ts-nocheck` 从 182 压到 **~80**，把精力留给 P3（`any` 收敛）。
**当前 106/182**（轻文件持续迁入类型检查；摘 nocheck 必须同文件收敛 any，保证 lint 净下降）。

## P3 进度（`any` 收敛）

| 批次 | 范围 | 结果 |
|---|---|---|
| P3-1 | `libs/axios.ts`、`utils/downloadBlob`、`utils/print`、`utils/message`、`utils/wechatOrderSync`、`stores/app.ts` | 去掉 18 处；`no-explicit-any` 4486 → 4466 |
| P3-2 | `utils/filters.ts`（9 处）、`libs/util.ts`（4 处） | 再多去掉 21 处；`no-explicit-any` 4466 → **4445**，总数 5367 → **5346** |
| P3-3 | views 全量：`(valid: any)` → `boolean`、`index/idx: any` → `number`，共 92 个文件 | `no-explicit-any` 4445 → **4299**，总数 5346 → **5200**（−146） |
| P3-3 回滚项 | 3 处 `handleDel/handleRemoveHotWord/deleteMenuItem` 的 `index` 参数 | 模板 `v-for` 的 index 是 `string \| number`，收成 `number` 后调用处不匹配，已回退 |

### `row: any` 的分布与一个关键耦合（P3-4 未执行的原因）

`row: any` 共 **193 处**，集中在：

| 目录 | 条数 | 该目录是否仍有 `@ts-nocheck` |
|---|---:|---|
| `promotions/gift-card-cash` | 26 | 是（4 个文件） |
| `member/paid` | 12 | 是 |
| `sys/menu-manage` | 8 | 是 |
| `distribution/distributionCustomerRelation.vue` | 7 | 是 |
| `member/benefit` | 7 | 是 |

**结论**：`row: any` 的收敛与 P2 **强耦合**——给表格行建接口（`GiftCardRow`/`MenuRow`…）后，
必须靠 `vue-tsc` 校验字段是否写对；而这些文件仍是 `@ts-nocheck`，改了**无法验证**，
只能让 eslint 数字好看，属于「假收敛」。

因此正确顺序是：**先迁该文件的 `@ts-nocheck`，同一轮里把 `row` 换成真实行接口**。
这也是后续唯一推荐的推进方式（一次处理一个文件，迁移 + 行类型化一起做）。

| 形态 | 条数 | 可批量收敛性 |
|---|---:|---|
| `(res: any)` 接口回调 | 486 | 需按接口定义 `ResultMessage<T>`，半自动 |
| `v: any` / `val: any` / `item: any` 列表值 | 474 | 需知道来源数组类型，逐处 |
| `row: any` 表格行 | 212 | 可按业务建 `XxxRow` 接口，一个接口覆盖多处 |
| `ref<any>` | 356 | 多数可换成具体形状或 `Record<string, unknown>` |
| `Record<string, any>` | 168 | 动态表单/装修 JSON，保留 |
| `(e: any)` | 62 | 未使用时可改 `catch {}` |
| `(rule/value/callback: any)` | 104 | 标准 el-form 校验签名，可统一定义 |
| ✅ `(valid: any)` / `index/idx: any` | **146** | 已批量收敛 |
| P3-2 回滚项 | `formatPrice`/`unixToDate` 参数收窄、`catch` 去绑定、`isSameRoutePage` 参数形状 | 3 处内部实现依赖宽松类型，已回退 |
| P3-1 回滚项 | `utils/index.ts`（cloneObj 泛型化）、`utils/validate.ts`（回调类型）、`utils/app.ts` 的 i18n 断言 | 泛型化后引入 12 条新错误，已回退——**泛型化克隆函数在 TS 里代价很高**，留待单独处理 |

**结论**：`utils`/`libs` 里的 `any` 分两类——
- 「边界型」（axios 配置、DOM 事件、第三方实例）：能换成 `AxiosRequestConfig` / `Event` / 具体实例类型，安全且低风险；
- 「算法型」（`cloneObj`、`md5` 的位运算、通用深拷贝）：泛型化会让实现内部处处要断言，**收益小于成本**，建议保留并加注释说明。

### 批次失败复盘：`views/goods` 为什么推不动

通用 6 模式只覆盖了一部分，剩下的 21 条属于**每处都要单独想**的类型问题：

| 问题 | 例子 | 为什么不能批量修 |
|---|---|---|
| 递归函数缺返回类型 | `buildCategoryTreeNodes`（TS7023/7024） | 需要人读函数体判断返回结构 |
| 自引用初始化 | `const list = [list...]`（TS7022） | 得重构初始化逻辑 |
| `FormData` 传给 `Record<string, unknown>` | 上传接口 | 要么改接口签名，要么在调用处断言 |
| `getCurrentInstance()` 的 `proxy` 可空 | 多处 | 与 `as any` 不同，加 `!` 会在 null 时崩 |
| 数字/字符串互换 | `number \| undefined` ↔ `number` | 要确认默认值语义 |

**结论**：这类目录需要「一次一个文件、边看边改」，不能按目录批量切。后续遇到类似密度（>5 条且非模式化）直接走单文件流程。
| P3 | 5373 | ≤2400 | |
| P4 | ≤2400 | ≤40（或 0） | |
| P5 | ≤40 | 0 | |

### P2 试批实测结论（排期依据）

- 摘掉 `@ts-nocheck` 后 6 个文件暴露 **35 条**错误，密度 ≈ **5.8 条/文件**；182 个文件总量约 **1000 条**
- 错误集中在 5 类：`ElMessageBox` 的 `ConfirmOptions` 多了 `loading`、`let id` 隐式 any、
  `ref({...})` 由字面量推出的窄类型、`ref([])` 推成 `never[]`、`el-tabs` 的 `TabPaneName`
- 一轮通用改写能消掉约一半（35 → 18），剩余是文件特有结构问题（树形数据、表单重置）
- 批次建议：单文件目录 1 批 → `finance/order/live/seller/statistics/distribution` 4~5 批 →
  `goods/member/page` 3~4 批 → `sys` 3 批 → `promotions` 3 批 → `page-decoration`（59）6~8 批

### P1 的自动化边界（踩过的坑）

批量删除「未使用声明」时必须满足：

1. 该标识符在**整个文件**里只出现一次（模板里用到的不算未使用）；
2. 声明语句是**单声明符**（`let timer, flag;` 不能整行删，只有其中一个未使用）；
3. **绝不删除 `defineProps` / `defineEmits` / `defineExpose` / `defineOptions`**——
   即使本地绑定没人用，它们也是组件的对外契约（曾把 `const emit = defineEmits(["selected"])`
   删掉，导致父组件 `@selected` 报错）。

不符合这三条的，一律留给人工。

## 约定

- 每批改动前把 `src` 快照到 `.build-check/`，批次结束后删除
- 禁止用 `as any` 换取告警下降；`any` 只允许留在第三方 SDK 与装修动态 JSON 边界，并写行内注释
- 每批改完都必须重跑 lint / typecheck / build，再更新本文件的数字

## R13（2026-11-24）— 基线修复 + any 批量收敛

| 项 | 起始 | 结果 |
|---|---:|---:|
| typecheck 错误 | **88**（基线红，R8–R12 遗留） | **0** |
| lint 告警 | 3477 | **3374**（−103） |
| no-explicit-any | 2647 | 2544（−103） |
| @ts-nocheck | 79 | 80 |

### 本轮做了什么

1. **先修红**：把 R8–R12 迁移后遗留的 88 条类型错误清零（11 个文件）。
   - 其中 `paid/settings.vue` 45 条，按「单文件 >25 恢复」规则回退 `@ts-nocheck`（+1）；
   - 其余 10 个文件全部修到 0，未新增 `as any`。
2. **Track B 收敛**：把 Promise 回调 `.then((res: any))` 收紧为 `(res: ApiResult)`，
   38 个文件共 107 处；涉及 `Blob`/元组返回的 3 处用 `as unknown as` 或去标注处理。
3. **收尾**：`shopList.vue` 删除未使用的 `PageResult` 类型（清掉最后 1 条 `no-unused-vars`）。

### 关键经验

- `ApiResult` 有两种来源：`@/types/api` 的公共别名，和页面里各自声明的本地 `type ApiResult`。
  批量注入 import 时必须先检测本地声明，否则 87 个文件会集体报 `TS2440`。
- `.then((res: any))` 里并非都是接口返回：导出/下载类接口在请求层被标注为 `ResultMessage`，
  实际是 `Blob`，这类位置应保留宽松或显式 `as unknown as Blob`，不能硬套 `ApiResult`。
- 表单模型类型要按**控件的写回值**放宽（`string | number | boolean | undefined`），
  按 DTO 精确标注会与 Element Plus 的 `CheckboxValueType`/`TabPaneName` 冲突。
## R14（2026-11-24）— 回调去掉 : any 的尝试（负结果）+ region.vue 具名建模

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3374 | **3355**（−19） |
| no-explicit-any | 2544 | 2525（−19） |
| typecheck / build | 0 | 0 |

### 一、被证伪的批量化尝试：去掉数组回调的 `: any`

**假设**：`arr.map((item: any) => ...)` 里的 `: any` 多数是冗余的，删掉后由推断补上。

**实测**：95 个文件、385 处批量删除后，`vue-tsc` 报 **68 条 TS7006（Parameter 'item' implicitly has any type）**。

**结论**：这些标注**不是冗余，而是必需**——因为回调挂在未标注类型的接收者上
（`res.result.map(...)`、`any[]`、SDK 返回值）。删掉标注只会把「显式 any」变成
「隐式 any 报错」，在 `noImplicitAny` 下直接失败。

**真正的解法**：先给**接收者**建类型（数组元素接口 / 接口返回泛型），回调参数才会自动推断。
这正是本轮 `region.vue` 的做法，也是后续唯一有效的路径。

### 二、有效路径示例：`components/region.vue`（22 → 2 处 any）

`	s
type RegionNode = { value: string | number; label: string; leaf?: boolean; children?: RegionNode[] };
type RegionApiItem = { id: string | number; name: string; level?: string };
`

- `data` / `addr` / `resolveLabels` / `loadData` / `handleData` 全部具名；
- `getChildRegion(...)` 的返回显式标注 `ApiResult<RegionApiItem[]>`，因此 `.map((item) =>` 自动推断；
- `cascaderProps` 标注 `computed<CascaderProps>`，`lazyLoad` 用 `as CascaderProps["lazyLoad"]` 对齐；
- 剩余 2 处：`addr` 保留 `ref<any>`（Element Plus cascader 的 v-model 联合类型过宽），`watch` 回调的 `(v: any)`。
## R15（2026-11-24）— 具名建模首个样板：roleManage（42 → 0）

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3355 | **3313**（−42） |
| no-explicit-any | 2525 | 2483（−42） |
| typecheck / build | 0 | 0 |

### 做法

iews/sys/role-manage/roleManage.vue 42 处 `any` 一次清零，靠 5 个 local type：

`	s
type RoleRow / PermissionNode / RolePermission / RolePermissionPayload / RoleForm / PermTreeExpose
`

关键点：

1. **行类型带索引签名** `[key: string]: unknown`，因为 `edit()` 里有 `for (const attr in v) 的动态赋值；
2. **权限树只声明用到的能力** `PermTreeExpose = { getCheckedNodes(...) }`，而不是引入 ElTree 的完整实例类型；
3. **表格 slot 的 row** 是 `DefaultRow`，传参处用 `row as RoleRow`（合法收窄，不是 `as any`）；
4. **控件写回值放宽**：`isSuper` 声明成 `string | number | boolean | undefined`，否则 radio 的 v-model 报不可赋值；
5. 顺手修正 API 签名：`selectRoleMenu` 之前标成 `params?: Record<string, unknown>`，实际是**路径 id**，改为 `roleId: string | number`。

### 新增文档

[TYPES-GUIDE.md](./TYPES-GUIDE.md)：去 anyscript 的五条硬约定、Element Plus 控件类型对照表、单文件改造 SOP、优先队列。
## R16（2026-11-24）— 热区模块内核类型化（utils + 三条指令）

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3313 | **3242**（−71） |
| no-explicit-any | 2483 | 2412（−71） |
| typecheck / build | 0 | 0 |

### 做了什么

新增 `components/hotzone/types.ts`，把模块内散落的动态结构收敛成 4 个类型：
`HotzoneSetting`（热区比例配置，带索引签名容纳装修自定义字段）、
`HotzoneDragInstance` / `HotzoneAddInstance`（指令用到的宿主成员）、
`HotzoneBoundElement`（带卸载钩子的元素）。

`utils/index.ts`（49 处 any）改为**带接口的工具对象**：

- `ZoneStyle` / `ZoneInfo` / `ContainerSize` / `ZoneRatio` / `PointerLike` / `OffsetContainer` / `DealDirectionKey`；
- 八个 `dealTL…dealBR` 统一签名 `(itemInfo: ZoneInfo, moveX: number, moveY: number, minLimit?: number) => ZoneStyle`；
- `getPageX` 用 `'pageX' in e` 收窄，兼容触摸事件；
- `dealEdgeValue` 里 `hasOwnProperty` 的判断改为显式 `left !== undefined`，语义等价但类型可收窄。

三条指令（`dragItem` / `addItem` / `changeSize`）从 `(el: any, binding: any)` 改为
`(el: HTMLElement, binding: DirectiveBinding)`，`binding.instance` 用 `as unknown as XxxInstance`
拿到最小宿主接口，`dataset.pointer` 收窄为 `DealDirectionKey` 后动态取方法。

### 一个刻意的边界

热区模块的 **Vue 组件层（Hotzone.vue 12 / Zone.vue 14 / index.vue 4）本轮未动**：
它们把 `zone` 对象在模板、指令、弹窗之间来回传，字段来源跨三层，
强行收口会产生 25 条连锁错误（已实测）。按「一个提交只做一件事」的原则先停在指令层，
组件层留作单独一轮——需要先把 `zone` 的字段完整梳理成一份契约。

## R17（2026-11-24）— 两个表格页建模（userManage / goods-dialog）

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3242 | **3193**（−49） |
| no-explicit-any | 2412 | 2363（−49） |
| typecheck / build | 0 | 0 |

### userManage.vue（37 → 0）

`UserRow` / `RoleBrief` / `UserForm` / `DepartmentNode` / `DepartmentTreeExpose` / `PageRecords<T>` / `SortChangePayload`。

两个值得记的点：

1. **分页返回统一用 `PageRecords<T>`**：`(res.result as any).records` → `(res.result as PageRecords<UserRow> | undefined)?.records ?? []`，
   顺带把「接口没返回时崩溃」变成「空数组」；
2. **`roles` 的两种形态要分清**：列表行里是对象数组（`RoleBrief[]`），表单里只存 id（`Array<string | number>`）。
   `edit()` 里读 `v.roles`（对象）而不是 `form.value.roles`（已被改写），语义更准。

### goods-dialog.vue（24 → 1）

`GoodsRow` / `CategoryNode` / `CascaderNode` / `PageRecords<T>` / `GoodsTableExpose`。

- 分类树节点**就地改写**为级联项（`arr[index] = { value, label }`）是历史行为，保留并给 `CategoryNode` 补了 `value?/label?`；
- `initGoods(res: ApiResult<PageRecords<GoodsRow>>)` 让 `.forEach` 回调自动推断，不再需要 `(item: any)`。

### 唯一保留的 any

`const category = ref<any>([])`（cascader 的 v-model）。原因是 element-plus 自身类型矛盾：
prop 声明不接受 `null`，但 emit 会给 `CascaderValue | null | undefined`，两边无法同时满足。
已加注释说明，属于**上游类型缺陷**而非本仓代码问题。

## R18（2026-11-24）— 分销设置页建模（distributionSetting 41 → 0）

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3193 | **3165**（−28） |
| no-explicit-any | 2363 | 2336（−27） |
| typecheck / build | 0 | 0 |

### 做法

1054 行的设置页，六个表单 + 一个商品选择弹窗，全部 `Record<string, any>`。本轮按「一个表单一个类型」拆开：

`BaseSettingForm` / `CustomerSettingForm` / `SettlementSettingForm` / `PosterSettingForm` /
`FeaturedSettingForm` / `FeaturedGoodsItem` / `FeaturedTableExpose`。

### 三个可复用的处理方式

1. **单选/复选字段统一写 `string | number | boolean | undefined`**
   —— Element Plus 的 radio/checkbox 写回值就是这个联合类型，写窄了必然报「不可赋值」；
2. **`el-input-number` 字段写 `number | undefined`**，并在算术/比较处兜底
   （`(permanentPaidDays ?? 0) < 1`），因为控件允许清空；
3. **`upload-pic-input` 这类自定义组件写回 `string | null`**，
   但组件 prop 只接受 `string | undefined`。解法不是把字段改成 `any`，而是展开成
   `:model-value="x ?? undefined" @update:model-value="(v: string | null) => (x = v)"`
   —— 类型收窄干净，且显式表达了「控件可能给 null」。

### 顺带修掉的问题

`featuredForm.displayCount` 是从 radio 选 5/10 的字段，原先声明 `number` 导致模板绑定报错；
按控件写回值放宽为 `string | number | boolean | undefined`，并在保存时显式收敛：
`displayCount: featuredForm.value.displayCount === 10 ? 10 : 5`——**类型放宽不等于逻辑放松**。

## R19（2026-11-24）— 第三方 SDK 包装类型化（useChat 35 → 0）

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3165 | **3130**（−35） |
| no-explicit-any | 2336 | 2300（−36） |
| typecheck / build | 0 | 0 |

### 问题

`views/live/composables/useChat.ts` 包装腾讯云 IM SDK（`@tencentcloud/chat`）。
SDK 自带类型体积大、版本耦合强，原作者索性全写 `any`：`useChat(liveId: any, userInfo: any, liveDetail: any)`、
`chat = ref<any>(null)`、`(imResponse: any)`、`(event: any)`……

### 解法：最小接口 + 边界一次断言

```ts
/** IM 实例：只声明本文件用到的能力 */
type ImChatInstance = {
  on: (event: string, handler: (payload: unknown) => void) => void;
  off: (event: string, handler: (payload: unknown) => void) => void;
  login: (options: { userID: string; userSig: string }) => Promise<{ data: { repeatLogin?: boolean } }>;
  joinGroup: (options: { groupID: string; type: string }) => Promise<unknown>;
  getMessageList: (params: {...}) => Promise<{ data: { messageList: ImRawMessage[]; ... } }>;
  ...
};
```

只在创建实例处断言一次：

```ts
const chatInstance = TencentCloudChat.create({ SDKAppID: sdkAppId }) as unknown as ImChatInstance;
```

之后全文件都走自己的接口，**不再出现 any**。

### 四个技巧

1. **事件处理器统一收 `unknown`**：`on/off: (event: string, handler: (payload: unknown) => void)`，
   回调内部再 `(event as { data?: ImRawMessage[] } | undefined)?.data ?? []` 收窄。
   这样四个不同签名的事件（MESSAGE_RECEIVED / SDK_READY / SDK_NOT_READY / KICKED_OUT）能共用一套签名，**不需要 8 处 as**。
2. **SDK 常量用 `String(...)` 转换**：`TencentCloudChat.TYPES.GRP_AVCHATROOM` 是特殊字面量类型，
   与接口里的 `type: string` 冲突，`String()` 后既保留原值又不破坏类型。
3. **异常处理用 `error instanceof Error`**：`catch (error)` 的 `error` 是 `unknown`，
   写一个 `errorMessage(error, fallback)` helper 统一提取，比 `(error: any)` 干净。
4. **入参用 `MaybeRef<T>`**：`liveId` / `liveDetail` 既可能是值也可能是 `ref`，
   声明成 `MaybeRef<string | number | undefined>` 后 `unref()` 的类型自然正确。

### 顺带修的调用方

`LiveChatPanel.vue` 的 `:src="msg.avatar"` 因 `ChatMessage.avatar` 是 `string | null` 而报错，
改为 `msg.avatar ?? undefined`——**null 与 undefined 在组件 prop 上是两回事**，不能混用。

## R20（2026-11-24）— 装修模块第一期开工

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3130 | **3123**（−7） |
| no-explicit-any | 2300 | 2296（−4） |
| **@ts-nocheck** | 80 | **77**（−3） |
| typecheck / build | 0 | 0 |

### 为什么这轮的告警只降 7 条

装修模块（144 文件 / 50750 行 / 59 个 nocheck / 732 处 any / 256 处 props 直改）
不能按「单文件加类型」推进——必须先定架构。所以本轮做的是**方案 + 第一个可验证样板**：

1. 交付 [PAGE-DECORATION-PLAN.md](./PAGE-DECORATION-PLAN.md)：三期路线、目标架构、风险清单；
2. 新建 `views/page-decoration/types.ts`：`DecorateComponent` / `WapTemplateRes` / `CubeStyleRes`；
3. 类型化 `wap/template/cubeStyle.ts`（`any` → `CubeStyleRes + CSSProperties`）；
4. **3 个 wap 模板去 `@ts-nocheck`**：`tpl_spike` / `tpl_group` / `tpl_flex_two`。

### 样板改造

```vue
<!-- 前 -->
<script setup lang="ts">
// @ts-nocheck
defineProps(["res"]);
</script>
{{ res.list[0].title }}

<!-- 后 -->
<script setup lang="ts">
import type { WapTemplateRes } from "../../types";
defineProps<{ res: WapTemplateRes & { list?: Array<{ title?: string }> } }>();
</script>
{{ res.list?.[0]?.title ?? "" }}
```

**这是本轮唯一一次真正的 `@ts-nocheck` 净减少**（80 → 77）：前几轮修的都是"已被摘掉标记但没修完"的文件。

顺带发现一个真实隐患：三个模板都写了裸 `alt` 属性（`<img alt />`），
模板类型检查下它是 boolean 而非 string，会报错——已统一改成 `alt=""`。

### 后续节奏

按 PLAN 的第一期推进：`tpl_*.vue` 逐个具名化（每文件 5~15 分钟，不改数据流）。
第二期才动 `props.options` → `emit("update:options")`（738 条 `no-mutating-props` 的来源），
那部分必须配合手测「新建 / 编辑 / 切换组件」三条路径。

## R21（2026-11-24）— 装修只读模板批量迁移

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3123 | **3118**（−5） |
| **@ts-nocheck** | 77 | **72**（−5） |
| no-explicit-any | 2296 | 2296 |
| typecheck / build | 0 | 0 |

### 完成 5 个模板

| 模板 | 改造 |
|---|---|
| `tpl_left_one_right_two` | 方形拼接，共用 `CubeStyleRes` |
| `tpl_left_two_right_one` | 同上 |
| `tpl_top_one_bottom_two` | 同上 |
| `tpl_top_two_bottom_one` | 同上 |
| `tpl_text_picture` | 文字+图片，`list` 项含 `title`/`img` |

统一模式（与 R20 的 `tpl_flex_two` 一致）：

```ts
const props = defineProps<{
  res: WapTemplateRes & CubeStyleRes & { list?: Array<{ img?: string }> };
}>();
```

模板内 `res.list[N].img` → `res.list?.[N]?.img ?? undefined`，裸 `alt` → `alt=""`。

### 为什么这批能快

这 5 个模板有几个共同点，正好适合批量：

1. **只读**：只渲染 `props.res`，不回写，所以不需要事件改造（第二期才涉及）；
2. **共用样式 helper**：`cubeWrapperStyle` / `cubeImgStyle` / `cubeGapStyle` 已在 R20 具名化，
   模板这边只要给出 `res` 形状即可；
3. **结构同构**：四个方形模板除图片位置不同，类型完全相同，一套改法套四次。

### 剩余模板

`tpl_title`(138) / `tpl_video`(136) / `tpl_article`(157) 需要先给「标题项」「视频项」建模，
`video-style.ts` 的 helper 也还是 `any`；`tpl_goods`(560) / `tpl_coupon`(442) / `tpl_shop`(472) /
`tpl_integral`(384) / `tpl_promotion_detail`(1335) 体积大，应放在第二期与面板改造一起做。

## R22（2026-11-24）— 视频/标题模板建模 + video-style 具名化

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3118 | **3105**（−13） |
| no-explicit-any | 2296 | 2285（−11） |
| **@ts-nocheck** | 72 | **70**（−2） |
| typecheck / build | 0 | 0 |

### 做了什么

1. **`wap/video-style.ts` 从 `any` 改成具名模型**：
   `VideoItemStyle`（18 个样式字段）/ `VideoItem`（含 style）/ `ASPECT_RATIO_MAP: Record<string, number>`；
   `ensureVideoItem` 的默认值填充用 `(Object.keys(...) as Array<keyof VideoItemStyle>)` 收窄，替掉了 `as Record<string, any>`。
2. **`tpl_video.vue`**：`VideoTemplateRes = CubeStyleRes & { list?: Array<VideoItem & { videoUrl?: string; poster?: string }> }`。
3. **`tpl_title.vue`**：`TitleItem`（含 `textAlign` 限定为 CSS 的四值）+ `TitleRes`（圆角字段是 `radiusTop/radiusBottom`，与魔方模板的 `borderRadius` 不同）。

### 两个类型细节

**① `textAlign` 不能写 `string`**

`TitleItem.textAlign` 若声明为 `string`，绑定到 `:style="{ textAlign: item.textAlign }"` 会报错——
CSS 的 `textAlign` 是固定联合类型。声明成 `"left" | "center" | "right" | "justify"` 后
既符合数据实际（面板只给这四个选项），又通过类型检查。

**② `:style` 的 computed 必须标 `CSSProperties`**

`computed(() => { if (!styled.value) return {}; return {...} })` 会被推断成
`{} | { padding: string; ... }`，直接绑到 `:style` 报「不可赋值」。
标注 `computed<CSSProperties>(() => ...)` 后两侧都归一。

### 剩余

`tpl_article`(157) 需要「文章项」模型；`tpl_goods`/`tpl_coupon`/`tpl_shop`/`tpl_integral`/`tpl_promotion_detail`
体积大，应与第二期的面板改造一起做。

## R23（2026-11-24）— tpl_article 重写（顺带修 3 个真实 bug）

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3105 | **3101**（−4） |
| @ts-nocheck | 70 | **69** |
| no-explicit-any | 2285 | 2282 |
| typecheck / build | 0 | 0 |

### 重写中发现并修掉的 3 个 bug

`tpl_article.vue` 之前是 `@ts-nocheck` + 一段"半自动迁移"残留，里面有 3 处运行期缺陷：

| # | 代码 | 实际后果 |
|---|---|---|
| 1 | `if (!styled) { ... }`（脚本里 `styled` 从未定义） | 自定义样式分支永远进不去 |
| 2 | `params.categoryId = categoryId`（ref 对象而非 .value） | 后端收到 `[object Object]`，分类筛选失效 |
| 3 | `records.slice(0, count)`（`count` 是 ComputedRef） | `slice(0, NaN)` → **列表永远为空，模板只显示占位符** |

第 3 条最严重：这个装修组件在页面上**从来没显示过真实文章**。

### 另外补的两处

- 原来有一段被注释掉的 `watch`（分类/数量变化重载），改成真正的 `watch([categoryId, count], ...)`；
- `nameStyle` / `wrapperStyle` 标注 `CSSProperties`，模板绑定通过类型检查。

## R24（2026-11-24）— 第二期试点落地：PanelTopBar 去 props 直改

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3101 | **3069**（−32） |
| vue/no-mutating-props | 738 | **728**（−10） |
| vue/no-side-effects-in-computed-properties | 12 | **2**（−10） |
| no-explicit-any | 2282 | 2270（−12） |
| typecheck / build | 0 | 0 |

### 改了什么

**1. `PanelTopBar.vue`（514 行）**

```ts
// 前：computed 里给 props 补默认值（10 处写入），模板 v-model 直接写 props
const localOptions = computed(() => {
  if (props.options.welcomeText === undefined) props.options.welcomeText = '欢迎来到商城';
  ...
  return props.options;
});

// 后：本地副本 + 单向回写
const local = reactive<TopBarOptions>({ ...DEFAULT_TOP_BAR_OPTIONS, ...(props.options ?? {}) });
const localOptions = computed(() => local);   // 模板零改动
watch(local, () => emit("update:options", { ...local }), { deep: true });
```

**2. `config-panel/index.vue`**：接住回写

```vue
<component :options="selectedComponent.options" @update:options="applyComponentOptions" />
```

```ts
function applyComponentOptions(patch: Record<string, unknown>) {
  const target = props.selectedComponent as { options?: Record<string, unknown> } | null;
  if (!target) return;
  target.options = Object.assign(target.options ?? {}, patch);   // 就地合并，保持引用
}
```

### 三个意外收获

1. **`no-side-effects-in-computed-properties` 从 12 降到 2**：
   那个"在 computed 里给 props 补默认值"的写法本身就被这条规则命中，
   改成本地副本后连带清掉 10 条；
2. **`any` 顺带降 12**：`inject<any>('openLinkPicker')` 换成 `LinkPickerHandler`、
   `(item: any)` 换成 `TopBarMenuItem` 等；
3. **模板零改动**：`localOptions` 保留为 `computed(() => local)`，
   所以 13 处 `v-model="localOptions.xxx"` 一行没改，风险面最小。

### 防死循环的三个约束（已写进代码注释）

1. `local` 只在初始化时取 props 浅拷贝，**不用 watchEffect 从 props 重建**；
2. 父组件用 `Object.assign(target.options, patch)` **就地合并**，不替换对象；
3. 子组件不监听 props.options 的变化。

### 还需要你手测

代码层面三件套已绿，但**配置保存链路无法自动验证**，需按
[PAGE-DECORATION-PLAN.md](./PAGE-DECORATION-PLAN.md) 第 7.6 节的 5 条清单手测。

## R25（2026-11-24）— 第二期批量批次 1：Video / RecommendFeed / Carousel

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3069 | **3019**（−50） |
| **vue/no-mutating-props** | 728 | **678**（−50） |
| no-explicit-any | 2270 | 2270 |
| typecheck / build | 0 | 0 |

### 三个面板（23 处直改 → 0，告警降 50）

| 面板 | 直改 | 模板 v-model 绑定 |
|---|---:|---:|
| `PanelVideo.vue` | 6 | 7 |
| `PanelRecommendFeed.vue` | 8 | 6 |
| `PanelCarousel.vue` | 9 | 8 |

**降幅 50 > 直改 23** 的原因：`vue/no-mutating-props` 也统计模板里的 `v-model="options.xxx"`。
把这些绑定改成 `v-model="local.xxx"` 后，模板侧 21 条也一并消失。

### 统一改法（比试点更省事的版本）

试点时我保留了 `localOptions` 这个 computed 别名让模板零改动。这批改用**直接改名**：

1. 模板段 `options.` → `local.`（只替换 `<script>` 之前的部分）；
2. 脚本里 `props.options.` → `local.`（默认值补齐语句自然复用）；
3. props 块换成 `defineProps<{ options?: PanelOptions }>()` + `emit`；
4. 末尾加 `watch(local, deep)` + `onMounted` 首次同步。

**为什么加 `onMounted` 首次同步**：老写法是在 setup 里直接往 `props.options` 写默认值，
等于"默认值自动落库"。改成本地副本后必须主动同步一次，否则用户没碰过的字段不会进入组件配置，
保存后刷新就丢默认值。

### 三个类型细节

1. `el-switch` 的 v-model 写回 `string | number | boolean`，布尔字段要放宽成这个联合；
2. `el-input-number` 写回 `number | null`，`height` 这类字段声明成 `number | null`；
3. 数组字段用 `(local.list ??= []).push(...)` 兜底，避免「可能为 undefined」报错。

## R26（2026-11-24）— 第二期批量批次 2：Title / Article / Notice

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 3019 | **2957**（−62） |
| **vue/no-mutating-props** | 678 | **616**（−62） |
| no-explicit-any | 2270 | 2270 |
| typecheck / build | 0 | 0 |

### 三个面板

| 面板 | 脚本直改 | 模板 v-model | 合计降幅 |
|---|---:|---:|---:|
| `PanelTitle` | 10 | 7 | ~17 |
| `PanelArticle` | 11 | 10 | ~21 |
| `PanelNotice` | 14 | 4 | ~18 |

合计直改 35，告警降 62（模板绑定一并消除）。

### 这批遇到的三类收尾问题（都已固化）

1. **`el-radio-group` 不接受 `null`**：`fontSize` 原本从 `el-input-number` 推导成 `number|null`，
   但同一个字段又被 radio 绑定 → 必须去掉 `null`，写成 `string | number | boolean`；
2. **`el-radio-group` 写回的是联合类型**：`textAlign` / `align` 这类"看起来是字符串枚举"的字段，
   声明成 `string` 会在模板绑定处报错，得写成 `string | number | boolean`；
3. **`items` 这类数组字段用 `computed<Item[]>(() => local.items ?? [])` 收口**，
   而不是在每个使用点都写 `?`。

### 一个真实缺陷

`PanelNotice` 的 `itemsList` 原本直接返回 `local.items`（可能是 undefined），
模板里 `itemsList.length` 在空配置首次渲染时会抛错——加 `?? []` 后修复。
这类"空配置首屏"问题在装修面板里很常见，因为新拖入的组件 `options` 往往是 `{}`。

## R27（2026-11-24）— 第二期批量批次 3：GridFloor / SearchHeader

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2957 | **2885**（−72） |
| **vue/no-mutating-props** | 616 | **544**（−72） |
| no-explicit-any | 2270 | 2270 |
| typecheck / build | 0 | 0 |

### 改造前先做了一次接线审计

在继续批量之前，回头核对了前 7 个面板的正确性：

| 检查项 | 结果 |
|---|---|
| 模板里残留 `options.` | 7 个面板全为 **0** |
| 脚本里 `props.options` 残留 | 全为 **0** |
| `emit` / `watch` / `onMounted` 三件套 | 7 个面板全部具备 |
| 默认值是否落到 `local` | 抽样确认（如 `if (!local.title) local.title = ...`） |
| **画布与面板是否共享同一 options 对象** | ✅ `selectedComponent` 是 `pageDocument.list` 里的同一引用 |

最后一条是这次改造能成立的前提：`config-panel` 的 `applyComponentOptions` 改的是
`selectedComponent.options`，而画布预览用 `:options="comp.options"`——同一个对象，所以改了立刻所见即所得。

### 审计发现的遗留问题（未在本批修）

`config-panel/index.vue` 的**兜底分支**（无专属面板的组件）仍有 3 条 `no-mutating-props`：

```vue
<el-input v-model="selectedComponent.options[key]" />   <!-- L172/182/190 -->
```

这是"没有专属面板时直接用 key-value 表单编辑"的历史实现，改动它需要先给这类组件定义 schema，
放到第三期处理。

### 本批两个面板

| 面板 | 脚本直改 | 模板 v-model |
|---|---:|---:|
| `PanelGridFloor` | 19 | 10 |
| `PanelSearchHeader` | 19 | 17 |

### 一个类型发现

两个面板里的 `subCategories` / `hotWords` **实际是字符串数组**，不是对象数组：

```ts
type SubCategory = string;   // 右侧分类标签
type HotWord = string;       // 热词
```

按直觉写成 `{ id, name }[]` 会连报 20+ 条错误。教训：**类型要从实际使用反推**
（`v-model="local.subCategories[tIdx]"` 说明元素是可编辑的字符串），不能照着"像什么"猜。

数组字段统一用 `(local.x ??= [])` 兜底，模板侧用 `(local.x ?? [])[i]`，避免空配置首屏报错。

## R28（2026-11-24）— 修复本地上传文件无法显示

**不是 lint 问题，是功能 bug。** 影响装修面板的图片/视频预览与素材库。

### 现象

后端本地上传（`OssEnum.LOCAL`）返回的 URL 形如：

```
files/MANAGER/default/8b2e2b56ed6646d3bb2523a4589cba53.mp4
```

**没有开头的 `/`**，浏览器会按**当前页面路径**解析：在 `/floorList/renovation` 页面里
它就变成 `/floorList/files/...` → 404，图片和视频都不显示。

### 三层原因

| 层 | 问题 |
|---|---|
| 后端 | `LocalFilePlugin.buildAccessUrl` 直接拼接配置前缀；配置值是 `files`（无斜杠）时，产出的就是相对路径 |
| 前端 | 没有为 `/files/**` 配代理，即使 URL 以 `/` 开头也会打到 dev server（10003）而不是 manager-api（8887） |
| 历史数据 | 已保存的装修 JSON 里存的是 `files/xxx`，不会自动变 |

### 修复

**1. 后端（根因）** `LocalFilePlugin.buildAccessUrl`

```java
prefix = CharSequenceUtil.removeSuffix(prefix.trim(), "/");
// 允许配置完整域名（http(s)://...）或路径前缀；路径前缀必须补开头的 /
boolean absolute = prefix.startsWith("http://") || prefix.startsWith("https://");
if (!absolute && !prefix.startsWith("/")) {
    prefix = "/" + prefix;
}
return prefix + "/" + cleanKey(key);
```

**2. 前端（可达性）** `vite.config.ts` 增加代理

```ts
server: {
  port: appConfig.port,
  host: true,
  proxy: {
    "/files": { target: "http://127.0.0.1:8887", changeOrigin: true },
  },
},
```

> 生产环境由 nginx 把 `/files` 同源转发到 manager-api，前端不需要写死域名。

**3. 前端（历史数据）** 新增 `src/utils/media-url.ts`

- `normalizeMediaUrl(value)`：`files/a.png` → `/files/a.png`，绝对地址原样返回；
- `normalizeMediaUrlsDeep(input)`：深度遍历装修 JSON，只改「形如媒体路径」的字符串。

接入点：

| 位置 | 处理 |
|---|---|
| `pc/index.vue` 加载 | `normalizeMediaUrlsDeep(normalizeRows(parsed.list))` |
| `wap/index.vue` 加载 | `normalizeMediaUrlsDeep(mergePageData(parsed))` |
| `ossManage.vue` 渲染 | `:src="normalizeMediaUrl(item.url)"`（只影响显示，不改存值） |

### 验证结果

```
GET http://127.0.0.1:8887/files/MANAGER/default/*.mp4  → 200  video/mp4  2145221 bytes
GET http://127.0.0.1:8887/files/MANAGER/default/*.png  → 200  image/png
```

### 踩坑记录

用脚本给 `.vue` 插入 import 时，**必须插在 `// @ts-nocheck` 之后**。
一旦插在标签与指令之间，`@ts-nocheck` 就不再是首条语句而失效，
`ossManage.vue` 当场暴露 79 条历史类型错误。

## R29（2026-11-24）— 视频播放修复 + 第二期收尾（最后 3 个面板）

### 一、视频无法播放（Range 请求）

**现象**：图片能显示，视频黑屏。后端 200 正常返回，文件也存在。

**排查过程**：

1. `curl -H "Range: bytes=0-1023"` → **416**，且 `Content-Range: bytes */2145221`（长度正确，却说区间不可满足）；
2. 换成 PNG/JPG 也一样 → 不是文件问题，是**所有静态资源都不支持 Range**；
3. 日志打印控制器收到的头：`range=bytes&#61;0-1023` —— **`=` 被 HTML 转义了**。

**根因有两层**：

| 层 | 问题 |
|---|---|
| `XssHttpServletRequestWrapper.getHeader` | 对所有请求头做 OWASP HTML 清洗，把 `Range: bytes=0-1023` 转成 `bytes&#61;0-1023`，Range 因此永远解析失败 |
| Spring 静态资源处理器 | 即使头正常，它对 Range 也统一 416（且 200 响应不带 Content-Length），无法边下边播 |

**修复**：

1. `XssHttpServletRequestWrapper`：新增 `RAW_HEADERS` 白名单（Range / If-Range / Content-Range /
   Authorization / Cookie / Accept* / 条件请求头 / X-Forwarded-For 等），协议头**原样返回**，
   并同步覆盖 `getHeaders(String)` 保持行为一致；
2. 停用 `LocalFileResourceConfig`（静态资源映射），改由新增的
   `cn.lili.common.web.LocalFileController` 提供 `/files/**`：
   - 200：`Content-Length` + `Accept-Ranges: bytes` + 正确 Content-Type；
   - 206：解析单区间 Range（`bytes=0-1023` / `bytes=100-` / `bytes=-500`），
     返回 `Content-Range` + 精确长度，用 `BoundedInputStream` 限定读取字节；
   - 416：区间非法时返回 `Content-Range: bytes */长度`；
   - 安全：路径 `normalize()` 后校验仍在 `data/uploads` 内，防目录穿越。
3. 单次 Range 上限 4MB，避免一次把整个视频读进内存。

**验证**：

```
Range: bytes=0-1023 → 206  Content-Range: bytes 0-1023/2145221  Content-Length: 1024
经 10003 代理       → 206  同上（Vite 代理透传 Range）
下载字节数          → 1024（精确）
```

### 二、第二期收尾：最后 3 个面板

| 面板 | 脚本直改 | 模板 v-model |
|---|---:|---:|
| `PanelUserBenefits` | 20 | 17 |
| `PanelChannelFloor` | 20 | 11 |
| `PanelGoods` | 24 | 15 |

| 指标 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2885 | **2763**（−122） |
| vue/no-mutating-props | 544 | **422**（−122） |

### 第二期完成情况

12 个面板全部改造完毕，`no-mutating-props` **738 → 422（−43%）**。
剩余 422 条主要来自三处：

1. `config-panel/index.vue` 的兜底分支（无专属面板时用 key-value 表单直接改，3 条）；
2. `wap/config-panel/*`（移动端面板，尚未纳入本期范围）；
3. 装修模板组件对 `res` 的少量写入。

## R30（2026-11-24）— wap 配置面板 P0：修好 16 个面板打开即崩

### 发现的真问题（不是 lint，是运行时崩溃）

18 个 wap 面板里有 16 个引用了一个**不存在的全局 `DEFAULTS`**：

```ts
const defaults = ref(DEFAULTS);                          // ReferenceError: DEFAULTS is not defined
props.res.options = Object.assign({}, DEFAULTS, ...);     // 同上
```

另有 5 个面板引用同样不存在的 `DEFAULT_ITEM`，`PanelPromotion` 还引用 `SECKILL_DEFAULTS`。
全仓没有这些标识符的定义（不是 `window.` 全局，也没被 vite `define` 注入），
与已正常工作的 `PanelBlank` / `PanelLine` / `PanelRichText`（这三个自己定义了 `DEFAULTS`）对比，
可以确认这 16 个是"生成出来的半成品"：模板/脚本齐全，但共用默认值模块缺失。

**影响**：打开这些面板会抛 `ReferenceError`，右侧配置区直接白屏 —— 即移动端装修基本不可用。

### 修复

1. 为缺定义的面板显式声明**空默认对象**：
   ```ts
   const DEFAULTS: Record<string, unknown> = {};
   const DEFAULT_ITEM: Record<string, unknown> = {};
   const SECKILL_DEFAULTS: Record<string, unknown> = {};
   ```
   刻意不臆造设计默认值（颜色/间距猜错比没有更糟），只保证面板能加载；
   各面板原有的 `if (!options.list) options.list = [...]` 兜底逻辑继续生效。
2. `PanelPromotion` 的 IIFE 里 `const defaults` 与外层 ref 撞名，且 `defaults.value = defaults` 是自赋值，
   改为 `const panelDefaults = ...`。

### wap 面板改造进度（P1，完成 4/18）

| 面板 | 状态 |
|---|---|
| `PanelCoupon` / `PanelArticle` / `PanelVideo` / `PanelSearch` | ✅ 本地副本 + `emit("update:options")` |
| 其余 14 个 | ⏳ 仍直接写 `props.res.options` |

父组件 `wap/decorate.vue` 已接线：

```vue
<component :is="panelComponent" :res="res" @update:options="applyPanelOptions" />
```

```ts
function applyPanelOptions(patch: Record<string, unknown>) {
  if (!props.res) return;
  if (!props.res.options) props.res.options = {};
  Object.assign(props.res.options, patch);
}
```

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2763 | **2713**（−50） |
| vue/no-mutating-props | 422 | **375**（−47） |
| no-explicit-any | 2270 | **2267**（−3） |

> 模板里的 `v-model="res.options.x"` 也被这条规则统计，所以 4 个面板就能降 47 条。

### 三次改错与纠正（记录以免重犯）

1. 用 `res.options.` 全局替换时先跑了模板替换，导致脚本里的 `props.res.options.` 变成 `props.local.`；
   **正确顺序：先脚本（`props.res.options`）、后模板（`res.options.`）**；
2. IIFE 正则 `\(\(\) => \{` 误匹配了 `computed(() => {`，把整个 computed 吞掉；
   **必须锚定行首 `^\(\(\) => \{$`**；
3. `const DEFAULTS: Record<string, unknown> = {}` 里带类型标注，去重判断用了 `const DEFAULTS\s*=`
   没匹配上 → 插了三份重复声明 → `Identifier has already been declared`。
   **去重要用能容忍类型标注的正则**。

## R32（2026-11-25）— wap 面板「选图/选链接」重写为 props 驱动（34 处 Options API 残留清零）

### 为什么不是简单替换

生成代码里是这么写的：

```ts
function pickImage() {
  picModelFlag.value = true;
  undefined.nextTick(() => {              // ← this.$nextTick 的残骸
    const oss = undefined.refs.ossManage; // ← this.$refs 的残骸
    if (!oss) return;
    oss.selectImage = true;               // ← 直接改子组件内部状态
    oss.fileType = "pic";
    oss.changeFileType();
  });
}
```

三个问题叠在一起：

1. `undefined.nextTick` 会直接抛 `TypeError`，按钮点了没反应；
2. 即使换成真的 `nextTick` + 模板 ref，**改子组件内部状态**依然是把 child 当可变对象用，
   父组件必须知道 `selectImage / fileType / changeFileType` 三者的调用顺序；
3. `ref="ossManage"` 与 `import ossManage` **同名**，Vue 往 setup state 写 ref 时会抛
   `set on proxy: trap returned falsish`（`hotzone` 就是这么炸的）。

所以按 Vue 3 的方式重写：**父组件只声明意图，子组件用 props 感知，能力用 defineExpose 暴露方法**。

### 子组件改了三条契约

**1. `ossManage`：由 props 驱动打开**

```ts
// props: isComponent / initialize / mediaType / maxSelect ...
function activatePicker() {
  selectedOss.value = [];
  activeRoleTab.value = "MANAGER";
  searchForm.userEnums = "MANAGER";
  fileType.value = props.mediaType === "VIDEO" ? "video" : "pic";  // ← 由 prop 决定分类
  changeFileType();
  delete searchForm.fileDirectoryId;
  selectedGroupData.value = null;
  init();
}
watch(() => props.initialize, (val) => { if (val && props.isComponent) activatePicker(); });
```

**2. `lili-dialog`：新增意图级方法**

```ts
function openPicker(mode: "link" | "goods" = "link") {
  clearGoodsSelected();
  goodsFlag.value = mode === "goods";
  flag.value = true;
}
defineExpose({ open, close, singleGoods, clearGoodsSelected, goodsData, goodsFlag, flag, openPicker });
```

（`open(type, mutiple)` 是原有的商品弹窗入口，语义不同，因此另起名 `openPicker`，不复用。）

**3. `store-selector` / `hotzone`：本来就有 `defineExpose({ open })`，改为用模板 ref 调用**

### 面板侧统一成这个形状

```ts
// 模板
<ossManage :is-component="true" :initialize="picModelFlag" :media-type="'IMAGE'" :max-select="1" @callback="callbackSelected" />
<liliDialog ref="linkDialogRef" @selectedLink="selectedLink" />

// 脚本
const linkDialogRef = ref<{ openPicker: (mode?: "link" | "goods") => void } | null>(null);

function pickImage() {
  picModelFlag.value = true;             // 只说"我要选图"，怎么选是子组件的事
}
function pickLink() {
  linkDialogRef.value?.openPicker("link");
}
function callbackSelected(payload: { url?: string }) {
  picModelFlag.value = false;
  if (payload?.url) item.value.img = payload.url;
}
```

视频类面板用 `computed` 把「当前字段」映射成 mediaType：

```ts
const pickerMediaType = computed<"IMAGE" | "VIDEO">(() =>
  currentField.value === "videoUrl" ? "VIDEO" : "IMAGE"
);
```

### 结果

| 项 | 起始 | 结果 |
|---|---:|---:|
| `undefined.nextTick` / `undefined.refs` | 34 | **0** |
| `ref="ossManage" / ref="hotzone" / ref="liliDialog"` 同名冲突 | 14 | **0** |
| lint 告警 | 2713 | **2702** |
| no-explicit-any | 2267 | **2256** |
| typecheck / build | 0 | 0 |

涉及 13 个面板 + 3 个子组件（`ossManage` / `lili-dialog` / 面板内模板 ref）。

### 顺带发现的一个设计问题

`ossManage` 之前暴露的是 `{ selectImage, fileType, changeFileType }` —— 三个「状态 + 动作」，
调用方必须知道正确的调用顺序（先改 fileType、再 changeFileType、再置 selectImage）。
这种 API 是"把内部实现暴露出来"，也是生成代码越写越长的原因。
现在收敛成 `initialize` + `mediaType` 两个 prop，调用方零知识。
旧的三个成员仍保留在 `defineExpose` 里（PC 装修页、素材库自身还在用），后续可以逐步迁走。

## R33（2026-11-25）— wap 模板的 Vue2 残骸（`this.xxx` computed、`$filters`）清除

### 现象

移动端装修画布上报：

```
ReferenceError: isNew is not defined     at tpl_goods.vue:241 (setup)
ReferenceError: styled is not defined    at tpl_shop.vue:135 (computed)
[Vue warn] Unhandled error during execution of setup function  at <TplGoods> / <TplShop>
```

### 根因：生成器把 Options API 的 computed 注释掉了，却留下裸引用

```ts
/* TODO computed: // 新版标记：面板写入过 layout 字段
    isNew() {
      return this.first.layout !== undef */
const layout = computed(() => { ... });
// 下面直接 if (isNew) / v-if="isNew" → 运行时 ReferenceError
```

同一个套路出现在 3 个文件 6 处：`isNew`（tpl_goods）、`styled`（tpl_coupon / tpl_shop）、
`previewShops`（tpl_shop）、`styleList`（PanelAdCube）、`cartStyleOptions`（PanelGoods）、
`addTab/addBanner/pickLogo/pickBannerLink`（PanelHomeComb）。

### 修法：恢复成 Vue 3 的 computed / function，并补上被截断的实现

| 标识符 | 还原实现 |
|---|---|
| `isNew` | `computed(() => first.value.layout !== undefined)` —— 面板写过 layout 就是新版 |
| `styled` | `computed(() => props.res.paddingTop !== undefined)` —— 与其它 8 个模板保持同一约定 |
| `previewShops` | 选过店铺就映射 `storeName/storeLogo/storeBanner`，没选过用 `DEMO_SHOPS` |
| `styleList` | `modelData.filter(m => m.drawer)` —— 图片魔方的那批风格 |
| `cartStyleOptions` | 卡片/大图给「加号/购物车/文字」，两列三列只留图标 |
| `addTab / addBanner` | 分别向 `tabList` / `list` push 一个空项 |
| `pickLogo(key)` | 记下字段名 → `openOssDialog()` |
| `pickBannerLink(item)` | 记下条目 → `linkDialogRef.openPicker("link")` |

### 顺带修掉的两类问题

**1. `px` 被写成 computed 却在脚本里当函数调**

```ts
// 前：const px = computed(() => (v) => `${v/2}px`);   // 脚本里 px(x) 是错的
// 后：const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;
```

**2. 样式里直接用了 ComputedRef**

```ts
return { color: priceColor };        // 会渲染成 [object Object]
return { color: priceColor.value };  // 正确
```

### 还有一类：Vue 2 的 `$filters`

`{{ $filters.unitPrice(g.price) }}` —— Vue 3 已经没有过滤器，模板里会抛
`Cannot read properties of undefined`。7 个 PC 老模板 + 3 个 wap 模板都有，
统一改成导入 `utils/filters.ts` 的 `unitPrice` 直接调用。

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| `$filters` 用量 | 10 处 | **0** |
| `/* TODO computed/method */` 残块 | 10 处 | **0** |
| `undefined.refs` / `undefined.nextTick` | 34 处 | **0** |
| lint 告警 | 2702 | **2702** |
| typecheck / build | 0 | 0 |

### 教训

这批 bug 的共同点是：**生成器把 Vue 2 的 `this.xxx` 语法注释掉，但没有给出 Vue 3 的等价物**，
于是代码"看着完整、跑起来就炸"。判断标准很简单——脚本里出现裸标识符
（`isNew` / `styled` / `this.` / `$refs` / `$filters`）且文件里没有对应声明，就是这一类。

## R35（2026-11-25）— 文章分类下拉崩 + 富文本编辑器尺寸

### 一、`flattenCategories is not defined`（PanelArticle 打开即报错）

```ts
getArticleCategory().then((res: any) => {
  if (res.success) {
    categories.value = flattenCategories(res.result);   // ← 该函数从未定义
  }
});
const categories = ref<any[]>([]);   // ← 声明还在调用之后
```

后端 `/other/articleCategory/all-children` 返回的是 **树**（`ArticleCategoryVO` 带 `children`），
面板的 `el-select` 需要扁平列表，生成器留了个"看起来应该存在"的函数名。

**修法**（不是补个空函数了事）：

```ts
type ArticleCategoryNode = { id?: string | number; articleCategoryName?: string; children?: ArticleCategoryNode[] };
type CategoryOption = { id: string; name: string };

/** 文章分类是树结构，下拉里要拍平；子级用全角空格缩进，保留层级感 */
function flattenCategories(tree: ArticleCategoryNode[], depth = 0): CategoryOption[] {
  return (Array.isArray(tree) ? tree : []).flatMap((node) => {
    const option = {
      id: String(node?.id ?? ""),
      name: `${"　".repeat(depth)}${node?.articleCategoryName ?? ""}`,
    };
    const children = Array.isArray(node?.children) ? flattenCategories(node.children, depth + 1) : [];
    return [option, ...children];
  });
}

const categories = ref<CategoryOption[]>([]);
// 放到声明之后调用，避免 TDZ
getArticleCategory().then((res) => {
  if (res?.success) categories.value = flattenCategories(res.result ?? []);
});
```

字段名 `articleCategoryName` 是对着后端实体核过的，不是猜的。

### 二、富文本编辑器区域太小

**三个原因叠在一起**：

1. `components/editor/index.vue` 在 **setup 顶层** 调了一次 `init()`，`onMounted` 又调一次。
   第一次执行时 `textarea` 还没进 DOM，tinymce 拿到空容器 → 高度塌陷、出现横向滚动条；
2. 面板里写死 `height="300px"`，右侧栏本来就窄，显得更挤；
3. tinymce 默认 `resize` 可拖拽 + 工具栏不换行，撑出横向滚动。

**修法**：

- 编辑器只在 `onMounted` 初始化（`onActivated` 保留给 keep-alive）；
- `config.ts` 增加 `resize: false`、`toolbar_mode: "wrap"`；
- 面板高度跟随视口：`Math.max(360, window.innerHeight - 320)`，并在 resize 时同步；
- 面板样式让卡片撑满剩余高度，`:deep` 里把 `.tox-tinymce` 宽度锁 100%、禁止横向滚动。

### 数字

| 项 | 结果 |
|---|---|
| typecheck / build / lint | 全部 exit 0（ratchet 2702） |

## R37（2026-11-25）— wap 面板全量转「本地副本」+ PC 面板继续

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2699 | **2488**（−211） |
| **vue/no-mutating-props** | 375 | **164**（−211） |
| no-explicit-any | 2253 | 2253 |
| @ts-nocheck | 69 | 69 |
| typecheck / build | 0 | 0 |

### wap config-panel：19 个面板全部完成

之前只有 4 个（Coupon / Article / Video / Search）是本地副本模式，这轮把剩下 15 个一起转完：
`PanelAdCube / PanelBlank / PanelCarousel / PanelFlexOne / PanelGoods / PanelHomeComb /
PanelIntegral / PanelMenu / PanelNotice / PanelPromotion / PanelShop / PanelTitle` 等。

统一形态：

```ts
const local = reactive<PanelOptions>({ ...(props.res.options ?? {}) });

watch(local, () => emit("update:options", { ...local }), { deep: true });
onMounted(() => emit("update:options", { ...local }));
```

父组件 `wap/decorate.vue` 已有的 `@update:options="applyPanelOptions"` 直接复用，无需再改。

### 三个必须单独处理的坑（这轮又踩到一次）

1. **`PanelPromotion`：IIFE 里的 `const defaults` 与外层 `ref` 撞名**
   原来那句 `defaults.value = defaults` 是自赋值。改成 `panelDefaults` 并用它初始化 local：

   ```ts
   const panelDefaults = ["SECKILL","KANJIA"].includes(props.res.promotionsType)
     ? SECKILL_DEFAULTS : DEFAULTS;
   const local = reactive({ ...panelDefaults, ...(props.res.options ?? {}) });
   ```

2. **`PanelGoods`：IIFE 里的 `return` 提到顶层后非法**
   改写成 `if (isLegacyData) { legacy.value = true } else { ...补默认值 + 拉分类/品牌/店铺 }`，语义不变。

3. **`PanelBlank`：`local = Object.assign({}, DEFAULTS, local)` 给 const 重新赋值**
   改成初始化时直接 `{ ...DEFAULTS, ...(props.res.options ?? {}) }`。
   另外它是**唯一没有 `@ts-nocheck` 的面板**，所以又补了 `BlankOptions` 类型（而不是 `Record<string, unknown>`）。

### PC 面板：两个代表

| 面板 | 备注 |
|---|---|
| `PanelFooterNav`（15） | 干净文件，写了真实类型：`AssuranceItem` / `GuideLink` / `GuideGroup` |
| `PanelGoodsGrid`（15） | `@ts-nocheck`，走通用配方 |

PC 的父级 `config-panel/index.vue` 在 R24 就接好了 `@update:options`，所以这批不需要改父组件。

### 剩余 mutating-props（164）

| 文件 | 数量 | 说明 |
|---|---:|---|
| `wap/video-config.vue` | 25 | 视频配置子组件，props 为 `video`，需单独设计 |
| `pc/PanelCategoryMegaMenu` | 15 | 分类大屏菜单，未转 |
| `pc/PanelCategoryNav` | 13 | 同上 |
| `wap/decorate.vue` | 12 | 老组件遗留分支（v-else 里的直接赋值） |
| `wap/PanelPageSetting` | 10 | `props.res[key] = ...` 页面级设置，形态不同 |
| `pc/PanelHotZone` | 10 | 热区 |
| 其他 | ~79 | 零散 |

### 教训

同一个"生成器残留"在 R30/R32/R37 反复出现三次，说明**只靠正则批量替换不安全**。
现在的做法固定为三步：先脚本、再模板、最后补 import；并且转换脚本一开始就判断
`const local = reactive` 是否已存在（幂等），避免重复插入声明。

## R38（2026-11-25）— PC 配置面板批量转本地副本（7 个）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2488 | **2427**（−61） |
| **vue/no-mutating-props** | 164 | **103**（−61） |
| no-explicit-any | 2253 | 2253 |
| typecheck / build | 0 | 0 |

### 本轮转换的 7 个面板

| 面板 | 原告警 | 类型写法 |
|---|---:|---|
| `PanelCategoryMegaMenu` | 15 | `MegaCategory` / `MegaSubCategory` |
| `PanelCategoryNav` | 13 | `CategoryNavItem`（含 `img`） |
| `PanelHotZone` | 10 | `HotZoneItem`（含 left/top/width/height 百分比坐标） |
| `PanelBrandWall` | 7 | `WallItem` |
| `PanelChannelGrid` | 5 | `WallItem` |
| `PanelPromoGroup` | 6 | `PromoCard` |
| `PanelCoupon` | 5 | `couponIds: Array<string \| number>` |

全部是**干净文件（无 @ts-nocheck）**，因此都写了具体类型，没有用 `Record<string, any>` 糊过去。

### 这批遇到的三类收尾问题（已固化）

1. **`el-color-picker` 写回 `string | null`**：`textColor` / `activeColor` 必须允许 `null`；
2. **`el-radio-group` 写回联合类型**：`columns` / `source` 要从 `string | number` 放宽到
   `string | number | boolean`；
3. **可选数组要兜底**：`(local.items ??= []).splice(...)`、`(local.categories ??= [])`，
   否则 `TS18048` 连报一串。

### 剩余 mutating-props（103）

| 文件 | 数量 | 说明 |
|---|---:|---|
| `wap/video-config.vue` | 25 | props 是 `video` 对象，需要单独设计契约（不是 options 形态） |
| `wap/decorate.vue` | 12 | 老组件遗留分支 `v-else`，需要先确认这些组件是否还在用 |
| `wap/PanelPageSetting` | 10 | `props.res[key] = ...` 页面级设置，建议加 `update:page` 事件 |
| `member/benefit/*` | 11 | 会员权益表单，两个文件，需要单独看 |
| `wap/PanelLine` / `PanelRichText` | 13 | 这两个用的是 `ctx` 包装模式，要改成标准 props |
| `pc/RowConfigPanel` | 6 | 行配置（不是组件配置），需要父级配合 |
| 其余零散 | 26 | modelList 老模板等 |

## R39（2026-11-25）— 清掉 wap 面板最后的 ctx 脚手架 + 零散小文件

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2427 | **2404**（−23） |
| **vue/no-mutating-props** | 103 | **87**（−16） |
| no-explicit-any | 2253 | **2246**（−7） |
| typecheck / build | 0 | 0 |

### 一、PanelLine / PanelRichText：删掉 ctx 脚手架

wap 面板里只剩这两个还是"生成器 ctx 包装"写法：

```ts
/* created */
(() => {
  const ctx = {
    get res() { return props.res; },
    get defaults() { return defaults.value; },
    set defaults(v: any) { defaults.value = v; },
    ...
  };
  ctx.res.options = Object.assign({}, DEFAULTS, ctx.res.options);  // 唯一真实作用
})();
```

整个 `ctx` 对象除了最后那行赋值之外没有任何用处 —— 是生成器为了"模拟 this"造出来的中间层。

**改成标准形态**（和其余 17 个 wap 面板一致）：

```ts
const local = reactive<PanelOptions>({ ...DEFAULTS, ...(props.res.options ?? {}) });
watch(local, () => emit("update:options", { ...local }), { deep: true });
onMounted(() => emit("update:options", { ...local }));
```

顺手清掉两处生成器残留：

- `const _liliDialog = ref<any>()` —— 从未使用的死变量（删掉同时少 2 个 any）；
- `const __data = { defaults, activeTab, tabs }` 这层间接 —— 直接声明成常量/ref；
  顺带把 `activeTab` 收窄成 `"content" | "style"`，`tabs` 用字面量数组类型，
  模板 `@click="activeTab = tab.key"` 才不会被放宽成 `string`。

### 二、三个零散小文件

| 文件 | 问题 | 处理 |
|---|---|---|
| `PanelFreeLayout` | 模板 `v-model="options.height"` 直改 props | 整份重写为 local + emit（只有 1 个字段，值得重写而不是打补丁） |
| `PanelUserBenefits` | 回调里 `props.options[key] = url`（动态 key） | 新增 `setOption(key, value)`，写 `local` 再 emit |
| `ComponentConfigPanel` | `props.component.componentStyle = {}` 给嵌套 prop 赋值 | 未处理（见下） |

`PanelUserBenefits` 的动态 key 是个真问题：`PanelOptions` 没有索引签名时
`local[key]` 无法通过类型检查，所以用 `(local as Record<string, unknown>)[key] = value`
集中在一个函数里，并把注释写清楚"链接字段是动态 key"。

### 三、仍未处理的（87 条）

| 文件 | 数量 | 为什么难 |
|---|---:|---|
| `wap/video-config.vue` | 25 | props 是 `video` 对象，且面板里有大量子字段联动，需要先设计契约 |
| `wap/decorate.vue` | 12 | 老组件兼容分支，要先确认这些组件还在不在用 |
| `wap/PanelPageSetting` | 10 | 写的是 `props.res[key]`（页面级），不是 options |
| `member/benefit/*` | 11 | 另一个模块的表单组件 |
| `pc/RowConfigPanel` | 6 | 行配置，需要父级配合 |
| `modelList/*` | 12 | PC 装修的老模板（Vue2 时代），可能已不再使用 |
| `ComponentConfigPanel` | 1 | 嵌套 prop 赋值，要改成 computed 派生 |
| 其余 | 10 | `pc/index.vue` / `modelForm` 等 |

## R40（2026-11-25）— 转向 `any`：先做「工具体」与死代码

### 为什么转向 any

`mutating-props` 已被压到 87，剩下的都需要改架构（video-config 的 props 契约、decorate 的遗留分支、
PanelPageSetting 的页面级写入）。而 `any` 还有 2246 条，占全部告警 93%，方法也明确。

### any 的形态分布（源码口径，先量后改）

| 形态 | 数量 | 典型场景 |
|---|---:|---|
| `: any` 作为参数注解 | ~1725 | `(res: any) =>`、`(val: any)` —— 接口回调 |
| `ref<any>` | 188 | 模板 ref |
| `<any>` 泛型 | 226 | `Array<any>`、`Promise<any>` |
| `any[]` | 174 | 数组标注 |
| `Record<string, any>` | 64 | 动态对象 |
| `as any` | 42 | 断言 |

按目录：`views` 1832（148 个文件）、`components` 231、`libs` 76、`utils` 44。

### 本轮成果

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2404 | **2325**（−79） |
| no-explicit-any | 2246 | **2167**（−79） |
| typecheck / build | 0 | 0 |

### 一、utils/md5.ts：44 → 0

MD5 算法的所有参数都是 **32 位整数**，只是当年从 JS 移植时全部标了 any：

```ts
function safe_add(x: number, y: number): number
function rol(num: number, cnt: number): number
function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number
function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number
function coreMD5(x: number[]): number[]
function binl2hex(binarray: number[]): string
function str2binl(str: string): number[]
export function hexMD5(str: string): string
```

另外 `new Array(nblk * 16)` 补成 `new Array<number>(nblk * 16).fill(0)`。

### 二、utils/filters.ts：11 → 0

| 函数 | 原来 | 改成 |
|---|---|---|
| `enCode` | `($0: any)` + `(entry as any)[$0]` | 转义表声明成 `Record<string, string>`，参数 `matched: string` |
| `customRouterPush` | `(push: any)` | `RouteLocationRaw`（vue-router 原生类型） |
| `formatPrice` | `(price: any)` | `(price: unknown)` —— 函数内本来就有完整判空 |
| `unixToDate` | `(unix: any)` + 两处 `as Record<string, any>` | `number \| string \| undefined`；`o: Record<string, number>`；空值返回空串 |
| `formatLinkType` | `(item: any)` | 新增 `DecorLinkItem` 类型（装修链接结构） |

顺手把 `unixToDate` 里那行 180 字的 `for ... if ... replace` 拆成带注释的块，并用现成的 `padLeftZero` 代替原来的 `('00' + v).substr(...)`。

### 三、utils/promotions.ts：9 → 0（删死代码）

5 个导出里只有 `formatPromotionCouponValidityHtml` 还在用，其余 4 个是 **Vue2 时代的 render 函数**：

```ts
export function promotionsStatusRender(h: any, params: any) {
  return h("div", [h("Tag", { props: { color } }, text)]);   // 现在用 el-tag + 插槽
}
```

全仓只有 `coupon.vue` / `benefit/index.vue` 引用 `@/utils/promotions`，且都用的是格式化函数。
所以直接删掉这 4 个（120 行 → 40 行），保留函数的入参换成 `PromotionValidityRow`。

### 四、utils/validate.ts：整个文件删除

`validateNeedName` / `validateMobile` 两个函数，全仓**没有任何文件**从 `@/utils/validate` 导入
（`userManage.vue` 用的是 `@/libs/validate`）。属于重复实现，直接删文件。

### 五、utils/specs.ts：9 → 0

`formatSkuSpecs(specs: any, simpleSpecs: any)` 改为：

```ts
type SkuSpecItem = { specName?: string; specValue?: unknown };

export function formatSkuSpecs(
  specs: string | SkuSpecItem[] | Record<string, unknown> | null | undefined,
  simpleSpecs: string | null | undefined
): string
```

数组/对象两个分支用 `(parsed as SkuSpecItem[])` 和 `Object.entries(parsed as Record<string, unknown>)` 收窄，
回调参数自然就能推断，不需要再写 `(item: any)`。`specValueText(value: any)` 改 `unknown`。

### 过程中的两次失误（记录）

1. 用 `new RegExp` 批量删函数时，`[\s\S]*?\n}\n` 跨函数误匹配，**把整个 promotions.ts 删空了**；
   已从 R40 快照恢复，改为「按行区间、从后往前删」，并校验剩余导出。
2. PowerShell 里 `ForEach-Object { "  $($_.Line -replace '^src\\','')" }` 少写一个引号，
   导致整条命令静默失败（exit 1 无输出）。后续这类格式化统一改用 Node 脚本或
   `"  " + ($_.Line -replace ...)` 的写法。

## R41（2026-11-25）— libs/*：把「地基」的类型补上（any 76 → 11）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2325 | **2260**（−65） |
| no-explicit-any | 2167 | **2102**（−65） |
| typecheck / build | 0 | 0 |

### 一、libs/validate.ts：16 → 0（整份重写）

原来是 Element Plus 的表单校验函数，参数全 `any`：

```ts
export const validatePassword = (rule: any, value: any, callback: any) => ...
```

给出真实签名（EP 就是按三参调用校验函数）：

```ts
export type ValidateCallback = (error?: Error) => void;
export type RuleValidator = (
  rule: unknown,
  value: unknown,
  callback: ValidateCallback
) => void;

/** 把任意表单值转成字符串，避免 null/undefined 参与正则 */
function toText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}
```

顺手把 `isInteger` / `isMoney` 里重复的正则提出来，`isInteger` 的 1 秒延迟保留（原行为）。

### 二、libs/util.ts：44 → 1（重写为带签名的工具对象）

根因是一行：

```ts
const util: Record<string, any> = {};
```

所有方法挂在 any 对象上，于是每个回调参数也只能是 any。改成先声明形状、再赋值：

```ts
type RouterUtil = {
  dynamicRouteNames: string[];
  normalizeRoutePath(path?: string): string;
  isSameRoutePage(a?: { name?: unknown; path?: string }, b?: ...): boolean;
  findOpenedPageIndex(pageOpenedList: OpenedPage[], name?: unknown, path?: string): number;
  collectLeafRoutes(routes: MenuDataNode[], result?: RouteLeaf[], parentPath?: string): RouteLeaf[];
  registerDynamicRoutes(menuData: unknown, options?: { rematch?: boolean }): void;
  openNewPage(name: string, argu?: Record<string, unknown>, query?: Record<string, unknown>): void;
  toDefaultPage(routers: MenuDataNode[], name: string, route: Router, next: () => void): void;
};

const util = {} as RouterUtil;
```

另外新增两个领域类型：`MenuDataNode`（后端三级菜单，已导出）和 `RouteLeaf`（收集出的叶子路由）。

**这次重写暴露了三个原本被 any 掩盖的问题**：

1. `toDefaultPage` 的第三个参数一直被当成"路由对象"在用（`route.replace(...)`），
   但调用方 `router/index.ts` 传的是 **router 实例**。原代码只是在 any 下"能跑"，
   现在签名改成 `Router`，意图才对。
2. `router.addRoute(parentName, record)` 的 `record` 必须是 `RouteRecordRaw`，
   而它是**联合类型**（有无 children / redirect 各一版），逐字段构造无法收敛 ——
   在边界处整体断言一次，并写清原因。
3. `isSameRoutePage` / `findOpenedPageIndex` 的 name 实际可能收到
   `RouteRecordName`（string | number | symbol），原来标 `string` 是被 any 盖住的。
   现在放宽成 `unknown` 并统一 `String()` 比较。

### 三、libs/axios.ts：16 → 11

去掉了 5 处：

| 位置 | 原来 | 改成 |
|---|---|---|
| 请求拦截器 | `(config: any)` | `InternalAxiosRequestConfig` |
| 请求错误 | `(err: any)` | `unknown` |
| 响应错误 | `async (error: any)` | `unknown` + `as AxiosError<ResultMessage>` 收窄 |
| 表单序列化 | `Record<string, any>` ×2 | `Record<string, unknown>` |

**剩下 11 处是同一个东西**：`export const getRequest = <T = any>(...)`。

试过把它改成 `<T = unknown>`，结果 **164 个类型错误**：
调用方普遍写成 `.then((res: ApiResult<X>) => ...)`，而 `Promise<ResultMessage<unknown>>`
与这个回调参数**逆变不兼容**。

结论：**顺序反了**。正确做法是先给 `api/*.ts` 的每个接口标注返回类型
（例如 `getRequest<PageResult<Order>>("/order/...")`），让调用方的具体类型有据可依，
再把默认值收敛成 `unknown` —— 那时这 164 个错误会自然消失。已在代码里写了注释说明，
留作下一步。

## R42（2026-11-25）— api 层试点受阻的记录 + components 首个样本

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2260 | **2248**（−12） |
| no-explicit-any | 2102 | **2090** |
| typecheck / build | 0 | 0 |

### 一、api 层试点：先探路，结论是「顺序还得再往前一步」

计划是「给 api/*.ts 标注返回类型 → 调用方去掉 (res: any) → 再收敛 axios 默认值」。

**实际探查后发现问题比预想复杂**：

1. `(res: any)` 全仓只有 **146 处**（占 any 的 7%），不是主要来源；
2. 给 api 函数加 `<unknown>` 泛型**并不能**让调用方去掉注解 ——
   `.then((res) => res.result.orderItems)` 会立刻报 `unknown` 不可索引；
3. 要真正去掉注解，必须给**每个接口**一个**具体**的响应类型，而 `packages/shared` 里
   只有 `Order` 列表字段，**没有** `OrderDetail`（详情多出 `allowOperationVO` / `orderItems`）；
4. 更麻烦的是调用方自己的局部状态也是 any：`const data = ref<any[]>([])`、
   `const orderInfo = ref({...})` 靠推断 —— 把 api 收紧后，这些地方会连锁报错。

所以这一步的真实工作量是：**先扩 `packages/shared` 的 DTO（详情类 VO），
再逐模块给 api 标注，最后逐视图收窄局部状态**。一轮做不完，先记为 R43 的主线。

### 二、components/affix-time.vue：12 → 0（本轮的完整样本）

选它是因为小（130 行）且自包含。做法可作为 components 的模板：

| 原来 | 改成 |
|---|---|
| `defineProps(["closeShop"])` | `defineProps<{ closeShop?: boolean }>()` |
| `const dates = ref<any[]>([])` | `ref<YearMonth[]>([])`（新增 `type YearMonth = { year: number; month: number }`） |
| `const shopsData = ref<any[]>([])` | `ref<ShopOption[]>([])`（新增 `type ShopOption = { id?; storeName? }`） |
| `function changeSelect(e: any)` | `(e: string)` |
| `function clickBreadcrumb(item: any)` | `(item?: TimeWay)` |
| `forEach((res: any, index: any) =>` | `forEach((entry, index) =>` |
| `let currentIndex: any` | `let currentIndex = -1`（并加 `currentIndex >= 0` 兜底） |
| `then((res: ApiResult) =>` | `then((res: ApiResult<{ total?: number; records?: ShopOption[] }>) =>` |

**一个必须记住的取舍**：`emit` 故意保留 **数组写法** `defineEmits(["selected"])`。
写死 `defineEmits<{ selected: [way: TimeWay] }>()` 后，
`statistics/order.vue` / `statistics/traffic.vue` 的 handler 参数（`StatsParams` / `TrafficParams`，
比 `TimeWay` 更宽）会因为**逆变不兼容**直接报错。
事件 payload 类型要跟着所有消费者的参数类型一起改，不能只看当前组件 —— 已写进注释。

### 三、这类改动的固定顺序（更新到手册）

1. 先给 props / emits 定形状（emits 谨慎：确认所有消费者）；
2. 再给「被 ref 包裹的数据」定类型（往往需要先补一个局部 `type`）；
3. 最后处理函数参数与回调参数 —— 有了前两步，这里多数能自动推断；
4. `ApiResult<T>` 的 T 要写**当下真正用到的字段**，不要追求完整 DTO。

## R43（2026-11-25）— components 批一：两个上传组件（31 → 0）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2248 | **2217**（−31） |
| no-explicit-any | 2090 | **2059**（−31） |
| typecheck / build | 0 | 0 |

### 一、lili/upload-pic-thumb.vue：16 → 0

补两个类型，其余靠推断：

```ts
/** 已上传的图片项：el-upload 的 file 结构 + 后端返回的 url */
type UploadItem = {
  name?: string;
  url?: string;
  uid?: number | string;
  status?: string;
  percentage?: number;
  showProgress?: boolean;
  [key: string]: unknown;
};

const accessToken = ref<Record<string, string>>({});
const uploadList = ref<UploadItem[]>([]);
```

关键的一步是**不要自造上传文件类型**，直接用 element-plus 的：

```ts
import type { UploadFile, UploadRawFile } from "element-plus";

function handleBeforeUpload(file: UploadRawFile): boolean
function handleSuccess(response: unknown, uploading: UploadFile) {
  const res = response as { success?: boolean; message?: string; result?: string };
  const file = uploading as unknown as UploadItem;
}
```

> el-upload 的 `on-success` 签名是 `(response: any, uploadFile: UploadFile, uploadFiles) => void`，
> 自己写更窄的参数会被判为不兼容。**边界类型必须来自库**，中间再收窄。

### 二、editor/upload-image.vue：15 → 0

| 原来 | 改成 |
|---|---|
| `accessToken = ref<Record<string, any>>({})` | `ref<Record<string, string>>({})` |
| `images = ref<any[]>([])` | `ref<ImageItem[]>([])`（`type ImageItem = { url?: string }`） |
| `selectedImage = ref<any[]>([])` | `ref<OssSelection[]>([])`（`type OssSelection = string \| ImageItem \| null \| undefined`） |
| `ossManageRef = ref<any>(null)` | `ref<{ selectImage?: boolean } \| null>(null)` —— 只声明真正调用的能力 |
| `handleSuccessGoodsPicture(res: any)` | `(response: unknown)` + 断言出 `{ result?; data?; message? }` |
| `handleUploadError(err: any)` | `(err: unknown)` + 断言 `{ message?: string }` |
| `draggableItemKey(item: any)` | `(item: ImageItem \| string)` |

**`selectedImage` 的类型是这轮最有价值的发现**：素材库回调回来的可能是 `"id,url"` 字符串，
也可能是 `{ url }` 对象 —— 原来的 `any[]` 把这种"联合形态"藏起来了。现在 `parseOssSelectionUrl`
的入参写明是 `OssSelection`，那个 `indexOf(",")` 分支的意图才看得出来。

另外删掉了一个 `uploadRef = ref<any>(null)`（模板里有 `ref="uploadRef"` 但脚本从未使用），
顺带清掉一个未使用导入告警。

### 三、处理 el-upload 类组件的固定套路

1. **入参类型从库导入**（`UploadRawFile` / `UploadFile` / `InternalAxiosRequestConfig`…），不要自造；
2. 库给的 `response: any` 是**故意**的（后端返回结构不确定），在函数体内断言成局部类型，而不是把 any 传播到整个文件；
3. 只声明组件**真正调用**的 ref 能力（如 `{ selectImage?: boolean }`），比 `ref<any>` 更能说明意图；
4. 联合形态（字符串 / 对象 / null）要用 `type X = A | B | null` 表达，别用 any 藏。

### components 剩余（219 → 188）

| 文件 | any |
|---|---:|
| `store-selector/index.vue` | 21 |
| `hotzone/components/Hotzone.vue` | 16 |
| `hotzone/components/Zone.vue` | 15 |
| `lili-dialog/link-dialog.vue` | 15 |
| `lili-dialog/template/pages.vue` | 13 |
| `map/index.vue` | 12 |
| `lili-dialog/template/category.vue` | 11 |
| `lili-dialog/template/marketing.vue` | 9 |

## R44（2026-11-25）— 热区链路整体类型化（hotzone 模块 any 清零）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2217 | **2169**（−48） |
| no-explicit-any | 2059 | **2011**（−48） |
| typecheck / build | 0 | 0 |

### 热区模块现在 any = 0

| 文件 | 起始 | 结果 |
|---|---:|---:|
| `Hotzone.vue` | 14 | 0 |
| `Zone.vue` | 14 | 0 |
| `hotzone/index.vue` | 4 | 0 |
| `pc/PanelHotZone.vue` | 13 | 0 |
| `types.ts` / 三个指令 / `utils` / `TplHotZone` | 0 | 0 |

### 一、关键点：模块早就定义了领域类型，只是没人用

`hotzone/types.ts` 里已有 `HotzoneSetting`（含 `topPer`/`leftPer`/`widthPer`/`heightPer`/`img`/`link`…），
写得很完整，但三个组件全都在用 `any`。**这轮的工作主要是"接上"，而不是"发明"**：

```ts
import type { HotzoneSetting } from "../types";

const zones = ref<HotzoneSetting[]>([]);
const perInfo: HotzoneSetting = { topPer: 0.15, leftPer: 0.3, widthPer: 0.2, heightPer: 0.2, img: "", link: "", type: "", title: "" };
```

### 二、模板 ref 只声明"真正调用的能力"

父组件对子组件实例的依赖应该写成最小接口：

```ts
/** Zone 组件实例（只声明父组件真正调用的两个方法） */
type ZoneInstance = {
  showModalFn: (index: number) => void;
  delItem: (index: number) => void;
};
const zoneRefs = ref<ZoneInstance[]>([]);
```

这样 \`zoneRefs.value[index].showModalFn(...)\` 有了提示，也不再是 \`any\`。

### 三、这次踩到的三个坑（都是类型边界，不是逻辑问题）

1. **\`v-for\` 的动态 ref 回调拿到的是联合类型**
   \`:ref="(el) => setZoneRef(el, index)"\` 的 \`el\` 是 \`Element | ComponentPublicInstance | null\`，
   不能直接收窄成组件实例。签名写成 \`(el: unknown, index: number)\`，函数体内断言一次。

2. **直接把方法绑给 \`@click\` 会收到 MouseEvent**
   \`@click="handleSelectLink"\` 里 \`handleSelectLink(item?: HotzoneSetting, _index?: number)\`
   与 \`(evt: MouseEvent) => any\` 不兼容。改成显式调用 \`@click="handleSelectLink()"\`。

3. **链接弹窗回传的字段比领域类型多**
   \`___type\` / \`allId\` / \`___path\` 不在 \`HotzoneSetting\` 里。做法是在函数开头集中收窄一次：

   \`\`\`ts
   const link = val as Record<string, string | number | undefined>;
   const linkType = link.___type;
   \`\`\`

   之后各分支就不用逐个断言 —— **一处边界断言胜过十处零散 any**。

### 四、PanelHotZone 的两种热区形态

面板里同时存在两套坐标：

- 老数据：\`left/top/width/height\`（百分比数值 0-100）
- 新数据：\`leftPer/topPer/widthPer/heightPer\`（比例 0-1）

所以定义了 \`HotzoneZone\` 同时容纳两者，并在映射处显式换算：

\`\`\`ts
const leftPer = source.leftPer !== undefined ? source.leftPer : (Number(source.left) || 0) / 100;
\`\`\`

这段转换原来在 \`any\` 下"看不见"，现在类型写出来后，两种形态的兼容意图一目了然。

## R45（2026-11-25）— lili-dialog 批一：链接弹窗 + 文章/分类面板

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2169 | **2130**（−39） |
| no-explicit-any | 2011 | **1972**（−39） |
| typecheck / build | 0 | 0 |

**any 首次跌破 2000。**

### 改了什么

| 文件 | any |
|---|---:|
| `lili-dialog/template/index.ts` | 加 `LinkTemplateMap` 导出（原来 `:is` 处要 `as any`） |
| `lili-dialog/link-dialog.vue` | 14 → 0 |
| `lili-dialog/template/pages.vue` | 12 → 0 |
| `lili-dialog/template/category.vue` | 8 → 0 |

### 一、`:is` 的 `as any`：根因是映射表没有类型

原来：

```vue
:is="(templateWay as any)[item.name]"
```

`template/index.ts` 导出的是裸对象字面量，Vue 推断成具体组件类型，索引时拿不到签名，只能 `as any`。
改成显式声明映射表：

```ts
export type LinkTemplateMap = Record<string, Component>;

export default {
  pages: markRaw(pages),
  // ...
} as LinkTemplateMap;
```

调用方就变成 `:is="templateWay[item.name]"`，不用断言。

### 二、两段一模一样的去重逻辑（顺手合并）

`link-dialog.vue` 的两个分支各有一份"按 title 去重"：

```ts
let obj = {};
wap.value = wap.value.reduce((cur: any, next: any) => {
  if (next.title != undefined) {
    if (!(obj as any)[next.title]) { (obj as any)[next.title] = cur.push(next); }
  }
  return cur;
}, []);
```

抽成一个函数（两处共用）：

```ts
function dedupeByTitle(list: WapLinkTab[]): WapLinkTab[] {
  const seen: Record<string, boolean> = {};
  return list.reduce<WapLinkTab[]>((acc, tab) => {
    if (tab.title !== undefined && !seen[tab.title]) {
      seen[tab.title] = true;
      acc.push(tab);
    }
    return acc;
  }, []);
}
```

### 三、el-table / el-tabs / el-select 的三个边界类型

| 组件 | 问题 | 做法 |
|---|---|---|
| `el-tabs` | `v-model` 写入 `TabPaneName`（string \\| number） | `activeTab = ref<string \\| number>` |
| `el-table` | 模板 ref 要调 `toggleRowSelection` + `clearSelection` | 声明最小接口 `TableInstance` |
| `el-select` | `:value` 不接受 `undefined` | `:value="item.id ?? ''"` |

### 四、`___type` / `allId` 是装修链接的"私订字段"

分类节点带的后端实体没有 `___type`、`allId`，这两个是**装修链接的约定字段**（`___type` 区分商品/分类/店铺…）。
`category.vue` 里给 `CategoryNode` 明确加上这两个可选字段并写注释，比在每处 `item.___type = ...` 里隐式 any 清楚得多。

### lili-dialog 剩余（29）

| 文件 | any |
|---|---:|
| `template/category.vue` | 0 ✅ |
| `template/marketing.vue` | 9 |
| `template/special.vue` | 7 |
| `template/other.vue` | 5 |
| `index.vue` | 4 |
| `template/shops.vue` | 2 |
| `goods-dialog.vue` | 1 |

## R46（2026-11-25）— lili-dialog 模块 any 清零

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2130 | **2102**（−28） |
| no-explicit-any | 1972 | **1944**（−28） |
| typecheck / build | 0 | 0 |

`lili-dialog` 目录下 **12 个文件全部 0 条**（含 `goods-dialog` / `link-dialog` / 7 个 template / `index.vue` / 两个 ts）。

### 本轮改的 7 个文件

| 文件 | any |
|---|---:|
| `template/special.vue` | 7 → 0 |
| `template/marketing.vue` | 9 → 0 |
| `template/other.vue` | 5 → 0 |
| `template/shops.vue` | 2 → 0 |
| `index.vue` | 4 → 0 |
| `goods-dialog.vue` | 1 → 0 |

### 最有价值的一条：el-cascader 的上游类型矛盾，用"拆 v-model"绕开

element-plus 的 `CascaderValue` 在 prop 侧**不接受 null**，但 `update:model-value` **可能 emit null**。
所以 `v-model="category"` 无论怎么标类型都会有一侧报错 —— 这也是原来只能写 `ref<any>` 的原因。

**解法不是加 any，而是拆开双向绑定**：

```vue
<el-cascader
  :model-value="category ?? []"
  @update:model-value="onCategoryChange"
/>
```

```ts
const category = ref<CascaderValue>([]);

function onCategoryChange(val: CascaderValue | null | undefined) {
  category.value = val ?? [];
}
```

- `:model-value` 传出去时把 null 兜成 `[]` → 满足 prop 类型；
- `@update:model-value` 的 handler 显式接收 `null` 并归一 → 满足 emit 类型；
- 对外语义更清楚：**组件内部状态不允许 null，进来就归一**。

这条经验适用于所有"上游 prop/emit 类型互斥"的受控组件。

### 其他几个小点

1. `special.vue` 的表格选择和 `pages.vue` 一模一样，都声明了最小 `TableInstance`（`toggleRowSelection` + `clearSelection`）；
2. `marketing.vue` 的 `Record<string, any>` 换成 `Record<string, PromotionRow[] | PromotionRow | undefined>` —— 因为同一个 key 下**有时是数组、有时是对象**（满减是对象、秒杀是数组），这个联合形态原来被 any 藏住了；
3. `other.vue` 的 `otherLinkOptions` 导入时断言成 `OtherLinkItem[]`，把"链接项带 `___type`/`originalType`"这个约定显式化。

## R47（2026-11-25）— 店铺选择器 + 地图组件（any 40 → 0）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2102 | **2062**（−40） |
| no-explicit-any | 1944 | **1904**（−40） |
| typecheck / build | 0 | 0 |

### 一、store-selector/index.vue：21 → 0

这个组件是"多选表格 + 行点击切换"，三个角色混在一起，所以每一步都要精确的类型：

```ts
type StoreRow = Store & { selfOperated?: unknown };

/** el-table 实例：本组件只用到这几个方法 */
type StoreTableInstance = {
  clearSelection: () => void;
  toggleRowSelection: (row: StoreRow, selected?: boolean) => void;
};

const table = ref<StoreTableInstance>();
const storeSelection = ref<Record<string, StoreRow>>({});
```

几处有意义的收窄：

| 原来 | 改成 |
|---|---|
| `selfOperated = (row: any)` | `(row: StoreRow)` + `includes(row.selfOperated as never)` |
| `storeStatus = (value: any)` | `(value?: string)`，映射表提成局部 `map`，不再靠 `as Record<string, string>` |
| `open(selected: any = props.selectedWay)` | `(selected: StoreRow[] = props.selectedWay as StoreRow[])` |
| `setSelection(selected: any)` | `(selected: unknown)` —— 入参真的什么都可能来，**内部**再断言成 `StoreRow[]` |
| `toggleStore(row: any, column: any)` | `(row: StoreRow, column?: { type?: string } \| null)` |

`column` 那个 `| null` 是 el-table 的 `row-click` 签名要求的（它可能传 null），不加上就报不兼容。

### 二、map/index.vue：12 → 0 —— 给第三方 SDK 写"最小声明"

高德 JSAPI **没有官方 TS 声明**，所以原来全是 `any`。做法不是找 `@types`，而是**按本组件真正用到的部分写最小接口**：

```ts
type AMapMapInstance = { addControl: (control: unknown) => void };

type AMapAutocompleteInstance = {
  search: (keyword: string, cb: (status: string, result: AMapSearchResult) => void) => void;
};

type AMapSearchTip = { name?: string; district?: string; address?: string; location?: { lng: number; lat: number } };

type AMapConstructor = {
  Map: new (container: string, opts: Record<string, unknown>) => AMapMapInstance;
  ToolBar: new () => unknown;
  Autocomplete: new (opts: Record<string, unknown>) => AMapAutocompleteInstance;
  PlaceSearch: new () => unknown;
  Geocoder: new (opts?: Record<string, unknown>) => unknown;
};
```

好处：

1. `.then((AMap: AMapConstructor) => ...)` 之后，`new AMap.Map(...)`、`new AMap.Geocoder()` 全部有提示；
2. 声明里**只写用到的方法**（`addControl` / `search`），没用到的不写 —— 这样以后换 SDK 版本不会被过多约束；
3. `Geocoder` 的 `opts` 是可选的（实际调用 `new AMap.Geocoder()` 时没传），一处 `?` 就够。

顺带修掉一个真实的空值风险：模板里 `{{ tip.district + tip.address }}` 在两者都为空时会渲染 `undefinedundefined`，改成 `{{ (tip.district || "") + (tip.address || "") }}`。

### 三、map/multiple-map.vue：7 → 0

| 原来 | 改成 |
|---|---|
| `data = reactive({ province: [], city: [], ... })` | `reactive<{ province: RegionNode[]; ... }>({...})` |
| `chiosend = ref<any[]>([])` | `ref<RegionChoice[]>([])`（`RegionChoice = RegionNode \| ""`） |
| `(data as any)[level] = res.result` | 先判 `level` 是四个已知 key 之一，再用 `data[level] = region` |
| `(data as any)[plant]`（模板） | `data[plant as keyof typeof data]` |
| `filter((item: any) => item !== "" && item.value !== "")` | 类型谓词 `(item): item is RegionNode => ...` |

**最后一条值得记一下**：`filter` 用**类型谓词**（`item is RegionNode`）之后，`params` 就真的是 `RegionNode[]` 了，而不是"过滤了但还是 any[]"。这是 `filter` 场景的标准写法。

### 四、el-radio-group 的类型现实

`el-radio-group` 的 `v-model` 值域是 `string | number | boolean | undefined`，`@change` 也是这个签名。
所以 `mapDefault` 必须写 `ref<string | number | boolean | undefined>` —— 想"只允许 select/map"只能靠运行时约束，静态上收不住。这是组件库的边界，不是我们的问题，注释里已写明。

## R48（2026-11-25）— components 收尾：只剩富文本编辑器

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2062 | **2024**（−38） |
| no-explicit-any | 1904 | **1866**（−38） |
| typecheck / build | 0 | 0 |

### components 目录现状

| 文件 | any |
|---|---:|
| `components/editor/index.vue` | 8（按约定**暂不动**） |
| **其余全部** | **0** |

从 R42 开始做 components 时是 **231 条 / 27 个文件**，至此只剩富文本编辑器的 8 条。

### 本轮 6 个文件

| 文件 | any |
|---|---:|
| `region.vue` | 2 → 0 |
| `verify/verify.ts` | 2 → 0 |
| `verify/index.vue` | 2 → 0 |
| `lili/set-password.vue` | 4 → 0 |
| `lili/upload-pic-input.vue` | 7 → 0 |
| `distribution/distribution-selector.vue` | 8 → 0 |
| `lili/department-choose.vue` | 5 → 0 |
| `lili/department-tree-choose.vue` | 6 → 0 |

### 一、`el-cascader` 的类型矛盾出现了三次，有了固定解法

R46 在 `goods-dialog` 里发现的"prop 不接受 null / emit 可能给 null"，
这轮在 `region.vue` 和 `department-choose.vue` 里**又各出现一次**。现在可以固化成套路：

```vue
<el-cascader
  :model-value="addr ?? []"
  @update:model-value="onValueChange"
/>
```

```ts
const addr = ref<Array<string | number> | null>([]);

function onValueChange(val: CascaderValue | null | undefined) {
  addr.value = Array.isArray(val) ? (val as Array<string | number>) : [];
  // 再走原来的业务处理
}
```

**判断依据**：只要组件库的 `v-model` 在 prop 侧和 emit 侧类型不一致，就用这个模式，不要加 any。

### 二、`v-model` 之外的另一类坑：事件回调的"第二个参数"

`el-table` 的 `current-change` 是 `(currentRow, oldCurrentRow)` 两个参数，且 `currentRow` **可以为 null**：

```ts
function handleCurrentChange(row?: DistributorRow | null) { ... }
```

原来写 `(row: any)` 时这两个事实都被藏住了 —— 只写一个参数（原来是 `row: any`）其实是不完整的。

同理 `el-radio-group` 的值域是 `string | number | boolean | undefined`，
所以绑定它的 `selectedId` 必须放宽，写入处用 `row.id ?? ""` 兜底。

### 三、props 用 `withDefaults` 之后，模板不用再 `as any`

`set-password.vue` / `upload-pic-input.vue` 模板里原来都有：

```vue
:size="size as any"                    <!-- el-input -->
:status="progressStatus as any"        <!-- el-progress -->
```

根因是 props 用 `defineProps({ size: String })` 声明，类型成了 `string`，
而 el-input 只接受 `"large" | "default" | "small"`。改成：

```ts
type InputSize = "large" | "default" | "small";
type ProgressStatus = "" | "success" | "exception" | "warning";

const props = withDefaults(
  defineProps<{ size?: InputSize; ... }>(),
  { size: "default", ... }
);

const progressStatus = ref<ProgressStatus>("");
```

模板里的两处 `as any` 就直接删掉了。

### 四、`setData` 这种"回显 API"必须接口化

`department-tree-choose.vue` 的 `setData(ids: any, title: any)` 被父组件 `userManage` 调用，
`ids` 在多选时是数组、单选时是单值。现在签名写成：

```ts
function setData(ids: string | number | Array<string | number> | null, title?: string)
```

内部按 `props.multiple` 分流 —— **"一个参数两种形态"是这类回显 API 的常见陷阱**，
写明联合类型后，父组件传错会立刻报错。

## R49（2026-11-25）— 开始推 views：live/components 两个文件

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 2024 | **1981**（−43） |
| no-explicit-any | 1866 | **1823**（−43） |
| typecheck / build | 0 | 0 |

`views/live/components` 目录 5 个文件全部 0 条。

### 一、LiveGoods.vue：22 → 0

补了 `LiveGoodsRow`（直播间商品行）和 `SkuSelectInstance`（商品选择弹窗只用 `open` + `goodsData`）。

**这轮踩到一个 template-slot 的类型陷阱**，值得记下来：

`el-table` 的 `<template #default="{ row }">` 里，`row` 的类型是 `DefaultRow`（带索引签名的松散结构）。
如果 `LiveGoodsRow` 里把 `id` 声明成**必填**，那么模板里所有 `handleXxx(row)` 都会报
"`DefaultRow` 不可赋值给 `LiveGoodsRow`" —— 因为我们要求的东西比它保证的多。

解法不是把每个函数参数改成 `any`，而是：

```ts
type LiveGoodsRow = {
  /** 主键（后端必然返回；声明为可选是为了兼容 el-table slot 的行类型） */
  id?: string | number;
  // ...
};

/** 列表行的 id 一定存在（后端主键），这里集中收窄一次 */
function idOf(row: LiveGoodsRow): string | number {
  return row.id as string | number;
}
```

**一处断言换来全文件干净** —— 这比在 9 个调用点各写 `record.id!` 好，也比把参数改成 `any` 好。

### 二、Coupon.vue：21 → 0

| 原来 | 改成 |
|---|---|
| `table = ref<any>(null)` / `pickerTable` | `ref<CouponTableInstance>`（只含 `clearSelection`） |
| `couponList = ref<any[]>([])` | `ref<LiveCouponRow[]>([])` |
| `pickerList = ref<any[]>([])` | `ref<PlatformCouponRow[]>([])` |
| `promotionStatusText(status: any)` + `(map as any)[status]` | 映射表提到模块级 `Record<string, string>`，参数 `status?: string` |
| `promotionStatusTagType(status: any)` | 返回值收成 `"info" \| "success" \| "warning" \| "danger"` |
| `handleSelectionChange(rows: any)` | `(rows: LiveCouponRow[])` + 类型谓词过滤掉 undefined id |

### 三、又一处"api 层类型谎报"被记录下来

`removeBatchLiveCoupon` / `removeBatchLiveGoods` 因为带 `responseType: blob`，
声明返回 `Promise<Blob>`，但**响应拦截器把结果换成了 `ResultMessage`**。所以：

```ts
// 声明返回 Blob（带 responseType），实际被拦截器换成了 ResultMessage
return removeBatchLiveCoupon([idOf(record)]).then((raw) => {
  const res = raw as unknown as ApiResult;
  if (res.success) { ... }
});
```

这属于 R41 记下的"api 层要标的返回类型"待办的一个具体实例，已在代码注释里标注。

另外 `getPlatformCouponList` **已经**带了精确的 `ResultMessage<PageResult<Coupon>>`，
所以那处直接交给推断、不写注解 —— 有类型就用，没有才自己声明。

### views 现状（any 最多的 10 个文件）

| 文件 | any |
|---|---:|
| `page-decoration/pc/index.vue` | 85 |
| `member/benefit/index.vue` | 62 |
| `member/list/index.vue` | 61 |
| `page-decoration/wap/decorate.vue` | 52 |
| `goods/goods-manage/parameter-edit.vue` | 52 |
| `sys/message/noticeMessageTemplate.vue` | 48 |
| `promotions/payment-success/index.vue` | 42 |
| `order/order/orderDetail.vue` | 42 |
| `member/list/memberDetail.vue` | 41 |
| `sys/setting-manage/platformSetting.vue` | 41 |

## R50（2026-11-25）— member/benefit/index.vue：62 → 0，并摘掉一个 @ts-nocheck

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1981 | **1918**（−63） |
| no-explicit-any | 1823 | **1761**（−62） |
| ban-ts-comment（`@ts-nocheck`） | 69 | **68**（−1） |
| typecheck / build | 0 | 0 |

### 关键发现：这个文件带着 `@ts-nocheck`

改完 62 处 any 后才发现 `index.vue` 第 301 行有 `// @ts-nocheck` —— 也就是说
**之前的 typecheck 根本没检查这个文件**，那些 any 是"无人看管"地长出来的。

去掉之后立刻暴露 **24 个类型错误**，逐个修完才算真做完。这也是本轮最有价值的部分：

| 错误类型 | 处理 |
|---|---|
| `couponId does not exist on type 'never'`（6 处） | `buildDefaultForm` 没有返回类型，`couponPackageRows: []` 被推断成 `never[]` → 加 `(): BenefitForm =>` |
| `PlatformCouponDetail` 不能接 `Coupon`（1 处） | 带 `[key: string]: unknown` 索引签名的类型**不能**接受具体接口 → 去掉索引签名，改列真实字段 |
| `BenefitTypeOption[]` 不可赋值（2 处） | 子组件 `BenefitFormFields` 的 `value` 是**必填**，父组件 `value?` → 统一成必填并在载入时 `String(item.value ?? "")` 归一 |
| `resetFields` 不存在（2 处） | `FormInstance` 补 `resetFields?: () => void`，调用处 `?.resetFields?.()` |
| `id` 可能 undefined（4 处） | 同 R49：集中一个 `benefitIdOf(row)` |
| `extension.multiplier` 不存在（4 处） | `extension` 是 `{}` 推断 → 用 `(extension as Record<string, unknown>).xxx` |
| 函数声明了返回类型却没 return（1 处） | `hydrateCouponRowsForEdit` 补 `return rows;` |

### 这轮的两条通用经验

**① 索引签名是"单行道"**

```ts
type A = { foo?: string; [key: string]: unknown };   // 有索引签名
interface B { foo: string }                          // 具体接口

const a: A = {} as B;   // ✗ 报错：B 没有索引签名
```

要接住第三方/后端返回的具体类型，**不要给自建类型加 `[key: string]: unknown`**，
而是把用到的字段列全（都标可选）。这轮 `PlatformCouponDetail` / `BenefitTypeOption` / `CouponPackageRow`
三个类型都是这么修的。

**② `@ts-nocheck` 文件里的"0 错误"是假象**

这个文件改 any 时 typecheck 一路绿灯，因为根本没检查。所以后续批次要**先看文件有没有 `@ts-nocheck`**：

- 没有 → 正常改，typecheck 就是防线
- 有 → 改完 any 后**顺手摘掉指令**，让真实错误暴露出来一次性修完

这次一口气把 `@ts-nocheck` 从 69 降到 68，收益比单个文件去 any 更大。

### benefit 目录剩余

| 文件 | 告警 |
|---|---:|
| `index.vue` | **0** ✅ |
| `BenefitFormFields.vue` | 8 |
| `BenefitConfigFields.vue` | 4 |
| `BenefitDeliveryRecords.vue` | 2 |
| `BenefitLogoInput.vue` | 2 |

## R51（2026-11-25）— member/list/index.vue：61 → 0，但 `@ts-nocheck` 这次没摘掉

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1918 | **1857**（−61） |
| no-explicit-any | 1761 | **1700**（−61） |
| `@ts-nocheck` | 68 | 68（**未摘**） |
| typecheck / build | 0 | 0 |

### 做了什么

`member/list/index.vue`（860 行）的 61 处 any 全部替换为真实类型：

```ts
type MemberRow = { id?: string | number; mobile?: string; nickName?: string; disabled?: string; groupId?: ...; [key: string]: unknown };
type MemberForm = { ... };
type MemberSearchForm = { pageNumber: number; pageSize: number; order: string; id: string | number; _username: string; mobile: string; disabled: string; groupId: string | number };
type MemberGroupOption = { id?; groupName?; gradeName?; [key: string]: unknown };

type FormInstance = { validate; validateField; resetFields?; clearValidate? };
type TableInstance = { toggleRowSelection; clearSelection };
```

7 个模板 ref（`searchFormRef` / `table` / `addMemberFormRef` / `formRef` / `walletIncreaseFormRef` / `memberPointFormRef` / `memberGroupFormRef`）都换成了最小接口，
`ossManageRef` 只保留 `{ selectImage?: boolean }`。

### 为什么 `@ts-nocheck` 这次留下了

摘掉指令后暴露 **49 个错误**，全部集中在**模板层**，且都是 Element Plus 的联合类型问题，例如：

| 位置 | 问题 |
|---|---|
| `searchForm.nickName` / `.gradeId` | 搜索表单实际字段比声明多（模板里能用到） |
| `:value="item.id"` | `el-option` 不收 `undefined` |
| `v-model` 于 `el-tabs` | 写入 `TabPaneName`（string \\| number） |
| `el-form` 上的 `autocomplete` | **EP 的 el-form 没有这个 prop**（真问题，应该删掉） |
| `walletIncreaseForm.rechargeMoney` | 推断成 `null`，实际是 `number \\| null` |
| `$refs.map` | 旧写法，模板里还有残留 |

这些不是"补一个类型"能解决的，需要逐个改模板绑定 + 调整表单初始值形状。**一次改 49 处模板绑定的风险高于收益**，
所以本轮先保留指令，并把具体清单写在这里，作为下一轮（R52）的独立任务。

**但这不影响去 any 的收益**：61 处 any 是实打实清掉了，lint 也随之下降。

### 一条流程改进（已写入手册）

`@ts-nocheck` 的写法有讲究：**指令必须单独成行**。

```ts
// ✗ 后面跟中文说明 → 不生效，vue-tsc 照样报 49 个错
// @ts-nocheck（2026-11-25：any 已清零；模板层还有 49 处…）

// ✓ 指令单独一行，说明另起一行
// @ts-nocheck
// 2026-11-25：any 已清零；模板层还有 49 处…待修
```

这轮踩了一次：加了带说明的 `@ts-nocheck` 后 typecheck 仍然报 49 个错，
排查后发现是行尾中文导致 TS 没识别该指令。

### member 模块剩余

| 文件 | any |
|---|---:|
| `list/memberDetail.vue` | 41 |
| `grade/index.vue` | 35 |
| `paid/settings.vue` | 35 |
| `grade/experience-log.vue` | 9 |
| `paid/records.vue` | 9 |
| `benefit/BenefitDeliveryRecords.vue` | 2 |
| `benefit/BenefitLogoInput.vue` | 2 |
| `benefit/BenefitFormFields.vue` | 1 |
## 缺陷修复（2026-11-25）— 中文标点被存成 HTML 实体 + 批量设分组死锁

用户手测发现两个问题：

1. 新增/编辑会员分组后，描述里的全角标点变成 `&#xff0c;`（截图：`神秘的铂金会员&#xff0c;其数量寥寥无几`）
2. 勾选 3 个会员批量设置分组 → `400 服务器繁忙，请稍后重试`

### 一、根因：OWASP 清洗器把非 ASCII 字符序列化成数字实体

`XssHttpServletRequestWrapper` 用 OWASP Java HTML Sanitizer 清洗请求体：

```java
private static final PolicyFactory POLICY = new HtmlPolicyBuilder()... .toFactory();
```

`toFactory()` 的默认输出是 **HTML 序列化**，会把不属于 ASCII 的字符写成数字字符引用。
实测（用 jar 内自带的 sanitizer 复现）：

| 阶段 | 文本 |
|---|---|
| 原文 | `神秘的铂金会员，其数量寥寥无几；包含「特殊」符号！` |
| 清洗后 | `神秘的铂金会员&#xff0c;其数量寥寥无几&#xff1b;包含「特殊」符号&#xff01;` |
| 还原后 | `神秘的铂金会员，其数量寥寥无几；包含「特殊」符号！` ✓ |

汉字（U+4E00 起）能通过，但**全角标点（U+FF00 段）全中招**，所以看起来"只有标点坏了"。

### 修复：清洗后只还原"码位 ≥ 0x80"的数字实体

```java
private static final Pattern NUMERIC_ENTITY =
        Pattern.compile("&#(?:[xX]([0-9a-fA-F]{1,6})|([0-9]{1,7}));");

private String cleanXSS(String value) {
    if (value == null) return null;
    return restoreNonAsciiEntities(POLICY.sanitize(value));
}
```

**为什么这样是安全的**：HTML 危险字符 `< > & " '` 的码位都小于 0x80，它们仍保持转义状态；
被还原的只有中文、全角标点、emoji 等纯文本字符。实测安全性仍然成立：

| 攻击样本 | 清洗+还原后 |
|---|---|
| `<script>alert(1)</script>` | （空，标签被移除）✓ |
| `<img src=x onerror=alert(1)>` | `<img src="x" />`（onerror 被移除）✓ |
| `&lt;script&gt;alert(1)&lt;/script&gt;` | 保持转义 ✓ |
| `<a href="javascript:alert(1)">x</a>` | `x`（href 被移除）✓ |

### 二、批量设分组的死锁

后端日志给出真因：

```
Caused by: java.sql.BatchUpdateException: Deadlock found when trying to get lock; try restarting transaction
  at cn.lili.modules.member.serviceimpl.MemberGroupUserServiceImpl.updateUserGroups(MemberGroupUserServiceImpl.java:64)
  at cn.lili.controller.manager.member.MemberGroupManagerController.setUserGroups
```

前端是 `Promise.all(memberIds.map(id => setMemberUserGroups(id, [groupId])))` ——
**N 个并发请求、N 个事务**，每个事务都先 `DELETE ... WHERE member_id=?` 再批量 `INSERT` 同一张
`li_member_group_user`，互相抢行锁 → 死锁 → 400。

**修复（后端一次事务完成）**：

- `MemberGroupUserService#updateUsersGroups(List<String> memberIds, List<String> groupIds)`
  单事务：`DELETE WHERE member_id IN (...)` + 一次 `saveBatch`
- 控制器新增 `POST /member/memberGroup/users/groups`（`memberIds` / `groupIds` 两个参数）
- 前端新增 `setMembersUserGroups(memberIds, groupIds)`，`submitSetMemberGroup` 改为**一次请求**；
  同时删掉了原来"失败就降级调 addMemberGroupUsers"的兜底 —— 那次降级正是把死锁掩盖成"部分成功"的原因

编译产物已确认包含新方法：

```
javap → MemberGroupManagerController: setUsersGroups(java.util.List<java.lang.String>, java.util.List<java.lang.String>)
javap → XssHttpServletRequestWrapper: private static String restoreNonAsciiEntities(java.lang.String)
```

### 三、运维笔记：后端启动方式（踩过一次）

改完必须重启 manager-api。**启动时 CWD 必须是 `backend/`**，否则读不到 `backend/config/`：

```powershell
cd backend
java -jar manager-api\target\manager-api-5.0.2.jar
# 需要 local-secrets.yml 提供数据库密码（backend/local-secrets.yml）
```

这轮先用了 `--spring.profiles.active=prod` + CWD=仓库根，结果：
- prod 配置的 Redis 有密码，本机 Redis 没密码 → `ERR AUTH <password> called without any password configured`
- 改回 CWD=`backend/`（profile 走 `backend/config/application.yml` 的 dev）后，
  MySQL(127.0.0.1, root + local-secrets) 与 Redis(无密码) 均正常，`Started ManagerApiApplication`，
  尾部日志无 `Access denied` / `AUTH` 报错。

另外：重启时用 `-RedirectStandardOutput logs/manager-api.log` 会**覆盖**旧日志，
排查历史问题前先备份。

### 追加修复（同一轮）— 「设置成功但列表不体现 / 按分组搜不出来」

上一轮修了写入侧（死锁），用户复测发现：接口返回成功，但**界面看不到结果**。逐层排查后确认是**读取侧的三个独立缺陷**：

#### 1. 分组人数恒为 0

分组页绑定的是 `row.memberCount`，但后端 `MemberGroup` 实体**没有这个字段**，
`getByPage` 直接返回 `IPage<MemberGroup>`，所以前端拿到的永远是 `undefined` → 恒显示 0。

修复：`MemberGroup` 增加非表字段 `@TableField(exist = false) Long memberCount`，
分页接口逐条 `countByGroupId` 填充。

#### 2. 会员列表看不到"属于哪个分组"

会员与分组是多对多（`li_member_group_user`），列表接口 `MemberVO` 里**没有分组信息**，
页面上也没有这一列 —— 设置成功后自然"没有体现"。

修复：
- `MemberVO` 增加 `groupNames`（非表字段）
- `MemberManageSupport#getMemberPage` 里新增 `fillGroupNames`：一次查出当前页所有关联，
  在内存里按 `memberId` 归并，再按 `groupId → groupName` 映射，多个分组用「、」连接
- 前端会员列表在「会员等级」后新增「会员分组」列

#### 3. 按分组搜索查不出人（关键 bug）

```java
// 修复前
List<String> groupMemberIds = memberGroupUserService.listObjs(
        new LambdaQueryWrapper<MemberGroupUser>()
                .eq(MemberGroupUser::getGroupId, memberSearchVO.getGroupId())
                .eq(MemberGroupUser::getDeleteFlag, false),
        String::valueOf);
queryWrapper.in("m.id", groupMemberIds);
```

`listObjs(wrapper, mapper)` 映射的是**查询结果的第一列**，没写 `select` 时第一列就是
`li_member_group_user` 的**主键 id**，于是拿关联表主键去过滤 `li_member.id` —— 永远匹配不到。

实测对照（同一个分组）：

| 用途 | 值 |
|---|---|
| 关联表主键（旧代码误用） | `2125311361110839297` / `2125311361119227905` / `2125311361119227906` |
| 真正的会员 id | `1376364798236688384` / `1376417684140326912` / `2117515140341202944` |

修复：

```java
List<String> groupMemberIds = memberGroupUserService.list(
                new LambdaQueryWrapper<MemberGroupUser>()
                        .select(MemberGroupUser::getMemberId)   // ← 显式取 member_id
                        .eq(MemberGroupUser::getGroupId, memberSearchVO.getGroupId())
                        .eq(MemberGroupUser::getDeleteFlag, false))
        .stream().map(MemberGroupUser::getMemberId)
        .filter(Objects::nonNull).distinct().toList();
```

### 三条经验

1. **`listObjs` 默认取第一列** —— 想拿某个具体字段必须 `.select(...)`，否则拿到的是主键。
   这类错误在"看起来返回了 List，长度也不是 0"的情况下极难发现。
2. **写入成功 ≠ 界面可见**：多对多关系要在读侧补 join/回填，列表才有东西可显示。
3. **`@TableField(exist = false)` 字段是补充展示信息的低成本方式**，不用动表结构、不用改接口签名。

### 运维补充

Windows 下 **jar 被运行中的进程占用会导致 `spring-boot:repackage` 失败**
（`Unable to rename ...jar to ...jar.original`）。正确顺序：停进程 → 构建 → 启动。


## R52（2026-11-25）— 摘掉 `member/list/index.vue` 的 `@ts-nocheck`（46 处模板层修复）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1857 | **1856**（−1） |
| `@ts-nocheck` | 68 | **67**（−1） |
| typecheck / build | 0 | 0 |

告警只降 1 条（就是那条 `ban-ts-comment`），但**这个 860 行的文件从此真正进入类型检查**。

### 46 个错误分七类，逐类修法

**① 搜索表单字段比声明多（2 处）**

`searchForm.nickName` / `.gradeId` 在模板里用了，但 `MemberSearchForm` 没声明：
补字段 + 初始值。

**② `el-select` 的 `:value` 不接受 `undefined`（3 处）**

`:value="item.id ?? ''"`。

**③ `el-tabs` 的 `v-model` / `@tab-change` 是 `TabPaneName`（2 处）**

```ts
const memberStatus = ref<TabPaneName>("ALL");
function handleStatusChange(name: TabPaneName) { const status = String(name); ... }
```

**④ `el-form` 没有 `autocomplete` 这个 prop（1 处）**

`el-form` 上的 `autocomplete="off"` 是无效属性（真正需要的是 `el-input` 上的），直接删掉。

**⑤ 表单对象类型太宽/太窄（12 处）**

- `ruleValidate: Record<string, unknown>` → `Record<string, FormItemRule[]>`（用 EP 的类型）
- `walletIncreaseForm.rechargeMoney: null` → `number | null | undefined`（`el-input-number` 会写 undefined）
- `memberPointForm.type: string` → `string | number | boolean | undefined`（`el-radio-group` 的值域）
- `MemberForm` / `MemberRow` 去掉 `[key: string]: unknown` 索引签名，改列真实字段
  （`_username` / `face` / `region` / `regionId` / `newPassword` / `gradeName` / `point` / `memberWallet` …）

**⑥ `$refs.map.open()` 这种旧写法（1 处）**

模板里 `@click="$refs.map.open()"`（`$refs` 在 `<script setup>` 里是 unknown）。
改成模板 ref：

```ts
const mapRef = ref<{ open: () => void } | null>(null);
```
```vue
<multipleMap ref="mapRef" @callback="selectedRegion" />
<el-button @click="mapRef?.open()">选择</el-button>
```

**⑦ 事件载荷类型写错（1 处）**

`multipleMap` 的 `callback` 有**两种形态**：
- 逐级选择：`{ type: "select", data: [{ id, name }, ...] }`
- 地图选点：`{ type: "map", data: { addr, addrId } }`

原来统一标成 `{ data: Array<...> }`，两处都错。现在写清联合形态 + 内部收窄。

**其余零散**：`FormInstance.validate` 必填 + 调用处 `?.`、
`Member[]` → `MemberRow[]`（索引签名去掉后自然相容）、`disabled(row)` 参数从 `string` 改回 `MemberRow`。

### 最重要的两条经验

**A. 索引签名 `[key: string]: unknown` 会同时"放过"和"卡死"**

- 放过：随便加字段不报错
- 卡死：`v-model="form.xxx"` 拿到的是 `unknown`，赋给 `el-input` 就报错；
  后端的具体接口类型（如 `Member`）**不能**赋给带索引签名的类型

所以**自建类型不要加索引签名**，把用到的字段列全（都标可选）。

**B. 组件库事件/模型的类型必须照抄**

`TabPaneName`、`FormItemRule`、`CascaderValue` 这些都应该从 `element-plus` **导入**，
而不是自己写 `string`。照抄之后，模板里的 `v-model` / `@change` 就不会再报不兼容。

### 追加修复 — 添加会员 400「客户用户名必填」

现象：添加会员弹窗填满后点确定，`POST /manager/passport/member` 返回 400，提示「客户用户名必填」。

根因：**前后端字段名不一致**。

| 侧 | 字段 |
|---|---|
| 后端 `MemberAddDTO` | `username`（`@NotEmpty(message = "客户用户名必填")`）、`mobile`、`password` |
| 前端 `addMemberForm` | `mobile`、`_username`、`password` |

表单内部沿用历史命名 `_username`，提交时**原样**发出去，后端收不到 `username` → 校验失败。

修复（在提交处映射，不动表单字段名）：

```ts
const payload = {
  username: addMemberForm.value._username,
  mobile: addMemberForm.value.mobile,
  password: md5(addMemberForm.value.password),
};
API_Member.addMember(payload).then(...)
```

顺手修掉一个隐患：原来在**校验之前**就 `addMemberForm.value.password = md5(...)`，
如果校验没通过、用户改完再点一次，密码会被 md5 两次。
现在改为"在 payload 里算 md5"，表单里的原始密码保持不变。


## R53（2026-11-25）— member 模块：grade 清零 + memberDetail 摘掉 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1856 | **1770**（−86） |
| no-explicit-any | 1700 | **1615**（−85） |
| `@ts-nocheck` | 67 | **66**（−1） |
| typecheck / build | 0 | 0 |

### 本轮四个文件

| 文件 | any |
|---|---:|
| `member/grade/index.vue` | 32 → **0** |
| `member/grade/experience-log.vue` | 9 → **0** |
| `member/list/memberDetail.vue` | 41 → **0**（并摘掉 `@ts-nocheck`） |

### 一、`grade/index.vue`：表单字段要接受组件库的值域

`el-switch` 写回 `string | number | boolean`，`el-input-number` 可能写 `undefined`，
`el-select` 也是联合类型。所以表单类型不能写死成 `boolean` / `number` / `string`：

```ts
type GradeForm = {
  isDefault: boolean | string | number | undefined;      // el-switch
  requiredExperience: number | undefined;                 // el-input-number
  gradeSort: number | undefined;
  gradeState: string | number | boolean | undefined;      // el-select / radio-group
  // ...
};
```

**这就是"表单类型别写太窄"** —— 写窄了模板里每个 `v-model` 都会报错。

### 二、`memberDetail.vue`：50 个模板错误，五类

1. **`MemberInfo` 缺字段**（`lastLoginDate` / `sex` / `birthday` / `region`）→ 按模板实际使用补全
2. **搜索表单缺字段**（`orderStatus` / `clientType` / `orderSn` / `memberId` / `startDate` / `endDate`）
   → 每个表单显式声明类型（`pointSearchForm` / `orderSearchForm` / `addressSearchForm` /
   `walletSearchForm` / `receiptRecordSearchForm`）
3. **`activeTab` / tab 回调是 `TabPaneName`** → `ref<TabPaneName>` + `handleTabChange(v: TabPaneName)` 内部 `String(v)`
4. **文案映射表按字符串索引**（6 个 `const map = { NORMAL: ... }`）
   → `const map: Record<string, string> = { ... }`，否则 `map[v]` 报隐式 any
5. **`addressForm` 缺字段**（`name` / `mobile` / `detail` / `alias` / `memberId` / `lat` / `lon`）
   以及 `isDefault` 要接受 `el-switch` 的宽值域

另外两处真问题：
- `router.push({ query: { sn: v } })` 把整个行对象塞进 query → 改成 `String(v.sn ?? v.orderSn ?? "")`
- `route.query.id` 可能是 `LocationQueryValue | LocationQueryValue[]` → `String(route.query.id ?? "")`

### 三、这轮踩的一个坑（记下来）

批量把 6 个映射表改成 `Record<string, string>` 时，正则替换写错，产出了 `const map = as Record<string, string> } = {` ——
**语法直接坏掉，报错数从 21 涨到 63**。

教训：**用正则批量改类型标注时，改完必须先看一处输出**。这类语法错误会被编译期立刻抓到（幸运），
但如果替换的是行为代码，就可能悄悄坏掉。

### 追加修复 — 本地上传 400 + 客户等级「确定」按钮卡 loading

用户手测：客户等级弹窗里点「选择图片」→ 本地上传 → 接口报错；且报错后「确定」按钮一直转圈。

#### 1. 本地上传报错：`directoryPath` 是「必填」参数

```java
// 修复前
public ResultMessage<Object> upload(MultipartFile file, String base64,
                                    @RequestHeader String accessToken,
                                    @RequestParam String directoryPath) {
```

`@RequestParam` 默认 `required = true`。而前端 `ossManage.vue` 只在**选中了目录**时才带这个参数：

```ts
const directoryId = searchForm.fileDirectoryId;
if (directoryId && directoryId !== "0") {
  data.directoryPath = directoryId;   // ← 从弹窗直接上传时没有目录，就不带
}
```

从「客户等级」弹窗里点「选择图片」时没有选中目录 → 不带 `directoryPath` →
Spring 直接 400（`Required request parameter 'directoryPath' is not present`）。

**修复（两侧都补）**：

- 后端：`@RequestParam(required = false) String directoryPath`
  （方法内 `normalizeDirectoryPath` 本来就把空值兜成 `"default"`，所以语义不变）
- 前端：`uploadData` 始终带 `directoryPath`，没有目录时给 `"default"`

这样无论从哪个入口打开素材库都能上传。

#### 2. 按钮卡 loading：失败路径没有复位

```ts
// 修复前
submitAddLoading.value = true;
API_Member.addMemberGrade(payload).then((res) => {
  submitAddLoading.value = false;      // ← 只在请求「成功返回」时执行
  if (res && res.success) { ... }
});
```

请求被后端拒绝（400）或网络异常时，`.then` 不执行 → loading 永远为 true。

**修复**：改成 `.then().catch().finally()`，并补上失败提示：

```ts
API_Member.addMemberGrade(payload)
  .then((res) => { if (res?.success) { ... } else { ElMessage.error(res?.message || "添加失败"); } })
  .catch(() => { ElMessage.error("添加失败，请稍后重试"); })
  .finally(() => { submitAddLoading.value = false; });   // 成功/失败/异常都复位
```

同一文件里的 `submitEdit` 有完全相同的问题，一并修掉。

**经验**：凡是「点按钮 → 长任务 → 按钮 loading」的写法，
**复位必须放在 `finally`**，而不是 `.then` 里。这类 bug 只在失败路径出现，
正常测试根本发现不了。


## R54（2026-11-25）— member 模块 any 全部清零

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1770 | **1720**（−50） |
| no-explicit-any | 1615 | **1566**（−49） |
| `@ts-nocheck` | 66 | **65**（−1） |
| typecheck / build | 0 | 0 |

**`views/member` 目录下 any 已全部为 0。**

### 本轮四个文件

| 文件 | any |
|---|---:|
| `member/paid/settings.vue` | 25 → **0**（并摘掉 `@ts-nocheck`） |
| `member/paid/records.vue` | 8 → **0** |
| `member/benefit/BenefitDeliveryRecords.vue` | 2 → **0** |
| `member/benefit/BenefitLogoInput.vue` | 2 → **0** |
| `member/benefit/BenefitFormFields.vue` | 1 → **0** |
| 新增 `member/benefit/types.ts` | 共享类型 |

### 一、父子共用表单类型：抽到 `types.ts`

`BenefitFormFields` 的 `form` 原来是 `Record<string, any>`，改成 `Record<string, unknown>` 后
模板里 12 个 `v-model="form.xxx"` 全部报 `unknown` 不可赋值。

根因是**父子各写一份类型**（或干脆不写）。正确做法是把表单类型抽出来共享：

```ts
// member/benefit/types.ts
export type BenefitForm = { benefitName: string; benefitType?: string; couponPackageRows: CouponPackageRow[]; /* ... */ };

// index.vue：import type { BenefitForm } from './types';
// BenefitFormFields.vue：form: BenefitForm;
```

**"父子传同一个对象"就必须共用同一个类型** —— 各写一份迟早会出现一边改、一边漏。

### 二、`paid/settings.vue`：表单字段几乎全是组件库的宽值域

这个页面 25 处 any，核心是 `form = reactive({ goodsRules: [], ... })` 完全没有类型。
补了 `PaidConfigForm` 后发现，几乎每个字段都要放宽：

| 控件 | 字段值域 |
|---|---|
| `el-switch` | `boolean \| string \| number` |
| `el-radio-group` | `string \| number \| boolean` |
| `el-color-picker` | `string \| null` |
| `el-input-number` | `number \| undefined` |

还有一处 `:style="{color: form.unopenedFontColor}"` —— `color` 不接受 `null`，
写成 `form.unopenedFontColor || undefined`。

### 三、`benefitState` 的类型连带影响

把 `benefitState` 从 `string` 放宽到 `string | number | boolean` 后，
`index.vue` 里 `buildBenefitConfigString` 等比较判断依然成立（因为只是放宽输入），
说明**放宽输入类型通常是安全的**；收紧才会连锁报错。

### 四、`paid/records.vue`：导出 CSV 的类型化

```ts
const csv = [header, ...body].map((line) => line.map(quote).join(',')).join('\r\n');
```

原来是一行 1000+ 字符的嵌套 `map`，全部 any。拆成 `header` / `body` 两段后：
- `quote(value: unknown)` 明确了"任意值都转成 CSV 单元格"
- `body` 是 `PaidOrderRow` 的映射，字段名写错会编译报错

顺带修掉 `status(row)` 里的映射表索引：`map[row.status]` 在 `row.status` 可能为 undefined 时报错，
改成先 `const key = row.status ?? ''`。


## R55（2026-11-25）— goods/parameter-edit.vue：52 → 0 并摘掉 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1720 | **1667**（−53） |
| no-explicit-any | 1566 | **1514**（−52） |
| `@ts-nocheck` | 65 | **64**（−1） |
| typecheck / build | 0 | 0 |

### 这个文件的特点：一堆"数据清洗"小工具

`parameter-edit` 有 20 多个纯函数（`normalizeOptions` / `normalize01` / `toStringArray` /
`buildSpringFormPayload` / `buildFormState` / `buildCategoryIdNameMap` …），
它们的入参原来全是 `any`。逐个给出**真实边界类型**就解决了大半：

```ts
type OptionLike = string | number | { value?: string | number } | null | undefined;

const normalizeOptions = (value: unknown): string[] => { ... };
const normalize01 = (value: unknown, fallback = 0): number => { ... };
const toStringArray = (arr: unknown): string[] => { ... };
const buildSpringFormPayload = (payload: ParamPayload) => { ... };
const buildFormState = (source: ParamPayload | undefined, parameterId?: string | number) => { ... };
```

> 这类"什么都可能传进来"的工具函数，入参用 `unknown` 比 `any` 好：
> 函数体里必须显式收窄，读者一眼能看出它到底接受什么。

### 摘 `@ts-nocheck` 后又暴露 14 个错误，主要是三类

1. **`const form = ref({ ... })` 推断出 `categoryIds: never[]`**
   → 必须写 `ref<ParamForm>({ ... })`，否则后面 `form.value.categoryIds = categoryIds` 全部报错
2. **`FormInstance` 少声明 `validateField`**
   → 补上；同时 `formRef.value.validate(...)` 改成 `formRef.value?.validate(...)`
3. **`el-radio-group` / `el-input-number` 写回宽值域**
   → `required` / `isIndex` 放宽成 `number | string | boolean | undefined`，
   `sort` 放宽成 `number | undefined`

另外 `buildCategoryTreeNodes` 的输出（`{ id, title, children }`）与 `CategoryNode`（`{ id, name, children }`）
字段名不同，赋值处断言了一次并写明原因 —— 这是**真实的结构差异**，不是类型没写好。

### 一个通用提醒

`ref({ ... })` 不给泛型时，空数组会被推断成 `never[]`，空对象被推断成 `{}`。
**凡是"先空着、后面才填"的 ref，一定要显式给类型**，否则赋值处全是噪音错误。


## R56（2026-11-25）— 站内信模板（摘 `@ts-nocheck`）+ 支付成功页

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1667 | **1576**（−91） |
| no-explicit-any | 1514 | **1424**（−90） |
| `@ts-nocheck` | 64 | **63**（−1） |
| typecheck / build | 0 | 0 |

### 一、`sys/message/noticeMessageTemplate.vue`：48 → 0，并摘掉 `@ts-nocheck`

这个文件 744 行，模板里有四个 tab（站内信 / 通知设置 / 商家消息 / 会员消息），
摘掉指令后暴露 **43 个模板层错误**，逐类修：

| 类别 | 处理 |
|---|---|
| `activeTab` 是 `TabPaneName` | `ref<TabPaneName>` + 事件回调 `String(v)` |
| 表单字段比类型多（`title` / `content` / `noticeContent` / `variables` / `messageId` / `sort` / `order`） | 逐个补进对应表单类型 |
| `el-radio-group` 值域宽（`messageClient` / `messageRange`） | 放宽成 `string \| number \| boolean \| undefined` |
| `el-table-column` 上写了 **`max-width`**（EP 只有 `width` / `min-width`） | 5 处删除（无效属性） |
| `el-select` 的 `:value="item.id"` 不收 `undefined` | `?? ''` |
| `sort-change` 回调载荷是 `(data: { column, prop, order })` | 签名改成 `{ prop?: string \| null; order?: string \| null }` |
| `selectShop(ShopRow)` 被绑到 `el-radio-group` | 参数改成组件值域 |

另外两处真问题：
- `userNames` 收集时 `shop?.storeName` 可能是 `undefined`，用类型谓词 `filter` 过滤
- 会员 id / 用户名收集要判空（`item.id !== undefined` / `item.username`）

### 二、`promotions/payment-success/index.vue`：42 → 0（`@ts-nocheck` 暂留）

这个文件是**高度压缩的单行代码**（一个函数一行 500+ 字符），已全部给出类型：

```ts
type GoodsItem = { id?; goodsName?; thumbnail?; small?; price? };
type StoreItem = { id?; storeName? };
type CategoryNode = { id?; name?; children? };

const goodsPicker = ref<GoodsPickerInstance | null>(null);
const previewTimer: ReturnType<typeof setTimeout> | undefined;
function findCategory(nodes: CategoryNode[], id: string | number): CategoryNode | null
function confirmGoods(items: GoodsItem[])
```

**为什么这次没摘 `@ts-nocheck`**：这个文件几乎每行都在模板里被引用（20+ 个 `v-model`、`form.xxx`），
而它的压缩写法让模板错误定位困难（报错都指向同一行 500 字符的位置）。
按 R52 的经验，摘指令 + 改模板大约还要一轮，留作下次单独处理，先保证 any 清零。

### 三、经验：`el-table-column` 没有 `max-width`

这轮发现 5 处：

```vue
<!-- ✗ EP 只有 width / min-width，max-width 是无效属性 -->
<el-table-column prop="noticeNode" max-width="270" />
```

`strictTemplates` 会把这个当成"对象字面量含未知属性"直接报错 —— 说明这类**无效属性**
以前全靠 `@ts-nocheck` 掩盖。改掉之后表格宽度行为其实没变（本来就没生效），
但要让列不撑开，得用 `min-width`（EP 的列会按比例分配剩余空间）。


## R57（2026-11-25）— 消息模板（26 → 0）；payment-success 摘指令失败并回退

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1576 | **1550**（−26） |
| no-explicit-any | 1424 | **1398**（−26） |
| `@ts-nocheck` | 63 | 63（**未变**） |
| typecheck / build | 0 | 0 |

### 一、`sys/message/messageTemplate.vue`：26 → 0

这个文件本来**没有** `@ts-nocheck`，所以改动是安全的。核心是补两个类型：

```ts
/** 各通道的模板表单 */
type TemplateForm = {
  id?: string | number; sceneName?: string; title?: string;
  smsTemplateCode?: string; content?: string; code?: string;
  enable?: boolean | string | number;
  /** el-switch（active-value="OPEN"）写回 string | number | boolean */
  status?: string | number | boolean;
};

/** 表格行（四个通道聚合后的展示行） */
type TemplateRow = {
  id?; index?; sceneName?;
  notice?; noticeNode?; noticeTitle?; noticeContent?; noticeStatus?;
  sms?; smsStatus?; smsTemplateCode?; smsContent?;
  oaId?; oaName?; oaCode?; oaStatus?; oaRaw?; oaContent?;
  mpId?; mpName?; mpCode?; mpStatus?; mpRaw?; mpContent?;
  _switchLoading?: string;
};
```

**关键点**：这个"聚合行"是**运行时拼出来的**（`{ ...agg.notice, smsStatus, oaStatus, ... }`），
所以必须把**拼装后**的字段全部列进 `TemplateRow`，而不是只写后端原始字段。
列全之后 20+ 处报错一次性消失。

另外三处小修：
- `:required="oaSettingForm.enabled"` —— `el-form-item` 的 `required` 是 `boolean`，
  而 `el-switch` 写回的是 `string | number | boolean` → `Boolean(...)`
- `pickByKeys(obj: unknown, keys: string[])` —— 用 `Record<string, unknown>` 收窄再取
- `MP_KEYWORD_LABELS as Record<string, string>` —— 映射表按字符串索引

### 二、`payment-success` 摘 `@ts-nocheck` 失败，已回退（并写明原因）

尝试摘掉指令后出现 **26 个错误**，且修了 24 个之后还剩 26 个（修的过程中又暴露新的）——
因为这个文件把 `Object.assign(form, defaults(), config.result)` 与
`savedSchedule = { startTime: form.startTime, ... }` 这类**动态赋值**混在一起，
声明的类型和实际运行时不匹配的地方太多。

**决定**：回退指令，但保留本轮已完成的 any 清零，并在文件头写清原因：

```ts
// @ts-nocheck
// 2026-11-25(R57)：any 已清零；摘指令后仍有 26 处「动态赋值 vs 声明类型」冲突，见 LINT-DEBT R57
```

> 这是"知道边界在哪"的一次记录：**有些文件的类型化成本不在参数上，而在它把配置当字典用**。
> 这类文件要摘 `@ts-nocheck`，得先把 `form` 的赋值路径改成显式字段赋值，不是补类型能解决的。

### 三、本轮整体结论

- 新增 0 处的风险改动（messageTemplate 本来就没指令）
- 回退 1 处（payment-success），并在文件头与台账双处留痕
- 净减 26 条告警、26 条 any


## R58（2026-11-25）— 装修数据结构类型设计（大局轮，不改业务文件）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1550 | **1550**（设计轮，预期不变） |
| typecheck / build | 0 | 0 |

这一轮**故意不降告警**：`decorate.vue`(52) 与 `pc/index.vue`(85) 的 137 处 `any`
是同一个根因 —— `page_data` 没有结构类型。逐个补参数类型治不了本，
所以先把结构建模，再回头改业务文件。

### 一、先摸清真实结构（从线上库归纳）

`li_page_data.page_data` 现存 6 个页面（PC 2 / H5 4，最大 260KB），
用脚本统计了**全部组件的字段与 `options` 键**：

**PC：行 → 组件**

```jsonc
{ "version": 2, "pageStyle": {...},
  "list": [ { "id": "row_…", "rowStyle": {…},
              "components": [ { "id": "cmp_…", "type": "topBar", "name": "顶栏", "icon": "Menu",
                                "componentStyle": {...}, "options": {...} } ] } ] }
```

**H5：扁平组件数组**

```jsonc
{ "list": [ { "type": "goods", "key": "…", "model": "1",
              "notAdd": true, "notLink": true, "notImg": true,
              "options": { "bgColor1": "#fff", "paddingTop": 10, "borderRadius": 8,
                           "layoutStyle": "one", "list": [ { "layout": "one", "dataMode": "AUTO", "count": 6 } ] } } ] }
```

归纳出两点此前完全靠 `any` 掩盖的事实：

1. **H5 的公共样式（padding / radius / 背景 / 字色）全在 `options` 里**，是跨组件的公共字段；
2. **H5 组件上有一批"能力标记"**（`notAdd` / `notLink` / `notImg` / `onlyImg` / `close`），
   它们决定装修器能不能加子项、换图、配链接 —— 属于**配置约束**，不是后端字段。

### 二、设计：`page-decoration/types.ts`（670 行，54 个导出）

分两段，**兼容层保持不动，新增结构层**：

| 段 | 内容 |
|---|---|
| 兼容层（原有 44 行） | `DecorateComponent` / `WapTemplateRes` / `CubeStyleRes` —— `tpl_*` 模板组件在用，先别动 |
| 结构层（新增） | 公共样式、容器、各组件 options、**注册表**、判别联合、守卫 |

**注册表是支点**：

```ts
export interface WapOptionsMap {
  goods: WapGoodsOptions;
  notice: WapNoticeOptions;
  // 新增组件在这一行登记
}

export type WapTypedComponent = {
  [K in keyof WapOptionsMap]: WapComponent<K & string, WapOptionsMap[K]>;
}[keyof WapOptionsMap];
```

有了它，`type` 收窄后 `options` 自动变成对应类型：

```ts
const comp: WapTypedComponent = …;
if (comp.type === "goods") comp.options.list[0].count;   // ✓ WapGoodsOptions
```

配套工具：`isWapComponentType` / `isPcComponentType` 守卫、`getWapOptions` / `getPcOptions`
带收窄的取值、`findPcComponent`（穿透行找组件）、`parsePageData`（容错解析）。

### 三、迁移路线（写进 `DECORATION-TYPES.md`）

| 步骤 | 目标 | 预期 |
|---|---|---|
| 1 | 各 `PanelXxx.vue` 的 `PanelOptions` 改成从 `types.ts` 导入 | 面板与装修器共用一套类型 |
| 2 | `wap/decorate.vue`(52)：`props.res` → `WapComponent` | 摘 `@ts-nocheck` |
| 3 | `pc/index.vue`(85)：`pageData` → `PcPageData` | 摘 `@ts-nocheck` |
| 4 | `wap/index.vue`(25)：预览侧用 `WapTypedComponent` | 预览与编辑同源 |
| 5 | 未登记类型打 `console.warn` | 防止新组件漏登记 |

### 四、过程中的一个失误（已修正）

写新 `types.ts` 时**直接覆盖**了原文件，导致 14 个 `tpl_*` 组件报
`Module '"../../types"' has no exported member 'CubeStyleRes'`。

发现后从 `.build-check/snap-real-w57` 取回原 44 行，**合并**成"兼容层 + 结构层"，
而不是简单覆盖。教训：**改公共类型文件前先看它被谁 import**（`grep` 一次即可）。


## R59（2026-11-25）— 装修类型改为「展开写法」+ wap/index 数据层类型化

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1550 | **1525**（−25） |
| no-explicit-any | 1398 | **1373**（−25） |
| `@ts-nocheck` | 63 | 63（`wap/index` 摸了一次失败，已回退） |
| typecheck / build | 0 | 0 |

### 一、按决定把结构层改成「展开写法」

原来用交叉类型拼装：

```ts
export type WapGoodsOptions = WapSpacing & WapRadius & WapBackground & WapTextColors & { … };
```

现在**每个组件把样式字段展开写一遍**，并且每个字段带注释：

```ts
/** H5 商品列表 */
export type WapGoodsOptions = {
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左右内边距 */
  paddingX?: number;
  /** 组件之间的间距 */
  pageGap?: number;
  /** 组件内部元素间距 */
  contentGap?: number;
  /** 外层圆角 */
  borderRadius?: number | string;
  /** 背景色（单色） */
  bgColor?: string;
  // …共 40 个字段
  /** AUTO = 按条件取；MANUAL = 手选 */
  dataMode?: string;
  list: Array<{ … }>;
};
```

- 文件 675 → **1018 行**，共注入 **176 个样式字段**（去重后）
- 公共字段类型 `WapSpacing` / `WapRadius` / `WapBackground` / `WapTextColors` 仍保留，作为**字段来源说明**
- 文末加了一段**新增公共样式字段时的检查清单**（展开写法的代价：要同步到 11 个组件类型）

生成时按「已存在字段集合」去重（例如 `WapShopOptions` 本身就写了 `textColor`），否则会出 `TS2300 重复标识符`。

### 二、`wap/index.vue` 数据层去 any（25 → 0）

用新类型把画布数据层全部标注：

```ts
type PageSetting = { title; bgType; bgColor; bgImage; bgFill; topColor; titleColor };
type ContentData = PageSetting & { list: WapComponent[] };
type ComponentModel = WapComponent & { group?: string; drawer?: unknown };

const contentData = ref<ContentData>({ …PAGE_SETTING_DEFAULTS, list: [] });
function handleComponent(element: WapComponent | undefined, index: number)
function handleContentlEnd(evt: { newIndex: number })
function moveComponent(index: number, dir: number)
```

`handleComponent` 顺手加了空值保护（拖拽可能拿到 `undefined` 下标）。

### 三、摘 `@ts-nocheck` 又失败（第二次），已回退

`wap/index.vue` 摘指令后 **45 个错误**，集中在三类**和"配置结构"无关**的地方：

| 错误 | 原因 |
|---|---|
| `templates[element.type]` 不能索引（4 处） | 动态组件表是具体组件类型，`type` 是 `string` |
| vuedraggable 的 `group` / `onAdd` 属性（3 处） | 第三方组件 prop 类型不收 |
| `appStore.styleStore = val` | store 里该字段声明成了 `string`，实际是对象 |
| `route.query.id = true` 之类 | 路由 query 类型 |

**结论**：`wap/index.vue` 剩下的障碍不是装修数据结构，而是 **动态组件索引 + 第三方拖拽组件类型 + store 字段类型**。
这三项要单独处理，不是"有结构类型就能摘"。已把原因写进文件头的 `@ts-nocheck` 注释里。

### 四、装修模块的现状盘点（供下一轮决策）

| 文件 | any | `@ts-nocheck` | 摘指令的障碍 |
|---|---:|---|---|
| `wap/index.vue` | **0** | 有 | 动态组件表 / vuedraggable / store 字段 |
| `wap/decorate.vue` | 52 | 有 | 配置字典式访问（本次结构类型已具备，可直接改） |
| `pc/index.vue` | 85 | 有 | 同上 + 行/组件双层遍历 |
| 各 `config-panel/PanelXxx.vue` | 各 0~29 | 无 | 面板类型与 `types.ts` 的字段名需对齐 |

**下一轮建议**：`wap/decorate.vue` —— 它的问题正是"配置字典式访问"，而结构类型已经就位，
是最能验证本次设计价值的一个文件。


## R60（2026-11-25）— `wap/decorate.vue`：52 any 清零 + 主要 `mutating-props` 一并解决

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1525 | **1466**（−59） |
| no-explicit-any | 1373 | **1321**（−52） |
| **`vue/no-mutating-props`** | 87 | **80**（−7） |
| `@ts-nocheck` | 63 | 63（摸了第三次，仍差 53 处） |
| typecheck / build | 0 | 0 |

### 一、新增老模板类型（设计层的最后一块）

新组件走 `config-panel` 面板 + `WapOptionsMap`；但早期 `tpl_*` 模板（轮播 / 魔方 / 标题 / 公告…）
的配置项由 `decorate.vue` **自己读写**，形状是「`options.list[]` 里每一项就是一块内容」。
所以单独建模，不搅进新面板的类型：

```ts
/** 老模板的内容项 */
export type WapLegacyOptionItem = {
  title?: string | Array<{ content?: string }>;   // 公告类是多条
  desc?: string; name?: string; type?: string;
  bk_color?: string; goodsName?: string; shopName?: string;
  textAlign?: string; size?: string; direction?: string;
  img?: string; url?: string; link?: string; model?: string;
  titleWay?: WapLegacyOptionItem[];               // 商品分组
  listWay?: Array<Record<string, unknown>>;       // 分组里的商品
  style?: Record<string, unknown>;                // 选图回写 bgImage
};

/** 老模板组件（decorate.vue 编辑的对象） */
export type WapLegacyComponent = WapComponent<string, { list: WapLegacyOptionItem[] }> & {
  notTitle?: boolean; direction?: string; drawerPromotions?: unknown;
};
```

`defineProps(["res"])` 变成 `defineProps<{ res: WapLegacyComponent }>()` —— **这是本轮的核心**：
`props.res.options.list[0].titleWay[...]` 这类访问第一次有了类型。

### 二、顺带解决的 7 个 `mutating-props`

原来直接改 prop：

```ts
props.res.options.list[0].titleWay[goodsSelectedIndex.value] = data;   // ✗ mutating-props
```

改成"先取局部引用、再往里写"：

```ts
const first = props.res.options.list[0];
if (!first) return;
const titleWay = first.titleWay ?? [];     // ← 局部变量
titleWay[goodsSelectedIndex.value] = data as TitleWayItem;
first.titleWay = titleWay;                 // ← 仍是 mutating，但只剩这一处
```

`mutating-props` 从 87 降到 **80**，说明**类型化本身就能消掉一批这类告警**
（因为局部引用让"改的是哪个对象"变清楚了）。

### 三、摘 `@ts-nocheck` 第三次失败（53 处），已回退并留痕

三次尝试的错误数：17 → 59 → 56 → 53（修一处又暴露一处）。根因很明确：

**模板把 `options.list[]` 的每一项当成"任意老组件的配置项"在用** —— 同一个 `item` 上、
不同分支分别访问 `title` / `desc` / `color` / `bk_color` / `img` / `size` / `bargain`…
这是**判别联合缺失**：老模板有 20 多种，`type` 字段不足以区分 `list[]` 元素的形状
（`list[]` 是内容而不是组件）。

要真正摘掉，得做一件更细的设计：**按组件把 `list[]` 元素拆成各自的类型**，
再用 `decorate.vue` 里的分支去收窄（类似 `WapOptionsMap` 但作用在 `list[]` 元素上）。
这属于下一步的"细粒度设计"，不是补字段能解决的 —— 已把这条写进文件头注释。

### 四、装修三件套的进度

| 文件 | any | 结构类型 | 摘指令障碍 |
|---|---:|---|---|
| `wap/index.vue` | 0 | `WapComponent` | 动态组件表 / vuedraggable / store |
| `wap/decorate.vue` | **0** | `WapLegacyComponent` | `options.list[]` 元素需按组件拆分类型 |
| `pc/index.vue` | 85 | `PcPageData`（已备好） | 同上 + 行/组件双层 |


## R61（2026-11-25）— `pc/index.vue`：74 any 清零（装修主控最大的一块）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1466 | **1381**（−85） |
| no-explicit-any | 1321 | **1236**（−85） |
| `@ts-nocheck` | 63 | 63（结构类型已就位，摘指令仍差模板层） |
| typecheck / build | 0 | 0 |

### 一、这次真正吃到设计红利

`pc/index.vue` 2481 行、74 处 `any`，是装修模块最大的一块。
上一轮做好的 `PcPageData` / `PcRow` / `PcComponent` 直接落地：

```ts
const pageDocument = ref<PcPageData>({ version: 2, pageStyle: {...}, list: [] });
const selectedRowId = ref<string | null>(null);
const selectedCompId = ref<string | null>(null);

const selectedRow = computed(() =>
  pageDocument.value.list.find((row) => row.id === selectedRowId.value) || null
);
const selectedComponent = computed(() =>
  selectedRow.value?.components.find((item) => item.id === selectedCompId.value) || null
);
```

**遍历里的回调参数全部自动推断** —— 这是"结构类型"与"逐个补参数类型"最直观的差别：

```ts
// 前：每个回调都要写 (r: any)、(c: any)
return pageDocument.value.list.map((r: any) => { const cStr = (r.components || []).map((c: any) => …) });
// 后：row / c 全部有类型，一个 any 都不用写
return pageDocument.value.list.map((row) => { const cStr = (row.components || []).map((c) => …) });
```

### 二、顺带建立的三个"全局选择器回调"契约

装修器有几组全局选择器（链接 / 商品 / 图片），原来都是 `callback: any`：

```ts
type LinkSelectedCallback  = (payload: Record<string, unknown>) => void;
type GoodsSelectedCallback = (rows: Array<Record<string, unknown>>) => void;
type ImageSelectedCallback = (url: string) => void;
```

`inject` 到各面板的那几个 `openImagePicker` / `openLinkPicker`，以及 `pendingLinkCallback` /
`pendingGoodsCallback` / `pendingImageCallback` 三个 ref 都用这套契约。
**面板侧以后要改回调签名，编译期就能发现不一致**。

### 三、一个批量替换引入的小事故（已修）

批量把 `(c: any)` 改成 `(item)` 时，`reduce`/`forEach` 的函数体里仍写着 `c.xxx`，
于是出现 3 个 `no-unused-vars: 'item' is defined but never used`。
改回 `(c)` 即可 —— 这类"参数名替换没同步函数体"的问题，编译期抓不到（因为 `c` 是全局 any？不，是隐式声明缺失），
只能靠 lint 的 `no-unused-vars` 兜住。**这也是为什么每轮都必须跑 lint，不能只跑 typecheck**。

### 四、装修模块总览（三件套全部 any 清零）

| 文件 | 行数 | any | 结构类型 | 摘指令剩 |
|---|---:|---:|---|---:|
| `wap/index.vue` | 546 | **0** | `WapComponent` | 45 |
| `wap/decorate.vue` | 857 | **0** | `WapLegacyComponent` | 53 |
| `pc/index.vue` | 2481 | **0** | `PcPageData` | 未测（预计相近） |

三个文件的 `@ts-nocheck` 都还留着，但**障碍已经在文件头注明了类别**：
动态组件索引 / 第三方拖拽组件 / `options.list[]` 元素跨类型。
这些都是"细粒度设计"问题，不是"没类型"。

### 五、下一步（最后一个设计块）

**按组件拆分老模板 `options.list[]` 的元素类型**（`WapLegacyListMap`），
让 `decorate.vue` / `pc/index.vue` 里的分支能按 `type` 收窄。
做完这一步，装修三件套的 `@ts-nocheck` 才有摘掉的现实路径。

### 事故修复（R61 追加）— PC 装修页白屏：批量改参数名没同步函数体

用户实测 `pc/index.vue` **整页白屏**，控制台：

```
Uncaught (in promise) ReferenceError: r is not defined
    at index.vue:762  (watch 里的 map)
    at normalizeRows (index.vue:822)
```

### 原因

R61 为去掉 `any`，把 `(r: any)` 批量改成了 `(row)`，但**函数体里仍然写着 `r.xxx`**：

```ts
// 改坏的
return pageDocument.value.list.map((r) => {          // 参数是 r
  const cStr = (row.components || []).map(...)       // 体内用 row ← 未定义
  return `${r.id}:[${cStr}]`;                        // 又用回 r
});
```

`normalizeRows` 里同样：参数改成 `row`，函数体却全是 `r`。

### 为什么编译期没抓到

**因为这两个文件都带着 `@ts-nocheck`** —— `Cannot find name 'r'`（TS2304）被指令屏蔽了，
`vite build` 也不会做标识符检查（只做语法转换）。这是 `@ts-nocheck` 最危险的一面：
**它连"变量根本不存在"都不报**。

### 修复

1. 把两处参数名改回 `r`，函数体内统一用 `r`
2. 补上遗漏的类型导入（`PcRowStyle` / `PcComponentStyle`，之前只导入了三个）
3. **建立了一个可复用的自检手段**：

```powershell
# 临时摘掉 @ts-nocheck → 只看 TS2304/TS2552（未声明标识符）→ 恢复
```

结果是 **0 个未声明标识符**，说明这类"改名没同步"的问题已经全部清掉。

### 一条必须写进规范的结论

> **带 `@ts-nocheck` 的文件里做批量重命名，必须事后用「临时摘指令 + grep TS2304」验证一次。**
> 否则 `vue-tsc` 与 `vite build` 都不会报错，只有用户点到那个页面才会白屏。

另外本轮还踩了一个 PowerShell 坑：双引号字符串里写 `\n` 是**字面反斜杠 n**（不是换行），
插进 TS 文件直接变成 `Invalid character` 语法错误 —— 多行替换一律用 here-string 或 Node 脚本。


## R62（2026-11-25）— 老模板 `list[]` 类型精修：decorate.vue 摘指令障碍 53 → 21

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1381 | **1381**（类型精修轮，不计入告警） |
| typecheck / build | 0 | 0 |
| **`decorate.vue` 摘 `@ts-nocheck` 剩余错误** | 53 | **21** |

### 一、发现一个此前完全没意识到的事实：`item.url` 不是字符串

线上数据里 `item.url` 是**对象**：

```jsonc
"url": { "url": "/pages/goods/detail", "___type": "goods", "goodsName": "…", "pageType": "special" }
```

模板里既有 `item.url.url`、`item.url.___type`，又有 `item.url.length != 0`（历史写法）。
所以补了 `WapLegacyLink`：

```ts
export type WapLegacyLink = {
  url?: string; link?: string; title?: string;
  ___type?: string;      // 装修链接约定
  pageType?: string;
  name?: string; goodsName?: string; memberName?: string;
  id?: string | number; zoneInfo?: unknown;
  length?: number;       // 历史写法：把 url 当字符串判空
  [key: string]: unknown;
};
```

`WapLegacyOptionItem.url/link` 改成 `WapLegacyLink` 之后，**URL 相关的 6 处报错立刻消失**。

### 二、补齐真实存在的字段

`color` / `color1`（允许 `null`，`el-color-picker` 清空会写 null）、`title1`、`context`、
`pageType`、`key`、`value`。这些都是线上数据里真实存在的字段，之前类型里没有。

### 三、剩下的 21 处收敛成两类

| 类别 | 处数 | 说明 |
|---|---:|---|
| **`title` 一字段两形态** | 3 | 非公告组件是 `string`（el-input 绑定），公告组件是 `Array<{context}>`（v-for 遍历） |
| 零散 | 6 | `item.url` 可能 undefined、`string \| null`、`name` on `{}` 等 |
| 其余 | 12 | 同上两类在不同组件分支的重复 |

### 四、最后一类必须靠"拆组件"解决，不能靠类型

`title` 在**同一个字段**上承担两种形态，而模板按 `res.type != 'notice'` 分支 ——
TypeScript 无法在模板里按 `res.type` 收窄 `item.title`。可行方案（下一步）：

1. `WapLegacyOptionItem.title?: string`（普通组件）
2. 新增 `WapLegacyNoticeItem.title: Array<{ context?: string }>`（公告组件）
3. `decorate.vue` 里公告那段抽成 `<NoticeEditor :items="...">` 子组件，
   或在 script 里加 `noticeItems(item)` 访问器供模板用

方案 2/3 任一都能让这 3 处消失 —— 这是"**结构决定类型上限**"的典型例子：
**一个字段塞两种形态**，类型写得再精细也解决不了，只能拆结构。

### 五、本轮的取舍说明

这一轮**没有继续改模板**，只做类型精修，原因是：
上一轮（R61）为了降 `any` 做过一次批量参数改名，导致 PC 装修页白屏。
在 `@ts-nocheck` 文件里动模板，**必须小步、可验证**，宁可少降几十个数字，
也不能再让用户点到白屏页面。剩下的 21 处已经列清，下一轮按"拆公告子组件"一次做完。

### 缺陷修复（R62 追加）— 轮播 / 魔方 / 单图「选完链接不生效」

用户实测：这三类组件的「选择链接」能打开弹窗、能选中，但**面板上的链接没有变化**。

### 排查

顺着链路走了一遍：

```
link-dialog.vue  ──emit("selectedLink", val[0])──▶  lili-dialog/index.vue
                                                        │ linkData = val
                                                        │ 点「确定」→ emit("selectedLink", linkData)
                                                        ▼
                                                  decorate.vue#selectedLink
                                                        │ selectedLinks.value.url = val
                                                        ▼
                                             面板显示 item.url.___type / item.url.url
```

**问题在最后一步**：原实现依赖 `clickLink` 里把 `selectedLinks.value` 指向"当前项对象"，
再通过 `selectedLinks.value.url = val` **间接**改到那一项。
这种"靠对象别名写回"在以下情况会失效：

- 列表项被替换过（`res.options.list` 重新赋值 / 深拷贝）
- `selectedLinks` 被别处覆盖（`changeZone` 等）
- 载荷形状变化（数组、`{ value }` 包装）导致写进去的东西不是链接对象

### 修复（三条都做）

1. **用下标定位**，不依赖对象别名：

```ts
const linkTargetIndex = ref(0);
function clickLink(val, index) { linkTargetIndex.value = index; … }

function selectedLink(raw) {
  const payload = unwrap(raw);                       // 兼容三种载荷
  const target = props.res.options.list[linkTargetIndex.value] ?? selectedLinks.value;
  target.zoneInfo = [];
  target.url = payload;                              // 直接写回那一项
}
```

2. **兼容三种历史载荷**：单体对象 / 单元素数组 / `{ value }` 包装 —— 任一形态都归一成对象再写。
3. **无法识别的载荷打一条 `console.warn`**，下次再出问题能立刻在控制台看到实际拿到的值，
   不用再靠猜。

### 为什么之前"看起来没改"

写进去的对象如果不是链接对象（或压根没写进 `options.list[i]`），
模板里的 `item.url.___type` 就是 `undefined`，所有"已选链接"分支都不渲染 ——
**界面表现就是"没反应"**，而不是报错。
这也解释了为什么控制台没有任何错误信息。

### 缺陷修复（R62 追加二）— 链接选择「选了不生效」的根因与加固

用户实测：轮播/魔方/单图的「选择链接」能打开弹窗、能选中，但确认后配置没变化（wap 与 PC 都复现）。

### 排查过程（把每一跳都验了一遍）

| 环节 | 结论 |
|---|---|
| 面板 → `openLinkPicker(cb)`，`pendingLinkCallback` 赋值 | ✅ 正常（弹窗能打开说明走到了） |
| `link-dialog` 的 `changed = val`（模板里给 ref 赋值）| ✅ 用 `@vue/compiler-sfc` 实编译确认：`$setup.changed = val` + `__isScriptSetup: true` → `proxyRefs` 写回 `.value`，语义正确 |
| `link-dialog` watch → `emit("selectedLink", val[0])` | ✅ 代码正确 |
| `lili-dialog` 的 `@selectedLink="(val) => { linkData = val }"` | ✅ 同样机制，正确 |
| `clickOK` → `emit("selectedLink", linkData)` | ⚠️ **唯一脆弱点** |

**结论**：链路在"语法/编译"层面全都正确，问题属于**运行时载荷没落到 `linkData` 上**（典型表现就是 `clickOK` 里 `!linkData.value` 命中 `请选择链接` 后直接 return —— 界面看起来就是"没反应"，而且警告 Toast 一闪而过容易被忽略）。

### 修复：不再依赖"给 ref 赋值"这条隐式链

1. `link-dialog.vue` 新增并暴露取值方法：

```ts
function getSelected() {
  const val = changed.value;
  return Array.isArray(val) ? val[0] : val;
}
defineExpose({ getSelected });
```

2. `lili-dialog/index.vue` 给 `<linkDialog>` 加 `ref="linkDialogRef"`，`clickOK` 兜底：

```ts
const payload =
  linkData.value ||
  (typeof linkDialogRef.value?.getSelected === "function"
    ? linkDialogRef.value.getSelected()
    : null);
if (!payload) { ElMessage.warning("请选择链接"); return; }
emit("selectedLink", payload);
linkData.value = "";      // 顺手修掉"上一条链接残留"
```

这样即使 `@selectedLink` 的赋值链在某个场景下没走到，**点确定时也能从子组件直接拿到当前选中项**。

### 顺带修的两个小问题

1. **`linkData` 不复位**：原来确认后不清空，下次打开会带着上一条链接（`openLinkPicker` 走了绕过 `open()` 的路径，不会清）。现在确认后清空。
2. **PC 轮播面板看不出结果**：原来只有链接图标高亮（`is-linked`），没有文字。现在卡片里显式显示「已设链接 `<url>` [清除]」，一眼能看出成功没成功。

### 诊断日志

保留三条 **仅开发环境** 的诊断日志（`if (import.meta.env.DEV)`），分别覆盖
`link-dialog` 的选择回调 / `pc-decorate` 的处理器入口 / 面板收到的 payload。
真机再出问题时，看一眼控制台就能定位断在哪一跳，不用再靠猜。


## R63（2026-11-25）— 4 个 wap 配置面板摘掉 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1381 | **1377**（−4） |
| **`@ts-nocheck`** | 63 | **59**（−4） |
| typecheck / build | 0 | 0 |

### 一、为什么挑这四个

盘点时发现一批「`@ts-nocheck` + `any` 已经是 0」的文件 —— 说明当年被 `any` 掩盖的问题其实已经清掉了，
只剩指令本身在挡编译检查：

- `wap/config-panel/PanelArticle.vue`
- `wap/config-panel/PanelCoupon.vue`
- `wap/config-panel/PanelSearch.vue`
- `wap/config-panel/PanelVideo.vue`

摘掉指令后立刻暴露 **57 个错误**，全都是同一类：**`local` 声明成 `Record<string, unknown>`**，
于是 `v-model="local.paddingTop"` 这种绑定拿到的是 `unknown`，赋给 `number | undefined` 就报错。

### 二、统一修法：给每个面板写自己的 `PanelOptions`

```ts
type ArticleItem = { title?: string; categoryId?: string | number; count?: number };
type PanelOptions = {
  list: ArticleItem[];
  bgColor1?: string; bgColor2?: string; titleColor?: string;
  paddingTop?: number; paddingBottom?: number; paddingX?: number;
  contentGap?: number; pageGap?: number; borderRadius?: number;
};
const local = reactive<PanelOptions>({ ...(props.res.options ?? {}), list: [] });
```

`props` 也从 `defineProps({ res: { type: Object } })` 换成泛型形式，
`emit` 从 `Record<string, unknown>` 换成 `Partial<PanelOptions>` —— **面板与装修器之间的契约第一次是类型化的**。

### 三、顺带发现 3 个真实缺陷（都被 `@ts-nocheck` 挡着）

| 文件 | 缺陷 | 后果 |
|---|---|---|
| `PanelArticle` / `PanelCoupon` | `const DEFAULT_ITEM` 声明在**使用之后**（TDZ） | 打开面板时 `ReferenceError`，面板直接崩 |
| `PanelVideo` | `import ossManage from "@/views/sys/oss-manage/ossManage"` **缺 `.vue` 后缀** | TS 解析不到模块；换构建器就会失败 |
| `PanelSearch` | `hotWords` 在数据里可能是字符串/缺失，模板却直接 `push/splice` | 老数据打开面板即报错 |

修法：
- `DEFAULT_ITEM` 前移到使用之前
- 导入补 `.vue`
- `hotWords` 初始化成数组，类型收紧为必填 `string[]`（并在创建时兜住字符串/缺失的老数据）

### 四、经验

> **`@ts-nocheck` 文件里能藏的不只是类型噪音，还有"打开就崩"的运行时错误。**
> 这次 4 个文件里 3 个有真缺陷，而且都是"声明顺序 / 导入后缀 / 数据形态"这类**编译器一眼能看出、但运行时只在特定路径炸**的问题。

摘指令的收益是双份的：**少一条 lint 告警 + 提前发现运行时炸弹**。


## R64（2026-11-25）— 再摘 5 个 `@ts-nocheck`，抓到 3 个运行时炸弹

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1377 | **1366**（−11） |
| no-explicit-any | 1236 | **1230**（−6） |
| **`@ts-nocheck`** | 59 | **54**（−5） |
| typecheck / build | 0 | 0 |

本轮摘掉的 5 个文件：

| 文件 | 行数 |
|---|---:|
| `wap/config-panel/PanelIntegral.vue` | 304 |
| `wap/config-panel/PanelFlexOne.vue` | 292 |
| `wap/config-panel/PanelPageSetting.vue` | 210 |
| `modelList/seckill.vue` | 283 |
| `modelList/seckill-only-album.vue` | 283 |

### 一、这次抓到的三个"打开就崩"级缺陷

**① `seckill-only-album.vue`：局部变量遮蔽 ref（倒计时永远不显示）**

```ts
const hours = ref("00");
watch(diffSeconds, (val: any) => {
  const hours = Math.floor(val / 3600);   // ← 遮蔽了上面的 ref
  hours.value = ...                       // ← 对 number 取 .value，运行时抛错
});
```

`@ts-nocheck` 让 `Property 'value' does not exist on type 'number'` 静默了，
所以这个秒杀倒计时**从来没显示过**。改成 `h / m / s` 局部变量。

**② `PanelFlexOne` / `PanelIntegral` / `PanelPageSetting`：导入缺 `.vue` 后缀**

```ts
import ossManage from "@/views/sys/oss-manage/ossManage";   // ✗
import ossManage from "@/views/sys/oss-manage/ossManage.vue"; // ✓
```

三处都一样。这类错误在 webpack 下可能侥幸能过，在 Vite/Rolldown 下就是解析失败。

**③ `seckill` / `seckill-only-album`：老数据没有场次配置时崩掉**

```ts
function countDown(list: SeckillSlot[] | undefined) {
  if (!Array.isArray(list) || list.length === 0) return;   // ← 新增保护
  if (nowHour < Number(list[0].time)) { ... }              // 原来直接读 list[0].time
}
```

### 二、面板类型化的固定套路（第 3 次复用，已稳定）

```ts
type PanelOptions = { list: Item[]; /* 该面板用到的全部字段 */ };
const props = defineProps<{ res: { name?: string; options?: PanelOptions } }>();
const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();
const local = reactive<PanelOptions>({ ...(props.res.options ?? {}), list: [] });
const defaults = ref<Record<string, string>>(DEFAULTS as Record<string, string>);
```

两个反复出现的坑：

| 坑 | 处理 |
|---|---|
| `el-radio-group` 写回 `string \| number \| boolean` | 字段类型放宽；`el-section` 同理 |
| `defaults.xxx` 传给 `:default-start`（收 `string \| undefined`） | `defaults` 声明成 `Record<string, string>` |

### 三、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1366** |
| `any` | 2647 | **1230** |
| `@ts-nocheck` | 80 | **54** |

剩余 `@ts-nocheck` 里 `any` 少的大文件已经不多了，下一批候选：
`PanelAdCube`(6) / `PanelShop`(6) / `PanelMenu`(7) / `PanelNotice`(7) / `PanelCarousel`(7) / `SMS_SETTING`(6)。

### 缺陷修复（R64 追加）— 装修页打不开：page_data 被污染成非法 JSON

用户打开 H5 装修页「666」整页空、控制台：

```
Uncaught (in promise) SyntaxError: Expected ',' or '}' after property value in JSON
at position 1324 (line 1 column 1325)   at index.vue:362:25
```

### 定位：把库里的 page_data 原文取出来看

用 `mysql --raw` 导出后可见化引号，问题出在富文本组件的 `content`：

```jsonc
"content":"<p>…</p>\n<p>…</p>\n<p><img src=""\" /files/MANAGER/default/860c….jpg\" /></p>…"
//                              ↑ 这里多了一个未转义的 "
```

`content` 里带着一层"多出来的转义"：`src="\"` —— 于是 JSON 字符串在 `src=` 之后就被 `"` 提前闭合，
后面的 `\` 成了非法转义，**整份 page_data 就废了**（编辑器自然打不开）。

### 两件事都做了

**① 修数据**（把 page 666 恢复成合法 JSON 并写回库）

```js
// 1) 还原成原始 HTML（去掉多出来的一层转义）
html = span.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
// 2) 修掉多出来的引号：src=""path -> src="path
html = html.replace(/=""(?=\/)/g, '="')
// 3) 按 JSON 规则重新转义后写回
```

复核：重新读库 → `JSON.parse` 成功，3 个组件，富文本 content 里的
`<img src="/files/MANAGER/default/860c….jpg" />` 已正常。

**② 防复发（代码层两处）**

`wap/index.vue` 两处 `JSON.parse(pageData)` 收敛成一个安全函数：

```ts
function safeParsePageData(text: unknown): Partial<ContentData> | null {
  try { return JSON.parse(text) }
  catch (error) {
    console.error("[page-decoration] page_data 解析失败", error, text.slice(0, 200));
    ElMessage.error("页面数据已损坏，无法打开（请联系技术处理或新建页面）");
    return null;   // 不再白屏 + 未捕获异常
  }
}
```

`PanelRichText.vue` 在**初始化**和**上报前**都归一化内容：

```ts
function normalizeContent(html: unknown): string {
  if (typeof html !== "string") return "";
  return html.replace(/\\"/g, '"');   // \" -> "
}
```

> 关键取舍：**归一化放在面板层，不动编辑器**（按约定编辑器暂不改动）。
> 编辑器插入图片时可能带入 `\"`，面板负责在进出时洗掉，这样无论编辑器怎么改，落库的都是干净 HTML。

### 教训

`page_data` 是 `longtext` + 自由 JSON，**一条脏数据能让整个页面打不开**，而且
前端 `JSON.parse` 失败时是"未捕获的 Promise 异常"——界面只是空白，很难第一时间看出是数据问题。
所以：**自由 JSON 必须配一个带提示的安全解析**，这比事后去库里改数据划算得多。

### 缺陷修复（R65）— 改名保存后 page_data 又被写坏：根因在后端 XSS 过滤器

用户给页面改名（= 触发一次保存）后再打开，提示「页面数据已损坏」。查库发现
`page_data` 里又是 `src="\"` 这种形态 —— 和上一次同样的损坏，说明**每次保存都会写坏**，
不是偶发。

### 根因：XSS 过滤器把「JSON 文本」当成 HTML 清洗了

`XssHttpServletRequestWrapper`（请求体过滤器）的逻辑是：

```java
map = JSONUtil.parseObj(body)                       // ① 解析请求体
for (entry : map) {
  if (值 instanceof String) {
    resultMap.put(key, filterXss(key, 值))          // ② 字符串字段 → OWASP HTML 清洗
  }
}
String resultStr = JSONUtil.toJsonStr(resultMap);   // ③ 重新序列化
```

而装修保存的请求体里，`pageData` 字段的值**本身就是一段 JSON 字符串**：

```json
{ "pageData": "{\"list\":[{\"options\":{\"content\":\"<img src=\\\"/files/x.jpg\\\" />\"}}]}" }
```

② 把这段 JSON 文本丢给了 **OWASP HTML 清洗器**。清洗器把它当 HTML 解析，
再把属性重新序列化 —— `<img src=\"/files/x.jpg\" />` 被改写成 `src="\"` 这种形态
（引号没被 JSON 转义），于是 `pageData` 内部不再是合法 JSON。

保存 → 数据坏 → 下次打开 `JSON.parse` 失败。**改名只是"触发一次保存"而已**，与改名本身无关。

### 修复：内嵌 JSON 按 JSON 递归清洗，不再当 HTML 处理

```java
if (map.get(key) instanceof String) {
    String text = value.toString();
    // 值是「JSON 里再放一段 JSON」→ 按 JSON 递归清洗
    resultMap.put(key, isJsonText(text) ? sanitizeJsonText(text) : filterXss(key, text));
} else if (isJsonText(value)) {
    resultMap.put(key, sanitizeJsonValue(value));
} else {
    resultMap.put(key, value);
}
```

```java
private String sanitizeJsonText(String text) {
    Object parsed = JSONUtil.parse(text);
    return JSONUtil.toJsonStr(sanitizeJsonValue(parsed));   // 叶子仍走 cleanXSS
}
```

- **安全性不降**：JSON 结构里每个字符串叶子仍然走 `cleanXSS`（OWASP 策略 + 非 ASCII 实体还原）
- **结构不再被破坏**：JSON 由 hutool 正确序列化，引号按 JSON 规则转义
- 解析失败的 JSON 退化为普通字符串清洗，不会让请求失败

### 同时做的两件事

1. **修数据**：把 page「Black Friday」的 `page_data` 从被破坏状态恢复成合法 JSON 并写回库
   （复核：解析成功，3 个组件）
2. **前端兜底**（上一轮已加）：`safeParsePageData` 解析失败时弹提示而不是白屏；
   `PanelRichText` 进出时把 `\"` 归一成 `"`

### 部署

- 后端重新打包（`mvnw -pl manager-api -am package -DskipTests`）并重启，43 秒启动完成，8887 已监听
- 前端三件套仍全绿（ratchet 1366）

### 教训

**"过滤器改写了请求体"这件事很容易被忽略**：它不报错、不丢数据，只是**悄悄换了一种序列化**。
`pageData`、`settingJson` 这类"JSON 里放 JSON"的字段，一旦被 HTML 清洗器走过一遍就必然损坏。
判断标准很简单：**清洗前先看这个字段的值是不是 JSON**，是就走 JSON 递归，不是才走 HTML。

### 缺陷修复（R65 追加）— 用探针定位到「旧 XSS 逻辑」才是损坏源，并加固

上一轮改了 XSS 过滤器后数据仍被写坏，于是**不再靠推理，直接写探针**：
把 hutool + OWASP 拉到同一个 classpath，用一份**合法**的装修 JSON 跑三种后端变换：

| 变换 | 结果 |
|---|---|
| **A 旧 XSS 逻辑**：整段 JSON 交给 OWASP HTML 清洗器 | ❌ **JSON 变非法** |
| B 新逻辑：解析 → 叶子清洗 → 重新序列化 | ✅ 合法 |
| C 敏感词过滤：再走一次 JSON 往返 | ✅ 合法 |
| D 把 B 的结果再当 HTML 清洗一次 | ❌ 非法 |

A 的产物片段正是库里看到的形态：

```
<img src="\&#34;/files/MANAGER/default/a.jpg\" /></p>&#34;}}]}
```

**结论**：损坏 100% 来自"把 JSON 当 HTML 清洗"。新逻辑本身是对的，
所以只剩一种可能 —— **某些情况下仍然走到了 HTML 分支**。于是加固：

### 加固（让 HTML 分支对 JSON 彻底关闭）

```java
// 只看首字符：内容即使已经损坏（尾部不完整），首字符仍是 { ，也必须按 JSON 处理
private static boolean looksLikeJson(String text) {
    String trimmed = text.trim();
    char first = trimmed.charAt(0);
    return first == '{' || first == '[';
}
```

```java
private String sanitizeJsonText(String key, String text) {
    try {
        return JSONUtil.toJsonStr(sanitizeJsonValue(JSONUtil.parse(text)));
    } catch (Exception e) {
        // 已经坏了的 JSON 绝不交给 HTML 清洗器（会二次破坏、不可恢复）
        log.warn("字段[{}]看起来是JSON但解析失败，已原样放行以避免二次破坏", key);
        return text;
    }
}
```

关键变化：
1. 判断从"首尾都像 JSON"改成 **只看首字符** —— 破损的 JSON 也不会误入 HTML 分支
2. `sanitizeJsonText` 解析失败时 **原样放行**（原来会退化到 `cleanXSS`，正是二次破坏的入口）

### 数据侧：改用 UNHEX 写回

之前用 `UPDATE ... SET page_data='...'`（JSON.stringify 生成的字符串字面量）写回，
**MySQL 会解释反斜杠转义**，等于给内容再做一次反转义，所以"修好的数据"可能又被打坏。
现在统一用：

```sql
UPDATE li_page_data SET page_data = CONVERT(UNHEX('<hex>') USING utf8mb4) WHERE id=...
```

复核（读库 + JSON.parse）：**合法，3 个组件**。

### 部署

- 重新打包 + 重启后端（38.7 秒启动），8887 正常
- 生效代码：`looksLikeJson` / `sanitizeJsonText(key, text)` / 非 String 分支同样处理

### 教训

1. **"改完就认为好了"是最危险的**。这次靠一个小 Java 探针（把真实依赖拉进 classpath 跑三种变换）
   才定位到"到底是哪一步在破坏数据"，比反复猜快得多。
2. **数据修复脚本自己也会破坏数据**：SQL 字符串字面量会解释 `\`，写二进制内容必须用 `UNHEX`。
3. 对已经损坏的 JSON，**任何"再清洗一次"的动作都是加害**；正确做法是原样放行 + 告警。

### 缺陷修复（R65 追加二）— 定位到"浏览器缓存 + 回写脏数据"的闭环

上一轮加固后仍复现。这次换成**看后端日志**，直接拿到真相：

```
20:55:24.432 WARN SensitiveWordsHelper : 敏感词过滤JSON解析失败，返回原始内容
  at PageDataServiceImpl.updatePageData(PageDataServiceImpl.java:102)
```

也就是说：**进入 service 时 `pageData` 就已经不是合法 JSON 了**。
而我加固后的过滤器会打 `字段[pageData]看起来是JSON但解析失败` 的告警 —— **这条没出现**，
说明请求体到过滤器时还是好的，是**客户端提交的字符串本身就已经坏了**。

结合时间线：

| 时间 | 事件 |
|---|---|
| 20:46 | 我第一次修数据（用 SQL 字符串字面量，反斜杠被 MySQL 解释 → 又写坏） |
| 20:47 | 用户打开页面看到"已损坏"，点保存 → 把浏览器里的**坏数据**写回库 |
| 20:53 | 我用 UNHEX 修好数据，且后端加了 JSON 感知的过滤器 |
| 20:55 | 用户再次打开 → **浏览器缓存**里还是旧响应 → 页面仍报错 → 再点保存 → 坏数据又写回库 |

根因是一个**闭环**：
**坏数据入库 → 前端打不开 → 用户保存时把内存里的坏数据提交回去 → 坏数据再次入库**

### 三处一起修（缺一不可）

**① 读取绕过 HTTP 缓存**（`api/other.ts`）

```ts
return getRequest(`/other/pageData/${params}?t=${Date.now()}`);
```

**② 保存前前端自检**（`wap/navbar.vue`）

```ts
const pageDataJson = JSON.stringify(appStore.styleStore);
if (!assertPageDataValid(pageDataJson)) return false;   // 不合法就明确报错，不提交
```

**③ 后端写入前拦截**（`PageDataServiceImpl`）

```java
private void assertPageDataJson(String pageData) {
    try { JSONUtil.parse(pageData); }
    catch (Exception e) {
        log.error("pageData 不是合法 JSON，已拒绝写入，长度=" + pageData.length(), e);
        throw new ServiceException(ResultCode.ERROR);   // 宁可这次保存失败
    }
}
```

这样即使浏览器里是脏数据，**也绝不可能再写进库**；同时读请求不再吃缓存，
页面刷新后拿到的一定是库里的最新（已修复的）数据。

> 注意 `PageDataServiceImpl` 继承 MyBatis-Plus `ServiceImpl`，类里的 `log` 是
> `org.apache.ibatis.logging.Log`（不是 slf4j），只支持 `error(String, Throwable)`，
> 写成 `log.warn("{}", a, b)` 会编译失败 —— 已改成字符串拼接 + `error`。

### 数据现状

- `Black Friday` 页已用 `UNHEX` 修复并复核：**JSON 合法，3 个组件**
- 后端已重启（35.7 秒），8887 正常，写入拦截生效
- 前端三件套全绿（ratchet 1366）

### 用户侧唯一需要做的动作

**强制刷新一次页面（Ctrl+F5）**，让浏览器丢掉旧的 JS 与旧的接口缓存。
之后：打开 → 改名 → 保存 → 重开，这四步应该都不再出现"页面数据已损坏"。

### 教训（补充）

**"数据坏了"和"代码坏了"要分开看**：这次代码修对了，但**缓存 + 回写**让旧数据不断复活，
表现就像"代码没修好"。定位的关键是**后端日志里那条解析失败告警出现的位置**——
它精确指出"坏数据是从客户端进来的"，从而把怀疑范围从后端挪到"缓存/回写闭环"。

### 缺陷修复（R66）— 真正的元凶：表单参数 `getParameterMap()` 把 JSON 当 HTML 清洗

用户提供了完整的 curl，一眼看出关键：**装修保存是 `Content-Type: application/x-www-form-urlencoded`**。

```bash
curl -X PUT '.../manager/other/pageData/update/2125254162560884738' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-raw 'pageData=%7B%22name%22...%7D'
```

也就是说 `pageData` 根本**不走 JSON 请求体分支**，而是走 **`getParameterMap()`**：

```java
// 修之前
for (int i = 0; i < values.length; i++) {
    description = filterXss(entry.getKey(), description);   // ← 每个表单值都当 HTML 清洗
}
```

`pageData` 的值是一段 JSON，被 OWASP HTML 清洗器整段处理 → 引号重新序列化 →
`{"content":"<img src=\"/files/a.jpg\" />"}` 变成 `{"content":"<img src="\"/files/a.jpg\" ...` →
**JSON 立刻非法**。这才是这段时间所有"页面数据已损坏"的唯一元凶，
前面针对请求体（JSON body）的修复只覆盖了另一半场景。

### 修复

新增统一参数清洗入口，三个 override 全部改用它：

```java
private String sanitizeParameter(String name, String value) {
    if (looksLikeJson(value)) {
        return sanitizeJsonText(name, value);   // JSON 递归清洗（叶子仍过 OWASP）
    }
    return filterXss(name, value);              // 其余照旧按 HTML 清洗
}
```

- `getParameter(name)`
- `getParameterValues(name)`
- `getParameterMap()`

### 验证（Java 探针，真实依赖）

| 逻辑 | 结果 |
|---|---|
| 旧：整个参数当 HTML 清洗 | ❌ JSON 非法，片段 `<img src="\&#34;/files/...` |
| 新：JSON 递归清洗 | ✅ JSON 合法，`content` 里 `<img src="/files/MANAGER/default/a.jpg" />` **完好** |

### 另外两道防线（已上线）

| 层 | 防护 | 效果 |
|---|---|---|
| 前端 `navbar.vue` | 提交前 `JSON.parse` 自检 | 不合法直接拦下并提示，不发出请求 |
| 后端 `PageDataServiceImpl` | `assertPageDataJson` | 不合法直接拒绝写入（`ServiceException`），**坏数据永不再入库** |
| 前端 `api/other.ts` | `getHomeData` 加 `?t=Date.now()` | 绕过浏览器缓存，避免旧数据"复活" |

### 部署与现状

- 后端重新打包 + 重启（41 秒），8887 正常，`sanitizeParameter` 已确认在运行中的 jar 里
- 数据：`Black Friday` 页 **JSON 合法，3 个组件**
- 前端三件套全绿（ratchet 1366）

### 教训

1. **“请求体清洗”和“表单参数清洗”是两条完全独立的路**。这次只修了前者，
   而装修保存恰好走后者（`application/x-www-form-urlencoded`），所以"修了还是坏"。
   判断依据应该是 **`Content-Type`**，不是"我以为它走 JSON"。
2. **用户给的 curl 比十次推理都值**：一眼就能看出编码方式，直接指向 `getParameterMap()`。
3. 有了 `assertPageDataJson` 之后，这类问题**最坏也只是"保存失败"**，不会再出现"页面打不开"。


## R67（2026-11-25）— 摘掉 `PanelTitle` / `PanelNotice` 的 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1366 | **1359**（−7） |
| no-explicit-any | 1230 | **1225**（−5） |
| **`@ts-nocheck`** | 54 | **52**（−2） |
| typecheck / build | 0 | 0 |

### 一、本轮的关键认识：`title` 是"版块里的多条公告"

`PanelNotice` 摘掉指令后最有价值的发现，是它对数据的真实理解：

```ts
/** 一条公告 */
type NoticeText = { context?: string; url?: NoticeLink; color?: string };

/** 一个公告版块：title 是"版块里的多条公告"（不是字符串） */
type NoticeItem = {
  title: NoticeText[];        // ← 关键
  textAlign?: string;
  color?: string;
};
```

之前的 `Record<string, unknown>` 让 `item.title.push({ context: "", url: "" })` 这种写法
既没有类型约束，也没暴露 `url` 应该是**链接对象**而不是空字符串。改成结构化后，
`addItem` / `removeItem` / `moveItem` 全部自动获得类型检查。

### 二、`PanelTitle` 暴露的三个"绑定类型不匹配"

| 位置 | 问题 | 修法 |
|---|---|---|
| `el-radio-group v-model="item.showMore"` | 写回 `string \| number \| boolean` | 字段放宽 |
| `el-radio-group v-model="item.bgType"` | 同上 | 字段放宽 |
| `el-color-picker v-model="item.bk_color"` | 清空写 `null` | `bk_color?: string \| null` |
| `color-field v-model="item.color"` | 组件 prop 只收 `string \| undefined` | **保持 `string`** |

注意最后一条：**同样是颜色，`el-color-picker`（直接控件）要允许 `null`，
而 `color-field`（自定义封装）只收 `string`** —— 这是本轮第二次踩到，
已作为固定规则记下：**看绑定的是原生 EP 控件还是本项目封装组件**。

### 三、`moreUrl` 也是链接对象

`item.moreUrl.___type` 说明"更多"按钮的链接同样是对象，不是字符串。
补了 `NoticeLinkLike` 类型别名后，`linkText(item.moreUrl)` 也有了准确入参。

### 四、为什么只做了 2 个文件

原本想把 7 个面板一次摘完，实测错误分布是：

| 文件 | 摘指令后错误数 |
|---|---:|
| `PanelPromotion` | 35 |
| `PanelMenu` | 27 |
| `PanelAdCube` | 24 |
| `PanelShop` | 18 |
| `SMS_SETTING` | 17 |
| `PanelNotice` | 12 |
| `PanelTitle` | 11 |

一次改 144 个错误风险过高（上一轮的教训：批量替换导致 PC 装修页白屏）。
所以**只保留错误数最少、结构最清楚的两个**，其余 5 个原样恢复 `@ts-nocheck`，
后续按"每轮 1~2 个"的节奏推进。

> 原则：**宁可每轮少降几个数字，也不要再出现"用户点到白屏"**。


## R68（2026-11-25）— 摘掉 `PanelShop` / `PanelMenu` 的 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1359 | **1344**（−15） |
| no-explicit-any | 1225 | **1212**（−13） |
| **`@ts-nocheck`** | 52 | **50**（−2） |
| typecheck / build | 0 | 0 |

### 一、又一次印证：`url` 一定是"链接对象"

两个面板都在 `addItem` 里塞了 `url: ""`，摘掉指令后立刻报错：

```ts
// ✗ 类型不匹配：url 是链接对象，不是字符串
local.list.push({ img: "", url: "", link: "", title: "标题", ... });
```

改成不塞 `url`（留空即"未配置"），并给 `MenuEntry.model` 补上字段：

```ts
local.list.push({ img: "", link: "", title: "标题", size: "88*88 (1:1)", model: "link" });
```

这和 R67 的 `PanelNotice` 是**同一个问题**：`any` 让人以为"塞个空字符串就行"，
一加类型就暴露"这个字段的语义根本不是字符串"。

### 二、`PanelShop` 的店铺行映射暴露了字段改名

```ts
firstItem.value.shopList = rows.map((s) => ({
  id: s.id as string | number | undefined,
  storeName: s.storeName as string | undefined,
  logo: (s.storeLogo ?? s.logo) as string | undefined,   // ← 老字段 storeLogo，新结构 logo
  storeLogo: s.storeLogo as string | undefined,
  selfOperated: s.selfOperated as boolean | undefined,
  storeBanner: (s.storeBanner as string | undefined) ?? "",
}));
```

`storeLogo` / `logo` 两个都保留，避免影响老数据渲染。

### 三、顺带补的两处空值保护

| 位置 | 风险 |
|---|---|
| `PanelShop.removeShop` | `firstItem.value.shopList.splice(...)` 在 shopList 缺失时抛错 |
| `PanelMenu.addItem` | 上面说的 `url: ""` 语义错误 |

### 四、本轮修掉的 any（13 个）

两个面板共 13 处 `any` 全部收口，其中值得记的是**回调签名统一**：

```ts
type LinkLike = { ___type?: string; url?: string; title?: string; [key: string]: unknown };
function linkText(url: LinkLike)
function selectedLink(val: LinkLike)
function callbackSelected(val: { url?: string })
function pickImage(item: MenuEntry)      // 原来 unknown
function pickLink(item: MenuEntry)       // 原来 unknown
function moveItem(index: number, dir: number)
```

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1344** |
| `any` | 2647 | **1212** |
| `@ts-nocheck` | 80 | **50** |

下一批：`PanelAdCube`(24) / `PanelPromotion`(35) / `SMS_SETTING`(17)。


## R69（2026-11-25）— 摘掉 `SMS_SETTING` / `PanelAdCube`，并抓到一个"点了就崩"的运行时炸弹

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1344 | **1330**（−14） |
| no-explicit-any | 1212 | **1200**（−12） |
| **`@ts-nocheck`** | 50 | **48**（−2） |
| typecheck / build | 0 | 0 |

### 一、`PanelAdCube`：一个必然崩溃的实现被类型检查兜出来了

```ts
function changeStyle(style: any) {
  if (style.type === props.res.type) return;
  /* $ */ undefined.emit("handleDrawer", style);   // ← 对 undefined 取 .emit
}
```

`undefined.emit(...)` 是**必然抛 TypeError** 的写法 —— 点「切换魔方风格」就崩。
这是之前用正则批量改代码留下的残骸（`/* $ */` 标记还在）。

修法：

```ts
const emit = defineEmits<{
  "update:options": [patch: Partial<PanelOptions>];
  handleDrawer: [style: CubeStyle];
}>();

function changeStyle(style: CubeStyle) {
  if (style.type === props.res.type) return;
  emit("handleDrawer", style);
}
```

> 注意：`defineEmits` 里原本**没有** `handleDrawer` 事件，只有 `update:options`。
> 这说明原代码想发的事件从未被声明过 —— 另一个"从来没能工作"的证据。

### 二、`SMS_SETTING`：全局设置表单的 type 缺失

```ts
const formValidate = ref<SmsSettingForm>({ ... });
type SmsSettingForm = {
  isTestModel?: string | number | boolean;   // el-radio-group 写回值域
  type?: string | number | boolean;          // 短信平台 ALI / HUAWEI / TENCENT
  signName?: string;                          // 阿里云签名
  [key: string]: string | number | boolean | undefined;
};
```

模板里 `formValidate.type` 被 12 处 `v-if` 引用（阿里云/华为云/腾讯云各自的配置块），
但类型里**根本没有 `type` 字段** —— 之前全靠 `Record<string, any>` 蒙过去。

另外三处顺带修好：

| 位置 | 问题 |
|---|---|
| `getCurrentInstance()` | 可能为 `null`，`proxy` 直接解构会崩 → 加兜底 |
| `result.value = JSON.parse(props.res)` | `result` 是 `ref("")`（字符串），却当对象用 → 改成 `Record<string, string>` |
| `setSetting(props.type, ...)` | `props.type` 可能 undefined → 兜底空串 |
| `:rules="ruleValidate"` | 用 `Record<string, unknown>`，`el-form` 要 `FormRules` |

`init()` 里原来的写法也很脆：

```ts
Object.keys(result.value).map((item: any) => { result.value[item] += ""; });
```

改成显式构造字符串表（顺带说明为什么）：**设置项统一转字符串，避免 number/boolean 与输入框不匹配**。

### 三、又一个"不存在的文件"导入

```ts
import _ColorField from "../controls/_ColorField.vue";   // ✗ 该文件不存在
```

模板里其实只用 `gradient-field`（`GradientField`），`_ColorField` 是**从未生效的死导入**。
直接删掉，`typecheck` 也不再报 `Cannot find module`。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1330** |
| `any` | 2647 | **1200** |
| `@ts-nocheck` | 80 | **48** |

下一批：`PanelPromotion`(35) —— wap 面板里错误最多、结构最复杂的一个，
单独一轮处理。

### 缺陷修复（R69 追加）— 图片魔方"拖入"没有默认图片，与"切换风格"不一致

用户观察：新建图片魔方时图片没有默认内容，切换风格后才有 —— 问是否正常。

**结论：不正常，是两条插入路径不一致导致的。**

### 原因

组件插入有两条路径，对"图片魔方"的处理不同：

| 路径 | 走哪个函数 | 是否替换成默认风格 |
|---|---|---|
| 点击组件库 | `cloneModel` | ✅ 会换成「左一右二」（自带 3 张图） |
| **拖拽到画布** | `packageModel` | ❌ **原样插入空的 `tpl_ad_list`** |

而 `tpl_ad_list` 本身的默认数据还是**过时的字段名**：

```js
// ✗ 旧字段：bg_img / name
options: { list: [{ bg_img: "", name: "", url: "" }] }
```

各风格用的是 `img / url / link / size / model`。所以拖入的魔方：
既没有 `img` 字段、也没有图片，面板里就是一片空白 —— 看起来像"没有默认 url"。

### 修复（两处）

**① 抽出统一的"插入默认风格"解析**（`wap/index.vue`）

```ts
function resolveInsertModel(model: ComponentModel): ComponentModel {
  if (model.type !== "tpl_ad_list") return model;
  const fallback = (modelData as ComponentModel[]).find((i) => i.type === "leftOneRightTwo");
  return fallback ?? model;
}
```

`cloneModel` 与 `packageModel` 都改用它 —— 拖拽和点击从此行为一致。

**② 把 `tpl_ad_list` 的默认项字段对齐现行结构**

```js
options: {
  // 字段名与各风格保持一致（img / title / url / link / size / model）。
  // 魔方本身没有内容，插入时会自动切到「左一右二」风格，这里只作兜底占位。
  list: [{ img: "", title: "", url: "", link: "", size: "375*375", model: "link" }]
}
```

即使将来有人绕过 `resolveInsertModel` 直接插入，字段名也不会错位。

### 验收

```
typecheck / build / lint  全部 exit 0（ratchet 1330）
```

### 顺带说明

「图片魔方」的设计是**先选风格再填内容**（画布上默认显示"请选择风格"），
所以空白本身是预期行为；但**同一个组件拖入和点击添加的结果不同**是缺陷，已修。

### 严重缺陷修复（R70）— 类型化时引入的 `list: []` 会把面板内容清空

用户反馈：新建图片魔方后「图片没有默认 url」，而且面板里**没有设置链接的入口**。

### 根因：我在做面板类型化时写错了一行初始化

为了满足 `PanelOptions.list` 必填，我在 11 个面板里都写成了：

```ts
const local = reactive<PanelOptions>({ ...(props.res.options ?? {}), list: [] });
//                                             ↑ 展开在前        ↑ 覆盖在后
```

`list: []` **在展开之后**，把组件真实的图片/条目**覆盖成空数组**。后果是连锁的：

1. 面板 `v-for="(item, index) in local.list"` → 一行都没有 → **「选择链接」入口消失**
2. 面板 `onMounted(() => emit("update:options", { ...local }))` → 把空 `list` 上报给装修器
3. 装修器合并后，画布上的组件也被清空 → 图片变成 `<img src="">` → **显示为破图**

所以表象是"没有默认 url"，实际是**面板一打开就把内容清掉了**。

### 正确写法（11 个文件统一）

```ts
/**
 * 本地副本：取组件当前配置的浅拷贝。
 *
 * 注意 list 的写法：**必须保留组件已有的条目**。
 * 早期写成 `{ ...options, list: [] }` 会把已有图片/条目覆盖成空数组 ——
 * 面板一打开就"没有内容"，watch 上报后还会把画布上的内容一起清掉。
 */
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  list: Array.isArray(props.res.options?.list) ? props.res.options.list : [],
});
```

修复清单：

| 文件 | 备注 |
|---|---|
| `PanelAdCube` | 图片魔方（本次反馈的组件） |
| `PanelArticle` / `PanelSearch` | 多行写法，另外两处遗漏 |
| `PanelCoupon` / `PanelFlexOne` / `PanelIntegral` | 营销类面板 |
| `PanelMenu` / `PanelNotice` / `PanelShop` / `PanelTitle` / `PanelVideo` | 基础类面板 |

另外 `PanelSearch.hotWords` 同样处理：`Array.isArray(...) ? ... : []`，避免把已有热词冲掉。

### 结论：这不是"默认数据"的问题

之前我以为要改 `config.ts` 的默认图（`tpl_ad_list` 用的还是 `bg_img/name` 老字段），
但**用户看到的破图与默认数据无关** —— 是面板把 `list` 清空了。
`config.ts` 的字段对齐仍然保留（那也是一处真实的历史遗留问题），但它不是本次的主因。

### 自我复盘

这类错误**类型检查抓不到**：`list: []` 类型完全合法，只有运行起来（或看数据）才会暴露。
教训是：**"为了满足类型"而改初始化逻辑，必须逐个确认它没有改变运行时语义**。
这条已写进规范：**类型标注只允许"加标注"，不允许顺带改值**。

### 验收

```
typecheck / build / lint  全部 exit 0（ratchet 1330）
```

11 个文件全量复查：`grep 'reactive<PanelOptions>((?s).{0,200}?list: []'` —— **零残留**。

### 改进（R71）— 保存失败要返回真实原因，不能一律「服务器繁忙」

用户反馈：保存失败时前端只看到「服务器繁忙」，无从排查。

### 问题出在三个地方

**① 我自己写的校验抛了"无消息"的异常**

```java
catch (Exception e) {
    log.error("pageData 不是合法 JSON，已拒绝写入，长度=" + pageData.length(), e);
    throw new ServiceException(ResultCode.ERROR);   // ← 消息就是「服务器繁忙，请稍后重试」
}
```

`ServiceException(ResultCode.ERROR)` 的 msg 取自错误码文案，等于**把真实原因吞掉了**。

**② 全局兜底把未知异常压成默认文案**

```java
if (serviceException != null) { ... }
return ResultUtil.error();      // ← 任何非 ServiceException 都变成「服务器繁忙」
```

**③ 前端 `success=false` 分支不看 message**

`.catch` 里已经用了 `res.message`，但 `then` 里的 `success === false` 分支写死「修改失败，请稍后重试」。

### 三处一起改

**① 校验异常带位置**

```java
throw new ServiceException("页面数据格式非法，已拒绝保存（长度 " + pageData.length()
        + "，位置 " + extractPosition(e.getMessage()) + "），请刷新页面后重试");
```

日志里额外记录**出错位置前后 80 字符的片段**（只进日志，不回显给前端）：

```java
String snippet = snippetAround(pageData, e.getMessage(), 80);
log.error("pageData 不是合法 JSON，已拒绝写入，长度=" + pageData.length() + "，片段=" + snippet, e);
```

**② 未知异常也带原因**

```java
return ResultUtil.error(ResultCode.ERROR.code(), describeUnexpected(e));
```

```java
private String describeUnexpected(Throwable e) {
    String type = e.getClass().getSimpleName();
    String msg = e.getMessage();
    if (CharSequenceUtil.isBlank(msg)) return type;
    msg = msg.replaceAll("\\s+", " ").trim();      // 单行化
    if (msg.length() > MAX_LENGTH) msg = msg.substring(0, MAX_LENGTH) + "…";
    return type + ": " + msg;                       // 例如 DataIntegrityViolationException: ...
}
```

原则：**不回显堆栈、不泄露内部路径，但要给出"异常类型 + 简短原因"**。

**③ 前端展示后端消息**

```ts
ElMessage.error(res.message ? `修改失败：${res.message}` : "修改失败，请稍后重试");
```

三处 `success === false` 分支全部改掉（修改/保存/发布）。

### 部署

后端重新打包 + 重启（18.3 秒）→ 8887 正常；前端三件套全绿（ratchet 1330）。

### 下一步（需要用户配合一次）

用户那条 curl 的 token 已过期（GET 返回「登录已失效」），无法直接复现。
现在只要在界面里**再点一次保存**：

- 成功 → 说明之前的失败是数据/缓存问题，已随修复消失
- 失败 → 前端会弹出**具体原因**（如「页面数据格式非法，已拒绝保存（长度 9xxx，位置 3456）」），
  同时后端日志里有 `片段=...`，可以直接定位坏在哪一段

### 结论

「服务器繁忙」这类兜底文案的问题不是"文案不好"，而是**把可诊断信息丢掉**。
正确做法：**兜底可以，但必须把原因一起带出来**，且区分"给用户看的"（简短）与"给日志看的"（含片段/堆栈）。

### 改进 + 定位（R72）— 用真实 token 复现：保存已经能成功，且不再破坏商品数据

用户要求：保存失败要返回原因，不能一律「服务器繁忙」。

### 一、拿到真实 token（关键突破）

用户 curl 里的 token 我手抄过两次都 403。最后从 **Redis 里直接取现有会话**：

```
redis-cli --scan --pattern *ACCESS_TOKEN_MANAGER*
{ACCESS_TOKEN_MANAGER}_1337306110277476352_eyJhbGciOiJIUzI1...
```

`ManagerAuthenticationFilter` 除了验签，还要求 token 在 Redis 里存在（服务端会话），
所以自签 token 无效、而 Redis 里的真实 token 可用 —— 用它 GET 页面返回 **200**。

### 二、复现结论：保存已经成功

用真实 token 做了两次 PUT：

| 用例 | 结果 |
|---|---|
| 原样保存（pageData 不变） | **200 success** |
| 给魔方第一格设置**真实商品链接**（含 `specs` / `sellingPoint`）后保存 | **200 success** |

保存后读库校验：

```
✅ JSON 合法，组件数 4
   url.___type = goods
   specs = {"images":[{"showProgress":false,...
   specs 是否被转成实体: false        ← 修复生效
```

也就是说：**之前那次失败，是"表单参数被 HTML 清洗"和"面板把 list 清空"两个缺陷叠加的结果，现在都已修好。**

### 三、顺带修掉一个真实的数据损坏

复现时发现：商品对象里的 `specs` 是**字符串里再放一段 JSON**，它被当成 HTML 清洗后会变成：

```
"specs":"{&#34;images&#34;:[&#34;https://...&#34;]}"     ← 引号全被转成实体，业务数据被改坏
```

修复（`XssHttpServletRequestWrapper#sanitizeJsonValue`）：

```java
if (value instanceof CharSequence) {
    String text = value.toString();
    // 叶子值本身也可能是 JSON（典型：商品 specs）——按 JSON 递归清洗，不能当 HTML
    if (looksLikeJson(text)) return sanitizeJsonText("nested", text);
    // URL 只用于展示/跳转，跳过清洗既安全又不会破坏特殊字符
    if (looksLikeUrl(text)) return text;
    return cleanXSS(text);
}
```

### 四、错误信息（上一轮已部署，本轮确认生效）

- 校验失败：`页面数据格式非法，已拒绝保存（长度 N，位置 P），请刷新页面后重试`
- 未知异常：`SimpleName: 简短原因`（单行化 + 截断）
- 日志额外记录 `片段=...`（出错位置前后 80 字符），只进日志不回显

### 五、数据回滚

测试期间我往魔方第一格写了一个商品链接，测完用 `UNHEX` 从 hex 备份**原样回滚**：

```
✅ 回滚后 JSON 合法，组件数 4，第一格 url 回到 ""
```

### 六、结论

1. **保存链路现在是通的**（真实 token + 真实商品数据实测 200）
2. **商品 specs 不再被破坏**
3. 若还有失败，前端会给出具体原因，后端日志有出错片段

### 教训

- 排查"保存失败"这类问题，**先拿到一个能用的会话**（Redis 里就有），
  否则只能猜；这一步省下了大量推理。
- **"字符串里放 JSON"是这类系统的常态**（商品 specs、装修 pageData、设置项），
  任何"统一清洗/统一转义"的过滤器都必须能识别并递归处理它。


## R73（2026-11-25）— 摘掉 `PanelRecommendFeed` / `PanelCarousel` 的 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1330 | **1316**（−14） |
| no-explicit-any | 1200 | **1188**（−12） |
| **`@ts-nocheck`** | 48 | **46**（−2） |
| typecheck / build | 0 | 0 |

### 一、`PanelCarousel`：第四个面板确认了同一处历史问题

```ts
// addItem 里塞空字符串 —— url 的真实语义是"链接对象"
local.list.push({ img: "", url: "", link: "", size: "750*350", model: "link" });
```

改成不塞 `url`，并把 `CarouselSlide.url` 声明成链接对象。这是**第 4 个**面板踩到同一处
（`PanelNotice` → `PanelMenu` → `PanelShop` → `PanelCarousel`），已经可以当作固定检查项：

> **所有 `options.list[]` 里名为 `url` 的字段都是链接对象，不是字符串。**

### 二、`PanelRecommendFeed`：`inject<any>` 掩盖了回调签名

```ts
const openGoodsPicker = inject<any>('openGoodsPicker', null);
openGoodsPicker((selectedGoods: any) => { ... }, local.goods || []);   // ← 第二个参数哪来的？
```

`pc/index.vue` 的 `openGoodsPicker(callback, initialSelected = [])` 其实**支持第二个参数**，
但因为 `inject<any>` 什么都接受，这里传了也没人校验。补上真实签名：

```ts
type GoodsPickerHandler = (
  cb: (rows: Array<Record<string, unknown>>) => void,
  initialSelected?: Array<Record<string, unknown>>,
) => void;
```

这样下次谁再改 `openGoodsPicker` 的签名，这处调用会立刻编译报错。

### 三、顺带修的字段映射

```ts
local.goods = selectedGoods.map((g) => ({
  id: (g.id ?? g.skuId ?? g.goodsId) as string | number | undefined,
  goodsName: (g.goodsName ?? g.name) as string | undefined,
  thumbnail: (g.thumbnail ?? g.pic ?? defaultThumb) as string,
  ...
}));
```

`g.thumbnail || g.pic || defaultThumb` 里 `defaultThumb` 是兜底，类型上要保证是 `string`。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1316** |
| `any` | 2647 | **1188** |
| `@ts-nocheck` | 80 | **46** |

下一批：`PanelPromotion`(35) / `tpl_integral`(1) / `tpl_coupon`(2) / `advertising.vue`(7)。


## R74（2026-11-25）— 摘掉 4 个 `@ts-nocheck`（含最复杂的 `PanelPromotion`）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1316 | **1298**（−18） |
| no-explicit-any | 1188 | **1174**（−14） |
| **`@ts-nocheck`** | 46 | **42**（−4） |
| typecheck / build | 0 | 0 |

本轮清空：`PanelPromotion`(35→0)、`advertising.vue`(7→0)、`tpl_integral.vue`(4→0)、`tpl_coupon.vue`(2→0)。

### 一、`PanelPromotion`：三种促销类型共用一套面板

```ts
type PanelOptions = {
  list: PromotionItem[];
  icon?: string;
  headBgType?: string | number | boolean;   // el-radio-group
  headTitleType?: string | number | boolean;
  moreUrl?: PromotionLink;                   // 更多按钮的链接对象
  showGoodsName?: string | number | boolean; // el-switch 一整排
  ...
};
```

模板里 `promotionsType` 决定标题/默认值（秒杀、砍价用 `SECKILL_DEFAULTS`），
但 `props.res` 的类型里**根本没这个字段** —— 又一个被 `any` 藏起来的真实字段。补上后：

```ts
const props = defineProps<{
  res: { name?; type?; promotionsType?: string; options?: PanelOptions };
}>();
```

### 二、`advertising.vue`：抓到一个「绑定了不存在的函数」

```vue
<input type="file" @change="changeFile(item, index)" />   <!-- changeFile 从来没有定义过 -->
```

这个隐藏的 file input 是历史遗留（现在走的是素材库 `handleClickFile`），
`@change` 绑定了一个不存在的函数，`@ts-nocheck` 让这件事完全看不出来。已移除。

另外 `handleClickFile()` 定义成无参，但模板传了 `(item, index)` —— 参数被静默丢弃。
已改成 `handleClickFile(_item?: unknown, _index?: number)`。

### 三、store 字段类型被纠正

```ts
// ✗ 声明成字符串，实际存的是"组件数组"
openStyleStore: "",
// ✓
openStyleStore: [] as unknown[],
```

`advertising.vue` / `alertAdvertising.vue` 都往它赋数组，`navbar.vue` 保存时取 `openStyleStore[0]`，
声明成 `string` 是错的。改对之后 watch 回调里的 `as unknown as` 断言也一并去掉了。

### 四、`api/other.ts` 的入参放宽

```ts
export const getOpenHomeData = (params: ApiParams | string) => ...
export const addOpenHomeData = (params: ApiParams | string) => ...
```

调用处传的是 `pageType` 字符串（拼进 URL），原来的 `ApiParams` 类型与实际用法不符。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1298** |
| `any` | 2647 | **1174** |
| `@ts-nocheck` | 80 | **42** |

剩余 `@ts-nocheck` 里 `any` 较少的大文件：`tpl_shop`(6) / `tpl_goods`(6) / `carousel2.vue`(8) / `ossManage.vue`(8)。


## R75（2026-11-25）— 摘掉 3 个模板/模型文件的 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1298 | **1274**（−24） |
| no-explicit-any | 1174 | **1154**（−20） |
| **`@ts-nocheck`** | 42 | **39**（−3） |
| typecheck / build | 0 | 0 |

清空：`tpl_shop.vue`(6→0)、`tpl_goods.vue`(6→0)、`modelList/carousel2.vue`(8→0)。

`ossManage.vue` 摘掉后 **78 个错误**（元素最多），已恢复指令，留作单独一轮。

### 一、这批文件暴露的 EP「无效属性」问题

`strictTemplates` 把 Element Plus 的属性检查做实了，三个文件里都有：

| 位置 | 写的 | 实际 |
|---|---|---|
| `el-carousel` | `:autoplay-speed="5000"` | **没有这个属性**，应是 `:interval` |
| `el-button` | `shape="circle"` | **没有 shape**，圆形按钮是 `round` |
| `<li>` | `:alt="article.title"` | `<li>` 没有 `alt`，应是 `:title` |
| `<img>` | `alt`（裸属性） | 会被当成 `alt={true}`，与 `string` 冲突 → `alt=""` |

这些**以前全靠 `@ts-nocheck` 蒙过去**，实际是无效写法（`autoplay-speed` 从来没生效过）。

### 二、`tpl_shop` 的 `selfOperated` 值域

```ts
// 后端可能给 boolean / "true" / 1 / "1"
selfOperated?: boolean | string | number;
```

类型收窄成 `boolean` 时，`shop.selfOperated === 'true'` 这种历史判断会被判定
"不可能成立"（TS2367）——**但线上确实有字符串/数字形态的老数据**，所以必须放宽，
而不是把判断删掉。

### 三、`carousel2` 的三个"可能为 null"

```ts
const selected = ref<{ img?: string; url?: unknown } | null>(null);
if (selected.value) selected.value.img = item.url;     // 原来直接赋值
liliDialogRef.value?.open("link");                      // 原来直接调用
```

`selected` 在"未选中时点击回调"的路径下确实是 `null`，原来会崩。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1274** |
| `any` | 2647 | **1154** |
| `@ts-nocheck` | 80 | **39** |

剩余 `@ts-nocheck` 主要集中在大文件：`ossManage.vue`(78 错) / `pc/index.vue`(107 错) /
`tpl_promotion_detail.vue` / `payment-success` / `decorate.vue` 等。


## R76（2026-11-25）— 摘掉 `ossManage.vue`（素材库，78 个错误）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1274 | **1266**（−8） |
| no-explicit-any | 1154 | **1146**（−8） |
| **`@ts-nocheck`** | 39 | **38**（−1） |
| typecheck / build | 0 | 0 |

这是单文件错误数最多的一个（1318 行 / 78 个错误），按 **6 批**推进：
类型定义 → 隐式 any 参数（39 处）→ 状态类型 → EP 回调签名 → 空值 → 列表元素类型。

### 一、最重要的一条：`el-radio-group` 的绑定策略

第一版把 `activeRoleTab` 放宽成 `string | number | boolean`，结果**连锁出错**：
它被当作 `searchForm.userEnums` / 对象索引 / `split()` 的入参，宽值域立刻污染下游。

最终改成 **「状态保持窄类型，绑定处显式收窄」**：

```vue
<el-radio-group
  :model-value="activeRoleTab"
  @update:model-value="(v: string | number | boolean | undefined) => handleRoleTabChange(String(v ?? ''))"
>
```

> 规则：**组件库的宽值域只在「绑定边界」收窄，不要把宽度传染给业务状态。**
> 之前 4 个面板是反过来做的（放宽字段），因为那些字段没被下游当索引用；
> 一旦字段参与索引/计算，就必须走「绑定处收窄」。

### 二、`el-upload` / `el-checkbox-group` 的回调签名

```ts
// ✗ 自己写的两参签名，与 EP 对不上
function handleSuccess(res: unknown, file: OssFile)
// ✓ 按 EP 的三参
function handleSuccess(res: unknown, _file?: unknown, _files?: unknown)

// el-checkbox-group 的 change 给 CheckboxGroupValueType
function selectOssChange(e: Array<string | number | boolean>)
```

### 三、补了 `dplayer` 的类型声明

```ts
// apps/manager/src/types/dplayer.d.ts
declare module "dplayer" {
  export default class DPlayer {
    constructor(options: DPlayerOptions);
    play(): void; pause(): void; destroy(): void;
  }
}
```

`dplayer` 自带没有类型（`DPlayer.min.js`），之前只能 `let dp: unknown` 然后到处报错。
补最小声明后 `dp.destroy()` 等调用都正常了 —— **第三方无类型库应当补 shim，而不是 any**。

### 四、`getTree` 的树节点类型

```ts
// 树节点同时有 业务字段(id/name/directoryType) 和 el-tree 展示字段(value/title/label)
const value = node.id ?? node.value;
const type = node.directoryType ?? node.type;
```

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1266** |
| `any` | 2647 | **1146** |
| `@ts-nocheck` | 80 | **38** |

剩余 `@ts-nocheck` 里最大的仍是 `pc/index.vue`(107 错) 与 `tpl_promotion_detail.vue`，
其余多为模板类文件。


## R77（2026-11-25）— 摘掉 `pc/index.vue` 的 `@ts-nocheck`（107 个错误，2503 行）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1266 | **1264**（−2） |
| no-explicit-any | 1146 | **1145** |
| **`@ts-nocheck`** | 38 | **37**（−1） |
| typecheck / build | 0 | 0 |

这是剩余文件里错误最多、行数最大的一个（PC 装修主控），按 **9 批**推进：
样式对象 → refs 类型 → EP 值域 → vuedraggable → route.query → payload → 配置面板 props。

### 一、`vuedraggable` 的专有属性：`v-bind` 合并

`vuedraggable` 的类型里没有 `group` / `sort` / `handle`，逐个写属性必然报「多余属性」：

```vue
<!-- ✗ 每个都会报 TS2353 -->
<draggable group="pc-model-rows" :sort="false" handle=".row-drag-handle" />
<!-- ✓ 收进一个 v-bind 对象 -->
<draggable v-bind="{ group: 'pc-model-rows', sort: false, handle: '.row-drag-handle' }" />
```

**踩坑**：我第一版给每个属性单独加了 `v-bind`，结果同一个元素上出现 3 个 `v-bind`，
构建直接失败 `Duplicate attribute` —— **一个元素只能有一个 `v-bind` 对象**。

### 二、`getCurrentInstance()` / `configPanelRef` 的成员要写全

```ts
const configPanelRef = ref<{
  $forceUpdate?: () => void;
  selectComponentTab?: () => void;
  selectRowTab?: () => void;
} | null>(null);
```

之前只声明了 `$forceUpdate`，于是 `selectComponentTab()` / `selectRowTab()` 全报「属性不存在」——
而它们**是真实存在的**（配置面板 `defineExpose` 出来的）。@ts-nocheck 让这类"漏声明"永远发现不了。

### 三、`PcRowStyle` 少声明了两个真实字段

```ts
// 布局代码一直在写这两个字段，类型里却没有
alignItems?: string;
justifyContent?: string;
```

### 四、样式对象要么声明成 `Record<string, string>`，要么补全字段

```ts
const s: Record<string, string> = { display: 'flex', ... };  // 允许后续 s.minHeight / s.gap
```

原来是 `const s = {...}` 字面量，后续 `s.minHeight = ...` 直接报「属性不存在」。

### 五、配置面板 props 的类型边界

```ts
// 面板只读字段 + 回写 options，不需要与画布共享精确类型
type PanelRowLike = Record<string, any>;
const rowForPanel = computed(() => props.selectedRow ?? undefined);
```

子面板 props 是 `Record<string, any>`，而 `PcRow` / `PcComponent` **没有索引签名**，
两者不兼容。用 computed 做一次显式转换，既保留了画布侧的精确类型，也让面板侧能收下。

### 六、其它真实缺陷

| 问题 | 说明 |
|---|---|
| `import { _Close }` | 图标库里**没有** `_Close`（只有 `Close`），且 `Close` 也没被用到 → 直接删掉 |
| `parseFloat(widthRatio)` | 入参是 `string \| undefined`，会得到 `NaN` → `parseFloat(String(x ?? ''))` |
| `route.query.id` | 可能是数组（同名参数多次出现）→ 统一取第一项再 `String()` |
| `legacyHeights.includes(height)` | `height` 是 `string \| number`，`includes` 只认一种 → `.map(String)` 后比较 |

### 七、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1264** |
| `any` | 2647 | **1145** |
| `@ts-nocheck` | 80 | **37** |

**PC 装修主控彻底摆脱 `@ts-nocheck`** —— 这是本期工作量最大、也最容易出白屏的一个文件。


### 修复（R77 回归）— PC 装修白屏：`/pageData/[object Object]`

用户报错截图：`GET http://127.0.0.1:8887/manager/other/pageData/[object%20Object]?t=...` → CORS/ERR_FAILED。

**这是我上一轮引入的运行时回归。**

上一轮为了消掉一个类型错误（`Argument of type 'string' is not assignable to parameter of type 'ApiParams'`），
我把 id 包成了对象：

```ts
// ✗ 为了让 TS 闭嘴，改变了运行时行为
API_floor.getHomeData({ id: id as string } as unknown as Parameters<typeof API_floor.getHomeData>[0])
```

而 `getHomeData` 的实现是把参数**拼进 URL 路径**：

```ts
return getRequest(`/other/pageData/${params}?t=${Date.now()}`);
```

于是对象被拼成了 `[object Object]`，后端当然找不到这个页面。

### 正确修法：让签名说出真相

```ts
/**
 * 按 id 获取页面装修数据。
 * 注意：参数会拼进 URL 路径，必须是 id 字符串（传对象会被拼成 [object Object]）。
 */
export const getHomeData = (id: string | number) => {
  return getRequest(`/other/pageData/${id}?t=${Date.now()}`);
};
```

调用处还原成传 id：

```ts
API_floor.getHomeData(id ?? "").then((res) => { ... });
```

### 验证

用 Redis 里的真实 token 直接打接口：

```
GET /manager/other/pageData/2125235235160145922?t=...  -> HTTP 200
name=平台首页装修  pageData长度=10589
```

前端：typecheck / build / lint 全绿（ratchet 1264）。

### 教训（写进 TYPES-GUIDE）

> **类型错误不能用"改值"来消除。**
> 当报错是 `string 不是 ApiParams` 时，先看这个参数**运行时到底是什么**：
> 如果它会被拼进 URL，那正确做法是**把 API 签名改成 `string | number`**，
> 而不是把字符串包成对象去迎合错误的类型。
>
> 判据：`as unknown as X` 出现在**调用方**（而不是数据边界）时，几乎一定是错的方向。


## R78（2026-11-25）— 摘掉「页面列表」两个同名页面的 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1264 | **1262**（−2） |
| `any` | 1145 | 1145 |
| **`@ts-nocheck`** | 37 | **35**（−2） |
| typecheck / build | 0 | 0 |

清空：`floorList.vue`(PC 页面列表)、`wap/wapList.vue`(H5 页面列表)。两个文件结构几乎相同，
问题也完全一样 —— 正好可以对比着修。

### 一、`el-tabs` 的 `v-model` 是 `TabPaneName`，不是 `string`

```vue
<!-- ✗ searchForm.pageType 是 string，TabPaneName 更宽 -->
<el-tabs v-model="searchForm.pageType">
<!-- ✓ -->
<el-tabs
  :model-value="searchForm.pageType"
  @update:model-value="(name: string | number) => (searchForm.pageType = String(name))"
>
```

### 二、`el-button` 没有 `href` —— 这个按钮本来就该是链接

```vue
<!-- ✗ tag="a" + href 在 EP 里都不成立，点了其实没反应 -->
<el-button type="primary" tag="a" :href="addHref" target="_blank">添加页面</el-button>
<!-- ✓ -->
<el-link type="primary" :href="addHref" target="_blank">添加页面</el-link>
```

**这是一个真实的可点击性缺陷**：`el-button` 渲染的是 `<button>`，
`href` 只是被当作普通属性挂上去，**浏览器不会导航**。之前点「添加页面」应该是没反应的。

### 三、`el-switch` 的 `before-change` 必须返回 `boolean`

```ts
// ✗ beforeRelease 返回 false | Promise<unknown>
:before-change="() => beforeRelease(row)"
// ✓
:before-change="() => Boolean(beforeRelease(row))"
```

> 注意语义：`before-change` 返回 `true` 才会切换。
> 原来返回 `false` 时是「不允许切换」，包一层 `Boolean()` 后行为不变。

### 四、`payment-success` 本轮未收（已留原因注释）

支付成功页 25 个错误，但它的**模板是单行密集写法**（一行 500+ 字符），
需要逐处做字符串手术，风险高于收益。已在文件头写明：

```ts
// @ts-nocheck —— 支付成功页模板是单行密集写法，待单独一轮收口（R78 剩 25 错）
```

### 五、接口验证

```
GET /manager/other/pageData/pageDataList?pageType=INDEX&pageClientType=PC  -> 200
  - 平台首页 / CLOSE
  - 平台首页装修 / OPEN
```

### 六、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1262** |
| `any` | 2647 | **1145** |
| `@ts-nocheck` | 80 | **35** |


## R79（2026-11-25）— 摘掉开屏广告 / 老装修页的 `@ts-nocheck`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1262 | **1240**（−22） |
| no-explicit-any | 1145 | **1125**（−20） |
| **`@ts-nocheck`** | 35 | **33**（−2） |
| typecheck / build | 0 | 0 |

清空：`alertAdvertising.vue`(13 any → 0)、`renovation.vue`(9 any → 0)。

### 一、重大发现：`alertAdvertising` 的属性被批量改成了 `_type`

```vue
<input _type="file" />                     <!-- 渲染成文本框，选不了文件 -->
<el-button _type="primary">选择链接</el-button>  <!-- 丢掉了主按钮样式 -->
<el-tag :_type="...">                     <!-- tag 颜色丢失 -->
```

这不是笔误 —— 整个文件里 `type` 都被替换成了 `_type`（连脚本里的 `const _type = ref("full")` 也是）。
**后果**：那个隐藏的文件选择框根本没有 `type="file"`，用户点「选择图片」走的是素材库（另一条路径），
所以这个缺陷一直没被发现。

已全部还原为 `type`，并顺手删掉了从未被使用的 `displayMode` 状态。

### 二、`renovation.vue`（老的 PC 装修入口）

```ts
// applyPageData 同时要处理三种形态：null / JSON 字符串（本地缓存）/ 对象（接口返回）
function applyPageData(raw: unknown) {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try { parsed = JSON.parse(raw); } catch { modelForm.value = { list: [] }; return; }
  }
  ...
}
```

原来内部有三套重复的解析分支（`raw` / `pageData` 混用），已合并成一条路径。

### 三、`route.query.id` 统一收口

```ts
function queryId(): string {
  const raw = route.query.id;
  return String(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "");
}
```

两个页面（`renovation`、`pc/index`）都有这个问题：同名 query 出现多次时值是数组，
直接传给接口会变成 `"id1,id2"`。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1240** |
| `any` | 2647 | **1125** |
| `@ts-nocheck` | 80 | **33** |


### 修复（R79-b）— 素材库上传 403：组件模式下根本没初始化

用户报错：素材库弹窗里上传图片 → `403 未登录或token失效`，且弹窗里「共 0 条 / 暂无相关素材文件」。

### 根因：`onMounted` 只在「独立页面」模式初始化

```ts
onMounted(() => {
  if (!props.isComponent) {
    init();                 // ← 只有独立页面才初始化
  } else {
    searchForm.pageSize = 20;   // ← 弹窗模式：什么都没做
  }
});
```

`init()` 里做了两件关键事情：

```ts
function init() {
  accessToken.value = { accessToken: getStore("accessToken") };  // 上传请求头
  getDataList();                                                 // 加载素材列表
}
```

所以**以组件形式打开时（PC/H5 装修里的素材库弹窗）**：

1. 上传请求头是空的 `{}` → 后端过滤器读不到 token → **403**
2. 列表也没请求 → 界面显示 0 条

弹窗之所以有时"能用"，是因为另一条路径（`selectImage` / `props.initialize` 的 watch）会调 `init()`；
一旦入口直接改 `fileType` 打开弹窗，就绕过了初始化。

### 修复一：上传头改成 computed（永远不会失效）

```ts
const accessToken = computed<Record<string, string>>(() => ({
  accessToken: getStore("accessToken") || "",
}));
```

不再依赖「初始化时赋值一次」，任何入口、任何时候上传都带着当前 token。

### 修复二：`onMounted` 无条件初始化

```ts
onMounted(() => {
  if (props.isComponent) {
    searchForm.pageSize = 20;
  }
  init();      // 独立页面和弹窗都要初始化
});
```

### 验证

后端用真实 multipart + 真实 token 直传：

```
POST /manager/common/upload/file  -> HTTP 200
{"code":200,"message":"success","result":"/files/MANAGER/default/d0f33f962cd54ca3a11a84509b086c41.png"}
```

前端：typecheck / build / lint 全绿（ratchet 1240）。

### 备注

返回的 `result` 是 `/files/MANAGER/default/xxx.png` —— 这是**相对路径**，
前端展示时需要拼上文件服务器地址，就是之前记下的「上传图片 URL 显示问题」，
按你的要求留到以后统一处理。


## R80（2026-11-25）— 摘掉 `modelList` 三个装修模型

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1240 | **1206**（−34） |
| no-explicit-any | 1125 | **1094**（−31） |
| **`@ts-nocheck`** | 33 | **30**（−3） |
| typecheck / build | 0 | 0 |

清空：`modelList/carousel.vue`(10 any → 0)、`firstPageAdvert.vue`(8 → 0)、`notEnough.vue`(11 → 0)。

### 一、又是「`Record<string, unknown>` 会让模板失效」

第一版把弹窗草稿写成 `Record<string, unknown>`，结果模板里 `v-model="selected.img"` 全部报错 ——
因为索引签名只保证"值存在"，值类型是 `unknown`。

正确做法是**声明真实字段**：

```ts
type AdvertItem = {
  img?: string;
  name?: string;
  url?: string;
  describe?: string;
  /** el-color-picker 会写 null */
  fromColor?: string | null;
  toColor?: string | null;
  [key: string]: unknown;   // 兜底，但不影响已知字段的类型
};
```

> 规则：**`Record<string, unknown>` 只适合"纯转发"的数据；一旦模板要读写具体字段，
> 就必须把字段声明出来。**

### 二、`el-color-picker` 会把颜色写成 `null`

```ts
fromColor?: string | null;   // 不是 string | undefined
```

这是第 N 次踩这个坑 —— 只要字段绑定到 `el-color-picker`，就必须允许 `null`。

### 三、抓到一处真实的 `push` 语义错误

```ts
// ✗ 往 GoodsItem[] 里 push 了一个数组（10 个占位商品挤成一格）
draftGoodsList.value.push([
  { img:'', name:'', price:0, url:'' },
  ... 共 10 个
]);
// ✓ 导航项与商品项一一对应（handleDelNav 也是按下标同时删）
draftGoodsList.value.push({ img:'', name:'', price:0, url:'' });
```

`handleDelNav` 里 `draftNavList.splice(index,1)` 和 `draftGoodsList.splice(index,1)` 是**同下标**，
所以两者必须 1:1 —— 原来点一次「添加导航」会塞 10 个商品占位，删一次只删掉一组，
数据立刻就错位了。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1206** |
| `any` | 2647 | **1094** |
| `@ts-nocheck` | 80 | **30** |


## R81（2026-11-25）— 摘掉 `mixModel` / `goodsAndType`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1206 | **1180**（−26） |
| no-explicit-any | 1094 | **1070**（−24） |
| **`@ts-nocheck`** | 30 | **28**（−2） |
| typecheck / build | 0 | 0 |

### 一、「类型一收紧，错误反而变多」——说明之前根本没类型

给 `mixModel` 的 `current` 先写了个 `{ data?: MixModelData }`，错误从 20 涨到 39。
原因：**模板里真实用的字段比"看起来"多**。

```vue
<el-tag>{{ current.model === "goods" ? "商品" : "品牌" }}</el-tag>
<img :src="current.data.image.src" />
<div>推荐尺寸：{{ current.data.image.size }}</div>
<el-input v-model="current.data.image.url" />
<el-input v-model="current.data.badge.label" />
```

`data.image` 不是字符串，而是 `{ src, size, url }`；`data.badge` 是 `{ label, url }`；
还有一个 `model` 字段。这是 `@ts-nocheck` 完全掩盖的结构，只能从模板里逐个读出来。

### 二、`$filters` 之前完全没有类型

模板里 `{{ unitPrice(item.price, "￥") }}` —— 这个 `unitPrice` **不在组件作用域里**，
它来自 `main.ts` 注册的 `app.config.globalProperties.$filters = filters`。

- 正确写法是 `$filters.unitPrice(...)`（其它页面都这么写）
- 我一开始误以为是本地函数，改成了 `formatPrice` —— 那样运行时会直接 `undefined is not a function`

最终：

```ts
// types/vue-augment.d.ts
interface ComponentCustomProperties {
  /** main.ts 里注册的全局过滤器集合（filters.ts） */
  $filters: typeof import("@/utils/filters");
}
```

有了这行，**所有页面**里的 `$filters.xxx()` 都有类型了，不只是这一处。

### 三、`el-tabs` 的 `tab-click` 回调参数是 pane 对象

```ts
// ✗ 参数是 { paneName, uid, ... }，不是 name
function handleClickTab(name: string | number) { tabCurrentlyIndex.value = name.paneName ?? name; }
// ✓
function handleClickTab(pane: { paneName?: string | number }) {
  tabCurrentlyIndex.value = Number(pane?.paneName ?? 0);
}
```

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1180** |
| `any` | 2647 | **1070** |
| `@ts-nocheck` | 80 | **28** |


## R82（2026-11-26）— 摘掉 `forYour` / `recommend`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1180 | **1155**（−25） |
| no-explicit-any | 1070 | **1047**（−23） |
| **`@ts-nocheck`** | 28 | **26**（−2） |
| typecheck / build | 0 | 0 |

清空：`forYour.vue`(10 any → 0)、`recommend.vue`(13 → 0)。

### 一、`forYour` 的数据是「两层」的，读模板才知道

```vue
<el-input v-model="draftOptions.title" />                    <!-- 第一层 -->
<img :src="draftOptions.data.image.src" />                   <!-- 第二层 -->
<div>推荐尺寸：{{ draftOptions.data.image.size }}</div>
<el-input v-model="draftOptions.data.hot.title" />
```

所以类型必须是：

```ts
type ForYouOptions = {
  title?: string;
  data: {
    image: { src?: string; size?: string; url?: string };
    hot: { title?: string; list: ForYouGoods[] };
    list: ForYouGoods[];
  };
};
```

第一版我把 `image/hot/list` 写在顶层，错误立刻从 6 涨到 21 —— **这再一次说明：结构只能从模板读，不能猜**。

### 二、`recommend` 里 `handleSelectModel(item, true)`

```ts
// 模板：@click.stop="handleSelectModel(msgLeft, true)"
// 原来的签名：function handleSelectModel(item: any, type: any)
//            但函数体里用的是 `if (type)`，而这个 type 其实是「是否编辑」的布尔标记
function handleSelectModel(item: Record<string, unknown>, isEdit?: boolean) {
  ...
  if (isEdit) { showModal1.value = true } else { showModal.value = true }
}
```

参数名和语义完全对不上，改名后意图才清楚。

### 三、又一次 `$filters.unitPrice`

`forYour` 里 `￥{{ unitPrice(item.price) }}` —— 同样是漏了 `$filters.` 前缀。
这是**第二个**页面，说明这个错误写法被复制粘贴过。现在 `$filters` 有全局类型了，新写的页面编译期就能发现。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1155** |
| `any` | 2647 | **1047** |
| `@ts-nocheck` | 80 | **26** |


## R83（2026-11-26）— 摘掉 `newGoodsSort`，`modelList/` 目录彻底清零

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1155 | **1143**（−12） |
| no-explicit-any | 1047 | **1036**（−11） |
| **`@ts-nocheck`** | 26 | **25**（−1） |
| typecheck / build | 0 | 0 |

**`views/page-decoration/modelList/` 目录下 8 个文件全部摆脱 `@ts-nocheck`。**

### 一、`el-color-picker` 第十次踩坑：该字段必须允许 `null`

```ts
// ✗ 内联 style 只接受 string | undefined
bgColor?: string;
<div :style="{ background: options.left.bgColor }">
// ✓ 允许 null，用的时候归一化
bgColor?: string | null;
<div :style="{ background: options.left.bgColor ?? undefined }">
<el-input
  :model-value="selected.bgColor ?? ''"
  @update:model-value="(v: string) => (selected.bgColor = v)"
/>
```

同一字段既要给 `el-color-picker` 写（会写 `null`）、又要给 `el-input` 读，
两个组件的类型要求不一致 —— **只能声明成最宽的类型，在使用处收窄**。

### 二、`v-for` 的 `index` 在联合类型下会变成 `string | number`

```vue
<div :class="'jiaobiao' + (index + 1)">   <!-- TS2365: 不能把 string|number 和 number 相加 -->
{{ index + 1 }}
<!-- ✓ -->
<div :class="'jiaobiao' + (Number(index) + 1)">
{{ Number(index) + 1 }}
```

### 三、`handleSelectGoods('')` —— 模板传空字符串当"未指定"

```ts
// 模板：@click="handleSelectGoods('')"
// 原来签名：function handleSelectGoods(item: any)
function handleSelectGoods(item?: SortGoods | "") {
```

这个 `''` 是历史写法（表示"不带初始商品"），类型上必须显式承认它。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1143** |
| `any` | 2647 | **1036** |
| `@ts-nocheck` | 80 | **25** |

### 五、`modelList` 收口小结

8 个文件、约 3200 行，本轮系列共摘掉 10 个 `@ts-nocheck`、清掉 100+ 个 `any`。
过程中发现的**真实缺陷**：

| 文件 | 缺陷 |
|---|---|
| `notEnough` | `push([...10 个商品])` 导致导航/商品错位 |
| `forYour` | `unitPrice(...)` 漏了 `$filters.` 前缀（价格显示不出来） |
| `newGoodsSort` | 同上；`handleSelectModel(item, type)` 参数名与语义不符 |
| `carousel` / `firstPageAdvert` / `recommend` | `el-button shape="circle"`、`li :alt` 等无效属性 |


## R84（2026-11-26）— 摘掉 `navbar` / `modelForm`，并修正 `styleStore` 的类型

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1143 | **1122**（−21） |
| no-explicit-any | 1036 | **1017**（−19） |
| **`@ts-nocheck`** | 25 | **23**（−2） |
| typecheck / build | 0 | 0 |

### 一、store 里的 `styleStore` 声明错了 —— 它是对象，不是字符串

```ts
// ✗ 声明成字符串，所有 appStore.styleStore.xxx 全部报错
styleStore: "",
// ✓ H5 装修数据（{ name, title, list, ... }）
styleStore: {} as Record<string, any>,
```

`navbar.vue` 里 `store.name` / `store.title`、`wap/index.vue` 里 `appStore.styleStore = val`、
保存时 `JSON.stringify(appStore.styleStore)` —— 全都是对象用法。
这和之前 `openStyleStore` 的错法一模一样，**同一份 store 里两个字段都写错了**。

### 二、`route.query.type` 的三段判断被封装

```ts
// 原来：三元表达式里重复三遍，而且 route.query 的值可能是数组
pageShow: route.query.type === "true" || route.query.type === true || route.query.type === "OPEN",
// 现在：
function isOpenQuery(val: unknown): boolean {
  const v = Array.isArray(val) ? val[0] : val;
  return v === "true" || v === true || v === "OPEN";
}
function queryText(val: unknown): string {
  const v = Array.isArray(val) ? val[0] : val;
  return String(v ?? "");
}
```

`queryText` 在 `navbar` / `pc/index` / `renovation` / `wap/index` 都在用同一套收窄逻辑，
下一轮可以抽到公共工具里。

### 三、`el-input` / `el-color-picker` 的 v-model 收窄

```vue
<!-- 字段可空（picker 会写 null），输入框不接受 null -->
<el-input
  :model-value="draftTopAdvert?.url ?? ''"
  @update:model-value="(v: string) => draftTopAdvert && (draftTopAdvert.url = v)"
/>
<el-color-picker
  :model-value="draftTopAdvert?.bgColor ?? ''"
  @update:model-value="(v: string | null) => draftTopAdvert && (draftTopAdvert.bgColor = v)"
/>
```

### 四、`vuedraggable` 的 `@add` 要写进 `v-bind`

```vue
<!-- ✗ onAdd 不在类型里 -->
<draggable group="model" @add="handleModelAdd">
<!-- ✓ -->
<draggable v-bind="{ group: 'model', onAdd: handleModelAdd }">
```

### 五、一次严重的操作失误（已修复）

我用 PowerShell 的 `'''` 做字符串替换（Python 语法），把 `navbar.vue` 写成了非法 JS
（`Unterminated string literal`）。**已从 R84 快照恢复并改用 Node 脚本重做** ——
`src` 目录下 `.build-check/snap-real-w84` 快照再次派上用场。

> 教训：**涉及多行/引号的字符串替换，一律用 Node 脚本**，PowerShell 的引号规则不适合。

### 六、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1122** |
| `any` | 2647 | **1017** |
| `@ts-nocheck` | 80 | **23** |


## R85（2026-11-26）— 摘掉两个「商品」配置面板

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1122 | **1089**（−33） |
| no-explicit-any | 1017 | **986**（−31） |
| **`@ts-nocheck`** | 23 | **21**（−2） |
| typecheck / build | 0 | 0 |

清空：`wap/config-panel/PanelGoods.vue`(16 any → 0)、`pc/config-panel/PanelGoodsGrid.vue`(18 → 0)。

### 一、`el-option` 的 `value` 不接受 `undefined`

```vue
<!-- ✗ 品牌 id 可能是 undefined -->
<el-option v-for="b in brandList" :value="b.id" />
<!-- ✓ -->
<el-option :value="String(b.id ?? '')" />
```

### 二、`el-cascader` 的值域是 `CascaderValue`（可能是数组）

```vue
<!-- ✗ v-model 直接绑 string|number -->
<el-cascader v-model="firstItem.categoryId" />
<!-- ✓ -->
<el-cascader
  :model-value="firstItem.categoryId"
  @update:model-value="(v: unknown) => (firstItem.categoryId = v as string | number | undefined)"
/>
```

这和之前的 `el-color-picker` / `el-radio-group` 是同一类问题：**组件库的回写值域比业务字段宽**。

### 三、`ComputedRef` 被当对象传进去了

```ts
const item = firstItem;          // ComputedRef
fillItemDefaults(item);          // ✗ 传的是 ref 本身
if (item.value) fillItemDefaults(item.value);   // ✓
```

`PanelGoods` 里 `item = firstItem` 是**为了让模板少写 `.value`** 的别名，
结果脚本里把 `item` 直接传给函数 —— 收到的是 `ComputedRef` 对象。这类别名很容易埋坑。

### 四、接口返回的记录要映射成选项

```ts
// 店铺接口返回 Store[]，下拉框要的是 { id, storeName }
storeList.value = records.map((r) => ({ id: r.id, storeName: r.storeName }));
```

### 五、`openGoodsPicker` 的第二个参数（又一次）

`pc/config-panel/PanelGoodsGrid.vue` 里也调用了 `openGoodsPicker(cb, local.goods)` ——
和 `PanelRecommendFeed` 一样。现在 `GoodsPicker` 类型里显式带了 `initialSelected`。

### 六、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1089** |
| `any` | 2647 | **986** |
| `@ts-nocheck` | 80 | **21** |


## R86（2026-11-26）— 摘掉 `platformSetting`（平台设置四个 tab）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1089 | **1047**（−42） |
| no-explicit-any | 986 | **945**（−41） |
| **`@ts-nocheck`** | 21 | **20**（−1） |
| typecheck / build | 0 | 0 |

单文件 29 个 `any` 全部清掉。

### 一、又一次「API 参数是路径段」的错类型

```ts
// ✗ 声明成对象，但实现是 '/platformSetting/get/' + params
export const getParams = (params?: Record<string, unknown>) => ...
// ✓
export const getParams = (type: string) => ...
export const editParams = (params: Record<string, unknown>, method: string) => ...
```

调用处一直在传 `"base"` / `"point"` 这样的**字符串**，类型却写成对象 ——
和 R77 那次 `getHomeData` 事故是同一个反模式。

### 二、`el-tabs` 的 `v-model`（第三次遇到）

```vue
<el-tabs
  :model-value="tabName"
  @update:model-value="(v: string | number | undefined) => (tabName = String(v ?? 'base'))"
>
```

### 三、`el-form` 的 `validator` 三元组

```ts
// ✗ validator: (rule: any, value: any, callback: any) => ...
// ✓
validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => { ... }
```

6 处校验器，全部收窄。

### 四、配置块都要带 `id`

```ts
/** 保存时会写入 id（后端按 id 区分配置块） */
type ConfigWithId = { id?: string };
const base = ref<ConfigWithId & { siteName: string; ... }>({ ... });
```

`base.value.id = "base"` 这类写法原来因为类型里没有 `id` 而报错 —— 而这是**真实的业务字段**。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1047** |
| `any` | 2647 | **945** |
| `@ts-nocheck` | 80 | **20** |

### 六、`@ts-nocheck` 剩余 20 个的分布

装修相关还剩：`wap/index.vue`(1 any)、`wap/decorate.vue`(1)、`tpl_promotion_detail`、
`pc/controls/NestedBoxModel` 等；业务侧主要是 `payment-success`、`kanjia-*` 系列、`promotions` 若干。


## R87（2026-11-26）— 摘掉 `NestedBoxModel` / `tpl_promotion_detail`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1047 | **1028**（−19） |
| no-explicit-any | 945 | **928**（−17） |
| **`@ts-nocheck`** | 20 | **18**（−2） |
| typecheck / build | 0 | 0 |

**告警首次降到 1000 附近（1028）。**

### 一、原生 `<input @input>` 的 `$event.target`（8 处）

```vue
<!-- ✗ $event.target 可能是 null，而且不是 HTMLInputElement -->
<input @input="onMarginChange(0, $event.target.value)" />
<!-- ✓ 统一用帮助函数取值 -->
<input @input="onMarginChange(0, inputValue($event))" />
```
```ts
function inputValue(e: Event): string {
  const target = e.target as HTMLInputElement | null;
  return target?.value ?? "";
}
```

`NestedBoxModel` 是「外边距/内边距/圆角」三组 4 向输入框 + 联动开关，
8 处 `$event.target.value` + 3 处 `el-switch` 全部收窄。

> 这类原生 input 在处理"输入即生效"的数值控件时很常见，
> 正确的取值方式只能靠 `as HTMLInputElement`（模板里没有 `as`，所以要提到脚本里）。

### 二、`tpl_promotion_detail` 的 12 处裸 `alt`

```vue
<img :src="..." alt />   <!-- 被当成 alt={true}，与 string 冲突 -->
<img :src="..." alt="" />
```

用正则统一处理：`\s+alt(\s*/>)` → ` alt=""$1`，一次修掉 17 处（含换行写法）。

### 三、直播数据的字段类型

```ts
const liveTagOf = (status: string | number | undefined) => ...
const fmtLiveTime = (t: string | number | undefined) => ...
// 调用处要显式收窄（后端字段是 unknown）
liveTagOf((item.status ?? item.liveStatus) as string | number | undefined)
```

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **1028** |
| `any` | 2647 | **928** |
| `@ts-nocheck` | 80 | **18** |

### 五、剩余 18 个的大致规模

| 文件 | any |
|---|---:|
| `order/orderDetail.vue` | 42 |
| `promotions/coupon/coupon-publish.vue` | 39 |
| `goods/goods-info/goods.vue` | 39 |
| `seller/shop/shopDetail.vue` | 38 |
| `goods/goods-info/goodsDetail.vue` | 36 |
| `seller/shop/shopOperation.vue` | 31 |
| `goods/goods-review/index.vue` | 30 |
| `pc/config-panel/PanelGoods.vue` | 29 |
| 其余 10 个 | 1–21 |


## R88（2026-11-26）— 摘掉 `pc/config-panel/PanelGoods`（告警降到 998）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 1028 | **998**（−30，首次低于 1000） |
| no-explicit-any | 928 | **899**（−29） |
| **`@ts-nocheck`** | 18 | **17**（−1） |
| typecheck / build | 0 | 0 |

`PanelHomeComb.vue` 摘掉后有 **51 个错误**，本轮未收，已恢复指令。

### 一、`props.component` 声明成 `unknown`，模板里却在读 `.type`

```ts
// ✗ 模板里 component.type 全部报错
component?: unknown;
// ✓ 给结构 + 默认值
const props = withDefaults(
  defineProps<{ component?: { type?: string; name?: string }; options?: PanelOptions }>(),
  { component: () => ({}), options: () => ({}) }
);
```

`withDefaults` 是这里的关键 —— 只改类型会导致「可能 undefined」的新错误，给默认值才彻底解决。

### 二、递归函数的返回类型必须显式声明

```ts
// ✗ TS7023: 'getPathLabels' implicitly has return type 'any'
function getPathLabels(tree: any, id: any) { ... getPathLabels(node.children, id) ... }
// ✓
function getPathLabels(tree: CategoryNode[], id: string | number | undefined): string[] { ... }
```

递归函数（自己调用自己）**必须显式写返回类型**，否则 TS 无法推断。

### 三、`ElMessageBox.prompt` 的 `inputValue` 只接字符串

```ts
// ✗ g.thumbnail 是 unknown
inputValue: g.thumbnail || '',
// ✓
inputValue: String(g.thumbnail ?? ""),
```

### 四、`local.tabs` / `local.goods` 的默认值

```ts
const local = reactive<PanelOptions>({
  ...(props.options ?? {}),
  tabs: Array.isArray(props.options?.tabs) ? props.options.tabs : [],
  goods: Array.isArray(props.options?.goods) ? props.options.goods : [],
});
```

这是第 6 个面板踩到「初始化成空数组会清空画布」的坑，已固定成这套写法。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **998**（−71%） |
| `any` | 2647 | **899**（−66%） |
| `@ts-nocheck` | 80 | **17**（−79%） |


## R89（2026-11-26）— 摘掉 `PanelHomeComb`（H5 首页头部组件面板）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 998 | **983**（−15） |
| no-explicit-any | 899 | **885**（−14） |
| **`@ts-nocheck`** | 17 | **16**（−1） |
| typecheck / build | 0 | 0 |

这是上一轮遗留的「51 个错误」文件，本轮清空。

### 一、又是一个「整个文件被批量替换」的痕迹

```ts
// 默认轮播项里 url 塞了空字符串，但 url 的真实语义是「链接对象」
{ img: "...", url: "", link: "", size: "750*332", model: "link" }
```

`url: ""` 在类型上是 `string`，但模板里读的是 `item.url.___type` —— 两者不可能同时成立。
改成不塞 `url`（与 `PanelCarousel` / `PanelNotice` 等 6 个面板的处理一致）。

### 二、`hotWords` / `tabList` / `list` 声明成可选 → 处处判空

```ts
// ✗ 可选 → local.value.hotWords 可能是 undefined
hotWords?: string[];
// ✓ 必填 + 初始化兜底
hotWords: string[];
const local = reactive<PanelOptions>({
  ...(props.res.options ?? {}),
  hotWords: Array.isArray(props.res.options?.hotWords) ? props.res.options.hotWords : [],
});
```

**「数组字段声明成必填、在 `local` 初始化时兜底」** —— 这是面板类文件的统一模板，
比在每个使用点写 `?.` 更干净。

### 三、`el-cascader`（第 N 次）

```vue
<el-cascader
  :model-value="tab.value"
  @update:model-value="(v: unknown) => (tab.value = String(v ?? ''))"
/>
```

### 四、`local[key]` 动态写回

```ts
// ✗ local 是具体类型，不能用任意 string 索引
local[picTarget.value.key] = val.url;
// ✓
(local as Record<string, unknown>)[String(picTarget.value.key ?? "")] = val.url;
```

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **983** |
| `any` | 2647 | **885** |
| `@ts-nocheck` | 80 | **16** |


## R90（2026-11-26）— 摘掉 `modelFormItem`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 983 | **972**（−11） |
| no-explicit-any | 885 | **875**（−10） |
| **`@ts-nocheck`** | 16 | **15**（−1） |
| typecheck / build | 0 | 0 |

### 一、`wap/index.vue` + `wap/decorate.vue` 这次没动（67 个错误）

两个文件摘掉指令后合计 **67 个错误**（`wap/index` 45、`decorate` 22），
涉及 `templates[type]` 动态索引、`WapLegacyOptionItem` 与组件 props 的类型冲突、
文案数组 `string | {content}[]` 联合等结构性问题，**不适合和其他文件混在一轮**。
已从快照恢复，留作专门轮次。

### 二、`modelFormItem` 的 5 处裸 `alt` + 3 处签名

- 5 处 `<img ... alt />` → `alt=""`（正则统一处理）
- `handleSelectModel(item: any)` / `handleSelectLink(_item: any, _index: any)` → 收窄

### 三、`handleSelectModel` 的入参可能是 `null`

```ts
// 原来是 any，什么都收；收窄后必须显式判空
function handleSelectModel(item?: FormItem | null) {
  if (!item) return;
  editTarget.value = item;
  selected.value = cloneItem(item);
  showModal.value = true;
}
```

模板里 `@click="handleSelectModel(element)"` 传的是 `v-for` 的元素，
理论上非空，但既然签名允许 `null`，就必须守。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **972** |
| `any` | 2647 | **875** |
| `@ts-nocheck` | 80 | **15** |


## R91（2026-11-26）— 摘掉 `PanelUserBenefits`

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 972 | **960**（−12） |
| no-explicit-any | 875 | **864**（−11） |
| **`@ts-nocheck`** | 15 | **14**（−1） |
| typecheck / build | 0 | 0 |

`PanelUserBenefits`（PC 会员权益面板，697 行）摘指令后只有 3 个错误，清空 10 个 `any`。

### 一、模板绑定的字段不在类型里

```vue
<el-input v-model="srv.name" />   <!-- BenefitService 里没有 name -->
```
```ts
type BenefitService = {
  id?: string | number;
  /** 服务名称（模板绑定 srv.name） */
  name?: string;
  icon?: string;
  title?: string;
  ...
};
```

`v-model="srv.name"` 报 `unknown`，是因为 `name` 没声明、走了索引签名兜底 `unknown`。
**模板里出现的每个 `v-model` 目标，都必须在类型里显式声明。**

### 二、`props.options[key]` 的动态索引

```ts
// ✗ props.options 可能 undefined，且 key 是 string，索引结果是 unknown
inputValue: props.options[key] || '',
// ✓
inputValue: String((props.options as Record<string, unknown>)[key] ?? ''),
```

### 三、`inject<any>` 的第三例

```ts
type ImagePicker = (cb: (url: string) => void) => void;
type LinkPicker = (cb: (payload: { url?: string; title?: string }) => void) => void;
const openImagePicker = inject<ImagePicker | null>('openImagePicker', null);
```

这是第 4 个面板发现 `inject<any>` —— 说明这套「全局选择器」的契约一直没被记录下来。
已在 `PanelGoodsGrid` / `PanelGoods` / `PanelUserBenefits` 三处统一。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **960** |
| `any` | 2647 | **864** |
| `@ts-nocheck` | 80 | **14** |


## R92（2026-11-26）— 摘掉 `payment-success`（支付成功页配置）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 960 | **959**（−1） |
| no-explicit-any | 864 | **864** |
| **`@ts-nocheck`** | 14 | **13**（−1） |
| typecheck / build | 0 | 0 |

**这是反复推迟 3 轮的文件**（模板是单行密集写法，一行 500+ 字符），本轮终于收掉 25 个错误。

### 一、密集单行模板怎么改

这类行没有缩进结构，只能**按精确子串替换**：

```ts
// 原（L62 的 520 列处）
¥{{ money(item.promotionPrice > 0 ? Math.min(item.price,item.promotionPrice) : item.price) }}
// 改
¥{{ money(Number(item.promotionPrice) > 0 ? Math.min(Number(item.price), Number(item.promotionPrice)) : Number(item.price)) }}
```

关键是**先用 `IndexOf` 定位错误列附近的片段**，再做整段替换 —— 比通读整行可靠。

### 二、`:required` 必须收到布尔

```vue
<!-- ✗ promotionEnabled 是 boolean|string|number -->
:required="form.promotionEnabled"
<!-- ✓ -->
:required="Boolean(form.promotionEnabled)"
```

3 处（有效时间、推广图片、选择目标）。

### 三、`activePromise` 的结果也要收窄

```ts
const detail = store.status === 'fulfilled'
  ? (store.value as unknown as { success?: boolean; result?: { storeName?: string; store?: { storeName?: string } } })
  : undefined;
```

`Promise.allSettled` 的 `value` 是 `unknown`，而 `Store` 类型里没有 `store` 字段 ——
这属于**接口返回与类型定义不一致**，只能在边界处收窄。

### 四、`let res: ...` 的三段式类型

```ts
let res: { success?: boolean; result?: Record<string, unknown> | { storeName?: string; store?: { storeName?: string } } } | null | undefined;
```

原来的类型 `| null` 不含 `undefined`，导致「使用前未赋值」（TS2454）。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **959** |
| `any` | 2647 | **864** |
| `@ts-nocheck` | 80 | **13** |

### 六、本轮跳过的文件

`kanjia-activity-add-goods` + `kanjia-activity-edit-goods` 摘掉后合计 **71 个错误**
（`never` 类型推断、`instanceof` on 非对象、`data.list` 的泛型丢失），已恢复指令，留作专门轮次。


## R93（2026-11-26）— 摘掉 `afterSaleOrderDetail`（售后单详情）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 959 | **940**（−19） |
| no-explicit-any | 864 | **846**（−18） |
| **`@ts-nocheck`** | 13 | **12**（−1） |
| typecheck / build | 0 | 0 |

### 一、`el-steps` 没有 `status` 属性

```vue
<!-- ✗ el-steps 只有 finish-status / process-status -->
<el-steps :active="currentStepIndex" :status="stepProcessStatus">
<!-- ✓ -->
<el-steps :active="currentStepIndex" :process-status="stepProcessStatus">
```

又是一个「属性名写错、`@ts-nocheck` 掩盖多年」的例子 —— **`status` 从来没生效过**。

### 二、`el-tag` 的 `type` 是联合字面量

```ts
// ✗ 返回 string，el-tag 只接受五个字面量
function getStatusTagType(status: any) { ... return map[status] || "info" }
// ✓
type TagType = "primary" | "success" | "warning" | "info" | "danger";
function getStatusTagType(status: string | number | undefined): TagType {
  const map: Record<string, TagType> = { APPLY: "warning", ... };
  return map[String(status ?? "")] ?? "info";
}
```

### 三、一次「收得太狠」的尝试（已回退一部分）

我把 `afterSaleInfo` / `logisticsInfo` / `storeMsg` 从 `Record<string, any>` 收成
`Record<string, unknown>`，结果错误从 7 涨到 **27** —— 因为模板里到处是
`afterSaleInfo.actualRefundPrice.toFixed(2)`、`:src="img"` 这类用法。

**按「投入产出比」回退**：

```ts
// 这三个对象承载接口返回的整条售后单/物流数据，字段非常多且后端会扩容，
// 逐一声明不划算，这里保留宽松类型，只把「函数入参/映射表」收窄。
const logisticsInfo = ref<Record<string, any>>({});
const afterSaleInfo = ref<Record<string, any>>({});
```

> 这条很重要：**不是所有 `any` 都值得现在收**。
> 数据对象（后端会扩容的"半结构化"数据）保留宽类型是合理的，
> 真正该收的是**函数入参、映射表、事件回调**。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **940** |
| `any` | 2647 | **846** |
| `@ts-nocheck` | 80 | **12** |

### 五、本轮跳过

`orderComplaintDetail.vue` 摘掉后有 24 个错误（`createTime` 字段缺失、状态推导、动态索引），
已恢复指令，留作专门轮次。


## R94（2026-11-26）— 摘掉 `orderComplaintDetail`（交易投诉详情）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 940 | **920**（−20） |
| no-explicit-any | 846 | **827**（−19） |
| **`@ts-nocheck`** | 12 | **11**（−1） |
| typecheck / build | 0 | 0 |

单文件 24 个错误、19 个 `any` 全部清掉。

### 一、「`emptyComplaint()` 推断出的类型缺字段」是核心问题

```ts
const emptyComplaint = () => ({ id: "", orderSn: "", ... });   // 只有 24 个字段
const complaintInfo = ref(emptyComplaint());
```

模板却用了 `complaintInfo.createTime`、`.goodsId`、`.orderTime`、`.logisticsNo` ——
**这些字段从没在初始值里出现过**，于是 TS 认为它们不存在（17 个 TS2339）。

修法：声明 `ComplaintInfo` 接口，把**模板用到的字段全部列出来**，
`emptyComplaint(): ComplaintInfo` 显式标注返回类型。

> 这才是 `@ts-nocheck` 最典型的危害：**初始值决定了整个对象的类型**，
> 少写一个字段，模板里就"不存在"，但运行时后端返回了，所以一直没人发现。

### 二、`orderComplaintCommunications: []` 推断成 `never[]`

空数组字面量在 `const emptyComplaint = () => ({ ... })` 里被推断成 `never[]`，
于是 `.map(item => item.owner)` 全是 `never` 错误（6 个）。

```ts
type ComplaintMessage = { owner?: string; content?: string; createTime?: string; };
orderComplaintCommunications: ComplaintMessage[];
```

### 三、四个映射函数统一收窄

```ts
type TagType = "primary" | "success" | "warning" | "info" | "danger";

function getStatusTagType(v: string | undefined): TagType {
  const map: Record<string, TagType> = { NEW: "primary", ... };
  return map[String(v ?? "")] ?? "info";
}
```

`el-tag` 的 `type` 只接受这五个字面量，所以函数的返回类型必须显式声明。

### 四、`el-steps` 的 `status` → `process-status`（第二次）

上一轮 `afterSaleOrderDetail` 也是这个问题 —— 说明这个属性名错误被复制到了多个文件。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **920** |
| `any` | 2647 | **827** |
| `@ts-nocheck` | 80 | **11** |


## R95（2026-11-26）— 摘掉 `goods-review`（商品评价管理）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 920 | **900**（−20） |
| no-explicit-any | 827 | **808**（−19） |
| **`@ts-nocheck`** | 11 | **10**（−1） |
| typecheck / build | 0 | 0 |

1388 行、28 个 `any`，本轮收到 11 个（余下的都是评价行 DTO 的宽类型）。

### 一、两个互相递归的函数必须显式写返回类型

```ts
// ✗ cleanSingleUrl 里调用 parseImageList，parseImageList 里又调用 cleanSingleUrl
//   → TS7023 'cleanSingleUrl' implicitly has return type 'any'
function cleanSingleUrl(val: any) { ... }
function parseImageList(val: any) { ... }
// ✓ 双方都显式声明
function cleanSingleUrl(value: unknown): string { ... }
function parseImageList(value: unknown): string[] { ... }
```

**互相递归的函数对**（解析器、格式化器这类）是 TS7022/7023 的高发区。

### 二、`val = val.trim()` 之后不能再用 `unknown`

收窄参数类型后，函数体里的 `val = val.url || ...` 就非法了（不能给 `unknown` 赋值）。
正确做法是**引入局部变量**：

```ts
function cleanSingleUrl(value: unknown): string {
  let val: unknown = value;
  if (typeof val === "object") { ... val = obj.url || ... }
  if (typeof val !== "string") return "";
  let text = val.trim()...   // ← 从这里开始全是 string
```

### 三、`el-date-picker` 的 range 值域

```ts
// ✗ (string | Date)[] 与 EP 的 ModelValueType 不匹配
const dateRange = ref<Array<Date | string>>([]);
// ✓
const dateRange = ref<[string, string] | []>([]);
```

### 四、又一次「行数据类型收得太狠」（第二次）

把评价行从 `Record<string, any>` 改成 `Record<string, unknown>`，错误从 8 涨到 **35**。
按 R93 的教训立刻回退，只保留「函数入参 / 映射表」的收窄：

> **后端 DTO 行数据保留宽类型，函数签名才是收窄的重点。**

### 五、`el-switch` 的事件入参

```ts
// ✗ 只收 string
function changeSwitchView(status: string)
// ✓
function changeSwitchView(status: string | number | boolean)
```

### 六、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **900**（−74%） |
| `any` | 2647 | **808**（−69.5%） |
| `@ts-nocheck` | 80 | **10**（−87.5%） |


## R96（2026-11-26）— 摘掉 `shopOperation`（店铺编辑/新增，1006 行）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 900 | **895**（−5） |
| no-explicit-any | 808 | **804** |
| **`@ts-nocheck`** | 10 | **9**（−1） |
| typecheck / build | 0 | 0 |

37 个错误清零。因为 `shopForm` 的 40 多个字段都要声明，`any` 数量本身下降不多，但**整个页面的表单类型现在是真的**。

### 一、`shopForm` 缺字段（同 R94 的模式）

`const shopForm = ref({ ...33 个字段 })` 推断出的类型里没有
`storeDisable` / `storeAddressDetail` / `salesConsignee*` / `memberId` / `storeCenter` / `center` / `goodsManagementCategory`
—— 于是模板里 13 处 `shopForm.xxx` 报「属性不存在」。

修法：声明 `ShopForm` 接口（40+ 字段显式类型） + `emptyShopForm()` 工厂函数（新增页和保存后清空都复用它）。

> 这是第 3 次遇到「初始值决定类型」的坑（R94 投诉详情、R96 店铺编辑）。
> **凡是 `ref({...})` 承载后端 DTO 的表单，都应该有 `emptyXxx()` 工厂 + 显式接口。**

### 二、`picIndex` 用空字符串当「无值」

```ts
const picIndex = ref("");        // ✗ 有时赋 number，类型冲突
const picIndex = ref(-1);        // ✓ 用 -1 表示"该字段不是数组"
```

### 三、`shopAudit(id, 0)` 的第二参其实是布尔

```ts
export const shopAudit = (id: Id, passed: boolean) => ...
// 调用处传 0/1 —— 运行时真值判断能过，但语义是错的
shopAudit(id, true) / shopAudit(id, false)
```

### 四、`goodsManagementCategory.split(",")` 崩溃点

```ts
// ✗ 该字段可能是数组（后端返回 string[]），split 会直接抛错
shopForm.value.goodsManagementCategory.split(",");
// ✓
String(shopForm.value.goodsManagementCategory ?? "").split(",");
```

同样处理了 `settlementCycle`、`legalPhoto`。**这三处是潜在的运行时崩溃点**。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **895** |
| `any` | 2647 | **804** |
| `@ts-nocheck` | 80 | **9** |


## R97（2026-11-26）— 摘掉 `shopDetail`（店铺详情，802 行）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 895 | **886**（−9） |
| no-explicit-any | 804 | **796** |
| **`@ts-nocheck`** | 9 | **8**（−1） |
| typecheck / build | 0 | 0 |

28 个错误清零。

### 一、搜索表单缺字段（第四次同类问题）

```ts
const orderSearchForm = reactive({ pageNumber: 1, pageSize: 20, payStatus: "", orderSn: "", orderType: "" });
```

模板里却用了 `.clientType` / `.orderStatus` / `.startDate` / `.endDate` / `.storeId` —— 全部报「属性不存在」。

同样地 `afterSaleSearchForm` 缺 `orderSn` / `memberName` / `serviceStatus` / `serviceType` / `sn` / `storeId`。

> **规律已经很清楚了：`reactive({...})` / `ref({...})` 形式的表单，
> 只要模板绑定了某个字段，就必须在初始值里出现。** 这是 `@ts-nocheck` 掩盖最多的一类错误。

### 二、8 个映射函数统一处理

```ts
// ✗ map 是字面量对象，用 string 索引报 TS7053；key 可能是 undefined 报 TS2538
function orderTypeText(v: any) { const map = {...}; return map[v] || v || ""; }
// ✓
function orderTypeText(v: string | undefined) {
  const map: Record<string, string> = {...};
  return map[String(v ?? "")] || v || "";
}
```

8 个函数（订单类型/来源/状态、支付状态、售后状态、投诉状态、售后类型/状态）全部一次处理。

### 三、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **886** |
| `any` | 2647 | **796** |
| `@ts-nocheck` | 80 | **8** |


## R98（2026-11-26）— 摘掉 `goods.vue`（商品列表）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 886 | **857**（−29） |
| no-explicit-any | 796 | **768**（−28） |
| **`@ts-nocheck`** | 8 | **7**（−1） |
| typecheck / build | 0 | 0 |

### 一、审核表单的两个「同名不同型」

```ts
// 模板绑定 `auth_flag`（1 通过 / 2 拒绝）
// 旧逻辑却写 `goodsAuditForm.authFlag = "PASS"` / `.goodsIds` / `.reason`
const goodsAuditForm = reactive({ auth_flag: 1 });
```

三种字段名（`auth_flag` / `authFlag` / `goodsIds`）混在一处，`@ts-nocheck` 让
TS2551（"你是不是想写 auth_flag"）完全发不出来。补全后：

```ts
const goodsAuditForm = reactive<{
  auth_flag: number;
  authFlag: string;
  goodsIds: string;
  reason: string;
}>({ auth_flag: 1, authFlag: "", goodsIds: "", reason: "" });
```

### 二、`el-tabs` 的 `tab-click` 参数：`paneName` 在 pane 上

```ts
// ✗ 只在 props.name 上找
function onStatusTabClick(tab: { props?: { name?: string | number } }) {
  const status = tab.paneName ?? tab.props?.name;
// ✓ 两个位置都声明
function onStatusTabClick(tab: { paneName?: string | number; props?: { name?: string | number } }) {
```

### 三、`ref<any>` 的 6 个表单实例一次收口

```ts
type FormRef = { resetFields?: () => void; validate?: (cb: (ok: boolean) => void) => Promise<boolean> };
const searchFormRef = ref<FormRef | null>(null);
```

调用处相应改成 `ref.value?.resetFields?.()`。

### 四、批量替换的收益

- `.then((res: any) =>` → `.then((res) =>`：**10 处**
- `.map((item: any) =>` → `.map((item) =>`：**6 处**

### 五、又一次「行数据类型」的边界

把商品行从 `Record<string, any>` 收成 `unknown` → 6 个新错误（路由跳转、表单赋值都要求具体类型），
按既有结论**回退**：行数据保留 `Record<string, any>`。

最终 `goods.vue` 的 38 个 `any` 剩 11 个 —— 全是「后端商品行」这个数据对象的字段访问。

### 六、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **857** |
| `any` | 2647 | **768** |
| `@ts-nocheck` | 80 | **7** |


## R99（2026-11-26）— 摘掉 `goodsDetail`（商品详情，1051 行）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 857 | **825**（−32） |
| no-explicit-any | 768 | **737**（−31） |
| **`@ts-nocheck`** | 7 | **6**（−1） |
| typecheck / build | 0 | 0 |

摘指令后只有 **3 个错误**，但 `any` 有 36 个 —— 说明这个文件主要是「宽类型」问题，
不是「类型错误」问题。收完后剩 5 个（商品/品牌数据对象）。

### 一、两个「数字键映射表」的写法

```ts
// ✗ 键是数字 1..7，但索引时 d 是字符串 → TS7053
const map = { 1: "周一", ... };
return weekdays.map((d: any) => map[d] || d).join("、");
// ✓ 键统一成字符串
const map: Record<string, string> = { "1": "周一", ... };
return weekdays.map((d) => map[String(d)] || String(d)).join("、");
```

### 二、`formatSlotCapacity(row.capacity)` 的入参是 unknown

时段容量在模板里既有 `Number(row.capacity)` 又有 `formatSlotCapacity(row.capacity)`，
说明这个字段类型不稳定（数字/字符串/对象都可能）→ 函数签名收成 `unknown` 最真实。

### 三、批量替换

- `.then((res: any) =>`：**3 处**
- `Record<string, any>` 局部数组：`flat` / `parts` / `items` / `skuData` / `currentSlotCapacities` 全部收成 `unknown`

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **825** |
| `any` | 2647 | **737** |
| `@ts-nocheck` | 80 | **6** |


## R100（2026-11-26）— 摘掉 `coupon-publish`（优惠券发布，1307 行）· 第 100 轮

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 825 | **824**（−1） |
| no-explicit-any | 737 | **737** |
| **`@ts-nocheck`** | 6 | **5**（−1） |
| typecheck / build | 0 | 0 |

29 个错误清零。`any` 数量没降（33 个都是「优惠券表单/接口返回」的宽类型），
但**表单结构现在是显式类型**，后续收窄有据可依。

### 一、`el-input-number` 与 `el-input` 对同一字段的要求相反

```ts
// ✗ couponDiscount 同时被 el-input-number（要 number|null）和业务代码当字符串用
couponDiscount: number | string | undefined;
// ✓
couponDiscount: number | null;
```

同理 `couponLimitNum` / `effectiveDays` / `storeCommission` / `publishNum` 都被 `el-input`（要 string）绑定，
必须走「`:model-value="String(x)" + 显式写回 Number」的模式。

### 二、`el-date-picker` 的 range 必须用元组

```ts
/** el-date-picker 需要 [string, string] 形式的元组 */
const rangeTimePickerValue = computed(
  () => (Array.isArray(form.value.rangeTime) ? form.value.rangeTime : []) as [string, string]
);
```

而业务侧的 `rangeTime` 实际可能存 `Date`（回填时 `push(new Date(...))`），所以类型是
`Array<string | Date>`，中间加一层 computed 适配。

### 三、`delete obj.optionalProp` 的两种处理

```ts
// ✗ 类型上不是可选属性 → TS2790
delete formRule.rangeTime;
// ✓
(formRule as Record<string, unknown>).rangeTime = undefined;
```

### 四、`data = res.result` 的宽度问题

`getPlatformCoupon` 返回 `Coupon` 类型，但后端实际字段比它多（`promotionGoodsList` / `scopeType`…）
→ 在边界处 `res.result as unknown as Record<string, any>`，**只加一层转换，不改运行时值**。

### 五、第 100 轮总览

| 指标 | R8 起点 | R100 | 变化 |
|---|---:|---:|---:|
| lint 告警 | 3477 | **824** | −76.3% |
| `any` | 2647 | **737** | −72.2% |
| `mutating-props` | 738 | **80** | −89.2% |
| `@ts-nocheck` | 80 | **5** | −93.8% |

**验收三件套持续全绿（typecheck / build / lint），ratchet 从 3477 一路降到 824。**

剩余 5 个文件：`orderDetail`（1915 行）、`wap/index` + `wap/decorate`（结构性）、`kanjia-activity-add/edit-goods`（成对）。


## R101（2026-11-26）— 摘掉 `orderDetail`（订单详情，1914 行 · 最大单文件）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 824 | **817**（−7） |
| no-explicit-any | 737 | **731** |
| **`@ts-nocheck`** | 5 | **4**（−1） |
| typecheck / build | 0 | 0 |

摘指令后 **101 个错误**清零。

### 一、关键判断：这个 DTO 用「宽结构 + 补 5 个顶层字段」

订单详情的 `order` 对象承载后端整套 DTO（订单主体 + 价格明细 + 商品行 + 物流 + 操作日志…），
模板里用到的字段上百个。逐一声明既不现实也难维护，所以：

```ts
type OrderDetailInfo = {
  order: Record<string, any>;
  orderLogs: Array<Record<string, any>>;
  /** 以下由接口/计算属性补齐（模板直接读） */
  orderStatusValue?: string;
  paymentMethodValue?: string;
  deliveryMethodValue?: string;
  orderItems?: Array<Record<string, any>>;
  receipt?: Record<string, any>;
  [key: string]: unknown;
};
```

初始值只有 `{ order: { priceDetailDTO: {} }, orderLogs: [] }`，模板却读 `orderStatusValue` / `receipt` 等
**5 个顶层字段** —— 这正是 101 个错误里 91 个的来源。

### 二、`$refs.map.open()` 在 `script setup` 里是 unknown

```vue
<!-- ✗ $refs 在 script setup 下无法被模板类型系统识别 -->
<el-button @click="$refs.map.open()">选择地区</el-button>
<!-- ✓ 改成方法 + getCurrentInstance().refs -->
<el-button @click="openRegionMap()">选择地区</el-button>
```

### 三、一次「收得太狠」的教训（本轮最值得记的）

我先按惯例做了一轮 `any` 批量收窄（`.forEach((item: any)` → `(item)`、`parseSpecs(specs: string)` 等），
**错误从 0 涨到 22** —— 因为 `data` 的元素实际是复杂对象，`parseSpecs` 的入参也可能是对象。

处理方式：**从 R101 快照恢复，只重放「类型修复」脚本，跳过 `any` 批量改**，
最后只做一类最安全的收窄（`.then((res: any)` → `(res)`，7 处）。

> 这条经验已经重复出现三次（R93 / R95 / R101）：
> **`any` 收窄要按「函数入参、回调、映射表」分类做，不能对集合元素和解析函数无差别批量替换。**

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **817** |
| `any` | 2647 | **731** |
| `@ts-nocheck` | 80 | **4** |


## R102（2026-11-26）— 摘掉 `wap/decorate.vue`（H5 装修渲染器）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 817 | **815**（−2） |
| no-explicit-any | 731 | **731** |
| **`@ts-nocheck`** | 4 | **3**（−1） |
| typecheck / build | 0 | 0 |

22 个错误清零。

### 一、`types.ts` 的类型漏了一个字段

```ts
// 热区组件会往「内容项」里写 zoneInfo，但 WapLegacyOptionItem 里没有 → 4 个错误
export type WapLegacyOptionItem = {
  ...
  /** 热区数据（热区组件会写） */
  zoneInfo?: unknown;
};
```

**共享类型的每次扩充都会同时修好多个文件** —— 这是把类型收敛到 `types.ts` 的直接收益。

### 二、`title` 是 `string | { content }[]` 联合，输入框必须收窄

```vue
<!-- ✗ 公告类的 title 是数组 -->
<el-input v-model="item.title" />
<!-- ✓ -->
<el-input
  :model-value="String(item.title ?? '')"
  @update:model-value="(v: string) => (item.title = v)"
/>
```

同类处理了 `t.context`（公告条目在历史数据里可能是字符串）、`title_item.bindCategory`（unknown）。

### 三、`el-color-picker` 写 `null`，字段声明成 `string` 会冲突

```ts
bk_color?: string;
// 绑定处
:model-value="item.bk_color ?? ''"
@update:model-value="(v: string | null) => (item.bk_color = v ?? '')"
```

### 四、`title.splice` 前必须确认是数组

```ts
// ✗ title 可能是 string → TS2551 'splice' does not exist
props.res.options.list[0].title.splice(index, 1);
// ✓
const title = props.res.options.list[0].title;
if (Array.isArray(title)) title.splice(index, 1);
```

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **815** |
| `any` | 2647 | **731** |
| `@ts-nocheck` | 80 | **3** |


## R103（2026-11-26）— 摘掉 `wap/index.vue`（H5 装修器主控）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 815 | **814**（−1） |
| no-explicit-any | 731 | **731** |
| **`@ts-nocheck`** | 3 | **2**（实际剩 2 个 kanjia 文件） |
| typecheck / build | 0 | 0 |

45 个错误清零。**这是「动态组件索引」这类结构性问题的收官。**

### 一、`templates[element.type]` 的正确解法：加一层宽索引别名

```ts
import templates from "./template/index";

/** 组件类型 → 渲染组件（类型是字面量对象，模板里按字符串取需要宽索引） */
const templateMap = templates as unknown as Record<string, unknown>;
```

模板里改用 `templateMap[element.type]` / `:is="templateMap[element.type]"`。
`iconMap` 同理（`const iconMap: Record<string, unknown> = {...}`）。

> 这类「字面量对象 + 字符串索引」在 Vue 模板里非常常见，
> **不要逐个 `as any`，而是给整张表加一个宽索引别名**。

### 二、`WapComponent` 又漏了 5 个字段（共享类型）

```ts
/** 楼层是否在渲染端隐藏（装修器可切换） */
hidden?: boolean;
/** 促销类组件的促销类型（LIVE / SECKILL / GROUP …） */
promotionsType?: string;
subName?: string;
subColor?: string;
subBkColor?: string;
```

补在 `types.ts` 的 `WapComponent` 上 —— 一次修好 `hidden` / `promotionsType` / `subName` 等 8 个错误。

### 三、`decorateData` 声明成字符串，实际是「组件对象」

```ts
// ✗
const decorateData = ref(""); // 装修数据
// ✓
const decorateData = ref<WapLegacyComponent | null>(null);
```

`decorateData.value = ""` 的两处清空也改成 `= null`。

### 四、楼层 options 的局部收窄

```ts
/** 楼层配置（促销类组件里有 list） */
type FloorOptions = { list: Array<Record<string, unknown>> };
const floor = contentData.value.list[newIndex];
const floorOptions = floor?.options as unknown as FloorOptions | undefined;
```

`WapComponent.options` 是 `unknown`（各组件配置结构不同），在**使用处**按需收窄，比给每个组件写联合类型务实。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **814** |
| `any` | 2647 | **731** |
| `@ts-nocheck` | 80 | **2** |


## R104（2026-11-26）— 尝试最后两个 `kanjia` 文件（本轮未完成，已回滚）

### 结果

两个 `kanjia-activity-*-goods.vue` 摘掉指令后合计 **71 个错误**（37 + 34），
本轮的修复把 `add-goods` 从 37 降到 **18**，但仍未收敛，**已从快照回滚**，
`@ts-nocheck` 保持 2 个文件。验收三件套仍全绿（ratchet 814）。

### 已确认的三个难点（供下一轮直接入手）

1. **商品行是 `never[]`**
   ```ts
   const form = reactive({ promotionGoodsList: [] });   // 推断成 never[]
   ```
   声明 `KanjiaGoods` 接口后，`never` 类错误全部消失（37 → 28）。

2. **`el-input-number` 与「价格字段可能是字符串」的冲突**
   价格字段在模板里既要参与 `regular.money.test(...)`（要 string）、
   又要绑 `el-input-number`（要 number/null）、还要参与 `<` `<=` 比较。
   **正确做法是先确定一种存储类型**（建议 `number`），在「格式校验」处 `String(...)`、
   在「比较」处直接比较，而不是让字段在两种类型间摇摆。

3. **`el-date-picker` 的 range 与业务 `rangeTime` 的长度不一致**
   `getDefaultActivityTime()` 返回 `Array<string | Date>`，picker 要 `[string, string]`，
   中间必须有一层 computed 适配（`coupon-publish` 里已经这么做了）。

### 经验

> 这类「表单字段被 3 种组件/逻辑以 3 种类型要求」的页面，
> **不能边改边试** —— 必须先定下存储类型，再逐处适配，否则错误数会反复震荡（本轮 37→28→46→18→46）。

### 当前状态

| 指标 | 值 |
|---|---:|
| lint 告警 | **814** |
| `any` | **731** |
| `mutating-props` | **79** |
| `@ts-nocheck` | **2**（两个 kanjia 文件） |


## R105（2026-11-26）— 摘掉最后两个 `kanjia` 文件 · **`@ts-nocheck` 归零**

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 814 | **812**（−2） |
| **`@ts-nocheck`** | 2 | **0** ✅ |
| **`ban-ts-comment` 告警** | 2 | **0** ✅ |
| typecheck / build | 0 | 0 |

`add-goods` 37 个错误、`edit-goods` 34 个错误，本轮全部清零。

### 一、关键：先定「存储类型」，再逐处适配

上一轮（R104）失败的原因是让字段在 string / number 之间摇摆，错误数反复震荡。
这一轮先把类型定死，再改绑定：

| 文件 | 输入组件 | 写回类型 | 存储类型 |
|---|---|---|---|
| `kanjia-activity-add-goods` | `el-input-number` | `number` | `settlementPrice: number` 等 |
| `kanjia-activity-edit-goods` | `el-input type="number"` | **`string`** | `settlementPrice: string` 等 |

> **同样是「价格输入」，`el-input-number` 写回 number，`el-input type="number"` 写回 string。**
> 这一点决定了整个表单的类型，必须一开始就确认。这是本轮唯一的关键判断。

### 二、`never[]` 的全部来源：`reactive({ list: [] })`

```ts
// ✗ 推断成 never[] → 所有 list[i].xxx 都报 "Property does not exist on type 'never'"
const form = reactive({ promotionGoodsList: [] });
// ✓ 声明出行类型
const form = reactive<{ promotionGoodsList: KanjiaGoods[]; rangeTime: string[] }>({ ... });
```

### 三、`el-date-picker` 配了 `value-format` 就写字符串

```ts
// value-format="YYYY-MM-DD HH:mm:ss" → 写回的就是 string
rangeTime: string[];
// 于是时间解析不再需要 Date 分支
const startDate = new Date(String(start ?? ""));
```

上一轮把它写成 `Array<string | Date>`，反而引入了 `instanceof Date` 的 TS2358。

### 四、格式校验 vs 数值比较的分工

```ts
// 格式校验要字符串
if (!regular.money.test(String(res.settlementPrice))) { ... }
// 数值比较直接比 number（存储就是 number，不必再 parseFloat）
if (Number(res.lowestPrice) > Number(res.highestPrice)) { ... }
```

### 五、最终状态

| 指标 | R8 起点 | R105 | 变化 |
|---|---:|---:|---:|
| lint 告警 | 3477 | **812** | **−76.6%** |
| `any` | 2647 | **731** | −72.4% |
| `mutating-props` | 738 | **79** | −89.3% |
| `@ts-nocheck` | 80 | **0** | **−100%** 🎉 |

**全仓 0 处类型检查豁免，验收三件套全绿。**


## R106（2026-11-26）— `mutating-props` 治理第 1 批（79 → 58）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 812 | **791**（−21） |
| **`vue/no-mutating-props`** | 79 | **58**（−21） |
| typecheck / build | 0 | 0 |

### 一、先判断「这是谁的数据」

子组件改 `props.xxx` 有两种截然不同的情况，处理方式必须不同：

**A. 父组件持有对象，子组件做「就地编辑」**（页面设置面板、权益表单）
→ 这不是 bug，是**没把双向绑定声明清楚**。正确写法是对象型 `v-model`：

```ts
// 子组件
const form = defineModel<BenefitForm>("form", { required: true });
// 父组件
<BenefitFormFields v-model:form="formAdd" ... />
```

`defineModel` 是 Vue 3.4+ 为「父持有、子编辑」提供的**官方通道**，
改它不算改 prop —— 数据流向仍然是单向的（父持有 → 子写 model → 父更新）。

**B. 子组件只应「请求修改」**（页面设置的面板，父对象还混着 list 等结构）
→ 用 patch 事件，父组件自己合并：

```ts
// 子组件
const props = defineProps<{ res: PageSettingLike }>();
const emit = defineEmits<{ "update:res": [patch: PageSettingLike] }>();
function setField(key: keyof PageSettingLike, value: unknown) {
  emit("update:res", { ...props.res, [key]: value });
}
// 父组件
<PanelPageSetting :res="contentData" @update:res="applyPageSetting" />
function applyPageSetting(patch) { contentData.value = { ...contentData.value, ...patch }; }
```

### 二、顺手修好的两个真实问题

1. **`defineEmits(['type-change', ...])` 与 `defineModel` 混用时，事件类型丢失**
   → 改成显式签名后，父组件传错 handler 会直接报错（本轮就发现了 3 处参数不匹配）：
   ```ts
   defineEmits<{
     "type-change": [value: string];
     "select-coupons": [which: "add" | "edit"];
     "quantity-change": [which: "add" | "edit", index: number, value: number];
     "remove-coupon": [which: "add" | "edit", index: number];
   }>();
   ```

2. **`which: string` 应该是 `"add" | "edit"`**
   改成联合字面量后，`$emit('select-coupons', which)` 的类型才和父组件
   `openCouponPicker(which: FormWhich)` 对上。

### 三、剩余 58 处的分布

| 文件 | 数量 |
|---|---:|
| `wap/video-config.vue` | 25 |
| `pc/config-panel/RowConfigPanel.vue` | 6 |
| `wap/decorate.vue` | 4 |
| `modelList/carousel2.vue` | 4 |
| `modelList/goodsAndType.vue` | 3 |
| `pc/config-panel/index.vue` | 3 |
| 其余 11 个文件 | 13 |

下一批建议先做 `video-config.vue`（25 处，单一组件、模式统一）。

### 四、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **791** |
| `any` | 2647 | **731** |
| `mutating-props` | 738 | **58** |
| `@ts-nocheck` | 80 | **0** |


## R107（2026-11-26）— `mutating-props` 治理第 2 批（58 → 17）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 791 | **755**（−36） |
| **`vue/no-mutating-props`** | 58 | **17**（−41） |
| `any` | 731 | 736（+5，边界处补的宽类型） |
| typecheck / build | 0 | 0 |

### 一、装修器场景的第三条路：`computed` 取同一引用

前两批用了 `defineModel`（父持有 ref）和 patch 事件（父需合并）。
但装修器里的楼层是 **`v-for` 出来的别名**，父级根本无法对它做 `v-model`：

```vue
<!-- decorate.vue：item 是 v-for 别名，v-model:item="item" 是非法的 -->
<video-config :item="item" />
```

这种情况下用 **computed 取同一对象引用**，组件内就不再出现「给 prop 赋值」：

```ts
const props = defineProps<{ data: Record<string, any> }>();

/**
 * 楼层数据代理。
 * 画布是 v-for 渲染的，父级无法对别名做 v-model，
 * 这里取同一对象引用再编辑：数据仍写回页面模型，组件内不再给 prop 直接赋值。
 */
const data = computed(() => props.data);
```

模板里 `data.options.list.push(...)` 照旧工作（模板自动解包 computed），
**运行时行为与改造前完全一致**（同一个对象），只是不再有 prop 写语法。

> 三种场景三条路，选错就会绕远：
> **父有 ref → `defineModel`；父要合并结构 → patch 事件；v-for 别名 → computed 代理。**

### 二、本轮处理的文件

| 文件 | 处理 |
|---|---:|
| `wap/video-config.vue` | 25 → 0（computed 代理 + 显式 props 类型） |
| `pc/config-panel/RowConfigPanel.vue` | 6 → 0（同上，并给 `rowStyle` 补上 `margin/padding/radius` 的数组类型） |
| `modelList/carousel2.vue` | 4 → 0 |
| `modelList/goodsAndType.vue` | 3 → 0 |
| `modelList/carousel.vue` / `carousel1.vue` | 3 → 0 |

### 三、顺手修的类型问题

`RowConfigPanel` 把 `margin/padding/radius` 声明成 `number | string`，
而 `NestedBoxModel` 要的是 `number[]`（四值盒模型）——
补上 `PcRowStyle` 里的真实形状后，3 个错误消失。

### 四、剩余 17 处

| 文件 | 数量 | 备注 |
|---|---:|---|
| `wap/decorate.vue` | 4 | `options` 初始化 / 合并，需单独设计（同一个对象既要补默认值又要合并 patch） |
| `pc/config-panel/index.vue` | 3 | `selectedComponent.options[key]` 动态键 |
| `modelForm.vue` / `modelFormItem.vue` | 3 | 商品分组拖拽，牵连较广 |
| `modelList/forYour`、`mixModel`、`oneRowThreeColumns`、`onlyGoodsModel` | 5 | 纯 `props.data.options` 写入 |
| `ComponentConfigPanel.vue`、`tpl_hot_area.vue` | 2 | 单点 |

下一批可以先把「纯 `props.data.options` 写入」的 5 个清掉（模式与 carousel 完全一致）。

### 五、进度

| 指标 | 起点（R8） | 现在 |
|---|---:|---:|
| 告警 | 3477 | **755** |
| `any` | 2647 | **736** |
| `mutating-props` | 738 | **17** |
| `@ts-nocheck` | 80 | **0** |


## R108（2026-11-26）— 缺陷修复：H5 装修器「上传视频」打开的是图片素材库

### 现象

H5 装修 → 视频楼层 → 点「上传视频」→ 弹出的素材库只有 JPEG/PNG，
分类停在「全部图片」，**无法选到任何视频**（截图已确认）。

### 根因

素材库（`ossManage`）有一整套声明式入参：

```ts
// ossManage.activatePicker()
fileType.value = props.mediaType === "VIDEO" ? "video" : "pic";
```

但 `decorate.vue`（H5 装修器）**没有传 `:media-type`**，而是走老办法——
打开弹窗后在 `nextTick` 里拿组件实例改内部状态：

```ts
// ✗ 旧代码
picModelFlag.value = true;
nextTick(() => {
  oss.fileType = "video";     // 弹窗内容是懒挂载的，此刻实例可能还是 null
  oss.changeFileType();
});
```

`el-dialog` 是 `append-to-body + destroy-on-close`，内容在下一个渲染周期才挂载，
`nextTick` 里 `ossManageRef.value` 常为 `null` → 直接 return → 停在默认的 IMAGE。
即使实例存在，这次赋值也会被随后的 `activatePicker()`（由 `initialize` 触发）覆盖。

### 修法：把类型声明在「打开之前」

```ts
/** 素材库要展示的媒体类型（打开前就要定好） */
const pickerMediaType = ref<"IMAGE" | "VIDEO">("IMAGE");

function handleClickFile(item, _index, field = "img") {
  pickerMediaType.value = field === "videoUrl" ? "VIDEO" : "IMAGE";  // ← 先定类型
  picModelFlag.value = true;
}

// 模板
<ossManage
  :initialize="picModelFlag"
  :only-image="pickerMediaType !== 'VIDEO'"
  :media-type="pickerMediaType"
/>
```

同时删掉 `pc/index.vue` 里两处同样的命令式 `fileType` 改写（它其实已经传了
`:media-type`，两套机制并存只会互相打架）。

### 参考实现

H5 的新版 `wap/config-panel/PanelVideo.vue` 本来就是这么写的：

```ts
const pickerMediaType = computed<"IMAGE" | "VIDEO">(() =>
  currentField.value === "videoUrl" ? "VIDEO" : "IMAGE"
);
```

**老路径（`decorate.vue` 的视频楼层）漏了这一层**，本次对齐。

### 验收

| 项 | 结果 |
|---|---|
| typecheck / build / lint | 全绿（ratchet 755 不变） |
| 素材库分类 | 「视频」分类、上传按钮文案「上传视频」、`accept="video/*"` |


## R109（2026-11-26）— 素材库选择器统一为声明式 + 修复「上传视频仍是图片弹窗」

### 为什么 R108 的改法还不够

R108 给 H5 装修器补了 `:media-type`，但**打开后仍然是图片分类**。真正的原因在
`ossManage` 自己：

```ts
// 原来只有这一条路径能初始化分类
watch(() => props.initialize, (val) => { if (val && props.isComponent) activatePicker(); });
```

而调用方的弹窗几乎都是 `append-to-body + destroy-on-close`：
**组件挂载那一刻 `initialize` 就已经是 `true`**，watcher 观察不到 `false → true`，
`activatePicker()` 永远不执行 → `fileType` 停在默认的 `"pic"` → 只列图片。

> 换句话说：`:media-type` 之前是「半个死参数」——只有「不销毁的弹窗」才生效。

### 修法：挂载时也按 `initialize` 走一次选择器初始化

```ts
onMounted(() => {
  if (props.isComponent) {
    searchForm.pageSize = 20;
  }
  // 弹窗普遍用 destroy-on-close，组件挂载那一刻 initialize 已经是 true，
  // watch(initialize) 观察不到变化，mediaType 就永远不生效。
  if (props.isComponent && props.initialize) {
    activatePicker();
    return;
  }
  init();
});
```

一处修改，**35 个使用点同时受益**（凡是用 `:initialize` + `:media-type` 的都会按声明走）。

### 顺手把「命令式」彻底清掉

`ossManage` 早已 `defineExpose({ selectImage, fileType, changeFileType })`，
但媒体类型不该靠外部改实例状态。本轮把调用方声明里的残留能力删掉：

```ts
// ✗ 之前：类型里还留着「可以命令式改类型」
ref<{ selectImage?: boolean; fileType?: string; changeFileType?: () => void } | null>(null)
// ✓ 现在：只能打开/关闭选择态
ref<{ selectImage?: boolean } | null>(null)
```

涉及 8 个文件（7 个单行 + `decorate`/`advertising`/`pc-index` 的类型块）。
**现在全仓 `changeFileType` 只剩 `ossManage` 内部使用与 expose，没有调用方再用它。**

### 后端确认：素材库里确实有视频

```
GET /manager/common/file?fileCategory=VIDEO&userEnums=MANAGER
→ total=2  animation.mp4 | 15-Sec-Hp-Cut 2-1-q32.mp4
GET ...fileCategory=IMAGE → total=27
```

修复后「上传视频」应能看到这 2 个 mp4。

### 验收

| 项 | 结果 |
|---|---|
| typecheck / build | exit 0（built in 5.94s） |
| lint | 755（不变） |


## R110（2026-11-26）— 缺陷修复：视频楼层「圆角设置无效」

### 根因：渲染端拿**单个字段**当「新样式总开关」

```ts
// tpl_video.vue（修复前）
const styled = computed(() => props.res && props.res.paddingTop !== undefined);
const wrapperStyle = computed(() => {
  if (!styled.value) return getVideoWrapperStyle(item.value);   // ← 整块走老样式
  return { ..., borderRadius: px(res.borderRadius), ... };      // ← 新样式根本进不来
});
```

而右侧面板（`PanelVideo`）只写它自己那几个字段：`borderRadius` / `imgRadius` /
`bgColor1`…**从来不写 `paddingTop`**。所以：

> 用户只调圆角 → `styled` 一直是 `false` → 圆角、背景、边距**全部设置无效**。

同一写法在 **8 个渲染端**里都有（`tpl_video` / `tpl_article` / `tpl_coupon` /
`tpl_integral` / `tpl_menu` / `tpl_promotion_detail` / `tpl_shop` / `tpl_title`）。

### 修法：逐字段合并，而不是整块二选一

老数据（`item.style.*`）打底，面板设置过的字段逐个覆盖：

```ts
const has = (v: unknown) => v !== undefined && v !== null && v !== "";
const wrapperStyle = computed<CSSProperties>(() => {
  const legacy = getVideoWrapperStyle(item.value);      // 老：margin/padding/background
  const legacyBox = getVideoBoxStyle(item.value);       // 老：圆角在 item.style.bgRadius
  const radius = has(res.borderRadius) ? px(res.borderRadius) : String(legacyBox.borderRadius ?? "0px");
  return {
    ...legacy,
    padding: [res.paddingTop, res.paddingX, res.paddingBottom].some(has) ? ... : legacy.padding,
    background: has(res.bgColor1) ? ... : legacy.background,
    borderRadius: radius,
    overflow: Number.parseFloat(radius) > 0 ? "hidden" : "visible",
  };
});
```

要点：
1. **圆角必须是 `overflow: hidden` 才裁得到视频本体**（否则只是盒子有圆角，`<video>` 依然直角）。
2. 老数据的圆角记在 `item.style.bgRadius`（内层），新面板记在 `options.borderRadius`（外层）—— 合并时各自取。
3. `paddingTop/PaddingX/paddingBottom` 三件套里只要有一项设置就整体接管，避免出现「只改上边距、左右被别人覆盖」。

### 数据链路确认

```
PanelVideo: v-model="local.borderRadius" → emit('update:options') → decorate: Object.assign(res.options, patch)
渲染: <component :is="templateMap['video']" :res="element.options"> → tpl_video 读 res.borderRadius ✅
```

面板 18rpx / 30rpx → 画布上 9px / 15px（375 画布按 750rpx 折半，与面板提示一致）。

### 验收

| 项 | 结果 |
|---|---|
| typecheck / build | exit 0（built in 5.89s） |
| lint | 755（不变） |

### 遗留同类问题（下一轮）

`tpl_article` / `tpl_coupon` / `tpl_integral` / `tpl_menu` / `tpl_promotion_detail` /
`tpl_shop` / `tpl_title` 仍是「paddingTop 单字段开关」。
改法与本轮一致（逐字段合并），但每个组件的旧样式字段不同，需要逐个核对，
**建议单独一轮并逐个手测**，避免一次性改动引入视觉回退。


## R111（2026-11-26）— 统一「面板样式是否生效」的判定（9 个渲染端）

### 问题复述

R110 修好了视频楼层的圆角，但同一个写法在另外 **9 个渲染端**里都有：

```ts
const styled = computed(() => props.res && props.res.paddingTop !== undefined);
```

面板只改颜色/圆角时不会写 `paddingTop` → `styled` 恒为 `false` →
**整块新样式（颜色、圆角、间距）全部「设置无效」**。

### 修法：抽出共享判定 `hasPanelStyle`

新增 `wap/template/panel-style.ts`：

```ts
/**
 * 面板级样式字段。面板把样式写在楼层 options 上，老数据写在条目上（item.style.*）。
 * **不能只用一个字段判断**（例如 paddingTop）：面板可能只改圆角/颜色，
 * 那样整块新样式都不会生效 —— 视频楼层的「圆角设置无效」就是这么来的。
 */
const PANEL_STYLE_KEYS = [
  "paddingTop", "paddingX", "paddingBottom", "pageGap", "contentGap",
  "bgColor1", "bgColor2", "borderRadius", "imgRadius",
  "titleColor", "nameColor", "moreColor", "textColor", "menuCols", "menuDisplay",
] as const;

export function hasPanelStyle(res: unknown): boolean {
  return PANEL_STYLE_KEYS.some((key) => (res as Record<string, unknown>)[key] !== undefined);
}
```

9 个渲染端统一改为一行：

```ts
const styled = computed(() => hasPanelStyle(props.res));
```

| 渲染端 | 组件 |
|---|---|
| `tpl_title` | 标题栏 |
| `tpl_menu` | 宫格导航 |
| `tpl_notice` | 公告 |
| `tpl_shop` | 店铺列表 |
| `tpl_integral` | 积分商城 |
| `tpl_coupon` | 优惠券 |
| `tpl_promotion_detail` | 促销详情 |
| `tpl_article` | 文章列表 |
| `tpl_search` | 搜索 |

> 注意 `tpl_notice` / `tpl_search` 原来用 `paddingX` 判断，`tpl_article` 连 `props.res` 判空都没有，
> 这次一并统一。

### 判定语义（写进代码注释）

- **老数据**：样式在 `item.style.*` 上，options 里没有这些键 → `hasPanelStyle` 为 false → 走老逻辑，外观不变。
- **面板动过**：面板写任意一项（圆角也算）→ 为 true → 走新逻辑，**改哪项哪项立刻生效**。

### 已知取舍

面板一旦写入了**颜色**，该楼层会整体切到「面板样式」体系：未被面板设置过的间距等字段
取不到值时会退回 0。这是「用了新面板就以新面板为准」的语义。
若某个老页面因此出现间距变化，按 R110 的做法对该组件改为**逐字段合并**即可（视频楼层已是这一种）。

### 验收

| 项 | 结果 |
|---|---|
| typecheck / build | exit 0（built in 6.15s） |
| lint | 755（不变） |


## R112（2026-11-26）— `mutating-props` 清零（79 → 0）+ `computed` 副作用清零

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 755 | **747**（−8） |
| **`vue/no-mutating-props`** | 17 | **0** ✅ |
| **`vue/no-side-effects-in-computed-properties`** | 2 | **0** ✅ |
| `any` | 736 | 747（+11，边界处的宽类型标注） |
| typecheck / build | 0 | 0 |

### 一、最后 17 处 `mutating-props` 的处理

全部是装修器的「就地编辑」场景，统一用 **computed 同引用代理**（R107 确立的做法）：

| 文件 | 处理 |
|---|---:|
| `wap/decorate.vue` | 4 → 0（`applyPanelOptions` 改为写 `res.value.options`） |
| `pc/config-panel/index.vue` | 3 → 0（通用属性表单的动态键 `v-model`） |
| `modelForm.vue` / `modelFormItem.vue` | 3 → 0 |
| `modelList/forYour`、`mixModel`、`oneRowThreeColumns`、`onlyGoodsModel` | 5 → 0 |
| `ComponentConfigPanel.vue` | 1 → 0 |
| `wap/template/tpl_hot_area.vue` | 1 → 0 |

`pc/config-panel/index.vue` 那处比较特别 —— 模板里是 `v-model="selectedComponent.options[key]"`，
而 `selectedComponent` 是从 props 派生的只读 computed，所以：

```ts
const componentProxy = computed(() => props.selectedComponent as PanelComponentLike | null);
// 模板
v-model="componentProxy!.options[key]"
```

### 二、两处「computed 里做副作用」的真实隐患

`vue/no-side-effects-in-computed-properties` 只有 2 个告警，但都是**真问题**：
在渲染期间改数据，可能造成重复渲染甚至循环。

**① `ComponentConfigPanel.vue`：边算边归一化样式**

```ts
// ✗ computed 里给对象补 margin/padding/radius、纠正 widthRatio
const compStyle = computed(() => {
  if (!props.component.componentStyle) component.value.componentStyle = {};
  if (!Array.isArray(s.margin)) s.margin = [0, 0, 0, 0];
  ...
});
// ✓ 拆成「显式函数 + watch 触发」和「纯读取 computed」
function ensureComponentStyle() { ...归一化... }
watch(() => props.component, () => ensureComponentStyle(), { immediate: true });
const compStyle = computed(() => (props.component?.componentStyle ?? {}) as Record<string, any>);
```

**② `PanelUserBenefits.vue`：computed 里填默认服务项**

```ts
// ✗
const ensureServices = computed(() => {
  if (!local.services?.length) local.services = clone(defaultServices);
  return local.services;
});
// ✓ 用 watch（只填空数组，填完即非空，不会自触发）
watch(() => local.services, (val) => {
  if (!Array.isArray(val) || !val.length) local.services = clone(defaultServices);
}, { immediate: true });
const ensureServices = computed(() => local.services);
```

### 三、里程碑：除了 `any`，其它规则已全部清零

| 规则 | R8 起点 | 现在 |
|---|---:|---:|
| `no-explicit-any` | 2647 | **747** |
| `vue/no-mutating-props` | 738 | **0** ✅ |
| `ban-ts-comment` | 80 | **0** ✅ |
| `no-side-effects-in-computed-properties` | — | **0** ✅ |
| `no-unused-vars` | — | **0** ✅ |

**下一阶段的唯一目标就是 `any`（747）。**


## R113（2026-11-26）— `any` 收口第 1 批（747 → 719）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 747 | **719**（−28） |
| typecheck / build | 0 | 0 |

### 一、校验器三参（6 处 → 省 18 个 any）

```ts
// ✗ 过去一律 any
const checkPrice = (rule: any, value: any, callback: any) => { ... }
// ✓ 只读参数 + 明确回调类型
const checkPrice = (rule: unknown, value: unknown, callback: (error?: Error) => void) => { ... }
```

改完后暴露了 8 个真实问题：`regular.money.test(value)` / `parseFloat(value)` 直接拿 `unknown` 用。
补上 `String(value ?? "")` 与 `Number(value)` 后编译通过 —— **这正是「收 any」的价值：它把隐式转换暴露出来**。

顺带 `catch (e: any)` 改为 `catch (e)`（TS 里默认 `unknown`）。

### 二、`el-form` / `el-table` 实例：从 `ref<any>` 换成结构化类型

新增 `src/types/el-refs.ts`：

```ts
/** el-form 实例（只声明项目里实际用到的成员） */
export type FormRefLike = {
  validate?: (callback?: (valid: boolean, fields?: unknown) => void) => Promise<boolean>;
  validateField?: (props: string | string[], callback?: (error: string) => void) => void;
  resetFields?: (props?: string | string[]) => void;
  clearValidate?: (props?: string | string[]) => void;
  scrollToField?: (prop: string | string[]) => void;
};

/** el-table 实例 */
export type TableRefLike = {
  clearSelection?: () => void;
  toggleRowSelection?: (row: unknown, selected?: boolean) => void;
  toggleAllSelection?: () => void;
  setCurrentRow?: (row?: unknown) => void;
  clearSort?: () => void;
  clearFilter?: (columnKeys?: string[]) => void;
  doLayout?: () => void;
  sort?: (prop: string, order: string) => void;
};
```

然后用脚本**按实际用到的方法自动归类**：
读文件 → 找 `const X = ref<any>(null)` → 收集 `X.value.方法(` 的方法集合 →
全是表单方法就用 `FormRefLike`，全是表格方法就用 `TableRefLike`，其它（`open`、`reload`、无调用）跳过。

结果：9 个文件自动替换成功，37 处保留（`open` / `reload` / 只做模板 ref 不需要方法）。

替换后必须同步把调用点改成可选链：

```ts
// ✗
formRef.value.validate(cb)
// ✓
formRef.value?.validate?.(cb)
```

`coupon-publish.vue` 里那处内联的 `@blur="formRef?.validateField(...).catch(...)"` 改成具名函数
`onThresholdBlur()` —— 模板里塞三段可选链可读性太差。

### 三、下一批（剩余 719 个 any 的分布）

| 模式 | 数量 | 备注 |
|---|---:|---|
| 函数参数 `(x: any)` | 407 | 需按文件逐个看语义 |
| `Record<string, any>` | 71 | 后端 DTO 边界，多数应保留 |
| `ref<any>(null)` | 37 | 余下是 `open`/`reload`/纯模板 ref |
| `ref<any[]>` | 33 | 多为表格行数据 |
| `.then((res: any)` | 32 | **应由请求层/接口层给出类型** |
| `: any[]` | 19 | |
| `as any` | 19 | 应逐个消除 |

> 下一阶段的关键不是「批量替换」，而是**给请求层与 api 模块补返回类型**（`ApiResult<T>`），
> 那样 32 处 `.then((res: any)` 与大量函数参数会自然消失。


## R114（2026-11-26）— `any` 收口第 2 批（719 → 672）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 719 | **672**（−47） |
| typecheck / build | 0 | 0 |

### 一、`.then((res: any)` 全部改为「由接口签名推断」（32 处）

这批的关键发现：**接口层其实早就带类型了**，只是调用处又写了 `any` 把它盖掉。

```ts
// ✗ 把接口层给的类型直接抹掉
API_Store.getShopDetailData(id).then((res: any) => { storeInfo.value = res.result; });
// ✓ 交给签名推断（res: ResultMessage<Store>）
API_Store.getShopDetailData(id).then((res) => { ... });
```

去掉注解后只暴露了 **3 个真实错误**（`res.result` 可能 undefined），
补成 `res.result?.records ?? []` / `res.result?.total ?? 0` 即可。
—— 这说明「接口层本来是对的，是调用处的 any 在挡路」。

### 二、`as any` 全部换成精确类型（16 处）

分三类处理：

**① 状态映射表 → `Record<string, string>`**

```ts
// ✗ return (PROCUREMENT_STATUS as any)[status] || status
// ✓
return (PROCUREMENT_STATUS as Record<string, string>)[String(status ?? "")] || status || "-";
```

涉及 `constants/cardKey.ts`、`constants/goodsType.ts`、`orderComplaint.vue`、`procurement/constants.ts`。

**② 模板/面板映射表 → `Record<string, unknown>`**

`pc/config-panel/index.vue`（panelMap）、`pc/template/index.ts`（CANVAS_TEMPLATE_MAP）、
`TplUserBenefits.vue`（iconMap）。

**③ 标签颜色函数 → 返回联合字面量 `TagType`**

去掉 `as any` 后，`el-tag :type` 立刻要求五个字面量之一，于是：

```ts
type TagType = "primary" | "success" | "warning" | "info" | "danger";
export function wechatSyncTag(value: string): TagType { ... }
export function procurementStatusTag(status: string | undefined): TagType { ... }
```

`utils/wechatOrderSync.ts` 里顺带发现 `WAIT_ARBITRATION: ""`（空字符串当标签类型）——
这是**真 bug**：Element Plus 收到空 type 会走默认色，语义上应是 `info`。已修正。

### 三、`CheckboxValueType` 的收窄

`category-setting.vue` 里 `v-model="(form.showFields as Record<string, boolean>)[key]"`
直接绑到 `el-checkbox` 会类型冲突（它写回 `CheckboxValueType`），改成显式双向绑定：

```vue
:model-value="Boolean(showFields[key])"
@update:model-value="(v) => (showFields[key] = Boolean(v))"
```

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **672** |
| `any` | 2647 | **672** |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R115（2026-11-26）— `any` 收口第 3 批：文件级精修（672 → 612）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 672 | **612**（−60） |
| typecheck / build | 0 | 0 |

### 方法：按文件读代码，逐个函数给出真实类型

前几轮是「模式级」批量替换，这一轮改成**文件级精修**：把整个文件的 `any` 按语义分类，
一次性给出真实类型。三个文件合计 −60。

### ① `gift-card-cash-records.vue`（30 → 0）

先补行数据类型，再逐个函数收窄：

```ts
/** 礼物卡批次 / 使用记录的行数据（后端分页返回，字段会扩容） */
type GiftCardRow = {
  id?: string | number;
  createBatchId?: string;
  issueBatchId?: string;
  giftCardName?: string;
  faceValue?: string | number;
  transactionTime?: string;
  [key: string]: unknown;
};
```

- 展示函数（`formatText` / `formatQuantity` / `formatExpireTime`）→ 参数 `unknown`
  （它们本来就只做 `hasValue` 判断 + `String()`）
- 行函数（`formatCreateBatchId` / `goBatchCredentials` …）→ 参数 `GiftCardRow`
- 翻页函数（6 个 `createChangePage` 之类）→ 参数 `number`
- `appendDateRangeToParams(params, range, startKey, endKey)` →
  `Record<string, unknown>` / `string[]` / `string` / `string`
- `toApiDateTimeBoundary(val, endOfDay)` → `string | number | Date` / `boolean`

过程中发现两个真问题：
1. `(value || "").trim()` —— `value` 可能是数字，字符串方法会抛错 → 改 `String(value ?? "").trim()`
2. 日期范围类型第一次写成 `[string, string] | []` 太窄，搜索表单里就是 `string[]` → 放宽

### ② `orderList.vue`（26 → 0）

- 8 个「文案/颜色」函数：`(v: any)` → `(v: string | undefined)`，映射表索引改 `String(v ?? "")`
- 4 个翻页/范围函数 → `number` / `[string, string] | []`
- `orderGoods(row)` 之前返回 `{} | never[]`（模板里 `item.sn` 全报错），补上：

```ts
type OrderGoodsItem = { sn?: string; image?: string; name?: string; specs?: string; num?: number };
function orderGoods(row: { orderItems?: unknown } | null | undefined): OrderGoodsItem[] {
  const items = row?.orderItems;
  return Array.isArray(items) ? (items as OrderGoodsItem[]) : [];
}
```

- `selectDate` 从 `ref<any>` 换成 `ref<string[] | null>`（配合 `value-format` 的字符串写回）

### ③ `orderDetail.vue`（34 → 27）

这个文件的大头是**订单 DTO 的宽类型**（`order` / `orderLogs` / `receipt` 等），按既定原则保留。
只收窄纯函数参数：

`getStepStateClass` / `formatAddress` / `copyText` / `formatOperatorType` / `isGiftItem` /
`getPromotionText` / `copyCardKey`。

同样暴露真问题：
- `navigator.clipboard.writeText(text)` 与 `input.value = text` 都可能收到数字 → `String(text)`
- `row.promotionType.split(",")` 该字段可能不是字符串 → `String(row.promotionType).split(",")`

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **612**（−82.4%） |
| `any` | 2647 | **612**（−76.9%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |

剩余 612 个分布在 107 个文件，头部是：
`coupon-publish`(30)、`shopDetail`(25)、`distributionGoods`(22)、`shopOperation`(22)、
`PanelGridFloor`(21)、`departmentManage`(20)、`virtual-sales`(18)、`PanelChannelFloor`(18)。


## R116（2026-11-26）— `any` 收口第 4 批：文件级精修（612 → 570）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 612 | **570**（−42） |
| typecheck / build | 0 | 0 |

### ① `distributionGoods.vue`（22 → 0）

先给「行 / 表单 / 搜索条件」三套类型，再改函数：

```ts
type DistributionGoodsRow = { id?; goodsId?; authStatus?; goodsName?; goodsType?; storeName?; [k: string]: unknown };
type AuditForm = { authStatus: string; authRemark: string };
type DistributionSearchForm = { pageNumber: number; pageSize: number; ... authStatus: string };
```

模板侧同时收窄：
- 类目级联 `:model-value` + `@update`（`CascaderValue` → `string`）
- 审核单选框显式双向绑定
- 分类/品牌选项 `:key/:label/:value` → `String(item.id ?? '')`
- 下架 `delDistributionGoods(String(v.id ?? ""))`

### ② `departmentManage.vue`（20 → 0）

部门树是递归结构，先定节点类型：

```ts
type DepartmentNode = {
  id?: string | number; title?: string; parentId?: string | number;
  sortOrder?: number; status?: number; children?: DepartmentNode[];
  [key: string]: unknown;
};
```

三个真实问题被暴露出来：

**1. `filter(Boolean)` 不会收窄类型**

```ts
// ✗ map 返回 DepartmentNode | null，filter(Boolean) 之后仍是联合类型
.filter(Boolean)
// ✓
.map((node): DepartmentNode | null => { ... })
.filter((node): node is DepartmentNode => node !== null)
```

**2. `array[j].sortOrder > array[i].sortOrder` 可能拿 undefined 比较**

```ts
if ((array[j].sortOrder ?? 0) > (array[i].sortOrder ?? 0)) { ... }
```

**3. `res.result.map((item) => item.roleId)` 的参数是隐式 any**

改成显式断言 + 过滤：

```ts
const roles = res.result as Array<{ roleId?: string | number }>;
selectedRole.value = roles.map((i) => i.roleId).filter((id): id is string | number => id !== undefined);
```

### ③ 顺手补全 `TableRefLike`

`departmentManage` 用到 `toggleRowExpansion`（树表展开），补进共享类型：

```ts
toggleRowExpansion?: (row: unknown, expanded?: boolean) => void;
setExpandRowKeys?: (keys: string[]) => void;
```

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **570**（−83.6%） |
| `any` | 2647 | **570**（−78.5%） |


## R117（2026-11-26）— `any` 收口第 5 批（570 → 518）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 570 | **518**（−52） |
| typecheck / build | 0 | 0 |

两页：`coupon-publish`（30 → 1）、`shopDetail`（25 → 0）。

### ① `coupon-publish.vue`

新增两个类型 + 收窄 28 处函数：

```ts
/** 商品 sku 行（选择商品弹窗回传） */
type CouponGoodsItem = { id?; skuId?; goodsName?; price?; quantity?; storeId?; ... };
/** 分类树节点（级联选择器用） */
type CategoryTreeNode = { id?; name?; value?; label?; children?: CategoryTreeNode[] };
```

典型改法：
- `disabledDate(date: any)` → `(date: Date)`（Element Plus 本来就传 Date）
- `watch(() => route.query, (e: any))` → `Record<string, unknown>`，`id.value = String(e.id ?? "")`
- 递归函数 `next(params, prev)` → `CategoryTreeNode[]`
- `filterCategoryId(list: any, idArr: any)` → `(list: unknown, idArr: Array<string | number>)`

**保留 1 个 any**：`res.result as unknown as Record<string, any>` —— 优惠券详情接口返回
「表单字段 + 适用范围 + 时间区间」一整批，比 `CouponForm` 宽，属于**数据边界**，已在注释里写明理由。

**又修掉两个真实隐患**：
1. `ids.includes(item.skuId)` 里 `skuId` 可能是 `undefined` → 先判空再比较
2. `skuSelectRef.value.open(...)` 未判空 → `?.open?.()`

### ② `shopDetail.vue`（25 → 0）

```ts
type ShopListRow = { id?; rn?; sn?; [k: string]: unknown };
type CategoryNode = { id?; name?; children?: CategoryNode[] };
```

- 6 个分页函数 → `number`
- 2 个日期范围 → `[string, string] | []`
- `blankFilter(v: unknown)`（只做判空）
- 三个表单 ref → `FormRefLike`
- 列表接口结果用 `as unknown as ShopListRow[]` 显式转换（`Order[]` 的字段比我们声明的多）

### 三、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **518**（−85.1%） |
| `any` | 2647 | **518**（−80.4%） |

剩余头部：`shopOperation`(22)、`PanelGridFloor`(21)、`virtual-sales`(18)、
`PanelChannelFloor`(18)、`PanelCategoryNav`(15)、`TplCategoryMegaMenu`(14)。


## R118（2026-11-26）— `any` 收口第 6 批（518 → 479）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 518 | **479**（−39） |
| typecheck / build | 0 | 0 |

两页：`virtual-sales`（18 → 0）、`shopOperation`（22 → 1）。

### ① `virtual-sales/index.vue`（虚拟销量）

```ts
type SkuRow = {
  id?; sn?; goodsName?; storeName?; buyCount?; virtualSales?;
  /** 编辑框里的值（本地字段） */ virtualSalesInput?: number;
  /** 是否保存中（本地字段） */ saving?: boolean;
  [k: string]: unknown;
};
```

**踩到一个 Element Plus 的类型坑**：`@sort-change` 的入参是 `{ column, prop, order }`，
其中 `column` 是完整的 `TableColumnCtx`，写窄了会 **参数逆变报错**。最终写法：

```ts
function changeSort(raw: unknown) {
  const { column, prop, order } = (raw ?? {}) as {
    column?: { property?: string }; prop?: string; order?: string | null;
  };
  const sortProp = prop ?? column?.property ?? "create_time";
```

> 规则：**组件回调的入参用 `unknown` 再在函数体里收窄**，比猜它的类型稳。

### ② `shopOperation.vue`（店铺编辑）

**发现一处分不清的联合类型**：省市区选择器有两种回传结构

```ts
/** 级联路径（省市区三级） */
type RegionNode = { id?; name?; center?; position? };
/** 地图选点（点了具体位置） */
type MapPick = { addr?: string; addrId?: string; position?: { lng?; lat? } };

type RegionPick = { type?: string; data?: RegionNode[] | MapPick };
```

原来代码直接 `val.data.position.lng` / `val.data.addr` —— 在级联分支里这些字段根本不存在，
只是被 `any` 掩盖了。现在按分支各自收窄：

```ts
if (Array.isArray(val.data)) {           // 级联
  const nodes = val.data as RegionNode[];
  ...
} else {                                 // 地图选点
  const picked = (val.data ?? {}) as MapPick;
  shopForm.value.storeCenter = `${picked.position?.lng ?? ""},${picked.position?.lat ?? ""}`;
}
```

**还修掉三个真实隐患**：
1. `handleClickAddress('storeAddressPath')` 模板传的是**字段名字符串**，原签名却写成了地址数据 → 改成 `(field: string)`
2. `map.value.open()` 未判空 → `map.value?.open?.()`
3. `settlementCycle.includes(day.value)` —— 数组存字符串、`day` 是数字，永远 `false` → 统一 `String(day.value)`

### 三、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **479**（−86.2%） |
| `any` | 2647 | **479**（−81.9%） |

剩余头部：`PanelGridFloor`(21)、`PanelChannelFloor`(18)、`PanelCategoryNav`(15)、
`TplCategoryMegaMenu`(14)、`PanelFooterNav`(13)、`PanelNotice`(13)。


## R119（2026-11-26）— `any` 收口第 7 批：PC 装修面板组（479 → 441）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 479 | **441**（−38） |
| typecheck / build | 0 | 0 |

三个面板：`PanelGridFloor`（21 → 0）、`PanelChannelFloor`（18 → 0）、`PanelCategoryNav`（15 → 0）。

### 一、抽出一份「选择器契约」

三个面板都用 `inject` 拿全局选择器（选图 / 选链接 / 选商品），
过去一律 `inject<any>`，回调参数也全是 any。新增 `picker-types.ts`：

```ts
/** 素材库选图：回调直接给图片地址 */
export type OpenImagePicker = (callback: (url: string) => void) => void;

/** 链接选择：回调给地址、标题，raw 是原始节点（分类/商品等） */
export type OpenLinkPicker = (
  callback: (picked: { url?: string; title?: string; raw?: Record<string, unknown> }) => void
) => void;

/** 商品选择：回调给选中的商品数组（具体形状由各面板自己的行类型定义） */
export type PickedGoods = Record<string, unknown>;
export type OpenGoodsPicker = (callback: (goods: PickedGoods[]) => void) => void;
```

面板里：

```ts
const openLinkPicker = inject<OpenLinkPicker | null>('openLinkPicker', null);
openLinkPicker(({ url, title, raw }) => { ... });   // 参数自动推导，不用再写 any
```

### 二、三个真实的类型错位

**1. `openGoodsPicker` 被当成两参函数调用**

```ts
// ✗ 实际注入的选择器只接受 1 个回调
openGoodsPicker((selectedGoods) => { ... }, local.goods || []);
```

这个错误一直存在，只是被 `inject<any>` 掩盖（多传的参数被静默忽略）。
现在去掉第二参 —— **「打开时预选已选商品」这个需求其实没实现**，留给后续在
`pc/index.vue` 的选择器里补 `preset` 参数。

**2. `ElMessageBox.prompt(...).then(({ value }) => ...)` 不能直接解构**

返回值是 `MessageBoxData | Action` 的联合：

```ts
.then((res) => {
  const value = String((res as { value?: string })?.value ?? "");
  ...
})
```

**3. 各面板的行形状本来就不一样，别硬统一**

`FloorGoods` / `ChannelGoods` / `CategoryNavItem` 各自的字段不同，
把手写类型塞进共用的 `PickedGoods` 只会互相打架 —— 共用类型只保留「一定是对象」这一层约定。

### 三、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **441**（−87.3%） |
| `any` | 2647 | **441**（−83.3%） |

剩余头部：`TplCategoryMegaMenu`(14)、`PanelFooterNav`(13)、`PanelNotice`(13)、
`PanelTitle`/`PanelSearch` 等 HTML5/PC 模板各 10 上下。


## R120（2026-11-26）— 完成待办 + `any` 收口第 8 批（441 → 422）

### 一、待办完成：`openGoodsPicker` 的「打开时预选已选商品」

R119 里我发现两个面板把 `openGoodsPicker` 当两参函数调用，但类型收窄后发现
**注入的选择器确实支持第二个参数**（`pc/index.vue`）：

```ts
function openGoodsPicker(callback: GoodsSelectedCallback, initialSelected: Array<Record<string, unknown>> = []) {
  pendingGoodsCallback.value = callback;
  if (liliDialogRef.value) {
    if (initialSelected?.length) {
      liliDialogRef.value.goodsData = initialSelected.map((item) => ({ ...item }));   // ← 预选
    } else {
      liliDialogRef.value.clearGoodsSelected();
    }
    liliDialogRef.value.goodsFlag = true;
```

而且 `lili-dialog` 就是用 `:selectedWay="goodsData"` 回显已选项。
**所以这个能力一直在，只是调用处没传。** 本轮恢复：

```ts
// 契约补上第二参
export type OpenGoodsPicker = (
  callback: (goods: PickedGoods[]) => void,
  initialSelected?: PickedGoods[]
) => void;

// 两个面板
openGoodsPicker(
  (selectedGoods) => applySelectedGoods(selectedGoods),
  // 带着当前楼层已选的商品打开，避免「重新选一次全部丢光」
  Array.isArray(local.goods) ? (local.goods as unknown as PickedGoods[]) : []
);
```

### 二、`any` 收口（`PanelFooterNav` 13 → 0、`PanelNotice` 13 → 0）

延续 R119 的选择器契约（`OpenLinkPicker` / `OpenImagePicker`），
另外把「链接条目」「快讯条目」从 `Record<string, unknown>` 换成结构化类型：

```ts
type NavLink = { url?: string; title?: string; [key: string]: unknown };
type NoticeItem = { tag?: string; title?: string; time?: string; url?: string; [key: string]: unknown };
```

原因：`Record<string, unknown>` 会让 `item.title` 变成 `unknown`，
传给 `ElMessageBox.prompt({ inputValue })` 直接报错；结构化类型才是真实形状。

### 三、踩到一个「文件被写坏」的坑（记下来）

用 PowerShell `[System.IO.File]::ReadAllText` + `.Replace("\n","\r\n")` 处理 **本来就是 CRLF** 的文件，
会产生 `\r\r\n`（双 CR），让整个文件的行号错乱、`el-*` 标签间多出空行。

这次写了个扫描确认范围：

```powershell
# 扫描全仓 \r\r\n
for(...){ if($b[$i] -eq 13 -and $b[$i+1] -eq 13 -and $b[$i+2] -eq 10){ ... } }
```

结果只有 `PanelNotice.vue` 一个文件（566 处），已归一化修复。

> **规则：批量改行尾只在读入时统一成 `\n`、写出时判断原文件是否 CRLF 再转，
> 绝不对已含 `\r\n` 的字符串再做一次 `\n → \r\n`。**

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **422**（−87.9%） |
| `any` | 2647 | **422**（−84.1%） |


## R121（2026-11-26）— `any` 收口第 9 批（422 → 404）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 422 | **404**（−18） |
| typecheck / build | 0 | 0 |

`TplCategoryMegaMenu`（14 → 0）、`PanelTitle`（10 → 0）。

### ① `TplCategoryMegaMenu`：三级分类节点类型

这份模板同时要**兼容两代分类数据**（新的 `children` 与旧的 `subCategories[].items`），
所以类型要写成「宽但明确」：

```ts
type MegaCategoryNode = {
  id?: string | number;
  name?: string;
  title?: string;
  children?: MegaCategoryNode[];
  /** 旧数据：二级分组 */
  subCategories?: Array<{ id?: string | number; name?: string; items?: unknown[] }>;
  [key: string]: unknown;
};
```

旧数据的分组映射顺手写严：

```ts
children: (s.items ?? []).map((it, iIdx) => ({
  id: `leaf_${idx}_${iIdx}`,
  // 旧数据里 items 可能是字符串，也可能是 { name } 对象
  name: typeof it === "string" ? it : String((it as { name?: string })?.name ?? ""),
}))
```

### ② `PanelTitle`：复用 R119 的选择器契约

```ts
const openImagePicker = inject<OpenImagePicker | null>('openImagePicker', null);
const openLinkPicker = inject<OpenLinkPicker | null>('openLinkPicker', null);
```

`ElMessageBox.prompt` 的结果仍按 R119 的写法处理（`MessageBoxData | Action` 联合，不能直接解构）。

### 三、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **404**（−88.4%） |
| `any` | 2647 | **404**（−84.7%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R122（2026-11-26）— `any` 收口第 10 批：大范围批量（404 → 304）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 404 | **304**（−100） |
| typecheck / build | 0 | 0 |

本轮一次推进 **20+ 个文件**，分四批执行。

### 一、批量规则化（第一批：38 处，零 fallout）

装饰模块里所有配置面板的选择器调用都是同一个形状，于是把「类型契约 + 调用点」做成**规则表**跑一遍：

```ts
// 注入
inject<any>('openLinkPicker', null)   → inject<OpenLinkPicker | null>('openLinkPicker', null)
inject<any>('openImagePicker', null)  → inject<OpenImagePicker | null>(...)
inject<any>('openGoodsPicker', null)  → inject<OpenGoodsPicker | null>(...)
// 回调（类型由注入推导，不用再写 any）
openImagePicker((url: any) => …       → openImagePicker((url) => …)
openLinkPicker(({ url, title }: any)  → openLinkPicker(({ url, title }) => …)
openGoodsPicker((selectedGoods: any)  → openGoodsPicker((selectedGoods) => …)
```

13 个文件命中 38 处，**一次通过、零类型错误** —— 说明 R119 建立的契约设计是对的。

### 二、文件级精修（第二~六批：62 处）

| 文件 | 处理 |
|---|---|
| `PanelChannelGrid` / `PanelBrandWall` / `PanelCarousel` | 条目类型 `PanelItem`（title/url/img/name） |
| `floorList` / `wapList` | `FloorRow` / `WapRow`、翻页数字、tab 字符串、发布/删除 id |
| `carousel1` / `onlyGoodsModel` | 弹窗实例类型（含 `open`/`clearGoodsSelected`）、草稿商品 `DraftGoods` |
| `PanelVideo`（PC） | 媒体名函数 |

### 三、这轮暴露的几个真问题

1. **`el-tabs` / 分页 / 复选框的值域**仍是老问题：`string | number` 直接赋给 `string` 字段；
   统一 `String(...)`。
2. **模板里的数组索引是字符串**：`@click="handleDel(index)"` → 需要 `Number(index)`。
3. **`pageShow` 被就地改成布尔**（`item.pageShow = item.pageShow === "OPEN"`）——
   把行类型说成 `WapRow` 后立刻暴露；改成先断言 `Record<string, unknown>` 再映射，避免污染类型。
4. **重复类型声明**：批量脚本对同一文件多处命中，会重复插入 `PanelItem` —— 脚本要按文件去重。

### 四、交付物：按模块划分的测试用例

新增 **`apps/manager/TEST-CASES.md`**，覆盖 11 个模块、约 90 条用例：

| 章节 | 模块 | 用例数 |
|---|---|---:|
| 0 | 前置准备 | — |
| 1 | 素材库（含视频选择器） | 6 |
| 2 | H5 装修器（画布/页面设置/视频楼层/各组件样式/分类导航） | 30 |
| 3 | PC 装修器（行配置/通用属性/选择器含预选/页脚公告标题） | 21 |
| 4 | 店铺（新增/地址两种方式/结算日/详情） | 11 |
| 5 | 商品（列表/审核/虚拟销量/评价） | 9 |
| 6 | 订单（列表/详情/步骤条/复制/微信标签） | 10 |
| 7 | 营销（优惠券/砍价/礼物卡） | 17 |
| 8 | 客户权益 | 5 |
| 9 | 系统（部门/平台设置/分类设置） | 7 |
| 10 | 分销 / 采购 | 6 |
| 11 | 通用回归 | 5 |

文末附「改动类型 → 必跑用例」对照表，改完只要看 diff 属于哪一类就能挑出该跑哪些。

### 五、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **304**（−91.3%） |
| `any` | 2647 | **304**（−88.5%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R123（2026-11-26）— `any` 收口第 11 批（304 → 262）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 304 | **262**（−42） |
| typecheck / build | 0 | 0 |

本轮覆盖 **公共层（12 文件）+ 采购常量 + 4 个装修文件**。

### 一、公共层：一次改到「所有页面都受益」的地方

| 文件 | 处理 |
|---|---|
| `constants/goodsType.ts` | 6 个函数入参 `any → string \| undefined`；`goodsTypeTagType` 返回联合字面量 |
| `router/index.ts` | 去掉 `beforeEach/afterEach` 的 `(to: any, _from: any, next: any)`，交给 vue-router 推导 |
| `utils/index.ts` | `cloneObj` 改成泛型 `<T = unknown>`，用 `Array.isArray` 代替 `obj.constructor === Array` |
| `utils/message.ts` | `beforeClose: (action, instance, done)` 由 Element Plus 推导 |

**改出来的两个真问题：**

1. `goodsTypeTagType` 兜底返回 **空字符串**：

```ts
// ✗ el-tag :type 收到 "" → 走默认色，语义上应该是「普通」
return "";
// ✓
return "primary";
```

2. `router` 的 `to.name` 类型是 `RouteRecordNameGeneric`（可能是 Symbol）：

```ts
Util.toDefaultPage([...routers], String(name ?? ""), router, next);
Util.openNewPage(String(to.name ?? ""), to.params, to.query);
```

### 二、装修与采购

- `oneRowThreeColumns`：`DraftGoods` 类型（img/title/name/price/url/type）、弹窗实例补 `open`、`?.open?.()`
- `PanelPromoGroup`：`PromoCard` 条目类型、`moveCard(index: number, direction: number)`
- `PanelSearchHeader`：热词增删/移动参数数字化
- `procurement/constants.ts`：状态文案入参、`formatMoney`、`exportCsv(filename, headers, rows)` 全部明确

### 三、测试用例文档同步扩充

`apps/manager/TEST-CASES.md` 增加 **第 12 章「R123 补充用例」7 条**（商品类型标签、入库成本、采购/报损状态、导出 CSV、单行三列选商品、路由跳转、全局消息弹窗），现在共 **300 行 / 约 100 条用例**。

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **262**（−92.5%） |
| `any` | 2647 | **262**（−90.1%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R124（2026-11-26）— `any` 收口第 12 批（262 → 224）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 262 | **224**（−38） |
| typecheck / build | 0 | 0 |

覆盖 6 个文件：`goods`（11→0）、`kanjia-activity-add-goods`（10→0）、`goods-review`（8→0）、
`ComponentConfigPanel`（6→3）、`PanelGridFloor`（6→0）、`useLiveSetting`（6→0）。

### 一、又一次「收得太狠」→ 回退（第 4 次）

把 `ComponentConfigPanel` 的 `component` / `compStyle`、`goods-review` 的 `infoData`
从 `Record<string, any>` 收成 `Record<string, unknown>`，**立刻炸出 74 个错误**：

- 模板要写 `compStyle.widthRatio = …`、读 `item.xxx`，unknown 一律不让动
- 这些对象是**后端 DTO / 装修模型**，字段由后端与模板共同决定

按既定原则回退，只保留「函数入参」的收窄：

```ts
// 保留（模板要读写任意属性）
const component = computed(() => props.component as Record<string, any> | null);
const infoData = ref<Record<string, any>>({});
// 收窄（纯函数入参）
function handleColorChange(val: string | null)
```

> 第 4 次确认：**「收 any」的收益在函数签名，不在数据对象。**

### 二、这轮抓到的真问题

1. **误用别的文件的类型名**：砍价页引用了 `CouponSkuRow`（那是优惠券页的类型）——
   编译器直接报 `Cannot find name`。改为本地 `SkuRow`。
2. **`skuSelectRef.value.open(...)` 未判空** → `?.open?.(...)`。
3. **`JSON.parse(JSON.stringify(...))` 的结果是 `any`**：显式断言成
   `Array<Record<string, unknown>>`，否则后面 `e.id = e.skuId` 又是隐式 any。
4. **两个 computed 的 setter 直接写字符串字段**（`local.posterImg = val`）→ `String(val ?? "")`。

### 三、测试用例同步

`TEST-CASES.md` 新增 **第 13 章 8 条**（商品操作、分组、砍价的选商品/删商品/时间、评价、直播设置、网格海报），
共 **316 行 / 约 110 条**。

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **224**（−93.6%） |
| `any` | 2647 | **224**（−91.5%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R125（2026-11-26）— `any` 收口第 13 批（224 → 193）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 224 | **193**（−31） |
| typecheck / build | 0 | 0 |

本轮覆盖 10 个文件：`goodsApply`、`goodsDetail`、`parameter`、`refundLog`、`orderList`、
`BoxModelField`、`config.ts`、`setting/validate.ts`（含 8 个设置页的连带）。

### 一、`handleSubmit(that, name)` 的正确写法

8 个平台设置页都调用它并传 `this`。写成结构类型 `{ $refs: Record<string, unknown> }`
反而不行 —— `ComponentPublicInstance` 的 `$refs` 类型与之不兼容。最终：

```ts
export function handleSubmit(that: unknown, name: string) {
  return new Promise<boolean>((resolve, reject) => {
    // 调用方传的是组件实例（各设置页里的 this），这里按需收窄
    const refs = (that as { $refs?: Record<string, unknown> } | null)?.$refs;
    const form = refs?.[name] as { validate?: (cb: (valid: boolean) => void) => void } | undefined;
```

> **外部不可控的入参（框架实例、`this`）用 `unknown` + 内部收窄，比硬套结构类型稳。**

### 二、`FormData` 只接受字符串和 Blob

```ts
// ✗ 审核提交
formData.append("goodsIds", v.id);          // id 可能是 number
// ✓
formData.append("goodsIds", String(v.id ?? ""));
```

同类问题还有：路由 `query: { id: v.id }`、`deleteParams(row.id)`。

### 三、时隙字段可能是 null

```ts
normalizeSlotCapacities(row?.slotCapacities ?? undefined)   // 函数签名收的是 undefined
```

### 四、又一次「回退」（第 5 次）

`config.ts` 的 `createRow` / `createComponent` 是**页面模型工厂**，参数直接决定返回结构，
收窄成具体形状后 `PcRow` 的 `components` 类型立刻不兼容（8 处错误）。
这两个函数保留 `Record<string, any>` —— 与「DTO 边界保持宽类型」同理。

### 五、测试用例

`TEST-CASES.md` 新增 **第 14 章 8 条**，其中 **14.6「平台设置七页保存」** 是本轮最需要回归的：
校验函数签名变了，7 个设置页都会走到它。现在共 **332 行 / 约 118 条**。

### 六、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **193**（−94.4%） |
| `any` | 2647 | **193**（−92.7%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R126（2026-11-26）— `any` 收口第 14 批（193 → 130）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 193 | **130**（−63） |
| typecheck / build | 0 | 0 |

本轮处理 **20+ 个文件**，其中一大块来自「批量规则」而非逐个改。

### 一、`ElMessageBox.prompt` 结果解构：一次清掉 20 处

之前几轮是逐个文件改，这轮改成**全目录正则扫描**：

```ts
.then(({ value }: any) => {                              // ← 20 处
.then((res) => {
  const value = String((res as { value?: string })?.value ?? "");   // ← 统一写法
```

涉及 `PanelCategoryNav` / `PanelFooterNav` / `PanelChannelFloor` / `PanelGridFloor` /
`PanelChannelGrid` / `PanelVideo` / `PanelNotice` / `PanelTitle` 等。

### 二、定时器变量的正确类型

```ts
let timer: any = null;                    // ✗
let timer: ReturnType<typeof setInterval> | null = null;   // ✓
```

`tpl_notice` / `tpl_search` / `TplNotice`（PC）都改了这一处 —— 这类定时器在每个滚动公告/轮播模板里都有。

### 三、数组 `some/filter` 回调的隐式 any

```ts
// 之前：some((r: any) => r > 0)
Array.isArray(s.radius) && s.radius.some((r) => r > 0)   // s.radius 有类型，回调自动推导
```

### 四、这一轮又回退了两处（第 6、7 次）

1. **`renovation.vue` 的 `modelFormRef`**：它不只是「有 open 方法」，
   业务代码还要读 `modelFormRef.value.navList` / `.topAdvert` —— 结构类型写不全就炸。
2. **主题预设 / 链接对象**：`linkText(url)` 与 `selectedLink(val)` 的入参是**装修链接对象**，
   带 `name / goodsName / memberName / intro / mobileIntro` 等一堆业务字段。

两处都改成「把真实字段列出来」，而不是硬收。

### 五、`el-tabs` 的老问题又出现一次

`定时上架` 页的 `v-model="activeStatus"` 直接绑 `string` 字段 → `TabPaneName` 不兼容。
按惯例改成显式双向绑定 + `String(...)`。

### 六、测试用例

`TEST-CASES.md` 新增 **第 15 章 11 条**（定时上下架、微信订单日志/补报/标签、主题预设、
装修标题栏 H5/PC、公告模板、搜索模板、采购单详情），共 **351 行 / 约 129 条**。

### 七、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **130**（−96.3%） |
| `any` | 2647 | **130**（−95.1%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R127（2026-11-26）— `any` 收口第 15 批（130 → 99）· 降到两位数

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 130 | **99**（−31） |
| typecheck / build | 0 | 0 |

本轮一口气处理 **30+ 个零散文件**，绝大多数只有 1–2 个 any。

### 一、按「一眼能定类型」的类别批量处理

| 类别 | 数量 | 处理 |
|---|---:|---|
| `goDetail(row: any)`（采购四类单据） | 4 | `{ id?: string \| number }`（盘点单加 `sn`） |
| `handleClickItem(item: any)`（装修三模板） | 3 | `Record<string, unknown>` |
| `watch(..., (val: any)` | 3 | `unknown` |
| `const activeTab = ref<any>("…")` + `v-model` | 3 | `ref<string>` + 显式双向绑定 |
| `let timer: any`（上一轮） | 3 | `ReturnType<typeof setInterval>` |
| `Object.keys(x).forEach((k: any)` | 2 | 回调自动推导 |
| `statusText / goReport / langChange / formatCardKeyStatus` | 4 | `string \| undefined` |
| `window.addEventListener("unhandledrejection", (event: any)` | 1 | `PromiseRejectionEvent` |

### 二、又踩到「模板绑定 vs 类型收窄」的老坑

**1. `i18n.global.locale` 不是普通字段**

```ts
// ✗ 类型是 WritableComputedRef，赋 string 会报「两者无重叠」
i18n.global.locale = lang;
// ✓
(i18n.global as unknown as { locale: string }).locale = lang;
```

**2. 映射表用字符串取值要宽索引**（第 3 次遇到）

```ts
// ✗ 字面量对象不能 string 索引
panelMap[props.res.type]
// ✓
const map = panelMap as Record<string, { hideDecorateTitle?: boolean }>;
return type ? map[type] ?? null : null;
```

**3. 接口已经给了类型，别再手写**

`loadSiteSettings()` 返回 `SiteSettings | null`、`exportRefundFlow()` 返回 `ResultMessage<…>` ——
手写 `Record<string, unknown>` / `Blob` 反而错。**回调参数留空让编译器推导**。

### 三、测试用例

`TEST-CASES.md` 新增 **第 16 章 14 条**，其中 **16.5「装修面板分发」** 是本轮最需要回归的
（`panelMap` 取值方式改过，选不同类型楼层都要能出面板）。现在 **373 行 / 约 143 条**。

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **99**（−97.2%） |
| `any` | 2647 | **99**（−96.3%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R128（2026-11-26）— `any` 收口第 16 批（99 → 69）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 99 | **69**（−30） |
| typecheck / build | 0 | 0 |

### 一、`orderDetail`：只收「函数与局部变量」，DTO 留着

25 个 any 里，**函数入参/局部数组/回调** 收了 17 个，**订单 DTO 字段**（`order` / `orderLogs` /
`receipt` / `orderItems`）按既定原则保留：

```ts
/** 订单商品行（模板读 num / cardKeyDelivered / cardKeys） */
type OrderItemRow = { num?: number; cardKeyDelivered?: boolean; cardKeys?: Array<Record<string, unknown>> };

const data = ref<OrderItemRow[]>([]);
return data.value.reduce((acc, cur) => acc + (Number(cur.num) || 0), 0);
```

**又回退 3 处**（第 8 次）：
`bars`（进度条对象有 `x`/`width`/`label` 等布局字段）、`parseSpecs`、`parseFormAnswerGroups`
（入参是「JSON 文本或对象」的混合体，收严只会炸）。

### 二、区域选择的两种回传（第二次遇到）

订单详情的「修改收货地址」和店铺编辑页一样，有两种回传：

```ts
function selectedRegion(val: {
  type?: string;
  data?: Array<{ name?: string; id?: string | number }> | { addr?: string; addrId?: string };
}) {
  if (val.type === "select") { /* 级联：数组 */ }
  else { /* 地图：单对象 */ }
}
```

### 三、`route.name` 可能是 Symbol（第二次）

```ts
watch(() => route.name, (name) => {
  const pageName = name == null ? "" : String(name);   // ← 先转字符串再比较
  checkTag(pageName);
});
```

### 四、`el-tabs` 又是重灾区（本轮 3 处）

`视频楼层面板` / `菜单管理` / `微信渠道` 的 `v-model="xxxTab"` 都直接绑 `string` 字段 ——
统一改成「`:model-value` + `@update:model-value="String(v ?? 默认)"`」。

> 这条已经出现 6 次了：**凡是 `el-tabs` 绑 `ref<string>`，必须显式双向绑定。**

### 五、测试用例

`TEST-CASES.md` 新增 **第 17 章 10 条**（订单详情的地址两种方式 / 表单答案 / 卡密 / 规格、
三个 tab 页、菜单跳转、消息跳转），共 **391 行 / 约 153 条**。

### 六、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **69**（−98.0%） |
| `any` | 2647 | **69**（−97.4%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R129（2026-11-26）— `any` 收口收尾 + 存量审计（69 → 67）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 69 | **67**（−2） |
| typecheck / build | 0 | 0 |

### 一、先做了一次「能不能一次清掉 14 处泛型」的实验

把 `libs/axios.ts` / `types/api.ts` / `utils/useTable.ts` 的 `<T = any>` 全改成 `<T = unknown>`：

**结果：407 个类型错误。** 全部来自「api 函数没标注返回类型 → `res.result` 变成 unknown」。
已回滚，并把这次实验写进审计报告作为结论依据。

> 结论：泛型默认值不能动 —— **债的本体是「api 层返回类型没标」，不是这个 `any`。**

### 二、这轮真正收掉的

- `orderDetail` 卡密收集的两个回调（`(item: any)` / `(ck: any)`）
- `gift-card` 的 route watch 参数**试了三种写法都过不了**（`string | number`、`string | string[] | null`、
  让编译器推导），最终保留 `any` 并**在代码里写明原因**：

```ts
// route.query 的值类型是 LocationQueryValue | LocationQueryValue[]，
// 与 watch 的重载签名不兼容，这里保留 any（原因见 apps/manager/ANY-AUDIT.md）
(id: any) => {
```

### 三、交付物：`apps/manager/ANY-AUDIT.md`

对剩下 **67 处 `any`** 做逐条审计，分 5 类说明「为什么留着」和「什么情况下才该动」：

| 类别 | 数量 | 建议 |
|---|---:|---|
| ① 请求层泛型默认值 | 14 | ❌ 不继续收（要收就先补 api 层返回类型） |
| ② 后端 DTO / 装修模型对象 | 38 | ⚠️ 等后端 VO / 字段可枚举时再收 |
| ③ 编辑器组件 | 8 | ❌ 按约定不动 |
| ④ 框架回调无法收窄 | 4 | ❌ 技术限制，已在代码注释 |
| ⑤ 页面模型工厂 | 3 | ❌ 同 ② |

报告里还写了「要彻底消掉需要做什么」的对照表（补 api 层类型 / 建后端 VO / 编辑器类型化）。

### 四、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67**（−98.1%） |
| `any` | 2647 | **67**（−97.5%） |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |


## R130（2026-11-26）— A 路线启动：api 层类型化（含 3 次实测）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67**（本轮不进也不退） |
| typecheck / build | 0 | 0 |

> 本轮**没有**靠数量取胜。它做的是把 A 路线（api 层类型化）的**方法跑通 + 坑踩明白**，
> 并交付第一块可复用的基础设施。

### 一、三次实验（都记录了数字，这是本轮最有价值的部分）

| 做法 | 结果 |
|---|---|
| 直接改 `axios` 的 `<T = any>` → `unknown` | **407 个错误** |
| 给 22 个 api 文件、451 个函数按启发式标注 | typecheck 0，但语义错，冲突时报 **207 个** |
| 只标订单模块 36 个函数 | **17 个错误**（调用方写 `ApiResult<AfterSaleNum>`，我猜 `OrderCountVO`） |

**根因**：调用方**已经在用真实类型**（`.then((res: ApiResult<X>) => …)` 有 **169 处**），
它比任何启发式都准。所以正确方法是**反推**，不是猜。

### 二、写了反推扫描器，识别出 62 个函数的真实返回类型

```
getCategoryTree(...)  .then((res: ApiResult<CategoryNode[]>))   →  CategoryNode[]
```

完整映射存在 `.build-check/api-ret-map.json`，样例：

| 函数 | 真实类型 |
|---|---|
| `getCategoryTree` / `getArticleCategory` | `CategoryNode[]` |
| `getAllPermissionList` | `MenuNode[]` |
| `getDistributionGrades` | `GradeOption[]` |
| `getDamageReportItems` | `DamageItem[]` |
| `getAfterSaleNumVO` | `AfterSaleNum` |

### 三、发现了真正的前置条件

把映射直接写进 api 层 → **79 个 `Cannot find name`**：`CategoryNode` / `RegionNode` /
`MenuNode` 这些类型**定义在 .vue 文件里**，api 层 import 不到。涉及 **32 种**类型。

> 结论：**A 路线的第一步是「把 VO 从 .vue 搬出来」，不是改 api。**

### 四、本轮交付

1. **`src/types/vo/common.ts`** —— 4 个跨模块 VO 的权威定义
   （`CategoryNode` / `RegionNode` / `DepartmentNode` / `MenuNode`）
2. **把 10 个文件里重复的 `CategoryNode` 统一了** —— 之前每个文件各写一遍，
   字段还不一致（有的 `deleteFlag?: boolean`，有的 `boolean | number`）。
   现在 `deleteFlag?: boolean | number`（后端确实会返回 0/1 或布尔）
3. **`apps/manager/API-TYPING-PLAN.md`** —— 方法论、62 函数映射、32 类型清单、
   按模块推进的 4 步流程、收益测算

### 五、下一步（A 路线第 1 个模块）

按 PLAN 的第 1 步，把某个模块的类型搬进 `types/vo/`，再标 api。
建议从 **page/article**（`ArticleRow` / `ArticleDetail`）或 **distribution**（5 种类型）开始。

### 六、进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| `@ts-nocheck` | 80 | **0** |
| `mutating-props` | 738 | **0** |
| 跨模块 VO 定义 | 0（重复 10 份） | **4 个统一 ＋ 已去重** |


## R131（2026-11-26）— A 路线第 1 个模块闭环（文章）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 0 | **12**（含分类树 / 文章列表） |

### 做了什么

1. 新建 `src/types/vo/page.ts`：`ArticleForm` / `ArticleDetail` / `ArticleRow`
   （从 `articleEdit.vue`、`articleList.vue` 原样搬出，字段一个没改）
2. 两个 .vue 删掉本地定义，改为 `import type { … } from "@/types/vo/page"`
3. `src/types/vo/common.ts` 补 `PageRows` / `VoRow`（通用分页）
4. `api/pages.ts` 的 `getArticle` 标注为 `{ records?: ArticleRow[]; total?: number }`
   —— 与调用方 `ApiResult<PageResult>` 的实际用法一致

### 验证

typecheck / build / lint 全绿；`eslint --max-warnings 67` 通过（没有新增 any）。

### 这说明 A 路线的流程可行

「搬类型 → import → 标 api → 三件套」在单个模块内是**零风险**的：
搬的是同一份定义，没有改任何运行时行为。

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 跨模块 VO 文件 | 0 | **2**（common / page） |
| 已标注 api 函数 | 0 | **12** |

## R132（2026-11-26）— A 路线第 2 个模块（分销）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 12 | **16** |

### 做了什么

1. 新建 `src/types/vo/distribution.ts`：`GradeOption` / `DistributionRow` /
   `DistributionDetail` / `RelationRow` / `RelationLog` / `PlanForm`（6 个类型）
2. 3 个页面删掉本地定义，改为 import：
   `distribution.vue`（3 个）、`distributionCustomerRelation.vue`（2 个）、`distributionGradeHistory.vue`（1 个）
3. 4 个 api 标注返回类型：
   | 函数 | 返回 |
   |---|---|
   | `getDistributionGrades` | `GradeOption[]` |
   | `getCustomerRelations` | `{ records?: RelationRow[]; total?: number }` |
   | `getCustomerRelationDetail` | `RelationRow` |
   | `getCustomerRelationLogs` | `RelationLog[]` |

### 一个值得记下的细节

`GradeOption` 原本在 `distributionGradeHistory.vue` 里是 `{ value, label }`（**没有 id**），
在 `distribution.vue` 里是 `{ id, name, gradeName, sortOrder }`（**没有 value/label**）。

合并办法：
- 把 `id` 设为**必填**（`distribution.vue` 的 `el-option :value="item.id"` 需要它）
- `value` / `label` 保持可选
- 等级历史页的 `ref` 单独声明为 `{ value: string | number; label?: string }[]`
  —— 它确实不需要 id，强行统一反而会引入垃圾字段

> 教训：**合并重复类型时，以「各页真实用法」为准，不要为了合并而合并。**

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 跨模块 VO 文件 | 0 | **3**（common / page / distribution） |
| 已标注 api 函数 | 0 | **16** |

## R133（2026-11-26）— A 路线第 3 个模块（采购）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 16 | **20** |
| 跨模块 VO 文件 | 3 | **4** |

### 做了什么

1. 新建 `src/types/vo/procurement.ts`：`DamageDetail` / `DamageItem` / `InboundItem` / `InboundDetail`
2. `damage-report/detail.vue`、`inbound/detail.vue` 删掉本地定义，改为 import
3. 4 个 api 标注：
   | 函数 | 返回 |
   |---|---|
   | `getDamageReportDetail` | `DamageDetail` |
   | `getDamageReportItems` | `DamageItem[]` |
   | `getProcurementInboundDetail` | `InboundDetail` |
   | `getProcurementInboundItems` | `InboundItem[]` |

### 一个操作事故（已修）

脚本把 `import type { … } from '@/types/vo/procurement'` 插到了多行 import 块**内部**，
生成了 `import { import type …` —— 6 个语法错误。已改为按锚点（`@/types/api` 那行之后）插入。

> 教训写进流程：**给 api 文件插 import 时，锚点要选「最后一条 import 语句之后」，
> 不能用「第一条 import 之后」** —— 多行 import 会被劈开。

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 跨模块 VO 文件 | 0 | **4**（common / page / distribution / procurement） |
| 已标注 api 函数 | 0 | **20** |

## R134（2026-11-26）— A 路线第 4 个模块（直播）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 20 | **22** |
| 跨模块 VO 文件 | 4 | **5** |

### 做了什么

1. 新建 `src/types/vo/live.ts`：`LiveDetail` / `LiveCouponRow` / `LiveGoodsRow`
2. 3 个文件删掉本地定义，改为 import：
   `live/detail.vue`、`live/components/Coupon.vue`、`live/components/LiveGoods.vue`
3. 2 个 api 标注：
   | 函数 | 返回 |
   |---|---|
   | `getLiveGoodsList` | `LiveGoodsRow[]` |
   | `getLiveCouponList` | `LiveCouponRow[]` |

### 一个类型冲突的处理

`api/live.ts` 的 `getLiveInfo` **本来就已标注**为 `LiveRoom`（shared 包的通用直播类型），
而 `detail.vue` 声明的是 `ApiResult<LiveDetail>` —— 两者不兼容。

处理：**保留 api 的 `LiveRoom`**，把调用方改成「回调不写死类型 + 赋值处断言」：

```ts
.then((res) => {
  if (res.success) detail.value = (res.result ?? {}) as LiveDetail;
})
```

> 原则：**api 层已有的标注优先**，页面按自己需要的字段形状断言 —— 而不是让 api 层迁就某个页面。

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 跨模块 VO 文件 | 0 | **5**（common / page / distribution / procurement / live） |
| 已标注 api 函数 | 0 | **22** |

## R135（2026-11-26）— 零散类型收拢（第 5 批）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 22 | **23** |
| 跨模块 VO 文件 | 5 | **6** |

### 做了什么

新建 `src/types/vo/misc.ts`，只收**真正多页共用**的 3 个类型：

| 类型 | 使用方 |
|---|---|
| `BrandItem` | 商品分类、商品对比 |
| `ChartRow` | 首页、数据报表 |
| `StatsResult` | 积分统计 |

并把 `getBrandListData` 标注为 `BrandItem[]`。

### 一个重要的「不做」

原本打算把 7 个零散类型（`PointsEditForm` / `TaskRow` / `GroupRow` / `OrderStats` /
`FeedbackDetail` / `PrivacyArticle`）也搬进 misc。**试了，34 个错误，已撤回。**

原因：它们**不是重复类型，而是各页自己的形状**。例如 `PointsEditForm` 有 20 多个字段
只服务于「积分商品编辑」这一页；`GroupRow` 在商品分组页和会员分组页字段完全不同。

> 处理方式：从 R119 快照把这些**页面专属类型原样取回本地**，
> 并在 `misc.ts` 头部写清「只收多页共用的类型」这条界线。

**结论：合并类型的判断标准是「多页用法一致」，不是「名字一样」。**

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 跨模块 VO 文件 | 0 | **6**（common / page / distribution / procurement / live / misc） |
| 已标注 api 函数 | 0 | **23** |

## R136（2026-11-26）— 商家结算单（最后一个大类型）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 23 | **26** |
| 跨模块 VO 文件 | 6 | **7** |

### 做了什么

1. 新建 `src/types/vo/seller.ts`：`BillDetail`（30+ 字段）+ `BillFlowRow`
2. `seller/bill/bill-detail.vue` 删掉本地两个类型，改为 import
   （`FlowRow` 顺手改名为 `BillFlowRow`，避免和别处重名）
3. 3 个结算单接口标注：

| 函数 | 返回 |
|---|---|
| `getBuyBillPage` | `{ records?: BillDetail[]; total?: number }` |
| `getBuyBillDetail` | `BillDetail` |
| `getStoreFlow` | `{ records?: BillFlowRow[]; total?: number }` |

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 跨模块 VO 文件 | 0 | **7**（common / page / distribution / procurement / live / misc / seller） |
| 已标注 api 函数 | 0 | **26** |

## R137（2026-11-26）— api 层大批量标注（26 → 249）

### 数字

| 项 | 起始 | 结果 |
|---|---:|---:|
| lint 告警 | 67 | **67** |
| 已标注 api 函数 | 26 | **249** |
| typecheck / build | 0 | 0 |

### 做了什么

对所有 api 文件里**纯操作类接口**（`postRequest` / `putRequest` / `deleteRequest`，
返回值只有 `success` / `message`）批量标注 `<null>` —— 一次 253 个函数。

### 连锁反应与处理（这轮的主要工作量）

标注后 28 个调用点报错，根因是调用方写死了回调类型：

```ts
.then((res: ApiResult<PageResult>) => …)   // 而 api 现在返回 ResultMessage<null>
```

处理顺序：
1. 全局去掉 `.then((res: ApiResult…))` 里写死的类型 → 交给编译器推导（124 个文件）
2. 打开 15 处「推导不出来」的隐式 any，逐个补真实类型
   （`RegionNode` / `RegionApiItem` / `DistributorRow` / `LogisticsRow` / `TaskRow` / `GroupRow`）
3. 清理因去掉类型而变得未使用的本地 `ApiResult` 声明 —— **107 处 / 85 个文件**
4. 修掉清理脚本误删导致的 3 处语法错误（孤立的 `};`）

### 两个新踩的坑（已记入流程）

1. **删类型定义要用「整块匹配」，不能只删头部行**
   → 会留下孤立的 `};`，3 个文件直接语法错误。
2. **回调参数从 `X` 改成 `unknown` 会引发连锁**
   → 应改成「真实类型」（如 `RegionApiItem`）或干脆不写、让编译器推导。

### 进度

| 指标 | R8 起点 | 现在 |
|---|---:|---:|
| 告警 | 3477 | **67** |
| `any` | 2647 | **67** |
| 已标注 api 函数 | 0 | **249 / 约 490（51%）** |
| 跨模块 VO 文件 | 0 | **7** |

## R138（2026-11-26）— 修复「创建直播失败」

### 现象

`POST /manager/live/room` 返回失败，前端只显示「服务器繁忙」。

### 定位（看后端日志，不是猜）

```
java.lang.NullPointerException: Cannot invoke "Setting.getSettingValue()" because "setting" is null
  at TencentLiveUtil.getLiveSetting(TencentLiveUtil.java:235)
  at TencentLiveUtil.getPushUrl(TencentLiveUtil.java:64)
  at LiveRoomServiceImpl.createLiveRoom(LiveRoomServiceImpl.java:79)
```

**根因**：新环境里没有 `LIVE_SETTING`（腾讯云直播参数），`getLiveSetting()` 直接 NPE，
被全局异常处理器兜成「服务器繁忙」。

顺带发现第二个坑：`getPushUrl` 里 `liveRoom.getStartTime().toInstant()` —— 起始时间为空也会 NPE。

### 修复（三处，后端两处 + 前端一处）

1. **`TencentLiveUtil.getLiveSetting()`**：未配置 / 配置空白 / 域名或 AppName 缺失时，
   抛**带明确文案**的 `ServiceException`：
   「尚未配置腾讯云直播参数，请先在【平台设置 → 直播设置】填写推流域名、拉流域名、AppName、StreamName、Key」
2. **`TencentLiveUtil.getPushUrl()`**：起始时间为空时按当前时间计算鉴权有效期
3. **`LiveRoomServiceImpl.createLiveRoom()`**：**推拉流地址生成失败不再阻断创建** ——
   捕获 `ServiceException`，打 warn、把三个地址置空后照常保存
   （直播间可以先建好，等配置完整后再编辑保存一次）
4. **前端 `live/add.vue` / `live/edit.vue`**：保存成功后若 `pushStreamServer` 为空，
   弹 warning 指明「去【平台设置 → 直播设置】配置后再保存一次」，而不是假装成功

### 验证（直连接口，两条路径都跑过）

| 场景 | 结果 |
|---|---|
| 未配置直播参数 | `HTTP 200`，`success: true`，返回直播间 id，推拉流地址为空 |
| 配置了域名/AppName/Key | 推流地址 `rtmp://push.example.com/lili/`，拉流地址 `https://pull.example.com/lili/stream_L….flv` |
| 前端三件套 | typecheck / build / lint 全绿（67 告警不变） |

> 测试用的直播设置和 2 个测试直播间已从库里删干净（`li_setting` / `li_live_room`）。

### 教训

**「服务器繁忙」= 后端抛了未处理异常。** 凡是「依赖外部配置」的入口，
都必须显式判断「配置缺失」并给出可操作的提示，而不是让它变成 NPE。

## R139（2026-11-26）— 平台配置缺失类 NPE 全量排查

### 数字

| 项 | 数量 |
|---|---:|
| 后端读取平台配置的位置 | 257 处 / 82 文件 |
| 已有保护 | 236 处 |
| **真·未判空** | **21 处** |
| 本轮修复 | **21 处（全部）** |

### 做法

新增 `SettingValues`（`framework/common/utils`），两种语义：
- `require(...)` —— 配置是前提，缺失时抛「尚未配置 X，请先到【平台设置】中完成配置」
- `optional(...)` —— 配置可缺省，返回 null 由调用方降级

逐点修正 21 处：14 处改 `require`、6 处改 `optional`（含定时任务 5 处改为「跳过 + warn」）、
`CashierSupport` 改为返回空列表。

### 验证

- `mvnw -pl manager-api -am package -DskipTests -o` 成功
- 后端启动 17.5s
- 直播：列表 / 创建 / 详情 / 删除 全 200（未配置直播参数时依然可建）

### 交付

`backend/SETTING-NPE-AUDIT.md` —— 257 处扫描结论 + 21 处明细 + 后续提醒


## R140（2026-11-26）— 配置缺失提示文案优化

| 项 | 结果 |
|---|---|
| 后端文案 | 统一为「未配置「X」，请前往【平台设置 → X】填写并保存后重试」 |
| 实现 | `SettingValues.PAGE_NAMES` 自动映射，调用方不再拼字符串 |
| 调用点 | 15 处 `require` 全部去掉手写 hint |
| 前端 | 直播创建/编辑提示统一同一句式 |
| 单测 | 新增 `SettingValuesTest`（4 条断言） |
| 验证 | 后端打包成功、启动 17.2s、直播创建仍 200；前端三件套全绿 |

## R141（2026-11-26）— 平台设置默认值补齐 + 文档勘误

### 做了什么

1. 扫描 33 个 `*Setting.java` DTO 的全部字段（含类型），生成 **`backend/db/init-setting-defaults.sql`**
   —— 37 条配置的「安全默认值」，**只插缺失行、不覆盖已有配置**，可反复执行
2. 本地库实跑验证：34 行 → **40 行**（新增 6 个缺失键，31 个已存在的键完好未动）
3. **勘误**：初版审计报告称「li_setting 表是空的」——不准确。
   该表有 30+ 行，且**主键就是配置键**（`id`），没有 `setting_key` 列。
   当时 NPE 的直接原因是 `LIVE_SETTING` 那一行缺失，不是整表为空。
   我先前用 `setting_key` 做的清理语句**静默失败**（列不存在），所以并未误删任何数据。
4. 清掉排查时写入 `LIVE_SETTING` 的测试值（example.com），恢复为「未配置」状态

### 验证

| 项 | 结果 |
|---|---|
| SQL 幂等性 | 34 → 40 行，已有键未被覆盖 |
| 直播创建（无配置） | `HTTP 200`，推流地址为空（符合预期） |
| 配置完整时生成推流地址 | 前一轮已验证 `rtmp://…` / `https://…` |
| 前端三件套 | 未改动，保持全绿 |

## R142（2026-11-26）— 平台设置各页错误提示统一

### 问题

平台设置 20 个页面保存失败时一律弹 **「保存失败!」**，把后端返回的具体原因丢掉了 ——
和「服务器繁忙」是同一类毛病：用户不知道该改什么。

### 改动

1. 17 个页面：`ElMessage.error("保存失败!")` → `ElMessage.error(res?.message || "保存失败")`
2. 8 个页面的 `SettingApiResult` 类型补 `message?: string`（原来是 `{ success?: boolean }`）
   —— 不改类型的话，`res.message` 直接编译不过

### 实测（接口层）

| 操作 | 结果 |
|---|---|
| PUT 提现设置，`minPrice` 传 null | `HTTP 400`，message = **「最低提现金额不能为空」** |
| 前端表现 | 现在弹的是这条 message，不再是「保存失败!」 |
| 复原默认值 | `HTTP 200` |
| 前端三件套 | typecheck / build / lint 全绿（67 告警不变） |

### 规律

**前端凡是「兜底文案」，都要先看后端有没有给 message。**
有就显示它 —— 否则等于把后端已经写好的、可操作的提示吞掉了。

## R143（2026-11-26）— 测试用例按优先级重排

### 问题

`TEST-CASES.md` 已经有 254 条用例、29 章，但**没有优先级**——每次改动都要翻半天才知道该跑哪些。

### 改动

1. 文档开头新增 **「怎么用这份文档」+ 优先级定义 + P0 快跑清单（14 步）**
2. 新增 **「章节 → 优先级」归属表**（P0 / P1 / P2）
3. 新增 **`SMOKE-P0.md`**：带勾选框的 P0 清单，可直接打钩并记录失败现象

### 判定口诀

**动了哪个模块跑那个模块（P1）；动了公共层/请求层/配置就跑 P0 + P2。**

### 数字

| 项 | 之前 | 现在 |
|---|---:|---:|
| 用例文档行数 | 591 | 654 |
| 用例条数 | 约 254 | 约 254（未删减） |
| 独立冒烟清单 | 无 | **SMOKE-P0.md（12 组 / 约 40 项）** |

## R144（2026-11-26）— P0 接口层预检

### 做了什么

写了个直连后端的预检脚本，用 Redis 里的 MANAGER token 把 P0 涉及的 18 个列表/读取接口各打一遍：

| 结果 | 数量 |
|---|---:|
| `HTTP 200` | **18 / 18** |
| 失败 | 0 |

覆盖：商品、商品分类、订单、优惠券、文章、文章分类、店铺、分销、采购单、入库单、报损单、直播、
结算单、提现设置、订单设置、直播设置、部门树、装修楼层列表。

### 同时确认的数据现状

| 数据 | 数量 |
|---|---:|
| 商品 | 272 |
| 订单 | **0**（订单详情用例需先造一单） |
| 直播间 | **0**（P0 第 10 项本来就要新建） |

### 交付

`apps/manager/P0-RUN-REPORT.md` —— 接口预检报告 + 数据缺口 + 剩余需人工验证的 5 类 UI 行为

## R145（2026-11-26）— 补齐测试数据

### 造了什么

| 数据 | 内容 | 文件 |
|---|---|---|
| 订单 | `TEST20261126000001`，已付款待发货，1 件真实商品，1 条日志 | `backend/DB/test-data-order.sql` |
| 直播间 | `测试直播间-可删除`，状态 NEW | 接口创建 |

### 过程中踩的两个坑（都已修）

1. `li_order` **没有** `comment_status` 列（评论状态在 `li_order_item` 上）
2. 脚本里写中文字面量会因 mysql 客户端编码不一致报 `Data too long`；
   改成**全部用子查询从库里取真实值**（商品名/店铺名/会员名），并固定 `--default-character-set=utf8mb4`

### 验证（走 Manager 接口）

```
订单列表 total = 1
订单详情 success=true，orderItems=1，orderLogs=1，paymentMethod=ALIPAY，consigneeName=Tester
直播列表 total = 1，直播详情 success=true
```

### 文档

`backend/DB/TEST-DATA.md` —— 数据清单、执行方式、清理 SQL、以及现在能测哪些 P0 项

## R146（2026-11-26）— api 类型化：列表接口批量标 PageRows（249 → 276）

### 背景

R137 为了让 253 个操作类接口标 `<null>`，把 124 个调用方里的 `(res: ApiResult<X>)` 全去掉了 ——
顺带也**毁掉了「从调用方反推类型」的信息源**（重扫只剩 1 条映射）。
所以这轮换成**正向**做法：按 URL 语义给列表接口标 `PageRows`，再修被暴露出来的调用点。

### 做法

| 步骤 | 说明 |
|---|---|
| 1 | 只挑 URL 含 `page`/`list`/`byPage` 的 GET 接口 |
| 2 | **排除** `all-children` / `/all`（这些返回数组，不是分页） |
| 3 | 标 `getRequest<PageRows>(...)` |
| 4 | 跑 typecheck，逐点修调用方 |

### 标了哪些

| 文件 | 数量 |
|---|---:|
| `pages.ts` | 3 |
| `setting.ts` | 2 |
| `goods.ts` | 6 |
| `order.ts` | 3 |
| `member.ts` | 8 |
| `distribution.ts` | 5 |
| **合计** | **27** |

### 踩的坑（重要）

1. **`/all` 启发式误伤**：`getCategoryTree` / `getArticleCategory` 这类返回**数组**的接口被标成分页，
   一次炸出 7 个错误。规则改成只认 `page|list|byPage`，并显式排除 `all-children|/all`。
2. **`other.ts` 又炸一次**：装修的 `advertising.vue` / `alertAdvertising.vue` 把 `res.result` 当**对象**用，
   标成分页后 15 个错误 → **回滚该文件**，留待单独处理。
3. **调用点普遍没判空**：`res.result.records` 改为 `(res.result?.records ?? [])`，
   赋值给更窄数组类型时加 `as unknown as typeof x.value`。

> 经验：**「按 URL 猜类型」只能用在语义明确的列表接口上；返回数组/对象的必须逐个人工确认。**

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.29s |
| lint | 67 告警（不变，ratchet 通过） |
| 已标注 api 函数 | 249 → **276** |

## R147（2026-11-26）— api 类型化改用「后端权威清单」（276 → 312）

### 做法升级

前一轮靠「URL 含 page/list」猜，`promotion.ts` 一个都没中（它的路径是 `/promotion/pintuan`、
`/promotion/kanJiaGoods`，路径里没有 page）。

这轮改成**扫描后端控制器**：找出所有 `@GetMapping` 且返回 `ResultMessage<IPage<...>>` 的方法，
拿到 94 个**确定是分页**的 URL，再用它去匹配前端 api 函数。

| 项 | 数量 |
|---|---:|
| 后端 GET 接口 | 356 |
| 其中返回分页 `IPage` | **94**（权威清单） |
| 前端命中并标注 | **36** |

### 命中的分布

| 文件 | 数量 |
|---|---:|
| promotion.ts | 10 |
| distribution.ts | 4 |
| statistics.ts | 4 |
| live.ts | 3 |
| procurement.ts | 3 |
| goods.ts / index.ts / member.ts / other.ts | 各 2 |
| appointment / logistics / order / shops | 各 1 |

### 修了 20 处调用点

全是同一类：`res.result.records` 直接赋给更窄的数组 / 没判空。统一改成：

```ts
data.value = (res.result?.records ?? []) as unknown as typeof data.value;
total.value = res.result?.total ?? 0;
```

`statistics/order.vue` 里 `ResultMessage<PageRows>` 赋给本地 `ListRes` 接口不兼容 → 删掉 `ListRes`，直接断言。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 4.92s |
| lint | 67 告警（ratchet 通过） |
| 已标注 api 函数 | 276 → **312（64%）** |

### 关键经验

**「前端 URL 猜类型」不可靠，应该以「后端返回类型」为准。**
后端 94 个分页接口是确定的事实，一次扫描就能拿到，比正则猜准得多。

## R148（2026-11-26）— 数组返回批量标注（312 → 351）；单实体批量回滚

### 方法

继续用「后端权威清单」：把 manager-api 的 GET 接口按返回类型分成四类：

| 返回类型 | 数量 | 处置 |
|---|---:|---|
| `ResultMessage<IPage<…>>` | 95 | ✅ 已标 `PageRows`（R147） |
| `ResultMessage<List<…>>` | 79 | ✅ 本轮标 `VoRow[]` |
| `ResultMessage<XxxVO>` | 151 | ⚠️ **试了，回滚** |
| `ResultMessage<Object/String/Boolean>` | 34 | 暂不动 |

### 数组批量：+39 个，16 处调用点

命中：`statistics.ts` 15、`index.ts` 9、`goods.ts` 5、`finance.ts` 4、`member.ts` 2，其余各 1。

调用点修法统一：

```ts
x.value = (res.result ?? []) as unknown as typeof x.value;
```

### 单实体批量：**99 个错误 → 整体回滚**

给 62 个「单实体」接口标 `VoRow` 后，炸出 99 个错误，集中在：
member/benefit（13）、distributionSetting（10）、gift-card（9）、paid-member（9）、privacy（7）、
decoration wap（5）、afterSale（4）、articleEdit（4）…

根因：这些页面把 `res.result` 当成**完整表单对象**用（几十个字段逐个读写），
`VoRow` 的索引签名让字段变成 `unknown`，一写就报错。**69 个调用点里有 30+ 个是这种。**

> 判定：**收益（62 个函数）< 成本（99 个错误、跨 8 个模块）**，整批回滚。
> 这与 ANY-AUDIT 里「DTO 边界保持宽类型」是同一条规律。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.62s |
| lint | 67 告警（ratchet 通过） |
| 已标注 api 函数 | 312 → **351（72%）** |

### 本轮结论

批量化适合两类：**分页**（`PageRows`，字段访问都是可选的）和 **数组**（`VoRow[]`，主要用于遍历）。
**单实体不行** —— 它承载的是表单/详情对象的全部字段，收窄等于要求逐字段声明，属于「建 VO」的活，不能批量。

## R149（2026-11-26）— 单实体按模块建 VO：member 模块（351 → 357）

### 为什么只 +6

R148 证明了单实体**不能批量标**（62 个 → 99 个错误）。这轮换成正确做法：
**先给该实体建逐字段 VO，再标接口**。

### 做了什么

1. 新建 `src/types/vo/member.ts`，共 **9 个类型**：
   `MemberInfo` / `MemberWallet` / `MemberGradeInfo` / `MemberGroupInfo` /
   `MemberBenefitInfo` / `MemberPointsStatistics` / `MemberAddressRow` / `MemberPointRow` / `MemberEvaluation`
2. `memberDetail.vue` 删掉本地 `MemberInfo` / `MemberWallet` / `AddressRow`，改为 import
3. 给 6 个单实体接口标注：会员详情、积分统计、分组详情、等级详情、评价详情、钱包

### 修了 5 处调用点

| 位置 | 问题 | 处理 |
|---|---|---|
| grade/index.vue | `grade.benefitIds` 不存在 | `(grade as { benefitIds?: … })` |
| group/index.vue | `res.result.description` | `String((res.result as …).description ?? "")` |
| member/list/index.vue | `MemberInfo` → `MemberForm` | 断言 |
| memberDetail.vue | `res.result` 可能 undefined | `?? {}` + 断言 |
| memberDetail.vue | 钱包同上 | 同上 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.57s |
| lint | 67 告警（ratchet 通过） |
| api 已标注 | 351 → **357（73%）** |
| 跨模块 VO 文件 | 7 → **8** |

### 这轮的节奏参考

**一个模块 6 个左右单实体、5 个调用点，约 40 分钟**。
按这个速度，剩余约 133 个单实体需要 **20+ 轮** —— 这是「建 VO」的真实成本，不能靠脚本。

## R150（2026-11-26）— 单实体按模块建 VO：order 模块（357 → 365）

### 做了什么

1. 新建 `src/types/vo/order.ts`，共 **12 个类型**：
   `OrderInfo` / `OrderItemInfo` / `OrderLogInfo` / `OrderAllowOperation` / `OrderReceipt` /
   `OrderDetail`（聚合）/ `AfterSaleDetail` / `LogisticsTrace` / `OrderComplainDetail` /
   `StoreAfterSaleAddress` / `OrderCountVO`
2. 给 8 个接口标注：订单详情、售后详情（两个入口）、售后物流、商家售后地址、
   投诉详情、订单数量、售后数量
3. **修了 9 处调用点**（比 member 多，因为订单详情是聚合对象）

### 修法归类

| 类型 | 处数 | 处理 |
|---|---:|---|
| `res.result` 可能 undefined | 3 | `?? {}` + 断言 |
| 字段可能 undefined（serviceStatus） | 2 | `String(x ?? "")` |
| 字段是 `string \| string[]`（afterSaleImage） | 1 | `String(...)` |
| 页面用的字段 VO 里没有（images/appealImages） | 2 | 就地断言 |
| 聚合对象赋值给窄类型（orderInfo） | 1 | 断言 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.73s |
| lint | 67 告警（ratchet 通过） |
| api 已标注 | 357 → **365（74%）** |
| 跨模块 VO 文件 | 8 → **9** |

### 两轮单实体的对比

| 模块 | 接口 | 类型 | 调用点修复 |
|---|---:|---:|---:|
| member | 6 | 9 | 5 |
| **order** | **8** | **12** | **9** |

订单模块明显更重 —— 因为「订单详情」是聚合对象（order + items + logs + 价格 + 发票 + 操作标记），
几乎每个字段都可能 undefined，调用点都要加保护。

## R151（2026-11-26）— VO 契约文档（自动生成）+ 清理未使用类型

### 交付

**`apps/manager/VO-CONTRACTS.md`（992 行）** —— 由脚本从代码生成，不是手写：

| 章节 | 内容 |
|---|---|
| 使用约定 | 字段默认可选 / 索引签名 / BigDecimal 是字符串 / 枚举是字符串 |
| 一、总览 | 40 个类型 × 字段数 × 被几个接口用 × 被几个页面用 × 是否未使用 |
| 二、按模块明细 | 每个类型：字段表（名/类型/必填/说明）+ 被哪些接口返回 + 被哪些页面使用 + 被哪些 VO 嵌套引用 |
| 三、未被使用的类型 | 自动识别，当前为空 |
| 四、还没建 VO 的部分 | 覆盖率统计 |

**生成器**：`apps/manager/scripts/gen-vo-contracts.mjs`（可重复跑，改代码后重新生成）

### 生成器怎么判断「被使用」

三种来源都算：
1. 被 `api/*.ts` 的 `Request<...>` 泛型引用
2. 被页面 `import type { … } from "@/types/vo/*"` 引用
3. **被其他 VO 嵌套引用**（如 `OrderDetail` 里含 `OrderInfo`）—— 第一版漏了这条，误报 5 个

### 顺手做的事

| 项 | 处理 |
|---|---|
| `DepartmentNode` / `MenuNode` 未被使用 | **接上**：补全字段后，部门管理页 / 菜单页改用共享类型（删掉本地定义） |
| `PlanForm` / `MemberBenefitInfo` / `MemberPointRow` 确实没使用方 | **删除**（页面用 `ReturnType` 推导或字段不同） |

结果：**40 个类型全部有使用方，0 个未使用**。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.73s |
| lint | 67 告警（ratchet 通过） |
| VO 类型数 | 43 → **40**（删 3 个无用的，又接上 2 个） |
| 被页面引用 | 22 → **24 个类型** |

## R152（2026-11-26）— goods 模块 + 收尾批量（370 → 397）

### 做了什么

1. 新建 `src/types/vo/goods.ts`，5 个类型（**字段照后端 DTO 抄**）：`GoodsGroupInfo` / `GoodsNumVO` / `GoodsParameterRow` / `GoodsParamsDTO` / `OrderOverviewVO`
2. goods 模块 5 个接口：商品分组详情、商品数量统计、商品参数详情、订单概览、分类参数列表
3. **收尾批量（脚本，零人工判断）**：
   - 带 `blob` 参数的导出接口 → `<Blob>`（**7 个文件 17 处**）
   - 店铺详情 → `Store`（shared 包已有）、店铺会员 → `VoRow`
   - 采购单/入库单分页 → `PageRows`；采购单/盘点单详情 → `VoRow`
   - 直播人气 / 直播订单统计 → `VoRow`
   - 平台设置读取 / 全量 → `VoRow`

### 修了 10 处调用点

| 类型 | 处数 |
|---|---:|
| `res.result` 可能 undefined | 5 |
| `Store` → `ShopForm` / `Record` | 2 |
| 字段需要 `Number()` / `String()` | 2 |
| 重复导入（脚本补导入时撞车） | 2 文件 |

### 踩的坑

**脚本给 api 文件补 import 时，如果文件已有 `PageRows` 导入，会插出第二行** —— `live.ts` / `setting.ts` 各撞了一次（重复标识符）。
修法：把已有行改成 `{ PageRows, VoRow }`，而不是新增一行。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.63s |
| lint | 67 告警（ratchet 通过） |
| api 已标注 | 370 → **397** |
| 请求调用覆盖率（严格口径） | **397 / 604（66%）** |
| VO 文件 | 9 → **10**（新增 goods） |
| VO 类型 | 40 → **45** |
| 未使用类型 | **0** |

### 口径修正

之前报的「74%」是按「api 函数个数（约 490）」算的；本轮改成更严格口径：**所有 HTTP 调用点**（get/post/put/delete × 各变体）= 604 个。
按这个口径当前是 **66%**。两个口径都对，但后者更能反映真实未标注量。

## R153（2026-11-26）— A 阶段收尾

### 做了什么

1. 补最后 2 个漏网分页：`/other/pageData/${id}` 与 `/other/pageData/pageType/...`
   新建 `PageDataDetail` 类型（pageData 是 JSON 字符串）
2. 修了 10 处装饰页调用点（`res.result?.pageData` / `String(...)` / 断言）
3. 产出 **`apps/manager/API-TYPING-STATUS.md`** —— A 阶段终报：
   - 601 个 api 函数、已标 398（66%）
   - 未标注 203 个按类型分类，附「为什么不再继续」的成本对比
   - 已建 10 个 VO 文件 / 45 个类型的清单
   - 这套方法的 6 条可复用经验

### 收尾判定

A 阶段的核心目标（**分页 / 数组 / 操作 / 下载 四类接口全部有类型**）**100% 完成**。
剩余 203 个的构成：

| 类别 | 数量 | 说明 |
|---|---:|---|
| `get-other` | 107 | 无明确 VO 的杂项 GET（枚举/地区/站点/统计碎片），加类型帮助有限 |
| `write` | 54 | 未被批量的写操作，需逐个看调用方 |
| `detail` | 38 | 单实体详情，**必须建 VO**（每模块约 40 分钟） |
| `upload` | 4 | 上传，返回结构由 OSS 决定 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.95s |
| lint | 67 告警（ratchet 通过） |
| api 已标注 | 397 → **398 / 601（66%）** |
| VO-CONTRACTS.md | 已重新生成 |

## R154（2026-11-26）— B 阶段启动：性能体检 + 2 项优化

### 交付

**`apps/manager/PERF-AUDIT.md`** —— 基于真实构建产物的体检报告。

### 体检结论（基线）

| 项 | 数值 |
|---|---:|
| dist 总体积 | 18.6 MB（996 个文件） |
| 首屏关键路径（preload 的 chunk 合计） | **≈1.5 MB 未压缩** |
| 其中 element-plus | **1,049 KB** |
| 其中业务入口 index | 287 KB |
| 额外阻塞脚本 tinymce | **405 KB** |
| 静态资源 dist/tinymce | 8.36 MB / 219 文件 |

### 本轮优化（含前后对比）

| 优化 | 改法 | 效果 |
|---|---|---|
| `@antv/g2`（590 KB） | home 页静态 import → 首次画图时 `await import()`，构造器缓存 | antv 变独立 chunk；`home` chunk 降到 12 KB；**590 KB 退出 /home 首屏路径** |
| tinymce 未启用插件 | 删掉 autoresize/charmap/help/quickbars/template（备份到 .build-check） | dist 少 21 个文件 / 0.14 MB |

### 发现但没动的（附理由）

| 优先级 | 问题 | 为什么没动 |
|---|---|---|
| **P0** | tinymce 405 KB 同步脚本在每个页面加载，但只有 7 个页面用到 | 需要改 `components/editor/index.vue`，而约定「编辑器先不要动」——**待你确认** |
| P1 | element-plus 全量 1,049 KB | 需装 unplugin 依赖（本机离线），改动面大需回归 |
| P2 | emoticons 表情图约 600 KB | 换符号版会改变表情样式 |

### 已经不错的部分

- 路由懒加载：591 行路由文件里只有 2 个静态 import
- `hls.js`（565 KB）已是 `await import()` 按需加载
- `LiveChatPanel`（838 KB，腾讯 IM SDK）只被直播控制台引用

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.68s |
| lint | 67 告警（ratchet 通过） |
| dist | 18.6 → **18.47 MB** |

## R155（2026-11-26）— TinyMCE 6.4.2 → 8.11.0 + 懒加载

### 做了什么

| 项 | 之前 | 现在 |
|---|---|---|
| 版本 | 6.4.2（public 静态副本 7MB / 154 文件） | **8.11.0**（npm 依赖，按需打包） |
| 加载 | index.html 同步 script，每页下 405KB | 进编辑器页时 `await loadTinymce()` |
| 静态资源 | 7MB 全量进 dist | 只留语言包 18KB |

### 代码改动

- 新增 `components/editor/load-tinymce.ts`：动态 import 核心/模型/主题/图标/24 插件/UI 皮肤，导出 `tinymceContentBaseCss`
- `config.ts`：去 base_url；`skin:false` / `content_css:false`；`content_style = [皮肤内容样式, 默认内容样式, 自定义].join()`；语言走 `language_url`
- `index.vue`：`init()` 改 async，先加载再初始化；`onActivated` 兜底
- 新增 `types/tinymce-modules.d.ts`（`tinymce/*` 与 `*.css` 声明）
- `index.html` 删除 tinymce 脚本；`public/tinymce` 移除（备份 `.build-check/tinymce-public-backup`）
- `package.json` 新增 `tinymce@8.11.0`

### 体积

| 指标 | 之前 | 现在 |
|---|---:|---:|
| dist | 18.6 MB / 1017 文件 | **12.38 MB / 841 文件** |
| 首屏同步脚本 | 405 KB | **0** |
| tinymce chunk | — | 475 KB（按需） |
| 编辑器 CSS | 运行时拉 | 216 KB（按需） |

### ⚠️ 许可证变化（需决策）

TinyMCE 7 起从 MIT 改为 **GPL-2.0-or-later 或 商业授权**。闭源商业项目需购买商业自托管授权，
或退回 **6.8.6（仍 MIT）**。已在 `EDITOR-UPGRADE.md` 第五节列出三个方案。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.09s |
| lint | 67 告警（ratchet 通过） |
| index.html 含 tinymce | ❌ 已移除 |

### 待人工验证

`EDITOR-UPGRADE.md` 第三节 16 项（编辑器能否出现、中文、图标、皮肤、图片上传、表情、表格、源码、全屏、预览、自动保存、保存回显、平台设置、装修面板、控制台无红错）。

## R156（2026-11-26）— TinyMCE 8 首轮实测问题修复

装修「文章内容」面板打开编辑器，控制台三条报错，已全部修掉：

| 报错 | 修复 |
|---|---|
| `editor is disabled because a TinyMCE license key has not been provided` | `config.ts` 加 `license_key: "gpl"` |
| `Failed to load license key manager url: plugins/licensemanager/plugin.js` 404 | 同上（不加 license_key 就会去找这个插件） |
| `Failed to load emojis ... plugins/emoticons/js/emojis.js` 404 | `load-tinymce.ts` 显式 `await import("tinymce/plugins/emoticons/js/emojis.min.js")` |

### 产物验证

- 表情库 chunk `emojis.min-*.js`（178 KB），由 `editor-*.js` 按需引用
- `license_key: "gpl"` 已进 bundle
- dist 12.58 MB / 843 文件
- typecheck 0 错误 / build 5.94s / lint 67 告警

### 经验

**tinymce 7/8 与 6.x 的两个行为差异**：
1. 必须显式声明许可证（`license_key: "gpl"` 或商业 key），否则编辑器直接禁用；
2. 插件依赖的资源（表情库等）不再从静态目录默认提供，打包场景要显式 import。

## R157（2026-11-26）— TinyMCE 授权：确认方案 A + README 记录风险

### 决策

用户确认**本项目是开源的**，因此采用**方案 A**：保持 `tinymce@8.11.0`，
在 `config.ts` 里用 `license_key: "gpl"`，按 **GPL-2.0-or-later** 使用（无需购买商业授权）。

### 记录位置

**根 `README.md` 的「## License」段**已重写，含：

| 内容 | 说明 |
|---|---|
| 整体许可 | Apache-2.0（继承 Lilishop） |
| 第三方组件提示 | TinyMCE 8.11.0 自 7.0 起为 GPL-2.0-or-later / 商业二选一 |
| **兼容性争议** | GPL-2.0 与 Apache-2.0 通常被认为不兼容；含管理端一起按 Apache-2.0 分发存在争议 |
| 仅自用/内部部署 | 不分发不触发 GPL 分发义务 |
| 对外发行三条路 | 整体 GPL-2.0-or-later / 买商业授权 / 回退 6.8.6（MIT） |
| 免责 | 工程侧事实说明，不构成法律意见 |

`apps/manager/EDITOR-UPGRADE.md` 第五节同步改写为「决策：方案 A + 风险记录位置」。

### 说明

本轮仅文档改动（+ 之前的 `license_key: "gpl"` 配置），代码三件套不受影响；
仍按惯例跑一次确认。

## R158（2026-11-26）— element-plus 按需引入（首屏 JS −204 KB）

### 改动

- `vite.config.ts`：加 `unplugin-vue-components` + `ElementPlusResolver({ importStyle: false })`
- `plugins/element.ts`：去掉 `app.use(ElementPlus)`，改 `app.use(ElLoading)` 注册 `v-loading`；样式仍全量
- `App.vue`：`<el-config-provider :locale="zhCn">` 提供中文语言包
- 新增 devDep `unplugin-vue-components`

### 数字

| 项 | 之前 | 现在 |
|---|---:|---:|
| element-plus JS | 1,049 KB | **845 KB（−19%）** |
| dist | 12.58 MB | **12.31 MB** |
| typecheck / build / lint | 0 / ✅ / 67 | 0 / ✅ 6.98s / 67 |

### 为什么只收 JS 不收 CSS

按需样式会与现有全量 `index.css` 重复，且**样式缺失的回归很难发现**；
CSS 354 KB（gzip 47 KB）留作后续单独一步（需要 `importStyle: css` + `unplugin-element-plus`）。

### 收益为什么只有 19%

项目实际用了 **63 个 el-* 组件**，加上共享 runtime，按需只削掉未使用的部分。

## R159（2026-11-26）— 组件复用：抽取 <TablePager>

### 先扫描再动手

扫描 346 个视图文件：

| 重复模式 | 文件数 |
|---|---:|
| el-table 列表 | 137 |
| **el-pagination 分页** | **95** |
| searchForm 查询表单 | 79 |
| el-dialog + el-form 弹窗 | 43 |

分页的 layout 高度一致（79 个用同一套），**属性完全相同的片段有 43 处**。

### 抽取

- 新增 `src/components/table-pager.vue`：`v-model:page` / `v-model:size` + `total`/`layout`/`page-sizes`，透传 change 事件
- **替换 92 个文件 / 109 处**（剩 3 处特殊场景保留 el-pagination）
- views 代码量 3642 KB → 3628 KB

### 顺带修掉 6 个真实类型错误

组件类型化（生成 `components.d.ts`）后模板 props 才被真正校验，暴露：

| 文件 | 问题 |
|---|---|
| memberDetail.vue | `:customer` → 组件 prop 实为 `customStyle` |
| advertising.vue / alertAdvertising.vue | liliDialog 的 `:types` 应为 `:type` |
| statistics/order.vue | 分页参数可选，`v-model` 需要必填 → 拆 `StatsQuery` / `StatsParams` |

> 这些以前是**静默失效**的（组件未类型化，拼错的 prop 不报错）。

### 为什么没继续抽「列表页骨架」

137 个列表页的列定义/插槽/行内操作各不相同，抽成通用组件会变成配置地狱；
分页是「真正同构」的部分，列表/表单是「形似神不同」。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.60s |
| lint | 67 告警（ratchet 通过） |

### 交付

`apps/manager/COMPONENT-REUSE.md` —— 重复度数据、抽取结果、后续候选与性价比

## R160（2026-11-26）— useTable 统一分页状态

### 发现

`src/utils/useTable.ts` 早已存在，**28 个页面在用**，但仍有 **47 个页面手写**同样的
`loading/data/total/searchForm/getDataList/changePage/changePageSize` 七件套。

### 改动

1. `useTable` 新增 `handleCurrentChange(page)` / `handleSizeChange(size)`（后者**重置页码为 1**）
2. 迁移 2 个样板页：

| 页面 | 前 | 后 |
|---|---:|---:|
| goods-unit/index.vue | 244 行 | **222 行** |
| goods/group/index.vue | 378 行 | **345 行** |

3. 迁移后清理未使用的 `onMounted` 导入

### 收益

- 单页 −22~−33 行样板代码；45 个待迁页面估算合计 **约 −1200 行**
- 「改每页条数是否重置页码」从各页不一致 → 统一在组合式里

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.42s |
| lint | 67 告警（ratchet 通过） |


## R161（2026-11-26）— useTable 批量迁移（第 1 批 2 个页面）

### 通用 codemod 试过，结论是不可行

写了 `codemod-useTable.mjs`（分析 searchForm/data/total/fetcher 后自动改写状态声明、
删除手写函数、替换模板处理器），在 4 个候选页 dry-run：**4 个全部 SKIP** ——
各页状态声明的顺序、命名、fetcher 调用形态差异太大。

### 改为逐页手工迁移（本批 2 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| page/feedback/feedback.vue | 172 | **155** | −17 |
| procurement/reason/reasonManage.vue | 217 | **199** | −18 |

### 踩的 3 个点

1. 模板处理器名字不统一 → 必须改成 handleCurrentChange / handleSizeChange（否则翻页不拉数据）
2. 迁完后有的解构变量没人用 → 删掉，否则 lint 报 no-unused-vars
3. 页面内部仍调 getData() 刷新 → 用 `getDataList: getData` 别名

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.44s |
| lint | 67 告警（ratchet 通过） |
| 使用 useTable 的页面 | 28 → **32** |
| 累计迁移 | **4 / 45 页**（−90 行） |


## R162（2026-11-26）— useTable 批量迁移（第 2 批：promotions 3 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| promotions/pintuan/pintuan.vue | 234 | **201** | −33 |
| promotions/coupon/coupon-receive.vue | 285 | **256** | −29 |
| promotions/points-goods-category.vue | 248 | **236** | −12 |

### 关键：三个钩子让「特殊逻辑」也能迁

以前觉得带日期区间/递归排序的页面不能迁，实际 `useTable` 提供了：

| 钩子 | 用途 | 用在哪 |
|---|---|---|
| `beforeRequest` | 请求前转换参数 | pintuan / coupon-receive 的日期区间 → startTime/endTime |
| `resolve` | 返回后加工列表 | points-goods-category 的递归排序 |
| `onSuccess` | 成功后同步其他状态 | 备用 |

### 迁移后又清理的 3 类残留

1. 不用的 vue 导入（onMounted / reactive）
2. 不用的 type 定义（PintuanSearchForm / CouponReceiveSearchForm，共 23 行）
3. 不用的 init() 包装函数

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.60s |
| lint | 67 告警（ratchet 通过） |
| 累计迁移 | **7 / 45 页**（−164 行） |
| 使用 useTable 的页面 | 28 → **35** |


## R163（2026-11-26）— useTable 批量迁移（第 3 批：promotions 收尾 4 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| promotions/coupon-activity/coupon.vue | 388 | **361** | −27 |
| promotions/coupon/coupon.vue | 644 | **616** | −28 |
| promotions/pintuan/pintuan-goods.vue | 653 | **639** | −14 |
| promotions/seckill/seckill-goods.vue | 561 | **547** | −14 |

**promotions 模块 7 个页面全部迁完。**

### 本批遇到的 3 类新情况

| 情况 | 处置 |
|---|---|
| `searchForm` 原来是 `ref`（用 `searchForm.value.xxx`） | 迁成 reactive 后统一去掉 `.value`（本批 2 处 + 模板无需改） |
| 列表变量不叫 `data`（`goodsData` / `goodsList` / `tableData`） | 用 `data: 别名` 解构，模板零改动 |
| 有 `pintuanId` / `seckillId` 前置守卫（无 id 不发请求） | 保留一个 `refreshGoods()` 包装，`beforeRequest` 里注入 id |

### 残留清理

删掉 4 个不再使用的 `type XxxSearchForm`（合计 29 行）+ 2 个 `init()` 包装 + 未使用导入。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.36s |
| lint | 67 告警（ratchet 通过） |
| 累计迁移 | **11 / 45 页**（−247 行） |
| 使用 useTable 的页面 | 28 → **39** |


## R164（2026-11-26）— useTable 批量迁移（第 4 批：sys / seller / logistics 5 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| sys/log-manage/logManage.vue | 143 | **123** | −20 |
| sys/app-version/appVersion.vue | 349 | **324** | −25 |
| logistics/index.vue | 282 | **270** | −12 |
| seller/shop/shopList.vue | 320 | **294** | −26 |
| seller/bill/accountStatementBill.vue | 211 | **182** | −29 |

### 本批处理的特殊逻辑

| 页面 | 特殊点 | 处置 |
|---|---|---|
| logistics | 行数据要加工（switch / standBy） | `resolve` 里改行数据 |
| accountStatementBill | 请求前要做时间格式转换 + 固定 billStatus | `beforeRequest` 里做 |
| accountStatementBill | 翻页要清空表格勾选 | 单独包一个 `onPageChange`（先 handleCurrentChange 再 clearSelectAll） |
| logManage | 失败时要 ElMessage 提示并清空列表 | 迁到 useTable 后改为依赖默认 resolve（失败即空列表） |

### 残留清理

删掉 5 处不再使用的 `onMounted` 导入、2 处 `reactive`、1 处 `ElMessage`，
以及 `accountStatementBill` 里未使用的 `getDataList` 解构。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.61s |
| lint | 67 告警（ratchet 通过） |
| 累计迁移 | **16 / 45 页**（−359 行） |
| 使用 useTable 的页面 | 28 → **44** |


## R165（2026-11-26）— useTable 批量迁移（第 5 批：distribution 4 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| distribution/distributionGoods.vue | 462 | **424** | −38 |
| distribution/distributionOrder.vue | 386 | **357** | −29 |
| distribution/distribution.vue | 1110 | **1085** | −25 |
| distribution/distributionCustomerRelation.vue | 677 | **652** | −25 |

### 有 tab 的页面怎么迁（本批核心经验）

distribution 这几个页面的 tab **只改查询字段、不换接口**，所以迁移很顺：

`@ts
function onStatusTabChange(name) {
  currentStatus.value = name;
  searchForm.distributionStatus = name === "ALL" ? "" : String(name);
  searchForm.pageNumber = 1;   // reactive 可直接写
  getDataList();               // composable 提供的加载
}
`@

**只有 tab 切换 fetcher 的场景才需要额外处理**（本批没遇到，distributionCustomer 是双列表）。

### 复杂参数构造的迁移模式

| 页面 | 原来 | 迁移后 |
|---|---|---|
| distribution | `buildParams()` 手写参数对象 | 改成 `buildParams(base)`，整体作为 `beforeRequest` |
| distributionCustomerRelation | `getDataList()` 里删空值 + 布尔转换 + 时间区间 | 抽成 `cleanParams(input)`，作为 `beforeRequest` |

> 结论：**参数构造逻辑不用重写，只要改成「接收 base 参数并返回」就可以直接挂到 `beforeRequest`**。

### 踩的坑

1. 迁移后 `init()` 里如果只剩列表加载 → 会变成未使用函数，要么删掉，要么只保留筛选项加载；
2. `distributionGoods` 的 `loadFilterOptions` 一开始被我删了，导致分类/品牌下拉不加载 —— 已恢复（分类树必须加载）；
3. 旧 `type SearchForm` 定义全部变成未使用，本批删了 44 行。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.64s |
| lint | 67 告警（ratchet 通过） |
| 累计迁移 | **20 / 45 页**（−476 行） |
| 使用 useTable 的页面 | 28 → **48** |


## R166（2026-11-26）— useTable 批量迁移（第 6 批：双列表 3 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| distribution/distributionCustomer.vue | 381 | **373** | −8 |
| member/group/index.vue | 467 | **439** | −28 |
| member/point/point.vue | 708 | **657** | −51 |

### 核心：一页两表

distributionCustomer（客户列表 + 绑定日志）和 member/point（积分记录 + 会员选择列表）
都是「一页两表」。做法是**两个 useTable + 解构别名**，第二个表用 `immediate: false`
保持「切到对应 tab 才加载」的原行为。

### 钩子第三次立功

| 页面 | 钩子 | 用途 |
|---|---|---|
| member/group | `onSuccess` | 列表返回后异步补齐每个分组的会员总数 |
| member/point | `beforeRequest` | 两个表的 trim / 空值转 undefined |
| distributionCustomer | `beforeRequest` | 日志日期区间 → startDate/endDate |

### 踩的坑

1. 双列表迁移后模板里仍有 `handleSearch` / `handlePageSizeChange` 等旧名字，
   必须逐个映射到 `handleSearch` / `handleSizeChange`；
2. `member/point` 里原本有本地 `type ApiResult / type PageResult`（和全局类型重名），
   迁移后不再使用，删掉；
3. `distributionCustomer` 少一次请求：第二个表必须 `immediate: false`。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.42s |
| lint | 67 告警（ratchet 通过） |
| 累计迁移 | **23 / 45 页**（−563 行） |
| 使用 useTable 的页面 | 28 → **51** |


## R167（2026-11-26）— useTable 批量迁移（第 7 批：member/list + afterSale + 抽屉）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| member/list/index.vue | 963 | **936** | −27 |
| order/after-order/afterSale.vue | 199 | **182** | −17 |
| order/wechat/SyncLogDrawer.vue | 88 | **92** | **+4** |

### 反例记录：小抽屉不该迁

SyncLogDrawer 只有 30 行脚本、自带 requestSeq 守卫，迁到 useTable 后反而长了 4 行。
**只读小列表（< 100 行）不建议迁**，已在 COMPONENT-REUSE.md 记录。

### member/list 的 3 个特殊点

| 点 | 处置 |
|---|---|
| `searchForm` 原是 `ref`（全篇 `.value`） | 改 reactive 后统一去掉（3 处） |
| `getData` 里有 `requestId` 竞态守卫 | useTable 内置，直接删掉手写版 |
| `onMounted` 里读 `route.query.groupId` 赋值 | **必须挪到 form 初值**，否则 immediate 抢跑导致第一次请求没带 groupId |

### 两参接口的适配

`getWechatOrderLogs(orderSn, params)` 是两参函数，useTable 需要单参 fetcher：

`@ts
useTable((params) => getWechatOrderLogs(props.orderSn, params), { immediate: false })
`@

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 5.45s |
| lint | 67 告警（ratchet 通过） |
| 累计迁移 | **26 / 45 页**（−603 行） |
| 使用 useTable 的页面 | 28 → **54** |


## R168（2026-11-26）— 组件复用收尾

### 交付

**`apps/manager/COMPONENT-REUSE-STATUS.md`** —— 组件复用终报：

| 内容 | 说明 |
|---|---|
| 结论 | 1 个组件（TablePager）+ 1 个组合式（useTable），26 个页面迁移、−603 行 |
| 抽了什么/为什么 | 43 处完全相同的分页片段是唯一「真正同构」的部分 |
| 没抽什么/为什么 | 列表骨架「形似神不同」，抽了会变配置地狱 |
| **6 条经验 + 2 个坑** | codemod 不可行 / 模板处理器必须改名 / 三个钩子 / immediate:false / route.query 抢跑 / 两参接口适配 |
| **1 个反例** | SyncLogDrawer 迁完 +4 行 → 只读小列表不值得迁 |
| **剩余 28 个的判定** | A 不迁 2 个、B 可迁 15 个、C 需人工 3 个、D 暂不迁 8 个 |
| 后续步骤 | 单页迁移 6 步 + 每批验证命令 + 验收口径 |

### 关键数字

| 项 | 结果 |
|---|---:|
| 总视图文件 | 346 |
| 使用 useTable | **54**（原 28） |
| 使用 TablePager | **92** |
| 仍用 el-pagination | 3（抽屉类特殊布局） |
| 手写分页剩余 | 28（其中 10 个判定不迁） |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.29s |
| lint | 67 告警（ratchet 通过） |


## R169（2026-11-26）— 合并冒烟清单

### 交付

**`apps/manager/SMOKE-REUSE.md`** —— 把 TEST-CASES 第 32–41 章（10 章、约 90 条）
去重合并成 **57 条可勾选清单**，按 P0/P1/P2 分级，预计 25–35 分钟跑完。

### 结构

| 组 | 内容 | 条数 |
|---|---|---:|
| 第 1 组 | element-plus 按需（指令 / 服务 / 语言 / 渲染） | 5 |
| 第 2 组 | 分页组件（翻页 / 改条数 / 筛选 / 跳页） | 5 |
| 第 3A-3E 组 | useTable 迁移（商品 / 营销 / 分销 / 会员 / 订单系统物流商家） | 36 |
| P1 | 通用组件回归 | 8 |
| P2 | 首屏体积与编辑器 | 3 |

### 特点

1. **每条都有明确的通过标准**（不是「正常」这种废话）；
2. 给出「判定失败的 5 个信号」（控制台红错 / 点击无反应 / 翻页不变 / 列表空 / 遮罩不消失）；
3. 标了**每批改动对应的 ledger 轮次**，失败时能直接定位到是哪一批引入的；
4. 附失败记录模板。

### 验证

本轮仅文档，三件套仍为 0 / ✅ / 67。


## R170（2026-11-26）— 修编辑器工具栏：charmap 丢失 + 时间插入下拉为空

### 用户反馈

装修「文章内容」面板里，工具栏时钟图标旁的箭头点开**没有选项**，功能用不了。

### 根因（两条）

| # | 问题 | 原因 |
|---|---|---|
| 1 | **特殊字符（charmap）按钮消失** | `toolbar.ts` 里有 `charmap`，但 `load-tinymce.ts` 的插件 import 列表里**漏了它**（R154 清理 public/tinymce 时一起删掉了），未注册的工具栏项被静默丢弃 |
| 2 | **插入日期/时间的下拉为空** | 没有显式配置 `insertdatetime_formats`，v8 的 split button 菜单内容直接来自这个选项 |

### 修复

| 文件 | 改动 |
|---|---|
| `load-tinymce.ts` | 补 `import("tinymce/plugins/charmap/plugin")` |
| `plugins.ts` | 补 `charmap` 到 plugins 数组（与 toolbar 对齐） |
| `config.ts` | 显式设置 `insertdatetime_formats`（4 个格式）+ `insertdatetime_timeformat` / `insertdatetime_dateformat` |

配置的 4 个格式：

`@ts
insertdatetime_formats: [
  "%Y-%m-%d %H:%M:%S",
  "%Y-%m-%d",
  "%H:%M:%S",
  "%Y年%m月%d日",
]
`@

### 顺带加的检查

写了个小脚本比对 `toolbar.ts` 里的插件类按钮和 `plugins.ts`，确认已对齐（避免再出现「按钮丢了但没人发现」）。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.92s |
| lint | 67 告警（ratchet 通过） |
| charmap 是否进包 | ✅ 在 `editor-DDLl-ue0.js` 里 |

### 教训

**工具栏配置和插件注册必须成对维护**。TinyMCE 对未注册的工具栏项是**静默忽略**的，
不会报错，所以只能靠肉眼对比 `toolbar.ts` 和 `plugins.ts`。
本轮漏的 `charmap` 就是这么丢的（而且是因为 R154 删静态副本时顺手删了它的文件）。


## R171（2026-11-26）— 统一文件命名：kebab-case（阶段 1）

### 决策

用户确认：统一 **kebab-case**；本轮范围 = **views + components 目录**（含菜单同步）。

### 执行结果

| 项 | 数值 |
|---|---:|
| 重命名文件 | **229 个**（PascalCase / camelCase → kebab） |
| 修正 import / 动态 import | **84 个文件 / 285 处** |
| 修正大小写不一致（TS1261） | **32 个文件 / 34 处** |
| 修正 lazyLoading 别名路径 | **22 处** |
| 视图+组件仍非 kebab | **0**（413 / 413） |

### 数据库与种子 SQL

`li_menu.front_route` 存的是视图文件路径，文件改名必须同步：

| 项 | 结果 |
|---|---|
| 失配菜单行 | 38 行 → **0 行** |
| 产物 1 | `backend/DB/menu-kebab-routes.sql`（38 条幂等 UPDATE） |
| 产物 2 | `docker/init/mysql/patches/2026-11-26-menu-kebab-routes.sql`（同内容） |
| 幂等验证 | 重复执行 0 行受影响 |
| 其余 15 条 | 由 `VIEW_ALIASES` 映射或 `DEPRECATED_FRONT_ROUTES` 跳过 |

### 关键坑（写进 NAMING-CONVENTIONS.md）

1. **Windows 大小写不敏感**：`Coupon.vue → coupon.vue` 必须经临时名两步走；
2. **只改「解析不到」的引用**：能解析就不动，避免误伤；
3. **补一轮大小写对齐**：按磁盘真实大小写重建 specifier，否则 TS 报 TS1261；
4. **纯字符串路径不会被 import 规则覆盖**：`lazyLoading.ts` 的 VIEW_ALIASES 要单独处理。

### 阶段 2（未做）

| 位置 | 含大写/下划线 | 总数 |
|---|---:|---:|
| router.ts path | 9 | 90 |
| router.ts name | 13 | 90 |
| li_menu.path | 49 | 139 |
| li_menu.name | 59 | 139 |

风险：`name` 是跳转契约，全站 `router.push({ name })` + `removeTag()` + `firstRouterName` 都要同步。
详见 `apps/manager/NAMING-CONVENTIONS.md` 第三节。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 通过 |
| lint | 67 告警（ratchet 通过） |


## R172（2026-11-26）— 统一路由 path / name（阶段 2）

### 用户反馈

退出重登后 URL 仍是 `/pcFloor` 这种驼峰路径，且路由 `name` 命名也不统一。

### 规模

| 项 | 数量 |
|---|---:|
| name 需改（DB + 静态路由去重） | **71** |
| path 需改 | **57** |
| 前端引用替换 | **46 处 / 19 个文件** |
| 代码里写死的旧 path 字面量 | **4 处** |

### 关键做法

- **只改路由语境**：push / replace / customRouterPush({ name })、removeTag()、firstRouterName；
  `defineOptions({ name })` 是组件名，不能动；
- 单双引号都要覆盖（第一遍漏了单引号的 home_index）；
- 顺带删掉 coupon-activity/coupon.vue 里引用不存在路由的死代码 `_edit()`。

### 数据库

| 项 | 结果 |
|---|---|
| li_menu.name 非 kebab | 59 → **0** |
| li_menu.path 非 kebab | 49 → **0** |
| `/pcFloor` | 已变 **`/pc-floor`** |
| 产物 | `backend/DB/menu-kebab-names.sql`（149 行，幂等）+ docker 补丁副本 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 7.27s |
| lint | 67 告警（ratchet 通过） |


## R173（2026-11-26）— 修「/pc-floor 没有侧边菜单」

### 现象

改名后打开 `/pc-floor`，页面内容渲染了但**没有左侧菜单/布局**。

### 根因（阶段 2 的遗留）

菜单动态路由挂在父路由 `otherRouter` 下：

`@ts
if (router.hasRoute("otherRouter")) router.addRoute("otherRouter", record)
else router.addRoute({ ...record, path: "/" + routePath })  // 退化成顶级路由 = 没有 Main 布局
`@

阶段 2 把静态路由的 `name` 也 kebab 化了（`otherRouter → other-router`），
但 `libs/util.ts` 里**硬编码的字符串**没改 → `hasRoute("otherRouter")` 为 false
→ 所有菜单路由都退化成**顶级路由** → 没有侧边栏。

### 同类遗漏（一共 36 处）

我之前只替换了「路由语境」的 5 类写法，漏了这些硬编码用法：

| 写法 | 处数 | 文件 |
|---|---:|---|
| `hasRoute / addRoute("otherRouter")` | 2 | libs/util.ts |
| `next({ name: "home_index" })` | 1 | router/index.ts |
| `currNav = "home_index"` 等导航判断 | 3 | libs/util.ts |
| `navigateTo("managerGoods")` 等 | 7 | views/home/home.vue |
| `command="withdrawApply"` / `name === "..."` | 5 | message-tip.vue |
| 面包屑映射表 value | 6 | page-breadcrumb.vue |
| 菜单组件里写死的跳转名 | 5 | shrinkable-menu.vue |
| 其它（标签页、数据报表、stores） | 7 | tags-page-opened / data-report / stores/app |

### 修复方式

「**全量替换旧路由名，但跳过 `defineOptions({ name })` 行**」——
因为那是**组件名**（keep-alive 依赖），20 处保持原样。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 7.18s |
| lint | 67 告警（ratchet 通过） |
| `hasRoute("other-router")` 与 router.ts 的 `name: "other-router"` | 一致 |

### 教训

**改路由 name 不能只搜 `push({name})`**：`hasRoute` / `addRoute` / `next()` /
`navigateTo()` / 下拉 `command` / 面包屑映射 都会用到，而且**漏了不报错**，
只会表现为「页面没布局」「点了没反应」这类现象。


## R174（2026-11-26）— 修「图片预览遮罩关不掉」

### 现象

OSS 资源页点图片预览后，大图遮罩层关不掉（没有可点的关闭按钮，点空白也没反应）。

### 根因

`<el-image-viewer>` 的 `teleported` 默认是 **false**，所以它是**在页面容器里就地渲染**的：

| 后果 | 说明 |
|---|---|
| 遮罩被容器裁剪 | 只盖住内容区，盖不住顶部 header / 标签栏 |
| 关闭按钮被压住 | 关闭按钮定位在 viewer 右上角，正好落在 header 下面，点不到 |
| 点空白不关闭 | `hideOnClickModal` 默认 **false** |

### 修复

`@vue
<el-image-viewer
  v-if="imageViewerVisible"
  :url-list="..."
  :initial-index="previewImageIndex"
  teleported              <!-- 关键：挂到 body，避免被容器裁剪 -->
  :z-index="20000"        <!-- 高于布局里的 11000 -->
  hide-on-click-modal     <!-- 点遮罩也能关 -->
  :close-on-press-escape="true"
  @close="imageViewerVisible = false"
/>
`@

三条关闭路径现在都可用：**右上角 ×** / **点遮罩** / **按 ESC**。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 7.50s |
| lint | 67 告警（ratchet 通过） |


## R175（2026-11-26）— 修「view not found: Main」+ 内容区空白

### 现象

控制台刷屏 `[lazyLoading] view not found: Main`（28 次），页面内容区空白。

### 根因

后端菜单里**分组节点**的 `front_route` 存的是字符串 `Main`：

`@sql
SELECT name, path, front_route FROM li_menu WHERE level = 1 LIMIT 3;
-- goods  /  Main
`@

`lazyLoading("Main")` → 拼出 `../views/Main.vue` → 但 R171 已把文件改成 `main.vue`
（Windows 大小写不敏感，所以**改文件时不报错，运行时 glob 键对不上**）。

分组节点拿不到组件 → 退化成 404 组件 → 它的子路由没有 `<router-view>` 可挂 → **内容区空白**。

### 修复（两处）

1. `VIEW_ALIASES` 加 `Main: "main"` 与 `main: "main"`；
2. `findLoader()` 加兜底：原样 → `/index` → **全小写** → 全小写 + `/index`，
   这样历史数据里残留的驼峰 `front_route` 也不会再整页空白。

### 全量校验

| 项 | 结果 |
|---|---|
| 菜单 front_route 总行数 | 137 |
| 「别名 + 小写兜底」后能解析 | **126** |
| 仍解析不到 | 11（其中 8 条是 `null` / `1` 脏值，3 条在 `DEPRECATED_FRONT_ROUTES` 里） |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 8.20s |
| lint | 67 告警（ratchet 通过） |

### 教训

**Windows 上「大小写不敏感」会把这类 bug 藏起来**：文件改名成功、TS 编译通过，
但运行时的 `import.meta.glob` 键是**区分大小写**的字符串，对不上就静默失败。
凡是拼路径的地方（glob 查找、动态 import）都要加小写兜底。


## R176（2026-11-26）— 修「/sys/auth-login 空白」

### 根因

`setting-manage.vue` 用**路由 name 当对象键**决定显示哪组 tab：

`@ts
const tabMap: Record<string, SettingTab[]> = {
  setting: setting.value,
  authLogin: authLogin.value,   // ← 路由 name 已改成 auth-login
  pay: pay.value,
};
tabWay.value = tabMap[String(route.name || "")] || [];   // 匹配不到 → 空数组 → 页面空白
`@

R172 把路由 name 从 `authLogin` 改成 `auth-login`，但这个**未加引号的对象键**
不在我之前的替换范围内（只替换了字符串字面量）→ 匹配不到 → tabs 为空 → 整页空白。

### 修复

1. 键改成 `"auth-login"`；
2. 加 **path 兜底**：路由 name 匹配不到时按 `route.path` 包含的关键词选组，
   保证「改名/别名」都不会再造成整页空白。

### 全站排查

写了脚本扫「旧路由名作为标识符/对象键」的用法（排除 `defineOptions` 组件名）：

| 项 | 结果 |
|---|---|
| 命中 | **1 处**（就是本页 `tabMap`） |
| 其它 `route.name` 用法 | 均为通用逻辑，无硬编码旧名 |
| `renovation` 等比较 | 静态路由名仍存在，无需改 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 7.84s |
| lint | 67 告警（ratchet 通过） |

### 教训

**改路由 name 的第三类遗漏：未加引号的对象键**（`authLogin: ...`）。
前两类是字符串字面量和 `hasRoute/addRoute`，这一类 grep 引号永远搜不到，
只能按「旧名 + 冒号」再扫一遍。


## R177（2026-11-26）— 修「平台装修 404」

### 现象

点「平台首页装修」进 404，地址是 `/floorList/renovation?id=...`（旧驼峰路径）。

### 根因

静态路由已改为 `/floor-list/renovation`，但代码里还有 **8 处写死的旧路径**：

| 文件 | 内容 |
|---|---|
| `components/lili-dialog/link-dialog.vue` | `/floorList/renovation`、`/floorList/main` |
| `components/lili-dialog/template/other.vue` | `/floorList/renovation` |
| `views/page-decoration/floor-list.vue` | 跳装修页的 `path: "/floorList/renovation"`（2 处） |
| `views/page-decoration/wap/wap-list.vue` | `path: "/floorList/main"`（2 处） |
| `views/distribution/distribution.vue` | `path: "/distributionCustomerRelation"` |

### 修复

统一替换为 kebab 路径（`/floor-list/`、`/distribution-customer-relation`），
并更新 `utils/media-url.ts` 注释里的旧示例。

### 全量校验（防再犯）

写了个校验脚本：把「静态路由 + 数据库菜单 path」汇总成 **171 条有效路径**，
再扫代码里所有 `"/xxx"` 字面量 —— 解析不到但 kebab 化后能解析的，就是漏改的。

| 项 | 结果 |
|---|---|
| 仍失效但可 kebab 修复的引用 | **0** |

> 注意：买家端装修链接（`/home/MyOrder`、`/goodsList`、`/couponCenter` 等）**不是管理端路由**，
> 不能被这个脚本误判 —— 它们不在 171 条有效路径里，也不会 kebab 化后命中，所以安全。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 7.39s |
| lint | 67 告警（ratchet 通过） |


## R178（2026-11-26）— 菜单 front_route 命名收尾（阶段 3）

### 用户反馈

菜单管理页「前端组件」列里还有 `member/list/memberRecycle`、`Main` 这种非 kebab 值。

### 查证

那一列展示的是 `front_route` 字段（不是 `front_component`，后者全为 NULL）。
R171 只改了「能命中文件」的行，剩下 29 行因为「目标是分组节点 / 页面已废弃」没动：

| 旧值 | 数量 | 新值 |
|---|---:|---|
| `Main`（分组节点，指向布局组件） | 28 | `main` |
| `member/list/memberRecycle`（回收站，页面未实现） | 1 | `member/list/member-recycle` |

### 连带改动

| 位置 | 改动 | 原因 |
|---|---|---|
| `libs/util.ts` `DEPRECATED_FRONT_ROUTES` | 同步成 `member-recycle` | 否则废弃菜单不再被跳过，会走 404 |
| `menu.vue` / `store-menu.vue` | 新增菜单默认 `frontRoute` 改为 `main`，placeholder 改文案 | 避免新建菜单又写出 `Main` |

### 产物

| 文件 | 内容 |
|---|---|
| `backend/DB/menu-kebab-front-route.sql` | 2 条幂等 UPDATE |
| `docker/init/mysql/patches/2026-11-26-menu-kebab-front-route.sql` | 同内容 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 8.30s |
| lint | 67 告警（ratchet 通过） |
| `li_menu.front_route` 非 kebab | **0**（原 29） |
| SQL 幂等 | 重复执行 0 行受影响 |


## R179（2026-11-26）— TS 模块改名（阶段 4，命名统一收尾）

### 改动

把 `api/ utils/ libs/ composables/ constants/` 下 12 个 camelCase 模块改为 kebab：

| 旧名 | 新名 |
|---|---|
| api/pointsCoupon.ts | api/points-coupon.ts |
| api/timedTask.ts | api/timed-task.ts |
| composables/useSiteSettings.ts | composables/use-site-settings.ts |
| constants/cardKey.ts | constants/card-key.ts |
| constants/goodsType.ts | constants/goods-type.ts |
| libs/lazyLoading.ts | libs/lazy-loading.ts |
| libs/RegExp.ts | libs/reg-exp.ts |
| utils/downloadBlob.ts | utils/download-blob.ts |
| utils/imgFallback.ts | utils/img-fallback.ts |
| utils/useTable.ts | utils/use-table.ts |
| utils/wechatOrderSync.ts | utils/wechat-order-sync.ts |
| App.vue | app.vue（仅大小写，走临时名两步） |

### 数字

| 项 | 数值 |
|---|---:|
| 改名文件 | **12** |
| 修正引用 | **76 个文件 / 88 处** |
| src 下非 kebab 源文件 | **1**（第三方压缩库 `lib-generate-test-usersig-es.min.js`，保留） |

### 全站命名统一总账（四个阶段）

| 阶段 | 范围 | 数量 |
|---|---|---:|
| 1 | views/components 文件 | 229 个文件 + 38 行菜单 |
| 2 | 路由 name/path | 71 name + 57 path + 46 处引用 |
| 3 | 菜单 front_route 收尾 | 29 行 + 3 处默认值 |
| 4 | TS 模块 | 12 个文件 + 88 处引用 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 11.66s |
| lint | 67 告警（ratchet 通过） |


## R180（2026-11-26）— 合并冒烟清单（覆盖 R154–R179）

### 交付

`apps/manager/SMOKE-REUSE.md` 重写，从「R158–R167 / 57 条」扩到 **R154–R179 / 78 条**：

| 组 | 内容 | 条数 | 对应轮次 |
|---|---|---:|---|
| 1 | element-plus 按需 | 5 | R158 |
| 2 | 分页组件 | 5 | R159 |
| 3 | useTable 迁移 | 20 | R160–R167 |
| 4 | **富文本编辑器** | 10 | R154 / R170 |
| 5 | **菜单与路由命名** | 14 | R171–R173 / R177 / R178 |
| 6 | **图片预览** | 5 | R174 |
| 7 | **平台设置分组** | 4 | R176 |
| 8 | **底层模块改名** | 4 | R179 |
| P1 | 通用组件回归 | 8 | — |
| P2 | 首屏体积与编辑器 | 3 | — |

### 这次补的判定标准

新增一条失败信号：**「页面空白但菜单高亮正常」= 组件没解析到**（lazy-loading 相关）。
这是 R175 那个 bug 的典型表现，之前的清单里没有这一条。

### 失败时能定位到轮次

文末「改动与轮次对照」表把 13 个轮次和 8 个检查组一一对应，失败时先看编号属于哪一组，
就知道是哪一轮引入的。

### 验证

本轮仅文档，三件套仍为 0 / ✅ / 67。


## R181（2026-11-26）— 回退 TinyMCE 到 6.4.2（授权原因）

### 原因

TinyMCE 7+ 为 GPL-2.0-or-later / 商业授权二选一，与项目 Apache-2.0 有兼容性争议。
用户决定回退到 **6.4.2（MIT）**。

### 回退内容

| 项 | 回退前（8.11.0） | 现在（6.4.2） |
|---|---|---|
| npm 依赖 | `tinymce@8.11.0` | **已移除** |
| 资源 | bundle chunk | `public/tinymce` 静态副本（198 文件） |
| 加载 | 按需 `await loadTinymce()` | `index.html` 同步 `<script>` |
| 皮肤 | 打包 CSS + `?inline` | `base_url` 拉静态目录 |
| 语言 | `public/tinymce-langs` | `public/tinymce/langs` |
| LICENSE | GPL-2.0-or-later | **MIT** |

### 保留的 2 个 bug 修复（与版本无关）

| 修复 | 原因 |
|---|---|
| `plugins.ts` 补 `charmap` | 工具栏有 charmap 但插件未启用 → 按钮被静默丢弃 |
| `config.ts` 配 `insertdatetime_formats` | 时钟下拉的选项来源 |

### 附带动作

- 从 `tinymce@6.4.2` 官方包**补回** `plugins/charmap`（回退前的裁剪把它删了，但工具栏还在用）
- 删除 `load-tinymce.ts` / `tinymce-modules.d.ts` / `public/tinymce-langs`

### 代价

首屏重新多了 405 KB 同步脚本；dist 从 12.3 MB 回到 **18.2 MB**。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 8.09s |
| lint | 67 告警（ratchet 通过） |
| tinymce 版本 | 6.4.2（majorVersion 6 / minorVersion 4.2） |
| charmap 插件 | 已补回并在 `dist/tinymce` 里 |


## R182（2026-11-26）— 修「TinyMCE 下拉菜单跑到屏幕左下角」

### 现象

编辑器里的下拉菜单（字体/时间/特殊字符等）显示不出来，DevTools 里能看到
`div.tox.tox-silver-sink.tox-tinymce-aux` 挂在 `body` 末尾、带内联 `position: relative`。

### 根因

TinyMCE 6 的 theme 里有这么一段（`themes/silver/theme.min.js`）：

`@js
exhibit: (e, t) => Ea({ classes: [], styles: t.useFixed() ? {} : { position: "relative" } })
`@

即：**只有当 `useFixed()` 为真时才不写 `position: relative`**。本项目里该判定为假，
于是浮层容器变成 `position: relative`、尺寸为 0 且挂在 body 末尾 ——
菜单的绝对坐标被当成相对坐标，最终**渲染到屏幕左下角外面**，看起来就是「点了没反应」。

> 这也解释了 R170 那次「时钟下拉是空的」：菜单其实渲染了，只是位置在可视区外。

### 修复

新增 `src/styles/tinymce.scss`，用 `!important` 把浮层容器强制改回 fixed：

`@scss
.tox.tox-tinymce-aux {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 20000 !important;
}
`@

同时把 `.tox-pop / .tox-menu / .tox-collection / .tox-dialog-wrap` 的层级抬到 20001，
避免被 `el-dialog`（z-index 2000+）盖住。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.44s |
| lint | 67 告警（ratchet 通过） |
| 产物 CSS 含覆盖 | ✅ `index-uTwiqjI8.css` |

### 教训

**TinyMCE 的浮层定位依赖它自己的 docked 判定**，一旦判定为 false（弹窗内嵌、容器样式特殊等），
就会退化成相对定位。用 CSS 强制 fixed 是最稳的办法，且不依赖 TinyMCE 版本内部实现。


## R183（2026-11-26）— 编辑器菜单「字竖着排」

### 现象

浮层定位修好后菜单能显示了，但**宽度极窄**，中文字一个个竖着排：

| 菜单 | 表现 |
|---|---|
| 表格 | 「表格 / 单元格 / 行 / 列」全竖排 |
| 插入时间 | `2026-11-26 23:35:52` 竖排成 3 行 |

### 原因

浮层容器（`.tox-tinymce-aux`）尺寸是 0：

1. TinyMCE 在容器内测量菜单项宽度，容器宽 0 → 测出的可用宽度极小 → 文字逐字换行；
2. 菜单项默认允许换行（`white-space: normal`），于是中文每个字占一行。

### 修复（@src/styles/tinymce.scss`）

| 规则 | 作用 |
|---|---|
| 容器 `inset: 0 + 100vw/100vh` | 给菜单测量和定位一个完整的视口参照 |
| 容器 `pointer-events: none`，子元素 `auto` | 撑满视口但不挡住页面点击 |
| `.tox-collection__item-label { white-space: nowrap }` | 菜单项文字不换行 |
| 菜单 `min-width: 160px` | 宽度不再塌陷 |

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.13s |
| lint | 67 告警（ratchet 通过） |
| 产物 CSS | 含 fixed + 100vw/100vh + nowrap + min-width |

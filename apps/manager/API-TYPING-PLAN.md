# api 层返回类型化方案（A 路线）

> 结论先行：**api 层标类型本身不难，难在「返回类型从哪来」。**
> 本轮把方法跑通了，并实测出真正的前置条件。

---

## 一、为什么不能「照感觉标」

实测三次，数字如下：

| 做法 | 结果 |
|---|---|
| 把 `axios` 的 `<T = any>` 默认值改成 `unknown`（api 未标注） | **407 个错误**（全站 `res.result` 变 unknown） |
| 先给 22 个 api 文件、451 个函数按启发式标注（分页→PageRows / 详情→VoRow / 操作→null） | typecheck 0，但**语义错**：与调用方冲突时炸 **207 个错误** |
| 只标订单模块 36 个函数 | **17 个错误** —— 调用方写的是 `ApiResult<AfterSaleNum>`，我猜的是 `OrderCountVO` |

**根因**：调用方**已经在用真实类型**（`.then((res: ApiResult<X>) => …)` 有 169 处），
它们比任何启发式都准。所以正确方向不是「猜」，而是**反推**。

---

## 二、正确方法：从调用方反推

写了个扫描器（`.build-check/r130-map.mjs`），把源码压平后匹配：

```ts
getCategoryTree(...)                       // ← 函数
  .then((res: ApiResult<CategoryNode[]>)   // ← 调用方声明的真实返回类型
```

**识别出 62 个 api 函数的真实返回类型**（完整映射见 `.build-check/api-ret-map.json`）：

| 函数 | 调用方声明的类型 |
|---|---|
| `getCategoryTree` | `CategoryNode[]` |
| `getArticleCategory` | `CategoryNode[]` |
| `getAllPermissionList` | `MenuNode[]` |
| `getCurrentPermissionList` | `MenuDataNode[]` |
| `getDistributionGrades` | `GradeOption[]` |
| `getCustomerRelations` | `PageResult` |
| `getAfterSaleNumVO` | `AfterSaleNum` |
| `getDamageReportItems` | `DamageItem[]` |
| `…` | 共 62 个 |

---

## 三、真正的前置条件：类型还在 .vue 里

把这份映射直接写进 api 层 → **79 个 `Cannot find name`**：

```
src/api/common.ts(5,21): error TS2304: Cannot find name 'RegionNode'.
src/api/distribution.ts(12,35): error TS2304: Cannot find name 'DistributorRow'.
```

因为 `CategoryNode` / `RegionNode` / `MenuNode` / `GradeOption` 这些类型**定义在各自的 .vue 文件里**，
api 层根本 import 不到。涉及的独立类型有 **32 种**（见附录）。

> 所以 A 路线的第一步不是改 api，而是**把 VO 从 .vue 里搬出来**。

---

## 四、落地方案（按模块推进）

### 第 0 步：建 VO 目录

```
src/types/vo/
  common.ts      RegionNode / CategoryNode / MenuNode / PageResult 等跨模块类型
  page.ts        ArticleRow / ArticleDetail / PrivacyArticle
  distribution.ts DistributorRow / GradeOption / RelationRow / RelationLog / PlanForm
  live.ts        LiveDetail / LiveCouponRow / LiveGoodsRow
  procurement.ts BillDetail / DamageDetail / DamageItem / InboundItem
  promotion.ts   FullDiscountDetail / GroupRow / PointsEditForm
  stats.ts       ChartRow / StatsResult / OrderStats / TaskRow
  member.ts      FeedbackDetail / AfterSaleNum
```

### 第 1 步（每个模块一轮）：

1. 把该模块 `.vue` 里的类型**原样搬**到 `types/vo/xxx.ts`（`export interface`）
2. `.vue` 里改成 `import type { ... } from "@/types/vo/xxx"`
3. api 函数加泛型：`getRequest<CategoryNode[]>(...)`
4. 三件套验收（typecheck / build / lint）

> **顺序很重要**：先搬类型（类型值完全不变，零风险），再标 api。
> 上一轮就是跳过了第 1 步，才有 79 个 `Cannot find name`。

### 第 2 步：模块全部完成后

`axios` 的 `<T = any>` 默认值才能安全改成 `unknown`，
那时全站 `res.result` 才算真正类型化（`ANY-AUDIT.md` 里 ① 类 14 处也随之消失）。

---

## 五、收益测算

| 阶段 | 消掉的 `any` | 额外收益 |
|---|---:|---|
| 每完成 1 个模块 | 0（`any` 在 api 层本来就少） | **该模块所有 `.then(res => res.result.x)` 获得真实类型** |
| 32 种类型全部搬完 | 0 | 62 个函数 + 更多可反推的函数可标注 |
| 最终改 `axios` 默认值 | **14** | 全站请求返回值类型化 |

> 所以 A 路线不能用「`any` 数量」衡量，要用「**已标注的 api 函数数**」和
> 「**改默认值时还剩多少错误**」来衡量。建议从下一轮开始，按模块记录这两个数。

---

## 附录：需要搬迁的 32 种类型

```
AfterSaleNum      ArticleDetail     BillDetail        BrandItem
CategoryNode      ChartRow          DamageDetail      DamageItem
DepartmentNode    DistributionDetail FeedbackDetail    FullDiscountDetail
GradeOption       GroupRow          InboundItem       LiveCouponRow
LiveDetail        LiveGoodsRow      MenuDataNode      MenuNode
OrderStats        PageResult        PlanForm          PointsEditForm
PrivacyArticle    RegionNode        RelationLog       RelationRow
StatsResult       TaskRow           DistributorRow    以及若干内联对象字面量
```


---

## 六、当前进度（2026-11-26）

| 项 | 数量 |
|---|---:|
| 已标注 api 函数 | **397 / 604 个调用点（66%，严格口径）** |
| 其中「操作类」用 `<null>` | 249 |
| 其中「分页类」用 `PageRows` | 95 |
| 其中「数组类」用 `VoRow[]` | 39 |
| 跨模块 VO 文件 | **10**（common / page / distribution / procurement / live / misc / seller / member / order / goods） |

### 已知不能靠启发式标的

- `api/other.ts`（装修相关）：返回**数组或对象**混杂，必须逐个看调用方
- 树形接口（`all-children` / `/all`）：返回数组
- 统计接口（`/statistics`）：有的返回数组、有的返回对象


---

## 七、权威清单做法（推荐）

R147 起改用**后端返回类型**做唯一依据：

1. 扫描 `manager-api/controller` 下所有 `@GetMapping`，筛出返回 `ResultMessage<IPage<…>>` 的方法
   → 得到 **94 个确定分页**的 URL
2. 用这批 URL 去匹配前端 `api/*.ts` 的 `getRequest` 调用
3. 命中即标 `PageRows`，再修调用点

> 比「URL 里有没有 page」准得多 —— `/promotion/pintuan`、`/promotion/kanJiaGoods` 这类路径看不出分页，
> 但后端确实是 `IPage`。

### 剩余可继续的方向

- 后端 `ResultMessage<List<…>>` 的接口（返回数组）→ 可标 `XxxRow[]`
- 单实体 `ResultMessage<XxxVO>` → 标 `XxxVO`
- 这两类同样可以扫描后端得到清单


---

## 八、批量化能做到哪、做不到哪（R148 实测）

| 接口类型 | 批量化 | 结果 |
|---|---|---|
| 返回 `IPage` | ✅ | 95 个接口，0 遗留错误 |
| 返回 `List` | ✅ | 39 个接口，16 处调用点小修 |
| 返回单实体 VO | ❌ | 62 个接口 → **99 个错误**，整批回滚 |

**原因**：单实体的调用方是「详情/表单页」，几十个字段逐个读写；
`VoRow` 的索引签名把字段变成 `unknown`，一写就报错。

**结论**：单实体要标，必须**先给该实体建逐字段 VO**（API-TYPING-PLAN 第 1 步），
不能靠批量脚本。这部分工作按模块推进，每个模块 1 轮。

### 当前进度

- 已标注 **351 / 约 490（72%）**
- 剩余约 139 个：主要是单实体（151 个里的 89 个未动）+ `Object/String` 类


---

## 九、单实体的推进节奏（R149 实测）

| 项 | 一个模块的量 |
|---|---:|
| 单实体接口 | 约 6 个 |
| 新建 VO 类型 | 约 9 个 |
| 调用点小修 | 约 5 处 |
| 耗时 | 约 40 分钟 |

剩余约 133 个单实体 → **20+ 轮**。这是「建 VO」的真实成本，无法用脚本压缩。

### 每轮固定流程

1. 在该模块页面里找「返回单实体的接口」对应的本地类型
2. 建 `types/vo/<module>.ts`（字段照搬，**不要精简**）
3. 页面改成 import（删本地定义）
4. api 函数标返回类型
5. 修 3–6 处调用点（多为 `res.result` 可能 undefined / 目标类型更窄）
6. 三件套验收

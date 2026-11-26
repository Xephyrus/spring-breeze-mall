# api 类型化阶段性报告（A 阶段收尾）

> 生成时间：2026-11-26
> 对应台账：`LINT-DEBT.md` R146–R152
> 配套文档：`API-TYPING-PLAN.md`（方法）、`VO-CONTRACTS.md`（已建契约）

---

## 一、结论

| 项 | 数值 |
|---|---:|
| api 函数总数 | **601** |
| 已标返回类型 | **398（66%）** |
| 未标注 | 203 |
| 跨模块 VO 文件 | 10 |
| VO 类型 | 45（全部有使用方，0 未使用） |

**A 阶段到此收尾。** 剩下 34% 的边际成本远高于收益，理由见第四节。

---

## 二、已覆盖的部分（按做法分类）

| 做法 | 覆盖内容 | 数量 |
|---|---|---:|
| 后端权威清单：`IPage` | 所有分页接口，标 `PageRows` | 95 |
| 后端权威清单：`List` | 所有数组返回，标 `VoRow[]` | 39 |
| 操作类批量 | `post/put/delete` 的纯确认接口，标 `<null>` | 253 |
| 下载类批量 | 带 `blob` 参数的导出，标 `<Blob>` | 17 |
| 按模块建 VO | member / order / goods / distribution / procurement / live / page / seller / misc + common | 45 个类型 |

> 前四类是**脚本完成**，最后一类是**人工判断**（每模块约 40 分钟）。

---

## 三、已建 VO 清单（10 个文件 / 45 个类型）

| 文件 | 类型数 | 代表类型 |
|---|---:|---|
| `common.ts` | 6 | `CategoryNode`、`RegionNode`、`DepartmentNode`、`MenuNode`、`PageRows`、`VoRow` |
| `order.ts` | 11 | `OrderDetail`（聚合）、`OrderInfo`、`OrderItemInfo`、`AfterSaleDetail` |
| `member.ts` | 8 | `MemberInfo`、`MemberWallet`、`MemberGradeInfo`、`MemberAddressRow` |
| `distribution.ts` | 6 | `DistributionDetail`、`RelationRow`、`GradeOption` |
| `procurement.ts` | 4 | `DamageDetail`、`DamageItem`、`InboundItem`、`InboundDetail` |
| `live.ts` | 3 | `LiveDetail`、`LiveCouponRow`、`LiveGoodsRow` |
| `goods.ts` | 5 | `GoodsGroupInfo`、`GoodsNumVO`、`OrderOverviewVO` |
| `page.ts` | 3 | `ArticleForm`、`ArticleDetail`、`ArticleRow` |
| `seller.ts` | 2 | `BillDetail`、`BillFlowRow` |
| `misc.ts` | 3 | `BrandItem`、`ChartRow`、`StatsResult` |

字段级明细见 **`VO-CONTRACTS.md`**（自动生成，改代码后重跑 `scripts/gen-vo-contracts.mjs`）。

---

## 四、剩余 205 个为什么不再继续

按类型分类：

| 类别 | 数量 | 为什么价值低 |
|---|---:|---|
| `get-other` | **107** | 多数是「无明确 VO」的杂项 GET：下拉枚举、地区、验证码、站点信息、统计碎片。返回结构简单且页面只取 1–2 个字段，**加类型对防错帮助有限** |
| `write` | **54** | `post/put/delete` 但没有被批量标 `<null>` 的（带特殊参数、返回体被页面使用）。逐个要看调用方，成本高收益低 |
| `detail` | **38** | 单实体详情，**必须建 VO 才能标** —— 每模块约 40 分钟，需要先枚举字段 |
| `upload` | 4 | 上传接口，返回结构由 OSS 决定，页面只取 url |

**成本对比**：

| 继续推进 | 工作量 | 收益 |
|---|---|---|
| 补 38 个 detail（建 VO） | **约 6 轮 × 40 分钟** | 每个模块的详情页字段安全 |
| 补 107 个 get-other | **约 10 轮**，且大多无 VO 可建 | 低 —— 多数会退化成 `VoRow`，等于没加约束 |
| 补 54 个 write | 约 5 轮 | 低 —— 这些页面本来就用返回值做展示，多半已是宽类型 |

**判断**：A 阶段的核心目标（**让「分页 / 数组 / 操作 / 下载」四类接口都有类型**）已经 100% 完成；
剩下的都是「单个实体要逐字段建 VO」的细活，价值真实但**投入产出比明显下降**。

---

## 五、如果以后要继续，按这个顺序

1. **按业务重要性挑 detail**：建议顺序 `setting`（17 缺）→ `promotion`（24 缺）→ `index`（45 缺）
2. 每轮固定流程见 `API-TYPING-PLAN.md` 第九节
3. 每轮结束重跑 `node apps/manager/scripts/gen-vo-contracts.mjs`，让契约文档跟上

---

## 六、这套方法的可复用经验

| 经验 | 出处 |
|---|---|
| **别用「URL 猜类型」，用「后端返回类型」** | R147：`/promotion/pintuan` 路径看不出分页，但后端是 `IPage` |
| **分页/数组能批量，单实体不能** | R148：单实体批量标 62 个 → 99 个错误，整批回滚 |
| **单实体必须先建逐字段 VO** | R149/R150/R152：member 6 个 / order 8 个 / goods 5 个 |
| **调用点几乎都要判空** | `x.value = (res.result?.records ?? []) as unknown as typeof x.value` 是标准写法 |
| **DTO 边界保持宽类型** | `ANY-AUDIT.md`：收窄 DTO 只会把 `unknown` 传染给模板 |
| **脚本补 import 要防重复** | R152：已有 `PageRows` 导入时会插出第二行 |

---

## 七、当前质量门（每轮必过）

```
vue-tsc --noEmit -p tsconfig.app.json      exit 0
vite build                                  exit 0
eslint src --max-warnings 67                exit 0（67 个 any，已在 ANY-AUDIT.md 逐条说明）
```

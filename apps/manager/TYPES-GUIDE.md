# Manager 类型化改造手册（去 anyscript）

> 目标：把「能跑但全是 `any`」的代码，改成**类型即文档**的现代前端。
> 本文是写代码时的约定，配合 [LINT-DEBT.md](./LINT-DEBT.md)（进度台账）看。

## 0. 现状与目标

| 指标 | 现在 | 目标 |
|---|---:|---:|
| `no-explicit-any` | 2270 | < 800 |
| `@ts-nocheck` | 69（装修模块持续递减） | 保持递减 |
| typecheck | 0 错误（strict + strictTemplates） | 必须保持 0 |
| lint ratchet | `--max-warnings 441` | 只能降 |

---

## 1. 五条硬约定

### ① 接口回参必须带类型，禁止 `(res: any)`

```ts
// ✗ 反例
getGoodsList(params).then((res: any) => { data.value = res.result.records; });

// ✓ 正例
getGoodsList(params).then((res: ApiResult<PageResult<GoodsRow>>) => {
  data.value = res.result?.records ?? [];
});
```

`ApiResult<T>` / `ApiPage<T>` 在 [`src/types/api.ts`](src/types/api.ts)。若接口返回结构固定，就该在 `api/*.ts` 里直接声明泛型，让调用方不必再标。

### ② 表格行、表单模型必须具名

```ts
// ✗
const data = ref<any[]>([]);
const form = reactive({ goodsRules: [], storeIds: [] });

// ✓
type GoodsRule = { skuId: string | number; discount?: number | string };
type PaidMemberSettingForm = {
  enabled?: string | number | boolean;   // 控件写回值放宽，见 §2
  goodsRules?: GoodsRule[];
  storeIds?: Array<string | number>;
};
const data = ref<GoodsRow[]>([]);
const form = reactive<PaidMemberSettingForm>({ goodsRules: [], storeIds: [] });
```

**判断标准**：这个名字在页面上被用超过 3 次，就值得一个 `type`。

### ③ 先给「接收者」类型，再让回调自动推断

这是从 [R14 实验](./LINT-DEBT.md) 得到的结论：批量删掉 `(item: any)` 会变成 68 条 `TS7006`。
原因不是标注冗余，而是**接收者本身没类型**。

```ts
// ✗ 删掉标注 → 隐式 any 报错
res.result.map((item: any) => ...)

// ✓ 先给 res 类型，回调零标注
const res = (await getChildRegion(0)) as ApiResult<RegionApiItem[]>;
res.result.map((item) => ...)   // item 自动是 RegionApiItem
```

### ④ `as any` 一律禁止；边界用 `as unknown as X`

```ts
// ✗
(el as any).msSaveBlob(blob, name);
// ✓ 明确告诉读代码的人：这里确实是类型系统覆盖不到的地方
(el as unknown as { msSaveBlob?: (b: Blob, n: string) => void }).msSaveBlob?.(blob, name);

// ✓ Element Plus 的宽松 v-model 边界
lazyLoad: loadData as CascaderProps["lazyLoad"],
```

### ⑤ 模板里禁用 `!` 非空断言

```vue
<!-- ✗ 运行时 null 崩（Main.vue 崩过一次） -->
<span>{{ userInfo!.nickName }}</span>
<!-- ✓ -->
<span v-if="userInfo">{{ userInfo.nickName }}</span>
<span>{{ order?.sn ?? '—' }}</span>
```

---

## 2. Element Plus 控件类型对照表

表单字段按**控件写回值**放宽，否则 v-model 绑定会报「不可赋值」：

| 控件 | 写回类型 | 字段声明 |
|---|---|---|
| `el-input` / `el-select` | `string` | `string`（`clearable` 加 `null`） |
| `el-input-number` | `number \| undefined` | `number \| null`（可选） |
| `el-radio-group` | `string \| number \| boolean \| undefined` | 同上并集 |
| `el-checkbox` | `CheckboxValueType`（`string\|number\|boolean`） | 同上并集 |
| `el-tabs` v-model | `TabPaneName`（`string\|number`） | `ref<TabPaneName>()` 或 `ref<any>` |
| `el-date-picker` | `string[]`（配 `value-format`）或 `[Date,Date]` | `ref<string[]>([])` |
| `el-cascader` | `CascaderValue`（很宽的联合） | 保留 `ref<any>` 并注释原因 |

表格 slot 的 `row` 是 `DefaultRow`，传参给具名函数时用 `row as XxxRow`（这是合法收窄，不是 `as any`）。

---

## 3. 单文件改造 SOP（约 20 分钟/文件）

1. **读一遍文件**，圈出 3~5 个核心概念（行、节点、表单、事件载荷）；
2. 在 `<script setup>` 顶部写 `type`，字段从实际用法反推，**不要照抄后端 DTO**（前端常只需子集）；
3. 替换 `ref<any[]>`、`Record<string, any>`、函数参数 `any`；
4. `vue-tsc` 报错逐条修——**报错就是文档**，它在告诉你「这个字段可能不存在」；
5. 遇到 Element Plus 类型过宽处，按 §2 表格放宽字段，或对边界用具名 `as`；
6. 三件套校验：`vue-tsc && vite build` + `eslint src --max-warnings <当前值>`；
7. 下调 `package.json` 的 `--max-warnings`。

## 4. 已验证的战果（可作为样板）

| 文件 | any 前 → 后 | 关键动作 |
|---|---|---|
| `components/region.vue` | 22 → 2 | `RegionNode` / `RegionApiItem` + `computed<CascaderProps>` |
| `views/sys/role-manage/roleManage.vue` | 42 → 0 | `RoleRow` / `PermissionNode` / `RolePermissionPayload` / `PermTreeExpose` |
| `views/seller/bill/bill.vue` 等 10 个 | 各自清零 | R13 基线修复 |
| 38 个文件 | −107 | `.then((res: any))` → `(res: ApiResult)` |

## 5. 下一步优先队列

| 优先 | 文件 | any | 说明 |
|---|---|---:|---|
| 1 | `components/hotzone` 指令层 | ✅ 已清零（utils + 3 指令 + types） | R16 完成 |
| 2 | `components/lili-dialog/goods-dialog.vue` | ✅ 24 → 1（cascader v-model 处保留） | R17 完成 |
| 3 | `views/sys/user-manage/userManage.vue` | ✅ 37 → 0 | R17 完成 |
| 4 | `views/live/composables/useChat.ts` | ✅ 35 → 0 | R19 完成（最小接口 + 边界断言） |
| 5 | `views/distribution/distributionSetting.vue` | ✅ 41 → 0 | R18 完成 |

> **不建议动**：`utils/md5.ts`（44，位运算）、`libs/util.ts`（44，路由树全链路动态）——
> 泛型化收益小于成本，已在台账记录。

## 6. 为什么不做"全局 disabling"

- 曾尝试批量删 `: any`：95 文件 → 68 条编译错误，**已回滚**；
- 曾尝试 `as unknown` 全局替换：会让错误从编译期挪到运行期，更难查；
- **唯一有效路径是逐文件建模**——慢，但每改一个文件，那个文件就真的被类型保护了。

## 硬规则：类型错误不能用「改值」消除

当报错是 `Type 'string' is not assignable to type 'ApiParams'` 这类**参数类型不匹配**时：

1. 先确认这个参数**运行时是什么**（会不会被拼进 URL、当作 id 用）；
2. 如果是字符串，就**把 API 签名改成 `string | number`**，而不是把字符串包成对象；
3. `as unknown as X` 写在**调用方**（而不是 IO 数据边界）时，几乎一定是错的方向。

反面案例（真实事故）：`getHomeData({ id } as unknown as ...)` → URL 变成
`/other/pageData/[object Object]` → PC 装修整页白屏。

## 行尾处理硬规则

批量改行尾时：**读入统一成 `\n`，写出前判断原文件是否 CRLF 再转**。
绝不对已含 `\r\n` 的字符串再做一次 `\n → \r\n` —— 会产生 `\r\r\n`（双 CR），
导致整个文件行号错乱、模板里多出空行（R120 实际踩到过，566 处）。


# 组件复用报告（B 阶段）

> **本文件是过程记录**（扫描数据 + 每批迁移经验）。
> 收尾结论、剩余页面判定、后续操作步骤见 `COMPONENT-REUSE-STATUS.md`。

> 时间：2026-11-26
> 方式：脚本扫描 346 个视图文件的结构特征，量化重复度后再抽组件

---

## 一、重复度扫描结果

| 重复模式 | 文件数 | 占比 |
|---|---:|---:|
| `el-table` + `:data` 列表 | 137 | 40% |
| **`el-pagination` 分页条** | **95** | **27%** |
| `searchForm` 查询表单 | 79 | 23% |
| `el-dialog` + `el-form` 弹窗表单 | 43 | 12% |
| `type="selection"` 多选列 | 22 | 6% |
| 调用 `resetFields()` 重置 | 15 | 4% |

### 分页的重复度最惊人

| layout | 页面数 |
|---|---:|
| `total, sizes, prev, pager, next, jumper` | 79 |
| `total, prev, pager, next` | 13 |
| `total, sizes, prev, pager, next` | 3 |

其中**属性完全相同的片段有 43 处**，另有 10 处只差回调、5 处只差 layout。

---

## 二、已抽取：`<TablePager>`（本轮交付）

### 组件

`src/components/table-pager.vue`：统一分页条，`v-model:page` / `v-model:size` + `total` / `layout` / `page-sizes`，
并把 `current-change` / `size-change` 透传给页面（**重置页码的时机由页面决定，组件不猜**）。

```vue
<TablePager
  v-model:page="searchForm.pageNumber"
  v-model:size="searchForm.pageSize"
  :total="total"
  @current-change="getDataList"
  @size-change="handleSizeChange"
/>
```

### 落地

| 项 | 数值 |
|---|---:|
| 替换文件 | **92 个** |
| 替换实例 | **109 处** |
| 仍用 `el-pagination`（特殊场景） | 3 处（抽屉/记录页，布局各异） |
| views 代码量 | 3642 KB → **3628 KB**（−14 KB） |

> 单看体积减少不多（每个分页块约 6 行），但**分页行为从此只有一处定义**：
> 以后改「每页条数选项」或「layout」只需改组件，不用碰 92 个文件。

### 顺带修掉的 6 个真实类型错误

组件类型化后（`components.d.ts` 生成），模板里的组件 props 被真正校验，暴露出：

| 文件 | 问题 | 修复 |
|---|---|---|
| `member/list/memberDetail.vue` | `:customer` 写成 `customer`（组件 prop 是 `customStyle`） | `:custom-style` |
| `wap/advertising.vue` | `liliDialog` 的 `:types`（应为 `type`） | `:type` |
| `wap/alertAdvertising.vue` | 同上 | `:type` |
| `statistics/order.vue` | 分页参数 `pageNumber?: number` 传给 `v-model` 需要必填 | 拆出 `StatsQuery`（不含分页）与 `StatsParams`（含分页） |

> 这正是「组件类型化」的额外收益：**以前这些拼错的 prop 是静默失效的**。

---

## 三、为什么没有继续抽「列表页骨架」

`el-table + searchForm + pagination` 看起来该抽成 `<CrudTable>`，但扫描后发现：

| 观察 | 结论 |
|---|---|
| 137 个列表页的列定义、插槽、行内操作各不相同 | 抽成通用组件会变成「配置地狱」，收益低于成本 |
| 79 个 searchForm 的字段差异极大（有的 1 个输入框，有的 8 个 + 级联 + 日期） | 同上 |
| 43 个弹窗表单结构相似但字段/校验各异 | 可抽「表单外壳」（标题/按钮/loading），但收益有限 |

**判断**：分页条是「真正同构」的部分（属性完全一致），抽它稳赚；
列表/表单是「形似神不同」，**不抽**。这也是本轮只做一个组件的原因。

---

## 四、后续可做（按性价比）

| 候选 | 重复度 | 收益 | 风险 |
|---|---|---|---|
| `<FormDialog>`（弹窗外壳：标题 + 确定/取消 + loading） | 43 个弹窗 | 中 | 中（各页按钮文案/宽度不同） |
| `useTablePage()` 组合式（分页状态 + 拉取 + 重置） | 79 个查询页 | 中高 | 中（要改每页的 fetch 函数） |
| `<SearchBar>`（查询区外壳 + 展开/收起） | 79 | 中 | 中（字段插槽化后与现在差别不大） |
| 空状态 / 表格空文案统一 | 137 | 低 | 低 |

> 建议下一轮做 `useTablePage()`：它是「分页 + 查询 + 重置」的完整闭环，
> 能把每页的 `searchForm/pageNumber/pageSize/total/reset` 五件套收敛成一行调用。

---

## 五、验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.60s |
| lint | 67 告警（ratchet 通过） |
| 分页替换 | 92 文件 / 109 处 |
| 组件类型声明 | `src/components.d.ts` 自动生成（含 TablePager） |

> ⚠️ 需要人工确认：随便找 3–5 个列表页，翻页 / 改每页条数 / 带筛选条件翻页，行为应与之前完全一致。


---

## 六、`useTable` 统一分页状态（R160）

### 现状：组合式早就有了，但只有 28 个页面用

`src/utils/useTable.ts` 已经提供 `loading / data / total / searchForm / getDataList / handleSearch / resetSearch / refresh`，
**28 个页面在用**，但仍有 **47 个页面手写**同样的五件套。

### 本轮补充

给 `useTable` 加了两个处理器，配合 `<TablePager>` 直接可用：

```ts
handleCurrentChange(page)   // 翻页
handleSizeChange(size)      // 改每页条数（**页码自动重置为 1**）
```

> 以前每个页面都要自己写 `changePage` / `changePageSize` 两个小函数，
> 而且「改条数时是否重置页码」各页不一致（有的重置、有的不重置）——现在统一在组合式里。

### 迁移两个样板页

| 页面 | 迁移前 | 迁移后 | 减少 |
|---|---:|---:|---:|
| `goods-unit/index.vue` | 244 行 | **222 行** | −22 |
| `goods/group/index.vue` | 378 行 | **345 行** | −33 |

迁移后的写法（两个页面一致）：

```ts
const {
  loading, data, total, searchForm,
  getDataList: getData,
  handleCurrentChange, handleSizeChange,
  handleSearch, resetSearch: handleReset,
} = useTable<XxxRow>(API.getXxxPage, { form: { name: "" }, pageSize: 20 });
```

模板依旧是 `<TablePager v-model:page="searchForm.pageNumber" ... @current-change="handleCurrentChange" @size-change="handleSizeChange" />`
——`useTable` 的 `searchForm` 就是 `reactive({ pageNumber, pageSize, ...form })`，天然兼容。

### 迁移一个页面的固定 6 步

1. 删掉 `const loading / data / total / searchForm` 四件套
2. 换成 `useTable(fetcher, { form, pageSize })`，需要保留旧函数名的用别名
3. 删掉手写的 `getDataList` / `changePage` / `changePageSize` / `handleSearch` / `handleReset`
4. 模板里 `@current-change` / `@size-change` 换成 composable 提供的处理器
5. 删掉 `onMounted(() => getDataList())`（composable 的 `immediate` 负责）
6. 清理不再使用的 import（`onMounted` / `reactive`）

### 收益估算

剩下 45 个页面，按样板页的 −22~−33 行估算：**合计可减少约 1200 行**样板代码，
且「改条数重置页码」这类行为会全站一致。

> 本轮只迁了 2 个做样板（其余页面各自有特殊逻辑：多 tab、自定义排序、批量操作），
> 建议按模块分批迁，每批 5–8 个页面，迁完跑一次 typecheck + 该模块的手测。


---

## 七、按模块批量迁移（进行中）

### 候选分析

脚本分析 45 个「手写分页」页面：

| 类别 | 数量 | 说明 |
|---|---:|---|
| 可迁移（结构清晰） | **16** | 无 tab、无排序、fetcher 明确 |
| 需人工 | 29 | 多 tab 共用 searchForm、`@sort-change`、fetcher 带额外参数 |

### 已迁移（26 个）

| 页面 | 前 | 后 | 减少 |
|---|---:|---:|---:|
| `goods-unit/index` | 244 | 222 | −22 |
| `goods/group/index` | 378 | 345 | −33 |
| `page/feedback/feedback` | 172 | 155 | −17 |
| `procurement/reason/reasonManage` | 217 | 199 | −18 |
| `promotions/pintuan/pintuan` | 234 | 201 | −33 |
| `promotions/coupon/coupon-receive` | 285 | 256 | −29 |
| `promotions/points-goods-category` | 248 | 236 | −12 |
| `promotions/coupon-activity/coupon` | 388 | 361 | −27 |
| `promotions/coupon/coupon` | 644 | 616 | −28 |
| `promotions/pintuan/pintuan-goods` | 653 | 639 | −14 |
| `promotions/seckill/seckill-goods` | 561 | 547 | −14 |

| `logistics/index` | 282 | 270 | −12 |
| `sys/log-manage/logManage` | 143 | 123 | −20 |
| `sys/app-version/appVersion` | 349 | 324 | −25 |
| `seller/shop/shopList` | 320 | 294 | −26 |
| `seller/bill/accountStatementBill` | 211 | 182 | −29 |

| `distribution/distributionGoods` | 462 | 424 | −38 |
| `distribution/distributionOrder` | 386 | 357 | −29 |
| `distribution/distribution` | 1110 | 1085 | −25 |
| `distribution/distributionCustomerRelation` | 677 | 652 | −25 |
| `distribution/distributionCustomer` | 381 | 373 | −8 |
| `member/group/index` | 467 | 439 | −28 |
| `member/point/point` | 708 | 657 | −51 |
| `member/list/index` | 963 | 936 | −27 |
| `order/after-order/afterSale` | 199 | 182 | −17 |
| `order/wechat/SyncLogDrawer` | 88 | 92 | +4（抽屉反而变长，见下） |

合计 **−603 行**，26 个页面的分页/加载/重置逻辑全部收敛到 `useTable`。
全站使用 `useTable` 的页面：**54 个**（迁移前 28 个）。

### 一个诚实的反例：SyncLogDrawer

这个 88 行的抽屉迁完变 **92 行**（+4）。原因是它本来就只有 30 行脚本，
请求序号守卫（`requestSeq`）自己写得已经很紧凑，换成 `useTable` 反而多了一层包装。

**结论**：`useTable` 适合「有分页 + 有筛选 + 有增删改刷新」的列表页；
**单纯只读的小列表（< 100 行）不值得迁**。

### 一页两表的写法（distributionCustomer / member/point）

两套列表各自一个 `useTable`，用解构别名区分，互不干扰：

`@ts
const { loading, data, total, searchForm, getDataList,
  handleCurrentChange, handleSizeChange } = useTable<CustomerRow>(getDistributionCustomerPage, { ... });

const { loading: logLoading, data: logData, total: logTotal, searchForm: logSearchForm,
  getDataList: getLogList, handleCurrentChange: handleLogPageChange,
  handleSizeChange: handleLogSizeChange } = useTable<LogRow>(getDistributionBindLogPage, {
  // 日志 tab 首次切过去才加载（保持原行为）
  immediate: false,
});
`@

> 关键：第二个表用 `immediate: false`，否则进页面就会多发一次请求。

**已清空的模块**：promotions（7）、seller（2）、logistics（1）、distribution（4/5）、sys（2/3）。

### 通用 codemod 试过，不可行

写了 `codemod-useTable.mjs`（分析 searchForm / data / total / fetcher 后自动改写），
在 4 个候选页 dry-run：**4 个全部 SKIP**。原因是各页的状态声明顺序、命名、
fetcher 调用形态差异太大，脚本判定不可靠。**改为逐页手工迁移**（每页 10–15 分钟）。

### 迁移时容易踩的 3 个点

1. **模板处理器名字**：各页写的是 `changePage` / `getDataList` / `handleSearch` 不等，
   迁移后必须统一改成 `handleCurrentChange` / `handleSizeChange` ——
   否则 v-model 能翻页但不会重新拉数据。
2. **未使用的解构变量**：有些页面迁完后 `getDataList` 没人用（首屏由 immediate 负责），
   从解构里删掉，否则 lint 报 `no-unused-vars`。
3. **别名保留**：页面内部还会调 `getData()`（新增/删除后刷新），迁移时用
   `getDataList: getData` 别名，避免改动所有调用点。

### 剩余 41 个的建议

按模块分批，每批 4–6 个页面，每批结束跑 typecheck + build + 该模块手测。
优先做结构清晰的（promotions / sys / seller 三个模块约 12 个）。


### 三个钩子怎么用（实战）

迁移带特殊逻辑的页面时，`useTable` 的三个选项正好够用，不必退回手写：

| 场景 | 钩子 | 例子 |
|---|---|---|
| 请求前要转换参数（日期区间 → 时间戳） | `beforeRequest` | `pintuan` / `coupon-receive` 把 `selectDate` 转成 `startTime/endTime` |
| 返回后要加工列表（递归排序、字段映射） | `resolve` | `points-goods-category` 按 `sortOrder` 递归排序 |
| 请求成功后要同步别的状态 | `onSuccess` | 需要额外统计数字时 |

示例（`pintuan.vue`）：

`@ts
const { loading, data, total, searchForm, getDataList,
  handleCurrentChange, handleSizeChange, handleSearch } = useTable<PintuanRow>(getPintuanList, {
  form: { sort: "createTime", order: "desc", promotionName: "", promotionStatus: "" },
  pageSize: 20,
  beforeRequest: (params) => {
    const range = selectDate.value;
    if (range && range[0] && range[1]) {
      params.startTime = new Date(range[0]).getTime();
      params.endTime = new Date(range[1]).getTime();
    } else { params.startTime = null; params.endTime = null; }
    return params;
  },
});
`@

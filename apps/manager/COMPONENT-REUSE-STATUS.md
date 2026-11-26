# 组件复用阶段性报告（B 阶段收尾）

> 时间：2026-11-26
> 关联台账：`LINT-DEBT.md` R159–R167
> 过程文档：`COMPONENT-REUSE.md`（扫描数据 + 每批经验）

---

## 一、结论

| 项 | 结果 |
|---|---:|
| 抽取的公共组件 | **1 个**（`<TablePager>`） |
| 统一的分页/查询逻辑 | **`useTable` 组合式**（改造后覆盖 54 个页面） |
| 分页条替换 | **92 文件 / 109 处** |
| 迁移到 `useTable` 的页面 | **26 个**（净减 **603 行**） |
| 使用 `useTable` 的页面总数 | 28 → **54** |
| 全站视图文件 | 346 |

**核心判断**：列表页里真正「同构」的只有**分页条**和**分页状态**，其余（列定义、查询字段、行内操作）是「形似神不同」，**不该抽**。

---

## 二、抽了什么，为什么

### 1. `<TablePager>`（92 文件 / 109 处）

| 证据 | 数值 |
|---|---:|
| 带 `el-pagination` 的页面 | 95 |
| **属性完全相同的片段** | **43 处** |
| 只差回调 / layout 的 | 10 / 5 |

→ 这是唯一「真正同构」的部分，替换后分页行为**只有一处定义**。

### 2. `useTable` 统一分页状态（26 个页面迁移）

`useTable` 原本就存在（28 个页面在用），本轮：
- 补了 `handleCurrentChange` / `handleSizeChange`（后者**重置页码**）
- 把 26 个手写七件套的页面迁过去

### 3. 没抽「列表页骨架」的原因

| 观察 | 结论 |
|---|---|
| 137 个列表页的列定义、插槽、行内操作各不相同 | 抽成 `<CrudTable>` 会变成配置地狱 |
| 79 个 searchForm 字段差异极大（1 个输入框 vs 8 个 + 级联 + 日期） | 同上 |
| 43 个弹窗表单结构相似但字段/校验各异 | 可抽外壳，收益有限 |

---

## 三、迁移过程沉淀的 6 条经验

| # | 经验 | 出处 |
|---|---|---|
| 1 | **通用 codemod 不可行**：各页状态声明顺序/命名/fetcher 形态差异太大（4 个候选 dry-run 全部 SKIP） | R161 |
| 2 | **模板处理器必须改名**：`changePage`/`getDataList`/`handleSearch` → `handleCurrentChange`/`handleSizeChange`，否则**能翻页但不重新拉数据** | R161 |
| 3 | **`beforeRequest` 是万能入口**：日期区间、trim、空值删除、布尔转换、固定参数都能塞进去 | R162/165/166 |
| 4 | **`resolve` 处理返回加工**：递归排序、行字段改写（switch/standBy） | R162/164 |
| 5 | **`onSuccess` 处理副作用**：勾选回显、异步补齐会员数 | R160/166 |
| 6 | **`immediate: false` 用于「切到 tab 才加载」**：第二张表、抽屉列表必须显式关掉 | R166/167 |

### 另外两个坑

| 坑 | 后果 | 修法 |
|---|---|---|
| `onMounted` 里读 `route.query` 再赋值 | **immediate 抢跑**，第一次请求不带参数 | 值必须放进 `form` 初值 |
| 两参接口（`getXxx(id, params)`） | 类型不匹配 | `useTable((params) => getXxx(id, params))` |

---

## 四、一个诚实的反例

**`order/wechat/SyncLogDrawer.vue` 迁完从 88 行变成 92 行（+4）。**

它只有 30 行脚本、自带 `requestSeq` 竞态守卫，迁到 `useTable` 后反而多了一层包装。

**判定规则**：`useTable` 适合「有分页 + 有筛选 + 有增删改刷新」的列表页；
**只读小列表（< 100 行脚本）不值得迁**。

---

## 五、剩余 28 个页面的判定

| 分类 | 数量 | 判定 | 理由 |
|---|---:|---|---|
| A. 只读小列表（< 150 行） | **2** | ❌ 不迁 | 参照 SyncLogDrawer 反例 |
| B. 多 tab 页面（≥ 150 行） | **15** | ⚠️ 可迁，收益递减 | 每页 10–15 分钟，单页约 −15~−30 行 |
| C. 带 `@sort-change` | **3** | ⚠️ 需人工 | 排序逻辑要单独处理 |
| D. 其它（含 ossManage 1389 行） | **8** | ❌ 暂不迁 | 复杂度过高，风险 > 收益 |

### A 类（不迁）

- `procurement/inventory-count/detail.vue`（106 行）
- `wx-channel/components/WxChannelsGoodsTab.vue`（135 行）

### B 类（可迁，按性价比排序）

| 页面 | 行数 | 备注 |
|---|---:|---|
| `promotions/live/live.vue` | 162 | 最小，先做 |
| `page-decoration/wap/wapList.vue` | 219 | |
| `page-decoration/floorList.vue` | 231 | |
| `promotions/lottery/LotteryManage.vue` | 221 | |
| `seller/bill/bill.vue` | 261 | |
| `promotions/seckill/seckill.vue` | 282 | |
| `sys/slider/slider.vue` | 291 | |
| `live/list.vue` | 351 | |
| `order/after-order/afterSaleOrder.vue` | 410 | |
| `sensitive-words/index.vue` | 463 | |
| `order/order/orderList.vue` | 612 | |
| `promotions/gift-card-cash/gift-card-cash-batch-credentials.vue` | 619 | |
| `goods/virtual-sales/index.vue` | 639 | |
| `sys/message/messageTemplate.vue` | 868 | |
| `statistics/order.vue` | 904 | 最大 |

### C 类（需人工）

`promotions/kanjia/kanjia-activity-goods.vue`、`sys/role-manage/roleManage.vue`、`sys/user-manage/userManage.vue`

### D 类（暂不迁）

`sys/oss-manage/ossManage.vue`（1389 行）、`promotions/gift-card-cash/gift-card-cash-activity.vue`（687 行）、
`page/article-manage/articleList.vue`、`promotions/full-discount/full-discount.vue`、
`promotions/points-goods/PointsCouponManage.vue`、`statistics/goods-comparison.vue`、
`wx-channel/components/WxChannelsOrderTab.vue`、`wx-channel/components/WxChannelsRefundTab.vue`

---

## 六、如果以后要继续

### 单个页面的迁移步骤（照抄即可）

1. 状态声明 → `useTable(fetcher, { form, pageSize })`，`data` 若叫别的名字用 `data: 别名`
2. 删掉手写 `getDataList` / `changePage` / `changePageSize` / `handleSearch` / `handleReset`
3. 特殊逻辑按需搬到 `beforeRequest` / `resolve` / `onSuccess`
4. 模板处理器 → `handleCurrentChange` / `handleSizeChange`
5. 删掉 `onMounted` 里的手动加载（`immediate` 负责）
6. 清理未使用导入与不再使用的 `type XxxSearchForm`

### 每批的验证

```bash
cd apps/manager
node_modules/.bin/vue-tsc.cmd --noEmit -p tsconfig.app.json
node --max-old-space-size=3072 node_modules/vite/bin/vite.js build
node_modules/.bin/eslint.cmd src --max-warnings 67
```

### 验收口径

`eslint` 的 `no-unused-vars` 是**最有效的信号**：迁移后如果冒出未使用变量，
说明状态声明/函数删除不干净，必须清掉再进下一批。

---

## 七、B 阶段总览（收尾）

| 项 | 成果 |
|---|---|
| antv/g2 懒加载 | 590 KB 退出首页首屏 |
| tinymce 6.4.2 → 8.11.0 + 懒加载 | 首屏 −405 KB，dist −6.2 MB |
| element-plus 按需引入 | JS 1,049 → 845 KB（−204 KB） |
| `<TablePager>` | 92 文件 / 109 处 |
| `useTable` 迁移 | 26 个页面，−603 行 |
| i18n | 实测判定不做（全站只有 6 处 `$t(`） |

**首屏**：约 1.9 MB → **约 1.05 MB**
**dist**：18.6 MB → **12.3 MB**

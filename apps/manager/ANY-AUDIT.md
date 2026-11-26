# `any` 存量审计（67 处）

> 生成时间：2026-11-26（R129）
> 背景：`no-explicit-any` 从 2647 降到 **67**，剩下的每一处都**不是漏改**，而是有意保留的边界。
> 本文逐条说明「为什么留着」以及「什么情况下才该动它」。

---

## 一、分类总览

| 类别 | 数量 | 是否建议继续收 |
|---|---:|---|
| ① 请求层泛型默认值 | 14 | ❌ 不建议（改动会波及 700+ 调用点） |
| ② 后端 DTO / 装修模型对象 | 38 | ⚠️ 视后端契约而定，多数应保留 |
| ③ 被编辑器组件占据 | 8 | ❌ 按约定不动（`components/editor`） |
| ④ 框架/回调参数无法收窄 | 4 | ❌ 技术限制 |
| ⑤ 页面模型工厂 | 3 | ❌ 与 ② 同理 |

---

## 二、逐条说明

### ① 请求层泛型默认值（14 处）

| 文件 | 位置 | 说明 |
|---|---|---|
| `libs/axios.ts` | `getRequest` / `postRequest` / `putRequest` / `deleteRequest` / `importRequest` / `uploadFileRequest` / `getRequestWithNoToken` / `postRequestWithNoToken` / `postRequestWithNoTokenData` / `postRequestWithNoForm` / `putRequestWithNoForm`（11） | `<T = any>` |
| `types/api.ts` | `ApiParams` / `ApiResult<T = any>` / `ApiPage<T = any>`（3） | 同上 |

**为什么保留**：这是**可选泛型参数**的默认值。改成 `unknown` 后，所有未显式标注
`getRequest<T>()` 的调用点都会立刻报「`res.result` 是 unknown」——**实测 407 个错误**。

**正确做法**：不是改默认值，而是**逐个 api 函数标注返回类型**（`Promise<ApiResult<XxxVO>>`）。
这件事按模块推进才有意义；`api/*.ts` 里已有相当一部分标了，未标的部分就是这块债的本体。

### ② 后端 DTO / 装修模型对象（38 处）

| 文件 | 数量 | 对象是什么 |
|---|---:|---|
| `orderDetail.vue` | 7 | 订单详情（订单主体 / 日志 / 商品行 / 发票） |
| `config.ts` | 3 | 页面模型工厂的入参（决定返回结构） |
| `ComponentConfigPanel.vue` | 3 | 装修组件 + 其 `componentStyle` |
| `afterSaleOrderDetail.vue` | 3 | 售后详情（物流 / 售后单 / 商家留言） |
| `config-panel/index.vue` | 2 | `PanelRowLike` / `PanelComponentLike` |
| `modelFormItem.vue` | 2 | 装修 `element` / `data` |
| `shopDetail.vue` | 2 | 店铺详情 |
| `goods-review/index.vue` | 2 | 评价详情 + 评价行 |
| `useTable.ts` | 2 | 表格通用表单（`TableForm`） |
| `coupon-publish.vue` | 1 | 优惠券详情（比表单宽） |
| `purchase-order/detail.vue` | 1 | 采购单详情 |
| `video-config.vue` | 1 | 视频楼层配置项 |
| `tpl_hot_area.vue` | 1 | 热区楼层 `res` |
| `theme-setting.vue` | 1 | 主题设置表单 |
| `modelForm.vue` | 1 | 装修表单 `data` |
| `goods.vue` | 1 | 商品行 `GoodsRow` |
| `goodsDetail.vue` | 1 | 商品详情 |
| `modelList/*.vue`（8 个） | 8 | 各楼层 `data`（装修模型） |
| `kanjia-activity-edit-goods.vue` | 1 | 商品 sku |
| `renovation.vue` | 1 | 表单组件实例（有业务字段 `navList` / `topAdvert`） |

**为什么保留**：这些对象的字段**由后端契约 + 模板共同决定**，且后端会扩容。
R93/R95/R101/R110/R119/R124/R126 共 **8 次**把它们收成 `Record<string, unknown>` 后，
每次都立刻炸出 10~74 个「模板读写 unknown」错误 —— 说明「宽类型」在这里是正确的边界选择。

**何时该动它**：当后端给出 OpenAPI / 明确的 VO 定义，或该对象只被一个模块消费、
字段可以完全枚举时。届时用**逐字段接口**替换（参考 `wap/video-style.ts` 的 `VideoItem`）。

### ③ 编辑器组件（8 处）

`components/editor/index.vue` —— 按约定**本轮不动**（富文本编辑器涉及 vendor 集成）。

### ④ 框架/回调参数无法收窄（4 处）

| 文件 | 说明 |
|---|---|
| `gift-card-cash-records.vue` | `watch(() => route.query.activityId, (id: any) => …)` —— vue-router 的值类型 `LocationQueryValue \| LocationQueryValue[]` 与 `watch` 重载签名不兼容，试过 `string \| number`、`string \| string[] \| null` 都报 TS2769 |
| `orderDetail.vue` | `parseSpecs` / `parseFormAnswerGroups` —— 入参是「JSON 文本 / 对象 / 数组」混合体，收严只会把 `instanceof` 判断推给调用方 |
| `orderDetail.vue` | `bars` 进度条数组 —— 元素带 `x` / `width` / `label` 等布局字段，由多个分支拼装 |

### ⑤ 页面模型工厂（3 处，已含在 ②）

`config.ts` 的 `createRow` / `createComponent` + `components: any[]`：这些函数的**返回结构
直接决定页面模型类型**，收窄参数会立刻与 `PcRow.components` 不兼容（实测 8 处错误）。

---

## 三、如果要把这 67 处也消掉，需要做什么

| 步骤 | 工作量 | 收益 |
|---|---|---|
| 给 `api/*.ts` 全部函数标注返回类型 | 大（400+ 函数） | 能消掉 ① 的 14 处，**并让全站 `.then(res => res.result.x)` 真正类型安全** |
| 给后端 DTO 建 VO 类型（按模块） | 中大 | 能消掉 ② 的 38 处，但需要后端契约稳定 |
| 编辑器组件类型化 | 中 | 8 处（当前按约定不做） |
| 框架回调的特殊处理（eslint-disable + 说明） | 小 | 4 处，属「已知限制」 |

> 结论：**67 是当前架构下的诚实下限**。再往下压，正确的路径是「补 api 层类型 + 后端 VO」，
> 而不是把这些 `any` 换皮成 `Record<string, unknown>` 或加 eslint 注释。

# Manager 前端 lint / 类型 遗留清单（业务驱动版）

> 配套文档：[LINT-DEBT.md](./LINT-DEBT.md)（台账）｜[TYPES-GUIDE.md](./TYPES-GUIDE.md)（类型化手册）｜[PAGE-DECORATION-PLAN.md](./PAGE-DECORATION-PLAN.md)（装修模块三期方案）
> 当前状态：`lint` 0 error / **67** warning，`vue-tsc`（strict + strictTemplates）0 错误，`vite build` 通过；`@ts-nocheck` **80**。

## 1. 还剩什么

| 规则 | 条数 | 性质 |
|---|---:|---|
| `@typescript-eslint/no-explicit-any` | 2256 | 主要是动态数据结构（表格行、表单模型、接口回参、图表 option） |
| `vue/no-mutating-props` | 80 | 装修面板的「父传对象、子直接改」设计（P4，未启动） |
| `@typescript-eslint/ban-ts-comment` | **0** | 即 69 个文件的 `// @ts-nocheck` |
| `vue/no-side-effects-in-computed-properties` | 2 | computed 里赋值（P5，未启动） |

`any` 的分布：`views` 3756 · `components` 356 · `utils` 89 · `libs` 77 · 其余 21。

## 2. 为什么建议「业务驱动」而不是继续刷数字

实测过的三条结论：

1. **同一目录内的错误密度差 5~10 倍**（`views/live` 里 `detail.vue` 3 条、`control-panel.vue` 16 条），批量切目录会让批次失败率很高；
2. **通用模式只能吃掉约一半**：`ref({...})` 泛型、`map` 类型、`params` 宽松、`confirm loading`、`TabPaneName`、`date-picker` 这 6 类能批量；剩下的（递归返回类型、`FileReader.result` 联合类型、`getCurrentInstance().proxy` 可空、`number | null` 语义）每处都要单独判断；
3. **`row: any` 的收敛与文件迁移强耦合**：给表格行建接口后必须靠 `vue-tsc` 校验字段，而文件仍是 `@ts-nocheck` 时改了无法验证，属于假收敛。

所以：**按业务改动驱动**，改哪个页面就顺手把那个文件迁移完，比专门刷数字有效。

## 3. 剩余文件清单（按剩余 `@ts-nocheck` 数量）

| 目录 | 文件数 | 说明 |
|---|---:|---|
| `views/page-decoration`（wap 38 / modelList 11 / pc 6 / 其他） | 59 | 装修面板，P4 的主战场，建议与 `vue/no-mutating-props` 一起做 |
| `views/promotions` | 4 | 营销（砍价 / publish / payment-success 仍高密） |
| `views/sys` | 4 | 系统设置（oss / SMS_SETTING / platform / notice；menu 双生已迁） |
| `views/goods` | 5 | 商品（R12 已迁 brand/category；参数编辑、goods 等仍重） |
| `views/order` | 4 | 订单（R12 已迁 afterSaleOrder；Detail/List 等仍重） |
| `views/member` | 4 | 会员（memberDetail、paid/settings 最重） |
| 其余（seller 2） | 2 | shopDetail / shopOperation 仍高密 |

## 4. 单个文件的处理清单（SOP）

```
1. 快照：robocopy apps\manager\src .build-check\snap-<name> /E
2. 摘掉该文件 <script setup lang="ts"> 后的 // @ts-nocheck
3. 跑 vue-tsc，拿到该文件的错误
4. 先套 6 个通用模式：
   · const x = ref({...})            -> ref<Record<string, any>>({...})
   · const map = {...} / : Record<string,string>  -> 标签色 map 用联合类型
   · params / searchForm 字面量      -> Record<string, any>
   · ElMessageBox 的 loading 字段    -> 删掉（ConfirmOptions 不支持）
   · el-tabs 的 v-model              -> ref<any>("...")
   · el-date-picker 的 default-time  -> ref<any>([...])
5. 剩下的逐条修（每个文件通常 0~6 条）
6. 若该页有表格：定义 XxxRow 接口，把 row: any 换掉（一次能消 5~20 处）
7. 校验三件套：
   vue-tsc --noEmit -p tsconfig.app.json && vite build
   eslint src --max-warnings <当前 ratchet>
8. 更新 package.json 的 --max-warnings 与 LINT-DEBT.md 的阶段表
```

## 5. 三条硬约束（血的教训）

1. **绝不删 `defineProps` / `defineEmits` / `defineExpose` / `defineOptions`**——即使本地绑定没人用，它也是组件契约（删过一次 `defineEmits(["selected"])`，父组件立刻报错）；
2. **多声明符不能整行删**（`let timer, flag;` 只有 `timer` 未使用时，删整行会让 `flag` 消失）；
3. **标识符改名要检查字符串**（`emit("selectedLink")` 里的字符串被一起改过，导致 emit 名失配）。

## 6.5 P4 试点方案（`vue/no-mutating-props`，738 条）

**试点文件**：`views/page-decoration/pc/config-panel/PanelTopBar.vue`（12 处告警）

已定位的问题形状（本轮实测）：

```ts
// PanelTopBar.vue L212-232：computed 里给 props.options 补默认值（10 处写入）
const localOptions = computed(() => {
  if (!props.options) return {};
  if (props.options.welcomeText === undefined) props.options.welcomeText = '欢迎来到商城';
  ...
  if (!props.options.textColor) props.options.textColor = '#4b5563';
  return props.options;
});
// 模板另有多处 v-model="localOptions.xxx"，写入同样落到 props.options
```

**改造设计**（需与父组件同改）：

1. `PanelTopBar`：`props.options` 改为只读，内部持 `const local = reactive({ ...DEFAULTS, ...props.options })`；
   `localOptions` 退化为 `computed(() => local)`；模板 `v-model="local.xxx"` 不变（只是写到本地副本）。
2. 新增 `emit('update:options', { ...local })`，用 `watch(local, ..., { deep: true })` 触发。
3. 父组件（`pc/index.vue` 里 `resolveCanvasTemplate` 的渲染处）改为
   `:options="comp.options" @update:options="(v) => Object.assign(comp.options, v)"`。
4. **关键风险**：回写会让 props 变化 → 若 `local` 用 `watchEffect` 从 props 重建，会形成
   「props → local → emit → props」的循环。必须让 `local` **只在挂载时初始化一次**，
   后续只单向 `local → parent`。

**为什么本轮不动它**：这条链路（`pc/index.vue` 的 `component :is` 动态渲染 + 装修 JSON 持久化）
没有测试覆盖，改错会直接影响页面保存结果；且需要同时验证「新建页面 / 编辑已有页面 / 切换组件」
三条路径。建议单独开一轮，按「改 PanelTopBar → 改父组件 → 手测三条路径 → 跑 typecheck/build」推进。

试点成功后，剩余 ~40 个面板可套用同一模式（每个面板 5~20 处写入），预计 4~6 轮完成。

| 文件 | 原因 |
|---|---|
| `utils/md5.ts`（44 条 `any`） | 位运算算法，泛型化后内部处处要断言，收益小于成本 |
| `libs/util.ts`（45 条） | 路由/菜单树全链路动态，同理 |
| `utils/index.ts` 的 `cloneObj` | 深拷贝必须拆类型，`cloneObj<T>(obj: T): T` 实测引入 12 条新错误 |
| `views/page-decoration`（59 文件） | 与 `vue/no-mutating-props` 强耦合，应作为一个整体设计改造，而不是逐个加类型 |

## 7. 已完成的部分（供参考基线）

| 阶段 | 成果 |
|---|---|
| P1 | `no-unused-vars` 221 → 0；`no-unused-expressions` 13 → 0；顺带修 4 个真实 bug |
| P2（收窄版） | `@ts-nocheck` 182 → **82**（轻文件 + R8–R12 边缘清零；摘 nocheck 须同文件收敛 any） |
| P3 | `no-explicit-any` 持续下降；真类型化带动 lint **5138→…→3942→3699** |
| P5 部分 | `vue/no-side-effects-in-computed-properties` 保留 12 条待改 `watchEffect` |

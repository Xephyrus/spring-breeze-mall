# 装修模块（page-decoration）类型化与 props 改造方案

> 现状：**144 个文件 / 50750 行 / 59 个 `@ts-nocheck` / 732 处 `any` / 256 处 `props.x = ...`**
> 这是 manager 里最后一块大规模技术债，也是唯一「改一次、多个页面受益」的模块。

## 1. 为什么不能像其他页面那样逐个文件改

其他页面（roleManage / userManage / distributionSetting）都是「表格 + 表单 + 弹窗」的自包含结构，
在文件内部加类型就完事。装修模块不是：

```
pc/index.vue ──(动态 :is)──▶ config-panel/*.vue ──(v-model)──▶ props.options 直接改
wap/decorate.vue ──────────▶ template/tpl_*.vue ──(只读)────▶ props.res
                                              │
                                    li_setting / li_page_data 里的 JSON
```

两个结构性问题：

1. **子组件直接改父组件传下来的对象**（256 处 `props.x = ...`，共 738 条 `vue/no-mutating-props`）。
   父组件拿到的就是后端 JSON 对象本身，子组件一改，全局状态跟着变——这是能"正常工作"的原因，也是类型完全失效的原因。
2. **组件配置是自由 JSON**（`type: 'tpl_banner'` + 任意字段），没有 schema，`any` 是唯一能描述它的类型。

所以类型化必须先定型、再改数据流，顺序反了会做两遍。

## 2. 目标架构

### 2.1 一份共享类型

新建 `views/page-decoration/types.ts`：

```ts
/** 装修画布上的一个组件（后端 JSON） */
export type DecorateComponent<T extends object = Record<string, unknown>> = {
  /** 组件唯一 id */
  id?: string | number;
  /** 组件类型，等于模板文件名：tpl_banner / tpl_cube ... */
  type: string;
  /** 面板展示名 */
  name?: string;
  /** 组件自身配置 */
} & T;

/** 组件列表（一个页面的装修数据） */
export type DecorateComponents = DecorateComponent[];
```

### 2.2 props 约定：只读 + 事件回写

```vue
<!-- 现在：子组件直接改 -->
const props = defineProps<{ options: Record<string, any> }>();
props.options.welcomeText = "欢迎来到商城";

<!-- 目标：只读 + 事件 -->
const props = defineProps<{ options: TopBarOptions }>();
const emit = defineEmits<{ "update:options": [patch: Partial<TopBarOptions>] }>();
emit("update:options", { welcomeText: "欢迎来到商城" });
```

父组件统一挂 `@update:options="(patch) => Object.assign(comp.options, patch)"`。
**注意**：父组件回写会触发 props 变化，所以子组件**不能**用 `watchEffect` 从 props 重建本地副本，
只能在 `onMounted` 初始化一次，之后单向 `local → emit → parent`，否则会打成死循环。

### 2.3 模板组件（wap/template/tpl_*.vue）

这类组件**只读不写**，改造简单得多：给 `res` 一个具名类型即可，不需要事件。

```vue
<script setup lang="ts">
import type { WapTemplateRes } from "../../types";
defineProps<{ res: WapTemplateRes & { list?: Array<{ title?: string; img?: string }> } }>();
</script>
```

## 3. 分三期

### 第一期：定型 + 只读模板（低风险，可增量）

| 动作 | 范围 | 收益 |
|---|---|---|
| 新建 `types.ts` | 1 文件 | 后续所有文件共用 |
| 类型化 `cubeStyle.ts`（3 处 any） | 1 文件 | 6 个方形模板共用 |
| 逐个给 `tpl_*.vue` 加 `res` 类型、删 `@ts-nocheck` | wap 68 + pc 53 | 每个文件 5~15 分钟 |

这一期**不改任何数据流**，只在「只读模板」上加类型，风险近似为 0。

### 第二期：面板 props 改造（高风险，需手测）

按面板分小批（每批 3~5 个），每个面板：

1. 定义 `XxxOptions` 类型（字段从模板用法反推）；
2. `props.options` 改只读，新增 `emit("update:options", patch)`；
3. 父组件（`pc/index.vue`、`wap/decorate.vue`）加 `@update:options` 处理；
4. 手测三条路径：**新建组件 / 编辑已有组件 / 切换组件后回来**。

### 第三期：收尾

- 删除装修模块全部 `@ts-nocheck`；
- 在 `eslint.config.js` 里把 `vue/no-mutating-props` 从 warn 升到 error；
- 下调 ratchet。

## 4. 第一期已验证的样板

`tpl_spike` / `tpl_group` / `tpl_flex_two` / `tpl_left_one_right_two` / `tpl_left_two_right_one` /
`tpl_top_one_bottom_two` / `tpl_top_two_bottom_one` / `tpl_text_picture` /
`tpl_title` / `tpl_video`（共 10 个）已完成：

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

顺带把 `res.list[0]` 这种**会在数据缺失时崩**的写法换成可选链——类型化的副产品是真实的健壮性提升。

## 5. 风险与验证

| 风险 | 说明 | 缓解 |
|---|---|---|
| 面板改 props 后配置丢失 | 父组件没接 `update:options`，改的值不落盘 | 每批改完立刻手测「保存 → 刷新 → 回显」 |
| 本地副本与 props 循环 | `watchEffect` 从 props 重建 + emit 回写会死循环 | 只用 `onMounted` 初始化一次 |
| 旧数据缺字段 | 后端 JSON 里字段可能不存在 | 类型字段全部可选 + 默认值兜底（现有 `DEFAULT_FORM` 模式） |
| 一次改太多 | 144 个文件里任何一个错都难定位 | **每批不超过 5 个文件** |

## 6. 不做的事

- **不给自由 JSON 强建 schema**：`tpl_*` 的配置本来就随业务演化，硬编码联合类型会天天改类型；
  用「具名类型 + 索引签名」描述它，比精确建模更可持续。
- **不动 `modelList/`**：那是组件库定义（16 个文件），由 `modelConfig.ts` 统一驱动，改造应放在第二期之后。

---

## 7. 第二期试点方案（✅ 代码已完成，待手测）

### 7.1 试点结果（2026-11-24 完成）

- `PanelTopBar.vue`：`props.options` 直改 **10 → 0**，模板零改动；
- `config-panel/index.vue`：接住 `@update:options`，就地合并；
- 连带效果：`no-mutating-props` 738 → 728、`side-effects-in-computed` 12 → 2、`any` −12。

#### 试点对象：`pc/config-panel/PanelTopBar.vue`（10 处直改）

选它的理由：字段少（8 个）、结构简单（纯表单）、面板在 PC 端首页顶部，手测路径最短。

### 7.2 现状（问题形状）

```ts
// PanelTopBar.vue
const props = defineProps({ options: { type: Object, default: () => ({}) } });

// ① computed 里给 props 补默认值（10 处写入）
const localOptions = computed(() => {
  if (!props.options) return {};
  if (props.options.welcomeText === undefined) props.options.welcomeText = "欢迎来到商城";
  ...
  return props.options;
});

// ② 模板里 v-model 直接写到 props 上
<el-input v-model="localOptions.welcomeText" />
```

### 7.3 目标写法

```ts
// PanelTopBar.vue
type TopBarOptions = {
  welcomeText?: string;
  loginText?: string;
  loginUrl?: string;
  registerText?: string;
  registerUrl?: string;
  userCenterUrl?: string;
  logoutText?: string;
  textColor?: string;
  fontSize?: number;
  rightMenus?: Array<{ title?: string; url?: string }>;
};

const props = defineProps<{ options: TopBarOptions }>();
const emit = defineEmits<{ "update:options": [patch: Partial<TopBarOptions>] }>();

// 本地副本：只在挂载时用 props 初始化一次，之后单向 local -> emit -> parent
const local = reactive<TopBarOptions>({ ...DEFAULTS, ...props.options });
watch(local, () => emit("update:options", { ...local }), { deep: true });
```

模板保持不变（`v-model="local.xxx"`），只是写的是本地副本。

### 7.4 父组件改动

`pc/index.vue` 里动态渲染面板处（约 L326）：

```vue
<component
  :is="resolveCanvasTemplate(comp.type)"
  :component="comp"
  :options="comp.options"
  @update:options="(patch) => Object.assign(comp.options, patch)"
/>
```

### 7.5 ⚠️ 必须避开的死循环

```ts
// ✗ 错误：watchEffect 从 props 重建 local，会与 emit 回写形成闭环
watchEffect(() => Object.assign(local, props.options));

// ✓ 正确：只用 props 做初始值
const local = reactive({ ...DEFAULTS, ...props.options });
```

父组件 `Object.assign(comp.options, patch)` 会改变 `props.options` 的**内容**（同一对象），
但因为 `local` 不是从 props 派生的，不会反向触发，所以是安全的。
若将来父组件改成「替换整个对象」（`comp.options = patch`），则需要在子组件里
`watch(() => props.options, ...)` 同步，但要加值相等判断避免回环。

### 7.6 手测清单（缺一项都不能算完成）

> 完整可执行版本见 [DECORATION-MANUAL-TEST.md](./DECORATION-MANUAL-TEST.md)：含入口路径、逐面板字段、落盘验证、老数据兼容、失败对照表。

| # | 操作 | 期望 |
|---|---|---|
| 1 | 新建页面 → 拖入顶部栏 → 改「欢迎语」 | 预览实时更新 |
| 2 | 点保存 → 刷新页面 → 重新打开该页面 | 改后的欢迎语仍在 |
| 3 | 编辑已有页面（老数据，无 `welcomeText` 字段） | 显示默认「欢迎来到商城」，不覆盖已存字段 |
| 4 | 切换到另一个组件再切回来 | 配置不丢、不重复写 |
| 5 | 打开浏览器控制台 | 无 `Avoid mutating a prop` 警告 |

### 7.7 推广顺序（✅ 12/12 完成）

12 个 PC 面板全部完成，`no-mutating-props` **738 → 422（−43%）**。

剩余 422 条来源：`config-panel/index.vue` 兜底分支（3）、`wap/config-panel/*`（未纳入）、
装修模板对 `res` 的少量写入。


试点通过后，按「直改处数从少到多」推进：

`PanelVideo`(6) → `PanelRecommendFeed`(8) → `PanelCarousel`(9) → `PanelTitle`(10) →
`PanelArticle`(11) → `PanelNotice`(14) → `PanelGridFloor`/`PanelSearchHeader`(19) →
`PanelUserBenefits`/`PanelChannelFloor`(20) → `PanelGoods`(24)

每批 ≤3 个面板，改完必须过 7.6 的清单。

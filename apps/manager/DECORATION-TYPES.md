# 装修数据结构（Decoration Types）

> 这份文档解释 `apps/manager/src/views/page-decoration/types.ts` 的设计，
> 以及 **怎么把装修器里剩下的 `any` / `@ts-nocheck` 一步步清掉**。

## 一、问题：配置被当字典用

装修数据是运营在界面上拼出来的 JSON，存在 `li_page_data.page_data`（longtext）。
没有类型时，代码只能这样写：

```ts
props.res.options.list[0].titleWay[goodsSelectedIndex.value] = data;   // 全是 any
props.res.options.list[0]["listWay"] = list;
```

`decorate.vue`(52) / `pc/index.vue`(85) 的 `any` 全部来自这种写法 ——
**不是"参数没标注"，而是"数据结构没建模"**。所以补参数类型治不了本，
必须先把 `page_data` 的真实结构写出来。

## 二、真实结构（从线上库里归纳）

数据来源：`li_page_data` 现有 6 个页面（PC 2 个 / H5 4 个，最大 260KB），
用脚本统计了全部组件的字段与 `options` 键。

### PC：行 → 组件

```jsonc
{
  "version": 2,
  "pageStyle": { "backgroundColor": "#f8fafc" },
  "list": [
    {
      "id": "row_1795530497613_7ho54",
      "rowStyle": { "width": 1920, "height": "", "gap": 0, "margin": [0,0,0,0], "padding": [0,0,0,0], "radius": [0,0,0,0] },
      "components": [
        {
          "id": "cmp_1795530497613_6zm1b",
          "type": "topBar",
          "name": "顶栏",
          "icon": "Menu",
          "componentStyle": { "backgroundColor": "#f8fafc", "textColor": "#64748b", "height": 36, "radius": [], "padding": [], "margin": [], "widthRatio": "100%", "backgroundImage": "" },
          "options": { "welcomeText": "…", "rightMenus": [], "fontSize": 16 }
        }
      ]
    }
  ]
}
```

- 一行可放多个组件，靠 `componentStyle.widthRatio` 分栏
- 已出现过的 PC 类型：`topBar` `noticeBar` `carousel` `video` `searchHeader` `footerNav` `categoryNav`

### H5：扁平组件数组

```jsonc
{
  "list": [
    {
      "type": "goods", "name": "商品", "icon": "…", "group": "商品",
      "img": "…", "key": "…", "model": "1",
      "notAdd": true, "notLink": true, "notImg": true,
      "options": {
        "bgColor1": "#fff", "bgColor2": "#fff",
        "paddingTop": 10, "paddingBottom": 10, "paddingX": 12, "pageGap": 10, "borderRadius": 8,
        "layoutStyle": "one", "list": [ { "layout": "one", "dataMode": "AUTO", "count": 6, "goodsList": [] } ]
      }
    }
  ]
}
```

- 组件的**可配置项全在 `options`**；列表型组件是 `options.list[]`，单值型直接 `options.xxx`
- 组件上还有一批**能力标记**：`notAdd` / `notLink` / `notImg` / `onlyImg` / `close`
- 已出现过的 H5 类型：`search` `textPicture` `goods` `notice` `menu` `coupon` `flexOne`
  `integral` `shop` `title` `homeComb` `promotionDetail`

## 三、类型设计

`types.ts` 分两段，**兼容层保持不动，新增结构层**：

### 第一部分：兼容层（原有导出）

```ts
export type DecorateComponent<T extends object = Record<string, unknown>> = { id?; type: string; name? } & T;
export type WapTemplateRes = { type?; list?; [key: string]: unknown };
export type CubeStyleRes  = { paddingTop?; bgColor1?; … };
```

`tpl_*` 模板组件在用这三个类型，**先别动** —— 它们是"渲染侧"的类型，
和"配置侧"（`options`）不是一回事，混在一起改会互相牵扯。

### 第二部分：结构层

| 分组 | 类型 | 说明 |
|---|---|---|
| 公共样式 | `WapSpacing` / `WapRadius` / `WapBackground` / `WapTextColors` | H5 的 `paddingTop`/`borderRadius`/`bgColor1`… 全在 `options` 里，是**跨组件的公共字段** |
| PC 样式 | `PcComponentStyle` / `PcRowStyle` / `DecorationPageStyle` | `componentStyle` 与 `rowStyle` 的形状 |
| 容器 | `PcPageData` / `PcRow` / `PcComponent`、`WapPageData` / `WapComponent` | `page_data` 解析后的结构 |
| 组件 options | `PcTopBarOptions` / `WapGoodsOptions` / … | 每种组件的配置形状 |
| **注册表** | `PcOptionsMap` / `WapOptionsMap` | **组件类型 → options 类型** 的接口映射 |
| 判别联合 | `PcTypedComponent` / `WapTypedComponent` | `type` 收窄后 `options` 自动变成对应类型 |
| 工具 | `isWapComponentType` / `getWapOptions` / `findPcComponent` / `parsePageData` | 守卫与查找 |

**注册表是整个设计的支点**：

```ts
export interface WapOptionsMap {
  goods: WapGoodsOptions;
  notice: WapNoticeOptions;
  // 新增组件时在这里登记一行
}
```

有了它，判别联合自动成立：

```ts
const comp: WapTypedComponent = …;
if (comp.type === "goods") {
  comp.options.list[0].count;      // ✓ 自动是 WapGoodsOptions
}
```

## 四、迁移路线（按收益/风险排序）

| 步骤 | 目标 | 做法 | 预期收益 |
|---|---|---|---|
| **1** | 面板类型接入注册表 | 每个 `config-panel/PanelXxx.vue` 把本地 `PanelOptions` 改成 **从 `types.ts` 导入** 对应 `Pc*Options` / `Wap*Options`，并导出 `PanelOptions` | 面板与装修器共用一套类型 |
| **2** | `wap/decorate.vue`（52） | `props.res` 改成 `WapComponent`；`pendingCategory` 改 `unknown[]`；`confirmCategory` 里 `list[0].titleWay` 用 `WapGoodsOptions["list"][number]` 收窄 | 摘掉 `@ts-nocheck` |
| **3** | `pc/index.vue`（85） | `pageData` 用 `PcPageData`；行/组件遍历换成 `findPcComponent`；`applyComponentOptions` 的 patch 用 `Partial<TOptions>` | 摘掉 `@ts-nocheck` |
| **4** | `wap/index.vue`（25） | 预览侧用 `WapPageData` + `WapTypedComponent` 渲染 | 预览与编辑同源 |
| **5** | 未登记类型告警 | 装修器加载时用 `isWapComponentType` / `isPcComponentType` 打一条 `console.warn`，新组件忘登记会立刻发现 | 防止回退 |

## 五、为什么现在这样做（而不是逐个文件补 `any`）

`decorate.vue` / `pc/index.vue` 里的 137 处 `any` 是**同一个根因**：
`page_data` 没有结构类型。逐个补参数类型的话：

- 每个函数参数还得写成 `any`（因为没有可用类型）
- 一旦想收紧，就会连锁报错（`props.res.options.list[0]` 是 `unknown`）

先把结构写出来，这 137 处才有"可标注的东西"。这也是为什么这一轮**只做设计、不改业务文件**。

## 六、注意

1. **`page_data` 是 PC / H5 共用字段**，靠 `page_client_type` 区分 —— 所以有两个顶层类型，不要合并。
2. **`version: 2` 是当前版本**，`parsePageData` 不校验版本（老数据也照常渲染），
   但新增字段时要考虑老数据缺字段（所有字段标可选）。
3. **H5 的 `options.list[]` 元素字段因组件而异**（`goods` 的 `list[0]` 是查询条件，
   `title` 的 `list[0]` 是文案），所以每个组件的 `list` 都要单独写元素类型，不能共用一个。
4. 兼容层的三个类型**有索引签名**，这是早期 `@ts-nocheck` 时代的妥协；
   模板组件改造时不要照抄这个做法，新代码一律显式列字段。

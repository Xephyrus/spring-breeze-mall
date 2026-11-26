# 前端性能体检报告（B 阶段）

> 生成时间：2026-11-26
> 方式：`vite build` 产物体积 + chunk 分布 + 入口资源依赖分析
> 环境：Vite 8（Rolldown），生产构建

---

## 一、基线数字

| 项 | 数值 |
|---|---:|
| dist 总体积 | **18.6 MB**（优化后 18.47 MB） |
| 文件数 | 1017（优化后 996） |
| JS | 11.6 MB / 490 个 |
| CSS | 2.1 MB / 356 个 |
| 静态资源 `dist/tinymce` | **8.36 MB / 219 个文件**（优化后 8.2 MB / 198） |

### 首屏关键路径（index.html 里 modulepreload 的 chunk）

| chunk | 体积 |
|---|---:|
| `element-plus` | **1,049 KB** |
| `index`（业务入口 + Main.vue） | **287 KB** |
| `vue-vendor` | 111 KB |
| `axios` | 62 KB |
| 其它（goodsType / shops / runtime 等） | < 5 KB |
| **合计（未压缩）** | **≈ 1.5 MB** |

另外 `index.html` 里还有一个**同步 classic script**：

```
<script src="/tinymce/tinymce.min.js"></script>   // 405 KB，阻塞应用启动
```

> 结论：**首屏实际要下 ≈1.9 MB（未压缩）**，其中 1.45 MB 是「框架 + 编辑器」——
> 而编辑器只有 7 个页面用到。

---

## 二、本轮已做的优化（含前后对比）

### ① `@antv/g2`（590 KB）改为按需加载 ✅

- **问题**：`views/home/home.vue` 静态 `import { Chart } from "@antv/g2"`，
  而 `/home` 是登录后的落地页 → 590 KB 图表库压在首屏渲染路径上。
- **改法**：改成首次画图时 `await import("@antv/g2")`，构造器缓存复用。
- **效果**：
  - `antv` 变成独立 chunk（590 KB），**不再随 /home 首次渲染加载**
  - `home` chunk 降到 **12 KB**
  - 图表在数据返回后才加载，首屏骨架更快出现

### ② tinymce 未启用插件清理 ✅

- **问题**：`public/tinymce` 7 MB / 154 文件全量复制进 dist，其中 5 个插件没有被 `editor/plugins.ts` 启用。
- **改法**：删除 `autoresize` / `charmap` / `help` / `quickbars` / `template`
  （已备份到 `.build-check/tinymce-removed`，可还原）。
- **效果**：dist 少 21 个文件、**0.14 MB**（体积收益小，但文件数减少 21 个）。

> 诚实结论：tinymce 的体积大头不在插件，而在 **core + theme + emoticons 表情图**。

---

## 三、发现但**没动**的问题（按收益排序）

### P0：tinymce 是首屏最大的浪费（405 KB 阻塞 + 7 MB 静态资源）

| 项 | 现状 |
|---|---|
| 加载方式 | `index.html` 里 `<script src="/tinymce/tinymce.min.js">`，**每个页面都下载、阻塞启动** |
| 谁需要它 | 7 个地方：文章编辑、分销招募、会员权益表单、平台设置、装修富文本面板（2 个） |
| 建议 | 从 index.html 移除，改为「进编辑器页时动态注入 script」；`public/tinymce` 也可按需（编辑器页面才需要 CDN 路径） |

**为什么没动**：这需要改 `components/editor/index.vue`（读取 `window.tinymce` 的地方），
而你之前明确说过「编辑器暂时先不要改动」。**要改的话需要你点头。**

参考实现（10 行，只需在 editor 组件初始化前调用）：

```ts
let loading: Promise<void> | null = null;
export function loadTinymce() {
  if (window.tinymce) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/tinymce/tinymce.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("tinymce 加载失败"));
    document.head.appendChild(s);
  });
  return loading;
}
```

预期收益：**首屏少 405 KB 阻塞脚本**，7 MB 静态资源可改为按需/预签名。

### P1：element-plus 全量引入（1,049 KB）

- 现状：`plugins/element.ts` 里 `app.use(ElementPlus)`，全量打进首屏。
- 建议：改 `unplugin-vue-components` + `ElementPlusResolver` 按需引入。
- 预期：**1,049 KB → 约 400–600 KB**（视页面组件用量）。
- 风险：需要新增 devDependencies；本机离线，装包可能失败；且要验证全部 `el-*` 组件与 `ElMessage/ElMessageBox` 样式。

### P2：emoticons 表情图（约 600 KB 静态）

- 现状：`tinymce/plugins/emoticons/js/emojiimages.min.js`（400 KB）+ `emojis.min.js`（188 KB）都打了。
- 建议：编辑器配置改用 `emojis`（不带图片的符号版）可省约 400 KB。
- 风险：表情样式变化（老板键），需你确认是否可接受。

### P3：首屏 modulepreload 里的 `goods` / `shops` / `goodsType`

- 体积都很小（1–5 KB），但它们是**路由级模块被入口引用**的信号。
- 建议：排查 `Main.vue` 或 `stores` 是否静态引用了它们；若只是 `constants`，可再拆。
- 收益：小。

---

## 四、已经不错的地方（不用动）

| 项 | 状态 |
|---|---|
| 路由懒加载 | ✅ `router/router.ts` 591 行里只有 2 个静态 import，其余全是 `() => import(...)` |
| `hls.js`（565 KB） | ✅ 已经是 `await import("hls.js")`，只在直播控制台按需加载 |
| `LiveChatPanel`（838 KB，含腾讯 IM SDK） | ✅ 只被 `live/control-panel.vue` 引用，属路由级 chunk |
| 图表页（8 个） | ✅ 除 home 外其它都在路由 chunk 内 |
| 代码分割 | ✅ 490 个 JS chunk，按路由/组件切得比较细 |

---

## 五、下一步建议（按投入产出比）

| 优先级 | 动作 | 投入 | 收益 |
|---|---|---|---|
| **P0** | tinymce 懒加载（需同意改 editor） | 30 分钟 | 首屏 **−405 KB** |
| **P1** | element-plus 按需引入 | 2–3 小时（含回归） | 首屏 **−450 KB 左右** |
| P2 | emoticons 换符号版 | 15 分钟 | 静态 **−400 KB** |
| P3 | 拆入口里的路由级依赖 | 1 小时 | 小 |

> 建议先做 **P0**：它是唯一「改动极小、收益最大」的一项，但卡在「编辑器不动」这条约定上。

---

## 六、验证方式

```bash
cd apps/manager
node --max-old-space-size=3072 node_modules/vite/bin/vite.js build
# 看 dist/index.html 的 preload 列表 + dist/assets 里各 chunk 体积
```

本轮改动后：`typecheck 0 错误 / build 通过 / lint 67 告警（ratchet 通过）`。


---

## 七、element-plus 按需引入（R158）

### 改动

| 文件 | 改动 |
|---|---|
| `vite.config.ts` | 加 `unplugin-vue-components` + `ElementPlusResolver({ importStyle: false })`，模板里的 `el-*` 按使用引入 |
| `plugins/element.ts` | 去掉 `app.use(ElementPlus)`；保留 `element-plus/dist/index.css` 全量样式；改为 `app.use(ElLoading)` 注册 `v-loading`（全站 165 处用到） |
| `App.vue` | 包一层 `<el-config-provider :locale="zhCn">`，中文语言包继续生效 |
| `package.json` | 新增 devDep `unplugin-vue-components` |

### 为什么 `importStyle: false`

按需样式（每个组件各自的 CSS）会和现有的全量 `index.css` 重复，且**样式缺失的回归很难发现**。
所以这一步只收 JS，CSS 仍走全量（354 KB / gzip 47 KB），后续可单独作为一步优化。

### 体积对比

| 项 | 之前 | 现在 | 变化 |
|---|---:|---:|---|
| element-plus JS | 1,049 KB | **845 KB** | **−204 KB（−19%）** |
| element-plus CSS | 354 KB | 354 KB | 未变（有意的） |
| dist | 12.58 MB | **12.31 MB** | −0.27 MB |

> 收益没有预期大，原因：项目实际用了 **63 个 el-* 组件**，加上共享 runtime 后，
> 按需只削掉未使用的那部分（约 20%）。

### 额外收益

- 模板里写 `<el-xxx>` 不用再手动 import，组件按需自动注册
- 组件 TS 类型也由解析器提供，模板类型检查更稳

### 风险与验证

`v-loading`（165 处）、`ElMessage/MessageBox`（243 个文件具名导入）、
中文语言包（`el-config-provider`）这三条是最容易踩的点，见 `TEST-CASES.md` 第 32 章。

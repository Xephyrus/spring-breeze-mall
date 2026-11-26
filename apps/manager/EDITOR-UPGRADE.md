# TinyMCE 升级 + 懒加载（6.4.2 → 8.11.0）

> 时间：2026-11-26
> 关联：`PERF-AUDIT.md` 的 P0 项

---

## 一、做了什么

| 项 | 之前 | 现在 |
|---|---|---|
| 版本 | **6.4.2**（`public/tinymce` 静态副本，154 文件 / 7 MB） | **8.11.0**（npm 依赖，按需打包） |
| 加载方式 | `index.html` 里同步 `<script>`，**每个页面都下 405 KB** | 进入编辑器页时才 `await loadTinymce()` |
| 静态资源 | `public/tinymce` 7 MB 全量进 dist | 只留语言包 `public/tinymce-langs/zh-Hans.js`（18 KB） |
| 皮肤 | 运行时从 `base_url` 拉 | UI 皮肤打进 CSS；内容样式用 `?inline` 注入 iframe |
| 中文 | `langs/zh-Hans.js` | 复用同一份语言包，走 `language_url` |

### 代码改动

| 文件 | 改动 |
|---|---|
| `src/components/editor/load-tinymce.ts` | **新增**：动态 import 核心 + 模型 + 主题 + 图标 + 24 个插件 + UI 皮肤；导出 `tinymceContentBaseCss` |
| `src/components/editor/config.ts` | 去掉 `base_url`；`skin:false` / `content_css:false`；`content_style = [皮肤内容样式, 默认内容样式, 自定义样式].join("\n")`；语言走 `language_url` |
| `src/components/editor/index.vue` | `init()` 改为 `async`：先 `await loadTinymce()` 再 `initTinymce()`；`onActivated` 兜底 |
| `src/types/tinymce-modules.d.ts` | **新增**：`tinymce/*` 子模块与 `*.css` 类型声明 |
| `index.html` | 删掉 `<script src="/tinymce/tinymce.min.js">` |
| `public/tinymce/` | 移除（备份在 `.build-check/tinymce-public-backup`） |
| `package.json` | 新增依赖 `tinymce@8.11.0` |

---

## 二、体积变化（真实构建产物）

| 指标 | 之前 | 现在 | 变化 |
|---|---:|---:|---|
| dist 总体积 | 18.6 MB | **12.38 MB** | **−6.2 MB（−33%）** |
| 文件数 | 1017 | **841** | −176 |
| 首屏同步脚本 | 405 KB（tinymce） | **0** | −405 KB |
| tinymce chunk | 无独立 chunk（全局脚本 + 静态目录） | 475 KB（按需） | 首屏不再加载 |
| 编辑器 CSS | 运行时拉 | 216 KB（按需） | 首屏不再加载 |
| 语言包 | 静态目录内 | 18 KB（按需） | — |

**首屏可省**：405 KB 脚本 + 8.2 MB 静态资源目录不再随包发布。

---

## 三、必须人工验证的清单（我无法在这里点浏览器）

> 编辑器是「看着才知道对不对」的组件，下面每项都请实际点一次。

| # | 检查点 | 怎么看 |
|---|---|---|
| 1 | **编辑器能出来** | 内容 → 文章 → 编辑：编辑区出现、工具栏有图标（不是方块/空白） |
| 2 | **中文界面** | 工具栏 tooltip、右键菜单、对话框按钮是中文 |
| 3 | **图标正常** | 工具栏按钮图标清晰（`icons/default` 已引入） |
| 4 | **皮肤正常** | 编辑器有边框、工具栏灰底、下拉框样式正常（`skin.min.css` 已打包） |
| 5 | **内容区样式** | 输入文字，字体/行距正常；插入图片不溢出 |
| 6 | **图片上传** | 工具栏「图片」→ 上传 → 能插入（`images_upload_handler` 未改动） |
| 7 | **表情** | 表情按钮 → 面板能打开 → 能插入（v8 表情不再带图片资源，是字符版） |
| 8 | **表格** | 插入表格 → 行列操作正常 |
| 9 | **源码** | `code` 按钮 → 源码对话框正常 |
| 10 | **全屏** | 全屏按钮 → 进入/退出正常，且不遮挡布局 |
| 11 | **预览** | `preview` 弹窗正常 |
| 12 | **自动保存** | 改动内容 30 秒后无报错（`autosave` 插件） |
| 13 | **保存文章** | 保存后内容完整、刷新回显正常 |
| 14 | **平台设置里的编辑器** | 平台设置 → 任一含富文本的页 → 编辑器可用 |
| 15 | **装修富文本面板** | 装修 → 富文本楼层 → 编辑器可用 |
| 16 | **控制台** | 打开编辑器页，控制台无红色报错（尤其 `Failed to load plugin` / `skin`） |

**如果第 1 项就不出来**：先看控制台报错，多半是某个插件模块路径不对，把报错发我即可。

---

## 四、升级带来的行为变化（tinymce 6 → 8）

| 变化 | 影响 | 处置 |
|---|---|---|
| 表情不再带图片集（`emojiimages` 移除） | 表情变成字符版，样式更简洁 | 可接受；若必须图片版需自定义 `emoticons_database` |
| `powerpaste_word_import` 选项已不存在 | 该配置项失效 | 保留不报错，但 Word 粘贴行为由 v8 默认策略决定 |
| `object_resizing` / `browser_spellcheck` 等仍有效 | 无影响 | — |
| 皮肤/图标必须显式引入（v7 起） | 已按官方方式引入 | 见 `load-tinymce.ts` |

---

## 五、许可证（决策：方案 A，保持 8.11.0 + GPL）

TinyMCE 7 起从 MIT 改为 **GPL-2.0-or-later 或 Tiny 商业授权** 二选一
（`node_modules/tinymce/license.md`）。

**本项目是开源项目，采用方案 A：保持 8.11.0，按 GPL-2.0-or-later 使用**
（`config.ts` 里 `license_key: "gpl"`，缺少它编辑器会被直接禁用）。

### 已在根 README 记录的风险提示

「## License」一节写明了三点，便于使用者判断：

1. **与 Apache-2.0 存在兼容性争议**：GPL-2.0 与 Apache-2.0 通常被认为不兼容；
   把含 TinyMCE 的管理端与后端一起按 Apache-2.0 对外分发时，组合作品许可存在争议。
2. 仅自用 / 内部部署不分发时，不触发 GPL 分发义务。
3. 对外发行有三条路：整体 GPL-2.0-or-later / 购买商业授权 / 回退 6.8.6（MIT）。

> seller / buyer / im / uniapp 不使用 TinyMCE，不受影响。

## 六、回滚方案

```bash
# 1) 恢复静态副本与 index.html
move .build-check\tinymce-public-backup  apps\manager\public\tinymce
copy .build-check\index.html.bak         apps\manager\index.html
# 2) 卸载依赖
pnpm --filter @spring-breeze/manager remove tinymce
# 3) 还原编辑器三件套（config.ts / index.vue / load-tinymce.ts）
#    参考 LINT-DEBT.md R155 里记录的改动点逐个回退
```

---

## 七、验证结果

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 6.09s |
| lint | 67 告警（ratchet 通过） |
| dist | 18.6 → **12.38 MB** |
| `index.html` 含 tinymce 脚本 | ❌ 否（已移除） |
| 编辑器 chunk | 475 KB + 216 KB CSS（按需） |
| 语言包 | 18 KB（按需，不在首屏） |


---

## 八、首轮实测问题与修复（2026-11-26 21:10）

第一次在装修「文章内容」面板打开编辑器时，控制台有三条报错，**已全部修复**：

| 报错 | 原因 | 修复 |
|---|---|---|
| `The editor is disabled because a TinyMCE license key has not been provided` | **TinyMCE 7+ 必须显式声明许可证**，否则编辑器被禁用 | `config.ts` 加 `license_key: "gpl"`（自托管开源用法） |
| `Failed to load license key manager url: plugins/licensemanager/plugin.js`（404） | 同上，缺 license_key 时它会去 `base_url` 找这个插件 | 同上（加 license_key 后不再触发） |
| `Failed to load emojis: .../plugins/emoticons/js/emojis.js`（404） | 表情库默认按 `base_url` 去静态目录拉，打包后没有该目录 | `load-tinymce.ts` 里显式 `await import("tinymce/plugins/emoticons/js/emojis.min.js")`，库随编辑器 chunk 一起加载 |

### 产物验证

| 项 | 结果 |
|---|---|
| 表情库 chunk | `emojis.min-*.js`（178 KB），由 `editor-*.js` 按需引用 |
| `license_key: "gpl"` | 已进 bundle |
| dist | 12.58 MB（含表情库 178 KB） |

> 这三个问题都是「tinymce 7/8 与 6.x 的行为差异」：许可证 + 资源不再从静态目录默认提供。


---

## 九、工具栏修复（2026-11-26 22:40）

**现象**：时钟图标旁的箭头点开没有选项；同时「特殊字符」按钮不见了。

| 问题 | 原因 | 修复 |
|---|---|---|
| 特殊字符按钮消失 | `toolbar.ts` 有 `charmap`，但 `load-tinymce.ts` 没 import 这个插件 → **未注册的工具栏项被静默丢弃** | 补 `import("tinymce/plugins/charmap/plugin")` + `plugins.ts` 补 `charmap` |
| 插入日期/时间下拉为空 | 没配 `insertdatetime_formats`，split button 的菜单项直接来自它 | 显式配 4 个格式（含 `%Y年%m月%d日` 中文格式） |

> **教训**：TinyMCE 对「工具栏里有、插件没启用」的按钮是**静默忽略**的，
> 必须人工保证 `toolbar.ts` 与 `plugins.ts` 一致。


---

## 十、回退：改回 6.4.2（2026-11-26）

### 原因

TinyMCE 7+ 的 **GPL-2.0-or-later / 商业授权** 二选一，与项目 Apache-2.0 有兼容性争议。
用户决定回退到 **6.4.2（MIT 授权）**，避免授权风险。

### 回退内容

| 项 | 8.11.0（回退前） | 6.4.2（现状） |
|---|---|---|
| 依赖 | `package.json` 的 `tinymce@8.11.0` | **无 npm 依赖** |
| 资源 | 打包进 bundle（按需 chunk） | `public/tinymce` 静态副本（198 文件） |
| 加载 | 进编辑器页 `await loadTinymce()` | `index.html` 里同步 `<script>` |
| 皮肤 | `import "skin.min.css"` + `?inline` 注入 iframe | `base_url` 去静态目录拉 |
| 语言 | `public/tinymce-langs/zh-Hans.js` | `public/tinymce/langs/zh-Hans.js` |
| 许可证 | GPL-2.0-or-later | **MIT** |

### 保留的两个 bug 修复（与版本无关）

| 修复 | 说明 |
|---|---|
| `plugins.ts` 加 `charmap` | 工具栏里有 `charmap`，插件列表必须也有，否则按钮被静默丢弃 |
| `config.ts` 加 `insertdatetime_formats` | 时钟下拉的选项来源，不配就是空菜单 |

### 附带动作

- 从 `tinymce@6.4.2` 官方包补回 `plugins/charmap`（回退前的裁剪步骤把它删了，但工具栏还在用它）
- 删除 `src/components/editor/load-tinymce.ts`、`src/types/tinymce-modules.d.ts`
- 删除 `public/tinymce-langs/`（v6 自带 langs）

### 代价

首屏又多了 405 KB 的同步脚本，dist 从 12.3 MB 回到 **18.2 MB**。
如果以后要再优化，可考虑「路由守卫里按需注入 script」而不改编辑器内部实现。

### 验证

| 项 | 结果 |
|---|---|
| typecheck | 0 错误 |
| build | ✅ 8.09s |
| lint | 67 告警（ratchet 通过） |
| 版本 | majorVersion 6 / minorVersion 4.2 |
| `dist/tinymce` | 198 文件，含 charmap |

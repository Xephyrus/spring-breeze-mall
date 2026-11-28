# im 冒烟清单（M6）

> 目标：用最少的操作覆盖本次迁移（Vite + TS 全量 + kebab 命名 + mixin→组合式 + element-plus 按需 + WebSocket 修复）
> 可能破坏的地方。每条都是「可勾选 + 有明确预期」。
>
> 勾选方式：把 `[ ]` 改成 `[x]`。

## 环境

| 服务 | 端口 | 启动方式 |
|---|---|---|
| im 前端 | **8000** | `corepack pnpm --filter @spring-breeze/im dev` |
| seller 前端（取 token 用） | 10002 | `corepack pnpm --filter @spring-breeze/seller dev` |
| im-api | 8885 | `cd backend && java -jar im-api/target/im-api-5.0.2.jar --spring.profiles.active=dev` |
| manager-api | 8887 | 同上（manager-api） |
| MySQL / Redis | 3306 / 6379 | 本地 |

> **重要**：im-api 与 manager-api 必须用**同一个 JWT 密钥**（默认都走 `application.yml` 的默认值即可）。
> 若 manager-api 启动时设了 `LILI_JWT_SECRET`，im-api 也要设成相同值，否则 WS 握手成功但鉴权失败（1008）。

### 进入 im 的准备（im 没有登录页）

im 依赖 `localStorage` 里的 token 与用户信息，需从 seller 端登录后复制：

1. 打开 `http://localhost:10002`，登录商家账号；
2. F12 → Application → Local Storage → `http://localhost:10002`，复制 `LILI-TOKEN` / `LILI-USERINFO`；
3. 打开 `http://localhost:8000`，Console 执行：

```js
localStorage.setItem('LILI-TOKEN', '<粘贴>');
localStorage.setItem('LILI-USERINFO', '<粘贴>');
location.reload();
```

---

## 一、启动与骨架（Vite 迁移 + 入口改 .ts）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 1 | 打开 `http://localhost:8000` | 页面加载完成，无白屏 | [ ] |
| 2 | F12 Console | 无报错；无 `Failed to resolve component` | [ ] |
| 3 | Network 里 `main.ts` | 200，不是 404（`index.html` 入口已改 `.ts`） | [ ] |
| 4 | 打开 `/message` | 正常渲染三栏布局（左会话 / 中聊天 / 右面板） | [ ] |
| 5 | 访问不存在的路径（如 `/abc`） | 显示 404 页 | [ ] |
| 6 | 浏览器标签标题 | 形如 `LiLi IM \| 消息通知`（`permission.ts` 的路由标题） | [ ] |

## 二、WebSocket（本轮核心修复，失败即阻塞后续）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 7 | F12 → Network → WS，刷新页面 | 出现 `lili/webSocket/<token>`，状态 **101** | [ ] |
| 8 | 同上，点开该 WS → Messages | 有心跳/消息帧，连接保持 `Pending`（长连接） | [ ] |
| 9 | 服务端日志（im-api 控制台） | 出现 `用户建立连接，sessionId: <数字>` | [ ] |
| 10 | 把 token 改坏后刷新（`localStorage.setItem('LILI-TOKEN','bad')`） | WS 返回 **101 后立刻 1008**；服务端日志 `JWT 解析失败` / `WebSocket 鉴权失败` | [ ] |
| 11 | 上一步的页面上，看右上角提示 | **只有一个**「连接已断开」提示，显示「第 1/12 次重试」；随后 2s、4s… 递增 | [ ] |
| 12 | 连续失败到第 12 次 | 弹出「消息连接失败」对话框（刷新页面 / 继续等待） | [ ] |
| 13 | 停掉 im-api（Ctrl+C），等 3 秒再启动 | 页面自动重连成功，红框提示**自动消失**，连接状态恢复 | [ ] |

> 第 13 条是关键回归点：原实现每次重连都新建一个常驻通知且永不关闭，断线时红框会堆满屏。

## 三、会话列表与聊天（stores / im-server 类型化 + kebab 命名）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 14 | 左侧会话列表 | 有数据，头像/昵称/最后一条消息/时间正常 | [ ] |
| 15 | 点击一个会话 | 中间聊天区加载历史消息并滚动到底部 | [ ] |
| 16 | 发一条文字消息 | 立即出现在右侧（自己发的），列表最后一条同步更新 | [ ] |
| 17 | 发一条图片消息 | 上传成功并显示图片气泡；列表显示 `[图片]` | [ ] |
| 18 | 刷新页面后重新进入该会话 | 历史消息与图片都还在 | [ ] |
| 19 | 未读数 | 有新消息时左侧会话显示红点数字；打开会话后清零 | [ ] |
| 20 | 右键会话列表 | 出现自定义右键菜单（`$contextmenu`），点击空白处自动关闭 | [ ] |
| 21 | 会话列表滚动 | 置顶栏出现阴影（`subHeaderShadow`） | [ ] |

## 四、消息气泡（17 个组件全部 kebab 重命名，需逐个确认能渲染）

| # | 消息类型 | 预期 | ✅ |
|---|---|---|:--:|
| 22 | 纯文本 | 正常气泡，换行保留 | [ ] |
| 23 | 图片 | 按比例缩放显示，点击可看大图 | [ ] |
| 24 | 语音 | 显示时长与播放按钮，可播放 | [ ] |
| 25 | 视频 | 显示封面，可播放 | [ ] |
| 26 | 文件 | 显示文件名与大小，可下载 | [ ] |
| 27 | 代码块 | 语法高亮 + 右上角「复制」按钮 | [ ] |
| 28 | 商品卡片 | 显示商品图/名/价，点击跳商品详情 | [ ] |
| 29 | 订单卡片 | 显示订单号/状态，点击跳订单详情 | [ ] |
| 30 | 名片 | 显示用户名片，点击弹出名片弹窗（`$user`） | [ ] |
| 31 | 邀请评价 | 正常渲染 | [ ] |
| 32 | 投票 | 可投票，结果比例显示 | [ ] |
| 33 | 回复（引用） | 显示被引用内容 | [ ] |
| 34 | 撤回 | 显示「xxx 撤回了一条消息」，原内容消失 | [ ] |
| 35 | 系统提示（居中） | 灰色居中小字 | [ ] |
| 36 | 登录/下线提示 | 居中提示 | [ ] |
| 37 | 好友申请 | 居中提示 | [ ] |
| 38 | 转发记录 | 显示转发卡片，点击展开记录 | [ ] |

> 若某个气泡空白或控制台报 `Failed to resolve component: xxx-message`，说明该组件缺少显式
> `defineOptions({ name })` —— 全局注册是按 `name` 走的，与文件名无关。

## 五、编辑器（MeEditor 系列重命名 + 富文本）

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 39 | 点击输入框下方的表情按钮 | 表情面板打开，点击表情插入输入框 | [ ] |
| 40 | 点击图片按钮上传 | 图片上传成功并发送 | [ ] |
| 41 | 点击文件按钮上传 | 文件上传成功并发送 | [ ] |
| 42 | 点击语音按钮 | 请求麦克风权限；允许后显示录音中（**需 https 或 localhost**） | [ ] |
| 43 | Shift+Enter 换行 / Enter 发送 | 行为符合预期 | [ ] |
| 44 | 粘贴一大段带格式的文字 | 保留基本格式（`editor.ts` 的粘贴解析） | [ ] |
| 45 | 拖拽一张图片到输入框 | 图片被接收并进入待发送状态 | [ ] |
| 46 | 点击投票按钮 | 投票编辑弹窗打开 | [ ] |

## 六、右侧面板与设置

| # | 步骤 | 预期 | ✅ |
|---|---|---|:--:|
| 47 | 点击会话头部「搜索」 | 搜索框出现，可搜历史消息 | [ ] |
| 48 | 聊天记录搜索 | 有关键词高亮，点击结果跳转 | [ ] |
| 49 | 点击右侧面板「商品 / 订单 / 足迹」标签 | 对应 tab 内容加载 | [ ] |
| 50 | 点击右侧面板店铺信息 | 店铺详情渲染（`store-detail.vue`） | [ ] |
| 51 | 顶部「主题」切换 | 全屏 / 居中模式切换生效 | [ ] |
| 52 | 消息提示音开关 | 切换后刷新页面仍保持（`LILI-SETTING` 缓存） | [ ] |

## 七、工程门禁（提交前必跑）

| # | 命令 | 预期 | ✅ |
|---|---|---|:--:|
| 53 | `corepack pnpm --filter @spring-breeze/im typecheck` | 0 错误 | [ ] |
| 54 | `corepack pnpm --filter @spring-breeze/im lint` | 0 error，warning ≤ ratchet 阈值 | [ ] |
| 55 | `corepack pnpm --filter @spring-breeze/im build` | 成功，dist 下 js+css 合计 ≈ 935 KB | [ ] |
| 56 | 检查 `dist/assets/element-plus-*.js` | ≈ 365 KB（若接近 1000 KB 说明按需引入失效） | [ ] |
| 57 | `apps/im/src` 下执行 `dir /s *.js` | **0 个 .js 文件**（除 `components.d.ts` 这类 .d.ts） | [ ] |
| 58 | `apps/im/src` 下所有 `.vue` | 除 `App.vue` 外全部 kebab-case | [ ] |

## 八、已知限制（不算失败）

| 现象 | 说明 |
|---|---|
| 语音录制在非 localhost / 非 https 下不可用 | 浏览器安全策略要求安全上下文 |
| 首次进入无会话 | 需先在买家端「联系客服」或商家端产生会话 |
| 消息提示音无声 | 浏览器自动播放策略，需先与页面交互一次 |
| WS 连接失败但握手 101 | 检查 im-api 与 manager-api 的 `LILI_JWT_SECRET` 是否一致 |

---

## 快速回归脚本（复制到 PowerShell）

```powershell
cd <repo-root>

# 1) 静态门禁
corepack pnpm --filter @spring-breeze/im typecheck
corepack pnpm --filter @spring-breeze/im lint
corepack pnpm --filter @spring-breeze/im build

# 2) 产物体检
$ep = Get-ChildItem apps\im\dist -Recurse -Filter 'element-plus-*.js'
"element-plus JS: {0:N0} KB（应≈365，>900 说明按需失效）" -f ($ep.Length/1KB)

# 3) 源码卫生
"残留 .js: " + (Get-ChildItem apps\im\src -Recurse -File -Filter *.js | Measure-Object).Count
"非 kebab 的 .vue: " + (Get-ChildItem apps\im\src -Recurse -File -Filter *.vue |
  Where-Object { $_.BaseName -cmatch '[A-Z]' -and $_.Name -ne 'App.vue' } | Measure-Object).Count

# 4) WS 握手（任意 token 占位即可验证升级通道）
node -e "const http=require('http'),crypto=require('crypto');const r=http.request({host:'127.0.0.1',port:8885,path:'/lili/webSocket/ping',headers:{Connection:'Upgrade',Upgrade:'websocket','Sec-WebSocket-Version':'13','Sec-WebSocket-Key':crypto.randomBytes(16).toString('base64')}});r.on('upgrade',()=>{console.log('WS 101 OK');process.exit(0)});r.on('response',x=>{console.log('WS FAIL '+x.statusCode);process.exit(0)});r.on('error',e=>{console.log('WS ERR '+e.message);process.exit(0)});r.end()"
```

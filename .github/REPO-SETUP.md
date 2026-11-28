# 仓库设置清单（GitHub 端）

> 这份文件记录**只能在 GitHub 网页上做、代码里做不了**的配置。
> 换人维护、或仓库被 fork 后重新部署时，按这份清单过一遍即可。
> 与代码强相关的部分（CI 门禁、命名规范、大小写坑）见 [`README.md`](../README.md)。

## 1. About（右侧信息栏）

| 字段 | 建议值 |
|---|---|
| **Description** | `Spring Breeze Mall —— 基于 lilishop 二次开发的电商全栈项目：4 个 Spring Boot 服务 + 5 个 Vue 3 / TS 前端（含 uni-app 移动端），全量 TypeScript、CI 六道门禁` |
| **Website** | 有演示站时填（`https://…`），没有就留空 —— 空着比填个打不开的地址好 |
| **Topics** | `vue3` `typescript` `vite` `spring-boot` `java` `uniapp` `ecommerce` `mall` `pnpm` `monorepo` `mysql` `redis` `element-plus` `mybatis-plus` |

Topics 最多 20 个，上面 14 个够用。**不要**放 `lilishop` 之外的无关热词。

## 2. 分支保护（`main`）

Settings → Branches → Add branch protection rule（或 Rulesets）。

| 选项 | 建议 | 理由 |
|---|---|---|
| Require a pull request before merging | ✅（单人开发可关） | 至少保证改动有 diff 可看 |
| Require status checks to pass | ✅ **必开** | 见下方「必选检查」 |
| Require branches to be up to date | ✅ | 防止「本地绿 + 与 main 合并后红」 |
| Require conversation resolution | ✅ | 评论未处理不能合 |
| Do not allow bypassing | ⚠️ 按需 | 打开后管理员也要走 PR |
| Restrict force pushes | ✅ | 避免覆盖历史 |
| Allow deletions | ❌ | 防误删 |
| Require linear history | 可选 | 若用 squash merge，开启更整洁 |

### 必选检查（按 job 的 `name` 勾选，名字必须一字不差）

| 检查名 | 覆盖内容 |
|---|---|
| `precheck · import 大小写一致性` | Windows/Linux 文件名大小写差异（历史上两次全红都是它） |
| `manager · typecheck / lint / build` | 运营端 |
| `seller · typecheck / lint / test / build` | 商家端 |
| `im · typecheck / lint / build` | 客服端 |
| `buyer · typecheck / lint / build` | PC 买家端 |
| `uniapp · typecheck / lint / node 测试` | 移动端 |

> `backend · compile (manual)` 由 `workflow_dispatch` 手动触发，**不要**设为必选，否则 PR 永远等不到它。

## 3. Actions 设置

Settings → Actions → General：

| 项 | 建议 |
|---|---|
| Actions permissions | Allow all actions and reusable workflows |
| Workflow permissions | **Read repository contents**（默认收紧；本项目 CI 只读代码） |
| Allow GitHub Actions to create and approve pull requests | ❌ |
| Fork pull request workflows | Require approval for first-time contributors |
| Artifact / log retention | 30 天（默认即可） |

> 本项目 CI **不需要任何 Secrets**：六个 job 全是静态门禁（typecheck / lint / 单测 / 构建），
> 不连数据库、不调外部 API。将来加部署任务时再按环境加。

## 4. 合并策略（Settings → General → Pull Requests）

| 项 | 建议 |
|---|---|
| Allow merge commits | ❌（历史会变成网状） |
| **Allow squash merging** | ✅ 默认，标题取自 PR 标题 |
| Allow rebase merging | 可选 |
| Automatically delete head branches | ✅ |
| Always suggest updating pull request branches | ✅ |

## 5. 其它开关

| 位置 | 项 | 建议 |
|---|---|---|
| General | Wikis | ❌（文档都在仓库里） |
| General | Issues | ✅（问题追踪） |
| General | Discussions | 可选 |
| General | Projects | 可关 |
| General | Social preview | 上传一张 1280×640 截图（建议用运营端首页） |
| General → Danger Zone | 是否 Archive | ❌ |

## 6. 首次推送后自检

```bash
# 1) 工作流能解析（YAML 语法 + 结构）
#    本地没有 PyYAML 就跳过，改为看 Actions 页面是否报 Invalid workflow file
python -c "import yaml;yaml.safe_load(open('.github/workflows/ci.yml',encoding='utf-8'))"

# 2) 大小写预检（这条最容易被忽略，也最容易让 CI 全红）
corepack pnpm ci:precheck

# 3) 五端本地门禁（与 CI 同命令）
corepack pnpm --filter @spring-breeze/manager typecheck
corepack pnpm --filter @spring-breeze/uniapp test
```

## 7. 已知的「不是问题」

| 现象 | 说明 |
|---|---|
| push 只改 `README.md` / `docs` 时 CI 不跑 | `ci.yml` 的 `paths` 只匹配 `apps/**`、`packages/**`、`pnpm-*.yaml`、`package.json`、`.github/workflows/**`；纯文档改动不触发，属预期 |
| `backend · compile (manual)` 一直是 skipped | 只在 Actions 页面点 `Run workflow` 时执行 |
| Actions 页顶部有 `Node.js 20 is deprecated` 警告 | `actions/checkout@v4` / `setup-node@v4` 的运行时提示，GitHub 会随新版 action 自动消失，不影响构建 |

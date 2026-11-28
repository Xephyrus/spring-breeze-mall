## 这个 PR 做了什么

<!-- 一两句话说明目的；关联的 issue 用 "Closes #123" -->

## 改动范围

<!-- 勾选涉及的部分 -->

- [ ] `apps/manager`（运营端）
- [ ] `apps/seller`（商家端）
- [ ] `apps/im`（客服端）
- [ ] `apps/buyer`（PC 买家端）
- [ ] `apps/uniapp`（移动端）
- [ ] `backend/**`
- [ ] `packages/**` / 构建配置 / CI
- [ ] 仅文档

## 自检（提交前请逐项确认）

- [ ] 本地跑过受影响端的 `typecheck` 与 `lint`（命令见 `README.md` 的「开发命令」）
- [ ] 新增/修改了 `.ts` 或 `.vue` 时，`lint` 告警数没有超过 `package.json` 里的 `--max-warnings`
- [ ] **改过文件名**：跑过 `corepack pnpm ci:precheck`
      （Windows 大小写不敏感，只改大小写的重命名容易漏进 git 索引，详见 README「三个必知的坑」）
- [ ] 改了 `uniapp`：跑过 `corepack pnpm --filter @spring-breeze/uniapp test`
- [ ] 改了前端行为：按对应 `SMOKE-*.md` 做过冒烟，或在描述里说明未做的原因

## 风险与回滚

<!-- 有没有不可逆的操作（SQL、配置、依赖升级）？出问题怎么回滚？ -->

## 截图 / 录屏

<!-- 涉及 UI 的改动请附；纯后端/重构可写「无」 -->

# @spring-breeze/manager

平台运营端（Vite + Vue 3 + TypeScript + SCSS + Element Plus）。

## 代码规范

前端约定对齐 [spring-equinox-mall code-style](../../../../spring-equinox-mall/docs/code-style.md) 的可落地部分：

- `<script setup lang="ts">`，`defineProps` / `defineEmits` 使用类型声明
- 禁止新增 `any`；未知数据用 `unknown` + 类型守卫
- API 放在 `src/api/`，返回类型显式声明（`ResultMessage` / `PageResult` 来自 `@spring-breeze/shared`）
- 样式使用 SCSS；页面级逻辑优先 composable，少挂 `globalProperties`

本仓已全量 TypeScript（务实规范）：不强制调整 SFC 块顺序；超大页按需拆分。仅保留第三方压缩脚本 `views/live/utils/lib-generate-test-usersig-es.min.js`（配有 `.d.ts`）。

## 脚本

```powershell
pnpm --filter @spring-breeze/manager dev
pnpm --filter @spring-breeze/manager typecheck
pnpm --filter @spring-breeze/manager build
```

开发端口见 `src/config`（默认 `10003`）。

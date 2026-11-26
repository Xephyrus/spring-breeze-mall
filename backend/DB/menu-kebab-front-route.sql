-- =============================================================================
-- 菜单 front_route 命名统一（第三阶段）
--
-- 背景：把 front_route 里最后两处非 kebab 的值统一：
--   'Main'                        → 'main'                        （28 行，分组节点用布局组件）
--   'member/list/memberRecycle'   → 'member/list/member-recycle'  （1 行，回收站页面）
--
-- 生成时间：2026-11-26
-- 幂等性：UPDATE 带 WHERE 旧值，重复执行无副作用。
-- 执行时机：在 docker/init/mysql/lilishop.sql 之后。
--
-- 注意：
--   1. 前端 libs/lazyLoading.ts 里保留了 Main/main 两个别名，兼容旧数据；
--   2. 前端 libs/util.ts 的 DEPRECATED_FRONT_ROUTES 已同步成 member-recycle；
--   3. 菜单管理页新增菜单的默认 frontRoute 也已从 'Main' 改为 'main'。
-- =============================================================================
-- 菜单 front_route 命名统一（Main -> main，驼峰 -> kebab）
-- 生成时间：2026-11-26
-- 幂等：UPDATE 带 WHERE 旧值

UPDATE li_menu SET front_route = 'main' WHERE front_route = 'Main';
UPDATE li_menu SET front_route = 'member/list/member-recycle' WHERE front_route = 'member/list/memberRecycle';


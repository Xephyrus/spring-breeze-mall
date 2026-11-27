-- =============================================================================
-- 清理商家端菜单中的孤儿节点（幂等）
--
-- 背景：li_store_menu 里存在 parent_id 指向已删除节点的行
--       （例如 id=1784768265218302 的「素材管理」，父节点 136704626214678528 已不存在）。
--       孤儿节点会被后端当成一级菜单返回，进而在前端注册出与正常菜单同名的路由，
--       表现为「同一个菜单出现两次，点第二个跳到第一个」。
--
-- 处理：把父节点不存在的行软删除（delete_flag = 1），不物理删除，便于回滚。
-- 用法：mysql -u root -p lilishop < backend/DB/store-menu-orphan-cleanup.sql
-- =============================================================================

UPDATE li_store_menu AS m
LEFT JOIN li_store_menu AS p ON m.parent_id = p.id
SET m.delete_flag = 1
WHERE IFNULL(m.parent_id, '') <> ''
  AND p.id IS NULL
  AND IFNULL(m.delete_flag, 0) = 0;

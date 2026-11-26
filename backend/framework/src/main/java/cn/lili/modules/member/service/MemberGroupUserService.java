package cn.lili.modules.member.service;

import cn.lili.common.vo.PageVO;
import cn.lili.modules.member.entity.dos.MemberGroupUser;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;

public interface MemberGroupUserService extends IService<MemberGroupUser> {
    /**
     * 给分组添加客户（已存在关联关系则跳过）
     *
     * @param groupId 分组ID
     * @param memberIds 客户ID列表
     * @return 是否成功
     */
    boolean updateGroupUsers(String groupId, List<String> memberIds);

    /**
     * 给客户设置分组（覆盖式）
     *
     * @param memberId 客户ID
     * @param groupIds 分组ID列表
     * @return 是否成功
     */
    boolean updateUserGroups(String memberId, List<String> groupIds);

    /**
     * 批量为多个客户设置同一分组（覆盖式）。
     * <p>
     * 单事务内先按 member_id IN (...) 一次删除、再一次批量插入，
     * 避免前端并发发起 N 个请求时各自开启事务、互相等待行锁导致的死锁。
     *
     * @param memberIds 客户ID列表
     * @param groupIds  分组ID列表
     * @return 是否成功
     */
    boolean updateUsersGroups(List<String> memberIds, List<String> groupIds);

    /**
     * 统计分组下客户数量
     *
     * @param groupId 分组ID
     * @return 数量
     */
    long countByGroupId(String groupId);

    /**
     * 分页查询分组下客户
     *
     * @param groupId 分组ID
     * @param pageVO 分页参数
     * @return 分页结果
     */
    IPage<MemberGroupUser> pageByGroupId(String groupId, PageVO pageVO);

    /**
     * 从分组移除客户
     *
     * @param groupId 分组ID
     * @param memberId 客户ID
     * @return 是否成功
     */
    boolean removeByGroupAndMember(String groupId, String memberId);
}

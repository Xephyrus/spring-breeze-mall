package cn.lili.modules.member.entity.dos;

import cn.lili.mybatis.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
@TableName("li_member_group")
@Schema(description = "客户分组")
public class MemberGroup extends BaseEntity {

    @NotNull
    @Schema(description = "分组名称")
    private String groupName;

    @Schema(description = "分组描述")
    private String description;

    /**
     * 分组下的客户数量（非表字段，由控制器按需统计后填充）。
     * <p>
     * 前端分组列表的「分组人数」列绑定的是这个字段；此前后端从不返回它，
     * 所以无论关联表里有多少行，界面都显示 0。
     */
    @TableField(exist = false)
    @Schema(description = "分组人数")
    private Long memberCount;
}

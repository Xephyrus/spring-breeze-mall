package cn.lili.modules.page.serviceimpl;

import cn.hutool.core.text.CharSequenceUtil;
import cn.hutool.json.JSONUtil;
import cn.lili.common.enums.ClientTypeEnum;
import cn.lili.common.enums.ResultCode;
import cn.lili.common.enums.SwitchEnum;
import cn.lili.common.exception.ServiceException;
import cn.lili.common.properties.SystemSettingProperties;
import cn.lili.common.security.AuthUser;
import cn.lili.common.security.context.UserContext;
import cn.lili.common.security.enums.UserEnums;
import cn.lili.common.sensitive.SensitiveFilterScene;
import cn.lili.common.sensitive.SensitiveWordsHelper;
import cn.lili.common.vo.PageVO;
import cn.lili.modules.page.entity.dos.PageData;
import cn.lili.modules.page.entity.dto.PageDataDTO;
import cn.lili.modules.page.entity.enums.PageEnum;
import cn.lili.modules.page.entity.vos.PageDataListVO;
import cn.lili.modules.page.entity.vos.PageDataVO;
import cn.lili.modules.page.mapper.PageDataMapper;
import cn.lili.modules.page.service.PageDataService;
import cn.lili.mybatis.util.PageUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * 楼层装修管理业务层实现
 *
 * @author Bulbasaur
 * @since 2020/12/11 9:15
 */
@Service
public class PageDataServiceImpl extends ServiceImpl<PageDataMapper, PageData> implements PageDataService {


    @Autowired
    private SystemSettingProperties systemSettingProperties;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addStorePageData(String storeId) {
        //设置店铺的PC页面
        PageData pageData = new PageData();
        pageData.setNum(storeId);
        pageData.setPageClientType(ClientTypeEnum.PC.value());
        pageData.setPageShow(SwitchEnum.OPEN.name());
        pageData.setPageType(PageEnum.STORE.value());
        this.save(pageData);

        //设置店铺的Mobile页面
        PageData mobilePageData = new PageData();
        mobilePageData.setNum(storeId);
        mobilePageData.setPageClientType(ClientTypeEnum.H5.value());
        mobilePageData.setPageShow(SwitchEnum.OPEN.name());
        mobilePageData.setPageType(PageEnum.STORE.value());
        this.save(mobilePageData);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PageData addPageData(PageData pageData) {
        //过滤楼层装修敏感词
        pageData.setName(SensitiveWordsHelper.filter(SensitiveFilterScene.DECORATION, pageData.getName()));
        assertPageDataJson(pageData.getPageData());
        pageData.setPageData(SensitiveWordsHelper.filterJson(SensitiveFilterScene.DECORATION, pageData.getPageData()));
        AuthUser currentUser = Objects.requireNonNull(UserContext.getCurrentUser());
        //演示站点判定
        if (Boolean.TRUE.equals(systemSettingProperties.getDemoSite()) && (pageData.getPageShow().equals(SwitchEnum.OPEN.name()) && pageData.getPageType().equals(PageEnum.INDEX.name()))) {
                pageData.setPageShow(SwitchEnum.CLOSE.name());

        }

        //如果页面为发布，则关闭其他页面，开启此页面
        if (pageData.getPageShow().equals(SwitchEnum.OPEN.name())) {
            LambdaUpdateWrapper<PageData> lambdaUpdateWrapper = Wrappers.lambdaUpdate();
            lambdaUpdateWrapper.eq(CharSequenceUtil.equals(currentUser.getRole().name(), UserEnums.STORE.name()), PageData::getNum
                    , UserContext.getCurrentUser().getStoreId());
            lambdaUpdateWrapper.eq(PageData::getPageType, pageData.getPageType());
            lambdaUpdateWrapper.eq(PageData::getPageClientType, pageData.getPageClientType());
            lambdaUpdateWrapper.set(PageData::getPageShow, SwitchEnum.CLOSE.name());
            this.update(lambdaUpdateWrapper);
        } else {
            pageData.setPageShow(SwitchEnum.CLOSE.name());
        }
        this.save(pageData);
        return pageData;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PageData updatePageData(PageData pageData) {
        //过滤楼层装修敏感词
        pageData.setName(SensitiveWordsHelper.filter(SensitiveFilterScene.DECORATION, pageData.getName()));
        assertPageDataJson(pageData.getPageData());
        pageData.setPageData(SensitiveWordsHelper.filterJson(SensitiveFilterScene.DECORATION, pageData.getPageData()));
        AuthUser currentUser = Objects.requireNonNull(UserContext.getCurrentUser());
        //如果页面为发布，则关闭其他页面，开启此页面
        if (pageData.getPageShow() != null && pageData.getPageShow().equals(SwitchEnum.OPEN.name())) {
            LambdaUpdateWrapper<PageData> lambdaUpdateWrapper = Wrappers.lambdaUpdate();
            lambdaUpdateWrapper.eq(CharSequenceUtil.isNotEmpty(pageData.getPageType()), PageData::getPageType, pageData.getPageType());
            lambdaUpdateWrapper.eq(CharSequenceUtil.isNotEmpty(pageData.getPageClientType()), PageData::getPageClientType,
                    pageData.getPageClientType());

            //如果是管理员，则判定页面num为null
            if (currentUser.getRole().name().equals(UserEnums.MANAGER.name())) {
                lambdaUpdateWrapper.isNull(PageData::getNum);
            } else {
                lambdaUpdateWrapper.eq(PageData::getNum, pageData.getNum());
            }

            lambdaUpdateWrapper.set(PageData::getPageShow, SwitchEnum.CLOSE.name());
            this.update(lambdaUpdateWrapper);
        } else {
            pageData.setPageShow(SwitchEnum.CLOSE.name());
        }

        LambdaUpdateWrapper<PageData> lambdaUpdateWrapper = Wrappers.lambdaUpdate();
        lambdaUpdateWrapper.set(PageData::getPageData, pageData.getPageData());
        lambdaUpdateWrapper.eq(PageData::getId, pageData.getId());
        lambdaUpdateWrapper.eq(CharSequenceUtil.equals(UserContext.getCurrentUser().getRole().name(), UserEnums.STORE.name()),
                PageData::getPageType, PageEnum.STORE.name());
        lambdaUpdateWrapper.eq(CharSequenceUtil.equals(UserContext.getCurrentUser().getRole().name(), UserEnums.STORE.name()), PageData::getNum,
                UserContext.getCurrentUser().getStoreId());
        this.updateById(pageData);
        return pageData;
    }

    /**
     * 校验 pageData 必须是合法 JSON。
     * <p>
     * 为什么要在写入前拦：装修数据一旦写成非法 JSON，页面就再也打不开（前端 JSON.parse 直接失败），
     * 而且脏数据还会被浏览器缓存后反复提交，把库里原本正常的数据覆盖掉。
     * 宁可这次保存失败并明确报错，也不能写入坏数据。
     *
     * @param pageData 页面数据 JSON 字符串
     */
    private void assertPageDataJson(String pageData) {
        if (CharSequenceUtil.isBlank(pageData)) {
            return;
        }
        try {
            JSONUtil.parse(pageData);
        } catch (Exception e) {
            // 把出错位置附近的片段写进日志，便于直接定位是哪段数据坏了（只进日志，不回显给前端）
            String snippet = snippetAround(pageData, e.getMessage(), 80);
            log.error("pageData 不是合法 JSON，已拒绝写入，长度=" + pageData.length() + "，片段=" + snippet, e);
            // 一定要把"为什么失败"带回去：前端只看到「服务器繁忙」根本无从排查。
            // 这里把解析器的错误位置信息也带上，能直接定位到坏在哪个字符。
            throw new ServiceException("页面数据格式非法，已拒绝保存（长度 " + pageData.length()
                    + "，位置 " + extractPosition(e.getMessage()) + "），请刷新页面后重试");
        }
    }

    /**
     * 从 JSON 解析异常里提取"出错位置"，用于提示。
     *
     * @param message 异常消息
     * @return 位置描述，取不到时返回 unknown
     */
    /**
     * 取出出错位置附近的片段（用于日志定位）。
     *
     * @param text    原始 JSON
     * @param message 解析异常消息（含位置）
     * @param radius  前后各取多少字符
     * @return 片段
     */
    private String snippetAround(String text, String message, int radius) {
        int pos = 0;
        if (message != null) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d+)").matcher(message);
            if (matcher.find()) {
                try {
                    pos = Integer.parseInt(matcher.group(1));
                } catch (NumberFormatException ignored) {
                    pos = 0;
                }
            }
        }
        int from = Math.max(0, pos - radius);
        int to = Math.min(text.length(), pos + radius);
        String snippet = text.substring(from, to);
        // 转义引号与换行，保证日志单行可读
        return snippet.replace("\n", "\\n").replace("\r", "");
    }

    private String extractPosition(String message) {
        if (message == null) {
            return "unknown";
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d+)").matcher(message);
        return matcher.find() ? matcher.group(1) : "unknown";
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PageData releasePageData(String id) {
        PageData pageData = this.getCurrentPageData(id);
        if (pageData == null) {
            throw new ServiceException(ResultCode.PAGE_NOT_EXIST);
        }

        //如果已经发布，不能重复发布
        if (pageData.getPageShow().equals(SwitchEnum.OPEN.name())) {
            throw new ServiceException(ResultCode.PAGE_RELEASE_ERROR);
        }

        LambdaUpdateWrapper<PageData> lambdaUpdateWrapper = Wrappers.lambdaUpdate();
        lambdaUpdateWrapper.set(PageData::getPageShow, SwitchEnum.CLOSE.name());
        lambdaUpdateWrapper.eq(PageData::getPageType, pageData.getPageType());
        lambdaUpdateWrapper.eq(PageData::getPageClientType, pageData.getPageClientType());
        //如果是店铺需要设置店铺ID
        if (pageData.getPageType().equals(PageEnum.STORE.value())) {
            lambdaUpdateWrapper.eq(PageData::getNum, pageData.getNum());
        }
        //设置禁用所有店铺首页
        this.update(lambdaUpdateWrapper);

        //将当前页面启用
        LambdaUpdateWrapper<PageData> wrapper = Wrappers.lambdaUpdate();
        wrapper.set(PageData::getPageShow, SwitchEnum.OPEN.name());
        wrapper.eq(PageData::getId, pageData.getId());
        this.update(wrapper);
        return pageData;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean removePageData(String id) {
        PageData pageData = this.getCurrentPageData(id);
        if (pageData == null) {
            throw new ServiceException(ResultCode.PAGE_NOT_EXIST);
        }

        //专题则直接进行删除
        if (pageData.getPageType().equals(PageEnum.SPECIAL.name())) {
            return this.removeById(id);
        }
        //店铺、平台首页需要判断是否开启，开启则无法删除
        if (pageData.getPageShow().equals(SwitchEnum.OPEN.name())) {
            throw new ServiceException(ResultCode.PAGE_OPEN_DELETE_ERROR);
        }
        //判断是否有其他页面，如果没有其他的页面则无法进行删除
        LambdaQueryWrapper<PageData> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(PageData::getPageType, pageData.getPageType());
        queryWrapper.eq(pageData.getPageClientType() != null, PageData::getPageClientType, pageData.getPageClientType());
        //如果为店铺页面需要设置店铺ID
        if (pageData.getPageType().equals(PageEnum.STORE.name())) {
            queryWrapper.eq(pageData.getNum() != null, PageData::getNum, pageData.getNum());
        }
        //判断是否为唯一的页面
        if (this.baseMapper.getPageDataNum(queryWrapper) == 1) {
            throw new ServiceException(ResultCode.PAGE_DELETE_ERROR);
        }
        return this.removeById(id);
    }

    @Override
    public PageDataVO getPageData(PageDataDTO pageDataDTO) {

        //如果获取的是专题、店铺页面数据需要传入ID
        if (!pageDataDTO.getPageType().equals(PageEnum.INDEX.name()) && pageDataDTO.getNum() == null) {
            throw new ServiceException(ResultCode.PAGE_NOT_EXIST);
        }
        QueryWrapper<PageDataVO> queryWrapper = Wrappers.query();
        queryWrapper.eq("page_type", pageDataDTO.getPageType());
        queryWrapper.eq(pageDataDTO.getNum() != null, "num", pageDataDTO.getNum());
        queryWrapper.eq("page_show", SwitchEnum.OPEN.name());

        queryWrapper.eq("page_client_type", pageDataDTO.getPageClientType());

        return this.baseMapper.getPageData(queryWrapper);
    }

    @Override
    public IPage<PageDataListVO> getPageDataList(PageVO pageVO, PageDataDTO pageDataDTO) {
        QueryWrapper<PageDataListVO> queryWrapper = Wrappers.query();
        queryWrapper.eq(pageDataDTO.getPageType() != null, "page_type", pageDataDTO.getPageType());
        queryWrapper.eq(pageDataDTO.getNum() != null, "num", pageDataDTO.getNum());
        queryWrapper.eq(pageDataDTO.getPageClientType() != null, "page_client_type", pageDataDTO.getPageClientType());

        return this.baseMapper.getPageDataList(PageUtil.initPage(pageVO), queryWrapper);

    }

    @Override
    public PageData getStorePageData(String storeId, String id) {
        return this.getOne(new LambdaQueryWrapper<PageData>()
                .eq(PageData::getPageType, PageEnum.STORE.name())
                .eq(PageData::getNum, storeId)
                .eq(PageData::getId, id));
    }

    @Override
    public void checkStoreAuthority(String storeId, String id) {
        PageData pageData = this.getStorePageData(storeId, id);
        if (pageData == null) {
            throw new ServiceException(ResultCode.USER_AUTHORITY_ERROR);
        }
    }

    @Override
    public PageData getSpecialByName(String name) {
        return this.getOne(new LambdaQueryWrapper<PageData>()
                .eq(PageData::getPageType, PageEnum.SPECIAL.name())
                .eq(PageData::getName, name));
    }

    @Override
    public PageData getSpecial(String id) {
        return this.getById(id);
    }

    private PageData getCurrentPageData(String id) {
        AuthUser currentUser = Objects.requireNonNull(UserContext.getCurrentUser());
        return this.getOne(new LambdaQueryWrapper<PageData>()
                .eq(CharSequenceUtil.equals(currentUser.getRole().name(), UserEnums.STORE.name()), PageData::getPageType, PageEnum.STORE.name())
                .eq(CharSequenceUtil.equals(currentUser.getRole().name(), UserEnums.STORE.name()), PageData::getNum, UserContext.getCurrentUser().getStoreId())
                .eq(PageData::getId, id), false);

    }
}

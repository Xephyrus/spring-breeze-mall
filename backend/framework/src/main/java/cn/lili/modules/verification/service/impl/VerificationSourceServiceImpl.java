package cn.lili.modules.verification.service.impl;

import cn.hutool.core.text.CharSequenceUtil;
import cn.lili.cache.Cache;
import cn.lili.common.vo.PageVO;
import cn.lili.common.vo.SearchVO;
import cn.lili.modules.system.mapper.VerificationSourceMapper;
import cn.lili.modules.verification.entity.dos.VerificationSource;
import cn.lili.modules.verification.entity.dto.VerificationDTO;
import cn.lili.modules.verification.entity.enums.VerificationSourceEnum;
import cn.lili.modules.verification.service.VerificationSourceService;
import cn.lili.mybatis.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * 验证码资源维护 业务层实现
 *
 * @author Chopper
 * @since 2020/11/17 3:48 下午
 */
@Service
public class VerificationSourceServiceImpl extends ServiceImpl<VerificationSourceMapper, VerificationSource> implements VerificationSourceService {

    @Autowired
    private Cache<Object> cache;

    @Override
    public VerificationDTO initCache() {
        List<VerificationSource> dbList = this.list();
        List<VerificationSource> resourceList = new ArrayList<>();
        List<VerificationSource> sliderList = new ArrayList<>();
        for (VerificationSource item : dbList) {
            if (item.getType().equals(VerificationSourceEnum.RESOURCE.name())) {
                resourceList.add(item);
            } else if (item.getType().equals(VerificationSourceEnum.SLIDER.name())) {
                sliderList.add(item);
            }
        }
        VerificationDTO verificationDTO = new VerificationDTO();
        verificationDTO.setVerificationResources(resourceList);
        verificationDTO.setVerificationSlider(sliderList);
        cache.put(VERIFICATION_CACHE, verificationDTO);
        return verificationDTO;
    }

    @Override
    public VerificationDTO getVerificationCache() {
        VerificationDTO verificationDTO;
        try {
            verificationDTO = cache.get(VERIFICATION_CACHE);
        } catch (ClassCastException cce) {
            verificationDTO = null;
        }
        if (verificationDTO == null || verificationDTO.getVerificationResources().size() <= 0 || verificationDTO.getVerificationSlider().size() <= 0) {
            return initCache();
        }
        return verificationDTO;
    }

    @Override
    public IPage<VerificationSource> getByPage(VerificationSource entity, SearchVO searchVO, PageVO pageVO) {
        IPage<VerificationSource> page = this.page(PageUtil.initPage(pageVO), PageUtil.initWrapper(entity, searchVO));
        if (page != null && page.getRecords() != null) {
            for (VerificationSource item : page.getRecords()) {
                item.setResource(toBrowsableResourceUrl(item.getResource()));
            }
        }
        return page;
    }

    /**
     * 浏览器不能加载 file:// 或磁盘绝对路径，统一改为 /files/verification/**。
     */
    static String toBrowsableResourceUrl(String resource) {
        if (CharSequenceUtil.isBlank(resource)) {
            return resource;
        }
        String trimmed = resource.trim();
        try {
            if (trimmed.regionMatches(true, 0, "file:", 0, 5)) {
                Path path = Paths.get(URI.create(trimmed));
                String name = path.getFileName() != null ? path.getFileName().toString() : "";
                if (CharSequenceUtil.isNotBlank(name)) {
                    return "/files/verification/" + name;
                }
            }
            // F:/.../verification/bg1.jpg 或含 verification 段的本地路径
            if ((trimmed.length() > 2 && trimmed.charAt(1) == ':')
                    || trimmed.contains("\\verification\\")
                    || trimmed.contains("/verification/")) {
                String name = trimmed.replace('\\', '/');
                name = name.substring(name.lastIndexOf('/') + 1);
                if (CharSequenceUtil.isNotBlank(name) && name.contains(".")) {
                    return "/files/verification/" + name;
                }
            }
        } catch (Exception ignored) {
            // 保持原值
        }
        return trimmed;
    }
}

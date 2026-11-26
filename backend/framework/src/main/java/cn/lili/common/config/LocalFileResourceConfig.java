package cn.lili.common.config;

import cn.hutool.core.text.CharSequenceUtil;
import cn.lili.common.properties.LocalFileProperties;
import cn.lili.common.utils.LocalDataPathResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.net.URI;
import java.nio.file.Path;

/**
 * 本地上传文件静态访问映射。
 */
// @Configuration 已停用：Spring 静态资源处理器对 Range 请求统一返回 416（视频无法播放）
public class LocalFileResourceConfig implements WebMvcConfigurer {

    @Autowired
    private LocalFileProperties localFileProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String urlPrefix = CharSequenceUtil.blankToDefault(localFileProperties.getUrlPrefix(), "/files");
        String requestPrefix = CharSequenceUtil.removeSuffix(toRequestPath(urlPrefix), "/");

        Path uploadsRoot = LocalDataPathResolver.resolveExistingDir(localFileProperties.getPath());
        registry.addResourceHandler(requestPrefix + "/**")
                .addResourceLocations(toLocation(uploadsRoot));

        // 验证码素材可能在 data/verification（与 uploads 同级），单独挂到 /files/verification/**
        Path verificationRoot = LocalDataPathResolver.resolveVerificationDir(localFileProperties.getPath());
        registry.addResourceHandler(requestPrefix + "/verification/**")
                .addResourceLocations(toLocation(verificationRoot));
    }

    private static String toLocation(Path root) {
        return CharSequenceUtil.addSuffixIfNot(root.toAbsolutePath().normalize().toUri().toString(), "/");
    }

    private String toRequestPath(String urlPrefix) {
        try {
            URI uri = URI.create(urlPrefix);
            if (uri.isAbsolute() && CharSequenceUtil.isNotBlank(uri.getPath())) {
                return uri.getPath();
            }
        } catch (Exception ignored) {
            // 配置不是完整 URI 时按普通路径处理。
        }
        return urlPrefix.startsWith("/") ? urlPrefix : "/" + urlPrefix;
    }
}
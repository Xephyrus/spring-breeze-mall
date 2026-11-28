package cn.lili.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 本地文件访问配置。
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "lili.local-file")
public class LocalFileProperties {

    /**
     * 本地文件保存目录
     */
    private String path = "data/uploads";

    /**
     * 对外访问路径前缀
     */
    private String urlPrefix = "/files";

    /**
     * 对外访问的绝对地址（如 http://127.0.0.1:8888）。
     *
     * 为什么需要：小程序端的 image src 若写成 `/files/xxx`，会被当成小程序项目内的
     * 相对文件去加载，结果是 500/404；H5 因为同源相对路径能通，问题被掩盖。
     * 配置后 {@code FileUrlService} 会把本地文件地址拼成绝对地址返回。
     *
     * 留空则保持原样（H5 同源部署可不配）。
     */
    private String publicBaseUrl;
}

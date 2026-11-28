package cn.lili.modules.file.service;

import cn.lili.common.properties.LocalFileProperties;
import cn.lili.modules.file.entity.enums.OssEnum;
import cn.lili.modules.system.entity.dto.OssSetting;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FileUrlServiceTest {

    private final FileUrlService fileUrlService = new FileUrlService();

    /**
     * 验证关闭CDN时保留原始文件地址。
     */
    @Test
    void toPublicUrlShouldKeepOriginalWhenCdnDisabled() {
        OssSetting setting = new OssSetting();
        setting.setType(OssEnum.LOCAL.name());
        setting.setLocalFileUrlPrefix("/files");
        setting.setCdnEnabled(false);
        setting.setCdnUrlPrefix("https://cdn.example.com");

        assertEquals("/files/MANAGER/a.png", fileUrlService.toPublicUrl("/files/MANAGER/a.png", setting));
    }

    /**
     * 验证开启CDN时重写本地存储文件地址。
     */
    @Test
    void toPublicUrlShouldRewriteLocalStoragePathWhenCdnEnabled() {
        OssSetting setting = new OssSetting();
        setting.setType(OssEnum.LOCAL.name());
        setting.setLocalFileUrlPrefix("/files");
        setting.setCdnEnabled(true);
        setting.setCdnUrlPrefix("https://cdn.example.com/assets/");

        assertEquals("https://cdn.example.com/assets/files/MANAGER/a.png?x=1",
                fileUrlService.toPublicUrl("/files/MANAGER/a.png?x=1", setting));
    }

    /**
     * 验证开启CDN时重写云存储源站地址。
     */
    @Test
    void toPublicUrlShouldRewriteCloudOriginWhenCdnEnabled() {
        OssSetting setting = new OssSetting();
        setting.setType(OssEnum.ALI_OSS.name());
        setting.setAliyunOSSBucketName("demo-bucket");
        setting.setAliyunOSSEndPoint("oss-cn-hangzhou.aliyuncs.com");
        setting.setCdnEnabled(true);
        setting.setCdnUrlPrefix("https://img.example.com");

        assertEquals("https://img.example.com/goods/a.png",
                fileUrlService.toPublicUrl("https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/goods/a.png", setting));
    }

    /**
     * 验证COS地址重写不附加图片处理参数。
     */
    @Test
    void toPublicUrlShouldRewriteCosOriginWithoutImageProcessing() {
        OssSetting setting = new OssSetting();
        setting.setType(OssEnum.TENCENT_COS.name());
        setting.setTencentCOSBucket("demo-123");
        setting.setTencentCOSRegion("ap-shanghai");
        setting.setCdnEnabled(true);
        setting.setCdnUrlPrefix("https://cdn.example.com");

        assertEquals("https://cdn.example.com/goods/a.png",
                fileUrlService.toPublicUrl("https://demo-123.cos.ap-shanghai.myqcloud.com/goods/a.png", setting));
    }

    /**
     * 验证HTML及JSON文本中的文件地址能够重写。
     */
    @Test
    void rewriteTextShouldHandleHtmlAndJsonContent() {
        OssSetting setting = new OssSetting();
        setting.setType(OssEnum.LOCAL.name());
        setting.setLocalFileUrlPrefix("/files");
        setting.setCdnEnabled(true);
        setting.setCdnUrlPrefix("https://cdn.example.com");

        assertEquals("<p><img src=\"https://cdn.example.com/files/article/a.png\"></p>",
                fileUrlService.rewriteText("<p><img src=\"/files/article/a.png\"></p>", setting));
        assertEquals("{\"image\":\"https://cdn.example.com/files/page/a.png\"}",
                fileUrlService.rewriteText("{\"image\":\"/files/page/a.png\"}", setting));
    }

    /**
     * 未开启 CDN 但配置了 local-file.public-base-url 时，本地文件地址应补成绝对地址。
     *
     * 场景：小程序端 image src 为 `/files/xxx` 会被当成项目内相对文件加载（500/404），
     * 只有绝对地址才能渲染 —— 这正是「本地上传图片显示不出来」的根因。
     */
    @Test
    void toPublicUrlShouldAbsolutizeLocalFileWhenBaseUrlConfigured() {
        OssSetting setting = new OssSetting();
        setting.setType(OssEnum.LOCAL.name());
        setting.setLocalFileUrlPrefix("/files");
        setting.setCdnEnabled(false);

        FileUrlService service = new FileUrlService();
        LocalFileProperties properties = new LocalFileProperties();
        properties.setPublicBaseUrl("http://127.0.0.1:8888");
        setField(service, "localFileProperties", properties);

        assertEquals("http://127.0.0.1:8888/files/MANAGER/a.png",
                service.toPublicUrl("/files/MANAGER/a.png", setting));
        // 已带域名的地址不重复拼接
        assertEquals("https://cdn.example.com/files/a.png",
                service.toPublicUrl("https://cdn.example.com/files/a.png", setting));
        // 非本地前缀的普通路径不动
        assertEquals("goods/a.png", service.toPublicUrl("goods/a.png", setting));
    }

    private static void setField(Object target, String name, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
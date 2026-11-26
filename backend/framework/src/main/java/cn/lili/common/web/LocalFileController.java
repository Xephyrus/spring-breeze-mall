package cn.lili.common.web;

import cn.hutool.core.text.CharSequenceUtil;
import cn.lili.common.properties.LocalFileProperties;
import cn.lili.common.utils.LocalDataPathResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

/**
 * 本地存储文件访问。
 * <p>
 * 为什么不用 Spring 的静态资源处理器：它在本项目里对 `Range` 请求统一返回 416，
 * 导致浏览器无法拖动/播放视频（视频必须走 206 分段响应）。这里显式实现单区间 Range，
 * 并补齐 Content-Type / Accept-Ranges / Content-Range。
 *
 * @author Bulbasaur
 * @since 2026-11-24
 */
@Slf4j
@RestController
public class LocalFileController {

    /**
     * 单次 Range 请求最多返回的字节数，避免一次拉完整段视频
     */
    private static final long MAX_RANGE_SIZE = 4L * 1024 * 1024;

    @Autowired
    private LocalFileProperties localFileProperties;

    /**
     * 读取本地文件；支持单区间 Range（视频拖动/边下边播依赖它）。
     *
     * @param request 请求
     * @return 200 完整文件，或 206 指定区间
     */
    @GetMapping("/files/**")
    public ResponseEntity<?> read(HttpServletRequest request) throws IOException {
        String relative = resolveRelativePath(request);
        log.debug("本地文件请求 uri={} range={}", request.getRequestURI(), request.getHeader(HttpHeaders.RANGE));
        if (CharSequenceUtil.isBlank(relative)) {
            return ResponseEntity.notFound().build();
        }

        Path root;
        String name;
        if (relative.startsWith("verification/")) {
            root = LocalDataPathResolver.resolveVerificationDir(localFileProperties.getPath());
            name = relative.substring("verification/".length());
        } else {
            root = LocalDataPathResolver.resolveExistingDir(localFileProperties.getPath());
            name = relative;
        }

        Path rootAbs = root.toAbsolutePath().normalize();
        Path target = rootAbs.resolve(name).normalize();
        // 防目录穿越
        if (!target.startsWith(rootAbs) || !Files.isRegularFile(target)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(target);
        long length = Files.size(target);
        MediaType mediaType = resolveMediaType(target.getFileName().toString());

        String rangeHeader = request.getHeader(HttpHeaders.RANGE);
        if (CharSequenceUtil.isBlank(rangeHeader)) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .contentLength(length)
                    .body(resource);
        }

        long[] range = parseRange(rangeHeader, length);
        if (range == null) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + length)
                    .build();
        }

        long start = range[0];
        long end = range[1];
        long regionLength = end - start + 1;
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + length)
                .contentType(mediaType)
                .contentLength(regionLength)
                .body(rangeResource(target, start, regionLength));
    }

    /**
     * 从请求 URI 中截出 `/files/` 之后的相对路径。
     */
    private String resolveRelativePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (CharSequenceUtil.isNotBlank(contextPath) && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }
        String prefix = CharSequenceUtil.blankToDefault(localFileProperties.getUrlPrefix(), "/files");
        prefix = CharSequenceUtil.removeSuffix(prefix.trim(), "/");
        if (!prefix.startsWith("/")) {
            prefix = "/" + prefix;
        }
        if (!uri.startsWith(prefix + "/")) {
            return "";
        }
        String relative = uri.substring(prefix.length() + 1);
        // URI 里可能是百分号编码（中文文件名），解码后再定位文件
        return URLDecoder.decode(relative, StandardCharsets.UTF_8);
    }

    /**
     * 解析单区间 Range，如 `bytes=0-1023`、`bytes=100-`、`bytes=-500`。
     *
     * @param header Range 头
     * @param length 文件总长度
     * @return [start, end]；不合法返回 null
     */
    private long[] parseRange(String header, long length) {
        String value = header.trim();
        if (!value.toLowerCase(Locale.ROOT).startsWith("bytes=")) {
            return null;
        }
        String spec = value.substring("bytes=".length()).trim();
        // 只支持单区间
        if (spec.contains(",")) {
            return null;
        }
        int dash = spec.indexOf('-');
        if (dash < 0) {
            return null;
        }
        String startText = spec.substring(0, dash).trim();
        String endText = spec.substring(dash + 1).trim();

        long start;
        long end;
        try {
            if (startText.isEmpty()) {
                // 后缀区间：最后 N 字节
                if (endText.isEmpty()) {
                    return null;
                }
                long suffix = Long.parseLong(endText);
                if (suffix <= 0) {
                    return null;
                }
                start = Math.max(0, length - suffix);
                end = length - 1;
            } else {
                start = Long.parseLong(startText);
                end = endText.isEmpty() ? length - 1 : Long.parseLong(endText);
            }
        } catch (NumberFormatException e) {
            return null;
        }

        if (start < 0 || start >= length || end < start) {
            return null;
        }
        end = Math.min(end, length - 1);
        // 限制单次返回大小，避免一次拉完整个视频
        end = Math.min(end, start + MAX_RANGE_SIZE - 1);
        return new long[]{start, end};
    }

    /**
     * 推断响应类型，未知时退回二进制流。
     */
    private MediaType resolveMediaType(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        int dot = lower.lastIndexOf('.');
        String ext = dot >= 0 ? lower.substring(dot + 1) : "";
        return switch (ext) {
            case "mp4" -> MediaType.valueOf("video/mp4");
            case "webm" -> MediaType.valueOf("video/webm");
            case "ogg" -> MediaType.valueOf("video/ogg");
            case "mp3" -> MediaType.valueOf("audio/mpeg");
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.valueOf("image/webp");
            case "svg" -> MediaType.valueOf("image/svg+xml");
            case "pdf" -> MediaType.APPLICATION_PDF;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
/**
     * 构造区间资源：从 start 开始、最多 length 字节的输入流。
     * 不依赖 ResourceRegionHttpMessageConverter（本项目未注册该转换器）。
     */
    private InputStreamResource rangeResource(Path target, long start, long length) throws IOException {
        InputStream source = Files.newInputStream(target);
        long skipped = source.skip(start);
        if (skipped < start) {
            source.close();
            throw new IOException("无法定位文件读取位置: " + start);
        }
        return new InputStreamResource(new BoundedInputStream(source, length)) {
            @Override
            public long contentLength() {
                return length;
            }

            @Override
            public String getFilename() {
                return target.getFileName().toString();
            }
        };
    }

    /**
     * 限定最多读取指定字节数的输入流，用于 Range 响应。
     */
    private static final class BoundedInputStream extends InputStream {

        private final InputStream delegate;

        private long remaining;

        private BoundedInputStream(InputStream delegate, long limit) {
            this.delegate = delegate;
            this.remaining = limit;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) {
                return -1;
            }
            int value = delegate.read();
            if (value >= 0) {
                remaining--;
            }
            return value;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            if (remaining <= 0) {
                return -1;
            }
            int toRead = (int) Math.min(length, remaining);
            int read = delegate.read(buffer, offset, toRead);
            if (read > 0) {
                remaining -= read;
            }
            return read;
        }

        @Override
        public void close() throws IOException {
            delegate.close();
        }
    }
}

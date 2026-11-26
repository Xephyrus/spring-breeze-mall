package cn.lili.common.utils;

import cn.hutool.core.text.CharSequenceUtil;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 解析 backend/data 下本地目录，兼容从 backend/ 或 *-api 模块目录启动。
 */
public final class LocalDataPathResolver {

    private LocalDataPathResolver() {
    }

    /**
     * 将相对配置路径解析为存在的绝对目录；不存在时返回基于 user.dir 的绝对路径。
     */
    public static Path resolveExistingDir(String configuredPath) {
        String path = CharSequenceUtil.blankToDefault(configuredPath, "data/uploads");
        Path configured = Paths.get(path);
        if (configured.isAbsolute()) {
            return configured.normalize();
        }

        Path userDir = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        Path direct = userDir.resolve(configured).normalize();
        if (Files.isDirectory(direct)) {
            return direct;
        }

        Path parent = userDir.getParent();
        if (parent != null) {
            Path fromParent = parent.resolve(configured).normalize();
            if (Files.isDirectory(fromParent)) {
                return fromParent;
            }
        }

        // 再向上一层（例如从 target 或嵌套目录启动）
        Path grandParent = parent != null ? parent.getParent() : null;
        if (grandParent != null) {
            Path fromGrand = grandParent.resolve(configured).normalize();
            if (Files.isDirectory(fromGrand)) {
                return fromGrand;
            }
        }

        return direct;
    }

    /**
     * 验证码素材目录：优先 data/uploads/verification，其次 data/verification。
     */
    public static Path resolveVerificationDir(String uploadsConfiguredPath) {
        Path uploads = resolveExistingDir(uploadsConfiguredPath);
        Path underUploads = uploads.resolve("verification");
        if (Files.isDirectory(underUploads)) {
            return underUploads.normalize();
        }
        Path sibling = uploads.getParent() != null
                ? uploads.getParent().resolve("verification")
                : Paths.get("data/verification");
        if (Files.isDirectory(sibling)) {
            return sibling.normalize();
        }
        return underUploads.normalize();
    }
}

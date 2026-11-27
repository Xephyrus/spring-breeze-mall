import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import viteCompression from "vite-plugin-compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * im 的 Vite 配置（从 vue.config.js 迁移）。
 *
 * 与 manager/seller 的差异：
 * 1. 环境变量沿用 `VUE_APP_` 前缀（envPrefix），部署脚本无需改名；
 * 2. **保留 Less**：50 个 SFC 用 `lang="less"` 且内联 Less 变量，转 SCSS 属纯风险；
 * 3. svg 图标仍走雪碧图（原 svg-sprite-loader → vite-plugin-svg-icons）；
 * 4. element-plus 仍全量引入（M1 先降风险，按需引入放在 M4）。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const isProd = mode === "production";

  return {
    base: env.VUE_APP_PUBLIC_PATH || "/",
    // 兼容 vue-cli 时代的 VUE_APP_ 前缀，代码里用 import.meta.env.VUE_APP_XXX 读取
    envPrefix: "VUE_APP_",
    plugins: [
      vue(),
      // src/icons/svg 下的文件打成雪碧图，symbolId 与原来保持一致（icon-[name]）
      createSvgIconsPlugin({
        iconDirs: [path.resolve(rootDir, "src/icons/svg")],
        symbolId: "icon-[name]",
      }),
      ...(isProd ? [viteCompression({ threshold: 10240 })] : []),
    ],
    resolve: {
      alias: { "@": path.resolve(rootDir, "src") },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          // 等价于原 style-resources-loader：全局注入主题变量（注入自身时跳过，避免递归）
          additionalData: (content: string, filepath: string) => {
            const normalized = filepath.replace(/\\/g, "/");
            if (
              normalized.includes("node_modules") ||
              normalized.endsWith("/assets/css/variable.less")
            ) {
              return content;
            }
            return `@import "@/assets/css/variable.less";\n${content}`;
          },
        },
      },
    },
    server: {
      port: 8000,
      host: true,
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: "element-plus", test: /[\\/]node_modules[\\/]element-plus[\\/]/ },
              { name: "vue-vendor", test: /[\\/]node_modules[\\/](vue|vue-router|pinia)([\\/]|$)/ },
            ],
          },
        },
      },
    },
  };
});

import { defineConfig, loadEnv, type PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import viteCompression from "vite-plugin-compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * buyer 的 Vite 配置（从 vue.config.js 迁移）。
 *
 * 与 vue-cli 版本的对应关系：
 * - `css.loaderOptions.sass.additionalData` → `css.preprocessorOptions.scss.additionalData`
 *   （保持原行为：把 `assets/styles/global.scss` 注入每个 SFC 的 SCSS 块）；
 * - `css.loaderOptions.less.lessOptions.javascriptEnabled` → `preprocessorOptions.less.javascriptEnabled`；
 * - `devServer.port` → `server.port`（10000，来源 `src/config/index.js`）；
 * - `configureWebpack.plugins` 的 CompressionPlugin → `vite-plugin-compression`（仅生产）；
 * - `chainWebpack` 的 `drop_console` → `output.minify.compress.dropConsole`（仅生产，与 seller 一致）；
 * - `publicPath` → `base`（读取 `VUE_APP_PUBLIC_PATH`）。
 *
 * 已知差异：vue-cli 的 `devServer.client.overlay.runtimeErrors` 过滤
 * （跳过已向用户提示过的请求错误）在 Vite 里没有等价配置，见 MIGRATION-BUYER.md。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const isProd = mode === "production";

  const plugins: PluginOption[] = [vue()];
  if (isProd) {
    plugins.push(viteCompression({ threshold: 10240, test: /\.(js|css|html)$/ }));
  }

  return {
    base: env.VUE_APP_PUBLIC_PATH || "/",
    // 兼容 vue-cli 时代的 VUE_APP_ 前缀
    envPrefix: "VUE_APP_",
    plugins,
    resolve: {
      alias: { "@": path.resolve(rootDir, "src") },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 与 vue.config.js 一致：全局注入变量与基础样式。
          // 两个例外：global.scss 自身、以及已显式 @import 它的文件（否则重复注入）。
          additionalData: (content: string, filepath: string) => {
            const normalized = filepath.replace(/\\/g, "/");
            if (
              normalized.includes("node_modules") ||
              normalized.endsWith("/assets/styles/global.scss") ||
              content.includes('@import "@/assets/styles/global.scss"')
            ) {
              return content;
            }
            return `@import "@/assets/styles/global.scss";\n${content}`;
          },
          sassOptions: {
            silenceDeprecations: ["legacy-js-api", "import"],
          },
        },
        less: {
          javascriptEnabled: true,
        },
      },
    },
    server: {
      port: 10000,
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
          // 等价于 vue-cli 的 terser drop_console（仅生产）
          minify: isProd
            ? {
                compress: {
                  dropConsole: true,
                  dropDebugger: true,
                },
              }
            : undefined,
        },
      },
    },
  };
});

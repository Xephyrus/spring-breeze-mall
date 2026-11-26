import { defineConfig, loadEnv, type PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import viteCompression from "vite-plugin-compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
// 必须指向 index 文件本身：目录索引在 Vite 的 configLoader: 'native' 下不被支持
import appConfig from "./src/config/index.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const isProd = mode === "production";

  const plugins: PluginOption[] = [
    vue(),
    // 模板里的 el-* 按需引入：只打包真正用到的组件，避免 1MB 的 element-plus 全量进首屏
    // importStyle: false —— 样式仍由 plugins/element.ts 里的全量 CSS 提供，
    // 避免「按需样式 + 全量样式」重复，也降低样式缺失的风险
    Components({
      dts: "src/components.d.ts",
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
  ];
  if (isProd) {
    plugins.push(
      viteCompression({
        threshold: 10240,
      })
    );
  }

  return {
    base: env.VITE_PUBLIC_PATH || "/",
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    css: {
      // Vite 8 defaults to Lightning CSS minify; allow stripping legacy IE hacks like *zoom
      lightningcss: {
        errorRecovery: true,
      },
      preprocessorOptions: {
        scss: {
          additionalData: (content: string, filepath: string) => {
            const normalized = filepath.replace(/\\/g, "/");
            if (
              normalized.includes("/styles/variables.scss") ||
              normalized.includes("node_modules")
            ) {
              return content;
            }
            // Match former style-resources-loader behavior
            return `@import "@/styles/variables.scss";\n${content}`;
          },
          silenceDeprecations: ["legacy-js-api", "import"],
        },
      },
    },
    server: {
      port: appConfig.port,
      host: true,
      // 本地存储的文件由 manager-api 提供（/files/**）。开发期走代理，
      // 后端只需返回 /files/xxx 这类相对路径；生产环境由 nginx 同源转发。
      proxy: {
        "/files": {
          target: "http://127.0.0.1:8887",
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      // Vite 8: Rolldown; prefer rolldownOptions over deprecated rollupOptions
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "element-plus",
                test: /[\\/]node_modules[\\/]element-plus[\\/]/,
              },
              {
                name: "antv",
                test: /[\\/]node_modules[\\/]@antv[\\/]/,
              },
              {
                name: "vue-vendor",
                test: /[\\/]node_modules[\\/](vue|vue-router|pinia)([\\/]|$)/,
              },
            ],
          },
          // Remove console calls and debugger statements from production bundles.
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
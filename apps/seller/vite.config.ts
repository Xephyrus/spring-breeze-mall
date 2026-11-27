import { defineConfig, loadEnv, type PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import viteCompression from "vite-plugin-compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
// 必须指向 index 文件本身：目录索引在 Vite 的 configLoader: 'native' 下不被支持
import appConfig from "./src/config/index.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const isProd = mode === "production";

  const plugins: PluginOption[] = [
    vue(),
    // 模板里的 el-* 按需引入（原 webpack 版 unplugin-vue-components 迁移）
    // importStyle: false —— 样式仍由 plugins/element.js 的全量 CSS 提供，避免覆盖顺序变化
    Components({
      dts: "src/components.d.ts",
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
  ];
  if (isProd) {
    plugins.push(viteCompression({ threshold: 10240 }));
  }

  return {
    base: env.VITE_PUBLIC_PATH || "/",
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
        // 与 vue.config.js 的 chainWebpack alias 保持一致
        "@/components/lili": path.resolve(rootDir, "src/views/my-components/lili"),
        "@/components/map": path.resolve(rootDir, "src/views/my-components/map"),
        "@/components/lili-dialog": path.resolve(rootDir, "src/views/lili-dialog"),
        "@/components/hotzone": path.resolve(rootDir, "src/views/shop/hotzone"),
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    css: {
      lightningcss: { errorRecovery: true },
      preprocessorOptions: {
        // 等价于原 style-resources-loader：把 SCSS 变量注入每个 SFC 的样式块，
        // 只注入变量文件（不产出 CSS），避免通用样式被复制上百份
        scss: {
          additionalData: (content: string, filepath: string) => {
            const normalized = filepath.replace(/\\/g, "/");
            if (
              normalized.includes("node_modules") ||
              normalized.endsWith("/styles/variables.scss")
            ) {
              return content;
            }
            return `@import "@/styles/variables.scss";\n${content}`;
          },
          silenceDeprecations: ["legacy-js-api", "import"],
        },
      },
    },
    server: {
      port: appConfig.port,
      host: true,
      // 本地存储的文件由 manager-api 提供（/files/**），开发期走代理
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

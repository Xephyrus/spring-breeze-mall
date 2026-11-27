import { defineConfig, loadEnv, type PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
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
 * 4. element-plus 已改为**按需引入**（M4.2）：模板里的 el-* 由
 *    unplugin-vue-components 自动注册，样式随组件引入，不再全量打 CSS。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const isProd = mode === "production";

  const plugins: PluginOption[] = [
    vue(),
    // 模板里的 el-* 按需引入 + 按需样式
    Components({
      dts: "src/components.d.ts",
      // 只处理 element-plus 的 el-*：本地组件由各自的 import / app.component 注册，
      // 不让插件扫描 src/components（避免与显式注册重复、也避免 d.ts 里出现本地组件）
      dirs: [],
      resolvers: [ElementPlusResolver()],
    }),
    // src/icons/svg 下的文件打成雪碧图，symbolId 与原来保持一致（icon-[name]）
    createSvgIconsPlugin({
      iconDirs: [path.resolve(rootDir, "src/icons/svg")],
      symbolId: "icon-[name]",
    }),
  ];
  if (isProd) {
    plugins.push(viteCompression({ threshold: 10240 }));
  }

  return {
    base: env.VUE_APP_PUBLIC_PATH || "/",
    // 兼容 vue-cli 时代的 VUE_APP_ 前缀，代码里用 import.meta.env.VUE_APP_XXX 读取
    envPrefix: "VUE_APP_",
    plugins,
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

/**
 * 复用uni编译插件；HBuilderX构建统一使用编译器配套的Vue内部包，避免项目依赖与内置运行时混用。
 * @author Bulbasaur
 * @since 2026-11-20
 */
import path from 'node:path';
import { createRequire } from 'node:module';

const hbuilderContext = (process.env.UNI_PROJECT_TYPE === 'hbuilder' || process.env.RUN_BY_HBUILDERX)
  ? process.env.UNI_CLI_CONTEXT
  : null;
const hbuilderModules = hbuilderContext
  ? path.join(hbuilderContext, 'node_modules')
  : process.env.UNI_HBUILDERX_PLUGINS
    ? path.join(process.env.UNI_HBUILDERX_PLUGINS, 'uniapp-cli-vite', 'node_modules')
    : null;
const resolveFrom = createRequire(path.join(hbuilderModules || process.env.UNI_INPUT_DIR || process.cwd(), 'build-config.cjs'));
const uniModule = resolveFrom('@dcloudio/vite-plugin-uni');
const uni = uniModule.default || uniModule;
const alias = {};
if (hbuilderModules) {
  for (const name of ['shared', 'reactivity', 'runtime-core', 'runtime-dom']) {
    alias[`@vue/${name}`] = path.join(hbuilderModules, '@vue', name, 'dist', `${name}.esm-bundler.js`);
  }
}

export default { plugins: [uni()], resolve: { alias } };

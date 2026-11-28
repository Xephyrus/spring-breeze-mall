/**
 * Node ESM 的解析钩子：让 `import './x'`（无扩展名）也能解析到 `.ts`。
 *
 * 为什么需要它：
 * - 测试脚本用 Node 直接跑 uni 的 utils，而这些模块平时由 HBuilderX/Vite 打包，
 *   源码里写的是**无扩展名**的相对导入（`import './decorate-link'`）；
 * - Node 的 ESM 解析器不做扩展名补全，`.ts` 也不会被自动尝试
 *   （Node 24 能用类型擦除直接跑 `.ts`，但仅限**显式** `.ts` 说明符）；
 * - 把 `.ts` 写进业务源码又需要 `allowImportingTsExtensions`，
 *   且要多端编译器都支持，风险大于收益。
 *
 * 所以只在测试进程里注册这个钩子，业务源码保持无扩展名。
 *
 * 用法：
 *   import { register } from 'node:module'
 *   import { pathToFileURL } from 'node:url'
 *   register('./ts-resolve-hook.mjs', pathToFileURL('./scripts/'))
 *   const mod = await import('../utils/payment-success.ts')
 */
export async function resolve(specifier, context, nextResolve) {
  // 只处理相对路径，且说明符本身没有扩展名
  if (specifier.startsWith('.') && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
    for (const ext of ['.ts', '.js', '/index.ts']) {
      try {
        return await nextResolve(specifier + ext, context)
      } catch {
        // 换下一个候选
      }
    }
  }
  return nextResolve(specifier, context)
}

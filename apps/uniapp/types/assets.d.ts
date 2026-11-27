/**
 * 静态资源模块声明（只服务 typecheck）。
 *
 * HBuilderX / Vite 会把图片解析成 URL 字符串，但 TS 不认识这些扩展名，
 * 不声明的话每个 `import icon from '@/icon.png'` 都会报 TS2307。
 */

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.mp4' {
  const src: string
  export default src
}

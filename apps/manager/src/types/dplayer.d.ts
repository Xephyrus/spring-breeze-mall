/**
 * dplayer 没有自带类型声明，这里补一个最小可用声明。
 *
 * 说明：只声明 we 实际用到的成员，避免 any 扩散；
 * 需要新成员时在这里补，而不是在业务代码里写 \`as any\`。
 */
declare module "dplayer" {
  export interface DPlayerOptions {
    container?: HTMLElement | null;
    video?: { url?: string; pic?: string; type?: string };
    autoplay?: boolean;
    theme?: string;
    [key: string]: unknown;
  }

  export default class DPlayer {
    constructor(options: DPlayerOptions);
    play(): void;
    pause(): void;
    destroy(): void;
    seek(time: number): void;
    readonly video: HTMLVideoElement;
  }
}

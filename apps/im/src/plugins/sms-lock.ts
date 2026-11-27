/**
 * 短信倒计时锁（按 purpose 在 localStorage 里存一个到期时间戳）。
 */
class SmsLock {
  /** 剩余秒数（未开始时为 null） */
  time: number | null = null;

  /** 计时器 */
  timer: ReturnType<typeof setInterval> | null = null;

  /** 倒计时秒数 */
  lockTime = 60;

  /** 锁在 localStorage 里的 key */
  lockName = "";

  /**
   * @param purpose 唯一标识（不同业务用不同 purpose）
   * @param lockTime 倒计时秒数
   */
  constructor(purpose: string, lockTime = 60) {
    this.lockTime = lockTime;
    this.lockName = `SMSLOCK_${purpose}`;

    this.init();
  }

  /** 开始计时 */
  start(time?: number | null): void {
    this.time = time == null || time >= this.lockTime ? this.lockTime : time;

    this.clearTimer();

    this.timer = setInterval(() => {
      if (this.time == 0) {
        this.clearTimer();
        this.time = null;
        localStorage.removeItem(this.lockName);
        return;
      }

      this.time = (this.time ?? 0) - 1;

      // 写入本地缓存：到期时间戳 = 当前时间 + 剩余秒数
      localStorage.setItem(this.lockName, String(this.getTime() + (this.time ?? 0)));
    }, 1000);
  }

  /** 页面刷新后恢复倒计时 */
  init(): void {
    const result = localStorage.getItem(this.lockName);

    if (result == null) return;

    const time = Number(result) - this.getTime();
    if (time > 0) {
      this.start(time);
    } else {
      localStorage.removeItem(this.lockName);
    }
  }

  /** 当前时间（秒） */
  getTime(): number {
    return Math.floor(new Date().getTime() / 1000);
  }

  /** 清除计时器 */
  clearTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export default SmsLock;

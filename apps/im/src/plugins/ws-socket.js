import { ElNotification, ElMessageBox } from "element-plus";
import { useDialogueStore } from "@/stores/dialogue";

/** 掉线提示框（同一时间只保留一个，避免重连风暴时刷屏） */
let disconnectedNotification = null;

/** 手动关闭标记：避免主动断开后仍触发重连 */
let manualClosed = false;

/**
 * WebSocket 封装。
 *
 * 与上游实现的差异（本次迁移修正）：
 * 1. **指数退避重连**：1s → 2s → 4s … 上限 30s，替代原来固定 1s 的无限快重试；
 * 2. **提示框复用**：原来每次重连都新建一个 `duration: 0` 的常驻通知且不关闭，
 *    断线时会堆积成一片红框，现在复用同一个并在重连成功后关闭；
 * 3. **重试上限**：连续失败 12 次后停止重连并给一次性提示（不再 1000 次空转）；
 * 4. `onClose` 回调真正被调用（原来被注释掉，导致上层 `updateSocketStatus(false)` 永不触发）。
 */
class WsSocket {
  /** WebSocket 实例 */
  connect;

  /** 服务器连接地址 */
  url;

  /** 重连状态 */
  retryCount = 0;

  /** 重连定时器 */
  retryTimer = null;

  config = {
    heartbeat: {
      enabled: false,
      time: 10000,
      setInterval: null,
    },
    reconnect: {
      /** 首次重连延迟（毫秒） */
      baseDelay: 1000,
      /** 最大延迟（毫秒） */
      maxDelay: 30000,
      /** 最大重试次数 */
      maxAttempts: 12,
    },
  };

  /** 自定义绑定消息事件 */
  onCallBacks = [];

  /**
   * @param {Function} urlCallBack url 闭包函数
   * @param {Object} events 原生 WebSocket 绑定事件（onOpen / onClose / onError）
   */
  constructor(urlCallBack, events) {
    this.urlCallBack = urlCallBack;
    this.events = Object.assign(
      { onError: () => {}, onOpen: () => {}, onClose: () => {} },
      events
    );
  }

  /** 事件绑定 */
  on(event, callBack) {
    this.onCallBacks[event] = callBack;
    return this;
  }

  /** 通知文案：区分「首次掉线」与「重连中」 */
  showDisconnectedTip(text) {
    if (disconnectedNotification) {
      disconnectedNotification.close();
      disconnectedNotification = null;
    }
    disconnectedNotification = ElNotification({
      title: "连接已断开",
      message: text,
      type: "error",
      position: "top-right",
      duration: 0,
    });
  }

  hideDisconnectedTip() {
    if (disconnectedNotification) {
      disconnectedNotification.close();
      disconnectedNotification = null;
    }
  }

  /** 加载 / 重建 WebSocket 连接 */
  loadSocket() {
    if (this.connect != null) {
      // 先摘掉监听再关闭，避免主动关闭触发 onClose 造成重连
      this.connect.onclose = null;
      this.connect.close();
      this.connect = null;
    }

    this.url = this.urlCallBack();
    const connect = new WebSocket(this.url);
    connect.onerror = this.onError.bind(this);
    connect.onopen = this.onOpen.bind(this);
    connect.onmessage = this.onMessage.bind(this);
    connect.onclose = this.onClose.bind(this);
    this.connect = connect;

    useDialogueStore().SET_WS_STATUS(false);
  }

  /** 建立连接（外部入口） */
  connection() {
    manualClosed = false;
    this.loadSocket();
  }

  /** 计算下一次重连延迟（指数退避 + 上限） */
  nextDelay() {
    const { baseDelay, maxDelay } = this.config.reconnect;
    const delay = Math.min(baseDelay * 2 ** this.retryCount, maxDelay);
    return delay;
  }

  /** 掉线重连 */
  reconnect() {
    if (manualClosed) return false;

    const { maxAttempts } = this.config.reconnect;

    if (this.retryCount >= maxAttempts) {
      this.hideDisconnectedTip();
      ElMessageBox(
        `已连续 ${maxAttempts} 次无法连接消息服务，请检查后端 im-api（8885）是否可用，然后刷新页面重试。`,
        "消息连接失败",
        {
          confirmButtonText: "刷新页面",
          cancelButtonText: "继续等待",
          type: "warning",
        }
      )
        .then(() => window.location.reload())
        .catch(() => {
          /* 用户选择继续等待：保留手动触发入口 */
        });
      return false;
    }

    const delay = this.nextDelay();
    this.retryCount += 1;
    this.showDisconnectedTip(
      `正在重新连接（第 ${this.retryCount}/${maxAttempts} 次，${Math.round(delay / 1000)} 秒后重试）`
    );
    useDialogueStore().SET_WS_STATUS(true);

    // 只保留一个待执行的重连定时器
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (manualClosed) return;
      this.loadSocket();
    }, delay);
    return true;
  }

  /** 解析收到的消息 */
  onParse(evt) {
    const res = JSON.parse(evt.data).result;
    if (typeof res.createTime == "number") {
      res.createTime = this.unixToDate(res.createTime, "yyyy-MM-dd hh:mm");
    }
    return res;
  }

  /** unix 时间戳转格式化字符串 */
  unixToDate(unix, format) {
    if (!unix) return unix;
    let _format = format || "yyyy-MM-dd hh:mm:ss";
    const d = new Date(unix);
    const o = {
      "M+": d.getMonth() + 1,
      "d+": d.getDate(),
      "h+": d.getHours(),
      "m+": d.getMinutes(),
      "s+": d.getSeconds(),
      "q+": Math.floor((d.getMonth() + 3) / 3),
      S: d.getMilliseconds(),
    };
    if (/(y+)/.test(_format))
      _format = _format.replace(
        RegExp.$1,
        (d.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    for (const k in o)
      if (new RegExp("(" + k + ")").test(_format))
        _format = _format.replace(
          RegExp.$1,
          RegExp.$1.length === 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length)
        );
    return _format;
  }

  /** 连接打开 */
  onOpen(evt) {
    this.retryCount = 0;
    this.hideDisconnectedTip();
    this.events.onOpen(evt);
    if (this.config.heartbeat.enabled) {
      this.heartbeat();
    }
  }

  /** 连接关闭 */
  onClose(evt) {
    if (this.config.heartbeat.enabled) {
      clearInterval(this.config.heartbeat.setInterval);
    }
    this.events.onClose(evt);
    // 主动关闭不重连；其余异常断开（1006 / 1001 等）走退避重连
    if (!manualClosed && evt.code !== 1000) {
      this.reconnect();
    }
  }

  /** 连接错误 */
  onError(evt) {
    this.events.onError(evt);
  }

  /** 接收消息 */
  onMessage(evt) {
    const envelope = JSON.parse(evt.data);
    if (envelope.messageResultType === "SYSTEM_TIPS") {
      this.onCallBacks["event_error"]?.(envelope.result);
      return;
    }
    const result = this.onParse(evt);
    const text = result.text;
    const params = {
      ...result,
      text:
        typeof text === "string" &&
        (text.includes("goodsName") || text.includes("groupName"))
          ? JSON.parse(text)
          : text,
    };
    this.onCallBacks["event_talk"]?.(params);
  }

  /** 心跳（后端暂未启用） */
  heartbeat() {
    this.config.heartbeat.setInterval = setInterval(() => {
      if (this.connect && this.connect.readyState === 1) {
        this.connect.send("PING");
      }
    }, this.config.heartbeat.time);
  }

  /** 发送数据 */
  send(message) {
    this.connect.send(JSON.stringify(message));
  }

  /** 主动关闭 */
  close() {
    manualClosed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.hideDisconnectedTip();
    if (this.connect) this.connect.close();
  }

  /** 推送消息 */
  emit(event, data) {
    if (this.connect && this.connect.readyState === 1) {
      this.connect.send(JSON.stringify(data));
    } else {
      console.error("WebSocket 连接已关闭...", this.connect);
    }
  }
}

export default WsSocket;

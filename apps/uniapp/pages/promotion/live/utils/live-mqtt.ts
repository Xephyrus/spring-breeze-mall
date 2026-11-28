// @ts-nocheck
/**
 * 条件编译「双实现」文件：`#ifndef MP-WEIXIN` 是完整实现，`#ifdef MP-WEIXIN` 是精简实现，
 * 两段各自定义了同名 class / 导出函数（mqtt 客户端、腾讯 IM、直播 MQTT）。
 *
 * 为什么整文件 @ts-nocheck：
 * - TS 看不到 uni 的编译期裁剪，会认为同名 class 重复声明（TS2300/TS2393/TS2323），
 *   而这些错误**在真机上根本不存在**（每个平台只会保留一段）；
 * - 逐行 `@ts-expect-error` 能压住，但这里重复的是**整个类**（200+ 行），
 *   压制点会随平台分支改动不断漂移，维护成本高于收益；
 * - 本文件对外只暴露 `createMqttClient()` / `LiveMqttService` / `LiveChatService`
 *   这几个入口，调用侧（直播页、room.vue）是类型化的，接口形状在调用处已被约束。
 *
 * 仍然保留 ESLint（语法、未使用变量、条件编译结构都会检查）。
 */
/**
 * 直播 MQTT 连接管理（由 saas-uni-v3 useMqtt 迁移）
 */
// #ifndef MP-WEIXIN
import { createMqttClient } from "../mqtt/mqtt";

export class LiveMqttService {
  // 以下字段在构造函数里动态挂载（原 JS 写法），这里补声明以通过类型检查
  fallbackMode: any;
  heartbeatCheckTimer: any;
  isMqttConnected: any;
  lastHeartbeatTime: any;
  liveId: any;
  maxReconnectAttempts: any;
  messageHandlers: any;
  mqttClient: any;
  mqttReconnectTimer: any;
  reconnectAttempts: any;
  reconnectInterval: any;
  userId: any;
  constructor(liveId, userId) {
    this.liveId = liveId;
    this.userId = userId;
    this.mqttClient = null;
    this.isMqttConnected = false;
    this.fallbackMode = false;
    this.reconnectAttempts = 0;
    this.mqttReconnectTimer = null;
    this.lastHeartbeatTime = null;
    this.heartbeatCheckTimer = null;
    this.maxReconnectAttempts = 60;
    this.reconnectInterval = 10000;
    this.messageHandlers = {};
  }

  setMessageHandlers(handlers) {
    this.messageHandlers = handlers || {};
  }

  initMqtt() {
    if (this.mqttClient) return;

    if (!this.liveId || !this.userId) {
      console.warn("直播ID或用户ID不完整，跳过MQTT初始化");
      this.fallbackMode = true;
      return;
    }

    const clientId = `${this.userId}-${this.liveId}-${Date.now()}`;

    try {
      const topicList = [
        {
          topic: `live/goods/${this.liveId}`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onGoodsMessage?.(msg, topic),
        },
        {
          topic: `live/goods/${this.liveId}/#`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onGoodsMessage?.(msg, topic),
        },
        {
          topic: `live/coupon/${this.liveId}`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onCouponMessage?.(msg, topic),
        },
        {
          topic: `live/coupon/${this.liveId}/#`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onCouponMessage?.(msg, topic),
        },
        {
          topic: `live/live/${this.liveId}`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onLiveMessage?.(msg, topic),
        },
        {
          topic: `live/blacklist/${this.liveId}/${this.userId}`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onBlacklistMessage?.(msg, topic),
        },
        {
          topic: "live/keepalive",
          qos: 1,
          handler: (msg) => this.handleKeepaliveMessage(msg),
        },
        {
          topic: `live/push/${this.liveId}`,
          qos: 1,
          handler: (msg, topic) => this.messageHandlers.onPushStream?.(msg, topic),
        },
      ];

      this.mqttClient = createMqttClient({
        clientId,
        topicHandlers: topicList,
      });

      this.mqttClient
        .onConnected(() => {
          console.log("✅ MQTT连接成功");
          this.isMqttConnected = true;
          this.fallbackMode = false;
          this.stopMqttReconnect();
          this.reconnectAttempts = 0;
          this.startHeartbeatCheck();
        })
        .onErrorOccurred((error) => this.handleMqttFailure(error))
        .onClosed(() => this.handleMqttFailure())
        .onClientOffline(() => this.handleMqttFailure());

      this.mqttClient.connect();
    } catch (error) {
      console.error("❌ MQTT初始化失败:", error);
      this.handleMqttFailure(error);
    }
  }

  handleKeepaliveMessage(message) {
    console.log("[MQTT keepalive]", message);
    this.lastHeartbeatTime = Date.now();
  }

  handleMqttFailure(error) {
    if (error) console.error("MQTT错误:", error);

    this.disconnectMqtt(false);

    if (!this.fallbackMode) {
      console.log("❗MQTT异常，启动备用模式和重连机制");
      this.fallbackMode = true;
    }

    this.isMqttConnected = false;
    this.startMqttReconnect();
  }

  disconnectMqtt(resetFallback = true) {
    try {
      if (this.mqttClient) {
        this.mqttClient.disconnect();
        this.mqttClient = null;
        console.log("🔌 MQTT连接已断开");
      }
    } catch (error) {
      console.error("断开MQTT连接时出错:", error);
    }

    this.isMqttConnected = false;
    this.stopMqttReconnect();
    if (resetFallback) {
      this.fallbackMode = false;
    }
  }

  startMqttReconnect() {
    if (this.mqttReconnectTimer) return;

    console.log(`开始MQTT重连机制，间隔${this.reconnectInterval}ms`);

    this.mqttReconnectTimer = setInterval(() => {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log(`已达到最大重连次数${this.maxReconnectAttempts}，停止重连`);
        this.stopMqttReconnect();
        return;
      }

      this.reconnectAttempts++;
      console.log(`MQTT重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      try {
        if (this.mqttClient) {
          this.mqttClient.disconnect();
          this.mqttClient = null;
        }
      } catch (error) {
        console.warn("断开旧MQTT连接失败:", error);
      }

      this.initMqtt();
    }, this.reconnectInterval);
  }

  stopMqttReconnect() {
    if (this.mqttReconnectTimer) {
      clearInterval(this.mqttReconnectTimer);
      this.mqttReconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  startHeartbeatCheck() {
    if (this.heartbeatCheckTimer) return;

    this.heartbeatCheckTimer = setInterval(() => {
      if (!this.isMqttConnected || !this.lastHeartbeatTime) return;

      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatTime;
      if (timeSinceLastHeartbeat > 30000) {
        console.warn("⚠️ MQTT心跳超时，主动重连");

        if (this.mqttClient) {
          try {
            this.mqttClient.disconnect();
            this.mqttClient = null;
          } catch (error) {
            console.warn("断开假死MQTT连接失败:", error);
          }
        }

        this.isMqttConnected = false;
        this.lastHeartbeatTime = null;
        this.mqttClient = null;
        this.initMqtt();
      }
    }, 10000);
  }

  stopHeartbeatCheck() {
    if (this.heartbeatCheckTimer) {
      clearInterval(this.heartbeatCheckTimer);
      this.heartbeatCheckTimer = null;
    }
  }

  isConnected() {
    return this.isMqttConnected;
  }

  cleanup() {
    this.stopHeartbeatCheck();
    this.stopMqttReconnect();
    this.disconnectMqtt();
  }
}
// #endif

// #ifdef MP-WEIXIN
export class LiveMqttService {
  constructor() {}
  set messageHandlers() {}
  setMessageHandlers() {}
  initMqtt() {}
  isConnected() {
    return false;
  }
  get mqttClient() {
    return null;
  }
  cleanup() {}
}
// #endif

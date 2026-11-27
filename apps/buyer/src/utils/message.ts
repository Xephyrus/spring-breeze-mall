import { ElLoading, ElMessage, ElMessageBox } from "element-plus";
import type { App } from "vue";

const MESSAGE_OFFSET = 36;

type MessageType = "success" | "error" | "warning" | "info";

/** 提示内容：字符串，或带 content 字段的对象 */
type MessageContent = string | { content?: string } | null | undefined;

/** Spin 的配置（字符串等价于 text） */
interface SpinOptions {
  text?: string;
  background?: string;
  [key: string]: unknown;
}

/** Modal.confirm 的配置 */
interface ModalConfirmOptions {
  title?: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  type?: "success" | "warning" | "info" | "error";
  /** 点击确定后执行；返回 Promise 时会保持按钮 loading 直到结束 */
  onOk?: () => unknown;
  onCancel?: () => void;
  /** 是否启用按钮 loading（配合 onOk 的异步） */
  loading?: boolean;
}

/** Notice 的配置 */
interface NoticeOptions {
  type?: MessageType;
  desc?: string;
  title?: string;
}

let loadingInstance: { close: () => void } | null = null;

export const Spin = {
  show(options: SpinOptions | string = {}): void {
    Spin.hide();
    const config: SpinOptions =
      typeof options === "string"
        ? { text: options }
        : options && typeof options === "object"
          ? options
          : {};
    loadingInstance = ElLoading.service({
      lock: true,
      text: config.text || "加载中...",
      background: config.background || "rgba(255, 255, 255, 0.7)",
      ...config,
    }) as unknown as { close: () => void };
  },
  hide(): void {
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null;
    }
  },
};

export const Message = {
  success(content: MessageContent) {
    return showMessage("success", content);
  },
  error(content: MessageContent) {
    return showMessage("error", content);
  },
  warning(content: MessageContent) {
    return showMessage("warning", content);
  },
  info(content: MessageContent) {
    return showMessage("info", content);
  },
};

export const Notice = {
  open(options: NoticeOptions = {}) {
    const fn = Message[options.type ?? "info"] || Message.info;
    return fn(options.desc || options.title || "");
  },
  info(options?: NoticeOptions) {
    return Message.info(options?.desc || options?.title || "");
  },
  success(options?: NoticeOptions) {
    return Message.success(options?.desc || options?.title || "");
  },
  warning(options?: NoticeOptions) {
    return Message.warning(options?.desc || options?.title || "");
  },
  error(options?: NoticeOptions) {
    return Message.error(options?.desc || options?.title || "");
  },
};

export const Modal = {
  confirm(options: ModalConfirmOptions = {}) {
    const content = options.content || options.title || "确认操作？";
    const title = options.title || "提示";
    const boxOptions = {
      confirmButtonText: options.okText || "确定",
      cancelButtonText: options.cancelText || "取消",
      type: options.type || "warning",
    };

    if (options.loading) {
      return ElMessageBox.confirm(content, title, {
        ...boxOptions,
        beforeClose: (action, instance, done) => {
          if (action !== "confirm") {
            if (typeof options.onCancel === "function") {
              options.onCancel();
            }
            done();
            return;
          }
          if (typeof options.onOk !== "function") {
            done();
            return;
          }
          instance.confirmButtonLoading = true;
          Promise.resolve(options.onOk())
            .then(() => {
              instance.confirmButtonLoading = false;
              done();
            })
            .catch(() => {
              instance.confirmButtonLoading = false;
            });
        },
      });
    }

    return ElMessageBox.confirm(content, title, boxOptions)
      .then(() => {
        if (typeof options.onOk === "function") {
          return options.onOk();
        }
      })
      .catch((reason: unknown) => {
        if (reason !== "cancel" && reason !== "close") {
          return;
        }
        if (typeof options.onCancel === "function") {
          options.onCancel();
        }
      });
  },
  warning(options: ModalConfirmOptions = {}) {
    const content = options.content || options.title || "";
    return ElMessageBox.alert(content, options.title || "提示", {
      confirmButtonText: options.okText || "确定",
      type: "warning",
    }).then(() => {
      if (typeof options.onOk === "function") {
        return options.onOk();
      }
    });
  },
  remove(): void {
    ElMessageBox.close();
  },
};

function showMessage(type: MessageType, content: MessageContent) {
  return ElMessage[type]({
    message: normalize(content),
    offset: MESSAGE_OFFSET,
  });
}

function normalize(content: MessageContent): string {
  if (typeof content === "string") return content;
  if (content && content.content) return content.content;
  return String(content ?? "");
}

/** 注册旧版 `$Message` / `$Modal` / `$Notice` / `$Spin` 全局属性 */
export function setupLegacyMessage(app: App): void {
  app.config.globalProperties.$Message = Message;
  app.config.globalProperties.$Modal = Modal;
  app.config.globalProperties.$Notice = Notice;
  app.config.globalProperties.$Spin = Spin;
}

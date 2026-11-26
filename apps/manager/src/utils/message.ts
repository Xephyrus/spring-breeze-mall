import { ElMessageBox } from "element-plus";

const MESSAGE_BOX_Z_STYLE_ID = "lili-message-box-z-style";

/** EP MessageBox may reset z-index; lift above the highest open overlay. */
function getMaxOverlayZIndex(): number {
  if (typeof document === "undefined") {
    return 2000;
  }
  let max = 2000;
  document.querySelectorAll(".el-overlay").forEach((el: Element) => {
    const z = Number.parseInt(window.getComputedStyle(el).zIndex, 10);
    if (Number.isFinite(z) && z > max) {
      max = z;
    }
  });
  return max + 100;
}

function applyMessageBoxLayerZIndex(zIndex: number): void {
  if (typeof document === "undefined") {
    return;
  }
  let styleEl = document.getElementById(MESSAGE_BOX_Z_STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = MESSAGE_BOX_Z_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `.el-overlay.is-message-box { z-index: ${zIndex} !important; }`;
}

function prepareMessageBoxLayer(options: { zIndex?: number } = {}): number {
  const zIndex = options.zIndex ?? getMaxOverlayZIndex();
  applyMessageBoxLayerZIndex(zIndex);
  return zIndex;
}

function normalize(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && "content" in content) {
    return String((content as { content?: unknown }).content ?? "");
  }
  return String(content ?? "");
}

function normalizeModalContent(content: unknown): string {
  return normalize(content).replace(/<\/?p>/gi, "").trim();
}

export type ConfirmOptions = {
  title?: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  type?: "success" | "info" | "warning" | "error";
  zIndex?: number;
  onOk?: () => void | Promise<unknown>;
  onCancel?: () => void;
};

/** Confirm / alert helpers on top of Element Plus MessageBox. */
export const Modal = {
  confirm(options: ConfirmOptions = {}) {
    prepareMessageBoxLayer(options);
    const content = normalizeModalContent(options.content || options.title || "确认操作？");
    const title = options.title || "提示";
    return ElMessageBox.confirm(content, title, {
      confirmButtonText: options.okText || "确定",
      cancelButtonText: options.cancelText || "取消",
      type: options.type || "warning",
      beforeClose: (action, instance, done) => {
        if (action !== "confirm") {
          done();
          if (typeof options.onCancel === "function") {
            options.onCancel();
          }
          return;
        }
        if (typeof options.onOk !== "function") {
          done();
          return;
        }
        const result = options.onOk();
        if (result && typeof (result as Promise<unknown>).then === "function") {
          instance.confirmButtonLoading = true;
          (result as Promise<unknown>)
            .then(() => done())
            .catch(() => {})
            .finally(() => {
              instance.confirmButtonLoading = false;
            });
          return;
        }
        done();
      },
    }).catch(() => {
      if (typeof options.onCancel === "function") {
        options.onCancel();
      }
    });
  },
  warning(options: ConfirmOptions = {}) {
    prepareMessageBoxLayer(options);
    const content = normalizeModalContent(options.content || options.title || "");
    const title = options.title || "提示";
    return ElMessageBox.alert(content, title, {
      confirmButtonText: options.okText || "确定",
      type: "warning",
    }).then(() => {
      if (typeof options.onOk === "function") {
        return options.onOk();
      }
    });
  },
  remove() {
    try {
      ElMessageBox.close();
    } catch {
      // MessageBox already closed
    }
  },
};

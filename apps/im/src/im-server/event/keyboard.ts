import Base, { type SocketResource } from "./base";
import { useNotifyStore } from "@/stores/notify";

/** 键盘输入（正在输入）事件 */
export default class Keyboard extends Base {
  resource: SocketResource;

  constructor(resource: SocketResource) {
    super();
    this.resource = resource;
  }

  handle(): boolean {
    const params = this.getTalkParams();

    // 当前没有打开会话
    if (params.index_name === null) {
      return false;
    }

    // 只在私聊里提示「正在输入」
    if (params.talk_type != 1) {
      return false;
    }

    // 消息必须来自当前对话对象
    if (params.receiver_id != Number(this.resource.sender_id)) {
      return false;
    }

    useNotifyStore().UPDATE_KEYBOARD_EVENT();
    return true;
  }
}

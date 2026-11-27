import Base, { type SocketResource } from "./base";
import { useNotifyStore } from "@/stores/notify";

/** 好友在线状态事件 */
export default class Login extends Base {
  resource: SocketResource;

  constructor(resource: SocketResource) {
    super();
    this.resource = resource;
  }

  handle(): void {
    useNotifyStore().ACT_UPDATE_FRIEND_STATUS({
      status: Number(this.resource.status),
      friend_id: parseInt(String(this.resource.user_id)),
    });
  }
}

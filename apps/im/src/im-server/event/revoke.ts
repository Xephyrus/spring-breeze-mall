import Base, { type SocketResource } from "./base";
import { useDialogueStore } from "@/stores/dialogue";

/** 消息撤回事件 */
export default class Revoke extends Base {
  resource: SocketResource;

  constructor(resource: SocketResource) {
    super();
    this.resource = resource;
  }

  handle(): boolean {
    if (
      !this.isTalk(this.resource.talk_type, this.resource.receiver_id, this.resource.sender_id)
    ) {
      return false;
    }

    useDialogueStore().UPDATE_DIALOGUE({
      id: String(this.resource.record_id),
      is_revoke: 1,
    } as never);
    return true;
  }
}

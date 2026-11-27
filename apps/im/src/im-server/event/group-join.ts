import Base, { type SocketResource } from "./base";

/** 入群消息通知 */
export default class GroupJoin extends Base {
  resource: SocketResource;

  constructor(resource: SocketResource) {
    super();
    this.resource = resource;
  }

  handle(): void {
    this.$notify({
      message: "您有一条入群消息通知,请注意查收...",
      duration: 5000,
    });
  }
}

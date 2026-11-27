import Base, { type SocketResource } from "./base";
import { useNotifyStore } from "@/stores/notify";
import router from "@/router";

/** 好友申请消息处理 */
export default class FriendApply extends Base {
  resource: SocketResource;

  constructor(resource: SocketResource) {
    super();
    this.resource = resource;
  }

  handle(): void {
    useNotifyStore().INCR_APPLY_NUM();

    this.$notify({
      title: "好友申请",
      dangerouslyUseHTMLString: true,
      message: `<p style="color:red;margin-top:10px;">您有一条好友申请消息,请注意查收...</p>`,
      duration: 0,
      type: "info",
      customClass: "pointer",
      onClick: function (this: { close: () => void }) {
        useNotifyStore().SET_APPLY_NUM(0);
        router.push({
          path: "/contacts/apply",
          query: { t: new Date().getTime() },
        });
        this.close();
      },
    });
  }
}

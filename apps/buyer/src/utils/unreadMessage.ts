import { useAppStore } from "@/stores/app";
import storage from "@/plugins/storage";
import { memberMsgList } from "@/api/member";

/** 未读消息列表返回结构（只用 total） */
interface UnreadMessageResult {
  success?: boolean;
  result?: { total?: number | string };
}

/** 用未读消息总数刷新角标，只取 1 条记录 */
export function refreshUnreadMessage(): Promise<number> {
  if (!storage.getItem("userInfo")) {
    useAppStore().setUnreadMsg(0);
    return Promise.resolve(0);
  }
  return (memberMsgList({
    pageNumber: 1,
    pageSize: 1,
    status: "UN_READY",
  }) as unknown as Promise<UnreadMessageResult>)
    .then((res) => {
      const total = res && res.success ? Number(res.result && res.result.total) || 0 : 0;
      useAppStore().setUnreadMsg(total);
      return total;
    })
    .catch(() => Number(useAppStore().unreadMsg) || 0);
}

import { post, get, upload, del } from "@/utils/request";
import type { Query, RequestOptions } from "@/types/api";
import config from "@/config/config";

// 获取聊天列表服务接口
export const ServeGetTalkList = (data: Query) => {
  return get("/im/talk/list", data);
};

// 获取聊天列表服务接口
export const ServeGetStoreTalkList = (data: Query) => {
  return get("/im/talk/store/list", data);
};

// 聊天列表创建服务接口
export const ServeCreateTalkList = (id: string | number) => {
  return get(`/im/talk/user/${id}`);
};

// 删除聊天列表服务接口
export const ServeDeleteTalkList = (data: Query) => {
  return del("/im/talk", data);
};

// 对话列表置顶服务接口
export const ServeTopTalkList = (data: Query) => {
  return post("/im/talk/top", data);
};

// 清除聊天消息未读数服务接口
export const ServeClearTalkUnreadNum = (data: Query) => {
  return post("/im/talk/update-unread-num", data);
};

// 获取聊天记录服务接口
export const ServeTalkRecords = (data: Query) => {
  return get("/im/message", data);
};

// 获取转发会话记录详情列表服务接口
export const ServeGetForwardRecords = (data: Query) => {
  return get("/im/talk/get-forward-records", data);
};

// 对话列表置顶服务接口
export const ServeSetNotDisturb = (data: Query) => {
  return post("/im/talk/disturb", data);
};

// 查找用户聊天记录服务接口
export const ServeFindTalkRecords = (data: Query) => {
  return get("/im/talk/find-chat-records", data);
};

// 搜索用户聊天记录服务接口
export const ServeSearchTalkRecords = (data: Query) => {
  return get("/im/talk/search-chat-records", data);
};

export const ServeGetRecordsContext = (data: Query) => {
  return get("/im/talk/get-records-context", data);
};

// 发送代码块消息服务接口
export const ServeSendTalkCodeBlock = (data: Query) => {
  return post("/im/talk/message/code", data);
};

// 发送聊天文件服务接口
export const ServeSendTalkFile = (data: Query) => {
  return post("/im/talk/message/file", data);
};

// 上传客服图片到独立 OSS；FormData 必须包含会话 ID，店铺及目录由后端推导。
export const ServeSendTalkImage = (data: Query) => {
  return upload("/im/message/image", data, { apiBase: config.BASE_API_URL });
};

// 发送表情包服务接口
export const ServeSendEmoticon = (data: Query) => {
  return post("/im/talk/message/emoticon", data);
};

// 转发消息服务接口
export const ServeForwardRecords = (data: Query) => {
  return post("/im/talk/message/forward", data);
};

// 撤回消息服务接口
export const ServeRevokeRecords = (data: Query) => {
  return post("/im/talk/message/revoke", data);
};

// 删除消息服务接口
export const ServeRemoveRecords = (data: Query) => {
  return post("/im/talk/message/delete", data);
};

// 收藏表情包服务接口
export const ServeCollectEmoticon = (data: Query) => {
  return post("/im/talk/message/collect", data);
};

//投票
export const ServeSendVote = (data: Query) => {
  return post("/im/talk/message/vote", data);
};

export const ServeConfirmVoteHandle = (data: Query) => {
  return post("/im/talk/message/vote/handle", data);
};

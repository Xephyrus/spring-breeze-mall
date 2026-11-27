import { defineStore } from "pinia";
import { ServeFindUserEmoticon, ServeUploadEmoticon } from "@/api/emoticon";
import { ServeCollectEmoticon } from "@/api/chat";
import { ElNotification } from "element-plus";
import type { EmoticonGroup, EmoticonItem } from "./types";
import type { Query } from "@/types/api";

/** 后端表情包接口的返回值（松散结构，仅声明用到的字段） */
interface EmoticonResponse {
  code?: number;
  data?: {
    collect_emoticon?: EmoticonItem[];
    sys_emoticon?: EmoticonGroup[];
  };
  [key: string]: unknown;
}

// 原 vuex emoticon 模块
export const useEmoticonStore = defineStore("emoticon", {
  state: (): { items: EmoticonGroup[] } => ({
    items: [],
  }),
  actions: {
    // 加载用户表情包
    LOAD_USER_EMOTICON(): void {
      // TODO 隐藏（上游保留：接口未就绪）
      return;
      // eslint-disable-next-line no-unreachable
      ServeFindUserEmoticon().then((raw) => {
        const res = raw as unknown as EmoticonResponse;
        if (res.code == 200) {
          const collect = res.data?.collect_emoticon ?? [];
          const sys = res.data?.sys_emoticon ?? [];

          this.items = this.items.slice(0, 2);

          // 用户收藏的系统表情包
          if (this.items[1]) this.items[1].list = collect;

          // 用户添加的系统表情包
          this.items.push(...sys);
        }
      });
    },

    // 收藏用户表情包
    SAVE_USER_EMOTICON(resoure: { record_id: string }): void {
      ServeCollectEmoticon({
        record_id: resoure.record_id,
      })
        .then((raw) => {
          const res = raw as unknown as EmoticonResponse;
          if (res.code == 200) {
            ElNotification({
              title: "收藏提示",
              message: "表情包收藏成功...",
              type: "success",
            });

            this.LOAD_USER_EMOTICON();
          }
        })
        .catch(() => {
          ElNotification({
            title: "收藏提示",
            message: "表情包收藏失败...",
            type: "warning",
          });
        });
    },

    // 自定义上传用户表情包
    UPLOAD_USER_EMOTICON(resoure: { file: File }): void {
      const fileData = new FormData();
      fileData.append("emoticon", resoure.file);
      ServeUploadEmoticon(fileData as unknown as Query)
        .then((raw) => {
          const res = raw as unknown as EmoticonResponse;
          if (res.code == 200 && this.items[1]?.list) {
            this.items[1].list.push({});
          }
        })
        .catch(() => {
          ElNotification({
            message: "网络异常请稍后再试...",
            type: "error",
            duration: 3000,
          });
        });
    },

    // 添加系统表情包
    APPEND_SYS_EMOTICON(resoure: EmoticonGroup): void {
      this.items.push(resoure);
    },

    // 移除系统表情包
    REMOVE_SYS_EMOTICON(resoure: EmoticonItem): void {
      const index = this.items.findIndex((item) => item.emoticon_id === resoure.emoticon_id);
      if (index >= 0) this.items.splice(index, 1);
    },
  },
});

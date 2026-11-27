import { defineStore } from "pinia";

/** 常用数据字典项（后端字典接口返回的 {value,label} 结构） */
export interface DictItem {
  value: string | number;
  label: string;
  [key: string]: unknown;
}

export const useDictStore = defineStore("dict", {
  state: (): {
    sex: DictItem[];
    messageType: DictItem[];
    priority: DictItem[];
    leaveType: DictItem[];
  } => ({
    // 经常需要读取的数据字典
    sex: [],
    messageType: [],
    priority: [],
    leaveType: [],
  }),
  actions: {
    setSex(list: DictItem[]): void {
      this.sex = list;
    },
    setMessageType(list: DictItem[]): void {
      this.messageType = list;
    },
    setPriority(list: DictItem[]): void {
      this.priority = list;
    },
    setLeaveType(list: DictItem[]): void {
      this.leaveType = list;
    },
  },
});

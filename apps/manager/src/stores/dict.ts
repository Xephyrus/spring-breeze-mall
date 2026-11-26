import { defineStore } from "pinia";

export const useDictStore = defineStore("dict", {
  state: () => ({
    sex: [] as unknown[],
    messageType: [] as unknown[],
    priority: [] as unknown[],
    leaveType: [] as unknown[],
  }),
  actions: {
    setSex(list: unknown[]) {
      this.sex = list;
    },
    setMessageType(list: unknown[]) {
      this.messageType = list;
    },
    setPriority(list: unknown[]) {
      this.priority = list;
    },
    setLeaveType(list: unknown[]) {
      this.leaveType = list;
    },
  },
});

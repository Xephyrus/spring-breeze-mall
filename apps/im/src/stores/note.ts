import { defineStore } from "pinia";
import type { NoteTag } from "./types";

// 原 vuex note 模块
export const useNoteStore = defineStore("note", {
  state: (): { tags: NoteTag[]; class: NoteTag[] } => ({
    tags: [],
    class: [],
  }),
  actions: {
    SET_NOTE_TAGS(tags: NoteTag[]): void {
      this.tags = tags;
    },

    PUSH_NOTE_TAG(tag: NoteTag): void {
      this.tags.unshift(tag);
    },
  },
});

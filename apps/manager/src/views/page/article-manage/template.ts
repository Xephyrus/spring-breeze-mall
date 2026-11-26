import { markRaw } from "vue";
import HOTWORD_SETTING from "./hotword-setting.vue";
import HOTWORDS_HISTORY from "./hotwords-history.vue";
import HOTWORDS_TODAY from "./hotwords-today.vue";

export default {
  HOTWORD_SETTING: markRaw(HOTWORD_SETTING),
  HOTWORDS_TODAY: markRaw(HOTWORDS_TODAY),
  HOTWORDS_HISTORY: markRaw(HOTWORDS_HISTORY),
};

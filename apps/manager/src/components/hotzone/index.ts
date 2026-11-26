import type { App } from "vue";
import hotzone from './index.vue'

hotzone.install = (app: App) => {
  app.component(hotzone.name ?? "hotzone", hotzone)
}

export default hotzone

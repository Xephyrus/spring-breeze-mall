import { defineStore } from "pinia";
import storage from "@/plugins/storage";
import defaultLogo from "@/assets/images/logo2.png";

export interface AppState {
  navList: unknown[];
  cartNum: number | string;
  unreadMsg: number;
  logoImg: string | undefined;
  siteName: string | undefined;
  hotWordsList: string | null | undefined;
  category: unknown | null;
}

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    navList: [],
    cartNum: storage.getItem("cartNum") || 0,
    unreadMsg: 0,
    logoImg: storage.getItem("logoImg") || defaultLogo,
    siteName: storage.getItem("siteName") || "lilishop",
    hotWordsList: storage.getItem("hotWordsList"),
    category: (() => {
      try {
        const raw = localStorage.getItem("category");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })(),
  }),
  actions: {
    setCategory(data: unknown) {
      this.category = data;
    },
    setNavList(data: unknown[]) {
      this.navList = data;
    },
    setCartNum(data: number | string) {
      this.cartNum = data;
    },
    setUnreadMsg(data: number | string) {
      this.unreadMsg = Number(data) || 0;
    },
    setHotWords(data: string | null) {
      this.hotWordsList = data;
    },
    setLogoImg(data: string) {
      this.logoImg = data;
    },
    setSiteName(data: string) {
      this.siteName = data;
    },
  },
});

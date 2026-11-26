import { defineStore } from "pinia";
import { otherRouter } from "@/router/router";
import i18n from "@/locale/index";

const removedPageNames = new Set(["member-recycle", "fictitiousOrderList"]);

export type OpenedPage = {
  title: string;
  path: string;
  name: string;
  argu?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

// 原 vuex app 模块 + 根 state（openStyleStore/openStoreId/notices）合并
export const useAppStore = defineStore("app", {
  state: () => ({
    // 开屏/弹窗广告的装修数据（component 数组，不是字符串）
    openStyleStore: [] as unknown[],
    openStoreId: "",
    notices: "" as string | unknown,
    loading: false,
    // H5 装修数据（{ name, title, list, ... }），不是字符串
    styleStore: {} as Record<string, unknown>,
    added: false,
    navList: [] as unknown[],
    currNav: "",
    currNavTitle: "",
    cachePage: [] as string[],
    lang: "",
    pageOpenedList: [
      {
        title: "首页",
        path: "",
        name: "home-index",
      },
    ] as OpenedPage[],
    hotWords: [] as unknown[],
    menuList: [] as unknown[],
    tagsList: [...otherRouter.children] as unknown[],
    routers: [otherRouter] as unknown[],
    messageCount: 0,
    dontCache: ["test", "test"],
  }),
  actions: {
    updateAppRouter(routes: unknown[]) {
      this.routers.push(...routes);
    },
    updateDefaultRouter(_routes: unknown[]) {
      // 兼容旧调用，404 由 registerDynamicRoutes 注册
    },
    setAdded(v: boolean) {
      this.added = v;
    },
    setNavList(list: unknown[]) {
      this.navList = list;
    },
    setCurrNav(v: string) {
      this.currNav = v;
    },
    setCurrNavTitle(v: string) {
      this.currNavTitle = v;
    },
    setTagsList(list: unknown[]) {
      this.tagsList.push(...list);
    },
    updateMenulist(routes: unknown[]) {
      this.menuList = routes;
    },
    closePage(name: string) {
      this.cachePage.forEach((item, index) => {
        if (item == name) {
          this.cachePage.splice(index, 1);
        }
      });
    },
    initCachePage() {
      if (localStorage.cachePage) {
        this.cachePage = JSON.parse(localStorage.cachePage).filter(
          (name: string) => !removedPageNames.has(name)
        );
        localStorage.cachePage = JSON.stringify(this.cachePage);
      }
    },
    removeTag(name: string) {
      this.pageOpenedList.map((item, index) => {
        if (item.name == name) {
          this.pageOpenedList.splice(index, 1);
        }
      });
    },
    updateOpenedList(get: {
      index: number;
      argu?: Record<string, unknown>;
      query?: Record<string, unknown>;
    }) {
      const openedPage = this.pageOpenedList[get.index];
      if (get.argu) {
        openedPage.argu = get.argu;
      }
      if (get.query) {
        openedPage.query = get.query;
      }
      this.pageOpenedList.splice(get.index, 1, openedPage);
      localStorage.pageOpenedList = JSON.stringify(this.pageOpenedList);
    },
    clearAllTags() {
      this.pageOpenedList.splice(1);
      this.cachePage.length = 0;
      localStorage.pageOpenedList = JSON.stringify(this.pageOpenedList);
    },
    clearOtherTags(currentName: string) {
      let currentIndex = 0;
      this.pageOpenedList.forEach((item, index) => {
        if (item.name == currentName) {
          currentIndex = index;
        }
      });
      if (currentIndex == 0) {
        this.pageOpenedList.splice(1);
      } else {
        this.pageOpenedList.splice(currentIndex + 1);
        this.pageOpenedList.splice(1, currentIndex - 1);
      }
      this.cachePage = this.cachePage.filter((item) => item == currentName);
      localStorage.pageOpenedList = JSON.stringify(this.pageOpenedList);
    },
    setOpenedList() {
      this.pageOpenedList = localStorage.pageOpenedList
        ? JSON.parse(localStorage.pageOpenedList).filter(
            (page: OpenedPage) => !removedPageNames.has(page.name)
          )
        : [otherRouter.children[0]];
      localStorage.pageOpenedList = JSON.stringify(this.pageOpenedList);
    },
    setAvatarPath(path?: string) {
      localStorage.avatorImgPath = path || "";
    },
    switchLang(lang: string) {
      this.lang = lang;
      localStorage.lang = lang;
      (i18n.global as unknown as { locale: string }).locale = lang;
    },
    setMessageCount(count: number) {
      this.messageCount = count;
    },
    increateTag(tagObj: OpenedPage) {
      if (this.dontCache.indexOf(tagObj.name) < 0) {
        this.cachePage.push(tagObj.name);
        localStorage.cachePage = JSON.stringify(this.cachePage);
      }
      this.pageOpenedList.push(tagObj);
      localStorage.pageOpenedList = JSON.stringify(this.pageOpenedList);
    },
  },
});

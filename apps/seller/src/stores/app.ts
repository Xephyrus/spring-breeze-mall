import { defineStore } from "pinia";
import type { RouteRecordRaw } from "vue-router";
import { otherRouter } from "@/router/router";

/** 顶部已打开标签 */
export interface OpenedTag {
  title: string;
  path: string;
  name: string;
  argu?: unknown;
  query?: unknown;
  [key: string]: unknown;
}

/** 导航菜单节点（后端菜单转换而来） */
export interface NavMenuItem {
  name?: string;
  path?: string;
  title?: string;
  icon?: string;
  children?: NavMenuItem[];
  [key: string]: unknown;
}

export interface AppState {
  shipTemplates: string;
  regions: unknown[];
  styleStore: string;
  loading: boolean;
  added: boolean;
  navList: NavMenuItem[];
  navigationMenus: NavMenuItem[];
  currNav: string;
  lang: string;
  openedSubmenuArr: string[];
  storeOpenedList: OpenedTag[];
  menuList: NavMenuItem[];
  routers: RouteRecordRaw[];
  tagsList: RouteRecordRaw[];
  refMenu: string;
  unreadMessageCount: number;
}

// 原 vuex app 模块的 pinia 版本；mutation 全部转为同名 action
// 例外：storeOpenedList mutation 与 state 同名，改名 updateOpenedList；
// clearOtherTags 原接收组件实例 vm，改为直接接收当前路由名 currentName
export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    shipTemplates: "",
    regions: [],
    styleStore: "",
    loading: false,
    added: false,
    navList: [],
    navigationMenus: [],
    currNav: "",
    lang: "",
    openedSubmenuArr: [],
    storeOpenedList: [
      {
        title: "首页",
        path: "",
        name: "home_index",
      },
    ],
    menuList: [],
    routers: [otherRouter],
    tagsList: [...otherRouter.children],
    refMenu: "",
    unreadMessageCount: 0,
  }),
  actions: {
    /** 更新顶部未读消息数量 */
    setUnreadMessageCount(count: number | string): void {
      this.unreadMessageCount = Math.max(0, Number(count) || 0);
    },
    /** 清理账号绑定的路由与标签目录，保留静态页面，防止切换账号后复用旧菜单 */
    resetNavigationRoutes(): void {
      this.routers = [otherRouter];
      this.tagsList = [...otherRouter.children];
    },
    childrenMenu(v: string): void {
      this.refMenu = v;
    },
    updateAppRouter(routes: RouteRecordRaw[]): void {
      this.routers.push(...routes);
    },
    updateDefaultRouter(): void {
      // 历史占位：默认路由由 util 在登录后注入
    },
    setLoading(v: boolean): void {
      this.loading = v;
    },
    setAdded(v: boolean): void {
      this.added = v;
    },
    setNavList(list: NavMenuItem[]): void {
      this.navList = list;
    },
    setCurrNav(v: string): void {
      this.currNav = v;
    },
    setTagsList(list: RouteRecordRaw[]): void {
      this.tagsList.push(...list);
    },
    updateMenulist(routes: NavMenuItem[]): void {
      this.menuList = routes;
    },
    addOpenSubmenu(name: string): void {
      if (name.length && this.openedSubmenuArr.indexOf(name) === -1) {
        this.openedSubmenuArr.push(name);
      }
    },
    removeTag(name: string): void {
      this.storeOpenedList.map((item, index) => {
        if (item.name === name) {
          this.storeOpenedList.splice(index, 1);
        }
      });
    },
    updateOpenedList(get: { index: number; argu?: unknown; query?: unknown }): void {
      const openedPage = this.storeOpenedList[get.index];
      if (get.argu) openedPage.argu = get.argu;
      if (get.query) openedPage.query = get.query;
      this.storeOpenedList.splice(get.index, 1, openedPage);
      localStorage.storeOpenedList = JSON.stringify(this.storeOpenedList);
    },
    clearAllTags(): void {
      this.storeOpenedList.splice(1);
      localStorage.storeOpenedList = JSON.stringify(this.storeOpenedList);
    },
    clearOtherTags(currentName: string): void {
      let currentIndex = 0;
      this.storeOpenedList.forEach((item, index) => {
        if (item.name === currentName) {
          currentIndex = index;
        }
      });
      if (currentIndex === 0) {
        this.storeOpenedList.splice(1);
      } else {
        this.storeOpenedList.splice(currentIndex + 1);
        this.storeOpenedList.splice(1, currentIndex - 1);
      }
      localStorage.storeOpenedList = JSON.stringify(this.storeOpenedList);
    },
    setOpenedList(): void {
      this.storeOpenedList = localStorage.storeOpenedList
        ? (JSON.parse(localStorage.storeOpenedList) as OpenedTag[])
        : [otherRouter.children[0] as unknown as OpenedTag];
    },
    setAvatarPath(path: string): void {
      localStorage.avatorImgPath = path;
    },
    switchLang(lang: string): void {
      this.lang = lang;
      localStorage.lang = lang;
    },
    clearOpenedSubmenu(): void {
      this.openedSubmenuArr.length = 0;
    },
    increateTag(tagObj: OpenedTag): void {
      this.storeOpenedList.push(tagObj);
      localStorage.storeOpenedList = JSON.stringify(this.storeOpenedList);
    },
  },
});

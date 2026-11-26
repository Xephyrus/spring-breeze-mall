import type { RouteRecordRaw, Router } from "vue-router";
import lazyLoading from "./lazy-loading";
import { getRouter } from "./router-holder";
import { useAppStore } from "@/stores/app";
import Cookies from "js-cookie";
import type { OpenedPage } from "@/stores/app";

type MenuTag = {
  name?: string;
  path?: string;
  title?: string;
  children?: MenuTag[];
  argu?: Record<string, unknown>;
  query?: Record<string, unknown>;
  [key: string]: unknown;
};

/** 后端下发的菜单节点（三级结构） */
export type MenuDataNode = {
  name?: string;
  path?: string;
  title?: string;
  frontRoute?: string;
  component?: unknown;
  meta?: Record<string, unknown>;
  children?: MenuDataNode[] | null;
  level?: number;
  firstRouterName?: string;
  redirect?: unknown;
  [key: string]: unknown;
};

/** 收集出来的叶子路由 */
type RouteLeaf = {
  path: string;
  name: string;
  component: unknown;
  meta: Record<string, unknown>;
};

/** 已弃用、前端未实现或已移除的菜单 frontRoute，注册路由时跳过 */
const DEPRECATED_FRONT_ROUTES = new Set([
  "sys/message/sms",
  "sys/message/smsSign",
  "goods/goods-manage/spec",
  "member/list/member-recycle",
  "order/order/fictitiousOrderList",
  "promotions/flash-discount",
  "promotions/nth-item-discount",
]);

function isDeprecatedMenu(menu: { name?: string; frontRoute?: string }) {
  return menu.frontRoute && DEPRECATED_FRONT_ROUTES.has(menu.frontRoute);
}

/** util 的对外形状：每个成员都有明确签名，替代原来的 Record<string, any> */
type RouterUtil = {
  /** 动态注册的路由 name，用于登出或重新注册时清理 */
  dynamicRouteNames: string[];
  normalizeRoutePath(path?: string): string;
  /** 路由 name 可能是 string | number | symbol（vue-router 的 RouteRecordName） */
  isSameRoutePage(
    a?: { name?: unknown; path?: string },
    b?: { name?: unknown; path?: string }
  ): boolean;
  findOpenedPageIndex(
    pageOpenedList: OpenedPage[],
    name?: unknown,
    path?: string
  ): number;
  clearDynamicRoutes(): void;
  collectLeafRoutes(
    routes: MenuDataNode[],
    result?: RouteLeaf[],
    parentPath?: string
  ): RouteLeaf[];
  registerDynamicRoutes(
    menuData: unknown,
    options?: { rematch?: boolean }
  ): void;
  bootstrapDynamicRoutesFromCache(): boolean;
  title(title?: string): void;
  oneOf<T>(ele: T, targetArr: readonly T[]): boolean;
  openNewPage(
    name: string,
    argu?: Record<string, unknown>,
    query?: Record<string, unknown>
  ): void;
  toDefaultPage(
    routers: MenuDataNode[],
    name: string,
    /** 注意：调用方传的是 router 实例（原实现调 route.replace） */
    route: Router,
    next: () => void
  ): void;
  initRouter(): void;
  initAllMenuData(constRoutes: MenuDataNode[], data: MenuDataNode[]): void;
  initMenuData(data: MenuDataNode[]): void;
  initRouterNode(routers: MenuDataNode[], data: MenuDataNode[]): void;
};

const util = {} as RouterUtil;

util.dynamicRouteNames = [];

util.normalizeRoutePath = function (path?: string) {
  return String(path || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
};

util.isSameRoutePage = function (
  a?: { name?: unknown; path?: string },
  b?: { name?: unknown; path?: string }
) {
  if (!a || !b) return false;
  if (a.name && b.name && String(a.name) === String(b.name)) return true;
  const pathA = util.normalizeRoutePath(a.path);
  const pathB = util.normalizeRoutePath(b.path);
  return !!(pathA && pathB && pathA === pathB);
};

util.findOpenedPageIndex = function (
  pageOpenedList: OpenedPage[],
  name?: unknown,
  path?: string
) {
  const normalizedPath = util.normalizeRoutePath(path);
  return pageOpenedList.findIndex(
    (item) =>
      item.name === name ||
      (normalizedPath && util.normalizeRoutePath(item.path) === normalizedPath)
  );
};

util.clearDynamicRoutes = function () {
  const router = getRouter();
  if (!router) return;
  util.dynamicRouteNames.forEach((name) => {
    if (router.hasRoute(name)) {
      router.removeRoute(name);
    }
  });
  util.dynamicRouteNames = [];
};

util.collectLeafRoutes = function (
  routes: MenuDataNode[],
  result: RouteLeaf[] = [],
  parentPath = ""
) {
  routes.forEach((route) => {
    let segment = route.path != null ? String(route.path) : "";
    segment = segment.replace(/^\//, "");
    const fullPath = [parentPath, segment].filter(Boolean).join("/");
    const hasChildren = route.children && route.children.length > 0;

    if (hasChildren) {
      util.collectLeafRoutes(route.children as MenuDataNode[], result, fullPath);
    } else if (
      route.name &&
      route.component &&
      !String(route.name).endsWith("__layout")
    ) {
      result.push({
        path: fullPath || segment || route.name,
        name: route.name,
        component: route.component,
        meta: route.meta || {},
      });
    }
  });
  return result;
};

/** Vue Router 4：动态路由必须挂到 otherRouter（见 router.ts）下，且刷新/热更新后需重新注册 */
util.registerDynamicRoutes = function (
  menuData: unknown,
  options: { rematch?: boolean } = {}
) {
  const router = getRouter();
  if (!router) return;
  const { rematch = true } = options;
  const pendingPath = router.currentRoute.value.fullPath;
  const pendingUnmatched = router.currentRoute.value.matched.length === 0;

  util.clearDynamicRoutes();
  const constRoutes: MenuDataNode[] = [];
  util.initAllMenuData(constRoutes, menuData as MenuDataNode[]);

  const leaves: RouteLeaf[] = [];
  constRoutes.forEach((top) => {
    const base = String(top.path || "").replace(/^\//, "");
    if (top.children && top.children.length) {
      util.collectLeafRoutes(top.children, leaves, base);
    } else if (
      top.name &&
      top.component &&
      !String(top.name).endsWith("__layout")
    ) {
      leaves.push({
        path: base || top.name,
        name: top.name,
        component: top.component,
        meta: top.meta || {},
      });
    }
  });

  leaves.forEach((leaf) => {
    const routePath = util.normalizeRoutePath(leaf.path || leaf.name);
    if (router.hasRoute(leaf.name)) {
      return;
    }
    // vue-router 的 RouteRecordRaw 是联合类型（有无 children / redirect 各一版），
    // 逐字段构造无法收敛，这里在边界处断言一次
    const record = {
      path: routePath,
      name: leaf.name,
      component: leaf.component,
      meta: leaf.meta,
    } as RouteRecordRaw;
    // 父路由名必须与 router.ts 里的 otherRouter 一致；
    // 若父路由缺失（改名/未注册），退化为顶级绝对路径，避免整个菜单注册中断
    if (router.hasRoute("other-router")) {
      router.addRoute("other-router", record);
    } else {
      console.warn(
        "[router] 父路由 otherRouter 不存在，按顶级路由注册:",
        leaf.name
      );
      router.addRoute({
        ...record,
        path: "/" + String(routePath).replace(/^\/+/, ""),
      });
    }
    util.dynamicRouteNames.push(leaf.name);
  });

  if (!router.hasRoute("error-404")) {
    router.addRoute({
      path: "/:pathMatch(.*)*",
      name: "error-404",
      component: lazyLoading("error-page/404"),
      meta: { title: "404-页面不存在" },
    });
    util.dynamicRouteNames.push("error-404");
  }

  if (
    rematch &&
    pendingUnmatched &&
    pendingPath &&
    pendingPath !== "/login"
  ) {
    const resolved = router.resolve(pendingPath);
    if (resolved.matched.length > 0) {
      router.replace(pendingPath).catch(() => {});
    }
  }
};

/** 从 localStorage 恢复动态路由（刷新深链前必须先注册，避免 /member/xxx 无匹配） */
util.bootstrapDynamicRoutesFromCache = function () {
  if (!Cookies.get("userInfoManager")) {
    return false;
  }
  try {
    const raw = window.localStorage.getItem("menuData");
    if (!raw) {
      return false;
    }
    util.registerDynamicRoutes(JSON.parse(raw), { rematch: false });
    return true;
  } catch (e: unknown) {
    console.warn("[router] menuData parse failed", e);
    return false;
  }
};

util.title = function (title?: string) {
  window.document.title = title || "运营后台";
};

// 判断元素是否存在于数组中
util.oneOf = function <T>(ele: T, targetArr: readonly T[]) {
  return targetArr.indexOf(ele) >= 0;
};

// 打开新的页面
util.openNewPage = function (
  name: string,
  argu?: Record<string, unknown>,
  query?: Record<string, unknown>
) {
  const appStore = useAppStore();
  const pageOpenedList = appStore.pageOpenedList as OpenedPage[];
  const router = getRouter();
  const currentPath = router ? router.currentRoute.value.path : "";
  const openedIndex = util.findOpenedPageIndex(pageOpenedList, name, currentPath);
  if (openedIndex >= 0) {
    appStore.updateOpenedList({
      index: openedIndex,
      argu: argu,
      query: query,
    } as never);
    return;
  }
  const tags = appStore.tagsList as MenuTag[];
  let tag: MenuTag | undefined = tags.filter((item) => {
    if (item.children?.length) {
      return name == item.children[0].name;
    }
    return name == item.name;
  })[0];
  if (!tag) {
    tag = tags.find((item) => {
      const candidate = item.children?.length ? item.children[0] : item;
      return util.isSameRoutePage(candidate, { name, path: currentPath });
    });
    if (tag?.children?.length) {
      tag = tag.children[0];
    }
  }
  if (tag) {
    tag = tag.children?.length ? tag.children[0] : tag;
    const tagObj: OpenedPage = {
      title: String(tag.title || tag.name || name || ""),
      path: String(tag.path || ""),
      name: String(name || tag.name || ""),
    };
    if (argu) {
      tagObj.argu = argu;
    }
    if (query) {
      tagObj.query = query;
    }
    appStore.increateTag(tagObj);
  }
};

util.toDefaultPage = function (
  routers: MenuDataNode[],
  name: string,
  route: Router,
  next: () => void
) {
  const len = routers.length;
  let i = 0;
  let notHandle = true;
  while (i < len) {
    const item = routers[i];
    if (
      item.name == name &&
      item.children &&
      item.redirect == undefined
    ) {
      void route.replace({ name: item.children[0].name });
      notHandle = false;
      next();
      break;
    }
    i++;
  }
  if (notHandle) {
    next();
  }
};

util.initRouter = function () {
  // 初始化路由
  const appStore = useAppStore();
  const constRoutes: MenuDataNode[] = [];

  // 判断用户是否登录
  const userInfo = Cookies.get("userInfoManager");
  if (!userInfo) {
    // 未登录
    return;
  }
  if (!appStore.added) {
    // 第一次加载 读取数据
    import("@/api/index").then(({ getCurrentPermissionList }) => {
      getCurrentPermissionList().then((res) => {
        if (!res.success) return;
        const menuData = res.result;
        if (!menuData) {
          return;
        }

        // 格式化数据，设置 空children 为 null
        for (let i = 0; i < menuData.length; i++) {
          const t = ((menuData[i] as { children?: Array<{ children?: Array<{ children?: unknown }> }> }).children ?? []) as Array<{ children?: Array<{ children?: unknown }> }>;
          for (let k = 0; k < t.length; k++) {
            const tt = t[k].children || [];
            for (let z = 0; z < tt.length; z++) {
              tt[z].children = null;
              // 给所有三级路由添加字段，显示一级菜单name，方便点击页签时的选中筛选
              (tt[z] as { firstRouterName?: unknown }).firstRouterName = (menuData[i] as { name?: unknown }).name;
            }
          }
        }

        util.initAllMenuData(constRoutes, menuData);
        util.registerDynamicRoutes(menuData);
        appStore.updateAppRouter(
          constRoutes.filter((item) => item.children && item.children.length > 0)
        );
        util.initMenuData(menuData);
        // 缓存数据 修改加载标识
        window.localStorage.setItem("menuData", JSON.stringify(menuData));
        appStore.setAdded(true);
      });
    });
  } else {
    // 读取缓存数据
    const data = window.localStorage.getItem("menuData");
    if (!data) {
      appStore.setAdded(false);
      return;
    }
    const menuData = JSON.parse(data) as MenuDataNode[];
    util.registerDynamicRoutes(menuData);
    util.initMenuData(menuData);
  }
};

// 添加所有顶部导航栏下的菜单路由
util.initAllMenuData = function (constRoutes: MenuDataNode[], data: MenuDataNode[]) {
  const allMenuData: MenuDataNode[] = [];
  data.forEach((e) => {
    if (e.level == 0) {
      (e.children || []).forEach((item) => {
        allMenuData.push(item);
      });
    }
  });
  util.initRouterNode(constRoutes, allMenuData);
};

// 生成菜单格式数据
util.initMenuData = function (data: MenuDataNode[]) {
  const appStore = useAppStore();
  const menuRoutes: MenuDataNode[] = [];
  let menuData = data;
  // 顶部菜单 —— 首页固定置顶
  const navList: Array<{ name?: string; title?: string }> = [
    { name: "home-index", title: "首页" },
  ];
  menuData.forEach((e) => {
    navList.push({ name: e.name, title: e.title });
  });
  if (navList.length < 1) {
    return;
  }
  // 存入pinia
  appStore.setNavList(navList);
  let currNav = window.localStorage.getItem("currNav");
  if (currNav) {
    // 读取缓存title
    for (const item of navList) {
      if (item.name == currNav) {
        appStore.setCurrNavTitle(item.title || "");
        break;
      }
    }
  } else {
    // 默认首页
    currNav = "home-index";
    appStore.setCurrNavTitle("首页");
  }
  appStore.setCurrNav(currNav);
  // 首页不需要二级菜单
  if (currNav === "home-index") {
    appStore.updateMenulist([]);
    return;
  }
  for (const item of menuData) {
    if (item.name == currNav) {
      // 过滤
      menuData = (item.children || []) as MenuDataNode[];
      break;
    }
  }
  util.initRouterNode(menuRoutes, menuData);
  // 刷新界面菜单
  appStore.updateMenulist(
    menuRoutes.filter((item) => (item.children || []).length > 0) as never
  );

  const tagsList: MenuTag[] = [];
  (appStore.routers as MenuTag[]).map((item) => {
    const children = item.children || [];
    if (children.length <= 1) {
      if (children[0]) tagsList.push(children[0]);
    } else {
      tagsList.push(...children);
    }
  });
  appStore.setTagsList(tagsList);
};

// 生成路由节点
util.initRouterNode = function (routers: MenuDataNode[], data: MenuDataNode[]) {
  // data为所有子菜单数据
  for (const item of data) {
    if (isDeprecatedMenu(item)) {
      continue;
    }
    const menu: MenuDataNode = Object.assign({}, item);
    const hasChildren = item.children && item.children.length > 0;
    if (
      !hasChildren &&
      (menu.frontRoute === "promotions/full-discount/full-discount" ||
        menu.name === "full-discount" ||
        menu.name === "full-cut-activity") &&
      menu.title === "满额活动"
    ) {
      menu.title = "满减活动";
    }

    if (hasChildren) {
      menu.children = [];
      // Vue Router 4：父子路由 name 必须不同，后端菜单常出现同名父子节点
      if (menu.name) {
        menu.name = `${menu.name}__layout`;
      }
      util.initRouterNode(menu.children, item.children as MenuDataNode[]);
      // 分组节点通常无页面，仅在有 frontRoute 时挂载组件
      if (menu.frontRoute) {
        menu.component = lazyLoading(menu.frontRoute);
      } else {
        delete menu.component;
      }
    } else if (menu.frontRoute) {
      menu.component = lazyLoading(menu.frontRoute);
    }

    const meta: Record<string, unknown> = {};
    meta.title = menu.title ? menu.title + " - 运营后台" : null;
    meta.firstRouterName = item.firstRouterName;
    menu.meta = meta;

    routers.push(menu);
  }
};

export default util;

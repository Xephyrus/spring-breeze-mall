<template>
  <el-breadcrumb separator=">" class="page-breadcrumb">
    <el-breadcrumb-item
      v-for="(item, idx) in items"
      :key="idx"
    >
      <a
        v-if="Number(idx) < items.length - 1 && item.target"
        class="bc-link"
        @click.prevent="go(item.target)"
      >
        {{ item.title }}
      </a>
      <span v-else :class="{ 'is-current': Number(idx) === items.length - 1 }">
        {{ item.title }}
      </span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { otherRouter } from "@/router/router";
import { useAppStore } from "@/stores/app";

defineOptions({ name: "pageBreadcrumb" });

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const stripLayout = (name: string | undefined | null) =>
  String(name || "").replace(/__layout$/, "");

// 详情/二级页面归属的「列表/父页面」name 映射
type BreadcrumbItem = { title: string; target?: { name: string } | null };

type MenuItem = {
  name?: string;
  title?: string;
  children?: MenuItem[];
};

type NavItem = {
  name?: string;
  title?: string;
};

type RouterChild = {
  name?: string;
  title?: string;
};

const PARENT_MAP: Record<string, string> = {
  "member-detail": "member-list",
  "order-detail": "order-list",
  "after-order-detail": "afterSale",
  "order-complaint-detail": "order-complaint",
  "shop-detail": "shop-list",
  "shop-operation": "shop-list",
  "bill-detail": "bill",
  "goods-detail": "manager-goods",
  "goods-parameter-edit": "goods-parameter",
  "add-points-goods": "manager-points-goods",
  "edit-points-goods": "manager-points-goods",
  "coupon-receive": "manager-coupon",
  "add-platform-coupon": "manager-coupon",
  "edit-platform-coupon": "manager-coupon",
  "add-coupon-activity": "manager-coupon-activity",
  "edit-coupon-activity": "manager-coupon-activity",
  "coupon-activity-info": "manager-coupon-activity",
  "pintuan-goods": "manager-pintuan",
  "full-discount-detail": "manager-full-discount",
  "manager-seckill-add": "manager-seckill",
  "add-kanJia-activity-goods": "manager-kanjia",
  "edit-kanJia-activity-goods": "manager-kanjia",
  "add-gift-card-cash-activity": "manager-gift-card-cash",
  "edit-gift-card-cash-activity": "manager-gift-card-cash",
  "gift-card-cash-records": "manager-gift-card-cash",
  "gift-card-cash-batch-credentials": "manager-gift-card-cash",
};

const findFirstLeaf = (group: MenuItem | null | undefined) => {
  if (!group || !Array.isArray(group.children) || !group.children.length) {
    return null;
  }
  const first = group.children.find((c) => c && c.name) || group.children[0];
  return stripLayout(first?.name) || null;
};

const items = computed(() => {
  if (!route || !route.name || route.name === "home-index") {
    return [{ title: "首页" }];
  }
  return buildChain(stripLayout(String(route.name)));
});

function go(target: { name: string } | null | undefined) {
  if (!target || !target.name) return;
  if (route.name === target.name) return;
  router.push(target);
}

function findInMenu(name: string) {
  const menuList = (appStore.menuList || []) as MenuItem[];
  for (const grp of menuList) {
    for (const child of grp.children || []) {
      if (stripLayout(child.name) === name) {
        return { group: grp, child };
      }
    }
  }
  return null;
}

function routerEntry(name: string): RouterChild | undefined {
  if (Array.isArray(otherRouter.children)) {
    return (otherRouter.children as RouterChild[]).find((c) => c.name === name);
  }
  return undefined;
}

function topItem(): BreadcrumbItem | null {
  const navList = (appStore.navList || []) as NavItem[];
  const menuList = (appStore.menuList || []) as MenuItem[];
  const currNavTitle = appStore.currNavTitle;
  const firstName = route.meta && route.meta.firstRouterName;

  let topTitle: string = currNavTitle || "";
  if (firstName) {
    const top = navList.find((n) => n.name === firstName);
    if (top) topTitle = String(top.title ?? "");
  }
  if (!topTitle) return null;

  let target: { name: string } | null = null;
  if (menuList && menuList.length) {
    const leafName = findFirstLeaf(menuList[0]);
    if (leafName) target = { name: leafName };
  }
  return { title: topTitle, target };
}

function buildChain(name: string, depth = 0): BreadcrumbItem[] {
  if (depth > 6) return [];

  const inMenu = findInMenu(name);
  if (inMenu) {
    const list: BreadcrumbItem[] = [];
    const top = topItem();
    if (top) list.push(top);
    const groupLeaf = findFirstLeaf(inMenu.group);
    list.push({
      title: inMenu.group.title || "",
      target: groupLeaf ? { name: groupLeaf } : null,
    });
    list.push({ title: inMenu.child.title || "" });
    return list;
  }

  const parentName = PARENT_MAP[String(name)];
  const entry = routerEntry(name);
  const selfTitle = entry?.title
    ? String(entry.title)
    : (route.meta && route.meta.title
        ? String(route.meta.title).replace(/\s*-\s*.+$/, "")
        : "");

  if (parentName) {
    const parentChain: BreadcrumbItem[] = buildChain(parentName, depth + 1).map(
      (it, idx, arr) =>
        idx === arr.length - 1
          ? { title: it.title, target: { name: parentName } }
          : it
    );
    if (selfTitle) parentChain.push({ title: selfTitle });
    return parentChain;
  }

  const list: BreadcrumbItem[] = [];
  const top = topItem();
  if (top) list.push(top);
  if (selfTitle) list.push({ title: selfTitle });
  return list;
}
</script>

<style lang="scss" scoped>
.page-breadcrumb {
  padding: 0 !important;
  margin: 0 !important;
  line-height: 44px;
  font-size: 14px;
  display: flex;
  align-items: center;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: #606266;
      font-weight: 400;
    }

    &:first-child {
      margin-left: 0 !important;
      padding-left: 0 !important;
    }
  }

  .bc-link {
    color: #606266;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      color: $theme_color;
    }
  }

  .is-current {
    color: $theme_color;
    font-weight: 500;
  }
}
</style>

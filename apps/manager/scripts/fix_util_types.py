#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src/libs/util.ts"
text = path.read_text(encoding="utf-8")

needle = 'import Cookies from "js-cookie";\n\nconst util: Record<string, any> = {};'
insert = '''import Cookies from "js-cookie";
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

const util: Record<string, any> = {};'''

if "type MenuTag" not in text:
    if needle not in text:
        raise SystemExit("util import block not found")
    text = text.replace(needle, insert, 1)

old = """  let tag = appStore.tagsList.filter(item => {
    if (item.children) {
      return name == item.children[0].name;
    } else {
      return name == item.name;
    }
  });
  tag = tag[0];
  if (!tag) {
    tag = appStore.tagsList.find((item) => {
      const candidate = item.children ? item.children[0] : item;
      return util.isSameRoutePage(candidate, { name, path: currentPath });
    });
    if (tag && tag.children) {
      tag = tag.children[0];
    }
  }
  if (tag) {
    tag = tag.children ? tag.children[0] : tag;
    const tagObj = { ...tag, name: name || tag.name };
    if (argu) {
      tagObj.argu = argu;
    }
    if (query) {
      tagObj.query = query;
    }
    appStore.increateTag(tagObj);
  }
};"""

new = """  const tags = appStore.tagsList as MenuTag[];
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
      tagObj.argu = argu as Record<string, unknown>;
    }
    if (query) {
      tagObj.query = query as Record<string, unknown>;
    }
    appStore.increateTag(tagObj);
  }
};"""

if old not in text:
    raise SystemExit("openNewPage block not found")
text = text.replace(old, new, 1)

old2 = """  appStore.routers.map(item => {
    if (item.children.length <= 1) {
      tagsList.push(item.children[0]);
    } else {
      tagsList.push(...item.children);
    }
  });"""
new2 = """  (appStore.routers as MenuTag[]).map((item) => {
    const children = item.children || [];
    if (children.length <= 1) {
      if (children[0]) tagsList.push(children[0]);
    } else {
      tagsList.push(...children);
    }
  });"""
if old2 not in text:
    raise SystemExit("routers.map block not found")
text = text.replace(old2, new2, 1)

old3 = """    const meta = {};
    meta.title = menu.title ? menu.title + " - 运营后台" : null;
    meta.firstRouterName = item.firstRouterName;
    menu.meta = meta;"""
new3 = """    const meta: Record<string, unknown> = {};
    meta.title = menu.title ? menu.title + " - 运营后台" : null;
    meta.firstRouterName = item.firstRouterName;
    menu.meta = meta;"""
if old3 not in text:
    raise SystemExit("meta block not found")
text = text.replace(old3, new3, 1)

text = text.replace(
    "menuRoutes.filter(item => item.children.length > 0)",
    "menuRoutes.filter((item: MenuTag) => (item.children || []).length > 0)",
)

path.write_text(text, encoding="utf-8", newline="\n")
print("util.ts patched")

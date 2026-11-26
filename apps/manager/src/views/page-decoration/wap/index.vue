<template>
  <div class="wrapper">
    <!-- 拖拽栏 ，展示栏  -->
    <div class="model-view">
      <div class="model-view-menu">
        <div
          v-for="grp in modelGroups"
          :key="grp.key"
          class="model-group"
        >
          <div class="model-group-title">{{ grp.title }}</div>
          <draggable
            class="model-view-menu-item"
            :list="grp.list"
            :item-key="getModelKey"
            :clone="cloneModel"
            :move="handleMove"
            v-bind="{ group: { name: 'model', pull: 'clone', put: false, animation: 150 }, sort: false }"
            ghost-class="ghost"
          >
            <template #item="{ element: model }">
              <li class="model-item">
                <el-icon v-if="model.icon && iconMap[model.icon]" :size="22">
                  <component :is="iconMap[model.icon]" />
                </el-icon>
                <span>{{ model.name }}</span>
              </li>
            </template>
          </draggable>
        </div>
      </div>

      <div class="model-view-content">
        <div class="page-setting-entry" @click="showPageSetting">页面设置</div>
        <div class="content" :style="canvasStyle">
          <div class="wap-title" :style="titleBarStyle">{{ contentData.title || "页面标题" }}</div>
          <draggable
            class="draggable"
            v-bind="{ group: 'model', onAdd: handleContentlAdd }"
            ghost-class="ghost"
            @end="handleContentlEnd"
            v-model="contentData.list"
            :item-key="getContentItemKey"
          >
            <template #item="{ element, index }">
              <div class="list">
                <div class="floor-name">{{ element.name || element.type }}</div>
                <div
                  v-if="templateMap[element.type]"
                  class="component"
                  :class="{ active: selected == index }"
                  @click="handleComponent(element, index)"
                >
                  <component :is="templateMap[element.type]" :res="element.options"></component>
                </div>
                <div
                  v-else
                  class="component unknown-component"
                  @click="handleUnknownComponent(element, index)"
                >
                  未知组件「{{ element.type }}」已下线，点击删除
                </div>
                <div v-if="element.hidden" class="floor-hidden-mask">已隐藏</div>
                <div v-if="selected == index" class="floor-tools">
                  <el-icon
                    :class="{ disabled: index === 0 }"
                    @click="moveComponent(index, -1)"
                    ><Top
                  /></el-icon>
                  <el-icon
                    :class="{ disabled: index === contentData.list.length - 1 }"
                    @click="moveComponent(index, 1)"
                    ><Bottom
                  /></el-icon>
                  <el-icon @click="copyComponent(index)"><CopyDocument /></el-icon>
                  <el-icon @click="closeComponent(index)"><Delete /></el-icon>
                  <el-icon @click="toggleHide(index)"
                    ><View v-if="!element.hidden" /><Hide v-else
                  /></el-icon>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <!-- 右侧栏 -->
      <div class="model-config">
        <decorate
          @handleDrawer="handleDrawer"
          v-if="decorateData"
          :res="decorateData"
        ></decorate>
        <PanelPageSetting v-else :res="contentData" @update:res="applyPageSetting" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
// 2026-11-26(R103)：本文件已无类型检查豁免；模板索引用 templateMap，vuedraggable 专有属性走 v-bind
import { normalizeMediaUrlsDeep } from "@/utils/media-url";
import { ref, watch, nextTick, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Picture,
  PictureFilled,
  Document,
  Grid,
  Menu,
  Search,
  Goods,
  Bell,
  VideoCamera,
  VideoPlay,
  Tickets,
  Shop,
  UserFilled,
  Timer,
  Scissor,
  Coin,
  Ticket,
  Collection,
  Crop,
  Minus,
  EditPen,
  Top,
  Bottom,
  CopyDocument,
  Delete,
  View,
  Hide,
} from "@element-plus/icons-vue";
import templates from "./template/index";

/** 组件类型 → 渲染组件（类型是字面量对象，模板里按字符串取需要宽索引） */
const templateMap = templates as unknown as Record<string, unknown>;
import Draggable from "vuedraggable";
import { modelData } from "./config";
import type { WapComponent, WapLegacyComponent } from "../types";
import decorate from "./decorate.vue";
import PanelPageSetting from "./config-panel/panel-page-setting.vue";
import * as API_Other from "@/api/other";
import * as API_Promotions from "@/api/promotion";
import { getStore } from "@/libs/storage";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";
import { useAppStore } from "@/stores/app";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

// script setup 下 :is 无法按字符串解析局部导入，用映射表渲染组件图标
const iconMap: Record<string, unknown> = {
  Picture,
  PictureFilled,
  Document,
  Grid,
  Menu,
  Search,
  Goods,
  Bell,
  VideoCamera,
  VideoPlay,
  Tickets,
  Shop,
  UserFilled,
  Timer,
  Scissor,
  Coin,
  Ticket,
  Collection,
  Crop,
  Minus,
  EditPen,
};

const selected = ref(0); // 已选下标
// 页面设置默认值（老数据没有这些字段，加载时合并）
const PAGE_SETTING_DEFAULTS = {
  name: "",
  title: "",
  bgType: "color", // color | image
  bgColor: "#F5F5F5",
  bgImage: "",
  bgFill: "stretch", // stretch 拉伸 | contain 缩放 | cover 填充
  topColor: "#ffffff",
  titleColor: "black", // black | white
};
/** 页面设置（画布背景 / 标题栏） */
type PageSetting = {
  /** 页面名称（保存/路由用） */
  name?: string;
  title: string;
  bgType: string;
  bgColor: string;
  bgImage: string;
  bgFill: string;
  topColor: string;
  titleColor: string;
};

/** 画布内容 = 页面设置 + 组件列表 */
type ContentData = PageSetting & { list: WapComponent[] };

/** 左侧组件库的三类分组 */
type ModelGroup = { key: string; title: string };

/** 组件库里的模型（带 group / drawer 标记） */
type ComponentModel = WapComponent & { group?: string; drawer?: unknown };

/**
 * 解析 page_data：历史上有过"被污染的行内 HTML 引号"导致整段 JSON 非法，
 * 这里统一兜底，解析失败就返回空页面，而不是让整个装修器白屏。
 */
function safeParsePageData(text: unknown): Partial<ContentData> | null {
  if (!text) return null;
  if (typeof text !== "string") return text as Partial<ContentData>;
  try {
    return JSON.parse(text) as Partial<ContentData>;
  } catch (error) {
    console.error("[page-decoration] page_data 解析失败", error, text.slice(0, 200));
    ElMessage.error("页面数据已损坏，无法打开（请联系技术处理或新建页面）");
    return null;
  }
}

function mergePageData(data: Partial<ContentData> | null | undefined): ContentData {
  const source = data && typeof data === "object" ? data : {};
  return {
    ...PAGE_SETTING_DEFAULTS,
    ...source,
    list: Array.isArray(source.list) ? (source.list as WapComponent[]) : [],
  };
}
const contentData = ref<ContentData>({
  // 总数据
  ...PAGE_SETTING_DEFAULTS,
  list: [],
});
/** 当前正在配置的组件（null 表示显示页面设置） */
const decorateData = ref<WapLegacyComponent | null>(null); // 装修数据

watch(
  contentData,
  (val) => {
    appStore.styleStore = val;
  },
  { deep: true, immediate: true }
);

// 画布背景：背景色或背景图（拉伸/缩放/填充）
const canvasStyle = computed(() => {
  const d = contentData.value;
  if (d.bgType === "image" && d.bgImage) {
    const size =
      { stretch: "100% 100%", contain: "contain", cover: "cover" }[d.bgFill] ||
      "100% 100%";
    return {
      backgroundImage: `url(${d.bgImage})`,
      backgroundSize: size,
      backgroundRepeat: "no-repeat",
      backgroundColor: d.bgColor || "#F5F5F5",
    };
  }
  return { backgroundColor: d.bgColor || "#F5F5F5" };
});
// 画布顶部标题栏：背景用顶部颜色，文字色随标题颜色
const titleBarStyle = computed(() => {
  const d = contentData.value;
  return {
    background: d.topColor || "#ffffff",
    color: d.titleColor === "black" ? "#000" : "#fff",
  };
});
// 清空楼层选中，右侧回到页面设置面板
/** 合并页面设置面板提交的补丁（面板只发补丁，不改父对象） */
function applyPageSetting(patch: Record<string, unknown>) {
  contentData.value = { ...contentData.value, ...patch } as typeof contentData.value;
}

function showPageSetting() {
  selected.value = -1;
  decorateData.value = null;
}

// 组件面板三类分组（drawer 标记的是图片魔方的可选风格，不进左侧组件列表）
const modelGroups = computed(() => {
  const groups = [
    { key: "base", title: "基础组件" },
    { key: "marketing", title: "营销组件" },
    { key: "tools", title: "工具组件" },
  ];
  return groups.map((group: ModelGroup) => ({
    ...group,
    list: (modelData as ComponentModel[]).filter(
      (model) => model.group === group.key && !model.drawer
    ),
  }));
});

onMounted(() => {
  init();
});

function getModelKey(model: ComponentModel) {
  return model.type || model.name;
}
function getContentItemKey(element: WapComponent) {
  return element.key || element.model || element.type;
}
/**
 * 插入组件时的"默认风格"解析。
 *
 * 图片魔方（tpl_ad_list）本身没有内容，必须先选风格才有格子。
 * 原来的实现只给"点击添加"做了风格替换，**拖拽添加走的是另一条路径**，
 * 结果新拖入的魔方是一份空的 tpl_ad_list（连字段名都是旧的 bg_img/name），
 * 看起来就是"没有默认图片"。这里统一成同一个解析。
 */
function resolveInsertModel(model: ComponentModel): ComponentModel {
  if (model.type !== "tpl_ad_list") return model;
  const fallback = (modelData as ComponentModel[]).find((item) => item.type === "leftOneRightTwo");
  return fallback ?? model;
}

function cloneModel(model: ComponentModel) {
  const key = Date.now() + "_" + Math.ceil(Math.random() * 99999);
  // 图片魔方默认使用「左一右二」风格
  const source = resolveInsertModel(model);
  const cloned = JSON.parse(JSON.stringify(source));
  return {
    ...cloned,
    key,
    model: cloned.type + "_" + key,
  };
}
// 初始化数据
function init() {
  // 先读缓存，如果缓存有值则读缓存。
  const cache = getStore('managerMobilePageCache')
    if(cache){
      Modal.confirm({
      title: '提示',
      content: '获取到本地有缓存数据，是否使用缓存数据？',
      okText: '使用',
      cancelText: '取消',
      onOk: () => {
        const data = JSON.parse(cache);
        contentData.value = mergePageData(data);
      }
    });

    }
  if (!route.query.id) {
    if (route.query.mode !== "add" && (!route.query.pagetype || route.query.pagetype === "INDEX")) {
      API_Other.getHomeList({
        pageNumber: 1,
        pageSize: 10,
        pageType: "INDEX",
        pageClientType: "H5",
      }).then((res) => {
        const records = ((res?.result?.records ?? []) as unknown as Array<{ id?: string | number; name?: string; pageShow?: string }>);
        const active = records.find((row: { pageShow?: string }) => row.pageShow === "OPEN") || records[0];
        if (!active || !active.id) return;
        router.replace({
          path: route.path,
          query: {
            ...route.query,
            id: active.id,
            name: active.name,
            type: active.pageShow === "OPEN" ? "true" : "false",
            pagetype: "INDEX",
          },
        });
        API_Other.getHomeData(active.id).then((detail) => {
          const parsed = safeParsePageData(detail.result?.pageData);
          contentData.value = normalizeMediaUrlsDeep(mergePageData(parsed));
          if (!contentData.value.name) {
            contentData.value.name = active.name || "";
          }
          const first = contentData.value.list[0];
          if (first && templateMap[first.type]) {
            handleComponent(first, 0);
          }
        });
      });
      return false;
    }
    // 新建页面：模板名称取路由参数
    if (!contentData.value.name) {
      contentData.value.name = String(route.query.name ?? "");
    }
    return false;
  }

  API_Other.getHomeData(String(route.query.id ?? "")).then((res) => {
    const parsed = safeParsePageData(res.result?.pageData);
    contentData.value = mergePageData(parsed);
    if (!contentData.value.name) {
      contentData.value.name = String(route.query.name ?? "");
    }
    const first = contentData.value.list[0];
    if (first && templateMap[first.type]) {
      handleComponent(first, 0);
    }
  });

}

// 中间组件拖动，右侧数据绑定不变
function handleContentlEnd(evt: { newIndex: number }) {
  const { newIndex } = evt;
  handleComponent(contentData.value.list[newIndex], newIndex);
}

// 关闭楼层装修
function closeComponent(index: number) {
  nextTick(() => {
    decorateData.value = null;

    // 如果当前楼层不为一
    if (contentData.value.list.length > 1) {
      // 如果当前最底层 给下一层赋值

      if (index - 1 == -1) {
        handleComponent(contentData.value.list[index], index);
      } else {
        // 如果不是最底层给上一层赋值
        handleComponent(contentData.value.list[index - 1], index - 1);
      }
      contentData.value.list.splice(index, 1);
    } else {
      contentData.value.list.splice(index, 1);
    }
  });
}

// 点击楼层装修
function handleComponent(element: WapComponent | undefined, index: number) {
  if (!element) return;
  selected.value = index;
  decorateData.value = element as unknown as WapLegacyComponent;
}
// 已下线的未知组件：点击占位条直接删除
function handleUnknownComponent(element: WapComponent, index: number) {
  console.warn(`[page-decoration] 未知组件类型: ${element.type}`);
  closeComponent(index);
}
// 上移/下移楼层
function moveComponent(index: number, dir: number) {
  const target = index + dir;
  if (target < 0 || target >= contentData.value.list.length) return;
  const list = contentData.value.list;
  [list[index], list[target]] = [list[target], list[index]];
  selected.value = target;
  handleComponent(contentData.value.list[target], target);
}
// 复制楼层
function copyComponent(index: number) {
  const cloned = JSON.parse(JSON.stringify(contentData.value.list[index]));
  const key = Date.now() + "_" + Math.ceil(Math.random() * 99999);
  cloned.key = key;
  cloned.model = cloned.type + "_" + key;
  contentData.value.list.splice(index + 1, 0, cloned);
  handleComponent(contentData.value.list[index + 1], index + 1);
}
// 隐藏/显示楼层（渲染端跳过 hidden 楼层）
function toggleHide(index: number) {
  const item = contentData.value.list[index];
  item.hidden = !item.hidden;
}
// 右侧栏回调
function handleDrawer(val: ComponentModel) {
  const newIndex = selected.value;
  /** 楼层配置（促销类组件里有 list） */
  type FloorOptions = { list: Array<Record<string, unknown>> };
  const floor = contentData.value.list[newIndex];
  const floorOptions = floor?.options as unknown as FloorOptions | undefined;
  if (val.promotionsType) {
    if ((floorOptions?.list ?? []).length >= 2) {
      ElMessage.error("最多只能展示两个活动");
      return;
    }
    if (val.promotionsType === "LIVE") {
      API_Promotions.getLiveList({
        status: "START",
        pageSize: 1,
        pageNumber: 1,
      }).then((listRes) => {
        const records = listRes.result?.records || [];
        if (!listRes.success || records.length === 0) {
          ElMessage.warning("暂无进行中的直播活动");
          return;
        }
        API_Promotions.getLiveInfo(records[0].id).then((infoRes) => {
          if (infoRes.success) {
            floorOptions?.list.push({
              type: val.promotionsType,
              title: val.name,
              title1: val.subName,
              color1: val.subColor,
              bk_color: val.subBkColor,
              data: infoRes.result.commodityList
                ? infoRes.result.commodityList.splice(0, 2)
                : [],
            });
          }
        });
      });
    } else {
      API_Promotions.getAllPromotion().then((res) => {
        const exist = floorOptions?.list.find(
          (item) => item.type === val.promotionsType
        );

        if (res.success && !exist) {
          floorOptions?.list.push({
            data: (() => {
              const map = res.result as Record<string, unknown[]> | undefined;
              const list = map?.[String(val.promotionsType ?? "")];
              return Array.isArray(list) ? list.splice(0, 2) : [];
            })(),
            type: val.promotionsType,
            title1: val.subName,
            color1: val.subColor,
            bk_color: val.subBkColor,
            title: val.name,
          });
        }
      });
    }
    contentData.value.list[newIndex] = {
      ...val,
      options: {
        ...(contentData.value.list[newIndex].options as Record<string, unknown>),
      },
      model: val.type,
    };
  } else {
    decorateData.value = null;

    contentData.value.list[newIndex] = {
      ...val,
      options: {
        ...(val.options as Record<string, unknown>),
      },
      model: val.type,
    };
    contentData.value.list = JSON.parse(
      JSON.stringify(contentData.value.list)
    );
    decorateData.value = contentData.value.list[newIndex] as unknown as WapLegacyComponent;
  }
}

// 封装拖拽参数
// 原名 package 是 ESM 严格模式保留字，改名 packageModel
function packageModel(val: ComponentModel, newIndex: number) {
  // 先占位（vuedraggable 的 add 事件期望该位置已有元素），稍后整体覆盖
  contentData.value.list[newIndex] = {} as WapComponent;
  // 与 cloneModel 保持一致：魔方插入时同样落到默认风格，避免"拖进来没有图"
  val = JSON.parse(JSON.stringify(resolveInsertModel(val)));
  const key = val.key || Date.now() + "_" + Math.ceil(Math.random() * 99999);
  contentData.value.list[newIndex] = {
    ...val,
    options: {
      ...(val.options as Record<string, unknown>),
    },
    key,
    model: val.model || val.type + "_" + key,
  };
}
// 拖动
function handleContentlAdd(evt: { newIndex: number }) {
  const { newIndex } = evt;

  packageModel(contentData.value.list[newIndex], newIndex);
  handleComponent(contentData.value.list[newIndex], newIndex);
}
function handleMove() {
  return true;
}
</script>
<style scoped lang="scss">
@import "./style.scss";

// 页面设置：画布容器支持悬浮入口、画布背景可透出到拖拽区
.model-view-content {
  position: relative;
}
.page-setting-entry {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 200;
  padding: 6px 14px;
  font-size: 13px;
  color: #409eff;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  &:hover {
    border-color: #409eff;
  }
}
.content > .draggable {
  background: transparent;
}
.wap-title {
  border-bottom: none;
}
</style>

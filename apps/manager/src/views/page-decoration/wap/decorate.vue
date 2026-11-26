<template>
  <div class="decorate">
    <div class="decorate-title" v-if="!hidePanelTitle">
      {{ res.name }}

      <el-button
        style="margin-left: 20px"
        size="small"
        plain
        v-if="
          res.type == 'tpl_ad_list' ||
          res.type == 'tpl_activity_list' ||
          res.drawer
        "
        type="primary"
        @click="selectStyle()"
        >选择风格</el-button
      >
      <el-button
        style="margin-left: 20px"
        size="small"
        plain
        v-if="res.drawerPromotions"
        type="primary"
        @click="selectPromotions()"
        >选择促销活动</el-button
      >
    </div>

    <!-- 新组件独立配置面板（按 type 分发） -->
    <component
      v-if="panelComponent"
      :is="panelComponent"
      :res="res"
      @update:options="applyPanelOptions"
      @handleDrawer="emit('handleDrawer', $event)"
    />
    <!-- 老组件遗留配置分支 -->
    <template v-else>
    <el-alert
      v-if="res.name == '商品列表'"
      type="warning"
      title="装修提示"
      :closable="false"
    >
      <template #default>
        <div style="color: red">
          如果当前装修模块不是最后一项模块且模块内容绑定为分类，则会默认展示绑定分类的100条商品信息。
        </div>
        <div style="color: red">
          如果当前装修模块是最后一项模块且模块内容绑定为分类，则会默认会根据绑定分类触底加载商品信息。
        </div>
        <div style="color: red">
          如果当前装修内容不为分类，则会展示当前商品的静态信息。
        </div>
      </template>
    </el-alert>

    <!-- 右侧显示抽屉 -->
    <el-drawer
      title="选择风格"
      :show-close="false"
      size="400px"
      v-model="styleFlag"
      append-to-body
      destroy-on-close
    >
      <div class="drawer">
        <template v-for="(item, index) in modelData" :key="index">
          <div
            v-if="item.drawer"
            class="drawer-item"
            @click="clickDrawer(item, index)"
          >
            <img alt="" />
            <span>{{ item.name }}</span>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- 右侧显示抽屉 -->
    <el-drawer
      title="选择促销活动(最多只能展示两个活动)"
      :show-close="false"
      size="400px"
      v-model="promotionsFlag"
      append-to-body
      destroy-on-close
    >
      <div class="drawer">
        <template v-for="(item, index) in modelData" :key="index">
          <div
            v-if="item.drawerPromotions"
            class="drawer-item"
            @click="clickDrawer(item, index)"
          >
            <img alt="" />
            <span>{{ item.name }}</span>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- 卡片集合 -->
    <div
      class="decorate-list"
      v-if="
        (res.type != 'tpl_ad_list' && res.type != 'tpl_activity_list') ||
        res.drawer ||
        res.drawerPromotions
      "
    >
      <div
        class="decorate-item"
        v-for="(item, index) in res.options.list"
        :key="index"
      >
        <div class="decorate-item-title" v-if="res.type != 'video'">
          <div>卡片</div>
          <el-icon
            v-if="res.close || res.type == 'promotionDetail'"
            @click="closeDecorate(index)"
            :size="20"
            color="#e1251b"
            class="close-icon"
          >
            <CircleClose />
          </el-icon>
        </div>

        <div class="decorate-item-box">
          <template v-if="item.titleWay">
          <div
            class="decorate-border"
            v-for="(title_item, title_index) in item.titleWay"
            :key="title_index"
          >
            <div class="decorate-view">
              <div class="decorate-view-title">标题{{ title_index + 1 }}</div>
              <div>
                <el-input
                  :model-value="String(title_item.title ?? '')"
                  @update:model-value="(v: string) => (title_item.title = v)"
                />
              </div>
            </div>
            <div class="decorate-view">
              <div class="decorate-view-title">描述</div>
              <div>
                <el-input v-model="title_item.desc" />
              </div>
            </div>
            <div class="decorate-view">
              <div class="decorate-view-title">绑定</div>
              <div class="decorate-view-link">
                <div v-if="(res.options.list[0].listWay ?? []).length != 0">
                  <!-- 绑定商品选择器回调已选择的商品 -->

                  <template
                    v-for="(bindGoods, bindGoodsIndex) in res.options.list[0].listWay"
                    :key="bindGoodsIndex"
                  >
                  <div
                    v-if="
                      title_item.___index == bindGoods.___index ||
                      title_item.title == bindGoods.type
                    "
                    class="title-item wes-2"
                  >
                    <el-tooltip placement="left" :content="String(bindGoods.title ?? '')">
                      <div class="title-goodsName">
                        {{ bindGoods.title }}
                      </div>
                    </el-tooltip>
                    <div class="title-btn">
                      <el-button
                        @click="
                          slotGoods(
                            res.options.list[0].listWay ?? [],
                            title_item.___index ?? 0,
                            bindGoods,
                            'up'
                          )
                        "
                        style="margin-right: 10px"
                        size="small"
                        >上移</el-button
                      >
                    </div>
                  </div>
                  </template>
                </div>
                <!-- 显示绑定分类 -->
                <div v-if="title_item.bindCategory">
                  绑定分类为：{{ (title_item.bindCategory as { name?: string } | undefined)?.name }}
                </div>
              </div>

              <div class="decorate-view-btn">
                <el-button
                  @click="bindGoodsId(title_item, title_index)"
                  size="small"
                  >选择商品</el-button
                >
                <el-button
                  @click="bindGoodsCategory(title_index)"
                  size="small"
                  >选择分类</el-button
                >
              </div>
            </div>
          </div>
          </template>
          <div class="decorate-view" v-if="res.type == 'carousel'">
            <div class="decorate-view-title">
              <el-button
                @click="slotBanner(res, item, index, 'up')"
                style="margin-right: 10px"
                size="small"
                >上移</el-button
              ><el-button
                @click="slotBanner(res, item, index, 'down')"
                size="small"
                >下移</el-button
              >
            </div>
          </div>
          <!-- 选择照片 -->
          <div class="decorate-view" v-if="!res.notImg">
            <div class="decorate-view-title">选择照片</div>
            <div>
              <img class="show-image" :src="item.img" alt="" />

              <div class="tips" v-if="!res.onlyImg">
                建议尺寸
                <span>{{ item.size }}</span>
              </div>
            </div>
            <div class="selectBtn">
              <el-button
                size="small"
                @click="handleClickFile(item, index)"
                plain
                type="primary"
                >选择照片</el-button
              >
            </div>
          </div>
          <div
            class="decorate-view"
            v-if="item.title != void 0 && !res.notTitle && res.type == 'title'"
          >
            <div class="decorate-view-title">文字对齐方式</div>
            <div class="card-box">
              <div
                class="card"
                :class="{ active: textAlign == 'left' }"
                @click="changeTextAlign('left')"
              >
                <img
                  :src="alignTextLeft"
                  class="align-text"
                  alt=""
                />
              </div>
              <div
                class="card"
                :class="{ active: textAlign == 'center' }"
                @click="changeTextAlign('center')"
              >
                <img
                  :src="alignTextCenter"
                  class="align-text"
                  alt=""
                />
              </div>
              <!-- <div
                class="card"
                :class="{ active: textAlign == 'right' }"
                @click="changeTextAlign('right')"
              >
                <img
                  :src="alignTextRight"
                  class="align-text"
                  alt=""
                />
              </div> -->
            </div>
          </div>
          <div
            class="decorate-view"
            v-if="
              item.title != void 0 &&
              !res.notTitle &&
              (res.type == 'title' ||
                res.type == 'notice' ||
                res.type == 'promotionDetail')
            "
          >
            <div class="decorate-view-title">背景颜色</div>
            <div class="decorate-view">
              <el-color-picker
                :model-value="item.bk_color ?? ''"
                @update:model-value="(v: string | null) => (item.bk_color = v ?? '')"
              />
              <el-input v-model="item.bk_color" />
            </div>
          </div>
          <div
            class="decorate-view"
            v-if="item.title != void 0 && !res.notTitle && res.type == 'notice'"
          >
            <div class="decorate-view-title">方向</div>
            <div class="decorate-view">
              <el-select
                style="width: 200px"
                @change="changeDirection($event, item)"
                v-model="item.direction"
              >
                {{ item.direction }}
                <el-option label="横向" value="horizontal"></el-option>
                <el-option label="纵向" value="vertical"></el-option>
              </el-select>
            </div>
          </div>

          <!-- 填写标题 -->
          <div
            class="decorate-view"
            v-if="item.title != void 0 && !res.notTitle && res.type != 'notice'"
          >
            <div class="decorate-view-title">菜单标题</div>
            <div>
              <el-input
                :model-value="String(item.title ?? '')"
                @update:model-value="(v: string) => (item.title = v)"
                style="width: 200px"
              />
            </div>
          </div>
          <div
            class="decorate-view"
            v-if="
              item.title != void 0 &&
              !res.notTitle &&
              (res.type == 'title' || res.type == 'notice')
            "
          >
            <div class="decorate-view-title">标题颜色</div>
            <div class="decorate-view">
              <el-color-picker v-model="item.color" />
              <el-input v-model="item.color" />
            </div>
          </div>
          <!-- 填写小标题 -->
          <div
            class="decorate-view"
            v-if="item.title1 != void 0 && !res.notTitle"
          >
            <div class="decorate-view-title">小标题</div>
            <div>
              <el-input v-model="item.title1" style="width: 200px" />
            </div>
          </div>
          <div
            class="decorate-view"
            v-if="item.title1 != void 0 && !res.notTitle"
          >
            <div class="decorate-view-title">小标题颜色</div>
            <div class="decorate-view">
              <el-color-picker v-model="item.color1" />
              <el-input v-model="item.color1" />
            </div>
          </div>
          <div
            class="decorate-view"
            v-if="res.type === 'notice' && !res.notTitle"
          >
            <div class="decorate-view-title">公告内容</div>
            <div>
              <div
                v-for="(t, tindex) in item.title"
                :key="tindex"
                class="decorate-notice"
              >
                <el-input
                  :model-value="String((t as { context?: string }).context ?? '')"
                  @update:model-value="(v: string) => ((t as { context?: string }).context = v)"
                  style="width: 200px"
                />
                <el-icon @click="removeNotice(tindex)" :size="16" color="#e1251b">
                  <CircleClose />
                </el-icon>
              </div>
            </div>
          </div>

          <!-- 视频楼层配置 -->
          <video-config
            v-if="res.type == 'video'"
            :item="item"
            @select-file="(field) => handleClickFile(item, index, field)"
          />

          <!-- 填写链接 -->

          <div class="decorate-view" v-if="!res.notLink">
            <div class="decorate-view-title">{{ item.model === "hotzone" ? "热区" : "选择链接" }}</div>
            <div
              v-if="item.url && item.url.length != 0"
              class="decorate-view-link"
            >
              已选链接：

              <span>
                {{
                  ways.find((e) => {
                    return item.url?.___type == e.name;
                  })
                    ? ways.find((e) => {
                        return item.url?.___type == e.name;
                      })?.title
                    : "发现"
                }}
                -
                <!-- 当选择完链接之后的专题名称 -->
                <span v-if="item.url.pageType == 'special'">
                  {{ item.url.name }}</span
                >
                <!-- 当选择完链接之后的商品名称 -->
                <span v-if="item.url.___type == 'goods'">
                  {{ item.url.goodsName }}</span
                >
                <!-- 当选择完链接之后的分类回调 -->
                <span v-if="item.url.___type == 'category'">
                  {{ item.url.name }}</span
                >
                <!-- 当选择完链接之后的店铺回调 -->
                <span v-if="item.url.___type == 'shops'">
                  {{ item.url.memberName }}</span
                >
                <!-- 当选择完链接之后的其他回调 -->
                <span v-if="item.url.___type == 'other'">
                  {{ item.url.title }}</span
                >

                <!-- 当选择完活动之后的其他回调 -->
                <span v-if="item.url.___type == 'marketing'">
                  <span v-if="item.url.___promotion == 'SECKILL'"> 秒杀 </span>
                  <span v-if="item.url.___promotion == 'FULL_DISCOUNT' || item.url.___promotion == 'FULL_MINUS'">
                    满减
                  </span>
                  <span v-if="item.url.___promotion == 'FULL_RATE'">
                    满折
                  </span>
                  <span v-if="item.url.___promotion == 'FULL_GIFT'">
                    满赠
                  </span>
                  <span v-if="item.url.___promotion == 'PINTUAN'"> 拼团 </span>
                  {{ item.url.title || item.url.goodsName }}</span>
                <!-- 当选择完活动之后的其他回调 -->
                <span v-if="item.url.___type == 'pages'">
                  {{ item.url.title }}</span
                >
              </span>
            </div>
            <div>
              <el-button
                plain
                size="small"
                type="primary"
                @click="clickLink(item, index, res)"
              >
                {{ item.model === "hotzone" ? "绘制热区" : "选择链接" }}</el-button
              >
            </div>
          </div>
          <!-- 链接地址-->
          <div
            class="decorate-view"
            v-if="
              item.url &&
              item.url.url !== undefined &&
              item.url.___type == 'other'
            "
          >
            <div class="decorate-view-title">外部链接</div>
            <div>
              <el-input v-model="item.url.url" style="width: 200px" />
            </div>
          </div>

          <p
            v-if="
              item.url &&
              item.url.url !== undefined &&
              item.url.___type == 'other'
            "
          >
            (如非同域名下，则在小程序与公众号中无效)
          </p>
        </div>
      </div>
    </div>

    <el-button
      v-if="
        res.type != 'tpl_ad_list' &&
        res.type != 'tpl_activity_list' &&
        !res.notAdd &&
        res.direction != 'horizontal'
      "
      type="primary"
      @click="addDecorate(res.type, res)"
      plain
      >添加</el-button
    >

    <liliDialog
      ref="liliDialogRef"
      @selectedLink="selectedLink"
      @selectedGoodsData="selectedGoodsData"
    ></liliDialog>

    <el-dialog
      width="800px"
      title="选择分类"
      v-model="enableSelectCategory"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
      @close="handleCancelCategoryModal"
    >
      <categoryTemplate
        v-if="enableSelectCategory"
        @selected="onCategorySelected"
      />
      <template #footer>
        <el-button @click="handleCancelCategoryModal">取消</el-button>
        <el-button type="primary" @click="handleConfirmCategoryModal">确定</el-button>
      </template>
    </el-dialog>

    <hotzone ref="hotzoneRef" @changeZone="changeZone"></hotzone>

    <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <ossManage
        @callback="callbackSelected"
        :is-component="true"
        :initialize="picModelFlag"
        :max-select="1"
        :only-image="pickerMediaType !== 'VIDEO'"
        :media-type="pickerMediaType"
        ref="ossManageRef"
      />
    </el-dialog>
    </template>
  </div>
</template>
<script setup lang="ts">
// 2026-11-25(R60)：any 已清零，且已改用 types.ts 的 WapLegacyComponent；
// 摘指令后仍有 53 处「老模板 list[] 项跨类型字段」问题，需逐组件拆分后处理，见 LINT-DEBT R60
import { ref, watch, nextTick, computed } from "vue";
import { CircleClose } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { modelData } from "./config";
import hotzone from "@/components/hotzone/index.vue";
import ways from "@/components/lili-dialog/wap";
import categoryTemplate from "@/components/lili-dialog/template/category.vue";
import VideoConfig from "./video-config.vue";
import panelMap from "./config-panel/index";
import type {
  WapLegacyComponent,
  WapLegacyLink,
  WapLegacyOptionItem,
} from "../types";

/** 商品分组项（titleWay 的元素） */
type TitleWayItem = NonNullable<WapLegacyOptionItem["titleWay"]>[number];
import alignTextLeft from "@/assets/align-text-left.png";
import alignTextCenter from "@/assets/align-text-center.png";

/** 素材库实例（本页只用这几个成员） */
/** 素材库在选择器模式下的实例能力（媒体类型由 props 声明，无需命令式修改） */
type OssManageInstance = {
  selectImage?: boolean;
};

/** 商品 / 链接选择弹窗 */
type LiliDialogInstance = {
  clearGoodsSelected: () => void;
  goodsFlag?: boolean;
  flag?: boolean;
  open: (mode: string) => void;
  goodsData?: Array<Record<string, unknown>>;
};

/** 热区编辑弹窗 */
type HotzoneInstance = { open: (val: unknown) => void };

/** 分类选择结果 */
type CategoryChoice = { id?: string | number; name?: string };

const props = defineProps<{ res: WapLegacyComponent }>();

/**
 * 子面板通过 update:options 回写配置。
 * 就地合并进 res.options，保持对象引用不变（画布预览读的是同一个对象）。
 */
/** 楼层数据代理：面板就地编辑画布里的楼层对象 */
const res = computed(() => props.res);

function applyPanelOptions(patch: Record<string, unknown>) {
  if (!props.res) return;
  if (!res.value.options) res.value.options = { list: [] };
  Object.assign(res.value.options, patch);
}
const emit = defineEmits(["handleDrawer"]);

// alignTextLeft/alignTextCenter/alignTextRight、ways(选择链接的类型)、modelData(装修数据) 为 import 常量，模板中直接使用
const picModelFlag = ref(false); //图片选择器
const linkType = ref("goods"); // dialog弹窗口类型
const styleFlag = ref(false); //广告魔方开关
const textAlign = ref(
  props.res.options.list[0] ? props.res.options.list[0].textAlign : "center"
); //文字对齐方式
const promotionsFlag = ref(false); //广告魔方开关
/** 当前正在编辑的内容项（写图 / 写样式都落在它上面） */
const selectedGoods = ref<WapLegacyOptionItem>({}); // 已选商品
/** 当前正在编辑的链接目标 */
const selectedLinks = ref<Record<string, unknown>>({}); // 已选链接
/** 正在配置链接的内容项下标（写回时用它定位，避免只靠对象引用） */
const linkTargetIndex = ref(0);
const enableSelectCategory = ref(false); //商品是否绑定分类
const pendingCategory = ref<CategoryChoice[] | null>(null); // 选择分类弹窗草稿
const goodsSelectedIndex = ref(0); //绑定商品分类的索引
const pictureField = ref("img"); //图片选择器回写的字段

/**
 * 素材库要展示的媒体类型。
 *
 * 素材库的类型必须由调用方「打开前」声明（:media-type），
 * 不能在打开后用 ref 去改它内部状态 —— 弹窗内容是懒挂载的，
 * 那时实例可能还没创建，赋值会被丢掉，最终停在默认的 IMAGE 上。
 */
const pickerMediaType = ref<"IMAGE" | "VIDEO">("IMAGE");

// 新组件按 type 分发到独立配置面板；老组件走下方遗留分支
const panelComponent = computed(() => {
  const map = panelMap as Record<string, { hideDecorateTitle?: boolean }>;
  const type = props.res?.type;
  return type ? map[type] ?? null : null;
});
// 面板声明 hideDecorateTitle 时，标题行由面板自己渲染
const hidePanelTitle = computed(
  () => !!(panelComponent.value && panelComponent.value.hideDecorateTitle)
);

// hotzoneRef/ossManageRef：模板 ref 与组件 import 同名，改名避免互相覆盖
const liliDialogRef = ref<LiliDialogInstance | null>(null);
const hotzoneRef = ref<HotzoneInstance | null>(null);
const ossManageRef = ref<OssManageInstance | null>(null);

watch(
  () => props.res,
  (_val: unknown) => {},
  { deep: true }
);

// 选择分类（弹窗内暂存，确定后写回）
function onCategorySelected(val: CategoryChoice[]) {
  pendingCategory.value = val;
}
function handleCancelCategoryModal() {
  pendingCategory.value = null;
  enableSelectCategory.value = false;
}
function handleConfirmCategoryModal() {
  if (pendingCategory.value?.length) {
    confirmCategory(pendingCategory.value);
  }
  pendingCategory.value = null;
  enableSelectCategory.value = false;
}
function confirmCategory(val: CategoryChoice[]) {
  const first = props.res.options.list[0];
  if (!first || !val[0]) return;
  const titleWay = first.titleWay ?? [];
  let data: Record<string, unknown> = { ...titleWay[goodsSelectedIndex.value] };
  data = {
    ...data,
    bindCategory: {
      id: val[0].id,
      name: val[0].name,
      categoryIdWay: val[0].id,
    },
  };
  first.listWay = (first.listWay ?? []).filter(
    (item: Record<string, unknown>) => item.___index != goodsSelectedIndex.value
  );
  titleWay[goodsSelectedIndex.value] = data as TitleWayItem;
  first.titleWay = titleWay;
}
// 商品排序
function slotGoods(
  list: Array<Record<string, unknown>>,
  key: number | string,
  val: { id?: unknown },
  _extra?: unknown,
  _direction?: string
) {
  const newVal: Array<Record<string, unknown>> = [];
  let newValIndex = 0;
  // 给当前点击的商品分组
  list.forEach((item) => {
    if (item.___index == key) {
      newVal.push(item);
    }
  });
  // 获得当前点击商品的索引
  newVal.forEach((item, index) => {
    if (item.id == val.id) {
      newValIndex = index;
    }
  });
  // 进行商品排序
  upData(newVal, newValIndex);
  let merged: Array<Record<string, unknown>>;
  if (list.length == newVal.length) {
    merged = newVal;
  } else {
    let newList: Array<Record<string, unknown>> = [];
    newVal.forEach((item) => {
      newList = list.filter((child) => child.id != item.id && child.___index != key);
    });
    merged = [...newList, ...newVal];
  }

  const first = props.res.options.list[0];
  if (first) first.listWay = merged;
}

// 轮播图排序
function slotBanner(
  val: { options: { list: Array<Record<string, unknown>> } },
  _key: WapLegacyOptionItem | number | string,
  index: number,
  down: string
) {
  if (down == "down") {
    downData(val.options.list, index);
  } else {
    upData(val.options.list, index);
  }
}
function upData(arr: Array<Record<string, unknown>>, index: number) {
  let newArr: Array<Record<string, unknown>> = [];
  if (arr.length > 1 && index !== 0) {
    newArr = swapItems(arr, index, index - 1);
  }
  return newArr;
}
function swapItems(
  arr: Array<Record<string, unknown>>,
  index1: number,
  index2: number
) {
  arr[index1] = arr.splice(index2, 1, arr[index1])[0];
  return arr;
}
function downData(arr: Array<Record<string, unknown>>, index: number) {
  let newArr: Array<Record<string, unknown>> = [];
  if (arr.length > 1 && index !== arr.length - 1) {
    newArr = swapItems(arr, index, index + 1);
  }
  return newArr;
}
// 改变横纵切换title内容
function changeDirection(val: string, data: WapLegacyOptionItem) {
  if (val == "horizontal") {
    const snapshot = { ...data };
    const titles = Array.isArray(snapshot.title) ? snapshot.title : [];
    data.title = titles.slice(0, 1);
  }
}
// 选择风格
function selectStyle() {
  styleFlag.value = !styleFlag.value;
}
function selectPromotions() {
  promotionsFlag.value = !promotionsFlag.value;
}
// 回调选择的链接
function selectedLink(raw: unknown) {
  // 历史载荷有三种：单体对象 / 单元素数组 / 被包了一层 { value }
  let payload: unknown = raw;
  if (Array.isArray(payload)) payload = payload[0];
  if (payload && typeof payload === "object" && "value" in (payload as object)) {
    const wrapped = (payload as { value?: unknown }).value;
    if (wrapped && typeof wrapped === "object") payload = wrapped;
  }
  if (!payload || typeof payload !== "object") {
    console.warn("[decorate] 链接回调载荷无法识别", raw);
    return;
  }

  const val = payload as WapLegacyLink;
  delete val.selected;
  delete val.intro;
  delete val.mobileIntro;

  // 先按下标记住的那一项定位；定位不到再退回 clickLink 时存下的引用
  const byIndex = props.res.options.list[linkTargetIndex.value];
  const target = (byIndex ?? selectedLinks.value) as WapLegacyOptionItem;
  target.zoneInfo = [];
  target.url = val;
  selectedLinks.value = target as Record<string, unknown>;
}
// 回调的商品信息
function selectedGoodsData(val: Array<Record<string, unknown>>) {
  if (!val) return false;
  const data = val.map((item) => {
    delete item.selected;
    delete item.intro;
    delete item.mobileIntro;
    return {
      img: item.thumbnail,
      title: item.goodsName,
      type: selectedGoods.value.title,
      ___index: selectedGoods.value.___index,
      ...item,
    };
  });
  const first = props.res.options.list[0];
  if (!first) return true;
  first.listWay = [...(first.listWay ?? []), ...data];
  // 清除已经绑定的分类
  const target = first.titleWay?.[goodsSelectedIndex.value];
  if (target) target.bindCategory = "";
  linkType.value = "";
}
// 绑定商品
function bindGoodsId(val: WapLegacyOptionItem, index: number | string) {
  selectedGoods.value = val;
  goodsSelectedIndex.value = Number(index);
  liliDialogFlag(true);
}
// 绑定分类
function bindGoodsCategory(index: number | string, _key?: number | string) {
  pendingCategory.value = null;
  enableSelectCategory.value = true;
  goodsSelectedIndex.value = Number(index);
}
// 点击抽屉
function clickDrawer(item: unknown, _index: number) {
  emit("handleDrawer", item);
  styleFlag.value = false;
  promotionsFlag.value = false;
}
// 打开图片选择器
function liliDialogFlag(flag: boolean) {
  const dialog = liliDialogRef.value;
  if (!dialog) return;
  dialog.clearGoodsSelected();
  dialog.goodsFlag = flag;
  dialog.flag = true;
}

function changeTextAlign(val: string) {
  const first = props.res.options.list[0];
  if (first) first.textAlign = val;
  textAlign.value = val;
}
// 点击链接赋值一个唯一值，并将当前选择的模块赋值
function clickLink(val: WapLegacyOptionItem, _index: number, _oval: unknown) {
  linkTargetIndex.value = _index;
  selectedLinks.value = val as Record<string, unknown>;
  if (val.model === "hotzone") {
    if (!val.zoneInfo) {
      (val as Record<string, unknown>).zoneInfo = [];
    }
    hotzoneRef.value?.open(val);
  } else {
    liliDialogFlag(false);
  }
}
function changeZone(zoneInfo: unknown[]) {
  selectedLinks.value.zoneInfo = zoneInfo;
}
//点击图片解析成base64
//添加设置
function addDecorate(
  type: string,
  data: { options: { list: Array<{ direction?: string }> } }
) {
  const first = props.res.options.list[0];
  if (type === "notice") {
    if (data.options.list[0]?.direction == "vertical") {
      const titles = Array.isArray(first?.title) ? first.title : [];
      titles.push({ content: "" });
      if (first) first.title = titles;
    } else {
      ElMessage.error("仅纵向支持多添加");
    }
  } else {
    (res.value.options as { list: Array<Record<string, unknown>> }).list.push({
      img: "https://picsum.photos/id/264/200/200",
      title: "标题",
      link: {} as WapLegacyLink,
      url: {} as WapLegacyLink,
      size: first ? first.size : "",
      model: "link",
    });
  }
}
// 图片选择器回显
function callbackSelected(val: { url?: string }) {
  picModelFlag.value = false;
  if (!val?.url) return;
  if (pictureField.value === "bgImage") {
    if (!selectedGoods.value.style) {
      selectedGoods.value.style = {};
    }
    selectedGoods.value.style.bgImage = val.url;
    return;
  }
  (selectedGoods.value as Record<string, unknown>)[String(pictureField.value ?? "")] = val.url;
}
// 点击选择图片
function handleClickFile(item: WapLegacyOptionItem, _index: number, field = "img") {
  pictureField.value = field;
  selectedGoods.value = item;
  // 打开前先声明媒体类型，素材库据此初始化分类（视频字段只列视频）
  pickerMediaType.value = field === "videoUrl" ? "VIDEO" : "IMAGE";
  picModelFlag.value = true;
  nextTick(() => {
    const oss = ossManageRef.value;
    if (!oss) return;
    oss.selectImage = true;
  });
}
function removeNotice(index: number) {
  nextTick(() => {
    const title = props.res.options.list[0].title;
    if (Array.isArray(title)) title.splice(index, 1);
  });
}
// 关闭
function closeDecorate(index: number) {
  nextTick(() => {
    (res.value.options as { list: Array<Record<string, unknown>> }).list.splice(index, 1);
  });
}
</script>
<style scoped lang="scss">
@import "./decorate.scss";
</style>

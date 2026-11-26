<template>

  <div class="pc-config-panel-container">

    <!-- 顶部选中状态卡片 (匹配魔方 dark navy card) -->

    <div class="selected-header-card">

      <div class="header-info">

        <div class="selected-tag">当前选中</div>

        <div class="selected-name">{{ currentSelectedTitle }}</div>

      </div>

      <div class="header-icon-box">

        <el-icon :size="24">

          <component :is="currentSelectedIcon" />

        </el-icon>

      </div>

    </div>



    <!-- 顶栏三 Tab 切换 -->

    <div class="panel-header-tabs">

      <div

        class="tab-btn"

        :class="{ active: activeTab === 'row' }"

        @click="setTab('row')"

      >

        行配置

      </div>

      <div

        class="tab-btn"

        :class="{ active: activeTab === 'component' }"

        @click="setTab('component')"

      >

        组件配置

      </div>

      <div

        class="tab-btn"

        :class="{ active: activeTab === 'business' }"

        @click="setTab('business')"

      >

        业务配置

      </div>

    </div>



    <div class="panel-scroll-content">

      <!-- 1. 行配置 -->

      <div v-show="activeTab === 'row'">

        <row-config-panel

          :row="rowForPanel"

          :row-index="selectedRowIndex"

          :total-rows="totalRows"

          :is-first="selectedRowIndex === 0"

          :is-last="selectedRowIndex === totalRows - 1"

          @move-up="emit('move-row-up')"

          @move-down="emit('move-row-down')"

          @move-top="emit('move-row-top')"

          @move-bottom="emit('move-row-bottom')"
          @move-to-row="idx => emit('move-to-row', idx)"

          @delete-row="emit('delete-row')"

        />

      </div>



      <!-- 2. 组件配置 -->

      <div v-show="activeTab === 'component'">

        <component-config-panel

          :component="componentForPanel"

        />

      </div>



      <!-- 3. 业务配置 -->

      <div v-show="activeTab === 'business'">

        <div v-if="!selectedComponent" class="empty-panel">

          请在画布中选中一个组件进行业务内容配置

        </div>

        <div v-else class="business-wrapper">

          <!-- 动态分发业务配置面板 -->

          <component

            :is="businessPanelComponent"

            v-if="businessPanelComponent"

            :component="componentForPanel"

            :options="selectedComponent.options"

            @update:options="applyComponentOptions"

          />

          <div v-else class="fallback-business">

            <div class="panel-title">{{ selectedComponent.name || selectedComponent.type }} 内容设置</div>

            <p class="panel-desc">当前组件的基础属性与参数设置：</p>

            <div class="form-group" v-for="(val, key) in selectedComponent.options" :key="key">

              <span class="prop-key">{{ key }}</span>

              <el-input

                v-if="typeof val === 'string'"

                v-model="componentProxy!.options[key]"

                size="small"

              />

              <el-switch

                v-else-if="typeof val === 'boolean'"

                v-model="componentProxy!.options[key]"

              />

              <el-input-number

                v-else-if="typeof val === 'number'"

                v-model="componentProxy!.options[key]"

                size="small"

              />

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>



<script setup lang="ts">
import { ref, computed } from 'vue';

import {
  House, Compass, Picture, ShoppingBag, Ticket, Document, Menu, Bottom as BottomIcon,
  List, Grid, Fold, PictureRounded, Medal, Aim, FullScreen, Files, VideoCamera,
  Goods, Postcard, Reading, DArrowRight, CollectionTag, Star, Edit, Bell,
  Search, User, Rank
} from '@element-plus/icons-vue';

const iconMap = {
  House, Compass, Picture, ShoppingBag, Ticket, Document, Menu, Bottom: BottomIcon,
  List, Grid, Fold, PictureRounded, Medal, Aim, FullScreen, Files, VideoCamera,
  Goods, Postcard, Reading, DArrowRight, CollectionTag, Star, Edit, Bell,
  Search, User, Rank
};

import RowConfigPanel from './row-config-panel.vue';

import ComponentConfigPanel from './component-config-panel.vue';

import { COMPONENT_DEFINITIONS } from '../config';



// 导入业务面板

import PanelTopBar from './panel-top-bar.vue';

import PanelSearchHeader from './panel-search-header.vue';

import PanelFooterNav from './panel-footer-nav.vue';

import PanelCategoryNav from './panel-category-nav.vue';

import PanelChannelGrid from './panel-channel-grid.vue';

import PanelCategoryMegaMenu from './panel-category-mega-menu.vue';

import PanelCarousel from './panel-carousel.vue';

import PanelBrandWall from './panel-brand-wall.vue';

import PanelHotZone from './panel-hot-zone.vue';

import PanelFreeLayout from './panel-free-layout.vue';

import PanelPromoGroup from './panel-promo-group.vue';

import PanelVideo from './panel-video.vue';

import PanelGoods from './panel-goods.vue';
import PanelGridFloor from './panel-grid-floor.vue';
import PanelGoodsGrid from './panel-goods-grid.vue';
import PanelChannelFloor from './panel-channel-floor.vue';
import PanelRecommendFeed from './panel-recommend-feed.vue';

import PanelCoupon from './panel-coupon.vue';
import PanelUserBenefits from './panel-user-benefits.vue';

import PanelTitle from './panel-title.vue';

import PanelArticle from './panel-article.vue';

import PanelNotice from './panel-notice.vue';



/**
 * 配置面板的 props。
 *
 * 这里刻意用「宽松对象」而不是 PcRow / PcComponent：
 * 面板只读取字段并回写 options，不需要与画布共享同一套精确类型；
 * 用精确类型反而会让 `selectedRow`（PcRow | null）赋值失败。
 */
type PanelRowLike = Record<string, any>;
type PanelComponentLike = Record<string, any>;

const props = withDefaults(
  defineProps<{
    selectedRow?: PanelRowLike | null;
    selectedComponent?: PanelComponentLike | null;
    selectedRowIndex?: number;
    totalRows?: number;
  }>(),
  { selectedRow: null, selectedComponent: null, selectedRowIndex: 0, totalRows: 0 }
);

/**
 * 子面板（行/组件配置）的 props 是 Record<string, any>，
 * 这里做一次显式转换，避免把 null 传进去。
 */
const rowForPanel = computed(() => props.selectedRow ?? undefined);
const componentForPanel = computed(() => props.selectedComponent ?? undefined);

/**
 * 组件数据代理（与 props 指向同一个对象）。
 *
 * 通用属性表单要按动态键就地写 options，而 selectedComponent 是从 props 派生的
 * 只读 computed；通过这个同引用代理写入，组件内不再出现「给 prop 赋值」的写法。
 */
const componentProxy = computed(
  () => props.selectedComponent as PanelComponentLike | null
);



/**
 * 子面板通过 update:options 回写配置。
 * 就地合并进 onComponentOptions，避免替换整个对象（其他引用会拿到旧值）。
 */
function applyComponentOptions(patch: Record<string, unknown>) {
  const target = props.selectedComponent as { options?: Record<string, unknown> } | null;
  if (!target) return;
  target.options = Object.assign(target.options ?? {}, patch);
}

const emit = defineEmits([

  'move-row-up',

  'move-row-down',

  'move-row-top',

  'move-row-bottom',
  'move-to-row',

  'delete-row',
  'tab-change'
]);



// 默认组件配置

const activeTab = ref('component');



function setTab(tab: string) {
  activeTab.value = tab;
  emit('tab-change', tab);
}

function selectRowTab() {
  activeTab.value = 'row';
  emit('tab-change', 'row');
}

function selectComponentTab() {
  activeTab.value = 'component';
  emit('tab-change', 'component');
}

defineExpose({
  selectComponentTab,
  selectRowTab,
  activeTab
});



const currentSelectedTitle = computed(() => {

  if (props.selectedComponent) {

    return props.selectedComponent.name || props.selectedComponent.type;

  }

  if (props.selectedRow) {

    return `第 ${props.selectedRowIndex + 1} 行`;

  }

  return '未选择项目';

});



const currentSelectedIcon = computed(() => {
  const selected = props.selectedComponent;
  if (selected) {
    const iconName =
      selected.icon ||
      (COMPONENT_DEFINITIONS as Array<{ type?: string; icon?: string }>).find(
        (d) => d.type === selected.type
      )?.icon;
    return (iconMap as Record<string, unknown>)[iconName ?? ""] || Grid;
  }
  return Rank;
});



const panelMap = {

  // 结构 (3)

  topBar: PanelTopBar,

  searchHeader: PanelSearchHeader,

  footerNav: PanelFooterNav,

  // 导航 (3)

  categoryNav: PanelCategoryNav,

  channelGrid: PanelChannelGrid,

  categoryMegaMenu: PanelCategoryMegaMenu,

  // 广告 (6)

  carousel: PanelCarousel,

  brandWall: PanelBrandWall,

  hotZone: PanelHotZone,

  freeLayout: PanelFreeLayout,

  promoGroup: PanelPromoGroup,

  video: PanelVideo,

  // 商品 (8)

  goodsList: PanelGoods,

  gridFloor: PanelGridFloor,

  goodsGrid: PanelGoodsGrid,

  goodsCard: PanelGoods,

  bannerFloor: PanelGridFloor,

  goodsBar: PanelGoods,

  channelFloor: PanelChannelFloor,

  recommendFeed: PanelRecommendFeed,

  // 营销 (1)

  couponList: PanelCoupon,
  userBenefits: PanelUserBenefits,

  // 内容 (3)

  titleBar: PanelTitle,

  articleContent: PanelArticle,

  noticeBar: PanelNotice

};



const businessPanelComponent = computed(() => {

  if (!props.selectedComponent) return null;

  return (panelMap as Record<string, unknown>)[props.selectedComponent.type] || null;

});

</script>



<style lang="scss" scoped>

.pc-config-panel-container {

  display: flex;

  flex-direction: column;

  height: 100%;

  background: #ffffff;



  /* 顶部暗蓝选中卡片 */

  .selected-header-card {

    display: flex;

    justify-content: space-between;

    align-items: center;

    background: #1f2d48;

    margin: 12px 12px 4px 12px;

    padding: 12px 16px;

    border-radius: 8px;

    box-sizing: border-box;



    .header-info {

      display: flex;

      flex-direction: column;



      .selected-tag {

        font-size: 11px;

        color: rgba(255, 255, 255, 0.65);

        margin-bottom: 4px;

      }



      .selected-name {

        font-size: 16px;

        font-weight: 700;

        color: #ffffff;

      }

    }



    .header-icon-box {

      width: 44px;

      height: 44px;

      background: rgba(255, 255, 255, 0.12);

      border-radius: 8px;

      display: flex;

      align-items: center;

      justify-content: center;

      color: #ffffff;

    }

  }



  .panel-header-tabs {

    display: flex;

    border-bottom: 1px solid #f0f0f0;

    background: #ffffff;

    margin: 0 12px;



    .tab-btn {

      flex: 1;

      text-align: center;

      padding: 12px 0;

      font-size: 13px;

      font-weight: 500;

      color: #595959;

      cursor: pointer;

      border-bottom: 2px solid transparent;

      transition: all 0.2s;



      &:hover {

        color: #ff6a00;

      }



      &.active {

        color: #ff6a00;

        font-weight: 600;

        border-bottom-color: #ff6a00;

      }

    }

  }



  .panel-scroll-content {

    flex: 1;

    overflow-y: auto;

  }

}



.empty-panel {

  text-align: center;

  padding: 60px 20px;

  color: #94a3b8;

  font-size: 13px;

}



.business-wrapper {

  padding: 12px;



  .fallback-business {

    .panel-title {

      font-size: 14px;

      font-weight: 600;

      color: #0f172a;

      margin-bottom: 4px;

    }

    .panel-desc {

      font-size: 12px;

      color: #64748b;

      margin-bottom: 16px;

    }

    .form-group {

      display: flex;

      align-items: center;

      justify-content: space-between;

      margin-bottom: 12px;

      .prop-key {

        font-size: 12px;

        color: #334155;

      }

    }

  }

}

</style>


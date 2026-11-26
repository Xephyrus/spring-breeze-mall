<template>
  <div class="tpl-goods" :class="{ 'legacy-mode': !isNew }" :style="wrapperStyle">
    <!-- 新版商品列表 -->
    <template v-if="isNew">
      <div v-if="displayGoods.length" class="g-list" :class="'mode-' + layout" :style="listStyle">
        <div class="g-item" v-for="(g, i) in displayGoods" :key="i" :style="itemStyle">
          <div class="g-imgbox">
            <img :src="g.img" alt="" />
          </div>
          <div class="g-info">
            <div v-if="showName" class="g-name" :style="nameStyle">{{ g.name }}</div>
            <div v-if="showPrice" class="g-price" :style="priceStyle">
              ¥{{ unitPrice(g.price) }}
            </div>
            <div class="g-bottom">
              <span
                v-if="showSales && g.sales != null"
                class="g-sales"
                :style="salesStyle"
                >已售 {{ g.sales }} 件</span
              >
              <span
                v-if="cartShow"
                class="g-cart"
                :class="'cart-' + cartStyle"
                :style="cartStyleObj"
              >
                <template v-if="cartStyle === 'text'">加购</template>
                <template v-else-if="cartStyle === 'plus'">+</template>
                <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path
                    d="M7 4h-2l-1 2h2l2.4 9.6a2 2 0 0 0 1.9 1.4h7.9a2 2 0 0 0 1.9-1.5l1.6-6.5h-12l-.8-3h11.5l.5-2h-13.4zM10 20a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="g-empty">暂无商品</div>
    </template>

    <!-- 旧版：分类标签 + 绑定商品 -->
    <template v-else-if="goodsBlock">
      <div class="goods-cell-title">
        <div
          class="goods-item-title"
          :class="{ selected: selected.index == index }"
          @click="handleClickTitle(title, index)"
          v-for="(title, index) in goodsBlock.titleWay"
          :key="index"
        >
          <h4>{{ title.title }}</h4>
          <div>{{ title.desc }}</div>
        </div>
      </div>
      <div class="goods-list">
        <template v-for="(item, item_index) in goodsBlock.listWay" :key="item_index">
          <div v-if="isGoodsVisible(item)" class="goods-item">
            <div class="goods-img">
              <img :src="item.img" alt="" />
            </div>
            <div class="goods-desc">
              <div class="goods-title">
                {{ item.title }}
              </div>
              <div class="goods-bottom">
                <div class="goods-price">￥{{ unitPrice(item.price) }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { getGoodsListData } from "@/api/goods";
import { unitPrice } from "@/utils/filters";

defineOptions({ name: "tpl_goods" });

const props = defineProps({
    res: { type: Object, default: () => ({}) },
  });

const selected = ref({ index: 0, val: "" });
const goodsData = ref<Array<Record<string, unknown>>>([]);

const first = computed(() => {
      return (props.res.list && props.res.list[0]) || {};
    });
/** 新版标记：面板写入过 layout 字段（老数据没有该字段，走 legacy 样式） */
const isNew = computed(() => first.value.layout !== undefined);
const layout = computed(() => {
      return first.value.layout || "list";
    });
const showName = computed(() => {
      return first.value.showName !== false;
    });
const showPrice = computed(() => {
      return first.value.showPrice !== false;
    });
const showSales = computed(() => {
      return first.value.showSales !== false;
    });
const cartShow = computed(() => {
      return first.value.cartShow !== false;
    });
const cartStyle = computed(() => {
      return first.value.cartStyle || "plus";
    });
const themePrice = computed(() => {
      return "#FF5C58";
    });
const priceColor = computed(() => {
      return props.res.toneMode === "custom" && props.res.priceColor
        ? props.res.priceColor
        : themePrice;
    });
const priceStyle = computed(() => {
      return { color: priceColor.value };
    });
const nameStyle = computed(() => {
      return props.res.titleColor ? { color: props.res.titleColor } : {};
    });
const salesStyle = computed(() => {
      return props.res.salesColor ? { color: props.res.salesColor } : {};
    });
const cartStyleObj = computed(() => {
      return { background: priceColor.value };
    });
/** 设计稿按 2 倍图切，展示时统一折半 */
const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;
const wrapperStyle = computed(() => {
      const res = props.res;
      if (!isNew.value) {
        return {};
      }
      const bg =
        !res.bgColor2 || res.bgColor1 === res.bgColor2
          ? res.bgColor1
          : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
      return {
        background: bg,
        padding: `${px(res.paddingTop)} ${px(res.paddingX)} ${px(res.paddingBottom)}`,
        marginBottom: px(res.pageGap),
        borderRadius: px(res.borderRadius),
        overflow: Number(res.borderRadius) > 0 ? "hidden" : "visible",
      };
    });
const listStyle = computed(() => {
      const gap = px(props.res.contentGap ?? 10);
      return { gap, "--g-gap": gap };
    });
const itemStyle = computed(() => {
      const r = px(props.res.contentRadius);
      return { borderRadius: r, overflow: Number(props.res.contentRadius) > 0 ? "hidden" : "visible" };
    });
const displayGoods = computed(() => {
      if (first.value.dataMode === "goods") {
        return (first.value.goodsList || []).map((g: Record<string, unknown>) => ({
          name: g.goodsName,
          price: g.price,
          img: g.thumbnail,
          sales: g.buyCount != null ? g.buyCount : null,
        }));
      }
      return goodsData.value;
    });
const goodsBlock = computed(() => {
      return props.res && props.res.list && props.res.list[0] ? props.res.list[0] : null;
    });

function loadGoods() {
      const item = first;
      if (!isNew.value || item.value.dataMode === "goods") {
        return;
      }
      // 查询参数会按"数据来源"动态补字段（分类/品牌/店铺/排序），这里声明成宽类型
      const params: Record<string, unknown> = {
        pageNumber: 1,
        pageSize: item.value.count || 6,
        goodsStatus: "UPPER",
      };
      if (item.value.dataMode === "category" && item.value.categoryId) {
        // category_path 以逗号包裹，前后补逗号避免误匹配
        params.categoryPath = `,${item.value.categoryId},`;
      }
      if (item.value.dataMode === "brand" && item.value.brandId) {
        params.brandId = item.value.brandId;
      }
      if (item.value.dataMode === "store" && item.value.storeId) {
        params.storeId = item.value.storeId;
      }
      if (item.value.sortType === "sales") {
        params.sort = "buyCount";
        params.order = "desc";
      } else if (item.value.sortType === "price") {
        params.sort = "price";
        params.order = "asc";
      }
      getGoodsListData(params)
        .then((res) => {
          const records = ((res && res.result && res.result.records) || []) as Array<Record<string, unknown>>;
          goodsData.value = records.map((g: Record<string, unknown>) => ({
            name: g.goodsName,
            price: g.price,
            img: g.thumbnail || g.small || g.original,
            sales: g.buyCount != null ? g.buyCount : null,
          }));
        })
        .catch(() => {
          goodsData.value = [];
        });
    
}

function isGoodsVisible(item: Record<string, unknown>) {
      if (!item) {
        return false;
      }
      if (item.___index != undefined) {
        return selected.value.index == item.___index;
      }
      return selected.value.val == item.type;
    
}

function handleClickTitle(val: { title?: string; type?: string }, index: number | string) {
  selected.value.index = Number(index);
  selected.value.val = val.title ?? "";
    
}

(() => {

    if (isNew.value) {
      loadGoods();
    } else {
      const block = goodsBlock;
      if (block.value) {
        const firstGoods = (block.value.listWay || []).find(Boolean);
        if (firstGoods) {
          selected.value.val = firstGoods.type;
        } else if (block.value.titleWay && block.value.titleWay[0]) {
          selected.value.val = block.value.titleWay[0].title;
        }
      }
    }
  
})();

/* TODO watch retained — review manually */
/* {
    "first.dataMode": "loadGoods",
    "first.categoryId": "loadGoods",
    "first.brandId": "loadGoods",
    "first.storeId": "loadGoods",
    "first.count": "loadGoods",
    "first.sortType" */
</script>

<style lang="scss" scoped>
.tpl-goods {
  background: #fff;
}

.legacy-mode {
  background: #e8e8e8;
  padding: 8px 0;
}

.g-empty {
  padding: 30px 0;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.g-list {
  display: flex;
  flex-wrap: wrap;
}

.g-item {
  background: #fff;
  display: flex;
  box-sizing: border-box;
}

.g-imgbox {
  flex-shrink: 0;
  background: #f5f5f5;
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.g-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.g-name {
  font-size: 13px;
  color: #282828;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.g-bottom {
  display: flex;
  align-items: center;
  margin-top: auto;
}

.g-price {
  color: $theme_color;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.g-sales {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: #666;
}

.g-cart {
  flex-shrink: 0;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  &.cart-plus,
  &.cart-cart {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 15px;
    line-height: 1;
  }
  &.cart-text {
    border-radius: 12px;
    padding: 3px 10px;
    font-size: 12px;
  }
}

/* 卡片：左图右文（参考 CRMEB 详细列表，左侧 112x112 缩略图，右侧标题置顶、价格销量置底） */
.mode-card {
  flex-direction: column;
  .g-item {
    flex-direction: row;
    align-items: stretch;
    padding: 10px;
  }
  .g-imgbox {
    width: 112px;
    height: 112px;
    margin-right: 12px;
    border-radius: 6px;
    overflow: hidden;
  }
  .g-info {
    min-height: 112px;
    justify-content: space-between;
  }
  .g-name {
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    margin-bottom: 6px;
  }
  .g-price {
    font-size: 16px;
    font-weight: 700;
    margin-top: auto;
    margin-bottom: 4px;
  }
  .g-bottom {
    margin-top: 0;
  }
  .g-sales {
    font-size: 12px;
  }
}

/* 列表：两列网格 */
.mode-list {
  .g-item {
    width: calc((100% - var(--g-gap, 5px)) / 2);
    flex-direction: column;
  }
  .g-imgbox {
    width: 100%;
    aspect-ratio: 1;
  }
  .g-info {
    padding: 8px 10px 10px;
    min-height: 64px;
  }
  .g-name {
    margin-bottom: 6px;
  }
}

/* 三列 */
.mode-three {
  .g-item {
    width: calc((100% - var(--g-gap, 5px) * 2) / 3);
    flex-direction: column;
  }
  .g-imgbox {
    width: 100%;
    aspect-ratio: 1;
  }
  .g-info {
    padding: 6px;
    min-height: 48px;
  }
  .g-name {
    -webkit-line-clamp: 1;
    font-size: 11px;
    margin-bottom: 2px;
  }
  .g-price {
    font-size: 12px;
  }
  .g-sales {
    font-size: 10px;
  }
  .g-cart {
    &.cart-plus,
    &.cart-cart {
      width: 20px;
      height: 20px;
      font-size: 13px;
    }
  }
}

/* 大图：一行一个 */
.mode-big {
  flex-direction: column;
  .g-item {
    width: 100%;
    flex-direction: column;
  }
  .g-imgbox {
    width: 100%;
    aspect-ratio: 3 / 2;
  }
  .g-info {
    padding: 10px 12px 12px;
    min-height: 64px;
  }
  .g-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .g-price {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
  }
}

/* 旧版样式 */
.selected {
  > h4 {
    color: #000 !important;
  }
  > div {
    font-weight: bold;
    color: $theme_color !important;
  }
}
.goods-cell-title {
  padding: 10px;
  transition: 0.35s;
  display: flex;
  > .goods-item-title {
    flex: 1;
    text-align: center;
    > h4 {
      font-size: 16px;
      color: #666;
    }
    > div {
      color: #999;
      font-size: 12px;
    }
  }
}
.goods-list {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}
.goods-item {
  width: 50%;
  margin-bottom: 10px;
  border-radius: 0.4em;
  overflow: hidden;
}
.goods-img {
  position: relative;
  margin: 0 auto;
  width: 158px;
  height: 150px;
  border-top-left-radius: 0.4em;
  border-top-right-radius: 0.4em;
  overflow: hidden;
  > img {
    width: 100%;
    height: 100%;
  }
}
.goods-desc {
  border-bottom-left-radius: 0.4em;
  border-bottom-right-radius: 0.4em;
  width: 158px;
  background: #fff;
  padding: 4px;
  margin: 0 auto;
  > .goods-title {
    font-size: 12px;
    height: 38px;
    display: -webkit-box;
    font-weight: 500;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  > .goods-bottom {
    display: flex;
    > .goods-price {
      line-height: 2;
      color: $theme_color;
    }
  }
}
</style>

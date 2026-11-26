<template>
  <div class="tpl-shop" :style="wrapperStyle">
    <div class="shop-head" v-if="headIcon || title || hasMore">
      <img v-if="headIcon" class="shop-head-icon" :src="headIcon" alt="" />
      <div class="shop-title" :style="titleStyle">{{ title }}</div>
      <div v-if="hasMore" class="shop-more" :style="moreStyle">更多 ></div>
    </div>

    <!-- 老数据：两列网格 -->
    <div v-if="!styled" class="shop-grid-legacy">
      <div class="shop-item" v-for="i in 4" :key="i">
        <div class="shop-logo"></div>
        <div class="shop-name">店铺名称</div>
      </div>
    </div>

    <!-- 样式一：店铺卡片三列（全景大片橱窗） -->
    <div v-else-if="shopStyle === 'one'" class="shop-grid">
      <div class="shop-card" v-for="(shop, i) in previewShops" :key="i">
        <img
          v-if="shop.goodsImage"
          class="shop-card-bg"
          :style="logoStyle"
          :src="shop.goodsImage"
          alt=""
        />
        <div v-else class="shop-card-bg shop-card-bg-empty" :style="logoStyle"></div>
        <div class="shop-card-badge" v-if="isSelf(shop)">自营</div>
        <div class="shop-card-body">
          <img v-if="showLogo" class="shop-card-logo" :src="shop.logo" alt="" />
          <div v-if="showName" class="shop-card-name" :style="nameStyle">{{ shop.name }}</div>
        </div>
      </div>
    </div>

    <!-- 样式二：店铺卡片 + 商品列表（大牌名店街 + 精品橱窗） -->
    <div v-else class="shop-street-list">
      <div class="shop-street-card" v-for="(shop, i) in previewShops" :key="i">
        <div class="shop-street-head">
          <div class="shop-street-info">
            <img v-if="showLogo" class="shop-street-logo" :src="shop.logo" alt="" />
            <div class="shop-street-meta">
              <div class="shop-street-name-row">
                <div v-if="showName" class="shop-street-name" :style="nameStyle">{{ shop.name }}</div>
                <span class="shop-street-tag" v-if="isSelf(shop)">自营</span>
              </div>
              <div class="shop-street-desc">热卖好物甄选中</div>
            </div>
          </div>
          <div class="shop-street-enter">进店逛逛 &gt;</div>
        </div>
        <div class="shop-street-goods">
          <div
            class="street-goods-item"
            v-for="(goods, goodsIndex) in shop.goods"
            :key="goodsIndex"
          >
            <div class="street-goods-cover">
              <img class="street-goods-img" :src="goods.img" alt="" />
            </div>
            <div class="street-goods-name">{{ goods.name }}</div>
            <div class="street-goods-price">
              <span class="street-goods-symbol">¥</span>{{ unitPrice(goods.price) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasPanelStyle } from "./panel-style";
import { ref, computed } from "vue";
import { getGoodsListData } from "@/api/goods";
import { unitPrice } from "@/utils/filters";

defineOptions({ name: "tpl_shop" });

/** 店铺项（模板只用到这几个字段） */
type ShopPreview = {
  goodsImage?: string;
  logo?: string;
  name?: string;
  storeName?: string;
  /** 后端可能返回 boolean / "true" / 1 / "1" */
  selfOperated?: boolean | string | number;
  /** 店铺下的商品（画布预览用） */
  goods?: Array<{ img?: string; name?: string; price?: number | string }>;
  [key: string]: unknown;
};

const props = defineProps({
    res: { type: Object, default: () => ({}) },
  });

const goodsMap = ref<Record<string, unknown>>({});

const first = computed(() => {
      return (props.res.list && props.res.list[0]) || {};
    });
const title = computed(() => {
      return first.value.title || "";
    });
const headIcon = computed(() => {
      return first.value.icon || "";
    });
const hasMore = computed(() => {
      return !!first.value.moreUrl;
    });
const showLogo = computed(() => {
      return first.value.showLogo !== false;
    });
const showName = computed(() => {
      return first.value.showName !== false;
    });
const shopStyle = computed(() => {
      return first.value.shopStyle || "one";
    });
/** 面板保存过样式字段才启用自定义样式，老数据保持原样 */
const styled = computed(() => hasPanelStyle(props.res));

/** 没选过店铺时的示例数据，保证画布不空 */
const DEMO_SHOPS = [
  {
    name: "示例旗舰店",
    logo: "https://lilishop-oss.oss-cn-beijing.aliyuncs.com/logo.png",
    goodsImage: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/goods/goods_1.png",
    selfOperated: true,
    goods: [
      {
        img: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/goods/goods_2.png",
        name: "热卖商品一",
        price: "3999.00",
      },
      {
        img: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/goods/goods_3.png",
        name: "热卖商品二",
        price: "1099.00",
      },
    ],
  },
  {
    name: "甄选生活馆",
    logo: "https://lilishop-oss.oss-cn-beijing.aliyuncs.com/logo.png",
    goodsImage: "https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/goods/goods_4.png",
    selfOperated: false,
    goods: [],
  },
];

/**
 * 画布里的店铺预览：
 * 选过店铺就展示已选的（把 storeXxx 字段映射成模板用的 name / logo / goodsImage），
 * 没选过则用示例数据。
 */
const previewShops = computed<ShopPreview[]>(() => {
  const selected = first.value.shopList;
  if (Array.isArray(selected) && selected.length) {
    return selected.map((shop: Record<string, unknown>): ShopPreview => ({
      name: String(shop.storeName ?? ""),
      logo: String(shop.storeLogo ?? ""),
      goodsImage: String(shop.storeBanner ?? ""),
      selfOperated: Boolean(shop.selfOperated),
      goods: Array.isArray(shop.goods)
        ? (shop.goods as ShopPreview["goods"])
        : [],
    }));
  }
  return DEMO_SHOPS;
});
const titleStyle = computed(() => {
      return styled.value && props.res.titleColor
        ? { color: props.res.titleColor }
        : {};
    });
const nameStyle = computed(() => {
      return styled.value && props.res.nameColor
        ? { color: props.res.nameColor }
        : {};
    });
const moreStyle = computed(() => {
      return styled.value && props.res.moreColor
        ? { color: props.res.moreColor }
        : {};
    });
const logoStyle = computed(() => {
      return styled.value
        ? { borderRadius: `${(Number(props.res.imgRadius) || 0) / 2}px` }
        : {};
    });
const wrapperStyle = computed(() => {
      if (!styled.value) {
        return {
          background: props.res.bgColor || "#FFFFFF",
          padding: `10px ${props.res.paddingX || 0}px`,
          marginBottom: `${props.res.pageGap !== undefined ? props.res.pageGap : 0}px`,
          borderRadius: `${props.res.borderRadius || 0}px`,
          overflow: "hidden",
        };
      }
      const res = props.res;
      const bg =
        !res.bgColor2 || res.bgColor1 === res.bgColor2
          ? res.bgColor1
          : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
      const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;
      return {
        background: bg,
        padding: `${px(res.paddingTop)} ${px(res.paddingX)} ${px(res.paddingBottom)}`,
        marginBottom: px(res.pageGap),
        borderRadius: px(res.borderRadius),
        overflow: Number(res.borderRadius) > 0 ? "hidden" : "visible",
      };
    });

function isSelf(shop: ShopPreview) {
      if (!shop) return false;
      return Boolean(
        shop.selfOperated === true ||
        shop.selfOperated === 'true' ||
        shop.selfOperated === 1 ||
        shop.selfOperated === '1' ||
        (shop.name && shop.name.includes('自营')) ||
        (shop.storeName && shop.storeName.includes('自营'))
      );
    
}

function loadGoodsImages() {
      if (first.value.dataMode !== "custom") return;
  (first.value.shopList || []).forEach((shop: Record<string, unknown>) => {
    const shopId = String(shop.id ?? "");
    if (!shopId || goodsMap.value[shopId]) return;
    getGoodsListData({
      storeId: shopId,
      pageNumber: 1,
      pageSize: 3,
      goodsStatus: "UPPER",
    })
      .then((res) => {
        const records = ((res && res.result && res.result.records) || []) as Array<Record<string, unknown>>;
        goodsMap.value[shopId] = records
          .map((goods: Record<string, unknown>) => ({
            name: goods.goodsName,
            price: goods.price,
            img: goods.thumbnail ?? goods.small ?? goods.original,
          }))
          .filter((goods) => Boolean(goods.img));
      })
          .catch(() => {});
      });
    
}

(() => {

    loadGoodsImages();
  
})();

/* TODO watch retained — review manually */
/* {
    "first.dataMode": "loadGoodsImages",
    "first.shopList": {
      handler: "loadGoodsImages",
      deep: true,
    },
  } */
</script>

<style scoped lang="scss">
.shop-head {
  display: flex;
  align-items: center;
  padding: 4px 12px 10px;
}
.shop-head-icon {
  width: 62px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  margin-right: 6px;
}
.shop-title {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shop-more {
  flex-shrink: 0;
  font-size: 12px;
  color: #999;
}
.shop-grid-legacy {
  display: flex;
  flex-wrap: wrap;
  padding: 0 12px;
}
.shop-item {
  width: 50%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.shop-logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}
.shop-name {
  font-size: 13px;
  color: #333;
  margin-left: 8px;
}
/* 样式一：全景大片橱窗 */
.shop-grid {
  display: flex;
  gap: 8px;
  padding: 0 12px;
}
.shop-card {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 112px;
  border-radius: 8px;
  overflow: hidden;
  background: #f7f7f7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.shop-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.shop-card-bg-empty {
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
}
.shop-card-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 2;
  font-size: 10px;
  color: #fff;
  background: #e1251b;
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.3;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.shop-card-body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 16px 6px 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 35%, rgba(0, 0, 0, 0.72) 100%);
}
.shop-card-logo {
  flex-shrink: 0;
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: contain;
  background: #fff;
  padding: 1px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.shop-card-name {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* 样式二：大牌名店街 + 精品橱窗 */
.shop-street-list {
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.shop-street-card {
  border-radius: 10px;
  overflow: hidden;
  background: #fbfbfb;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.shop-street-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
}
.shop-street-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.shop-street-logo {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 2px;
  box-sizing: border-box;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #eee;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.shop-street-meta {
  min-width: 0;
  flex: 1;
}
.shop-street-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.shop-street-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shop-street-tag {
  flex-shrink: 0;
  font-size: 9px;
  color: #fff;
  background: #e1251b;
  padding: 0 4px;
  border-radius: 3px;
  line-height: 14px;
  font-weight: 500;
}
.shop-street-desc {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}
.shop-street-enter {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  color: $theme_color;
  background: #fff;
  border: 1px solid rgba(255, 60, 42, 0.25);
  padding: 3px 8px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(255, 60, 42, 0.05);
  cursor: pointer;
  margin-left: 8px;
}
.shop-street-goods {
  display: flex;
  gap: 8px;
  padding: 8px;
  box-sizing: border-box;
}
.street-goods-item {
  flex: 1;
  min-width: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #f2f2f2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.street-goods-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #fafafa;
}
.street-goods-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.street-goods-name {
  padding: 4px 6px 0;
  color: #333;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.street-goods-price {
  padding: 2px 6px 6px;
  color: $theme_color;
  font-size: 12px;
  font-weight: 700;
}
.street-goods-symbol {
  font-size: 9px;
  font-weight: normal;
  margin-right: 1px;
}
</style>

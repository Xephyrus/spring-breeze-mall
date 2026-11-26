<template>
  <div class="goods-type-wrapper">
    <div class="flex goods-type-line">
      <div class="goods-type-title">{{ data.options.title }}</div>
      <div class="flex goods-type-labels">
        <div
          @click="tabCurrentlyIndex = Number(index)"
          :class="{ active: tabCurrentlyIndex === index }"
          class="goods-type-item"
          v-for="(item, index) in data.options.labels"
          :key="index"
        >
          {{ item.label }}
        </div>
      </div>
    </div>

    <!-- 商品部分 -->
    <div class="goods-list flex">
      <div
        class="goods-list-item"
        v-for="(item, index) in data.options.list.filter((subset: Record<string, unknown>) => {
          return subset.___index == tabCurrentlyIndex;
        })"
        :key="index"
      >
        <div class="goods-img">
          <img alt="楼层图片" :src="item.img" />
        </div>
        <div>
          <div class="goods-name wes-2">{{ item.title }}</div>
          <div class="goods-desc">{{ item.desc }}</div>
        </div>
        <div class="goods-price">
          {{ $filters.unitPrice(item.price, "￥") }}
        </div>
      </div>
      <div class="setup-box">
        <div>
          <el-button
            size="small"
            @click.stop="handleSelectModel"
            >编辑</el-button
          >
        </div>
      </div>
    </div>

    <el-dialog
      v-model="showModal"
      title="装修"
      
      width="800"
      
      :close-on-click-modal="false"
     append-to-body destroy-on-close>
      <div class="modal-tab-bar" v-if="draftOptions">
        <div class="tab-bar">
          标题
          <el-input style="width: 300px" v-model="draftOptions.title" />
        </div>
        <div class="tab-bar" v-if="draftOptions.labels[tabCurrentlyIndex]">
          标签
          <el-input
            style="width: 300px"
            v-model="draftOptions.labels[tabCurrentlyIndex].label"
           />
        </div>
        <el-button @click="handleTabsAdd" size="small" class="mb_10">增加</el-button>
        <el-tabs
          type="card"
          :model-value="tabIndex"
          @update:model-value="(name: string | number | undefined) => (tabIndex = String(name ?? 0))"
          @tab-click="handleClickTab"
        >
          <el-tab-pane
            v-for="(tab,tabIndex) in draftOptions.labels"
            :key="tabIndex"
            :label="tab.label"
            :name="tab.___index + ''"
          >
            <div class="flex flex-a-c">
              <el-button class="del-btn" type="primary" @click="handleContextMenuDelete(tab, Number(tabIndex))">删除当前标签</el-button>
              <el-button class="add-goods" @click="addCurrentGoods">
                添加商品
              </el-button>
            </div>

            <div
              v-for="(item, index) in draftOptions.list.filter((subset: Record<string, unknown>) => {
                return subset.___index == tabCurrentlyIndex;
              })"
              :key="index"
              class="draggable"
            >
              <div class="flex">
                <img alt="楼层图片" :src="item.img" class="column-img" />
                <div class="flex column-goods-config">
                  <div class="column-config">
                    <div>
                      标题：
                      <el-input v-model="item.title" />
                    </div>
                    <div>
                      描述：
                      <el-input v-model="item.desc" />
                    </div>
                  </div>
                  <el-button @click="delGoods(item)">删除</el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="handleCancelModal">取消</el-button>
        <el-button type="primary" @click="handleConfirmModal">确定</el-button>
      </template>
    </el-dialog>

    <!-- 选择商品。链接 -->
    <liliDialog
      ref="liliDialogRef"
      @selectedLink="selectedLink"
      @selectedGoodsData="selectedGoodsData"
    ></liliDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { formatLinkType } from "@/utils/filters";

defineOptions({ name: "goods" });

const props = defineProps<{
  /** 楼层数据（画布 v-for 传入，装修器按设计就地编辑） */
  data: Record<string, any>;
}>();

/**
 * 装修数据代理。
 *
 * 画布里的楼层是 v-for 渲染的，父级无法对别名做 v-model，
 * 所以这里取同一个对象引用的 computed 代理再编辑：
 * 数据仍写回页面模型（与改造前行为一致），组件内不再给 prop 直接赋值。
 */
const data = computed(() => props.data);

/** el-tabs 的 name 是字符串 */
const tabIndex = ref<string>("0");
const current = ref(0);
const showModal = ref(false);
/** 标签（分类）项 */
type LabelItem = {
  ___index?: number | string;
  title?: string;
  /** el-tabs 的 tab label */
  label?: string;
  [key: string]: unknown;
};

/** 商品行 */
type GoodsRow = {
  img?: string;
  price?: number | string;
  title?: string;
  desc?: string;
  url?: string;
  ___index?: number | string;
  [key: string]: unknown;
};

/** 面板配置 */
type PanelOptions = {
  title?: string;
  labels: LabelItem[];
  list: GoodsRow[];
};

const draftOptions = ref<PanelOptions | null>(null);
const tabCurrentlyIndex = ref(0); // 选项卡索引

const liliDialogRef = ref<{
  open: (mode: string) => void;
  /** 清空已选商品（lili-dialog 暴露） */
  clearGoodsSelected?: () => void;
} | null>(null);

onMounted(() => {
  tabIndex.value = props.data.options.labels[0].___index;
});

function cloneOptions(options: unknown) {
  return JSON.parse(JSON.stringify(options || {}));
}
/**
 * 算出最大的index 然后索引叠加
 */
function handleTabsAdd() {
  if (!draftOptions.value) return;
  const findAllIndex = draftOptions.value.labels.map((item) => Number(item.___index ?? 0));
  const max = findAllIndex.length ? Math.max(...findAllIndex) : 0;

  draftOptions.value.labels.push({
    label: "标签" + (max + 1),
    ___index: max + 1,
  });
}
// 删除标签
function handleContextMenuDelete(item: unknown, index: number | string) {
  if (!draftOptions.value) return;
  draftOptions.value.list = draftOptions.value.list.filter(
    (lab: { ___index?: number | string }) => lab.___index != (item as { ___index?: number | string }).___index
  );
  draftOptions.value.labels.splice(Number(index), 1);
}
// 删除商品
function delGoods(val: Record<string, unknown>) {
  const opts = draftOptions.value;
  if (!opts) return;
  opts.list.forEach((item, i) => {
    if (item.title == val.title && item.___index == tabCurrentlyIndex.value) {
      opts.list.splice(i, 1);
    }
  });
}
// 切换选项卡
function handleClickTab(pane: { paneName?: string | number }) {
  tabCurrentlyIndex.value = Number(pane?.paneName ?? 0);
}
// 添加当前选项卡中的商品
function addCurrentGoods() {
  if (!liliDialogRef.value) return;
  liliDialogRef.value.clearGoodsSelected?.();
  liliDialogRef.value.open("goods");
}
// 编辑模块
function handleSelectModel() {
  draftOptions.value = cloneOptions({
    title: props.data.options.title,
    labels: props.data.options.labels,
    list: props.data.options.list,
  });
  tabCurrentlyIndex.value = Number(draftOptions.value?.labels[0]?.___index ?? 0);
  tabIndex.value = String(tabCurrentlyIndex.value ?? 0);
  showModal.value = true;
}
// 选择商品回调
function selectedGoodsData(val: Array<Record<string, unknown>>) {
  const opts = draftOptions.value;
  if (!val?.length || !opts) return;
  val.forEach((item) => {
    opts.list.push({
      img: String(item.thumbnail ?? ""),
      price: item.price as number | string | undefined,
      title: String(item.goodsName ?? ""),
      desc: "",
      url: `/goodsDetail?skuId=${item.id ?? ""}&goodsId=${item.goodsId ?? ""}`,
      ___index: tabCurrentlyIndex.value,
    });
  });
}
// 选择链接回调
function selectedLink(val: { ___type?: string; url?: string; title?: string; name?: string; goodsName?: string; [key: string]: unknown }) {
  if (!draftOptions.value?.list?.length) return;
  const item = draftOptions.value.list[current.value];
  if (!item) return;
  item.url = formatLinkType(val);
  item.type = val.___type === "other" && val.url === "" ? "link" : "other";
}
function handleCancelModal() {
  draftOptions.value = null;
  showModal.value = false;
}
function handleConfirmModal() {
  if (draftOptions.value) {
    const saved = cloneOptions(draftOptions.value);
    data.value.options.title = saved.title;
    data.value.options.labels.splice(
      0,
      props.data.options.labels.length,
      ...saved.labels
    );
    data.value.options.list.splice(
      0,
      props.data.options.list.length,
      ...saved.list
    );
  }
  draftOptions.value = null;
  showModal.value = false;
}
</script>

<style scoped lang="scss">
@import "./setup-box.scss";
.goods-type-wrapper {
  position: relative;
}
.del-btn{
  margin-left:10px;
}
.tab-bar {
  margin-bottom: 20px;
}
.draggable {
  padding: 10px;
  border-bottom: 1px solid #ededed;
  transition: 0.35s;

  &:hover {
    background-color: #ededed;
  }
}
.column-config {
  margin-left: 10px;
  > * {
    margin: 4px;
  }
}
.column-img {
  width: 100px;
  height: 100px;
}
.add-goods {
  margin-left: 20px;
  margin-bottom: 10px;
}
.goods-list {
  position: relative;
  flex-wrap: wrap;
  justify-content: space-between;
  &:hover {
    > .setup-box {
      display: block;
    }
  }
}
.column-goods-config {
  flex: 2;
  align-items: center;
  justify-content: space-between;
}
.goods-list-item {
  margin-bottom: 14.3px;
  width: 287px;
  height: 343.7px;
  border-radius: 9.8px;
  opacity: 1;
  cursor: pointer;
  background: #ffffff;
  transition: 0.35s;
  box-shadow: 0px 1px 13px 0px #e5e5e5;
  &:hover {
    box-shadow: 0px 1px 14px 0px #c5c5c5;
  }
}
.goods-img {
  text-align: center;
  > img {
    width: auto;
    max-height: 183px;
  }
}
.goods-name {
  font-size: 18px;
  font-weight: normal;
  line-height: 22px;
  text-align: center;
  letter-spacing: 0px;
  width: 200px;
  margin: 0 auto 12.4px auto;
  color: #333333;
  -webkit-text-stroke: #979797 0.7px; /* 浏览器可能不支持 */
}
.goods-desc {
  font-size: 14px;
  font-weight: normal;
  line-height: 17px;
  text-align: center;
  letter-spacing: 0px;
  margin-bottom: 12.4px;
  color: #666666;

  -webkit-text-stroke: #979797 0.7px; /* 浏览器可能不支持 */
}
.goods-price {
  font-size: 25.2px;
  font-weight: normal;
  line-height: 30px;
  text-align: center;
  letter-spacing: 0px;

  color: #f31947;
  -webkit-text-stroke: #979797 0.7px; /* 浏览器可能不支持 */
}
.goods-type-line {
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.goods-type-title {
  font-size: 31px;
  font-weight: normal;
  line-height: 37px;
  letter-spacing: 0px;

  color: #333333;
}
.active {
  color: #f31947;
}
.goods-type-labels {
  font-size: 21px;
  font-weight: normal;
  line-height: 25px;
  letter-spacing: 0px;
}
.goods-type-item {
  margin-left: 28px;
}
</style>

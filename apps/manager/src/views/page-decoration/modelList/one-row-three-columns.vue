<template>
  <div class="line flex flex-j-sb">
    <div class="column" v-for="(item,index) in data.options.list" :key="index">
      <div v-if="!item.img" class="placeholder">占位符</div>
      <img alt="楼层图片" v-else :src="item.img" class="three-column-img">
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
    <el-dialog
      v-model="showModal"
      title="装修"
      
      width="800"
      
      :close-on-click-modal="false"
     append-to-body destroy-on-close>
      <div class="modal-tab-bar">
        <div v-for="(item,index) in draftList" :key="index">
          <img alt="楼层图片" :src="item.img" class="three-column-img">
          <div>推荐尺寸：{{item.size}}</div>
          <el-button
            size="small"
            class="ml_10"
            type="primary"
            @click="handleSelectImg(index)"
          >选择图片</el-button
          >
          <el-button
            size="small"
            class="ml_10"
            type="primary"
            @click="handleSelectLink(index)"
          >选择链接</el-button
          >
        </div>

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
    <!-- 选择图片 -->
    <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <ossManage
        @callback="callbackSelected"
        :is-component="true"
        :initialize="picModelFlag"
        :max-select="1"
        ref="ossManageRef"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { formatLinkType } from "@/utils/filters";

defineOptions({ name: "oneRowThreeColumns" });

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

/**
 * 楼层数据代理：画布是 v-for 渲染的，父级无法对别名做 v-model，
 * 这里取同一对象引用再编辑（数据仍写回页面模型，组件内不再给 prop 直接赋值）。
 */
const data = computed(() => props.data as Record<string, any>);

const showModal = ref(false);
/** 草稿商品（模板会写 img/title） */
type DraftGoods = {
  id?: string | number;
  img?: string;
  title?: string;
  name?: string;
  price?: unknown;
  url?: string;
  type?: string;
  [key: string]: unknown;
};

const draftList = ref<DraftGoods[]>([]);
const picModelFlag = ref(false);
const current = ref(0);

const liliDialogRef = ref<{
  goodsData?: Array<Record<string, unknown>>;
  goodsFlag?: boolean;
  flag?: boolean;
  open?: (mode?: string) => void;
  clearGoodsSelected?: () => void;
} | null>(null);
const ossManageRef = ref<{ selectImage?: boolean } | null>(null);

function cloneList(list: unknown) {
  return JSON.parse(JSON.stringify(list || []));
}
// 回显图片
function callbackSelected(val: { url?: string }) {
  picModelFlag.value = false;
  if (!val?.url) return;
  draftList.value[current.value].img = val.url;
}
// 编辑模块
function handleSelectModel() {
  draftList.value = cloneList(props.data.options.list);
  showModal.value = true;
}
// 选择商品回调
function selectedGoodsData(val: Array<Record<string, unknown>>) {
  const goods = val[0];
  if (!goods) return;
  const item = draftList.value[current.value];
  item.img = String(goods.thumbnail ?? "");
  item.price = goods.price;
  item.name = String(goods.goodsName ?? "");
  item.url = `/goodsDetail?skuId=${goods.id}&goodsId=${goods.goodsId}`;
}
// 选择链接回调
function selectedLink(val: { url?: string; title?: string; ___type?: string }) {
  const item = draftList.value[current.value];
  item.url = formatLinkType(val);
  item.type =
    val.___type === "other" && val.url === "" ? "link" : "other";
}
function handleSelectLink(index: number) {
  // 调起选择链接弹窗
  liliDialogRef.value?.open?.("link");
  current.value = index;
}
function handleSelectImg(index: number) {
  // 选择图片
  current.value = index;
  picModelFlag.value = true;
  nextTick(() => {
    if (ossManageRef.value) {
      ossManageRef.value.selectImage = true;
    }
  });
}
function handleCancelModal() {
  draftList.value = [];
  showModal.value = false;
}
function handleConfirmModal() {
  const saved = cloneList(draftList.value);
  data.value.options.list.splice(0, data.value.options.list.length, ...saved);
  draftList.value = [];
  showModal.value = false;
}
</script>

<style scoped lang="scss">
@import "./setup-box.scss";
.three-column-img{
  width:385px;
  height: 165px
}
.line:hover{
  >.setup-box{
    display: block;
  }
}
.placeholder{
  background: #666;
  width: 100%;
  height: 100%;
}
.line{
  position: relative;
  justify-content: space-between;
}
.column{
  width: 385px;
  height: 165px;

  >img{
    width: 100%;
    height: 100%;
  }
}
</style>

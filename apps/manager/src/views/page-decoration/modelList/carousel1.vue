<template>
  <div class="model-carousel1" :style="{ background: bgColor }">
    <div class="nav-body clearfix">
      <!-- 侧边导航 -->
      <div class="nav-side">分类占位区</div>
      <div class="nav-content setup-content">
        <!-- 轮播图 -->
        <el-carousel autoplay @change="autoChange">
          <el-carousel-item v-for="(item, index) in data.options.list" :key="index">
            <div style="overflow: hidden">
              <img alt="轮播图" :src="item.img" width="1200" height="470" />
            </div>
          </el-carousel-item>
        </el-carousel>
        <div class="setup-box">
          <div>
            <el-button size="small" @click.stop="handleSelectModel">编辑</el-button>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      v-model="showModal"
      title="快捷导航"
      
      width="800"
      
      :close-on-click-modal="false"
     append-to-body destroy-on-close>
      <div class="modal-tab-bar">
        <el-button type="primary" size="small" @click="handleAdd">添加轮播</el-button>
        &nbsp;
        <span class="ml_10">图片尺寸:{{ data.size }}</span>
        <span style="color: red" class="fz_12 ml_10"
          >点击缩略图替换图片、点击颜色选择器选择背景色</span
        >
        <table cellspacing="0">
          <thead>
            <tr>
              <th width="250">所选图片</th>
              <th width="250">链接地址</th>
              <th width="250">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in data.options.list" :key="index">
              <td>
                <img
                  style="cursor: pointer"
                  :src="item.img"
                  @click="handleSelectImg(item)"
                  width="200"
                  height="100"
                  alt=""
                />
              </td>
              <td>
                <el-input
                  class="outsideUrl"
                  v-model="item.url"
                  :disabled="!!item.type && item.type !== 'link'"
                />
              </td>
              <td>
                <el-button type="info" size="small" @click="handleSelectLink(item)"
                  >选择链接</el-button
                >&nbsp;
                <el-color-picker size="small" v-model="item.bgColor" />
                &nbsp;
                <el-button
                  type="danger"
                  plain
                  size="small"
                  @click="handleDel(Number(index))"
                  >删除</el-button
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>
    <!-- 选择商品。链接 -->
    <liliDialog ref="liliDialogRef" @selectedLink="selectedLink"></liliDialog>
    <!-- 选择图片 -->
    <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <ossManage @callback="callbackSelected" :is-component="true" :initialize="picModelFlag" :max-select="1" ref="ossManageRef" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, getCurrentInstance } from "vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { formatLinkType } from "@/utils/filters";

defineOptions({
  name: "modelCarousel",
});

const props = defineProps<{
  /** 楼层数据（画布 v-for 传入，装修器按设计就地编辑） */
  data: Record<string, any>;
}>();

/**
 * 楼层数据代理。
 * 画布是 v-for 渲染的，父级无法对别名做 v-model，
 * 这里取同一对象引用再编辑：数据仍写回页面模型，组件内不再给 prop 直接赋值。
 */
const data = computed(() => props.data);

const { proxy } = getCurrentInstance()!;

const showModal = ref(false); // modal显隐
const selected = ref<Record<string, unknown> | null>(null); // 已选数据
const picModelFlag = ref(false); // 选择图片modal
const bgColor = ref("#fff"); // 轮播背景色

const liliDialogRef = ref<{
  goodsData?: Array<Record<string, unknown>>;
  goodsFlag?: boolean;
  flag?: boolean;
  open?: (mode?: string) => void;
  clearGoodsSelected?: () => void;
} | null>(null);
// ossManageRef：模板 ref 与组件 import 同名，改名避免互相覆盖
const ossManageRef = ref<{ selectImage?: boolean } | null>(null);

onMounted(() => {
  bgColor.value = props.data.options.list[0].bgColor;
});

function handleSelectModel() {
  // 编辑模块
  showModal.value = true;
}
// 自动切换时改变背景色
function autoChange(oVal: unknown, val: unknown) {
  bgColor.value = props.data.options.list[Number(val)]?.bgColor ?? "";
}
// 添加轮播图片和链接
function handleAdd() {
  data.value.options.list.push({ img: "", url: "", bgColor: "#fff" });
  proxy!.$forceUpdate();
}
// 打开选择链接modal
function handleSelectLink(item: Record<string, unknown>) {
  liliDialogRef.value?.open?.("link");
  selected.value = item;
}
function callbackSelected(item: { url?: string }) {
  // 选择图片回调
  picModelFlag.value = false;
  if (!item?.url) return;
  if (selected.value) selected.value.img = item.url;
}
// 删除图片
function handleDel(index: number) {
  data.value.options.list.splice(index, 1);
}
function selectedLink(val: { url?: string; title?: string; ___type?: string }) {
  // 选择链接回调
  if (!selected.value) return;
  selected.value.url = formatLinkType(val);
  selected.value.type =
    val.___type === "other" && val.url === "" ? "link" : "other";
}
// 打开选择图片modal
function handleSelectImg(item: Record<string, unknown>) {
  selected.value = item;
  picModelFlag.value = true;
  nextTick(() => {
    if (ossManageRef.value) {
      ossManageRef.value.selectImage = true;
    }
  });
}
</script>

<style scoped lang="scss">
@import "./setup-box.scss";
.model-carousel1 {
  width: 1500px;
  height: 470px;
  margin-left: -150px;
  background: #fff;
}

/*大的导航信息，包含导航，幻灯片等*/
.nav-body {
  width: 1200px;
  height: 470px;
  margin: 0px auto;
}
.nav-side {
  height: 100%;
  width: 200px;
  padding: 0px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  line-height: 470px;
  text-align: center;
  position: absolute;
  z-index: 1;
}

/*导航内容*/
.nav-content {
  width: 1200px;
  height: 470px;
  overflow: hidden;
  float: left;
  position: relative;
}
</style>

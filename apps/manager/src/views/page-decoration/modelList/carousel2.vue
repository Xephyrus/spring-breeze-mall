<template>
  <div class="model-carousel2">
    <div class="nav-body clearfix">
      <!-- 侧边导航 -->
      <div class="nav-side">分类占位区</div>
      <div class="nav-content setup-content">
        <!-- 轮播图 -->
        <el-carousel autoplay height="340px">
          <el-carousel-item v-for="(item, index) in data.options.list" :key="index">
            <div style="overflow: hidden">
              <img alt="轮播图" :src="item.img" width="590" height="470" />
            </div>
          </el-carousel-item>
        </el-carousel>
        <div class="setup-box">
          <div>
            <el-button size="small" @click.stop="handleSelectModel">编辑</el-button>
          </div>
        </div>
      </div>
      <div class="nav-content1 setup-content">
        <!-- 轮播图 -->
        <el-carousel autoplay :interval="5000">
          <el-carousel-item
            v-for="(item, index) in data.options.listRight"
            :key="index"
          >
            <div class="mb_10">
              <img alt="轮播图" :src="item[0].img" width="190" height="150" />
            </div>
            <div class="mb_10">
              <img alt="轮播图" :src="item[1].img" width="190" height="150" />
            </div>
            <div>
              <img alt="轮播图" :src="item[2].img" width="190" height="150" />
            </div>
          </el-carousel-item>
        </el-carousel>
        <div class="setup-box">
          <div>
            <el-button size="small" @click.stop="handleSelectModel">编辑</el-button>
          </div>
        </div>
      </div>
      <div class="nav-right">
        <div class="person-msg">
          <img :src="String(userInfo.face ?? '')" v-if="userInfo.face" alt="" />
          <el-avatar class="mb_10" v-else :size="80" />
          <div>
            Hi，{{ userInfo.nickName || "欢迎来到管理后台"  }}
          </div>
          <div v-if="userInfo.id">
            <el-button type="danger" round>会员中心</el-button>
          </div>
          <div v-else>
            <el-button type="danger" round>请登录</el-button>
          </div>
        </div>
        <div class="shop-msg">
          <div>
            <span>常见问题</span>
            <ul class="article-list">
              <li
                class="ellipsis"
                :title="article.title"
                v-for="(article, index) in articleList"
                :key="index"
              >
                {{ article.title }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <!-- 左侧轮播装修 -->
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
        <span style="color: red" class="fz_12 ml_10">点击缩略图替换图片</span>
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
    <!-- 右侧轮播装修 -->
    <el-dialog
      v-model="showModal"
      title="右侧装修"
      
      width="800"
      
      :close-on-click-modal="false"
     append-to-body destroy-on-close>
      <div class="modal-tab-bar">
        <el-button type="primary" size="small" @click="handleAddGroup"
          >添加组</el-button
        >
        &nbsp;
        <span class="ml_10">图片尺寸:{{ data.size }}</span>
        <span style="color: red" class="fz_12 ml_10">点击缩略图替换图片</span>
        <el-tabs
          type="card"
          closable
          @tab-remove="handleTabRemove"
          class="mt_10"
        >
          <el-tab-pane
            :label="'图片组' + (Number(gIndex) + 1)"
            v-for="(group, gIndex) in data.options.listRight"
            :key="gIndex"
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
                <tr v-for="(item, index) in group" :key="index">
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
                    <el-button
                      type="info"
                      size="small"
                      @click="handleSelectLink(item)"
                      >选择链接</el-button
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </el-tab-pane>
        </el-tabs>
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
import { computed, ref, reactive, nextTick, getCurrentInstance } from "vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { formatLinkType } from "@/utils/filters";

defineOptions({ name: "modelCarousel" });

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

const instance = getCurrentInstance();
const proxy = instance?.proxy ?? null;

const showModal = ref(false); // modal显隐
const selected = ref<{ img?: string; url?: unknown } | null>(null); // 已选数据
const picModelFlag = ref(false); // 选择图片modal
const userInfo = reactive<Record<string, unknown>>({});
const articleList = ref([
  { title: "促销计算规则" },
  { title: "商家申请开店" },
  { title: "商家账号注册" },
  { title: "促销计算规则" },
]);

const liliDialogRef = ref<{ open: (mode: string) => void } | null>(null);
// ossManageRef：模板 ref 与组件 import 同名，改名避免互相覆盖
const ossManageRef = ref<{ selectImage?: boolean } | null>(null);

function handleSelectModel() {
  // 编辑模块
  showModal.value = true;
}
// 添加轮播
function handleAdd() {
  data.value.options.list.push({ img: "", url: "" });
  proxy?.$forceUpdate();
}
// 添加图片组
function handleAddGroup() {
  data.value.options.listRight.push([
    { img: "", url: "" },
    { img: "", url: "" },
    { img: "", url: "" },
  ]);
}
// 删除图片组
function handleTabRemove(name: string | number) {
  // el-tabs 的 tab-remove 回调给的是 TabPaneName（label 或 name），这里按索引处理
  data.value.options.listRight.splice(Number(name), 1);
}
// 打开图片链接
function handleSelectLink(item: { img?: string; url?: unknown }) {
  liliDialogRef.value?.open("link");
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
function selectedLink(val: { ___type?: string; url?: string; [key: string]: unknown }) {
  // 选择链接回调
  if (!selected.value) return;
  selected.value.url = formatLinkType(val);
  (selected.value as { type?: string }).type =
    val.___type === "other" && val.url === "" ? "link" : "other";
}
// 打开选择图片modal
function handleSelectImg(item: { img?: string; url?: unknown }) {
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
.model-carousel2 {
  width: 1200px;
  height: 470px;
  overflow: hidden;
}

.nav-item li {
  float: left;
  font-size: 16px;
  font-weight: bold;
  margin-left: 30px;
}
.nav-item a {
  text-decoration: none;
  color: #555555;
}
.nav-item a:hover {
  color: $theme_color;
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
  float: left;
  background-color: #6e6568;
  line-height: 470px;
  text-align: center;
}

/*导航内容*/
.nav-content,
.nav-content1 {
  width: 590px;
  height: 470px;
  overflow: hidden;
  float: left;
  position: relative;
  margin-left: 10px;
}
.nav-content1 {
  width: 190px;
}
.nav-right {
  float: left;
  width: 190px;
  margin-left: 10px;
  .person-msg {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin: 20px auto;

    button {
      height: 25px !important;
      margin-top: 10px;
    }

    .el-btn-default {
      color: $theme_color;
      border-color: $theme_color;
    }

    img {
      margin-bottom: 10px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }
  }
  .shop-msg {
    width: 100%;
    display: flex;
    justify-content: center;

    div {
      width: 100%;
      margin: 10px 0;
      text-align: center;

      span {
        display: block;
        cursor: pointer;
        text-align: center;
        font-weight: bold;
        margin-left: 0;
      }
      span:nth-child(1) {
        color: $theme_color;
      }
      span:nth-child(2) {
        font-weight: normal;
      }
      span:nth-child(3):hover {
        color: $theme_color;
      }
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        cursor: pointer;
        margin: 5px 0;
        color: #999395;
        width: auto;
        font-size: 12px;
        text-align: center;
        &:hover {
          color: $theme_color;
        }
      }
    }
  }
}
</style>

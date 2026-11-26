<template>
  <div class="model-view">
    <div class="model-view-content">
      <div class="content">
        <div class="wap-title">首页</div>
        <div class="draggable">
          <!-- 弹窗广告 -->
          <div class="window-shadow">
            <img :src="advertising[0].img" alt="" />
          </div>
        </div>
      </div>
    </div>
    <div class="model-config">
      <div class="decorate">
        <div class="decorate-title">弹窗广告</div>

        <div class="decorate-list">
          <div
            class="decorate-item"
            v-for="(item, index) in advertising"
            :key="index"
          >
            <div class="decorate-item-title">
              <div>设置</div>
            </div>
            <div class="decorate-item-box">
              <!-- 选择照片 -->
              <div class="decorate-view">
                <div class="decorate-view-title">选择图片</div>
                <div>
                  <img class="show-image" :src="item.img" alt="" />
                  <input
                    type="file"
                    class="hidden-input"
                    @change="changeFile(item, index)"
                    ref="files"
                    :id="'files' + index"
                  />
                  <div class="tips">
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
                    >选择链接</el-button
                  >
                </div>
              </div>

              <!-- 选择连接 -->
              <div class="decorate-view">
                <div class="decorate-view-title">选择图片</div>
                <div>
                  <el-button
                    plain
                    type="primary"
                    size="small"
                    @click="clickLink(item)"
                    >选择链接</el-button
                  >
                </div>
              </div>

              <div class="decorate-view">
                <div class="decorate-view-title">当前页面状态</div>
                <div>
                  <el-tag :type="pageShowTagType">
                    {{ result.pageShow === "OPEN" ? "开启" : "关闭" }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
        <liliDialog
          ref="liliDialogRef"
          @selectedLink="selectedLink"
          :type="linkType"
        ></liliDialog>
      </div>
      <el-dialog v-model="picModelFlag" width="1200px" append-to-body destroy-on-close>
      <ossManage @callback="callbackSelected" :is-component="true" :initialize="picModelFlag" ref="ossManageRef" />
    </el-dialog>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import * as API_Other from "@/api/other";
import { useAppStore } from "@/stores/app";

const route = useRoute();
const appStore = useAppStore();

/** 页面详情（接口返回的原始对象） */
type PageDataResult = {
  id?: string | number;
  name?: string;
  pageData?: string;
  pageShow?: string;
  pageType?: string;
  pageClientType?: string;
  [key: string]: unknown;
};

const result = ref<Partial<PageDataResult>>({});

/** 页面开关状态对应的 tag 颜色 */
const pageShowTagType = computed<"success" | "danger">(() =>
  result.value.pageShow === "OPEN" ? "success" : "danger"
);
const picModelFlag = ref(false); //图片选择器
//全屏广告
const advertising = ref<Array<{ img?: string; size?: string; config?: unknown }>>([
  {
    img: "https://shopro-1253949872.file.myqcloud.com/uploads/20200704/9136ecddcddf6607184fab689207e7e3.png",
    size: "612*836",
  },
]);
const linkType = ref(""); // 选择类型
const selectedLinks = reactive<Record<string, unknown>>({});

const liliDialogRef = ref<{ open: (mode: string) => void } | null>(null);
// files：v-for 文件输入框 ref，脚本内未直接读取（changeFile 通过 document.getElementById 取值）
const files = ref<HTMLInputElement[]>([]);
// ossManageRef：模板 ref 与组件 import 同名，改名避免互相覆盖
const ossManageRef = ref<{ selectImage?: boolean; fileType?: string } | null>(null);

watch(
  advertising,
  (val) => {
    appStore.openStyleStore = val;
  },
  { deep: true }
);

onMounted(() => {
  openPage();
});

// 回调选择的链接
function selectedLink(val: { ___type?: string; url?: string; title?: string; [key: string]: unknown }) {
  selectedLinks.url = val;

  advertising.value[0].config = val;
}

function openPage() {
  const alertType = route.query.pagetype;
  const pageTypeMap: Record<string, string> = {
    INDEX: "INDEX",
    ALERT: "OPEN_SCREEN_PAGE",
    OPEN_SCREEN_ANIMATION: "OPEN_SCREEN_ANIMATION",
  };
  const alertKey = String(Array.isArray(alertType) ? alertType[0] : alertType ?? "INDEX");
  const pageType = pageTypeMap[alertKey] ?? "INDEX";

  API_Other.getOpenHomeData(pageType).then((res) => {
    appStore.openStoreId = String(res.result?.id ?? "");
    if (res.result?.pageData) {
      advertising.value = [JSON.parse(String(res.result?.pageData))];
    }
    result.value = (res.result ?? {}) as unknown as typeof result.value;
  });
}

// 图片选择器回显
function callbackSelected(val: { url?: string }) {
  picModelFlag.value = false;
  if (!val?.url) return;
  advertising.value[0].img = val.url;
}

// 点击选择图片
function handleClickFile(_item?: unknown, _index?: number) {
  picModelFlag.value = true;
  nextTick(() => {
    if (ossManageRef.value) {
      ossManageRef.value.selectImage = true;
    }
  });
}

// 点击链接
function clickLink(_item: unknown) {
  liliDialogRef.value?.open("link");
}

//点击图片解析成base64
function changeFile(item: { img?: string }, index: number) {
  const input = document.getElementById("files" + index) as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return false;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  nextTick(() => {
    reader.onload = (e) => {
      // FileReader 结果是 string（dataURL）
      item.img = String(e.target?.result ?? "");
    };
  });
}
</script>
<style scoped lang="scss">
@import "./style.scss";
@import "./decorate.scss";
.decorate-radio {
  margin: 10px 0;
}
.window-shadow,
.full-shadow {
  display: flex;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  left: 0;
  align-items: center;
  justify-content: center;
}
.window-shadow {
  > img {
    width: 306px;
    height: 418px;
  }
}
.full-shadow {
  > img {
    width: 100%;
    height: 100%;
  }
}
.draggable {
  position: relative;
}

.btn-item {
  > img {
    margin: 4px 0;
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
}
</style>

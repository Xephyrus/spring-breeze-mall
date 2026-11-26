<template>
  <el-dialog
    v-if="goodsFlag"
    v-model="flag"
    title="选择商品"
    width="85%"
    top="5vh"
    :z-index="10000"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    class="goods-selector-dialog"
    @close="clickClose"
  >
    <goodsDialog
      v-if="flag"
      ref="goodsDialogRef"
      :selectedWay="goodsData"
      :goods-loader="goodsLoader"
      :query-params="queryParams"
      @selected="
        (val) => {
          goodsData = val;
        }
      "
    />
    <template #footer>
      <div class="goods-dialog-footer">
        <span class="selected-count-tip">
          已选择 <strong class="text-primary">{{ goodsData.length }}</strong> 件商品
        </span>
        <div class="footer-actions">
          <el-button @click="clickClose">取消</el-button>
          <el-button type="primary" @click="clickOK">确定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    v-else
    v-model="flag"
    width="1160px"
    top="80px"
    :z-index="10000"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    class="link-selector-dialog"
    @close="clickClose"
  >
    <linkDialog
      v-if="flag"
      ref="linkDialogRef"
      class="linkDialog"
      @selectedLink="
        (val) => {
          linkData = val;
        }
      "
    />
    <template #footer>
      <el-button @click="clickClose">取消</el-button>
      <el-button type="primary" @click="clickOK">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import goodsDialog from "./goods-dialog.vue";
import linkDialog from "./link-dialog.vue";

const emit = defineEmits(["closeFlag", "selectedGoodsData", "selectedLink"]);
defineProps({ goodsLoader: { type: Function, default: null }, queryParams: { type: Object, default: () => ({}) } });

/** 选中的商品项（结构由 goods-dialog 决定，这里只透传） */
type GoodsPayload = Record<string, unknown>;

const goodsFlag = ref(false); // 是否商品选择器
const goodsData = ref<GoodsPayload[]>([]); // 选择的商品
const linkData = ref(""); // 选择的链接
/** 链接面板实例：点确定时兜底取选中项 */
const linkDialogRef = ref<{ getSelected?: () => unknown } | null>(null);
const flag = ref(false); // modal显隐

// 模板 ref：原 ref="goodsDialog" 与 import 的组件同名，改名避免互相覆盖
/** 商品弹窗实例：只需要能切换单选/多选 */
const goodsDialogRef = ref<{ type?: string } | null>(null);

/**
 * 统一入口：按模式打开选择器。
 * 调用方只需 linkDialogRef.value?.open("link" | "goods")，
 * 不再逐个去改 flag / goodsFlag 这些内部状态。
 */
function openPicker(mode: "link" | "goods" = "link") {
  clearGoodsSelected();
  goodsFlag.value = mode === "goods";
  flag.value = true;
}

function clearGoodsSelected() {
  goodsData.value = [];
}
// 关闭弹窗
function clickClose() {
  flag.value = false;
  goodsFlag.value = false;
  emit("closeFlag", false);
}
// 单选商品
function singleGoods() {
  var timer = setInterval(() => {
    if (goodsDialogRef.value) {
      goodsDialogRef.value.type = "single";
      clearInterval(timer);
    }
  }, 100);
}
// 点击确认
function clickOK() {
  if (goodsFlag.value) {
    emit("selectedGoodsData", goodsData.value);
  } else {
    // 兜底：@selectedLink 的赋值链若没走到，直接向链接面板要当前选中项
    const payload =
      linkData.value ||
      (typeof linkDialogRef.value?.getSelected === "function"
        ? linkDialogRef.value.getSelected()
        : null);
    if (!payload) {
      ElMessage.warning("请选择链接");
      return;
    }
    emit("selectedLink", payload);
    linkData.value = "";
  }
  clickClose();
}
// 打开组件方法
function open(type: string, mutiple?: boolean) {
  flag.value = true;
  if (type == "goods") {
    goodsFlag.value = true;
    if (mutiple) {
      singleGoods();
    }
  } else {
    goodsFlag.value = false;
    // 清空上次弹窗草稿，避免取消后再次打开时误提交旧选择。
    linkData.value = "";
  }
}
// 关闭组件
function close() {
  flag.value = false;
}

// 外部通过 ref 访问的成员：
defineExpose({
  open,
  close,
  singleGoods,
  clearGoodsSelected,
  goodsData,
  goodsFlag,
  flag,
  /** 意图级入口：选择链接用 "link"，选择商品用 "goods" */
  openPicker,
});
</script>

<style scoped lang="scss">
:deep(.el-dialog__body) {
  width: 100%;
  height: 500px;
  overflow: hidden;
}

.goods-dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .selected-count-tip {
    font-size: 13px;
    color: #606266;

    .text-primary {
      color: #409eff;
      font-weight: 600;
      font-size: 15px;
      margin: 0 2px;
    }
  }

  .footer-actions {
    display: flex;
    gap: 10px;
  }
}
</style>

<style lang="scss">
/* 装修与推广共用链接选择器，窄窗口下保持弹窗及底部操作区完整可见。 */
.link-selector-dialog {
  max-width: calc(100vw - 40px);
}
/* 商品选择器弹窗全局尺寸与布局增强 */
.goods-selector-dialog {
  max-width: 1360px;
  min-width: 900px;
  border-radius: 8px;

  .el-dialog__header {
    padding: 16px 20px;
    margin-right: 0;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-dialog__body {
    width: 100% !important;
    height: calc(84vh - 120px) !important;
    min-height: 520px !important;
    max-height: 760px !important;
    padding: 16px 20px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
  }
}

// 抽屉 append-to-body 后不在当前组件 DOM 内，不能使用 scoped 样式
.link-selector-drawer {
  max-width: 96vw;
  .el-drawer__body {
    overflow: hidden;
  }
  .goods-select-table,
  .shops-select-table,
  .articles-select-table,
  .specials-select-table {
    height: calc(100vh - 240px) !important;
  }
}
// 商品分类下拉挂载到 body，需要高于抽屉的 10000 层级
.goods-dialog-cascader-popper,
.goods-dialog-pagination-popper {
  z-index: 10001 !important;
}
</style>

<template>
  <div>
    <div style="display: flex; gap: 10px; align-items: center; width: 100%">
      <el-input
        v-if="showInput"
        v-model="currentValue"
        :placeholder="placeholder"
        :size="size"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        style="flex: 1"
        @input="handleChange"
      >
        <template #append>
          <el-popover trigger="hover" placement="right" :width="320" title="图片预览">
            <template #reference>
              <el-button class="see-icon">
                <el-icon><View /></el-icon>
              </el-button>
            </template>
            <img
              v-if="currentValue"
              :src="currentValue"
              alt="该资源不存在"
              style="max-width: 280px; display: block; margin: 0 auto"
            />
            <el-button
              v-if="currentValue"
              type="primary"
              link
              style="margin-top: 8px; display: block; text-align: right"
              @click="viewImage = true"
            >
              查看大图
            </el-button>
          </el-popover>
        </template>
      </el-input>
      <el-button @click="handleCLickImg('storeLogo')">选择图片</el-button>
    </div>

    <el-dialog v-model="viewImage" title="图片预览" width="480px" append-to-body>
      <img
        :src="currentValue"
        alt="该资源不存在"
        style="max-width: 100%; margin: 0 auto; display: block"
      />
      <template #footer>
        <el-button @click="viewImage = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="picModalFlag"
      title="选择图片"
      width="1160px"
      top="16px"
      class="pc-image-picker-dialog"
      append-to-body
      destroy-on-close
      @closed="resetPicModal"
    >
      <ossManage
        ref="ossManageRef"
        :is-component="true"
        :initialize="picModalFlag"
        :max-select="1"
        @callback="handleOssCallback"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useAttrs, watch } from "vue";
import { View } from "@element-plus/icons-vue";
import { getStore } from "@/libs/storage";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";

defineOptions({ name: "uploadPicInput" });

/** el-input 只接受这几个字面量 */
type InputSize = "large" | "default" | "small";

/** 素材库回调项 */
type OssItem = { url?: string; [key: string]: unknown };

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    value?: string;
    size?: InputSize;
    placeholder?: string;
    showInput?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    maxlength?: number;
    /** 选择前的钩子，返回 false 表示不采用 */
    beforeSelect?: (item: OssItem) => boolean | void;
  }>(),
  {
    size: "default",
    placeholder: "图片链接",
    showInput: true,
    disabled: false,
    readonly: false,
  }
);
const emit = defineEmits(["update:modelValue", "input", "on-change"]);
const attrs = useAttrs();

const accessToken = ref<Record<string, string>>({});
const currentValue = ref(props.modelValue ?? props.value ?? "");
const viewImage = ref(false);
const picModalFlag = ref(false);
const selectedFormBtnName = ref("");
const picIndex = ref<string | number>("");

// 模板 ref：ossManage 与 import 组件同名，改名避免互相覆盖
/** 素材库组件：只需要打开选择态 */
const ossManageRef = ref<{ selectImage?: boolean } | null>(null);

function handleCLickImg(val: string, index?: string | number) {
  picModalFlag.value = true;
  selectedFormBtnName.value = val;
  picIndex.value = index ?? "";
  nextTick(() => {
    if (ossManageRef.value) {
      ossManageRef.value.selectImage = true;
    }
  });
}
function handleOssCallback(item: OssItem) {
  if (item?.url && props.beforeSelect && props.beforeSelect(item) === false) return;
  picModalFlag.value = false;
  if (!item?.url) return;
  currentValue.value = item.url ?? "";
  picIndex.value = "";
  emitValue(currentValue.value);
}
function resetPicModal() {
  selectedFormBtnName.value = "";
  picIndex.value = "";
}
function init() {
  accessToken.value = {
    accessToken: getStore("accessToken"),
  };
}
function emitValue(val?: string) {
  emit("update:modelValue", val);
  emit("input", val);
  emit("on-change", val);
}
function handleChange() {
  emitValue(currentValue.value);
  const rollback = (attrs as { rollback?: () => void }).rollback;
  rollback?.();
}
function setCurrentValue(value?: string) {
  if (value === currentValue.value) {
    return;
  }
  currentValue.value = value ?? "";
  emitValue(currentValue.value);
}

watch(
  () => props.modelValue,
  (val) => {
    setCurrentValue(val);
  }
);
watch(
  () => props.value,
  (val) => {
    setCurrentValue(val);
  }
);

// 原 created 钩子
init();
</script>

<style lang="scss" scoped>
.see-icon {
  padding: 8px;
}
</style>

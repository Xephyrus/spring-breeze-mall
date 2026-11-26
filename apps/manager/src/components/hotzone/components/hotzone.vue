<template>
  <div class="hotzone-box">
    <div class="hotzone-item">
      <div ref="content" class="hz-m-wrap">
        <img alt="热区背景图" class="hz-u-img" :src="image" />
        <ul class="hz-m-area" v-add-item>
          <zone
            class="hz-m-item"
            v-for="(zone, index) in zones"
            :key="index"
            :index="index"
            :setting="zone"
            :ref="(el) => setZoneRef(el, index)"
            @delItem="removeItem($event)"
            @changeInfo="changeInfo($event)"
          ></zone>
        </ul>
      </div>
    </div>
    <div>
      <div class="hotzone-add-box-body">
        <div
          v-for="(zone, index) in zones"
          :key="index"
          class="hotzone-box-item-main"
        >
          <div class="hotzone-box-item wes-2">
            <div>{{ index + 1 }}</div>
            <div @click="editZone(index)">
              <div class="hotzone-box-item-text">
                {{ showZoneText(zone) }}
              </div>
            </div>
            <div class="hotzone-box-item-actions">
              <div class="hotzone-btn" @click="editZone(index)">修改</div>
              <div class="hotzone-btn" @click="delZone(index)">删除</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hotzone-add-box-footer" @click="addHotzone">
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          class=""
          data-icon="plus"
          width="1em"
          height="1em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"
          ></path>
          <path
            d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"
          ></path>
        </svg>
        <div class="hotzone-add-box-text">添加热区</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from "vue";
import Zone from "./zone.vue";
import vAddItem from "../directives/add-item";
import type { HotzoneSetting } from "../types";

/** Zone 组件实例（只声明父组件真正调用的两个方法） */
type ZoneInstance = {
  showModalFn: (index: number) => void;
  delItem: (index: number) => void;
};

defineOptions({ name: "HotZone" });

const props = defineProps<{
  image: string;
  zonesInit?: HotzoneSetting[];
  max?: number;
}>();
const emit = defineEmits([
  "choose",
  "erase",
  "overRange",
  "remove",
  "add",
  "change",
]);

const zones = ref<HotzoneSetting[]>([]);
const zoneRefs = ref<ZoneInstance[]>([]);
const instance = getCurrentInstance();

onMounted(() => {
  zones.value = (props.zonesInit ?? []).concat();
});

// v-for 内的动态 ref：按 index 收集 Zone 组件实例
function setZoneRef(el: unknown, index: number) {
  // v-for 的动态 ref 回调会同时收到 DOM 元素与组件实例，这里只保留组件实例
  if (el) zoneRefs.value[index] = el as ZoneInstance;
}

async function addHotzone() {
  const perInfo: HotzoneSetting = {
    topPer: 0.15,
    leftPer: 0.3,
    widthPer: 0.2,
    heightPer: 0.2,
    img: "",
    link: "",
    type: "",
    title: "",
  };
  let images = await getImageSize(props.image);
  if (images) {
    if (images.height >= 1000) {
      perInfo.heightPer = convertNumberToDecimal(images.height!) / (images.height! / 1000);
    } else {
      perInfo.heightPer = convertNumberToDecimal(images.height!);
    }
    perInfo.widthPer = convertNumberToDecimal(images.width!) / 2;
  }
  addItem(perInfo);
}

function convertNumberToDecimal(num: number): number {
  if (num >= 10000) {
    return num / 100000;
  } else if (num >= 1000) {
    return num / 10000;
  } else if (num >= 100) {
    return num / 1000;
  } else if (num >= 10) {
    return num / 100;
  }
  return num;
}

function getImageSize(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise(function (resolve) {
    let image = new Image();
    image.onload = function () {
      resolve({
        width: image.width,
        height: image.height,
      });
    };
    image.onerror = function () {
      resolve(null);
    };
    image.src = url;
  });
}

function editZone(index: number) {
  zoneRefs.value[index].showModalFn(index);
}

function delZone(index: number) {
  zoneRefs.value[index].delItem(index);
}

function showZoneText(zone: HotzoneSetting) {
  switch (zone.type) {
    case "goods":
      return `商品：${zone.goodsName}`;
    case "category":
      return `分类：${zone.name}`;
    case "shops":
      return `店铺：${zone.storeName}`;
    case "pages":
      return `文章：${zone.title}`;
    case "marketing":
      return `促销活动商品：${zone.goodsName}`;
    case "other":
      return `${zone.title}`;
    case "special":
      return `专题：${zone.title}`;
    default:
      return "请选择跳转链接";
  }
}

function changeInfo(payload: {
  info?: Partial<HotzoneSetting>;
  index: number;
  zoneInfo?: HotzoneSetting;
}) {
  const { index, zoneInfo } = payload;
  const info: Partial<HotzoneSetting> = { ...zoneInfo, ...payload.info };
  // 改变热区并发送change通知
  Object.assign(zones.value[index], info);
  hasChange("changeInfo");
  instance!.proxy!.$forceUpdate();
}

function addItem(setting: HotzoneSetting) {
  zones.value.push(setting);
  emit("choose");
  // this.hasChange()  不应该发送通知，mouseup判定成功才应该发
  // this.$emit('add', setting)
}

function eraseItem(index: number = zones.value.length - 1) {
  zones.value.splice(index, 1);
  emit("erase", index);
}

function isOverRange() {
  return props.max && zones.value.length > props.max;
}

function overRange() {
  const index = zones.value.length - 1;

  zones.value.splice(index, 1);
  emit("overRange", index);
}

function removeItem(index: number = zones.value.length - 1) {
  zones.value.splice(index, 1);
  hasChange("removeItem");
  emit("remove", index);
}

function changeItem(info: HotzoneSetting, isAdd?: boolean) {
  const index = zones.value.length - 1;
  // 改变热区并发送change通知
  Object.assign(zones.value[index], info);
  hasChange("changeItem");
  isAdd && emit("add", zones.value[index]);
}

function hasChange(_from: string) {
  emit("change", zones.value);
}

// v-add-item 指令通过 binding.instance 调用以下方法/读取 zones；
// Zone 的 v-drag-item / v-change-size 指令通过 ctx.$parent.zones 读取 zones
defineExpose({
  zones,
  addItem,
  eraseItem,
  isOverRange,
  overRange,
  changeItem,
});
</script>

<style scoped lang="scss">
@import "../assets/styles/main.css";
.hotzone-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 468px;
  > div {
    margin: 6px;
    padding: 12px;
    border-radius: 10px;
    height: 100%;
  }
  > div:nth-of-type(1) {
    // display: flex;
    width: 50%;
    overflow: auto;
    // justify-content: center;
    background: #ededed;
  }
  > div:nth-of-type(2) {
    width: 50%;
    min-width: 0;
    background: #f7f7f7;
    overflow: hidden;
  }
}

.hotzone-add-box-body {
  height: 90%;
  overflow-y: auto;
  overflow-x: hidden;
}

.hotzone-box-item-main {
  margin-top: 10px;
  margin-bottom: 20px;
}

.hotzone-box-item {
  align-items: center;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #ededed;
  font-size: 12px;
  padding: 5px 10px 0;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;

  > div:nth-child(2) {
    flex: 1;
    min-width: 0;
  }
}

.hotzone-add-box-footer {
  align-items: center;
  background: #fff;
  border: none;
  border-radius: 5px;
  color: #ff5c58;
  display: flex;
  height: 40px;
  justify-content: center;
  margin-top: 10px;
  cursor: pointer;
}

.hotzone-btn {
  cursor: pointer;
}

.hotzone-box-item-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.hotzone-box-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.hotzone-add-box-text {
  font-size: 12px;
  line-height: 20px;
  margin: 0 0 0 4px;
}
</style>

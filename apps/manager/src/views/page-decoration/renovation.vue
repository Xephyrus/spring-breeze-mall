<template>
  <div class="renovation">
    <div class="model-list">
      <div class="classification-title">基础模块</div>
      <draggable
        tag="ul"
        :list="modelData"
        :item-key="getModelKey"
        :clone="cloneModel"
        v-bind="{ group: { name: 'model', pull: 'clone', put: false }, sort: false, handle: '.model-item' }"
        ghost-class="ghost"
      >
        <template #item="{ element: model }">
          <li class="model-item">
            <el-icon><Picture /></el-icon>
            <span>{{ model.name }}</span>
          </li>
        </template>
      </draggable>
    </div>
    <div class="show-content">
      <model-form ref="modelFormRef" :data="modelForm"></model-form>
    </div>
    <div class="btn-bar" :class="{'top':isHiddenBar}">
      <el-button type="primary" :loading="submitLoading" @click="saveTemplate">保存模板</el-button>
      <el-button class="ml_10" @click="resetTemplate">还原模板</el-button>
      <el-button class="ml_10" @click="witeLocalStore">将装修内容写入到本地</el-button>
      <el-button class="ml_10" v-if="hasCache" @click="clearCache">清空本地装修缓存</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Picture } from "@element-plus/icons-vue";
import { modelData } from "./model-config";
import Draggable from "vuedraggable";
import * as API_floor from "@/api/other";
import { ElMessage } from "element-plus";
import { Modal } from "@/utils/message";
import { getStore, setStore } from "@/libs/storage";

const route = useRoute();

const hasCache = ref(false);
// modelData 为 import 常量，模板中直接使用
/** 装修数据里的组件项（结构由模板/配置面板决定） */
type ModelItem = Record<string, unknown>;

const modelForm = ref<{ list: ModelItem[] }>({ list: [] });
const submitLoading = ref(false);
const isHiddenBar = ref(true);

// modelFormRef：模板 ref 与 data 的 modelForm 同名会互相覆盖，改名避免冲突
const modelFormRef = ref<any>(null);

onMounted(() => {
  const settingRaw = window.localStorage.getItem('admin-setting');
const setting: Record<string, unknown> = settingRaw ? JSON.parse(settingRaw) : {};
  isHiddenBar.value = Boolean(setting.isUseTabsRouter)
   const cache = getStore('managerPCPageCache')
  hasCache.value = !!cache;
    if(cache){
      Modal.confirm({
      title: '提示',
      content: '获取到本地有缓存数据，是否使用缓存数据？',
      okText: '使用',
      cancelText: '取消',
      onOk: () => {
        applyPageData(cache);
      }
    });
  }
  getTemplateItem(queryId());
});

function getModelKey(model: ModelItem) {
  return model.type || model.name;
}
function cloneModel(model: ModelItem) {
  const key = Date.now() + "_" + Math.ceil(Math.random() * 99999);
  const cloned = JSON.parse(JSON.stringify(model));
  return {
    ...cloned,
    key,
    model: cloned.type + "_" + key,
  };
}
function clearCache(){
  setStore('managerPCPageCache', '')
  ElMessage.success('清除成功')
}
function witeLocalStore(){
  const data ={...modelForm.value}
  if (modelFormRef.value?.navList) data.list.unshift(modelFormRef.value.navList);
  if (modelFormRef.value?.topAdvert) data.list.unshift(modelFormRef.value.topAdvert);
  setStore('managerPCPageCache', data)
  ElMessage.success('写入成功')
}
function saveTemplate() {
  submitTemplate(route.query.pageShow ? 'OPEN' : 'CLOSE')
}
function submitTemplate(pageShow: "OPEN" | "CLOSE") {
  submitLoading.value = true
  const form = JSON.parse(JSON.stringify(modelForm.value))
  form.list.unshift(modelFormRef.value.navList);
  form.list.unshift(modelFormRef.value.topAdvert);
  const data = {
    id: route.query.id,
    pageData: JSON.stringify(form),
    pageShow: route.query.pageType === 'SPECIAL' ? 'CLOSE' : pageShow,
    pageClientType: 'PC',
  };
  const pageId = String(Array.isArray(route.query.id) ? route.query.id[0] : route.query.id ?? "");
  API_floor.updateHome(pageId, data).then((res) => {
    submitLoading.value = false
    if (res.success) {
      ElMessage.success("保存模板成功");
    }
  });
}
function resetTemplate() {
  getTemplateItem(queryId());
}
function applyPageData(raw: unknown) {
  const empty: { list: ModelItem[] } = { list: [] };
  // 缓存里可能是 JSON 字符串，也可能是对象；页面数据同理
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      modelForm.value = empty;
      return;
    }
  }
  if (!parsed || typeof parsed !== "object") {
    modelForm.value = empty;
    return;
  }
  const obj = parsed as { list?: ModelItem[] } & Record<string, unknown>;
  const list: ModelItem[] = Array.isArray(parsed)
    ? (parsed as ModelItem[])
    : Array.isArray(obj.list)
      ? obj.list
      : [];
  const form = Array.isArray(parsed) ? { list } : { ...obj, list };
  if (list[0]?.type === "topAdvert") {
    modelFormRef.value.topAdvert = list[0];
    if (list[1]) {
      modelFormRef.value.navList = list[1];
    }
    modelForm.value = { ...form, list: list.slice(2) };
    return;
  }
  modelForm.value = { ...form, list };
}
/** 路由里的页面 id（同名参数可能出现多次，取第一个） */
function queryId(): string {
  const raw = route.query.id;
  return String(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "");
}
function getTemplateItem(id: string | number) {
  API_floor.getHomeData(id).then((res) => {
    if (res.success) {
      applyPageData(res.result?.pageData);
    }
  });
}

watch(
  modelForm,
  function (_val: unknown) {},
  { deep: true }
);
</script>
<style lang="scss" scoped>
.renovation {
  position: relative;
  display: flex;
}
.model-list {
  width: 130px;
  height: 620px;
  overflow-y: auto;
  padding: 10px;
  background: #fff;
  margin-top: 80px;
  position: fixed;
  z-index: 100;
  box-shadow: 1px 1px 10px #999;
  .classification-title {
    width: 100%;
    height: 30px;
    line-height: 30px;
    text-align: center;
  }
  :deep(ul) {
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .model-item {
    width: 110px;
    height: 30px;
    background: #eee;
    margin-top: 10px;
    line-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: #999;
    transition:0.15s;
    border-radius: 4px;
    &:hover {
      background: $theme_color;
      cursor: move;
      color: #fff;
    }
  }
  .ghost::after {
    border: none;
    height: 0;
    content: "";
  }
}
.show-content {
  margin-left: 150px;
  margin-top: 60px;
}
.ghost {
  background: #fff;
  height: 30px;
  position: relative;
  &::after {
    content: "松开鼠标添加模块";
    position: absolute;
    background: #fff;
    border: 1px dashed #409eff;
    color: #409eff;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    text-align: center;
    line-height: 50px;
  }
}
.btn-bar {
  position: fixed;
  width: 100%;
  background: #fff;
  height: 50px;
  padding: 10px;
  box-shadow: 1px 1px 10px #999;
  z-index: 99;
}
.top{
  top: 100px;
}
</style>

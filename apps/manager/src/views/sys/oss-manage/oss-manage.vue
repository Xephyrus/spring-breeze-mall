<style lang="scss">
@import "./ossManage.scss";

.modal-footer {
  text-align: center;
  > * {
    margin: 0 10px;
  }
}
</style>

<template>
  <div class="search" :class="{ 'is-component-search': isComponent }">
    <!-- 独立页面模式：统一现代顶部控制栏 -->
    <el-card v-if="!isComponent" class="oss-header-card" shadow="never">
      <div class="header-content">
        <div class="header-left">
          <!-- 角色切换 -->
          <el-radio-group
            :model-value="activeRoleTab"
            size="default"
            @update:model-value="(v: string | number | boolean | undefined) => handleRoleTabChange(String(v ?? ''))"
          >
            <el-radio-button value="MANAGER">管理员</el-radio-button>
            <el-radio-button value="STORE">商家</el-radio-button>
            <el-radio-button value="MEMBER">用户</el-radio-button>
            <el-radio-button value="CUSTOMER">客服</el-radio-button>
          </el-radio-group>

          <div class="divider"></div>

          <!-- 媒体分类切换 -->
          <el-radio-group
            :model-value="activeCategoryTab"
            size="default"
            @update:model-value="(v: string | number | boolean | undefined) => handleCategoryTabChange(String(v ?? ''))"
          >
            <el-radio-button v-if="allowImage" value="IMAGE">图片</el-radio-button>
            <el-radio-button v-if="allowVideo" value="VIDEO">视频</el-radio-button>
            <el-radio-button v-if="!onlyImage" value="FILE">文件</el-radio-button>
          </el-radio-group>
        </div>

        <div class="header-right">
          <el-input
            v-model="searchForm.name"
            placeholder="搜索素材原名..."
            clearable
            :prefix-icon="Search"
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-button :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">刷新</el-button>
        </div>
      </div>
    </el-card>

    <!-- 主体卡片 -->
    <component
      :is="isComponent ? 'div' : 'el-card'"
      :class="isComponent ? 'is-component-card' : 'oss-main-card'"
      shadow="never"
    >
      <el-row class="oss-manage-box">
        <!-- 左侧目录树 -->
        <el-col v-if="canShowGroups" :span="isComponent ? 5 : 4" class="file-list">
          <div class="group-header">
            <span class="group-title">
              <el-icon><Folder /></el-icon>
              <span>资源分组</span>
            </span>
            <el-tooltip v-if="!isComponent" content="新建分组" placement="top">
              <el-button
                type="primary"
                link
                :icon="Plus"
                class="add-group-btn"
                @click="handleClickAddGroup"
              >
                新建
              </el-button>
            </el-tooltip>
          </div>

          <el-tree
            :key="treeRenderKey"
            :data="treeData"
            node-key="value"
            :props="{ label: 'title', children: 'children' }"
            :indent="0"
            highlight-current
            class="demo-tree-render oss-group-tree"
            @node-click="handleTreeNodeClick"
          >
            <template #default="{ data: nodeData }">
              <span v-if="nodeData" class="oss-tree-node">
                <span class="node-left">
                  <el-icon class="oss-tree-icon">
                    <Files v-if="nodeData.value === '0'" />
                    <FolderOpened v-else-if="selectedGroupData && selectedGroupData.value === nodeData.value" />
                    <Folder v-else />
                  </el-icon>
                  <span class="node-title">{{ nodeData.title }}</span>
                </span>
                <el-dropdown
                  v-if="nodeData.value !== '0' && !isComponent"
                  trigger="click"
                  @command="(cmd) => onTreeDropdownCommand(cmd, nodeData)"
                >
                  <el-icon class="oss-tree-more" @click.stop><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete" style="color: #f56c6c">删除分组</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </span>
            </template>
          </el-tree>
        </el-col>

        <!-- 右侧资源展示区 -->
        <el-col :span="canShowGroups ? (isComponent ? 19 : 20) : 24" class="pic-list">
          <!-- 操作工具条 -->
          <div class="oss-toolbar">
            <div class="toolbar-left">
              <el-checkbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                class="select-all-checkbox"
                @update:model-value="(v: string | number | boolean | undefined) => (isAllSelected = Boolean(v))"
              >
                全选本页
              </el-checkbox>

              <span v-if="selectCount > 0" class="selection-badge">
                已选 <b>{{ selectCount }}</b> 项
              </span>

              <el-button
                v-if="!isComponent"
                type="danger"
                plain
                size="small"
                :icon="Delete"
                :disabled="selectCount === 0"
                @click="removeAll"
              >
                批量删除
              </el-button>

              <el-button
                v-if="selectCount > 0"
                type="info"
                link
                size="small"
                @click="clearCurrentSelection"
              >
                取消已选
              </el-button>
            </div>

            <div class="toolbar-right">
              <el-upload
                v-if="canUploadImages"
                ref="upRef"
                :action="managerApiUrl + '/manager/common/upload/file'"
                :accept="uploadAccept"
                :data="uploadData"
                :headers="accessToken"
                :before-upload="beforeUpload"
                :on-error="handleError"
                :on-success="handleSuccess"
                :show-file-list="false"
                multiple
                style="display: inline-block"
              >
                <el-button type="primary" :icon="Upload">{{ uploadButtonText }}</el-button>
              </el-upload>
            </div>
          </div>

          <!-- 素材卡片网格 -->
          <div v-loading="loading">
            <el-checkbox-group
              v-if="data.length > 0"
              :model-value="selectedOss"
              @update:model-value="(v: Array<string | number | boolean>) => (selectedOss = v.map(String))"
              @change="selectOssChange"
            >
              <div class="img-box">
                <div v-for="(item, index) in data" :key="index" class="img-item">
                  <div
                    class="card"
                    :class="{
                      'custom-checkbox-card-checked': selectedOss.includes(item.id + ',' + item.url),
                      'oss-card-selectable': isComponent && selectImage,
                    }"
                    @click="handleCardClick(item, $event)"
                  >
                    <!-- 右上角多选框 -->
                    <el-checkbox
                      :value="item.id + ',' + item.url"
                      class="card-checkbox"
                      @click.stop
                    />

                    <!-- 媒体缩略展示 -->
                    <div class="card-preview-media">
                      <img
                        v-if="isImageFile(item)"
                        :src="normalizeMediaUrl(item.url)"
                        :alt="item.name"
                        loading="lazy"
                      />
                      <template v-else-if="isVideoFile(item)">
                        <video class="card-media" :src="normalizeMediaUrl(item.url)" muted />
                        <div class="video-play-overlay">
                          <el-icon :size="24"><VideoPlay /></el-icon>
                        </div>
                      </template>
                      <div v-else class="card-file-generic" :class="getFileBadgeClass(item)">
                        <el-icon :size="34"><Document /></el-icon>
                        <span class="file-badge">{{ getFileExt(item) }}</span>
                      </div>
                    </div>

                    <!-- 悬浮操作栏（非弹窗模式下展示高频快捷操作） -->
                    <div v-if="!isComponent" class="card-actions" @click.stop>
                      <el-tooltip content="预览" placement="top">
                        <span class="action-btn" @click="previewFile(item)">
                          <el-icon><View /></el-icon>
                        </span>
                      </el-tooltip>
                      <el-tooltip content="复制链接" placement="top">
                        <span class="action-btn" @click="copyFileUrl(item)">
                          <el-icon><CopyDocument /></el-icon>
                        </span>
                      </el-tooltip>
                      <el-tooltip content="下载" placement="top">
                        <span class="action-btn" @click="download(item)">
                          <el-icon><Download /></el-icon>
                        </span>
                      </el-tooltip>
                      <el-tooltip content="重命名" placement="top">
                        <span class="action-btn" @click="rename(item)">
                          <el-icon><Edit /></el-icon>
                        </span>
                      </el-tooltip>
                      <el-tooltip content="删除" placement="top">
                        <span class="action-btn btn-delete" @click="remove(item)">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </el-tooltip>
                    </div>
                  </div>

                  <!-- 文件名称与参数 -->
                  <el-tooltip :content="item.name" placement="bottom">
                    <div class="text" @click="!isComponent && previewFile(item)">{{ item.name }}</div>
                  </el-tooltip>
                  <div class="sub-info">{{ getFileSubInfo(item) }}</div>
                </div>
              </div>
            </el-checkbox-group>

            <!-- 空状态 -->
            <div v-else class="empty-box">
              <el-empty description="暂无相关素材文件" :image-size="120">
                <el-upload
                  v-if="canUploadImages"
                  :action="managerApiUrl + '/manager/common/upload/file'"
                  :accept="uploadAccept"
                  :data="uploadData"
                  :headers="accessToken"
                  :before-upload="beforeUpload"
                  :on-error="handleError"
                  :on-success="handleSuccess"
                  :show-file-list="false"
                  multiple
                >
                  <el-button type="primary" :icon="Upload">立即上传</el-button>
                </el-upload>
              </el-empty>
            </div>
          </div>

          <!-- 分页器 -->
          <div class="page-box">
            <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :small="false" @current-change="pageChange" @size-change="changePageSize" />
          </div>

          <!-- 选图弹窗模式下的底部按钮 -->
          <div v-if="isComponent && selectImage && !hideSelectFooter" class="oss-select-footer">
            <el-button @click="handleSelectCancel">取消</el-button>
            <el-button type="primary" @click="handleSelectConfirm">确定</el-button>
          </div>
        </el-col>
      </el-row>
    </component>

    <!-- 大图浏览查看器（支持翻页、缩放、旋转） -->
    <el-image-viewer
        v-if="imageViewerVisible"
        :url-list="previewImageList.map((i) => i.url ?? '')"
        :initial-index="previewImageIndex"
        teleported
        :z-index="20000"
        hide-on-click-modal
        :close-on-press-escape="true"
        @close="imageViewerVisible = false"
      />

    <!-- 重命名弹窗 -->
    <el-dialog
      v-model="modalVisible"
      :close-on-click-modal="false"
      :title="modalTitle"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" label-width="95px" :model="form" :rules="formValidate">
        <el-form-item label="原文件名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="存储文件名" prop="fileKey">
          <el-input v-model="form.fileKey" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button :loading="submitLoading" type="primary" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 普通文件预览弹窗（PDF等） -->
    <el-dialog v-model="fileVisible" :title="fileTitle" width="800px" destroy-on-close>
      <iframe
        v-if="isPdfFile(file)"
        :src="normalizeMediaUrl(file.url)"
        style="width: 100%; height: 70vh; border: none"
        title="文件预览"
      />
      <div v-else class="file-preview-fallback">
        <el-icon :size="64"><Document /></el-icon>
        <p class="file-preview-name">{{ file.name }}</p>
        <p class="file-preview-tip">该文件类型暂不支持在线直接预览</p>
        <el-button type="primary" :icon="Download" @click="download(file)">下载文件</el-button>
      </div>
      <template #footer>
        <span>文件类型：{{ file.fileType }} · 文件大小：{{ file.msize }} · 创建时间：{{ file.createTime }}</span>
      </template>
    </el-dialog>

    <!-- 视频播放弹窗 -->
    <el-dialog
      v-model="videoVisible"
      :title="videoTitle"
      width="800px"
      destroy-on-close
      @close="closeVideo"
      @opened="initDPlayer"
    >
      <div ref="dplayerRef"></div>
      <template #footer>
        <span>文件类型：{{ file.fileType }} · 文件大小：{{ file.msize }} · 创建时间：{{ file.createTime }}</span>
      </template>
    </el-dialog>

    <!-- 分组添加/修改弹窗 -->
    <el-dialog
      v-model="enableGroup"
      :title="insertOrUpdate === 'insert' ? '添加分组' : '修改分组'"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formValidateRef"
        label-width="80px"
        :model="groupFormValidate"
        :rules="groupRuleValidate"
      >
        <el-form-item label="分组名称" prop="directoryName">
          <el-input v-model="groupFormValidate.directoryName" placeholder="请输入分组名称" />
        </el-form-item>
      </el-form>
      <div class="modal-footer">
        <el-button @click="enableGroup = false">取消</el-button>
        <el-button type="primary" :loading="groupLoading" @click="submitAddGroup">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
let dp: import("dplayer").default | null = null;
</script>

<script setup lang="ts">
import { normalizeMediaUrl } from "@/utils/media-url";
import {
  computed,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Download,
  View,
  Document,
  Folder,
  FolderOpened,
  Files,
  Plus,
  MoreFilled,
  Search,
  Refresh,
  Upload,
  VideoPlay,
  CopyDocument,
  Edit,
} from "@element-plus/icons-vue";
import {
  addFileDirectory,
  deleteFile,
  delFileDirectory,
  getFileDirectory,
  getFileListData,
  renameFile,
  updateFileDirectory,
} from "@/api/index";
import DPlayer from "dplayer";
import { managerApiUrl } from "@/libs/axios";
import { getStore } from "@/libs/storage";

defineOptions({ name: "oss-manage" });

/** 素材（图片/视频/文件） */
type OssFile = {
  id?: string | number;
  name?: string;
  fileKey?: string;
  fileType?: string;
  fileCategory?: string;
  url?: string;
  fileDirectoryId?: string | number;
  createTime?: string;
  [key: string]: unknown;
};

/** 目录树节点 */
type OssTreeNode = {
  id?: string;
  name?: string;
  parentId?: string;
  level?: number;
  children?: OssTreeNode[];
  [key: string]: unknown;
};

/** 列表查询条件 */
type OssSearchForm = {
  name: string;
  fileKey: string;
  fileType: string;
  fileCategory: string;
  userEnums: string;
  pageNumber: number;
  pageSize: number;
  sort: string;
  order: string;
  /** 当前所在目录（切角色/分类时会被删除） */
  fileDirectoryId?: string | number;
};

const props = withDefaults(
  defineProps<{
    isComponent?: boolean;
    choose?: string;
    initialize?: boolean;
    /** 0 表示不限 */
    maxSelect?: number;
    hideSelectFooter?: boolean;
    mediaType?: string;
    onlyImage?: boolean;
  }>(),
  {
    isComponent: false,
    choose: "",
    initialize: false,
    maxSelect: 0,
    hideSelectFooter: false,
    mediaType: "",
    onlyImage: false,
  }
);

const emit = defineEmits<{
  callback: [payload: { url?: string; [key: string]: unknown }];
  selected: [payload: unknown];
}>();

const allowVideo = computed(() => {
  if (props.onlyImage || props.mediaType === "IMAGE") return false;
  if (props.isComponent && fileType.value === "pic") return false;
  return true;
});

const allowImage = computed(() => {
  if (props.mediaType === "VIDEO") return false;
  if (props.isComponent && fileType.value === "video") return false;
  return true;
});

const instance = getCurrentInstance();
const _proxy = instance?.proxy ?? null;

// 目录分组
const groupFormValidate = ref({
  id: "",
  level: 0,
  parentId: "0",
  directoryName: "",
});
const groupRuleValidate = {
  directoryName: [
    {
      required: true,
      message: "请输入分组名称",
      trigger: "blur",
    },
  ],
};
const enableGroup = ref(false);
const selectImage = ref(false);
/**
 * 上传请求头。
 *
 * 这里是 computed 而不是「初始化时赋值一次」：
 * 素材库既可能是独立页面，也可能是装修里的弹窗（组件模式），
 * 组件的 onMounted 不一定会走 init()，一旦那样 token 就是空的，
 * 上传会直接 403「未登录或token失效」。改成每次现取，任何入口都安全。
 */
const accessToken = computed<Record<string, string>>(() => ({
  accessToken: getStore("accessToken") || "",
}));
const loading = ref(false);
/** 上传文件类型：pic / video */
const fileType = ref<string>("pic");
const modalVisible = ref(false);
const videoVisible = ref(false);
const fileVisible = ref(false);
const videoTitle = ref("");
const fileTitle = ref("");
const pendingVideoUrl = ref("");
const modalTitle = ref("");
const activeRoleTab = ref<string>("MANAGER");
const activeCategoryTab = ref<string>("IMAGE");

const searchForm = reactive<OssSearchForm>({
  name: "",
  fileKey: "",
  fileType: "",
  fileCategory: "IMAGE",
  userEnums: "MANAGER",
  pageNumber: 1,
  pageSize: 20,
  sort: "createTime",
  order: "desc",
});

const oldKey = ref("");
const form = ref<{ id?: string | number; name: string; fileKey: string }>({
  name: "",
  fileKey: "",
});
const file = ref<Record<string, unknown>>({});
const formValidate = {
  name: [{ required: true, message: "不能为空", trigger: "blur" }],
  fileKey: [{ required: true, message: "不能为空", trigger: "blur" }],
};
const submitLoading = ref(false);
const selectList = ref<OssFile[]>([]);
const selectCount = ref(0);

const data = ref<OssFile[]>([]);
const total = ref(0);

const treeData = ref<OssTreeNode[]>([]);
const treeDataDefault = ref<OssTreeNode[]>([]);
const treeRenderKey = ref(0);
/** 当前选中的目录分组（点开右键菜单时写入） */
const selectedGroupData = ref<OssTreeNode | null>(null);
const insertOrUpdate = ref("insert");
const groupLoading = ref(false);

/** 已选素材的 key（id,url 拼成的字符串） */
const selectedOss = ref<string[]>([]);

// 大图全屏浏览
const imageViewerVisible = ref(false);
const previewImageList = ref<Array<{ url?: string; name?: string }>>([]);
const previewImageIndex = ref(0);

// DOM refs
const upRef = ref(null);
const formRef = ref<{ validate?: (cb: (valid: boolean) => void) => Promise<boolean> } | null>(null);
const formValidateRef = ref<{ validate?: (cb: (valid: boolean) => void) => Promise<boolean> } | null>(null);
const dplayerRef = ref(null);

// 全选与半选联动
const isAllSelected = computed<boolean>({
  get() {
    if (!data.value.length) return false;
    const currentKeys = data.value.map((item) => `${item.id},${item.url}`);
    return currentKeys.every((k) => selectedOss.value.includes(k));
  },
  set(val: boolean) {
    const currentKeys = data.value.map((item) => `${item.id},${item.url}`);
    if (val) {
      const merged = Array.from(new Set([...selectedOss.value, ...currentKeys]));
      selectedOss.value = merged;
      selectOssChange(merged);
    } else {
      const filtered = selectedOss.value.filter((k) => !currentKeys.includes(k));
      selectedOss.value = filtered;
      selectOssChange(filtered);
    }
  },
});

const isIndeterminate = computed(() => {
  if (!data.value.length) return false;
  const currentKeys = data.value.map((item) => `${item.id},${item.url}`);
  const selectedInPage = currentKeys.filter((k) => selectedOss.value.includes(k));
  return selectedInPage.length > 0 && selectedInPage.length < currentKeys.length;
});

function clearCurrentSelection() {
  selectedOss.value = [];
  selectOssChange([]);
}

watch(selectImage, (val) => {
  if (val) {
    if (props.isComponent) {
      activeRoleTab.value = "MANAGER";
      searchForm.userEnums = "MANAGER";
      init();
    } else if (!data.value.length) {
      init();
    }
  }
});

watch(
  () => props.choose,
  (val) => {
    if (val) selectImage.value = true;
  }
);

watch(selectedOss, (val) => {
  if (val && val.length && !(props.isComponent && selectImage.value)) {
    emit("callback", { url: val[val.length - 1].split(",")[1] });
  }
});

/**
 * 作为「选择器」被打开时的一次性初始化。
 *
 * 调用方只需要：`:initialize="visible"` + `:media-type="'IMAGE' | 'VIDEO'"`，
 * 不再需要拿到实例去改 fileType / 调 changeFileType，
 * 也就不必再写 `nextTick(() => $refs.xxx.fileType = ...)` 这类命令式代码。
 */
function activatePicker() {
  selectedOss.value = [];
  clearCurrentSelection();
  activeRoleTab.value = "MANAGER";
  searchForm.userEnums = "MANAGER";

  // 视频 / 图片由 mediaType 决定，替代外部直接改内部状态
  fileType.value = props.mediaType === "VIDEO" ? "video" : "pic";
  if (!allowVideo.value) {
    fileType.value = "pic";
  }
  changeFileType();

  delete searchForm.fileDirectoryId;
  selectedGroupData.value = null;
  init();
}

watch(
  () => props.initialize,
  (val) => {
    if (val && props.isComponent) {
      activatePicker();
    }
  }
);

const canShowGroups = computed(() => {
  return activeRoleTab.value === "MANAGER";
});

const canUploadImages = computed(() => {
  return activeRoleTab.value === "MANAGER" && activeCategoryTab.value !== "FILE";
});

const uploadAccept = computed(() => {
  if (activeCategoryTab.value === "VIDEO") return "video/*";
  return "image/*";
});

const uploadButtonText = computed(() => {
  const textMap: Record<string, string> = {
    IMAGE: "上传图片",
    VIDEO: "上传视频",
  };
  return textMap[activeCategoryTab.value] || "上传图片";
});

const uploadData = computed(() => {
  const directoryId = searchForm.fileDirectoryId;
  // 后端 /manager/common/upload/file 的 directoryPath 参数曾经是「必填」，
  // 从弹窗里直接上传（没有选中目录）时不带我就会 400，表现为「本地上传报错」。
  // 现在后端已改为可选，这里也统一带上兜底值，两边都不再依赖调用场景。
  const data: Record<string, string> = {
    userEnums: activeRoleTab.value,
    directoryType: activeRoleTab.value,
    directoryPath:
      directoryId && directoryId !== "0" ? String(directoryId) : "default",
  };
  return data;
});

function beforeUpload(file?: { type?: string; name?: string; size?: number }) {
  if (!canUploadImages.value) {
    ElMessage.warning("当前模块不支持上传");
    return false;
  }
  if (activeCategoryTab.value === "IMAGE") {
    const isImg =
      (file?.type && file.type.startsWith("image/")) ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file?.name || "");
    if (!isImg) {
      ElMessage.warning("请上传图片格式文件");
      return false;
    }
  } else if (activeCategoryTab.value === "VIDEO") {
    const isVid =
      (file?.type && file.type.startsWith("video/")) ||
      /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(file?.name || "");
    if (!isVid) {
      ElMessage.warning("请上传视频格式文件");
      return false;
    }
  }
  const maxSize = 20480 * 1024;
  if (file && (file.size ?? 0) > maxSize) {
    handleMaxSize();
    return false;
  }
  return true;
}

function handleTreeNodeClick(data?: OssTreeNode) {
  if (data) {
    handleCateChange([data]);
  }
}

function onTreeDropdownCommand(cmd: string, data: OssTreeNode) {
  selectedGroupData.value = data;
  if (cmd === "edit") {
    handleContextMenuEdit(null, null, data);
  } else if (cmd === "delete") {
    handleContextMenuDelete();
  }
}

function handleRoleTabChange(name: string) {
  activeRoleTab.value = name;
  searchForm.pageNumber = 1;
  searchForm.userEnums = name;
  delete searchForm.fileDirectoryId;
  selectedGroupData.value = null;
  groupFormValidate.value.id = "";
  groupFormValidate.value.level = 0;
  selectedOss.value = [];
  updateTreeDataByRole();
  getDataList();
}

function handleCategoryTabChange(name: string) {
  activeCategoryTab.value = name;
  searchForm.fileCategory = name;
  searchForm.fileType = "";
  searchForm.pageNumber = 1;
  updateTreeDataByRole();
  getDataList();
}

function handleSearch() {
  searchForm.pageNumber = 1;
  getDataList();
}

function handleReset() {
  searchForm.name = "";
  searchForm.pageNumber = 1;
  getDataList();
}

function updateTreeDataByRole() {
  const currentTree = filterTreeByRole(treeDataDefault.value, activeRoleTab.value);
  const rootLabelMap = {
    IMAGE: "全部图片",
    VIDEO: "全部视频",
    FILE: "全部文件",
  };
  const rootTitle = (rootLabelMap as Record<string, string>)[activeCategoryTab.value] || "全部素材";
  treeData.value = [
    {
      title: rootTitle,
      label: "全部分类",
      value: "0",
      type: activeRoleTab.value,
      level: 0,
      children: [],
      id: "0",
      categoryId: 0,
    },
    ...currentTree,
  ];
  treeRenderKey.value += 1;
}

function filterTreeByRole(tree: OssTreeNode[] = [], role: string) {
  if (!tree || !tree.length) return [];
  return tree
    .filter((item) => item.type === role)
    .map((item) => ({
      ...item,
      children: [],
    }));
}

/** el-checkbox-group 的 change 给的是 CheckboxValueType[]（string|number|boolean），这里统一转字符串 */
function selectOssChange(e: Array<string | number | boolean>) {
  if (props.maxSelect === 1 && e.length > 1) {
    const last = e[e.length - 1];
    selectedOss.value = [String(last)];
    e = [last];
  }
  if (e) {
    selectList.value = e.map((item) => ({
      id: String(item).split(",")[0],
    }));
    selectCount.value = e.length;
    emit("selected", e);
  }
}

function handleCardClick(item: OssFile, event?: Event) {
  if (props.isComponent && selectImage.value) {
    const target = event?.target as HTMLElement | null;
    if (target?.closest?.(".card-checkbox")) {
      return;
    }
    const key = `${item.id},${item.url}`;
    let next;
    if (props.maxSelect === 1) {
      next = selectedOss.value.includes(key) ? [] : [key];
    } else if (selectedOss.value.includes(key)) {
      next = selectedOss.value.filter((k) => k !== key);
    } else {
      next = [...selectedOss.value, key];
    }
    selectedOss.value = next;
    selectOssChange(next);
  } else {
    // 独立管理端模式：点击卡片直接预览
    previewFile(item);
  }
}

function pageChange(value: number) {
  searchForm.pageNumber = value;
  getDataList();
}

function changePageSize(val: number) {
  searchForm.pageSize = val;
  searchForm.pageNumber = 1;
  getDataList();
}

function handleContextMenuEdit(
  _root: OssTreeNode | null,
  _node: OssTreeNode | null,
  data: OssTreeNode
) {
  insertOrUpdate.value = "update";
  enableGroup.value = true;
  // 树节点里 id / name 是业务字段，另有两个 el-tree 用的展示字段
  groupFormValidate.value.id = String(data.id ?? data.value ?? "");
  groupFormValidate.value.directoryName = String(data.name ?? data.title ?? data.label ?? "");
  groupFormValidate.value.level = 0;
  groupFormValidate.value.parentId = "0";
}

async function handleContextMenuDelete() {
  if (!selectedGroupData.value) return;
  ElMessageBox.confirm("是否删除该分组？", "提示", {
    type: "warning",
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      const groupId = String(selectedGroupData.value?.id ?? selectedGroupData.value?.value ?? "");
      const res = await delFileDirectory(groupId);
      if (res.success) {
        ElMessage.success("删除成功!");
        delete searchForm.fileDirectoryId;
        selectedGroupData.value = null;
        getDataList();
        getAllList();
      }
    })
    .catch(() => {});
}

async function submitAddGroup() {
  formValidateRef.value?.validate?.(async (valid: boolean) => {
    if (valid) {
      let res;
      const params: Record<string, unknown> = {
        directoryName: groupFormValidate.value.directoryName,
        level: 0,
        parentId: "0",
        directoryType: activeRoleTab.value,
      };
      if (insertOrUpdate.value === "insert") {
        res = await addFileDirectory(params);
      } else {
        params.id = groupFormValidate.value.id;
        res = await updateFileDirectory(params);
      }

      if (res.success) {
        ElMessage.success("操作成功!");
        enableGroup.value = false;
        getAllList();
      }
    } else {
      ElMessage.error("请填写完整信息!");
    }
  });
}

function handleClickAddGroup() {
  insertOrUpdate.value = "insert";
  groupFormValidate.value = {
    id: "",
    level: 0,
    parentId: "0",
    directoryName: "",
  };
  enableGroup.value = true;
}

function copyFileUrl(row: OssFile) {
  const text = row.url ?? "";
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        ElMessage.success("文件链接已复制到剪贴板");
      })
      .catch(() => {
        fallbackCopyText(text);
      });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    ElMessage.success("文件链接已复制到剪贴板");
  } catch (err) {
    ElMessage.error("复制失败，请手动复制");
  }
  document.body.removeChild(textArea);
}

function getAllList(_parent_id?: string | number) {
  getFileDirectory().then((res) => {
    if (res.success) {
      treeDataDefault.value = getTree(res.result);
      updateTreeDataByRole();
    }
  });
}

function getTree(tree: OssTreeNode[] = []): OssTreeNode[] {
  const flat: OssTreeNode[] = [];
  const walk = (nodes: OssTreeNode[]) => {
    if (!nodes || !nodes.length) return;
    nodes.forEach((item: OssTreeNode) => {
      flat.push({
        title: item.directoryName,
        value: item.id,
        type: item.directoryType,
        label: item.directoryName,
        level: 0,
        expand: false,
        selected: false,
        contextmenu: false,
        parentId: "0",
        children: [],
      });
      if (item.children && item.children.length) {
        walk(item.children);
      }
    });
  };
  walk(tree);
  return flat;
}

function handleCateChange(data: OssTreeNode[]) {
  if (data && data[0]) {
    const node = data[0];
    selectedGroupData.value = node;
    // el-tree 的节点用 value/type 展示，业务字段是 id/directoryType
    const value = node.id ?? node.value;
    const type = node.directoryType ?? node.type;
    searchForm.fileDirectoryId = value as string | number | undefined;
    if (value === "0" || value === 0) {
      delete searchForm.fileDirectoryId;
    }
    searchForm.userEnums = (type as string | undefined) || activeRoleTab.value;
    searchForm.pageNumber = 1;
    getDataList();
  }
}

function handleSelectConfirm() {
  if (!selectedOss.value.length) {
    ElMessage.warning("请选择图片");
    return;
  }
  const last = selectedOss.value[selectedOss.value.length - 1];
  const separator = last.indexOf(",");
  const id = last.slice(0, separator);
  emit("callback", { url: last.slice(separator + 1), file: data.value.find(item => String(item.id) === id) });
}

function handleSelectCancel() {
  selectedOss.value = [];
  emit("callback", { url: "" });
}

function init() {
  searchForm.userEnums = activeRoleTab.value;
  searchForm.fileCategory = activeCategoryTab.value;
  getDataList();
  getAllList();
}

function handleImagePreview(item: OssFile) {
  const imageList = data.value.filter((i) => isImageFile(i));
  previewImageList.value = imageList.map((i) => ({ url: i.url ?? "", name: i.name ?? "" }));
  const idx = imageList.findIndex((i) => i.id === item.id);
  previewImageIndex.value = idx >= 0 ? idx : 0;
  imageViewerVisible.value = true;
}

function showFile(v: OssFile) {
  prepareFileMeta(v);
  fileTitle.value = v.name || "文件预览";
  fileVisible.value = true;
}

function showVideo(v: OssFile) {
  prepareFileMeta(v);
  videoTitle.value = v.name || "视频预览";
  pendingVideoUrl.value = v.url ?? "";
  videoVisible.value = true;
}

function initDPlayer() {
  const container = dplayerRef.value;
  if (!container || !pendingVideoUrl.value) return;
  if (dp) {
    dp.destroy();
    dp = null;
  }
  dp = new DPlayer({
    container,
    screenshot: true,
    video: {
      url: pendingVideoUrl.value,
    },
  });
}

function closeVideo() {
  if (dp) {
    dp.destroy();
    dp = null;
  }
  pendingVideoUrl.value = "";
}

function getDataList() {
  loading.value = true;
  getFileListData(searchForm)
    .then((res) => {
      if (res && res.success && res.result) {
        let records = res.result.records || [];
        if (!allowVideo.value) {
          records = records.filter((item: OssFile) => !isVideoFile(item));
        }
        data.value = records;
        total.value = res.result.total || 0;
      } else {
        data.value = [];
        total.value = 0;
      }
    })
    .catch(() => {
      data.value = [];
      total.value = 0;
    })
    .finally(() => {
      loading.value = false;
    });
}

function changeFileType() {
  const categoryMap = {
    pic: "IMAGE",
    video: "VIDEO",
    file: props.isComponent ? "IMAGE" : "FILE",
    all: "IMAGE",
  };
  const category = (categoryMap as Record<string, string>)[fileType.value] || "IMAGE";
  activeCategoryTab.value = category;
  handleCategoryTabChange(category);
}

function isImageFile(row: OssFile) {
  return row?.fileCategory === "IMAGE" || (row?.fileType && row.fileType.includes("image"));
}

function isVideoFile(row: OssFile) {
  return row?.fileCategory === "VIDEO" || (row?.fileType && row.fileType.includes("video"));
}

function isPdfFile(row: OssFile) {
  return (
    row?.fileType === "application/pdf" ||
    (row?.name && row.name.toLowerCase().endsWith(".pdf"))
  );
}

function previewFile(item: OssFile) {
  if (isVideoFile(item)) {
    showVideo(item);
  } else if (isImageFile(item)) {
    handleImagePreview(item);
  } else {
    showFile(item);
  }
}

function prepareFileMeta(v: OssFile) {
  file.value = v;
  const size = Number(v.fileSize ?? 0);
  file.value.msize = (size / (1024 * 1024)).toFixed(2) + " MB";
}

function handleMaxSize() {
  ElMessage.warning("所选文件大小过大，不得超过 20MB");
}

function handleSuccess(res: unknown, _file?: unknown, _files?: unknown) {
  if (!canUploadImages.value) {
    ElMessage.warning("仅管理员模块支持上传文件");
    return;
  }
  const result = res as { success?: boolean; message?: string } | undefined;
  if (result?.success) {
    ElMessage.success("上传文件 " + String(file.value.name ?? "") + " 成功");
    getDataList();
  } else {
    ElMessage.error(result?.message ?? "上传失败");
  }
}

function handleError(error: unknown) {
  ElMessage.error(error ? error.toString() : "上传失败");
}

function handleCancel() {
  modalVisible.value = false;
}

function download(v: OssFile) {
  window.open(v.url + "?attname=&response-content-type=application/octet-stream");
}

function removeAll() {
  if (selectCount.value <= 0) {
    ElMessage.warning("您还未选择要删除的数据");
    return;
  }
  ElMessageBox.confirm(
    "您确认要删除所选的 " + selectCount.value + " 个文件?",
    "确认删除",
    {
      type: "warning",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
    }
  )
    .then(() => {
      let ids = selectList.value.map((e) => e.id).join(",");
      deleteFile(ids).then((res) => {
        if (res.success) {
          selectedOss.value = [];
          selectList.value = [];
          selectCount.value = 0;
          init();
          ElMessage.success("批量删除文件成功");
        }
      });
    })
    .catch(() => {});
}

function remove(v: OssFile) {
  ElMessageBox.confirm("您确认要删除文件 " + v.name + " ?", "确认删除", {
    type: "warning",
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
  })
    .then(() => {
      deleteFile(v.id ?? "").then((res) => {
        if (res.success) {
          ElMessage.success("删除文件 " + v.name + " 成功");
          selectedOss.value = selectedOss.value.filter((k) => !k.startsWith(`${v.id},`));
          getDataList();
        }
      });
    })
    .catch(() => {});
}

function handleSubmit() {
  formRef.value?.validate?.((valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      const params: Record<string, unknown> = {
        id: form.value.id,
        key: oldKey.value,
        newKey: form.value.fileKey,
        newName: form.value.name,
      };
      renameFile(params)
        .then((res) => {
          submitLoading.value = false;
          if (res.success) {
            ElMessage.success("操作成功");
            getDataList();
            modalVisible.value = false;
          }
        })
        .catch(() => {
          submitLoading.value = false;
        });
    }
  });
}

function rename(v: OssFile) {
  modalTitle.value = "编辑文件名";
  for (let attr in v) {
    if (v[attr] == null) {
      v[attr] = "";
    }
  }
  let str = JSON.stringify(v);
  let parsed = JSON.parse(str);
  form.value = parsed;
  oldKey.value = parsed.fileKey;
  modalVisible.value = true;
}

onMounted(() => {
  // 独立页面和弹窗（组件模式）都要初始化：
  // 否则弹窗打开时列表是空的，上传请求也拿不到 token。
  if (props.isComponent) {
    searchForm.pageSize = 20;
  }
  // 弹窗普遍用 destroy-on-close，组件「挂载那一刻」initialize 就已经是 true，
  // watch(initialize) 观察不到 false→true 的变化，mediaType 就永远不生效
  // （视频选择器会停在图片分类）。所以挂载时直接走一次选择器初始化。
  if (props.isComponent && props.initialize) {
    activatePicker();
    return;
  }
  init();
});

defineExpose({ selectImage, fileType, changeFileType });

function formatFileSize(size?: number | string | null) {
  if (size === undefined || size === null || size === "" || Number.isNaN(Number(size))) {
    return "0 KB";
  }
  const num = Number(size);
  if (num < 1024) return num + " B";
  if (num < 1024 * 1024) return Math.round(num / 1024) + " KB";
  return (num / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileFormat(item: OssFile) {
  if (item?.fileType) {
    const parts = item.fileType.split("/");
    if (parts.length > 1 && parts[1]) {
      return parts[1].toUpperCase();
    }
  }
  if (item?.name) {
    const ext = item.name.split(".").pop();
    if (ext && ext !== item.name) {
      return ext.toUpperCase();
    }
  }
  return "IMG";
}

function getFileExt(item: OssFile) {
  if (item?.name && item.name.includes(".")) {
    return (item.name.split(".").pop() ?? "").toUpperCase();
  }
  return getFileFormat(item);
}

function getFileBadgeClass(item: OssFile) {
  const ext = getFileExt(item).toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "xls";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip";
  if (["html", "htm", "js", "ts", "json", "xml", "css"].includes(ext)) return "code";
  return "generic";
}

function getFileDimension(item: OssFile) {
  if (item?.width && item?.height) {
    return `${item.width}x${item.height}`;
  }
  return "未知尺寸";
}

function getFileSubInfo(item: OssFile) {
  const fmt = getFileFormat(item);
  const dim = getFileDimension(item);
  const size = formatFileSize(item.fileSize as number | string | undefined);
  return `${fmt} · ${dim} · ${size}`;
}
</script>

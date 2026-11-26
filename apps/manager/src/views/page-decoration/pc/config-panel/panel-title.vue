<template>
  <div class="panel-title-bar">
    <div class="panel-section">
      <div class="section-title">标题内容设置</div>
      
      <div class="form-item">
        <span class="item-label">主标题文案</span>
        <el-input v-model="local.mainTitle" size="small" placeholder="如：限时特卖" clearable />
      </div>

      <!-- 主标题前缀图标 / 图片 -->
      <div class="form-item mt-10">
        <span class="item-label">标题图标 / 徽标图片 (可选)</span>
        <div class="title-icon-picker-row">
          <div class="icon-thumb-preview" @click="handleSelectTitleImg" title="点击选择/更换标题图标">
            <img v-if="titleImgVal" :src="titleImgVal" class="title-img" alt="" />
            <div v-else class="icon-placeholder">
              <el-icon><Picture /></el-icon>
              <span>选图</span>
            </div>
            <div class="hover-overlay" v-if="titleImgVal">换图</div>
          </div>
          <div class="icon-input-wrap">
            <div class="input-btn-row">
              <el-input
                v-model="titleImgVal"
                size="small"
                placeholder="请输入或选择标题前缀图标"
                clearable
              />
              <el-button size="small" class="action-picker-btn" @click="handleSelectTitleImg">
                <el-icon class="mr-4"><Picture /></el-icon>
                <span>选择图片</span>
              </el-button>
            </div>
            <div class="tip-sub-text">建议尺寸 32x32 或 48x48px，展示在标题前缀</div>
          </div>
        </div>
      </div>

      <!-- 主标题跳转链接 -->
      <div class="form-item mt-10">
        <span class="item-label">主标题点击跳转链接 (可选)</span>
        <div class="link-picker-wrap">
          <el-input
            v-model="local.titleUrl"
            size="small"
            placeholder="如 /goods 或活动专区，留空不可点击"
            clearable
          >
            <template #prefix>
              <el-icon class="link-input-icon"><Link /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            plain
            size="small"
            class="action-picker-btn link-btn"
            @click="handleSelectTitleLink"
          >
            <el-icon class="mr-4"><Link /></el-icon>
            <span>选择链接</span>
          </el-button>
        </div>
        <div class="link-current-tag" v-if="local.titleUrl">
          <span class="tag-label">当前链接:</span>
          <span class="tag-val" :title="local.titleUrl">{{ local.titleUrl }}</span>
          <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.titleUrl = ''"><Close /></el-icon>
        </div>
      </div>

      <div class="form-item mt-10">
        <span class="item-label">副标题文字</span>
        <el-input v-model="local.subtitle" size="small" placeholder="如：精选爆款 每日早十点上新" clearable />
      </div>

      <div class="form-item flex-row mt-10">
        <span class="item-label">对齐方式</span>
        <el-radio-group v-model="local.align" size="small">
          <el-radio-button value="left">靠左对齐</el-radio-button>
          <el-radio-button value="center">居中对齐</el-radio-button>
        </el-radio-group>
      </div>

      <div class="form-item flex-row mt-10">
        <span class="item-label">显示右侧“查看更多”</span>
        <el-switch v-model="local.showMore" size="small" />
      </div>

      <template v-if="local.showMore">
        <div class="form-item mt-10">
          <span class="item-label">更多链接文案</span>
          <el-input v-model="local.moreText" size="small" placeholder="查看更多 >" clearable />
        </div>

        <div class="form-item mt-10">
          <span class="item-label">更多跳转地址</span>
          <div class="link-picker-wrap">
            <el-input
              v-model="local.moreUrl"
              size="small"
              placeholder="如 /goods 或活动专题"
              clearable
            >
              <template #prefix>
                <el-icon class="link-input-icon"><Link /></el-icon>
              </template>
            </el-input>
            <el-button
              type="primary"
              plain
              size="small"
              class="action-picker-btn link-btn"
              @click="handleSelectMoreLink"
            >
              <el-icon class="mr-4"><Link /></el-icon>
              <span>选择链接</span>
            </el-button>
          </div>
          <div class="link-current-tag" v-if="local.moreUrl">
            <span class="tag-label">当前链接:</span>
            <span class="tag-val" :title="local.moreUrl">{{ local.moreUrl }}</span>
            <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.moreUrl = ''"><Close /></el-icon>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, watch, onMounted } from 'vue';
import { Link, Picture, Close } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import type { OpenImagePicker, OpenLinkPicker } from "./picker-types";

/** 标题栏面板配置 */
type PanelOptions = {
  mainTitle?: string;
  subtitle?: string;
  titleImg?: string;
  /** 兼容老字段：与 titleImg 同义 */
  icon?: string;
  titleUrl?: string;
  showMore?: string | number | boolean;
  moreText?: string;
  moreUrl?: string;
  /** el-radio-group 写回 string|number|boolean|undefined */
  align?: string | number | boolean;
  [key: string]: unknown;
};

const props = defineProps<{
  component?: unknown;
  options?: PanelOptions;
}>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 props 浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
const local = reactive<PanelOptions>({ ...(props.options ?? {}) });

// 注入来自 pc/index.vue 的全局选择器
const openImagePicker = inject<OpenImagePicker | null>('openImagePicker', null);
const openLinkPicker = inject<OpenLinkPicker | null>('openLinkPicker', null);

const titleImgVal = computed({
  get() {
    return local.titleImg || local.icon || '';
  },
  set(v: string | number) {
    const text = String(v ?? "");
    local.titleImg = text;
    local.icon = text;
  }
});

// 1. 选择前缀图片
function handleSelectTitleImg() {
  if (openImagePicker) {
    openImagePicker((url) => {
      if (url) {
        local.titleImg = url;
        local.icon = url;
      }
    });
  } else {
    ElMessageBox.prompt('请输入标题图标图片 URL：', '选择标题图标', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.titleImg || local.icon || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '图片地址不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        local.titleImg = value.trim();
        local.icon = value.trim();
      })
      .catch(() => {});
  }
}

// 2. 选择主标题跳转链接
function handleSelectTitleLink() {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      if (url) local.titleUrl = url;
    });
  } else {
    ElMessageBox.prompt('请输入主标题跳转链接：', '设置标题链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.titleUrl || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        local.titleUrl = value.trim();
      })
      .catch(() => {});
  }
}

// 3. 选择“查看更多”链接
function handleSelectMoreLink() {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      if (url) local.moreUrl = url;
    });
  } else {
    ElMessageBox.prompt('请输入“查看更多”跳转链接：', '设置更多链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.moreUrl || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        local.moreUrl = value.trim();
      })
      .catch(() => {});
  }
}
watch(
  local,
  () => {
    emit("update:options", { ...local });
  },
  { deep: true }
);

// 首次挂载同步一次，确保默认值也写进组件配置（老数据缺字段时补齐）
onMounted(() => {
  emit("update:options", { ...local });
});
</script>

<style lang="scss" scoped>
.panel-title-bar {
  padding: 8px 4px;

  .panel-section {
    margin-bottom: 20px;
    padding-bottom: 16px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .form-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.flex-row {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .item-label {
        font-size: 12px;
        color: #475569;
        font-weight: 500;
      }
    }
  }

  .mt-10 {
    margin-top: 10px;
  }
  .mr-4 {
    margin-right: 4px;
  }

  .title-icon-picker-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;

    .icon-thumb-preview {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      cursor: pointer;
      flex-shrink: 0;

      .title-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .icon-placeholder {
        width: 100%;
        height: 100%;
        background: #e2e8f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #64748b;
        gap: 2px;
      }

      .hover-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        color: #ffffff;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .hover-overlay {
        opacity: 1;
      }
    }

    .icon-input-wrap {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .input-btn-row {
        display: flex;
        gap: 6px;
      }

      .tip-sub-text {
        font-size: 11px;
        color: #94a3b8;
      }
    }
  }

  .link-picker-wrap {
    display: flex;
    align-items: center;
    gap: 6px;

    .link-input-icon {
      color: #94a3b8;
    }

    .action-picker-btn {
      flex-shrink: 0;
      padding: 0 10px;

      &.link-btn {
        background: #ecf5ff;
        border-color: #b3d8ff;
        color: #409eff;

        &:hover {
          background: #409eff;
          color: #ffffff;
        }
      }
    }
  }

  .link-current-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    border-radius: 4px;
    padding: 3px 8px;
    margin-top: 4px;
    overflow: hidden;

    .tag-label {
      color: #3b82f6;
      font-weight: 500;
      flex-shrink: 0;
    }

    .tag-val {
      color: #1e40af;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .url-clear-icon {
      font-size: 12px;
      color: #94a3b8;
      cursor: pointer;
      flex-shrink: 0;

      &:hover {
        color: #ef4444;
      }
    }
  }
}
</style>

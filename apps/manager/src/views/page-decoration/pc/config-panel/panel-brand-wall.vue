<template>
  <div class="panel-brand-wall">
    <div class="panel-section">
      <div class="section-title">
        <div class="title-with-tip">
          <span>内容设置</span>
          <el-tooltip
            content="设置品牌图片列表、跳转链接与展示排版"
            placement="top"
          >
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>

      <div class="sub-section-title">图片列表</div>

      <!-- 图片列表卡片 -->
      <div class="brand-cards-list">
        <div
          v-for="(item, idx) in local.items"
          :key="idx"
          class="brand-item-card"
        >
          <!-- 第一行：重新选择 + 缩略图预览 -->
          <div class="card-row-top">
            <el-button
              size="small"
              class="reselect-btn"
              @click="handleSelectImage(item)"
            >
              {{ item.img ? '重新选择' : '选择图片' }}
            </el-button>

            <!-- 右侧图片缩略图 -->
            <div
              class="thumb-preview-box"
              @click="handleSelectImage(item)"
              :title="item.img ? '点击更换图片' : '点击上传图片'"
            >
              <template v-if="item.img">
                <img :src="item.img" alt="brand" class="thumb-img" />
                <span class="thumb-del-badge" @click.stop="item.img = ''" title="移除图片">
                  <el-icon><Close /></el-icon>
                </span>
              </template>
              <template v-else>
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">上传图片</span>
              </template>
            </div>
          </div>

          <!-- 第二行：图片标题 + 工具按钮组 -->
          <div class="card-row-bottom">
            <el-input
              v-model="item.title"
              size="small"
              placeholder="图片标题，可选"
              class="title-input"
            />
            <div class="action-btn-group">
              <el-button
                size="small"
                class="action-btn"
                :class="{ 'is-linked': !!item.url }"
                @click="handleSetLink(item)"
                @contextmenu.prevent="item.url = ''"
                :title="item.url ? (`已设链接: ${item.url} (点击修改，右键清除)`) : '设置跳转链接'"
              >
                <el-icon><Link /></el-icon>
              </el-button>
              <el-button
                size="small"
                class="action-btn"
                :disabled="idx === 0"
                @click="moveItem(idx, -1)"
                title="上移"
              >
                <el-icon><Top /></el-icon>
              </el-button>
              <el-button
                size="small"
                class="action-btn"
                :disabled="idx === (local.items || []).length - 1"
                @click="moveItem(idx, 1)"
                title="下移"
              >
                <el-icon><Bottom /></el-icon>
              </el-button>
              <el-button
                size="small"
                class="action-btn del-btn"
                @click="(local.items ??= []).splice(idx, 1)"
                title="删除图片"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加图片大按钮 -->
      <el-button
        class="add-image-full-btn"
        @click="handleAddImage"
      >
        <el-icon><Plus /></el-icon> 添加图片
      </el-button>

      <!-- 排版间距与列数 -->
      <div class="form-row mt-16">
        <span class="row-label">单行列数</span>
        <el-radio-group v-model="local.columns" size="small">
          <el-radio-button :value="3">3 列</el-radio-button>
          <el-radio-button :value="4">4 列</el-radio-button>
          <el-radio-button :value="5">5 列</el-radio-button>
          <el-radio-button :value="6">6 列</el-radio-button>
        </el-radio-group>
      </div>

      <div class="form-row mt-12">
        <span class="row-label">卡片间距(px)</span>
        <el-input-number
          v-model="local.gap"
          :min="0"
          :max="40"
          :step="2"
          size="small"
          class="num-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OpenLinkPicker, OpenImagePicker } from "./picker-types";
import { inject, reactive, watch, onMounted } from "vue";
import { Plus, Delete, Close, Link, Top, Bottom, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

type WallItem = {
  id?: string | number;
  title?: string;
  subtitle?: string;
  img?: string;
  url?: string;
  [key: string]: unknown;
};

/** 品牌墙配置 */
type PanelOptions = {
  /** el-radio-group 写回 string|number|boolean|undefined */
  columns?: string | number | boolean;
  gap?: number | null;
  items?: WallItem[];
  [key: string]: unknown;
};

const props = defineProps<{
  component?: unknown;
  options?: PanelOptions;
}>();

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 local 的浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
const local = reactive<PanelOptions>({ ...(props.options ?? {}) });

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

// 初始化默认字段
if (!local.columns) local.columns = 4;
if (local.gap === undefined) local.gap = 12;
if (!Array.isArray(local.items)) {
  local.items = [
    { title: '双层收纳 9.9RMB', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/brand-wall/brand_1.png', url: '/goodsList?brand=1' },
    { title: '双层收纳 29.9', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/brand-wall/brand_2.png', url: '/goodsList?brand=2' },
    { title: '双层收纳 29.9', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/brand-wall/brand_3.png', url: '/goodsList?brand=3' },
    { title: '双层收纳 29.9', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/brand-wall/brand_4.png', url: '/goodsList?brand=4' }
  ];
}

const openImagePicker = inject<OpenImagePicker | null>('openImagePicker', null);
const openLinkPicker = inject<OpenLinkPicker | null>('openLinkPicker', null);

/** 条目：{ title / url / img } 三件套之一 */
type PanelItem = { title?: string; url?: string; img?: string; name?: string; [key: string]: unknown };

function handleSelectImage(item: PanelItem) {
  if (openImagePicker) {
    openImagePicker((url) => {
      if (url) item.img = url;
    });
  } else {
    ElMessageBox.prompt('请输入图片 URL 地址：', '上传品牌图', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: item.img || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '图片地址不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        item.img = value.trim();
      })
      .catch(() => {});
  }
}

function handleSetLink(item: PanelItem) {
  if (openLinkPicker) {
    openLinkPicker(({ url, title }) => {
      item.url = url;
      if (!item.title && title) item.title = title;
    });
  } else {
    ElMessageBox.prompt('请输入跳转链接（如 /goodsList）：', '设置跳转链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: item.url || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        item.url = value.trim();
      })
      .catch(() => {});
  }
}

function moveItem(idx: number, dir: number) {
  const list = (local.items ??= []);
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  const temp = list[idx];
  list[idx] = list[target];
  list[target] = temp;
}

function handleAddImage() {
  const nextNum = (local.items?.length || 0) + 1;
  const iconIdx = ((nextNum - 1) % 4) + 1;
  (local.items ??= []).push({
    title: `品牌图 ${nextNum}`,
    img: `https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/brand-wall/brand_${iconIdx}.png`,
    url: '/goodsList'
  });
}
</script>

<style lang="scss" scoped>
.panel-brand-wall {
  font-size: 13px;
  color: #334155;

  .panel-section {
    padding-bottom: 20px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;

      .title-with-tip {
        display: flex;
        align-items: center;
        gap: 6px;

        .help-icon {
          font-size: 14px;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;

          &:hover {
            color: #475569;
          }
        }
      }
    }

    .sub-section-title {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 10px;
    }

    .brand-cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 12px;

      .brand-item-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: border-color 0.2s;

        &:hover {
          border-color: #cbd5e1;
        }

        .card-row-top {
          display: flex;
          align-items: center;
          gap: 10px;

          .reselect-btn {
            flex: 1;
            height: 38px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            color: #1e293b;
            transition: all 0.2s;

            &:hover {
              border-color: #f97316;
              color: #ea580c;
            }
          }

          .thumb-preview-box {
            flex: 1;
            height: 38px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.2s;

            &:hover {
              border-color: #f97316;
            }

            .thumb-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .upload-icon {
              font-size: 13px;
              color: #94a3b8;
              margin-right: 4px;
            }

            .upload-text {
              font-size: 12px;
              color: #64748b;
            }

            .thumb-del-badge {
              position: absolute;
              top: 2px;
              right: 2px;
              width: 16px;
              height: 16px;
              background: rgba(15, 23, 42, 0.7);
              color: #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              cursor: pointer;

              &:hover {
                background: #ef4444;
              }
            }
          }
        }

        .card-row-bottom {
          display: flex;
          align-items: center;
          gap: 8px;

          .title-input {
            flex: 1;

            :deep(.el-input__wrapper) {
              background: #ffffff;
            }
          }

          .action-btn-group {
            display: flex;
            align-items: center;
            gap: 4px;

            .action-btn {
              width: 28px;
              height: 28px;
              padding: 0;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
              background: #ffffff;
              color: #64748b;

              &:hover:not(:disabled) {
                border-color: #cbd5e1;
                color: #1e293b;
              }

              &.is-linked {
                border-color: #fdba74;
                background: #fff7ed;
                color: #ea580c;
              }

              &.del-btn:hover {
                border-color: #fecaca;
                background: #fef2f2;
                color: #ef4444;
              }
            }
          }
        }
      }
    }

    .add-image-full-btn {
      width: 100%;
      height: 36px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      color: #334155;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        border-color: #f97316;
        color: #ea580c;
        background: #fffaf5;
      }
    }

    .form-row {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &.mt-16 {
        margin-top: 16px;
      }

      &.mt-12 {
        margin-top: 12px;
      }

      .row-label {
        font-size: 12px;
        color: #475569;
      }

      .num-input {
        width: 120px;
      }
    }
  }
}
</style>

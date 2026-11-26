<template>
  <div class="panel-carousel">
    <!-- 内容设置 -->
    <div class="panel-section">
      <div class="section-title">
        <div class="title-with-tip">
          <span>内容设置</span>
          <el-tooltip
            content="设置轮播播放参数及切换动效"
            placement="top"
          >
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>

      <!-- 1. 播放轮播 -->
      <div class="form-row flex-between">
        <span class="row-label">播放轮播</span>
        <el-switch v-model="local.autoPlay" size="small" />
      </div>

      <!-- 2. 轮播间隔(ms) -->
      <div class="form-row flex-col mt-12">
        <span class="row-label">轮播间隔(ms)</span>
        <el-input-number
          v-model="local.interval"
          :min="1000"
          :max="15000"
          :step="500"
          size="small"
          controls-position="right"
          class="full-num-input"
        />
      </div>

      <!-- 3. 显示左右切换按钮 -->
      <div class="form-row flex-between mt-12">
        <span class="row-label">显示左右切换按钮</span>
        <el-switch v-model="local.showArrow" size="small" />
      </div>

      <!-- 4. 切换动效 -->
      <div class="form-row flex-col mt-12">
        <span class="row-label">切换动效</span>
        <el-select v-model="local.effect" size="small" class="full-select">
          <el-option label="淡入淡出" value="fade" />
          <el-option label="平滑滚动" value="slide" />
          <el-option label="卡片式" value="card" />
        </el-select>
      </div>

      <!-- 5. 图片缩放模式 -->
      <div class="form-row flex-col mt-12">
        <span class="row-label">图片缩放模式</span>
        <el-select v-model="local.fitMode" size="small" class="full-select">
          <el-option label="等比完整展示 (全画面不裁切)" value="contain" />
          <el-option label="等比填满裁剪 (铺满容器)" value="cover" />
        </el-select>
      </div>

      <!-- 6. 高宽比例 -->
      <div class="form-row flex-col mt-12">
        <span class="row-label">高宽比例 (随排版宽度等比缩放)</span>
        <el-select v-model="local.aspectRatio" size="small" class="full-select">
          <el-option label="2.5 : 1 (标准电商海报 推荐)" value="2.5:1" />
          <el-option label="16 : 9 (影音宽屏海报)" value="16:9" />
          <el-option label="2 : 1 (大促通栏横幅)" value="2:1" />
          <el-option label="3 : 1 (超宽细长条海报)" value="3:1" />
          <el-option label="固定高度模式 (不随宽度等比缩放)" value="custom" />
        </el-select>
      </div>

      <!-- 固定高度输入 (仅在 custom 模式下显示) -->
      <div class="form-row flex-col mt-12" v-if="local.aspectRatio === 'custom'">
        <span class="row-label">固定高度 (px)</span>
        <el-input-number
          v-model="local.height"
          :min="80"
          :max="800"
          :step="10"
          size="small"
          controls-position="right"
          class="full-num-input"
        />
      </div>

      <!-- 7. 显示底部指示点 -->
      <div class="form-row flex-between mt-12">
        <span class="row-label">显示底部指示点</span>
        <el-switch v-model="local.showIndicator" size="small" />
      </div>

      <!-- 6. 轮播图列表卡片 -->
      <div class="sub-section-title mt-16">轮播图</div>

      <div class="slides-cards-list">
        <div
          v-for="(slide, idx) in local.list"
          :key="idx"
          class="slide-item-card"
        >
          <!-- 第一行：左侧重新选择按钮，右侧图片预览 -->
          <div class="card-row-top">
            <el-button
              size="small"
              class="reselect-btn"
              @click="handleSelectImage(slide)"
            >
              {{ slide.img ? '重新选择' : '选择图片' }}
            </el-button>

            <!-- 右侧图片缩略图 -->
            <div
              class="slide-thumb-box"
              @click="handleSelectImage(slide)"
              :title="slide.img ? '点击更换海报图片' : '点击上传海报图片'"
            >
              <template v-if="slide.img">
                <img :src="slide.img" alt="slide" class="thumb-img" />
                <span class="thumb-del-badge" @click.stop="slide.img = ''" title="移除图片">
                  <el-icon><Close /></el-icon>
                </span>
              </template>
              <template v-else>
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">上传海报</span>
              </template>
            </div>
          </div>

          <!-- 第二行：左侧标题输入，右侧操作工具栏 -->
          <div class="card-row-bottom">
            <el-input
              v-model="slide.title"
              size="small"
              placeholder="图片标题，可选"
              class="title-input"
            />
            <div class="action-btn-group">
              <el-button
                size="small"
                class="action-btn"
                :class="{ 'is-linked': !!slide.url }"
                @click="handleSetLink(slide)"
                @contextmenu.prevent="slide.url = ''"
                :title="slide.url ? (`已设链接: ${slide.url} (点击修改，右键清除)`) : '设置跳转链接'"
              >
                <el-icon><Link /></el-icon>
              </el-button>
              <el-button
                size="small"
                class="action-btn"
                :disabled="idx === 0"
                @click="moveSlide(idx, -1)"
                title="上移"
              >
                <el-icon><Top /></el-icon>
              </el-button>
              <el-button
                size="small"
                class="action-btn"
                :disabled="idx === (local.list || []).length - 1"
                @click="moveSlide(idx, 1)"
                title="下移"
              >
                <el-icon><Bottom /></el-icon>
              </el-button>
              <el-button
                size="small"
                class="action-btn del-btn"
                @click="(local.list ??= []).splice(idx, 1)"
                title="删除海报"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <!-- 已设链接：显式显示，避免"只高亮图标"看不出结果 -->
          <div v-if="slide.url" class="slide-link-row">
            <span class="slide-link-label">已设链接</span>
            <span class="slide-link-value" :title="slide.url">{{ slide.url }}</span>
            <el-button link type="danger" size="small" @click="slide.url = ''">清除</el-button>
          </div>
        </div>
      </div>

      <!-- 添加图片大按钮 -->
      <el-button
        class="add-slide-full-btn"
        @click="handleAddSlide"
      >
        <el-icon><Plus /></el-icon> 添加图片
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OpenLinkPicker, OpenImagePicker } from "./picker-types";
import { inject, reactive, watch, onMounted } from 'vue';
import { Plus, Delete, Close, Link, Top, Bottom, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

/** 轮播项 */
type CarouselItem = {
  title?: string;
  img?: string;
  url?: string;
  [key: string]: unknown;
};

/** 轮播面板配置 */
type PanelOptions = {
  autoPlay?: string | number | boolean;
  interval?: number;
  showArrow?: string | number | boolean;
  showIndicator?: string | number | boolean;
  effect?: string;
  fitMode?: string;
  aspectRatio?: string;
  /** el-input-number 写回 number|null */
  height?: number | null;
  list?: CarouselItem[];
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

// 初始化默认字段
if (local.autoPlay === undefined) local.autoPlay = true;
if (local.interval === undefined) local.interval = 4000;
if (local.showArrow === undefined) local.showArrow = true;
if (local.showIndicator === undefined) local.showIndicator = true;
if (!local.effect) local.effect = 'fade';
if (!local.fitMode) local.fitMode = 'contain';
if (!local.aspectRatio) local.aspectRatio = '2.5:1';
if (local.height === undefined) local.height = 420;
if (!Array.isArray(local.list)) {
  local.list = [
    { title: '出游囤好货', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_1.png', url: '/goodsList?seckill=1' },
    { title: '科技新品', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_2.png', url: '/goodsList?category=1' },
    { title: '原产地直采', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_3.png', url: '/goodsList?category=2' },
    { title: '大牌美妆', img: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_4.png', url: '/goodsList?category=3' }
  ];
}

// 注入全局选择器
const openImagePicker = inject<OpenImagePicker | null>('openImagePicker', null);
const openLinkPicker = inject<OpenLinkPicker | null>('openLinkPicker', null);

/** 条目：{ title / url / img } 三件套之一 */
type PanelItem = { title?: string; url?: string; img?: string; name?: string; [key: string]: unknown };

function handleSelectImage(slide: PanelItem) {
  if (openImagePicker) {
    openImagePicker((url) => {
      if (url) slide.img = url;
    });
  } else {
    ElMessageBox.prompt('请输入海报图片 URL 地址：', '上传轮播图', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: slide.img || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '图片地址不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        slide.img = value.trim();
      })
      .catch(() => {});
  }
}

function handleSetLink(slide: PanelItem) {
  if (openLinkPicker) {
    openLinkPicker(({ url, title, raw }) => {
      if (import.meta.env.DEV) console.info("[carousel] link picked", { url, title, raw });
      slide.url = url;
      if (!slide.title && title) slide.title = title;
    });
  } else {
    ElMessageBox.prompt('请输入跳转链接（如 /goodsList）：', '设置跳转链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: slide.url || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接不能为空'
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        slide.url = value.trim();
      })
      .catch(() => {});
  }
}

function moveSlide(idx: number, dir: number) {
  const list = (local.list ??= []);
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  const temp = list[idx];
  list[idx] = list[target];
  list[target] = temp;
}

function handleAddSlide() {
  const nextNum = (local.list?.length || 0) + 1;
  const iconIdx = ((nextNum - 1) % 4) + 1;
  (local.list ??= []).push({
    title: `轮播图 ${nextNum}`,
    img: `https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/carousel/banner_${iconIdx}.png`,
    url: '/goodsList'
  });
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
.slide-link-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;

  .slide-link-value {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #2563eb;
  }
}
.panel-carousel {
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

    .form-row {
      display: flex;

      &.flex-between {
        align-items: center;
        justify-content: space-between;
      }

      &.flex-col {
        flex-direction: column;
        gap: 6px;
      }

      &.mt-12 {
        margin-top: 12px;
      }

      &.mt-16 {
        margin-top: 16px;
      }

      .row-label {
        font-size: 12px;
        color: #475569;
      }

      .full-num-input, .full-select {
        width: 100%;
      }
    }

    .slides-cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 12px;

      .slide-item-card {
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

          .slide-thumb-box {
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

    .add-slide-full-btn {
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
  }
}
</style>

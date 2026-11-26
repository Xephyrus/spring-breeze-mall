<template>
  <div class="panel-hot-zone">
    <!-- 1. 热区底图设置 -->
    <div class="panel-section">
      <div class="section-title">热区底图</div>

      <!-- URL 输入与选择图片按钮 -->
      <div class="form-item">
        <span class="item-label">大图 URL 地址</span>
        <div class="input-with-action">
          <el-input
            v-model="local.imageUrl"
            size="small"
            placeholder="请输入或选择热区大图 URL"
            clearable
          />
          <el-button
            size="small"
            class="action-picker-btn"
            @click="handleSelectImage"
          >
            <el-icon class="mr-4"><Picture /></el-icon>
            <span>选择图片</span>
          </el-button>
        </div>
      </div>

      <!-- 底图预览框 -->
      <div class="hotzone-preview-box" v-if="local.imageUrl">
        <img :src="local.imageUrl" alt="hotzone" class="img-preview" />
        <div class="preview-actions-bar">
          <el-button size="small" type="primary" @click="handleOpenHotzone">
            <el-icon class="mr-4"><Aim /></el-icon>
            绘制热区
          </el-button>
          <el-button size="small" type="primary" plain @click="handleSelectImage">
            <el-icon class="mr-4"><Picture /></el-icon>
            更换底图
          </el-button>
          <el-button size="small" type="danger" plain @click="local.imageUrl = ''">
            <el-icon class="mr-4"><Close /></el-icon>
            移除底图
          </el-button>
        </div>
      </div>
    </div>

    <!-- 2. 热区列表与链接选择 -->
    <div class="panel-section">
      <div class="section-title flex-between">
        <span>热区列表 ({{ local.zones?.length || 0 }})</span>
        <div class="header-action-group">
          <el-button type="primary" plain size="small" @click="handleOpenHotzone">
            <el-icon class="mr-4"><Aim /></el-icon> 绘制热区
          </el-button>
          <el-button link type="primary" size="small" @click="handleAddZone">
            <el-icon><Plus /></el-icon> 添加热区
          </el-button>
        </div>
      </div>

      <div class="zones-list" v-if="Array.isArray(local.zones) && local.zones.length">
        <div
          v-for="(zone, idx) in local.zones"
          :key="idx"
          class="zone-card-item"
        >
          <!-- 热区卡片头部 -->
          <div class="zone-header">
            <span class="zone-idx-title">
              <span class="zone-num-badge">{{ idx + 1 }}</span>
              <span>{{ zone.title || `热区 ${idx + 1}` }}</span>
            </span>
            <div class="zone-header-btns">
              <el-button
                link
                size="small"
                :disabled="idx === 0"
                @click="moveZone(idx, -1)"
                title="上移"
              >
                <el-icon><Top /></el-icon>
              </el-button>
              <el-button
                link
                size="small"
                :disabled="idx === local.zones.length - 1"
                @click="moveZone(idx, 1)"
                title="下移"
              >
                <el-icon><Bottom /></el-icon>
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="(local.zones ??= []).splice(idx, 1)"
                title="删除热区"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 热区标题与链接设置 -->
          <div class="zone-body-inputs">
            <!-- 热区标题 -->
            <div class="field-item">
              <span class="field-lbl">热区标题</span>
              <el-input
                v-model="zone.title"
                size="small"
                placeholder="热区名称（如：领券中心 / 潮电专场）"
                clearable
              />
            </div>

            <!-- 跳转链接 + 链接选择器 -->
            <div class="field-item">
              <span class="field-lbl">跳转链接</span>
              <div class="link-picker-row">
                <el-input
                  v-model="zone.url"
                  size="small"
                  placeholder="跳转链接（如 /goodsList?category=1）"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="link-prefix-icon"><Link /></el-icon>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  plain
                  size="small"
                  class="action-picker-btn link-btn"
                  @click="handleSelectLink(zone)"
                >
                  <el-icon class="mr-4"><Link /></el-icon>
                  <span>选择链接</span>
                </el-button>
              </div>

              <!-- 当前链接高亮标识 -->
              <div class="link-current-tag" v-if="zone.url">
                <span class="tag-label">当前链接:</span>
                <span class="tag-val" :title="zone.url">{{ zone.url }}</span>
              </div>
            </div>

            <!-- 热区位置百分比 (X, Y, W, H) -->
            <div class="field-item">
              <span class="field-lbl">热区位置 (坐标与尺寸 %)</span>
              <div class="coord-grid">
                <div class="coord-cell">
                  <span class="coord-lbl">X</span>
                  <el-input-number
                    v-model="zone.left"
                    :min="0"
                    :max="100"
                    :step="1"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    class="coord-input"
                  />
                </div>
                <div class="coord-cell">
                  <span class="coord-lbl">Y</span>
                  <el-input-number
                    v-model="zone.top"
                    :min="0"
                    :max="100"
                    :step="1"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    class="coord-input"
                  />
                </div>
                <div class="coord-cell">
                  <span class="coord-lbl">宽</span>
                  <el-input-number
                    v-model="zone.width"
                    :min="1"
                    :max="100"
                    :step="1"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    class="coord-input"
                  />
                </div>
                <div class="coord-cell">
                  <span class="coord-lbl">高</span>
                  <el-input-number
                    v-model="zone.height"
                    :min="1"
                    :max="100"
                    :step="1"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    class="coord-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-zones-box" v-else>
        <span>暂无热区，可点击“绘制热区”在底图上拖拽画热区</span>
        <div class="mt-8">
          <el-button type="primary" size="small" @click="handleOpenHotzone">
            <el-icon class="mr-4"><Aim /></el-icon> 立即绘制热区
          </el-button>
        </div>
      </div>
        </div>

    <!-- 绘制热区弹窗（复用移动端热区绘制器） -->
    <hotzone ref="hotzoneDialogRef" width="960px" @changeZone="handleChangeZone" />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, reactive, watch, onMounted } from "vue";
import { Plus, Delete, Link, Picture, Close, Top, Bottom, Aim } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import hotzone from '@/components/hotzone/index.vue';

/** 热区 */
/** 热区（面板里既可能存 left/top 百分比，也可能存 leftPer 比例） */
type HotzoneZone = {
  id?: string | number;
  title?: string;
  url?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  leftPer?: number;
  topPer?: number;
  widthPer?: number;
  heightPer?: number;
  img?: string;
  link?: string;
  type?: string;
  [key: string]: unknown;
};

type HotZoneItem = {
  id?: string | number;
  title?: string;
  url?: string;
  /** 百分比坐标（0-100） */
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
};

/** 热区面板配置 */
type PanelOptions = {
  imageUrl?: string;
  zones?: HotZoneItem[];
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

/** 全局图片选择器：回调里拿到 url */
type ImagePickerHandler = (callback: (url?: string) => void) => void;

/** 全局链接选择器：回调里拿到 url / title / 原始数据 */
type LinkPickerPayload = { url?: string; title?: string; _raw?: unknown };
type LinkPickerHandler = (callback: (picked: LinkPickerPayload) => void) => void;

// 注入来自 pc/index.vue 的全局选择器
const openImagePicker = inject<ImagePickerHandler | null>('openImagePicker', null);
const openLinkPicker = inject<LinkPickerHandler | null>('openLinkPicker', null);

// 1. 选择大图
function handleSelectImage() {
  if (openImagePicker) {
    openImagePicker((url) => {
      if (url) local.imageUrl = url;
    });
  } else {
    ElMessageBox.prompt('请输入热区大图 URL 地址：', '选择热区底图', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.imageUrl || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '图片地址不能为空'
    })
      .then(({ value }) => {
        local.imageUrl = (value ?? "").trim();
      })
      .catch(() => {});
  }
}

// 2. 选择热区跳转链接
function handleSelectLink(zone: HotzoneZone) {
  if (openLinkPicker) {
    openLinkPicker(({ url, title }) => {
      if (url) zone.url = url;
      if (!zone.title && title) {
        zone.title = title;
      }
    });
  } else {
    ElMessageBox.prompt('请输入跳转链接地址（如 /goodsList?category=1 或外部网址）：', '设置跳转链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: zone.url || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接地址不能为空'
    })
      .then(({ value }) => {
        zone.url = (value ?? "").trim();
      })
      .catch(() => {});
  }
}

// 3. 上移/下移热区
function moveZone(index: number, direction: number) {
  const newIdx = index + direction;
  if (!Array.isArray(local.zones)) return;
  if (newIdx < 0 || newIdx >= local.zones.length) return;
  const temp = local.zones[index];
  local.zones[index] = local.zones[newIdx];
  local.zones[newIdx] = temp;
}

// 4. 添加热区
function handleAddZone() {
  if (!Array.isArray(local.zones)) local.zones = [];
  const count = local.zones.length;
  local.zones.push({
    title: `热区 ${count + 1}`,
    url: '/goodsList',
    top: Math.min(10 + count * 5, 60),
    left: Math.min(10 + (count % 3) * 30, 70),
    width: 25,
    height: 35
  });
}

/** 热区编辑弹窗实例：只调用 open() */
const hotzoneDialogRef = ref<{ open: (val: { img?: string; zoneInfo?: HotzoneZone[] }) => void } | null>(null);

// 绘制热区弹窗打开
function handleOpenHotzone() {
  const imgUrl = local.imageUrl || '';
  if (!imgUrl) {
    ElMessage.warning('请先输入或选择热区底图');
    return;
  }
  const zoneInfo: HotzoneZone[] = (local.zones ?? []).map((zone, idx) => {
    const source = zone as HotzoneZone;
    const leftPer = source.leftPer !== undefined ? source.leftPer : (Number(source.left) || 0) / 100;
    const topPer = source.topPer !== undefined ? source.topPer : (Number(source.top) || 0) / 100;
    const widthPer = source.widthPer !== undefined ? source.widthPer : (Number(source.width) || 20) / 100;
    const heightPer = source.heightPer !== undefined ? source.heightPer : (Number(source.height) || 20) / 100;
    const link = source.url || source.link || '';

    return {
      ...source,
      leftPer,
      topPer,
      widthPer,
      heightPer,
      link,
      title: source.title || `热区 ${idx + 1}`,
      type: source.type || 'other'
    };
  });

  if (hotzoneDialogRef.value) {
    hotzoneDialogRef.value.open({
      img: imgUrl,
      zoneInfo
    });
  }
}

// 热区绘制器变更回调
function handleChangeZone(zoneList: HotzoneZone[]) {
  if (!Array.isArray(zoneList)) return;
  local.zones = zoneList.map((zone, idx) => {
    const source = zone as HotzoneZone;
    const leftVal = source.leftPer !== undefined ? source.leftPer * 100 : (source.left !== undefined ? source.left : 0);
    const topVal = source.topPer !== undefined ? source.topPer * 100 : (source.top !== undefined ? source.top : 0);
    const widthVal = source.widthPer !== undefined ? source.widthPer * 100 : (source.width !== undefined ? source.width : 20);
    const heightVal = source.heightPer !== undefined ? source.heightPer * 100 : (source.height !== undefined ? source.height : 20);
    const linkVal = source.link || source.url || '';
    const titleVal = source.title || `热区 ${idx + 1}`;

    return {
      ...source,
      title: titleVal,
      url: linkVal,
      link: linkVal,
      left: Math.round(leftVal * 10) / 10,
      top: Math.round(topVal * 10) / 10,
      width: Math.round(widthVal * 10) / 10,
      height: Math.round(heightVal * 10) / 10,
      type: source.type || 'other'
    };
  });
}

</script>

<style lang="scss" scoped>
.panel-hot-zone {
  .panel-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #e2e8f0;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;

      &.flex-between {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .form-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .item-label {
        font-size: 12px;
        color: #475569;
      }
    }

    .input-with-action {
      display: flex;
      align-items: center;
      gap: 6px;

      .action-picker-btn {
        flex-shrink: 0;
        padding: 0 10px;
      }
    }

    .hotzone-preview-box {
      margin-top: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;

      .img-preview {
        width: 100%;
        max-height: 140px;
        object-fit: cover;
        display: block;
      }

      .preview-actions-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: #f1f5f9;
        border-top: 1px solid #e2e8f0;
      }
    }
  }

  .zones-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .zone-card-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .zone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #edf2f7;

        .zone-idx-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;

          .zone-num-badge {
            background: #409EFF;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }

        .zone-header-btns {
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }

      .zone-body-inputs {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .field-item {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .field-lbl {
            font-size: 11px;
            font-weight: 500;
            color: #64748b;
          }
        }

        .link-picker-row {
          display: flex;
          align-items: center;
          gap: 6px;

          .link-prefix-icon {
            color: #94a3b8;
          }

          .action-picker-btn {
            flex-shrink: 0;
            padding: 0 10px;

            &.link-btn {
              background: #ecf5ff;
              border-color: #b3d8ff;
              color: #409EFF;

              &:hover {
                background: #409EFF;
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
          padding: 2px 8px;
          margin-top: 2px;
          overflow: hidden;

          .tag-label {
            color: #3b82f6;
            flex-shrink: 0;
            font-weight: 500;
          }

          .tag-val {
            color: #1e40af;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: monospace;
          }
        }

        .coord-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;

          .coord-cell {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 2px 6px;

            .coord-lbl {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              flex-shrink: 0;
            }

            .coord-input {
              width: 100%;

              :deep(.el-input__wrapper) {
                padding: 0 2px;
                box-shadow: none !important;
              }

              :deep(.el-input__inner) {
                font-size: 11px;
                text-align: center;
              }
            }
          }
        }
      }
    }
  }

  .empty-zones-box {
    text-align: center;
    padding: 20px;
    color: #94a3b8;
    font-size: 12px;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
  }

  .mr-4 {
    margin-right: 4px;
  }
}
</style>

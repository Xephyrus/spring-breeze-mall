<template>
  <div class="panel-category-mega-menu">
    <!-- 1. 内容设置 -->
    <div class="panel-section">
      <div class="section-title">
        <div class="title-with-tip">
          <span>内容设置</span>
          <el-tooltip
            content="设置商品分类的文字颜色及显示字号"
            placement="top"
          >
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>

      <!-- 文字颜色 -->
      <div class="form-row flex-col">
        <span class="row-label">文字颜色</span>
        <div class="color-picker-input-group">
          <el-color-picker
            v-model="local.textColor"
            size="small"
            class="color-picker"
          />
          <el-input
            v-model="local.textColor"
            size="small"
            placeholder="#111927"
            class="color-input"
          />
        </div>
      </div>

      <!-- 字号 -->
      <div class="form-row flex-col mt-16">
        <span class="row-label">字号</span>
        <el-input-number
          v-model="local.fontSize"
          :min="12"
          :max="24"
          :step="1"
          size="small"
          controls-position="right"
          class="font-size-input"
        />
      </div>

      <!-- 标题文案 -->
      <div class="form-row flex-col mt-16">
        <span class="row-label">标题文案</span>
        <el-input
          v-model="local.title"
          size="small"
          placeholder="分类"
          class="full-input"
        />
      </div>

      <!-- 悬浮高亮色 -->
      <div class="form-row flex-col mt-16">
        <span class="row-label">悬浮高亮色</span>
        <div class="color-picker-input-group">
          <el-color-picker
            v-model="local.activeColor"
            size="small"
            class="color-picker"
          />
          <el-input
            v-model="local.activeColor"
            size="small"
            placeholder="#409EFF"
            class="color-input"
          />
        </div>
      </div>

      <!-- 数据来源 -->
      <div class="form-row flex-col mt-16">
        <span class="row-label">数据来源</span>
        <el-radio-group v-model="local.source" size="small">
          <el-radio-button value="system">系统分类 (自动)</el-radio-button>
          <el-radio-button value="custom">手动自定义</el-radio-button>
        </el-radio-group>
        <span class="form-tip mt-6" v-if="local.source !== 'custom'">
          已启用系统商品分类，前后台自动拉取商城最新分类及二级、三级悬浮大菜单。
        </span>
      </div>

      <!-- 分类项列表 (仅自定义模式可见) -->
      <div class="categories-sub-section mt-20" v-if="local.source === 'custom'">
        <div class="sub-header flex-between">
          <span class="sub-title">分类条目</span>
          <span class="sub-count">共 {{ (local.categories || []).length }} 项</span>
        </div>

        <div class="category-cards-list">
          <div
            v-for="(cat, idx) in local.categories"
            :key="idx"
            class="cat-item-card"
          >
            <div class="cat-card-main">
              <el-input
                v-model="cat.name"
                size="small"
                placeholder="分类名称"
                class="cat-name-input"
              />
              <div class="cat-card-actions">
                <el-button
                  size="small"
                  class="action-btn"
                  :disabled="idx === 0"
                  @click="moveCat(idx, -1)"
                  title="上移"
                >
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  class="action-btn"
                  :disabled="idx === (local.categories || []).length - 1"
                  @click="moveCat(idx, 1)"
                  title="下移"
                >
                  <el-icon><Bottom /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  class="action-btn del-btn"
                  @click="(local.categories ??= []).splice(idx, 1)"
                  title="删除分类"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <el-button
          class="add-cat-btn"
          @click="handleAddCategory"
        >
          <el-icon><Plus /></el-icon> 添加分类条目
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import { QuestionFilled, Plus, Delete, Top, Bottom } from '@element-plus/icons-vue';

/** 大屏菜单里的二级分类 */
type MegaSubCategory = {
  id?: string | number;
  name?: string;
  url?: string;
  [key: string]: unknown;
};

/** 大屏菜单的一级分类 */
type MegaCategory = {
  id?: string | number;
  name?: string;
  url?: string;
  subCategories?: MegaSubCategory[];
  [key: string]: unknown;
};

/** 分类大屏菜单配置 */
type PanelOptions = {
  title?: string;
  /** el-radio-group 写回 string|number|boolean|undefined */
  source?: string | number | boolean;
  /** el-color-picker 清空时写回 null */
  textColor?: string | null;
  activeColor?: string | null;
  fontSize?: number | null;
  categories?: MegaCategory[];
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
if (!local.source) local.source = 'system';
if (!local.title) local.title = '分类';
if (!local.textColor) local.textColor = '#111927';
if (!local.fontSize) local.fontSize = 14;
if (!local.activeColor) local.activeColor = '#ea580c';
if (!Array.isArray(local.categories)) {
  local.categories = [
    {
      name: '精选频道',
      subCategories: [
        { name: '每日精选', items: ['新品尝鲜', '大牌特惠', '超级秒杀', '今日热卖'] },
        { name: '特色专区', items: ['企业团购', '会员专享', '积分兑换', '清仓特卖'] }
      ]
    },
    {
      name: '新品上架',
      subCategories: [
        { name: '本周新发', items: ['数码新品', '秋季服饰', '美妆尝新', '家居收纳'] },
        { name: '潮流榜单', items: ['人气推荐', '编辑精选', '预售抢先'] }
      ]
    },
    {
      name: '企业采购',
      subCategories: [
        { name: '办公采购', items: ['办公用纸', '文具收纳', '商用打印', '会议茶水'] },
        { name: '员工福利', items: ['节日礼盒', '数码卡券', '健康体检', '员工关怀'] }
      ]
    },
    {
      name: '领券中心',
      subCategories: [
        { name: '平台券', items: ['全场满减', '品类专享', '运费券', '会员特权'] },
        { name: '大牌券', items: ['数码大额券', '生鲜补贴', '美妆立减', '母婴满减'] }
      ]
    }
  ];
}

function handleAddCategory() {
  const list = (local.categories ??= []);
  const nextNum = list.length + 1;
  list.push({
    name: `新分类 ${nextNum}`,
    subCategories: [
      { name: '热门分类', items: ['精选推荐', '热销爆款', '品质优选'] }
    ]
  });
}

function moveCat(idx: number, dir: number) {
  const list = (local.categories ??= []);
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  const temp = list[idx];
  list[idx] = list[target];
  list[target] = temp;
}
</script>

<style lang="scss" scoped>
.panel-category-mega-menu {
  font-size: 13px;
  color: #334155;

  .panel-section {
    padding-bottom: 20px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 14px;

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

    .form-row {
      display: flex;

      &.flex-col {
        flex-direction: column;
        gap: 8px;
      }

      &.mt-16 {
        margin-top: 16px;
      }

      &.mt-20 {
        margin-top: 20px;
      }

      .row-label {
        font-size: 12px;
        font-weight: 500;
        color: #475569;
      }

      .color-picker-input-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .color-picker {
          flex-shrink: 0;
        }

        .color-input {
          flex: 1;
        }
      }

      .font-size-input {
        width: 100%;
      }

      .full-input {
        width: 100%;
      }
    }

    .categories-sub-section {
      border-top: 1px dashed #e2e8f0;
      padding-top: 14px;

      .sub-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .sub-title {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .sub-count {
          font-size: 12px;
          color: #94a3b8;
        }
      }

      .category-cards-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 10px;

        .cat-item-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;

          .cat-card-main {
            display: flex;
            align-items: center;
            gap: 8px;

            .cat-name-input {
              flex: 1;
            }

            .cat-card-actions {
              display: flex;
              align-items: center;
              gap: 4px;

              .action-btn {
                width: 26px;
                height: 26px;
                padding: 0;
                border: 1px solid #e2e8f0;
                background: #ffffff;
                color: #64748b;

                &:hover:not(:disabled) {
                  border-color: #cbd5e1;
                  color: #1e293b;
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

      .add-cat-btn {
        width: 100%;
        height: 32px;
        border: 1px dashed #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #475569;
        font-size: 12px;
        transition: all 0.2s;

        &:hover {
          border-color: #ea580c;
          color: #ea580c;
          background: #fffaf5;
        }
      }
    }
  }
}
</style>

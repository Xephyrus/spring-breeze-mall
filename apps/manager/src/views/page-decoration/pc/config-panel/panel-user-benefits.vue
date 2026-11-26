<template>
  <div class="panel-user-benefits">
    <!-- 1. 用户问候与头像设置 -->
    <div class="panel-section">
      <div class="section-title">问候与头像设置</div>
      <div class="form-item">
        <span class="item-label">状态标签</span>
        <el-input v-model="local.badgeText" size="small" placeholder="如：请登录" clearable />
      </div>
      <div class="form-item mt-10">
        <span class="item-label">欢迎主标语</span>
        <el-input v-model="local.welcomeText" size="small" placeholder="如：欢迎来到商城" clearable />
      </div>
      <div class="form-item mt-10">
        <span class="item-label">副标语提示</span>
        <el-input v-model="local.subtitle" size="small" placeholder="如：登录后查看专属权益" clearable />
      </div>

      <!-- 头像图片选择器 -->
      <div class="form-item mt-10">
        <span class="item-label">用户头像</span>
        <div class="avatar-upload-box">
          <div class="avatar-preview-wrap" @click="handleSelectAvatar" title="点击选择/更换头像">
            <img v-if="local.avatar" :src="local.avatar" alt="avatar" class="avatar-img" />
            <div v-else class="avatar-empty">
              <el-icon><Picture /></el-icon>
              <span>选头像</span>
            </div>
            <div class="avatar-hover-tip" v-if="local.avatar">换图</div>
          </div>
          <div class="avatar-right-controls">
            <div class="avatar-input-row">
              <el-input
                v-model="local.avatar"
                size="small"
                placeholder="留空展示系统默认头像"
                clearable
              />
              <el-button size="small" class="action-picker-btn" @click="handleSelectAvatar">
                <el-icon class="mr-4"><Picture /></el-icon>
                <span>选择图片</span>
              </el-button>
            </div>
            <div class="sub-tip-text">推荐比例 1:1 圆形头像，建议尺寸 100x100px</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 登录与注册按钮 -->
    <div class="panel-section">
      <div class="section-title">登录 / 注册按钮配置</div>
      <div class="form-item">
        <span class="item-label">登录按钮文案</span>
        <el-input v-model="local.loginText" size="small" placeholder="登录" />
      </div>
      <div class="form-item mt-10">
        <span class="item-label">登录跳转链接</span>
        <div class="link-picker-wrap">
          <el-input v-model="local.loginUrl" size="small" placeholder="/login" clearable>
            <template #prefix>
              <el-icon class="link-input-icon"><Link /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            plain
            size="small"
            class="action-picker-btn link-btn"
            @click="handleSelectLink('loginUrl', '登录跳转链接')"
          >
            <el-icon class="mr-4"><Link /></el-icon>
            <span>选择链接</span>
          </el-button>
        </div>
        <div class="link-current-tag" v-if="local.loginUrl">
          <span class="tag-label">当前链接:</span>
          <span class="tag-val" :title="local.loginUrl">{{ local.loginUrl }}</span>
          <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.loginUrl = ''"><Close /></el-icon>
        </div>
      </div>

      <div class="form-item mt-10">
        <span class="item-label">注册按钮文案</span>
        <el-input v-model="local.registerText" size="small" placeholder="注册" />
      </div>
      <div class="form-item mt-10">
        <span class="item-label">注册跳转链接</span>
        <div class="link-picker-wrap">
          <el-input v-model="local.registerUrl" size="small" placeholder="/signUp" clearable>
            <template #prefix>
              <el-icon class="link-input-icon"><Link /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            plain
            size="small"
            class="action-picker-btn link-btn"
            @click="handleSelectLink('registerUrl', '注册跳转链接')"
          >
            <el-icon class="mr-4"><Link /></el-icon>
            <span>选择链接</span>
          </el-button>
        </div>
        <div class="link-current-tag" v-if="local.registerUrl">
          <span class="tag-label">当前链接:</span>
          <span class="tag-val" :title="local.registerUrl">{{ local.registerUrl }}</span>
          <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.registerUrl = ''"><Close /></el-icon>
        </div>
      </div>
    </div>

    <!-- 3. 指标节点展示 (购物车 / 优惠券 / 订单) -->
    <div class="panel-section">
      <div class="section-title">指标节点展示</div>

      <!-- 购物车 -->
      <div class="metric-config-card">
        <div class="metric-config-head">
          <span class="metric-title">购物车</span>
          <el-switch v-model="local.showCart" size="small" />
        </div>
        <div class="metric-inputs" v-if="local.showCart !== false">
          <div class="sub-field">
            <span class="sub-label">展示文案</span>
            <el-input v-model="local.cartText" size="small" placeholder="购物车" />
          </div>
          <div class="sub-field mt-6">
            <span class="sub-label">跳转链接</span>
            <div class="link-picker-wrap">
              <el-input v-model="local.cartUrl" size="small" placeholder="/cart" clearable>
                <template #prefix>
                  <el-icon class="link-input-icon"><Link /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                plain
                size="small"
                class="action-picker-btn link-btn"
                @click="handleSelectLink('cartUrl', '购物车跳转链接')"
              >
                <el-icon class="mr-4"><Link /></el-icon>
                <span>选择链接</span>
              </el-button>
            </div>
            <div class="link-current-tag" v-if="local.cartUrl">
              <span class="tag-label">当前链接:</span>
              <span class="tag-val" :title="local.cartUrl">{{ local.cartUrl }}</span>
              <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.cartUrl = ''"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 优惠券 -->
      <div class="metric-config-card mt-10">
        <div class="metric-config-head">
          <span class="metric-title">优惠券</span>
          <el-switch v-model="local.showCoupons" size="small" />
        </div>
        <div class="metric-inputs" v-if="local.showCoupons !== false">
          <div class="sub-field">
            <span class="sub-label">展示文案</span>
            <el-input v-model="local.couponText" size="small" placeholder="优惠券" />
          </div>
          <div class="sub-field mt-6">
            <span class="sub-label">跳转链接</span>
            <div class="link-picker-wrap">
              <el-input v-model="local.couponUrl" size="small" placeholder="/member/coupon" clearable>
                <template #prefix>
                  <el-icon class="link-input-icon"><Link /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                plain
                size="small"
                class="action-picker-btn link-btn"
                @click="handleSelectLink('couponUrl', '优惠券跳转链接')"
              >
                <el-icon class="mr-4"><Link /></el-icon>
                <span>选择链接</span>
              </el-button>
            </div>
            <div class="link-current-tag" v-if="local.couponUrl">
              <span class="tag-label">当前链接:</span>
              <span class="tag-val" :title="local.couponUrl">{{ local.couponUrl }}</span>
              <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.couponUrl = ''"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单 -->
      <div class="metric-config-card mt-10">
        <div class="metric-config-head">
          <span class="metric-title">订单</span>
          <el-switch v-model="local.showOrders" size="small" />
        </div>
        <div class="metric-inputs" v-if="local.showOrders !== false">
          <div class="sub-field">
            <span class="sub-label">展示文案</span>
            <el-input v-model="local.orderText" size="small" placeholder="订单" />
          </div>
          <div class="sub-field mt-6">
            <span class="sub-label">跳转链接</span>
            <div class="link-picker-wrap">
              <el-input v-model="local.orderUrl" size="small" placeholder="/member/order" clearable>
                <template #prefix>
                  <el-icon class="link-input-icon"><Link /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                plain
                size="small"
                class="action-picker-btn link-btn"
                @click="handleSelectLink('orderUrl', '订单跳转链接')"
              >
                <el-icon class="mr-4"><Link /></el-icon>
                <span>选择链接</span>
              </el-button>
            </div>
            <div class="link-current-tag" v-if="local.orderUrl">
              <span class="tag-label">当前链接:</span>
              <span class="tag-val" :title="local.orderUrl">{{ local.orderUrl }}</span>
              <el-icon class="url-clear-icon" title="清除链接" @click.stop="local.orderUrl = ''"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 底部快捷便民服务入口 -->
    <div class="panel-section">
      <div class="section-title">底部便民服务入口</div>
      <div class="services-list">
        <div v-for="(srv, sIdx) in ensureServices" :key="sIdx" class="service-config-item">
          <div class="service-header-row">
            <span class="service-idx">{{ sIdx + 1 }}.</span>
            <el-input v-model="srv.name" size="small" placeholder="名称" style="width: 80px;" />
            <el-select v-model="srv.icon" size="small" style="width: 90px;">
              <el-option label="收藏" value="Star" />
              <el-option label="足迹" value="Clock" />
              <el-option label="红包" value="Present" />
              <el-option label="客服" value="Service" />
            </el-select>
          </div>
          <div class="service-link-row mt-6">
            <div class="link-picker-wrap flex-1">
              <el-input v-model="srv.url" size="small" placeholder="跳转路径" clearable>
                <template #prefix>
                  <el-icon class="link-input-icon"><Link /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                plain
                size="small"
                class="action-picker-btn link-btn"
                @click="handleSelectServiceLink(srv)"
              >
                <el-icon class="mr-4"><Link /></el-icon>
                <span>选链接</span>
              </el-button>
            </div>
          </div>
          <div class="link-current-tag" v-if="srv.url">
            <span class="tag-label">当前链接:</span>
            <span class="tag-val" :title="srv.url">{{ srv.url }}</span>
            <el-icon class="url-clear-icon" title="清除链接" @click.stop="srv.url = ''"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, watch, onMounted } from 'vue';
import { Picture, Link, Close } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

/** 会员服务项 */
type BenefitService = {
  id?: string | number;
  /** 服务名称（模板绑定 srv.name） */
  name?: string;
  icon?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
};

/** 会员权益面板配置 */
type PanelOptions = {
  welcomeText?: string;
  subtitle?: string;
  loginText?: string;
  loginUrl?: string;
  registerText?: string;
  registerUrl?: string;
  orderText?: string;
  orderUrl?: string;
  couponText?: string;
  couponUrl?: string;
  cartText?: string;
  cartUrl?: string;
  showOrders?: string | number | boolean;
  showCoupons?: string | number | boolean;
  showCart?: string | number | boolean;
  badgeText?: string;
  avatar?: string;
  services?: BenefitService[];
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    component?: { type?: string; name?: string };
    options?: PanelOptions;
  }>(),
  { component: () => ({}), options: () => ({}) }
);

const emit = defineEmits<{ "update:options": [patch: Partial<PanelOptions>] }>();

/**
 * 本地副本：初始化时取 props 浅拷贝，之后单向 local -> emit -> 父组件。
 * 不要用 watchEffect 从 props 重建，否则会与父组件回写形成死循环。
 */
const local = reactive<PanelOptions>({ ...(props.options ?? {}) });

/** 链接字段是动态 key，统一走这里写回本地副本再 emit */
function setOption(key: string, value: string) {
  (local as Record<string, unknown>)[key] = value;
}

// 全局选择器注入
type ImagePicker = (cb: (url: string) => void) => void;
type LinkPicker = (cb: (payload: { url?: string; title?: string }) => void) => void;

const openImagePicker = inject<ImagePicker | null>('openImagePicker', null);
const openLinkPicker = inject<LinkPicker | null>('openLinkPicker', null);

// 初始化缺省配置
if (local.badgeText === undefined) local.badgeText = '请登录';
if (local.welcomeText === undefined) local.welcomeText = '欢迎来到商城';
if (local.subtitle === undefined) local.subtitle = '登录后查看专属权益';
if (local.loginText === undefined) local.loginText = '登录';
if (local.registerText === undefined) local.registerText = '注册';
if (local.loginUrl === undefined) local.loginUrl = '/login';
if (local.registerUrl === undefined) local.registerUrl = '/signUp';

if (local.showCart === undefined) local.showCart = true;
if (local.showCoupons === undefined) local.showCoupons = true;
if (local.showOrders === undefined) local.showOrders = true;

if (local.cartText === undefined) local.cartText = '购物车';
if (local.couponText === undefined) local.couponText = '优惠券';
if (local.orderText === undefined) local.orderText = '订单';

if (local.cartUrl === undefined) local.cartUrl = '/cart';
if (local.couponUrl === undefined) local.couponUrl = '/member/coupon';
if (local.orderUrl === undefined) local.orderUrl = '/member/order';

const defaultServices = [
  { name: '收藏', url: '/home/Favorites', icon: 'Star' },
  { name: '足迹', url: '/home/MyTracks', icon: 'Clock' },
  { name: '领券', url: '/coupon', icon: 'Present' },
  { name: '帮助', url: '/article', icon: 'Service' }
];

/**
 * 补齐默认服务项。
 *
 * 原先是 computed 里赋值（渲染期间改数据），改成 watch：
 * 只在「空数组」时填一次，填完即非空，不会自触发循环。
 */
watch(
  () => local.services,
  (val) => {
    if (!Array.isArray(val) || val.length === 0) {
      local.services = JSON.parse(JSON.stringify(defaultServices));
    }
  },
  { immediate: true, deep: false }
);

/** 纯读取 */
const ensureServices = computed(() => local.services);

// 1. 选择头像
function handleSelectAvatar() {
  if (openImagePicker) {
    openImagePicker((url: string) => {
      if (url) local.avatar = url;
    });
  } else {
    ElMessageBox.prompt('请输入用户头像图片 URL 地址：', '选择头像', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.avatar || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '图片地址不能为空'
    })
      .then(({ value }) => {
        local.avatar = value.trim();
      })
      .catch(() => {});
  }
}

// 2. 通用选择链接
function handleSelectLink(key: string, title: string) {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      if (url) setOption(key, url);
    });
  } else {
    ElMessageBox.prompt(`请输入${title}（如 /member 或外部网址）：`, `设置${title}`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: String((props.options as Record<string, unknown>)[key] ?? ''),
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接不能为空'
    })
      .then(({ value }) => {
        setOption(key, value.trim());
      })
      .catch(() => {});
  }
}

// 3. 服务项链接选择
function handleSelectServiceLink(srv: BenefitService) {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      if (url) srv.url = url;
    });
  } else {
    ElMessageBox.prompt(`请输入【${srv.name}】跳转链接：`, '设置便民服务链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: srv.url || '',
      inputPattern: /^\S+$/,
      inputErrorMessage: '链接不能为空'
    })
      .then(({ value }) => {
        srv.url = value.trim();
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
.panel-user-benefits {
  padding: 8px 4px;

  .panel-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #e2e8f0;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 10px;
    }

    .form-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .item-label {
        font-size: 12px;
        color: #475569;
        font-weight: 500;
      }
    }
  }

  .mt-6 {
    margin-top: 6px;
  }
  .mt-10 {
    margin-top: 10px;
  }
  .mr-4 {
    margin-right: 4px;
  }
  .flex-1 {
    flex: 1;
  }

  .avatar-upload-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;

    .avatar-preview-wrap {
      position: relative;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #cbd5e1;
      cursor: pointer;
      flex-shrink: 0;

      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-empty {
        width: 100%;
        height: 100%;
        background: #e2e8f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-size: 10px;
        gap: 2px;
      }

      .avatar-hover-tip {
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

      &:hover .avatar-hover-tip {
        opacity: 1;
      }
    }

    .avatar-right-controls {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .avatar-input-row {
        display: flex;
        gap: 6px;
        align-items: center;

        .action-picker-btn {
          flex-shrink: 0;
        }
      }

      .sub-tip-text {
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

  .metric-config-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px;

    .metric-config-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .metric-title {
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .metric-inputs {
      .sub-field {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .sub-label {
          font-size: 11px;
          color: #64748b;
        }
      }
    }
  }

  .services-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .service-config-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;

      .service-header-row {
        display: flex;
        align-items: center;
        gap: 6px;

        .service-idx {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          width: 16px;
        }
      }
    }
  }
}
</style>

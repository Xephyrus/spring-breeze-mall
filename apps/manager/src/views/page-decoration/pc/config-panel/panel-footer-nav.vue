<template>
  <div class="panel-footer-nav">
    <!-- 特色服务保障条 -->
    <div class="panel-section">
      <div class="section-title flex-between">
        <span>服务保障条</span>
        <el-switch v-model="local.showAssurance" size="small" />
      </div>

      <div class="assurance-list" v-if="local.showAssurance">
        <div
          v-for="(item, idx) in local.assurances"
          :key="idx"
          class="assurance-item"
        >
          <el-input v-model="item.code" size="small" placeholder="字" class="code-input" />
          <el-input v-model="item.title" size="small" placeholder="标题" class="title-input" />
          <el-input v-model="item.desc" size="small" placeholder="副标题" class="desc-input" />
          <el-button
            size="small"
            class="action-btn link-btn"
            :type="item.url ? 'primary' : 'default'"
            :plain="!item.url"
            @click="handleSetAssuranceLink(item)"
            @contextmenu.prevent="handleClearAssuranceLink(item)"
            :title="item.url ? ('已设链接: ' + item.url + ' (点击修改，右键清除)') : '设置跳转链接'"
          >
            <el-icon><Link /></el-icon>
          </el-button>
          <el-button link type="danger" size="small" @click="(local.assurances ??= []).splice(idx, 1)" title="删除">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button link type="primary" size="small" @click="handleAddAssurance" style="margin-top: 6px">
          <el-icon><Plus /></el-icon> 添加保障项
        </el-button>
      </div>
    </div>

    <!-- 服务指南与文章分组 -->
    <div class="panel-section">
      <div class="section-title flex-between">
        <span>底部帮助与指南列</span>
        <el-button link type="primary" size="small" @click="handleAddGuideGroup">
          <el-icon><Plus /></el-icon> 添加分组
        </el-button>
      </div>

      <div class="guide-groups-list">
        <div
          v-for="(group, gIdx) in local.guideGroups"
          :key="gIdx"
          class="guide-group-card"
        >
          <div class="group-header">
            <el-input v-model="group.title" size="small" placeholder="列标题（如：购物指南）" style="width: 160px" />
            <el-button link type="danger" size="small" @click="(local.guideGroups ??= []).splice(gIdx, 1)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <!-- 链接列表 -->
          <div class="group-links">
            <div v-for="(link, lIdx) in group.links" :key="lIdx" class="link-item">
              <el-input v-model="link.text" size="small" placeholder="名称" class="link-title-input" />
              <el-button
                size="small"
                class="action-btn link-btn"
                :type="link.url ? 'primary' : 'default'"
                :plain="!link.url"
                @click="handleSetGuideLink(link)"
                @contextmenu.prevent="handleClearGuideLink(link)"
                :title="link.url ? ('已设链接: ' + link.url + ' (点击修改，右键清除)') : '设置跳转链接'"
              >
                <el-icon><Link /></el-icon>
              </el-button>
              <el-button link type="danger" size="small" @click="(group.links ??= []).splice(lIdx, 1)" title="删除">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <el-button link type="primary" size="small" @click="(group.links ??= []).push({ text: '新链接', url: '/article' })">
              + 添加子链接
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 版权与备案 -->
    <div class="panel-section">
      <div class="section-title">版权与 ICP 备案</div>
      <div class="form-item">
        <span class="item-label">ICP 备案号</span>
        <div class="input-with-action">
          <el-input v-model="local.icpText" size="small" placeholder="浙ICP备XXXXXXXX号-1" class="flex-1" />
          <el-button
            size="small"
            class="action-btn link-btn"
            :type="local.icpLink ? 'primary' : 'default'"
            :plain="!local.icpLink"
            @click="handleSetIcpLink"
            @contextmenu.prevent="local.icpLink = ''"
            :title="local.icpLink ? ('已设链接: ' + local.icpLink + ' (点击修改，右键清除)') : '设置跳转链接'"
          >
            <el-icon><Link /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="form-item">
        <span class="item-label">版权声明文案</span>
        <div class="input-with-action">
          <el-input v-model="local.copyright" size="small" placeholder="Copyright © 2026 Lilishop." class="flex-1" />
          <el-button
            size="small"
            class="action-btn link-btn"
            :type="local.copyrightLink ? 'primary' : 'default'"
            :plain="!local.copyrightLink"
            @click="handleSetCopyrightLink"
            @contextmenu.prevent="local.copyrightLink = ''"
            :title="local.copyrightLink ? ('已设链接: ' + local.copyrightLink + ' (点击修改，右键清除)') : '设置跳转链接'"
          >
            <el-icon><Link /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, reactive, watch, onMounted } from "vue";
import { Plus, Delete, Close, Link } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import type { OpenLinkPicker } from "./picker-types";

/** 服务保障项 */
type AssuranceItem = {
  code?: string;
  title?: string;
  desc?: string;
  url?: string;
};

/** 底部导航里的一条链接 */
type GuideLink = {
  text?: string;
  url?: string;
};

type GuideGroup = {
  title?: string;
  links?: GuideLink[];
};

/** 底部导航配置 */
type PanelOptions = {
  /** el-switch 写回 string|number|boolean */
  showAssurance?: string | number | boolean;
  assurances?: AssuranceItem[];
  guideGroups?: GuideGroup[];
  copyright?: string;
  copyrightLink?: string;
  icpText?: string;
  icpLink?: string;
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

const openLinkPicker = inject<OpenLinkPicker | null>('openLinkPicker', null);

/** 底部导航里的一个链接条目 */
type NavLink = { url?: string; title?: string; [key: string]: unknown };

function handleSetAssuranceLink(item: NavLink) {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      item.url = url;
    });
  } else {
    ElMessageBox.prompt('请输入跳转链接路径（留空则清除链接）：', `设置 [${item.title || '服务保障'}] 链接`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: item.url || '',
      inputPattern: /^.*$/
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        item.url = (value || '').trim();
      })
      .catch(() => {});
  }
}

function handleClearAssuranceLink(item: NavLink) {
  item.url = '';
}

function handleSetGuideLink(link: NavLink) {
  if (openLinkPicker) {
    openLinkPicker(({ url, title }) => {
      link.url = url;
      if (!link.text && title) link.text = title;
    });
  } else {
    ElMessageBox.prompt('请输入跳转链接路径（留空则清除链接）：', `设置 [${link.text || '帮助链接'}] 路径`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: link.url || '',
      inputPattern: /^.*$/
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        link.url = (value || '').trim();
      })
      .catch(() => {});
  }
}

function handleClearGuideLink(link: NavLink) {
  link.url = '';
}

function handleAddAssurance() {
  if (!Array.isArray(local.assurances)) local.assurances = [];
  local.assurances.push({ code: '优', title: '品质优选', desc: '放心购物', url: '/article' });
}

function handleAddGuideGroup() {
  if (!Array.isArray(local.guideGroups)) local.guideGroups = [];
  local.guideGroups.push({ title: '新服务指南', links: [{ text: '常见问题', url: '/article' }] });
}
function handleSetIcpLink() {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      local.icpLink = url;
    });
  } else {
    ElMessageBox.prompt('请输入 ICP 备案跳转链接（留空则清除链接）：', '设置 ICP 备案链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.icpLink || 'https://beian.miit.gov.cn/',
      inputPattern: /^.*$/
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        local.icpLink = (value || '').trim();
      })
      .catch(() => {});
  }
}

function handleSetCopyrightLink() {
  if (openLinkPicker) {
    openLinkPicker(({ url }) => {
      local.copyrightLink = url;
    });
  } else {
    ElMessageBox.prompt('请输入版权跳转链接（留空则清除链接）：', '设置版权链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: local.copyrightLink || '',
      inputPattern: /^.*$/
    })
      .then((res) => {
        const value = String((res as { value?: string })?.value ?? "");
        local.copyrightLink = (value || '').trim();
      })
      .catch(() => {});
  }
}
</script>

<style lang="scss" scoped>
.panel-footer-nav {
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
      margin-bottom: 12px;

      .item-label {
        font-size: 12px;
        color: #475569;
      }

      .input-with-action {
        display: flex;
        align-items: center;
        gap: 6px;

        .flex-1 {
          flex: 1;
        }

        .link-btn {
          padding: 0 7px;
          flex-shrink: 0;
        }
      }
    }

    .assurance-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .assurance-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .code-input {
          width: 38px;
          flex-shrink: 0;
        }

        .title-input {
          width: 82px;
          flex-shrink: 0;
        }

        .desc-input {
          flex: 1;
          min-width: 0;
        }

        .link-btn {
          padding: 0 7px;
          flex-shrink: 0;
        }
      }
    }

    .guide-groups-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .guide-group-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px;

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .group-links {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .link-item {
            display: flex;
            align-items: center;
            gap: 6px;

            .link-title-input {
              flex: 1;
            }

            .link-btn {
              padding: 0 7px;
              flex-shrink: 0;
            }
          }
        }
      }
    }
  }
}
</style>

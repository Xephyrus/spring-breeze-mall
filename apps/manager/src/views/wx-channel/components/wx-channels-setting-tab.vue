<template>
  <div v-loading="loading" class="wx-channel-setting">
    <el-form label-width="160px" label-position="right" :model="configObject">
      <el-form-item label="AppId">
        <el-input v-model="configObject.appId" style="width: 360px" />
      </el-form-item>
      <el-form-item label="AppSecret">
        <el-input v-model="configObject.appSecret" style="width: 360px" />
      </el-form-item>
      <el-form-item label="接口基础地址">
        <el-input
          v-model="configObject.apiBase"
          style="width: 360px"
          placeholder="https://api.weixin.qq.com/minishop"
        />
      </el-form-item>
      <el-form-item label="Token地址">
        <el-input
          v-model="configObject.tokenUrl"
          style="width: 360px"
          placeholder="https://api.weixin.qq.com/cgi-bin/token"
        />
      </el-form-item>
      <div class="actions">
        <el-button type="primary" :loading="submitLoading" @click="submit">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getSetting, setSetting } from "@/api/index";
import { ElMessage } from "element-plus";

defineOptions({ name: "WxChannelsSettingTab" });

type WxChannelsConfig = {
  appId: string;
  appSecret: string;
  apiBase: string;
  tokenUrl: string;
};


const defaultConfig = (): WxChannelsConfig => ({
  appId: "",
  appSecret: "",
  apiBase: "",
  tokenUrl: "",
});

const loading = ref(false);
const submitLoading = ref(false);
const configObject = ref(defaultConfig());

function normalizeConfig(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof val === "object") return val as Record<string, unknown>;
  return {};
}

function pickConfigFields(val: unknown): WxChannelsConfig {
  const next = defaultConfig();
  if (!val || typeof val !== "object") return next;
  const src = val as Record<string, unknown>;
  (Object.keys(next) as Array<keyof WxChannelsConfig>).forEach((k) => {
    const v = src[k];
    if (v !== undefined && v !== null) {
      next[k] = String(v);
    }
  });
  return next;
}

function reloadConfig() {
  loading.value = true;
  getSetting("WX_CHANNELS")
    .then((res) => {
      if (res && res.success) {
        const raw = normalizeConfig(res.result);
        configObject.value = pickConfigFields(raw);
      }
    })
    .finally(() => {
      loading.value = false;
    });
}

function submit() {
  submitLoading.value = true;
  setSetting("WX_CHANNELS", configObject.value)
    .then((res) => {
      if (res && res.success) {
        ElMessage.success("保存成功");
        reloadConfig();
      } else {
        ElMessage.error("保存失败");
      }
    })
    .finally(() => {
      submitLoading.value = false;
    });
}

onMounted(() => {
  reloadConfig();
});
</script>

<style scoped lang="scss">
.actions {
  margin-left: 160px;
}
</style>

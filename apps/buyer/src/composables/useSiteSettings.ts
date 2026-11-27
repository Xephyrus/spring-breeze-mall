import { computed, onMounted, ref } from "vue";
import { getBaseSite } from "@/api/common";
import config from "@/config";

/** 站点设置（后端 settingValue 解析后的结构，字段按需取用） */
export interface SiteSettings {
  siteName?: string;
  companyName?: string;
  companyUrl?: string;
  website?: string;
  icp?: string;
  copyrightOwner?: string;
  [key: string]: unknown;
}

/** 站点设置接口返回结构 */
interface SiteSettingResponse {
  success?: boolean;
  result?: { settingValue?: string };
}

// 全局共享站点配置；应用生命周期内仅拉取一次，同页与切页均复用请求与结果。
const settings = ref<SiteSettings | null>(null);
let pendingRequest: Promise<SiteSettings | null> | null = null;

export function loadSiteSettings(): Promise<SiteSettings | null> {
  if (settings.value) {
    return Promise.resolve(settings.value);
  }
  if (!pendingRequest) {
    pendingRequest = (getBaseSite() as unknown as Promise<SiteSettingResponse>)
      .then((res) => {
        if (res.success && res.result?.settingValue) {
          settings.value = JSON.parse(res.result.settingValue) as SiteSettings;
        }
        return settings.value;
      })
      .catch(() => settings.value)
      .finally(() => {
        pendingRequest = null;
      });
  }
  return pendingRequest;
}

export function useSiteSettings() {
  onMounted(loadSiteSettings);
  const siteName = computed(() => settings.value?.siteName || config.title);
  const companyName = computed(() =>
    settings.value ? settings.value.companyName || "" : config.company?.name || ""
  );
  const companyUrl = computed(() =>
    settings.value ? settings.value.companyUrl || "" : config.company?.href || ""
  );
  const website = computed(() => (settings.value ? settings.value.website || "" : ""));
  const icp = computed(() => (settings.value ? settings.value.icp || "" : config.icpMessage || ""));
  const copyrightOwner = computed(
    () => settings.value?.copyrightOwner?.trim() || siteName.value
  );
  return { settings, siteName, companyName, companyUrl, website, icp, copyrightOwner };
}

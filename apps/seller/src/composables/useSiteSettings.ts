import { computed, onMounted, ref, type ComputedRef, type Ref } from "vue";
import { getBaseSite } from "@/api/common";
import config from "@/config";

/** 站点设置（后台「平台设置 → 基础设置」的 settingValue JSON） */
export interface SiteSettings {
  siteName?: string;
  companyName?: string;
  companyUrl?: string;
  website?: string;
  icp?: string;
  copyrightOwner?: string;
  [key: string]: unknown;
}

// 同页的页头、页脚共享请求；每次重新进入页面时刷新，避免旧缓存覆盖后台设置
const settings: Ref<SiteSettings | null> = ref(null);
let pendingRequest: Promise<SiteSettings | null> | null = null;

export function loadSiteSettings(): Promise<SiteSettings | null> {
  if (!pendingRequest) {
    pendingRequest = getBaseSite()
      .then((res) => {
        // 后端返回 result.settingValue 是 JSON 字符串；api 层未声明具体结构，这里收窄后解析
        const settingValue = (res.result as { settingValue?: string } | undefined)
          ?.settingValue;
        if (res.success && settingValue) {
          settings.value = JSON.parse(settingValue) as SiteSettings;
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

export interface UseSiteSettings {
  settings: Ref<SiteSettings | null>;
  siteName: ComputedRef<string>;
  companyName: ComputedRef<string>;
  companyUrl: ComputedRef<string>;
  website: ComputedRef<string>;
  icp: ComputedRef<string>;
  copyrightOwner: ComputedRef<string>;
}

export function useSiteSettings(): UseSiteSettings {
  onMounted(loadSiteSettings);
  const siteName = computed(() => settings.value?.siteName || config.title);
  const companyName = computed(() =>
    settings.value
      ? settings.value.companyName || ""
      : config.company?.name || ""
  );
  const companyUrl = computed(() =>
    settings.value ? settings.value.companyUrl || "" : config.company?.href || ""
  );
  const website = computed(() =>
    settings.value ? settings.value.website || "" : config.website || ""
  );
  const icp = computed(() =>
    settings.value ? settings.value.icp || "" : config.icpMessage || ""
  );
  const copyrightOwner = computed(
    () => settings.value?.copyrightOwner?.trim() || siteName.value
  );
  return { settings, siteName, companyName, companyUrl, website, icp, copyrightOwner };
}

/**
 * 平台主题色工具。
 *
 * 主题来源：`buyer-api` 的站点设置接口 → 写入 CSS 变量 → 缓存 1 小时。
 */

/** 主题色配置 */
export interface ThemeSetting {
  themeColor: string;
  lightColor: string;
  aiderLightColor: string;
}

/** 主题接口的返回结构（只用 settingValue） */
export interface ThemeResponse {
  success?: boolean;
  result?: { settingValue?: string };
}

const DEFAULT_THEME: ThemeSetting = {
  themeColor: "#ff3c2a",
  lightColor: "#ff6b35",
  aiderLightColor: "#ff9f28",
};

const STORAGE_KEY = "theme_setting";
const EXPIRATION_KEY = "theme_setting_expiration_time";

export function getDefaultTheme(): ThemeSetting {
  return { ...DEFAULT_THEME };
}

function applyElementColorVars(style: CSSStyleDeclaration, prefix: string, color: string): void {
  const key = `--el-color-${prefix}`;
  style.setProperty(key, color);
  style.setProperty(`${key}-light-3`, `color-mix(in srgb, ${color} 70%, white)`);
  style.setProperty(`${key}-light-5`, `color-mix(in srgb, ${color} 50%, white)`);
  style.setProperty(`${key}-light-7`, `color-mix(in srgb, ${color} 30%, white)`);
  style.setProperty(`${key}-light-8`, `color-mix(in srgb, ${color} 20%, white)`);
  style.setProperty(`${key}-light-9`, `color-mix(in srgb, ${color} 10%, white)`);
  style.setProperty(`${key}-dark-2`, `color-mix(in srgb, ${color} 80%, black)`);
}

export function applyThemeToDocument(theme: Partial<ThemeSetting>): void {
  if (typeof document === "undefined") return;
  const primary = theme.themeColor || DEFAULT_THEME.themeColor;
  const light = theme.lightColor || DEFAULT_THEME.lightColor;
  const aider = theme.aiderLightColor || DEFAULT_THEME.aiderLightColor;
  const root = document.documentElement.style;

  root.setProperty("--theme-color", primary);
  root.setProperty("--theme-light", light);
  root.setProperty("--theme-aider", aider);
  root.setProperty("--theme-tint-12", `color-mix(in srgb, ${primary} 12%, white)`);

  applyElementColorVars(root, "primary", primary);
  // 买家端大量按钮使用 type="danger"，统一映射到主题色
  applyElementColorVars(root, "danger", primary);
}

export function cacheTheme(theme: ThemeSetting): void {
  const expirationTime = new Date().setHours(new Date().getHours() + 1);
  localStorage.setItem(EXPIRATION_KEY, String(expirationTime));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

export function loadCachedTheme(): Partial<ThemeSetting> | null {
  const expirationTime = localStorage.getItem(EXPIRATION_KEY);
  const cacheValid = expirationTime && new Date() <= new Date(Number(expirationTime));
  if (!cacheValid) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<ThemeSetting>) : null;
  } catch {
    return null;
  }
}

export function normalizeTheme(data: Partial<ThemeSetting> = {}): ThemeSetting {
  return {
    themeColor: data.themeColor || DEFAULT_THEME.themeColor,
    lightColor: data.lightColor || DEFAULT_THEME.lightColor,
    aiderLightColor: data.aiderLightColor || DEFAULT_THEME.aiderLightColor,
  };
}

let pendingThemeRequest: Promise<ThemeSetting> | null = null;

/** 拉取并应用主题色；并发调用共用一个请求，失败时回退到缓存或默认主题。 */
export async function fetchAndApplyTheme(
  requestFn: () => Promise<ThemeResponse>
): Promise<ThemeSetting> {
  const cachedTheme = loadCachedTheme();
  if (cachedTheme) {
    applyThemeToDocument(normalizeTheme(cachedTheme));
  }

  if (pendingThemeRequest) {
    return pendingThemeRequest;
  }

  pendingThemeRequest = (async () => {
    try {
      const res = await requestFn();
      if (res?.success && res?.result?.settingValue) {
        const data = JSON.parse(res.result.settingValue) as Partial<ThemeSetting>;
        const normalized = normalizeTheme(data);
        applyThemeToDocument(normalized);
        cacheTheme(normalized);
        return normalized;
      }
    } catch (error) {
      console.warn(
        "[theme] 主题色加载失败，请确认 buyer-api 已启动且站点主题配置可用",
        error
      );
    } finally {
      pendingThemeRequest = null;
    }

    return cachedTheme ? normalizeTheme(cachedTheme) : normalizeTheme();
  })();

  return pendingThemeRequest;
}

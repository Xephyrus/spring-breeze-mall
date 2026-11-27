import Cookies from "js-cookie";
import psl from "psl";

const isClient = typeof window !== "undefined";

/** Cookie 选项（可带 domain），与 js-cookie 的写入/删除共用 */
interface CookieOptions {
  domain?: string;
  [key: string]: unknown;
}

function withCookieDomain(options: CookieOptions = {}): CookieOptions {
  if (!isClient) {
    return options;
  }
  const parsed = psl.parse(document.domain) as { domain?: string; input?: string };
  let domain = parsed.domain;
  if (/\d+\.\d+\.\d+\.\d+/.test(parsed.input ?? "")) domain = parsed.input;
  return { domain, ...options };
}

export default {
  setItem: (key: string, value: string, options: CookieOptions = {}) => {
    Cookies.set(key, value, withCookieDomain(options));
  },
  getItem: (key: string): string | undefined => Cookies.get(key),
  removeItem: (key: string, options: CookieOptions = {}) => {
    Cookies.remove(key, withCookieDomain(options));
  },
};

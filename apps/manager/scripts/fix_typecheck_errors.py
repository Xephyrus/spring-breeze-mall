#!/usr/bin/env python3
"""Fix a batch of manager vue-tsc errors (mechanical patches)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def write(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")
    print(f"updated {path.relative_to(ROOT)}")


def fix_img_fallback() -> None:
    write(
        SRC / "utils/imgFallback.ts",
        '''/**
 * 全局图片加载失败占位：
 * 在捕获阶段监听 <img> 的 error 事件（error 不冒泡），失败时替换为内联 SVG 占位图。
 * - 每张图片只替换一次，占位图自身加载失败不会再次触发，避免死循环
 * - 空 src 不处理
 * - 需要自行处理 error 的图片可添加 data-no-fallback 属性跳过
 */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='#c0c4cc' stroke-width='2' stroke-linejoin='round'>" +
      "<rect width='64' height='64' fill='#f5f7fa' stroke='none'/>" +
      "<rect x='14' y='18' width='36' height='28' rx='3'/>" +
      "<circle cx='25' cy='28' r='3'/>" +
      "<path d='M14 42l10-9 8 7 6-5 12 9'/></svg>"
  );

export function setupImgFallback() {
  document.addEventListener(
    "error",
    (event) => {
      const el = event.target as HTMLElement | null;
      if (!el || el.tagName !== "IMG") return;
      const img = el as HTMLImageElement;
      if (img.dataset.noFallback !== undefined || img.dataset.fallbackApplied) return;
      if (!img.getAttribute("src")) return;
      img.dataset.fallbackApplied = "1";
      img.src = PLACEHOLDER;
    },
    true
  );
}
''',
    )


def fix_use_table() -> None:
    write(
        SRC / "utils/useTable.ts",
        '''import { onMounted, reactive, ref } from "vue";

type TableForm = Record<string, unknown>;

type ParsedPage<T = unknown> = {
  records: T[];
  total: number;
};

type UseTableOptions<T = unknown> = {
  form?: TableForm;
  pageSize?: number;
  sort?: string;
  order?: string;
  immediate?: boolean;
  resolve?: (res: unknown) => ParsedPage<T> | null | undefined;
  beforeRequest?: (params: TableForm) => TableForm;
  onSuccess?: (res: unknown, parsed: ParsedPage<T>) => void;
};

type Fetcher = (params: TableForm) => Promise<unknown> | unknown;

/**
 * 分页列表通用逻辑：loading / data / total / searchForm / 查询 / 重置 / 刷新。
 */
export function useTable<T = unknown>(
  fetcher: Fetcher,
  options: UseTableOptions<T> = {}
) {
  const {
    form = {},
    pageSize = 10,
    sort,
    order,
    immediate = true,
    resolve = defaultResolve,
    beforeRequest,
    onSuccess,
  } = options;

  const loading = ref(false);
  const data = ref<T[]>([]);
  const total = ref(0);

  const initialForm: TableForm = { ...form };
  const searchForm = reactive<TableForm>({
    pageNumber: 1,
    pageSize,
    ...(sort ? { sort } : {}),
    ...(order ? { order } : {}),
    ...form,
  });

  let requestId = 0;

  function getDataList() {
    const current = ++requestId;
    loading.value = true;
    const params = beforeRequest ? beforeRequest({ ...searchForm }) : searchForm;
    return Promise.resolve(fetcher(params))
      .then((res) => {
        if (current !== requestId) return res;
        const parsed = resolve(res);
        if (parsed) {
          data.value = parsed.records || [];
          total.value = parsed.total || 0;
          if (onSuccess) onSuccess(res, parsed);
        }
        return res;
      })
      .finally(() => {
        if (current === requestId) loading.value = false;
      });
  }

  function handleSearch() {
    searchForm.pageNumber = 1;
    return getDataList();
  }

  function resetSearch() {
    Object.assign(searchForm, initialForm);
    return handleSearch();
  }

  function refresh() {
    return getDataList();
  }

  if (immediate) {
    onMounted(getDataList);
  }

  return {
    loading,
    data,
    total,
    searchForm,
    getDataList,
    handleSearch,
    resetSearch,
    refresh,
  };
}

function defaultResolve(res: unknown) {
  const data = res as {
    success?: boolean;
    result?: { records?: unknown[]; total?: number };
  } | null;
  if (data && data.success && data.result) {
    return {
      records: data.result.records || [],
      total: data.result.total || 0,
    };
  }
  return null;
}
''',
    )


def fix_video_style() -> None:
    path = SRC / "views/page-decoration/wap/video-style.ts"
    text = path.read_text(encoding="utf-8")
    if "import type { CSSProperties }" not in text:
        text = "import type { CSSProperties } from \"vue\";\n\n" + text
    text = text.replace(
        """  const box = {
    borderRadius: `${style.bgRadius || 0}px`,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  };""",
        """  const box: CSSProperties = {
    borderRadius: `${style.bgRadius || 0}px`,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  };""",
    )
    write(path, text)


def fix_pc_config_dup_height() -> None:
    path = SRC / "views/page-decoration/pc/config.ts"
    text = path.read_text(encoding="utf-8")
    # Remove duplicate height in video defaultOptions (keep first)
    old = """    defaultOptions: {
      videoUrl: '',
      height: 450,
      coverUrl: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/video/video_cover.png',
      url: '',
      autoPlay: false,
      loop: false,
      controls: true,
      height: 450
    },"""
    new = """    defaultOptions: {
      videoUrl: '',
      height: 450,
      coverUrl: 'https://lilishop-pc.oss-cn-beijing.aliyuncs.com/static/video/video_cover.png',
      url: '',
      autoPlay: false,
      loop: false,
      controls: true,
    },"""
    if old not in text:
        raise SystemExit("pc/config.ts duplicate height block not found")
    text = text.replace(old, new, 1)

    # rowHeight may be string | number from component.defaultRowHeight
    text = text.replace(
        "let rowHeight = DEFAULT_ROW_STYLE.height;",
        "let rowHeight: string | number = DEFAULT_ROW_STYLE.height;",
    )
    # ensure return type accepts it - if DEFAULT_ROW_STYLE.height is number, cast when assigning to rowStyle
    text = text.replace(
        "rowStyle: { ...DEFAULT_ROW_STYLE, height: rowHeight },",
        "rowStyle: { ...DEFAULT_ROW_STYLE, height: Number(rowHeight) || DEFAULT_ROW_STYLE.height },",
    )
    write(path, text)


def main() -> None:
    fix_img_fallback()
    fix_use_table()
    fix_video_style()
    fix_pc_config_dup_height()
    print("done")


if __name__ == "__main__":
    main()

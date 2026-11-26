import type { ApiResult } from "@/types/api";
import { onMounted, reactive, ref } from "vue";

type TableForm = Record<string, any>;

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
export function useTable<T = any>(
  fetcher: Fetcher,
  options: UseTableOptions<T> = {}
) {
  const {
    form = {},
    pageSize = 10,
    sort,
    order,
    immediate = true,
    resolve = defaultResolve as (res: unknown) => ParsedPage<T> | null,
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
    return Promise.resolve(fetcher(params) as unknown as ApiResult)
      .then((res) => {
        if (current !== requestId) return res;
        const parsed = resolve(res);
        if (parsed) {
          data.value = (parsed.records || []) as T[];
          total.value = parsed.total || 0;
          if (onSuccess) onSuccess(res, parsed);
        }
        return res;
      })
      .finally(() => {
        if (current === requestId) loading.value = false;
      });
  }

  /**
   * 切换页码（配合 <TablePager @current-change>）。
   * @param page 目标页码
   */
  function handleCurrentChange(page: number) {
    searchForm.pageNumber = page;
    return getDataList();
  }

  /**
   * 切换每页条数（配合 <TablePager @size-change>）：**页码重置为 1**。
   * @param size 每页条数
   */
  function handleSizeChange(size: number) {
    searchForm.pageSize = size;
    searchForm.pageNumber = 1;
    return getDataList();
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
    handleCurrentChange,
    handleSizeChange,
    handleSearch,
    resetSearch,
    refresh,
  };
}

function defaultResolve<T = unknown>(res: unknown): ParsedPage<T> | null {
  const data = res as {
    success?: boolean;
    result?: { records?: T[]; total?: number };
  } | null;
  if (data && data.success && data.result) {
    return {
      records: data.result.records || [],
      total: data.result.total || 0,
    };
  }
  return null;
}

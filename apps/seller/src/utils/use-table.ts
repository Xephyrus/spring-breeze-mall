import { onMounted, reactive, ref, type Ref, type UnwrapNestedRefs } from "vue";
import type { ResultMessage } from "@spring-breeze/shared";

/** 分页查询参数（pageNumber/pageSize + 业务筛选条件） */
export interface TableSearchForm {
  pageNumber: number;
  pageSize: number;
  sort?: string;
  order?: string;
  [key: string]: unknown;
}

/** 从响应里解析出的表格数据 */
export interface TablePageData<T> {
  records: T[];
  total: number;
}

export interface UseTableOptions<T> {
  /** 查询条件默认值（与分页/排序默认值合并） */
  form?: Record<string, unknown>;
  /** 默认每页条数 */
  pageSize?: number;
  sort?: string;
  order?: string;
  /** 挂载后是否自动查询 */
  immediate?: boolean;
  /** 从响应中取 { records, total }；返回空表示请求失败（保持原数据） */
  resolve?: (res: unknown) => TablePageData<T> | null | undefined;
  /** 请求前加工参数（返回新对象，不影响 searchForm） */
  beforeRequest?: (params: TableSearchForm) => Record<string, unknown>;
  /** 查询成功且数据已更新后回调（仅最后一次请求触发） */
  onSuccess?: (res: unknown, parsed: TablePageData<T>) => void;
}

export interface UseTableReturn<T> {
  loading: Ref<boolean>;
  data: Ref<T[]>;
  total: Ref<number>;
  searchForm: UnwrapNestedRefs<TableSearchForm>;
  getDataList: () => Promise<unknown>;
  handleSearch: () => Promise<unknown>;
  resetSearch: () => Promise<unknown>;
  refresh: () => Promise<unknown>;
}

/**
 * 分页列表通用逻辑：loading / data / total / searchForm / 查询 / 重置 / 刷新。
 *
 * 与 manager 的 `utils/use-table.ts` 语义一致（只采纳最后一次请求的结果，
 * 避免快速切页时旧响应覆盖新数据）。
 */
export function useTable<T = Record<string, unknown>>(
  fetcher: (params: Record<string, unknown>) => Promise<ResultMessage<unknown>> | Promise<unknown>,
  options: UseTableOptions<T> = {}
): UseTableReturn<T> {
  const {
    form = {},
    pageSize = 10,
    sort,
    order,
    immediate = true,
    resolve = defaultResolve as (res: unknown) => TablePageData<T> | null,
    beforeRequest,
    onSuccess,
  } = options;

  const loading = ref(false);
  const data = ref([]) as Ref<T[]>;
  const total = ref(0);

  const initialForm = { ...form };
  const searchForm = reactive<TableSearchForm>({
    pageNumber: 1,
    pageSize,
    ...(sort ? { sort } : {}),
    ...(order ? { order } : {}),
    ...form,
  });

  // 只采纳最后一次请求的结果
  let requestId = 0;

  function getDataList(): Promise<unknown> {
    const current = ++requestId;
    loading.value = true;
    const params: Record<string, unknown> = beforeRequest
      ? beforeRequest({ ...searchForm })
      : { ...searchForm };
    return Promise.resolve(fetcher(params))
      .then((res) => {
        if (current !== requestId) return res;
        const parsed = resolve(res);
        if (parsed) {
          data.value = (parsed.records ?? []) as T[];
          total.value = parsed.total ?? 0;
          if (onSuccess) onSuccess(res, parsed);
        }
        return res;
      })
      .finally(() => {
        if (current === requestId) loading.value = false;
      });
  }

  /** 以当前条件从第 1 页重新查询 */
  function handleSearch(): Promise<unknown> {
    searchForm.pageNumber = 1;
    return getDataList();
  }

  /** 恢复查询条件默认值（保留当前每页条数）并从第 1 页查询 */
  function resetSearch(): Promise<unknown> {
    Object.assign(searchForm, initialForm);
    return handleSearch();
  }

  /** 保持当前页刷新（如删除/修改后） */
  function refresh(): Promise<unknown> {
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

function defaultResolve<T>(res: unknown): TablePageData<T> | null {
  const body = res as ResultMessage<{ records?: T[]; total?: number }> | undefined;
  if (body && body.success && body.result) {
    return { records: body.result.records ?? [], total: body.result.total ?? 0 };
  }
  return null;
}

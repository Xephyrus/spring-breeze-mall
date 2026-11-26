/**
 * 文章 / 内容模块的 VO。
 *
 * 从 `views/page/article-manage/articleEdit.vue`、`articleList.vue` 里搬出来的，
 * 目的是让 `api/pages.ts` 能标注返回类型（见 apps/manager/API-TYPING-PLAN.md）。
 */
export type ArticleForm = {
  openStatus: boolean | string | number;
  title: string;
  categoryId: string | number;
  sort: number | string;
  content: string;
  id: string | number;
};

export type ArticleDetail = Partial<ArticleForm> & {
  /** 后端会扩容 */
  [key: string]: unknown;
};

export type ArticleRow = {
  id?: string | number;
  title?: string;
  openStatus?: boolean;
  [key: string]: unknown;
};

/** 装修页面数据（pageData 是 JSON 字符串，前端 safeParse 后使用） */
export type PageDataDetail = {
  id?: string | number;
  name?: string;
  pageData?: string;
  pageType?: string;
  pageClientType?: string;
  pageShow?: string;
  [key: string]: unknown;
};

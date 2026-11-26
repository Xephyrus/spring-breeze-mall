<template>
  <div class="tpl-article" :class="{ styled: styled }" :style="wrapperStyle">
    <div class="article-title" v-if="title">{{ title }}</div>
    <template v-if="articleList.length">
      <div class="article-item" v-for="item in articleList" :key="item.id">
        <div class="article-text">
          <div class="article-name" :style="nameStyle">{{ item.title }}</div>
          <div class="article-time" v-if="item.createTime">{{ item.createTime }}</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="article-item" v-for="i in 3" :key="i">
        <div class="article-text">
          <div class="article-name" :style="nameStyle">文章标题示例文章标题示例</div>
        </div>
        <div class="article-thumb"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { hasPanelStyle } from "./panel-style";
import { ref, computed, onMounted, watch, type CSSProperties } from "vue";
import { getArticle } from "@/api/pages";
import type { CubeStyleRes, WapTemplateRes } from "../../types";

defineOptions({ name: "tpl_article" });

/** 文章项（接口返回） */
type ArticleItem = {
  id?: string | number;
  title?: string;
  createTime?: string;
};

/** 文章模板 list[0] 的配置项 */
type ArticleConfig = {
  title?: string;
  count?: number;
  categoryId?: string;
};

type ArticleRes = WapTemplateRes &
  CubeStyleRes & {
    /** 老数据字段 */
    bgColor?: string;
    titleColor?: string;
    list?: ArticleConfig[];
  };

const props = defineProps<{ res: ArticleRes }>();

const articleList = ref<ArticleItem[]>([]);

const first = computed<ArticleConfig>(() => props.res.list?.[0] ?? {});
const title = computed(() => first.value.title || "");
const count = computed(() => first.value.count || 3);
const categoryId = computed(() => first.value.categoryId || "");

// 面板保存过样式字段才启用自定义样式，老数据保持原样
const styled = computed(() => hasPanelStyle(props.res));

const px = (v: unknown) => `${(Number(v) || 0) / 2}px`;

const nameStyle = computed<CSSProperties>(() =>
  styled.value && props.res.titleColor ? { color: props.res.titleColor } : {}
);

const wrapperStyle = computed<CSSProperties>(() => {
  const res = props.res;
  if (!styled.value) {
    return {
      background: res.bgColor || "#FFFFFF",
      padding: `10px ${res.paddingX || 0}px`,
      marginBottom: `${res.pageGap !== undefined ? res.pageGap : 0}px`,
      borderRadius: `${res.borderRadius || 0}px`,
      overflow: "hidden",
    };
  }
  const bg =
    !res.bgColor2 || res.bgColor1 === res.bgColor2
      ? res.bgColor1
      : `linear-gradient(180deg, ${res.bgColor1}, ${res.bgColor2})`;
  return {
    background: bg,
    padding: `${px(res.paddingTop)} ${px(res.paddingX)} ${px(res.paddingBottom)}`,
    marginBottom: px(res.pageGap),
    borderRadius: px(res.borderRadius),
    overflow: Number(res.borderRadius) > 0 ? "hidden" : "visible",
    display: "flex",
    flexDirection: "column",
    rowGap: px(res.contentGap),
  };
});

function loadArticles() {
  const limit = count.value;
  const params: Record<string, unknown> = { pageNumber: 1, pageSize: limit };
  if (categoryId.value) {
    params.categoryId = categoryId.value;
  }
  getArticle(params)
    .then((res) => {
      const records = res?.result?.records;
      articleList.value = Array.isArray(records) ? records.slice(0, limit) : [];
    })
    .catch(() => {
      articleList.value = [];
    });
}

onMounted(() => {
  loadArticles();
});

// 分类或数量变化时重新拉取，避免面板改了配置预览不更新
watch([categoryId, count], () => {
  loadArticles();
});
</script>

<style scoped lang="scss">
.article-title {
  font-size: 15px;
  font-weight: 600;
  padding: 4px 12px 10px;
}
.article-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #f5f5f5;
}
.tpl-article.styled .article-item {
  border-top: none;
  padding: 0;
}
.article-text {
  flex: 1;
  min-width: 0;
}
.article-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.article-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
.article-thumb {
  width: 56px;
  height: 42px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-left: 10px;
  flex-shrink: 0;
}
</style>

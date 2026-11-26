<template>
  <div>
    <el-card>
      <template #header>
        <span>{{ isEdit ? "编辑文章" : "添加文章" }}</span>
      </template>
      <el-form ref="formRef" :model="form" label-width="100px" :rules="formValidate">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="form.title" clearable style="width: 40%" />
        </el-form-item>
        <el-form-item label="文章分类" prop="categoryId">
          <el-tree-select
            v-model="form.categoryId"
            :data="treeData"
            :props="{ label: 'title', children: 'children' }"
            placeholder="请选择"
            clearable
            check-strictly
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="文章排序" prop="sort">
          <el-input v-model="form.sort" type="number" clearable style="width: 10%" />
        </el-form-item>
        <el-form-item class="form-item-view-el" label="文章内容" prop="content">
          <tinymec v-if="!loading" ref="editor" open-xss v-model="form.content" />
        </el-form-item>
        <el-form-item label="是否展示" prop="openStatus">
          <el-switch
            v-model="form.openStatus"
            inline-prompt
            active-text="展示"
            inactive-text="隐藏"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { ArticleForm } from "@/types/vo/page";
import type { CategoryNode } from "@/types/vo/common";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getArticleCategory,
  saveArticle,
  updateArticle,
  seeArticle,
} from "@/api/pages";
import tinymec from "@/components/editor/index.vue";
import { regular } from "@/utils/index";
import { ElMessage } from "element-plus";
import type { FormInstance, FormItemRule } from "element-plus";


type TreeOption = {
  title?: string;
  value?: string | number;
  children?: TreeOption[];
};




type EditorExpose = { getContent?: () => string };

const validateArticleContent: FormItemRule["validator"] = (_rule, value, callback) => {
  const html = String(value || "").trim();
  if (!html) {
    callback(new Error("请填写文章内容"));
    return;
  }
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  const hasImage = /<img[\s>]/i.test(html);
  if (!text && !hasImage) {
    callback(new Error("请填写文章内容"));
    return;
  }
  callback();
};

defineOptions({ name: "articleEdit" });

const route = useRoute();
const router = useRouter();

const formRef = ref<FormInstance | null>(null);
const editor = ref<EditorExpose | null>(null);
const loading = ref(false);
const submitLoading = ref(false);
const treeData = ref<TreeOption[]>([]);
const form = ref<ArticleForm>({
  openStatus: false,
  title: "",
  categoryId: "",
  sort: 1,
  content: "",
  id: "",
});
const formValidate = ref({
  title: [{ required: true, message: "请输入文章标题", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择文章分类", trigger: "change" }],
  sort: [regular.REQUIRED, regular.INTEGER],
  content: [{ required: true, validator: validateArticleContent, trigger: "change" }],
});

const isEdit = ref(!!route.query.id);

function getTree(tree: CategoryNode[] = []): TreeOption[] {
  const arr: TreeOption[] = [];
  if (!!tree && tree.length !== 0) {
    tree.forEach((item) => {
      const obj: TreeOption = {};
      obj.title = item.articleCategoryName;
      obj.value = item.id;
      obj.children = getTree(item.children);
      arr.push(obj);
    });
  }
  return arr;
}
function getCategoryTree() {
  getArticleCategory().then((res) => {
    if (res.success) {
      treeData.value = getTree(res.result || []);
    }
  });
}
function getDetail(id: string | number) {
  loading.value = true;
  seeArticle(id)
    .then((res) => {
      if (res.result) {
        form.value.categoryId = res.result.categoryId ?? "";
        form.value.id = id;
        form.value.content = res.result.content || "";
        form.value.title = res.result.title || "";
        form.value.sort = res.result.sort ?? 1;
        form.value.openStatus = !!res.result.openStatus;
      }
    })
    .finally(() => {
      loading.value = false;
    });
}
function handleSubmit() {
  if (editor.value?.getContent) {
    form.value.content = editor.value.getContent();
  }
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    const request = isEdit.value ? updateArticle(form.value) : saveArticle(form.value);
    request
      .then((res) => {
        if (res.success) {
          ElMessage.success("操作成功");
          goBack();
        }
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
}
function goBack() {
  router.back();
}

onMounted(() => {
  getCategoryTree();
  if (isEdit.value) {
    const id = Array.isArray(route.query.id) ? route.query.id[0] : route.query.id;
    if (id) getDetail(id);
  }
});
</script>

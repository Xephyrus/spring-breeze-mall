<template>
  <div class="search">
    <el-card>
      <div class="operation padding-row">
        <el-button type="primary" @click="openAdd">添加客户等级</el-button>
      </div>

      <el-table v-loading="loading" border :data="data" class="mt_10" style="width: 100%">
        <el-table-column prop="gradeName" label="等级名称" width="130" show-overflow-tooltip />
        <el-table-column label="默认等级" width="95">
          <template #default="{ row }">
            <el-tag v-if="row" :type="row.isDefault === true ? 'success' : 'info'">
              {{ row.isDefault === true ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="等级图标" width="100">
          <template #default="{ row }">
            <span v-if="row && !row.gradeImage">-</span>
            <img
              v-else-if="row"
              :src="row.gradeImage"
              alt="等级图标"
              style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #dcdee2; border-radius: 4px; background: #fff"
            />
          </template>
        </el-table-column>
        <el-table-column label="等级背景图" width="120">
          <template #default="{ row }">
            <span v-if="row && !row.gradeBackground">-</span>
            <img
              v-else-if="row"
              :src="row.gradeBackground"
              alt="等级背景图"
              style="width: 64px; height: 40px; object-fit: cover; border: 1px solid #dcdee2; border-radius: 4px; background: #fff"
            />
          </template>
        </el-table-column>
        <el-table-column prop="requiredExperience" label="所需经验值" width="110" />
        <el-table-column prop="gradeSort" label="等级排序" width="95" />
        <el-table-column label="状态" width="118" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="row"
              :model-value="row.gradeState === 'OPEN'"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
              :loading="!!row._gradeStateLoading"
              @change="(checked: string | number | boolean) => onGradeStateSwitch(row, Boolean(checked))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <div v-if="row" class="ops" style="display: flex; justify-content: center">
              <a class="link-text" @click="openEdit(row)">编辑</a>
              <span class="op-split">|</span>
              <a class="link-text" @click="remove(row)">删除</a>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addFlag" title="添加客户等级" width="720px" :z-index="950" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="addForm" :model="formAdd" :rules="rules" label-width="110px">
        <el-form-item label="等级名称" prop="gradeName">
          <el-input v-model="formAdd.gradeName" maxlength="50" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-radio-group v-model="formAdd.isDefault">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="等级图标" prop="gradeImage">
          <upload-pic-input v-model="formAdd.gradeImage" />
          <div class="image-size-hint">推荐 100 × 100 像素，使用透明背景 PNG。</div>
        </el-form-item>
        <el-form-item label="等级背景图" prop="gradeBackground">
          <upload-pic-input v-model="formAdd.gradeBackground" />
          <div class="image-size-hint">推荐 750 × 460 像素</div>
        </el-form-item>
        <el-form-item label="字体颜色" prop="gradeFontColor">
          <el-input v-model="formAdd.gradeFontColor" maxlength="20" placeholder="如：#333333" />
        </el-form-item>
        <el-form-item label="所需经验值" prop="requiredExperience">
          <el-input-number v-model="formAdd.requiredExperience" :min="1" :precision="0" style="width: 220px" />
        </el-form-item>
        <el-form-item label="等级排序" prop="gradeSort">
          <el-input-number v-model="formAdd.gradeSort" :min="1" :max="9999" :precision="0" style="width: 220px" />
        </el-form-item>
        <el-form-item label="等级开关" prop="gradeState">
          <el-radio-group v-model="formAdd.gradeState">
            <el-radio value="OPEN">开启</el-radio>
            <el-radio value="CLOSE">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联权益" prop="benefitIds">
          <el-select
            :model-value="addBenefitOrder"
            multiple
            filterable
            placeholder="请选择客户权益"
            style="width: 100%"
            @change="onAddBenefitIdsChange"
          >
            <el-option
              v-for="b in benefitOptions"
              :key="b.id"
              :value="String(b.id)"
              :label="benefitOptionLabel(b)"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFlag = false">取消</el-button>
        <el-button type="primary" :loading="submitAddLoading" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editFlag" title="编辑客户等级" width="720px" :z-index="950" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="editForm" :model="formEdit" :rules="rules" label-width="110px">
        <el-input v-model="formEdit.id" style="display: none" />
        <el-form-item label="等级名称" prop="gradeName">
          <el-input v-model="formEdit.gradeName" maxlength="50" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-radio-group v-model="formEdit.isDefault">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="等级图标" prop="gradeImage">
          <upload-pic-input v-model="formEdit.gradeImage" />
          <div class="image-size-hint">推荐 100 × 100 像素，使用透明背景 PNG。</div>
        </el-form-item>
        <el-form-item label="等级背景图" prop="gradeBackground">
          <upload-pic-input v-model="formEdit.gradeBackground" />
          <div class="image-size-hint">推荐 750 × 460 像素</div>
        </el-form-item>
        <el-form-item label="字体颜色" prop="gradeFontColor">
          <el-input v-model="formEdit.gradeFontColor" maxlength="20" placeholder="如：#333333" />
        </el-form-item>
        <el-form-item label="所需经验值" prop="requiredExperience">
          <el-input-number v-model="formEdit.requiredExperience" :min="1" :precision="0" style="width: 220px" />
        </el-form-item>
        <el-form-item label="等级排序" prop="gradeSort">
          <el-input-number v-model="formEdit.gradeSort" :min="1" :max="9999" :precision="0" style="width: 220px" />
        </el-form-item>
        <el-form-item label="等级开关" prop="gradeState">
          <el-radio-group v-model="formEdit.gradeState">
            <el-radio value="OPEN">开启</el-radio>
            <el-radio value="CLOSE">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联权益" prop="benefitIds">
          <el-select
            :model-value="editBenefitOrder"
            multiple
            filterable
            placeholder="请选择客户权益"
            style="width: 100%"
            @change="onEditBenefitIdsChange"
          >
            <el-option
              v-for="b in benefitOptions"
              :key="b.id"
              :value="String(b.id)"
              :label="benefitOptionLabel(b)"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editFlag = false">取消</el-button>
        <el-button type="primary" :loading="submitEditLoading" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import * as API_Member from "@/api/member";
import uploadPicInput from "@/components/lili/upload-pic-input.vue";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({ name: "memberGrade" });

const buildDefaultForm = (): GradeForm => ({
  id: "",
  gradeName: "",
  isDefault: false,
  gradeImage: "",
  gradeBackground: "",
  gradeFontColor: "",
  requiredExperience: 1,
  gradeSort: 1,
  gradeState: "OPEN",
  benefitIds: "",
});

/** el-form 实例（只声明本页用到的能力） */
type FormInstance = {
  validate: (callback?: (valid: boolean) => void) => void;
  resetFields?: () => void;
  clearValidate?: () => void;
};

/** 会员等级行 */
type GradeRow = {
  id?: string | number;
  gradeName?: string;
  gradeImage?: string;
  gradeBackground?: string;
  gradeFontColor?: string;
  requiredExperience?: number;
  gradeSort?: number;
  gradeState?: string;
  isDefault?: boolean;
  benefitIds?: string;
  benefitList?: BenefitOption[];
  /** 行内开关的 loading 标记（仅前端用） */
  _gradeStateLoading?: boolean;
};

/** 权益下拉项 */
type BenefitOption = {
  id?: string | number;
  benefitName?: string;
  benefitType?: string;
};

/** 权益类型下拉项 */
type BenefitTypeOption = {
  value: string;
  description?: string;
};

/** 等级表单 */
type GradeForm = {
  id?: string | number;
  gradeName: string;
  /** el-switch 的值域是 string | number | boolean */
  isDefault: boolean | string | number | undefined;
  gradeImage: string;
  gradeBackground: string;
  gradeFontColor: string;
  /** el-input-number 可能写 undefined */
  requiredExperience: number | undefined;
  gradeSort: number | undefined;
  /** el-select / el-radio-group 的值域 */
  gradeState: string | number | boolean | undefined;
  benefitIds: string;
};

function syncOrderedBenefitIds(prevOrder: Array<string | number>, selected: unknown) {
  const sel = Array.isArray(selected) ? selected.map((id) => String(id)) : [];
  const out: string[] = [];
  (prevOrder || []).forEach((id) => {
    const text = String(id);
    if (sel.includes(text)) out.push(text);
  });
  sel.forEach((text) => {
    if (!out.includes(text)) out.push(text);
  });
  return out;
}

// 模板 el-form 的 ref（ref="addForm" / ref="editForm"）
const addForm = ref<FormInstance | null>(null);
const editForm = ref<FormInstance | null>(null);

const loading = ref(true);
const data = ref<GradeRow[]>([]);
const addFlag = ref(false);
const editFlag = ref(false);
const submitAddLoading = ref(false);
const submitEditLoading = ref(false);
const formAdd = ref<GradeForm>(buildDefaultForm());
const formEdit = ref<GradeForm>(buildDefaultForm());
const addBenefitOrder = ref<string[]>([]);
const editBenefitOrder = ref<string[]>([]);
const benefitOptions = ref<BenefitOption[]>([]);
const benefitTypeOptions = ref<BenefitTypeOption[]>([]);
const benefitOptionsLoading = ref(false);
const editDetailLoading = ref(false);
const rules = ref({
  gradeName: [{ required: true, message: "请输入等级名称", trigger: "blur" }],
  gradeImage: [{ required: true, message: "请上传等级图标", trigger: "change" }],
  requiredExperience: [{ required: true, type: "number", message: "请输入所需经验值", trigger: "change" }],
  gradeSort: [{ required: true, type: "number", message: "请输入等级排序", trigger: "change" }],
  gradeState: [{ required: true, message: "请选择等级开关", trigger: "change" }],
});

function benefitOptionLabel(b?: BenefitOption) {
  if (!b) return "";
  const name = b.benefitName || String(b.id);
  const opt = benefitTypeOptions.value.find((o) => o.value === b.benefitType);
  const typeText = opt ? opt.description : b.benefitType || "";
  return typeText ? `${name}（${typeText}）` : name;
}
function onAddBenefitIdsChange(val: unknown) {
  addBenefitOrder.value = syncOrderedBenefitIds(addBenefitOrder.value, val);
}
function onEditBenefitIdsChange(val: unknown) {
  editBenefitOrder.value = syncOrderedBenefitIds(editBenefitOrder.value, val);
}
function loadBenefitTypes() {
  API_Member.getMemberBenefitTypes().then((res) => {
    if (res && res.success && Array.isArray(res.result)) {
      benefitTypeOptions.value = (res.result ?? []) as unknown as typeof benefitTypeOptions.value;
    } else {
      benefitTypeOptions.value = [];
    }
  });
}
function loadBenefitOptions() {
  benefitOptionsLoading.value = true;
  const pageSize = 500;
  const fetchPage = (pageNumber: number) =>
    API_Member.getMemberBenefitByPage({ pageNumber, pageSize, sort: "benefitSort", order: "asc" });
  return fetchPage(1)
    .then((res) => {
      if (!(res && res.success && res.result)) {
        benefitOptions.value = [];
        return;
      }
      const records = Array.isArray(res.result.records) ? res.result.records : [];
      const total = Number(res.result.total) || records.length;
      let all = records.slice();
      if (total > pageSize) {
        const pages = Math.ceil(total / pageSize);
        const rest: Promise<unknown>[] = [];
        for (let p = 2; p <= pages; p++) {
          rest.push(fetchPage(p));
        }
        return Promise.all(rest).then((results) => {
          results.forEach((r) => {
            const page = r as {
              success?: boolean;
              result?: { records?: GradeRow[] };
            } | null;
            if (page && page.success && page.result && Array.isArray(page.result.records)) {
              all = all.concat(page.result.records);
            }
          });
          benefitOptions.value = all;
        });
      }
      benefitOptions.value = all;
    })
    .catch(() => {
      benefitOptions.value = [];
    })
    .finally(() => {
      benefitOptionsLoading.value = false;
    });
}
function parseBenefitIdsFromString(str?: string) {
  return String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function fillEditFormFromGrade(grade: GradeRow, benefitsOrderedIds?: Array<string | number>) {
  formEdit.value = {
    id: grade.id || "",
    gradeName: grade.gradeName || "",
    isDefault: grade.isDefault === true,
    gradeImage: grade.gradeImage || "",
    gradeBackground: grade.gradeBackground || "",
    gradeFontColor: grade.gradeFontColor || "",
    requiredExperience: Number(grade.requiredExperience) > 0 ? Number(grade.requiredExperience) : 1,
    gradeSort: Number(grade.gradeSort) > 0 ? Number(grade.gradeSort) : 1,
    gradeState: grade.gradeState || "OPEN",
    benefitIds: grade.benefitIds || "",
  };
  editBenefitOrder.value = (benefitsOrderedIds || []).map((id) => String(id));
}
function init() {
  getData();
  loadBenefitTypes();
  loadBenefitOptions();
}
function getData() {
  loading.value = true;
  API_Member.getMemberGradeByPage().then((res) => {
    loading.value = false;
    if (res && res.success) {
      data.value = Array.isArray(res.result) ? res.result : [];
    }
  });
}
function openAdd() {
  addFlag.value = true;
  submitAddLoading.value = false;
  if (!benefitOptions.value.length && !benefitOptionsLoading.value) {
    loadBenefitOptions();
  }
  nextTick(() => {
    addForm.value?.resetFields?.();
    formAdd.value = buildDefaultForm();
    addBenefitOrder.value = [];
  });
}
function submitAdd() {
  addForm.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitAddLoading.value = true;
    const { benefitIds: _omit, ...rest } = formAdd.value;
    const payload = {
      ...rest,
      benefitIds: (addBenefitOrder.value || []).join(","),
    };
    API_Member.addMemberGrade(payload)
      .then((res) => {
        if (res && res.success) {
          ElMessage.success("添加成功");
          addFlag.value = false;
          getData();
        } else {
          ElMessage.error(res?.message || "添加失败");
        }
      })
      .catch(() => {
        ElMessage.error("添加失败，请稍后重试");
      })
      .finally(() => {
        // 无论成功/失败/异常都必须复位，否则按钮会一直转圈
        submitAddLoading.value = false;
      });
  });
}
/** 列表行的 id 一定存在（后端主键），集中收窄一次 */
function gradeIdOf(row: GradeRow): string | number {
  return row.id as string | number;
}

function openEdit(row: GradeRow) {
  editFlag.value = true;
  submitEditLoading.value = false;
  editDetailLoading.value = true;
  if (!benefitOptions.value.length && !benefitOptionsLoading.value) {
    loadBenefitOptions();
  }
  nextTick(() => {
    editForm.value?.resetFields?.();
  });
  API_Member.getMemberGrade(gradeIdOf(row))
    .then((res) => {
      editDetailLoading.value = false;
      if (res && res.success && res.result) {
        const raw = res.result;
        const grade = raw.grade != null ? raw.grade : raw;
        const benefits = (Array.isArray(raw.benefits) ? raw.benefits : []) as Array<{
          id?: string | number;
        }>;
        const orderedIds: Array<string | number> = benefits.length
          ? benefits
              .map((b) => b.id)
              .filter((id): id is string | number => id != null && id !== "")
          : String((grade as { benefitIds?: string | number }).benefitIds ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter((s): s is string => Boolean(s));
        fillEditFormFromGrade(grade, orderedIds);
      } else {
        fillEditFormFromGrade(row, parseBenefitIdsFromString(row.benefitIds));
      }
    })
    .catch(() => {
      editDetailLoading.value = false;
      fillEditFormFromGrade(row, parseBenefitIdsFromString(row.benefitIds));
    });
}
function submitEdit() {
  editForm.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitEditLoading.value = true;
    const { id, benefitIds: _omit, ...rest } = formEdit.value;
    const payload = {
      ...rest,
      benefitIds: (editBenefitOrder.value || []).join(","),
    };
    API_Member.updateMemberGrade(id as string | number, payload)
      .then((res) => {
        if (res && res.success) {
          ElMessage.success("修改成功");
          editFlag.value = false;
          getData();
        } else {
          ElMessage.error(res?.message || "修改失败");
        }
      })
      .catch(() => {
        ElMessage.error("修改失败，请稍后重试");
      })
      .finally(() => {
        submitEditLoading.value = false;
      });
  });
}
function onGradeStateSwitch(row: GradeRow, checked: boolean) {
  const nextState = checked ? "OPEN" : "CLOSE";
  const prevState = row.gradeState;
  if (nextState === prevState) return;
  const text = checked ? "开启" : "关闭";
  ElMessageBox.confirm(`确定${text}该客户等级？`, "提示", { type: "warning" }).then(() => {
    row._gradeStateLoading = true;
    return API_Member.updateMemberGradeState(gradeIdOf(row), nextState)
      .then((res) => {
        row._gradeStateLoading = false;
        if (res && res.success) {
          ElMessage.success(`${text}成功`);
          row.gradeState = nextState;
        } else {
          getData();
        }
      })
      .catch(() => {
        row._gradeStateLoading = false;
      });
  }).catch(() => {});
}
function remove(row: GradeRow) {
  ElMessageBox.confirm("确定删除该客户等级？", "提示", { type: "warning" }).then(() => {
    API_Member.deleteMemberGrade(gradeIdOf(row)).then((res) => {
      if (res && res.success) {
        ElMessage.success("删除成功");
        getData();
      } else if (res && res.message) {
        ElMessage.error(res.message);
      }
    });
  }).catch(() => {});
}

onMounted(() => {
  init();
});
</script>
<style scoped>
.image-size-hint {
  width: 100%;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}
.ops a {
  color: #2d8cf0;
  cursor: pointer;
  text-decoration: none;
}
.ops span {
  display: inline-block;
  margin: 0 8px;
  color: #dcdee2;
}
</style>

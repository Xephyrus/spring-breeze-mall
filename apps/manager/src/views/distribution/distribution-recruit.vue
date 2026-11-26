<template>
  <div class="distribution-recruit" style="background-color: #fff; padding: 10px">
    <el-form
      ref="planFormRef"
      :model="planForm"
      label-width="160px"
      label-position="right"
      label-suffix="："
    >
      <el-divider content-position="left">招募设置</el-divider>
      <el-form-item label="分销员加入条件">
        <div class="join-condition-wrap">
          <el-radio-group v-model="planForm.joinConditionType">
            <el-radio value="NONE">无条件</el-radio>
            <el-radio value="CONDITIONAL">有条件</el-radio>
          </el-radio-group>
          <div v-if="planForm.joinConditionType === 'CONDITIONAL'" class="join-condition-block">
          <div class="join-condition-item">
            <el-checkbox v-model="planForm.requirePurchaseGoods">需购买指定商品</el-checkbox>
            <div v-if="planForm.requirePurchaseGoods" class="join-condition-detail">
              <div class="form-desc">
                注：请确保以下商品已上架。若配置前已购买任一指定商品的用户则已经满足条件，无需再次购买。
              </div>
              <div class="goods-toolbar">
                <a class="link-btn" @click.prevent="openGoodsSelect">选择商品</a>
              </div>
              <el-table
                v-if="recruitGoodsList.length"
                border
                :data="recruitGoodsList"
                class="recruit-goods-table"
              >
                <el-table-column label="商品图" width="90" align="center">
                  <template #default="{ row }">
                    <img
                      v-if="row.thumbnail"
                      :src="row.thumbnail"
                      alt="商品图"
                      class="recruit-goods-thumb"
                    />
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="商品名称" min-width="200">
                  <template #default="{ row }">
                    <div class="recruit-goods-name">{{ row.goodsName }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="sn" label="商品编码" min-width="120" show-overflow-tooltip />
                <el-table-column label="SKU信息" min-width="140" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ row.simpleSpecs ? row.simpleSpecs.trim() : "-" }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="90" align="center">
                  <template #default="{ $index }">
                    <a class="link-btn delete-btn" @click.prevent="removeRecruitGoods($index)">删除</a>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <div class="join-condition-item">
            <el-checkbox v-model="planForm.requireSelfPurchaseAmount">
              自购金额满
              <el-input-number
                v-model="planForm.minSelfPurchaseAmount"
                :min="0.01"
                :precision="2"
                :disabled="!planForm.requireSelfPurchaseAmount"
                controls-position="right"
                class="inline-number"
              />
              元
            </el-checkbox>
            <div class="form-desc join-condition-desc">
              客户支付后即计入自购金额，自购金额最低设置为0.01元。
            </div>
          </div>
          <div class="join-condition-item">
            <el-checkbox v-model="planForm.requireConsumeCount">
              消费笔数满
              <el-input-number
                v-model="planForm.minConsumeCount"
                :min="1"
                :precision="0"
                :disabled="!planForm.requireConsumeCount"
                controls-position="right"
                class="inline-number"
              />
              笔
            </el-checkbox>
            <div class="form-desc join-condition-desc">
              客户支付后即计入消费笔数，消费笔数最低设置为1笔。
            </div>
          </div>
        </div>
        </div>
      </el-form-item>
      <el-form-item label="分销员申请方式" required>
        <div class="apply-mode-block">
          <el-radio-group v-model="planForm.applyMode">
            <el-radio value="MANUAL">手动申请</el-radio>
            <el-radio value="AUTO">满足条件自动申请</el-radio>
          </el-radio-group>
          <div v-if="planForm.applyMode === 'AUTO'" class="form-desc">
            达标后系统自动提交申请。若配置了分销推广服务协议，系统将视为已同意。
          </div>
          <div v-if="planForm.applyMode === 'MANUAL'" class="manual-apply-extra">
            <el-checkbox v-model="planForm.requireApplyInfo">需要填写申请信息</el-checkbox>
            <div class="form-desc">申请人需填写对应字段，方便审核分销员信息。</div>
            <template v-if="planForm.requireApplyInfo">
              <div class="recruit-field-toolbar">
                <a class="link-btn" @click.prevent="addRecruitField">+ 添加字段</a>
              </div>
              <div
                v-for="(field, index) in recruitFields"
                :key="field._key"
                class="recruit-field-row"
              >
                <div class="recruit-field-row-main">
                  <span class="field-label">字段{{ index + 1 }}：</span>
                  <el-input
                    v-model="field.fieldName"
                    placeholder="如：姓名"
                    maxlength="64"
                    style="width: 200px"
                  />
                  <el-select v-model="field.fieldType" style="width: 140px; margin-left: 8px">
                    <el-option
                      v-for="item in fieldTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <a class="link-btn delete-btn" @click.prevent="removeRecruitField(index)">删除字段</a>
                </div>
                <div class="recruit-field-row-required">
                  <el-radio-group v-model="field.required">
                    <el-radio :value="true">必填</el-radio>
                    <el-radio :value="false">选填</el-radio>
                  </el-radio-group>
                </div>
              </div>
            </template>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="审核方式">
        <el-radio-group v-model="planForm.auditMode">
          <el-radio value="MANUAL">人工审核</el-radio>
          <el-radio value="AUTO_PASS">无需审核（满足条件自动通过）</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="展示线上招募入口">
        <el-radio-group v-model="planForm.onlineEntryVisible">
          <el-radio :value="true">展示</el-radio>
          <el-radio :value="false">不展示</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="招募海报">
        <div class="recruit-poster-block">
          <div v-if="planForm.posterBackground" class="poster-preview-wrap">
            <img :src="planForm.posterBackground" alt="招募海报" class="poster-thumb" />
          </div>
          <upload-pic-input v-model="planForm.posterBackground" :show-input="false" />
        </div>
      </el-form-item>
      <el-form-item label="分销推广服务协议">
        <editor v-if="editorReady" ref="agreementEditor" open-xss v-model="planForm.agreementContent" />
        <div v-if="planForm.applyMode === 'AUTO'" class="form-desc">
          自动申请模式下，达标后系统自动提交并视为已同意协议。
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="planSaveLoading" @click="savePlan">保存</el-button>
      </el-form-item>
    </el-form>
    <sku-select ref="skuSelectRef" @selectedGoodsData="selectedGoodsData" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  getCurrentRecruitPlan,
  saveRecruitPlan,
} from "@/api/distribution";
import { ElMessage } from "element-plus";
import type { CheckboxValueType } from "element-plus";
import uploadPicInput from "@/components/lili/upload-pic-input.vue";
import editor from "@/components/editor/index.vue";
import skuSelect from "@/components/lili-dialog/index.vue";

defineOptions({ name: "distributionRecruit" });

const MAX_RECRUIT_FIELDS = 5;

const FIELD_TYPE_OPTIONS = [
  { value: "NAME", label: "姓名格式" },
  { value: "MOBILE", label: "手机号格式" },
  { value: "IMAGE", label: "图片格式" },
  { value: "GENDER", label: "性别格式" },
];

const buildDefaultPlan = () => ({
  id: "" as string | number,
  planVersion: null as number | null,
  publishStatus: false as CheckboxValueType,
  joinConditionType: "NONE" as string | number | boolean | undefined,
  applyMode: "MANUAL" as string | number | boolean | undefined,
  auditMode: "MANUAL" as string | number | boolean | undefined,
  onlineEntryVisible: true as string | number | boolean | undefined,
  requireApplyInfo: false as CheckboxValueType,
  agreementContent: "",
  requirePurchaseGoods: false as CheckboxValueType,
  requireSelfPurchaseAmount: false as CheckboxValueType,
  requireConsumeCount: false as CheckboxValueType,
  minSelfPurchaseAmount: 0.01 as number | undefined,
  minConsumeCount: 1 as number | undefined,
  goodsIds: [] as string[],
  posterEnabled: false as CheckboxValueType,
  posterTitle: "",
  posterBenefitText: "",
  posterRuleText: "",
  posterContact: "",
  posterBackground: "",
});

const buildDefaultField = () => ({
  _key: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  fieldName: "",
  fieldType: "NAME",
  required: true,
  placeholder: "",
});

type RecruitField = {
  _key?: string;
  id?: string | number;
  fieldName: string;
  fieldType: string;
  required: string | number | boolean | undefined;
  placeholder: string;
};

type RecruitGoods = {
  skuId?: string | number;
  goodsId?: string | number;
  goodsName?: string;
  sn?: string;
  simpleSpecs?: string;
  price?: number | string;
  quantity?: number | string;
  thumbnail?: string;
};

type PlanForm = ReturnType<typeof buildDefaultPlan> & {
  id?: string | number;
  fields?: RecruitField[];
  recruitGoods?: RecruitGoods[];
  [key: string]: unknown;
};

type SkuSelectExpose = {
  open: (type: string) => void;
  goodsData: unknown[];
};


const skuSelectRef = ref<SkuSelectExpose | null>(null);

const planSaveLoading = ref(false);
const editorReady = ref(true);
const planForm = ref<PlanForm>(buildDefaultPlan());
const recruitFields = ref<RecruitField[]>([]);
const recruitGoodsList = ref<RecruitGoods[]>([]);
const fieldTypeOptions = ref(FIELD_TYPE_OPTIONS);

onMounted(() => {
  loadPlan();
});

watch(
  () => planForm.value.applyMode,
  (value) => {
    if (value !== "MANUAL") {
      planForm.value.requireApplyInfo = false;
      recruitFields.value = [];
    }
  }
);
watch(
  () => planForm.value.requireApplyInfo,
  (value) => {
    if (!value) {
      recruitFields.value = [];
    }
  }
);
watch(
  () => planForm.value.joinConditionType,
  (value) => {
    if (value !== "CONDITIONAL") {
      planForm.value.requirePurchaseGoods = false;
      planForm.value.requireSelfPurchaseAmount = false;
      planForm.value.requireConsumeCount = false;
      recruitGoodsList.value = [];
    }
  }
);
watch(
  () => planForm.value.requirePurchaseGoods,
  (value) => {
    if (!value) {
      recruitGoodsList.value = [];
    }
  }
);
watch(
  () => planForm.value.requireSelfPurchaseAmount,
  (value) => {
    if (value && (!(planForm.value.minSelfPurchaseAmount ?? 0) || Number(planForm.value.minSelfPurchaseAmount ?? 0) < 0.01)) {
      planForm.value.minSelfPurchaseAmount = 0.01;
    }
  }
);
watch(
  () => planForm.value.requireConsumeCount,
  (value) => {
    if (value && (!(planForm.value.minConsumeCount ?? 0) || Number(planForm.value.minConsumeCount ?? 0) < 1)) {
      planForm.value.minConsumeCount = 1;
    }
  }
);

function normalizeFields(fields: RecruitField[] | undefined) {
  if (!fields || !fields.length) {
    return [];
  }
  return fields.map((item, index: number) => ({
    ...buildDefaultField(),
    ...item,
    _key: item._key || String(item.id || `field_${index}_${Date.now()}`),
    required: item.required !== false,
  }));
}
function addRecruitField() {
  if (recruitFields.value.length >= MAX_RECRUIT_FIELDS) {
    ElMessage.warning("最多添加5个字段");
    return;
  }
  recruitFields.value.push(buildDefaultField());
}
function removeRecruitField(index: number) {
  recruitFields.value.splice(index, 1);
}
function validateRecruitFields() {
  if (!planForm.value.requireApplyInfo) {
    return true;
  }
  if (!recruitFields.value.length) {
    ElMessage.warning("请至少添加一个申请字段");
    return false;
  }
  for (let i = 0; i < recruitFields.value.length; i++) {
    const field = recruitFields.value[i];
    if (!field.fieldName || !field.fieldName.trim()) {
      ElMessage.warning(`请填写字段${i + 1}名称`);
      return false;
    }
  }
  return true;
}
function validateJoinConditions() {
  if (planForm.value.joinConditionType !== "CONDITIONAL") {
    return true;
  }
  const {
    requirePurchaseGoods,
    requireSelfPurchaseAmount,
    requireConsumeCount,
  } = planForm.value;
  if (!requirePurchaseGoods && !requireSelfPurchaseAmount && !requireConsumeCount) {
    ElMessage.warning("请至少选择一个加入条件");
    return false;
  }
  if (requirePurchaseGoods && !recruitGoodsList.value.length) {
    ElMessage.warning("请选择指定商品");
    return false;
  }
  if (requireSelfPurchaseAmount && (planForm.value.minSelfPurchaseAmount ?? 0) < 0.01) {
    ElMessage.warning("自购金额最低设置为0.01元");
    return false;
  }
  if (requireConsumeCount && (planForm.value.minConsumeCount ?? 0) < 1) {
    ElMessage.warning("消费笔数最低设置为1笔");
    return false;
  }
  return true;
}
function openGoodsSelect() {
  skuSelectRef.value?.open("goods");
  const data = recruitGoodsList.value.map((item) => ({
    id: item.skuId,
    goodsId: item.goodsId,
    goodsName: item.goodsName,
    sn: item.sn,
    simpleSpecs: item.simpleSpecs,
    price: item.price,
    quantity: item.quantity,
    small: item.thumbnail,
  }));
  if (skuSelectRef.value) {
    skuSelectRef.value.goodsData = data;
  }
}
function selectedGoodsData(items: Array<{
  id?: string | number;
  goodsId?: string | number;
  goodsName?: string;
  sn?: string;
  simpleSpecs?: string;
  price?: number | string;
  quantity?: number | string;
  small?: string;
  thumbnail?: string;
}> | null) {
  recruitGoodsList.value = (items || []).map((item) => ({
    skuId: item.id,
    goodsId: item.goodsId,
    goodsName: item.goodsName,
    sn: item.sn || "",
    simpleSpecs: item.simpleSpecs || "",
    price: item.price,
    quantity: item.quantity,
    thumbnail: item.small || item.thumbnail || "",
  }));
}
function removeRecruitGoods(index: number) {
  recruitGoodsList.value.splice(index, 1);
}
function buildSavePayload() {
  const fields = planForm.value.requireApplyInfo
    ? recruitFields.value.map((field, index: number) => ({
        id: field.id,
        fieldName: field.fieldName.trim(),
        fieldType: field.fieldType,
        required: field.required !== false,
        placeholder: field.placeholder || "",
        sortOrder: index,
      }))
    : [];
  return {
    ...planForm.value,
    id: planForm.value.id || undefined,
    publishStatus: true,
    posterEnabled: !!(planForm.value.posterBackground && String(planForm.value.posterBackground).trim()),
    recruitGoods: planForm.value.requirePurchaseGoods
      ? recruitGoodsList.value.map((item) => ({
          goodsId: item.goodsId,
          skuId: item.skuId,
          goodsName: item.goodsName,
          sn: item.sn,
          simpleSpecs: item.simpleSpecs,
          thumbnail: item.thumbnail,
          price: item.price,
        }))
      : [],
    goodsIds: planForm.value.requirePurchaseGoods
      ? recruitGoodsList.value.map((item) => item.goodsId)
      : [],
    fields,
  };
}
function applyPlanResult(result: PlanForm) {
  planForm.value = { ...buildDefaultPlan(), ...result };
  recruitFields.value = normalizeFields(result.fields);
  recruitGoodsList.value = (result.recruitGoods || []).map((item) => ({
    goodsId: item.goodsId,
    skuId: item.skuId,
    goodsName: item.goodsName,
    sn: item.sn || "",
    simpleSpecs: item.simpleSpecs || "",
    thumbnail: item.thumbnail,
    price: item.price,
  }));
}
function loadPlan() {
  getCurrentRecruitPlan().then((res) => {
    if (res.success && res.result) {
      applyPlanResult(res.result);
    }
  });
}
function savePlan() {
  if (!validateRecruitFields() || !validateJoinConditions()) {
    return;
  }
  planSaveLoading.value = true;
  saveRecruitPlan(buildSavePayload())
    .then((res) => {
      if (res.success) {
        ElMessage.success("保存成功");
        if (res.result) {
          applyPlanResult(res.result);
        } else {
          loadPlan();
        }
      }
    })
    .finally(() => {
      planSaveLoading.value = false;
    });
}
</script>

<style scoped lang="scss">
.apply-mode-block {
  width: 100%;
}

.manual-apply-extra {
  margin-top: 12px;

  .form-desc {
    margin-top: 8px;
    margin-left: 24px;
  }
}

.recruit-field-toolbar {
  margin: 12px 0 8px 24px;
}

.link-btn {
  color: #2d8cf0;
  cursor: pointer;
  user-select: none;
}

.recruit-field-row {
  margin: 12px 0 0 24px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e8eaec;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.recruit-field-row-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.field-label {
  min-width: 56px;
  color: #606266;
}

.delete-btn {
  margin-left: 8px;
}

.recruit-field-row-required {
  margin-top: 10px;
  padding-left: 56px;
}

.form-desc {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.join-condition-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.join-condition-block {
  margin-top: 12px;
  padding: 16px;
  background: #f8f8f9;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.join-condition-item + .join-condition-item {
  margin-top: 16px;
}

.join-condition-detail {
  margin-top: 8px;
  margin-left: 24px;
}

.join-condition-desc {
  margin-top: 8px;
  margin-left: 24px;
}

.goods-toolbar {
  margin: 8px 0;
}

.recruit-goods-table {
  margin-top: 8px;

  :deep(.el-table__cell) {
    vertical-align: top;
  }

  :deep(.el-table__cell .cell) {
    white-space: normal;
    line-height: 1.5;
  }
}

.recruit-goods-name {
  white-space: normal;
  word-break: break-all;
  line-height: 1.5;
}

.recruit-goods-thumb {
  display: block;
  width: 56px;
  height: 56px;
  margin: 4px auto;
  object-fit: contain;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.inline-number {
  width: 120px;
  margin: 0 6px;
  vertical-align: middle;
}

.recruit-poster-block {
  width: 100%;
  max-width: 520px;
}

.poster-preview-wrap {
  margin-bottom: 12px;
}

.poster-thumb {
  display: block;
  max-width: 240px;
  max-height: 240px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>

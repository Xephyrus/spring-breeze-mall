<template>

  <div class="search member-benefit">

    <el-card>
      <el-form
        :model="searchForm"
        inline
        label-width="70px"
        class="search-form"
        @submit.prevent
        @keyup.enter="searchBenefits"
      >
        <el-form-item label="权益名称" prop="keyword">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入权益名称"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-select v-model="searchForm.state" placeholder="全部状态" clearable style="width: 240px">
            <el-option label="开启" value="OPEN" />
            <el-option label="关闭" value="CLOSE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="searchBenefits">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div class="operation padding-row">
        <el-button type="primary" @click="openAdd">添加权益设置</el-button>
        <el-button type="primary" @click="router.push({ name: 'member-benefit-deliveries' })">发放明细</el-button>
      </div>



      <div class="benefit-list-panel">

        <el-table

          v-loading="loading"
          border

          :data="data"

          empty-text="暂无数据"

          class="custom-benefit-table mt_10"
          row-key="id"

          style="width: 100%"

        >

          <!-- 权益ID -->

          <el-table-column prop="id" label="权益ID" width="100" align="center" show-overflow-tooltip />



          <!-- 权益LOGO -->

          <el-table-column label="权益LOGO" width="100" align="center">

            <template #default="{ row }">

              <div v-if="row && row.benefitLogo" class="logo-thumb-wrapper">

                <el-image

                  :src="row.benefitLogo"

                  fit="contain"

                  preview-teleported

                  :preview-src-list="[row.benefitLogo]"

                  class="logo-thumb-img"

                >

                  <template #error>

                    <div class="logo-slot">无图</div>

                  </template>

                </el-image>

              </div>

              <span v-else>-</span>

            </template>

          </el-table-column>



          <!-- 权益名称 -->

          <el-table-column prop="benefitName" label="权益名称" min-width="150" show-overflow-tooltip />



          <!-- 权益编码 -->

          



          <!-- 权益类型 -->

          <el-table-column label="权益类型" width="120" align="center">

            <template #default="{ row }">

              {{ row ? benefitTypeLabel(row.benefitType) : "-" }}

            </template>

          </el-table-column>



          <!-- 排序 -->

          <el-table-column prop="benefitSort" label="排序" width="70" align="center" />



          <!-- 状态 -->

          <el-table-column label="状态" width="100" align="center">

            <template #default="{ row }">

              <el-switch

                v-if="row"

                :model-value="row.benefitState === 'OPEN'"

                inline-prompt

                active-text="开启"

                inactive-text="关闭"

                :loading="!!row._benefitStateLoading"

                @change="(checked) => onBenefitStateSwitch(row, checked)"

              />

            </template>

          </el-table-column>



          <!-- 操作 -->

          <el-table-column label="操作" width="120" align="center" fixed="right">

            <template #default="{ row }">

              <template v-if="row">

                <a class="link-text" @click="openEdit(row)">编辑</a>

                <span class="op-split">|</span>

                <a class="link-text" @click="remove(row)">删除</a>

              </template>

            </template>

          </el-table-column>

        </el-table>

      </div>

    </el-card>



    <el-dialog

      v-model="couponPickerVisible"

      title="选择优惠券"

      width="80%"

      append-to-body

      modal-class="member-benefit-coupon-picker-modal"

      :close-on-click-modal="false"

      destroy-on-close

      @close="handleCouponPickerClose"

    >

      <couponTemplate

        v-if="couponPickerVisible"

        ref="couponPicker"

        manualConfirm

        :selectedList="couponPickerSelectedList"

        getType="ACTIVITY"

        promotionStatus="START"

      />

      <template #footer>

        <el-button @click="couponPickerVisible = false">取消</el-button>

        <el-button type="primary" @click="confirmCouponPicker">确定</el-button>

      </template>

    </el-dialog>



    <el-drawer
      v-model="addFlag" title="添加权益设置" size="1040px" direction="rtl"
      :z-index="950" :close-on-click-modal="false" append-to-body destroy-on-close class="benefit-form-drawer"
    >
      <template #header="{ titleId, titleClass }">
        <div class="benefit-drawer-heading">
          <h2 :id="titleId" :class="titleClass">添加权益设置</h2>
          <p>配置权益规则、展示内容及发布状态</p>
        </div>
      </template>
      <el-form ref="addForm" :model="formAdd" :rules="rulesAdd" label-position="top" class="benefit-editor-form" @submit.prevent>
        <BenefitFormFields
          v-model:form="formAdd" :type-options="benefitTypeOptions" which="add"
          @type-change="onAddBenefitTypeChange" @select-coupons="openCouponPicker"
          @quantity-change="onCouponQuantityChange" @remove-coupon="removeCouponRow"
        />
      </el-form>
      <template #footer>
        <div class="benefit-drawer-footer-btns">
          <el-button @click="addFlag = false">取消</el-button>
          <el-button type="primary" :loading="submitAddLoading" @click="submitAdd">保存权益</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer
      v-model="editFlag" title="编辑权益设置" size="1040px" direction="rtl"
      :z-index="950" :close-on-click-modal="false" append-to-body destroy-on-close class="benefit-form-drawer"
    >
      <template #header="{ titleId, titleClass }">
        <div class="benefit-drawer-heading">
          <h2 :id="titleId" :class="titleClass">编辑权益设置</h2>
          <p>配置权益规则、展示内容及发布状态</p>
        </div>
      </template>
      <el-form ref="editForm" :model="formEdit" :rules="rulesEdit" label-position="top" class="benefit-editor-form" @submit.prevent>
        <BenefitFormFields
          v-model:form="formEdit" :type-options="benefitTypeOptions" which="edit" editing
          @type-change="onEditBenefitTypeChange" @select-coupons="openCouponPicker"
          @quantity-change="onCouponQuantityChange" @remove-coupon="removeCouponRow"
        />
      </el-form>
      <template #footer>
        <div class="benefit-drawer-footer-btns">
          <el-button @click="editFlag = false">取消</el-button>
          <el-button type="primary" :loading="submitEditLoading" @click="submitEdit">保存修改</el-button>
        </div>
      </template>
    </el-drawer>

  </div>

</template>



<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";

import * as API_Member from "@/api/member";

import { getPlatformCoupon } from "@/api/promotion";
import type { BenefitForm, BenefitTypeOption, CouponPackageRow } from "./types";

import { formatPromotionCouponValidityHtml } from "@/utils/promotions";

import couponTemplate from "@/views/promotions/coupon/coupon.vue";

import BenefitFormFields from './benefit-form-fields.vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from "element-plus";



defineOptions({ name: "memberBenefit" });



const router = useRouter();

const GIFT_POINT = "GIFT_POINT";

const COUPON_PACKAGE = "COUPON_PACKAGE";



/** Element Plus 校验回调 */
type ValidateCallback = (error?: Error) => void;

/** 权益列表行 */
type BenefitRow = {
  id?: string | number;
  benefitName?: string;
  benefitType?: string;
  benefitState?: string;
  benefitSort?: number;
  [key: string]: unknown;
};

/** 平台优惠券详情（选择器 / 详情接口返回） */
type PlatformCouponDetail = {
  id?: string | number;
  couponId?: string | number;
  couponName?: string;
  price?: number | string;
  couponDiscount?: number | string;
  validityText?: string;
  faceValueText?: string;
  quantity?: number | string;
  /** 有效期相关（透传给 formatPromotionCouponValidityHtml） */
  getType?: string;
  effectiveDays?: number | string;
  rangeDayType?: string;
  startTime?: string;
  endTime?: string;
};

/** el-form 实例 */
type FormInstance = {
  validateField: (field: string, callback?: () => void) => void;
  validate: (callback?: (valid: boolean) => void) => void;
  clearValidate?: () => void;
  resetFields?: () => void;
};

/** 优惠券选择弹窗 */
type CouponPickerInstance = {
  getSelection?: () => PlatformCouponDetail[];
};

/** 表单归属（新增 / 编辑） */
type FormWhich = "add" | "edit";

const buildDefaultForm = (): BenefitForm => ({

  id: "",

  benefitName: "",

  benefitCode: "",

  benefitType: "",

  benefitLogo: "",

  benefitDesc: "",

  benefitSort: 1,

  benefitState: "OPEN",

  benefitConfig: "",

  giftPoint: null,
  multiplier: 1,
  grantRule: "ONCE",
  grantDay: 1,
  periodMonths: 1,

  couponPackageRows: [],

});



// 模板 ref（couponPicker 为优惠券选择组件，addForm/editForm 为表单）

const couponPicker = ref<CouponPickerInstance | null>(null);

const addForm = ref<FormInstance | null>(null);

const editForm = ref<FormInstance | null>(null);

// 动态 ref 映射表（原 this.$refs[refName]）

const formRefs = { addForm, editForm };



const benefitTypeOptions = ref<BenefitTypeOption[]>([]);

const loading = ref(false);

const searchForm = ref<{ keyword: string; state: string }>({

  keyword: "",

  state: "",

});

const data = ref<BenefitRow[]>([]);

const addFlag = ref(false);

const editFlag = ref(false);

const submitAddLoading = ref(false);

const submitEditLoading = ref(false);

const formAdd = ref(buildDefaultForm());

const formEdit = ref(buildDefaultForm());

const couponPickerVisible = ref(false);

const couponPickerWhich = ref<FormWhich>("add");



// 动态表单映射表（原 this[formKey]）

const formMap = { formAdd, formEdit };



const rulesAdd = computed(() => buildFormRules("add"));

const rulesEdit = computed(() => buildFormRules("edit"));

const couponPickerSelectedList = computed(() => {

  const form = couponPickerWhich.value === "add" ? formAdd.value : formEdit.value;

  return (form.couponPackageRows || []).map((r) => ({

    id: r.couponId,

    couponName: r.couponName || "",

  }));

});



function benefitTypeLabel(v?: string) {

  if (!v) return "-";

  const opt = benefitTypeOptions.value.find((o) => o.value === v);

  return opt ? opt.description : v;

}

function touchFormField(refName: keyof typeof formRefs, field: string) {

  nextTick(() => {

    const ref = formRefs[refName]?.value;

    if (ref && typeof ref.validateField === "function") {

      // validateField rejects on failure; catch to avoid dev-server [object Object] overlay

      ref.validateField(field, () => {});

    }

  });

}

function onCouponQuantityChange(which: FormWhich, index: number, val: number) {

  const formKey: keyof typeof formMap = which === "add" ? "formAdd" : "formEdit";

  const refName: keyof typeof formRefs = which === "add" ? "addForm" : "editForm";

  formMap[formKey].value.couponPackageRows[index].quantity = val;

  touchFormField(refName, "couponPackageRows");

}

function buildFormRules(which: FormWhich) {

  const formKey: keyof typeof formMap = which === "add" ? "formAdd" : "formEdit";

  return {

    benefitType: [{ required: true, message: "请选择权益类型", trigger: "change" }],

    benefitDesc: [{ required: true, message: "请输入权益介绍", trigger: "change" }],
    benefitName: [{ required: true, message: "请输入权益名称", trigger: "blur" }],

    benefitLogo: [{ required: true, message: "请配置权益LOGO", trigger: "change" }],

    benefitSort: [{ required: true, type: "number", message: "请输入排序", trigger: "change" }],

    benefitState: [{ required: true, message: "请选择启用状态", trigger: "change" }],

    giftPoint: [

      {

        validator: (_rule: unknown, value: unknown, callback: ValidateCallback) => {

          const form = formMap[formKey].value;

          validateGiftPoint(form, value, callback);

        },

        trigger: ["change", "blur"],

      },

    ],

    couponPackageRows: [

      {

        validator: (_rule: unknown, value: unknown, callback: ValidateCallback) => {

          const form = formMap[formKey].value;

          validateCouponPackage(form, callback);

        },

        trigger: "change",

      },

    ],

  };

}

function validateGiftPoint(form: BenefitForm, value: unknown, callback: ValidateCallback) {

  if (form.benefitType !== GIFT_POINT) return callback();

  if (value === null || value === undefined || value === "") {

    return callback(new Error("请输入赠送积分"));

  }

  const n = Number(value);

  if (Number.isNaN(n) || n < 0 || n > 99999) {

    return callback(new Error("赠送积分范围为 0-99999"));

  }

  callback();

}

function validateCouponPackage(form: BenefitForm, callback: ValidateCallback) {

  if (form.benefitType !== COUPON_PACKAGE) return callback();

  const rows = form.couponPackageRows || [];

  if (rows.length > 10) return callback(new Error("最多选择10张优惠券"));

  if (!rows.length) {

    return callback(new Error("请添加至少一张优惠券"));

  }

  for (let i = 0; i < rows.length; i++) {

    const q = Number(rows[i].quantity);

    if (!Number.isInteger(q) || q < 1 || q > 10) {

      return callback(new Error("每张券赠送张数需在 1～10 之间"));

    }

  }

  callback();

}

/** 列表行的 id 一定存在（后端主键），集中收窄一次 */
function benefitIdOf(row: BenefitRow): string | number {
  return row.id as string | number;
}

function formatCouponFace(row?: PlatformCouponDetail) {

  if (!row) return "-";

  if (row.price !== undefined && row.price !== null && row.price !== "") {

    return `¥${row.price}`;

  }

  if (row.couponDiscount !== undefined && row.couponDiscount !== null && row.couponDiscount !== "") {

    return `${row.couponDiscount}折`;

  }

  return "-";

}

function formatCouponValidity(row?: PlatformCouponDetail) {

  return formatPromotionCouponValidityHtml(row);

}

function buildCouponDisplayRow(detail: PlatformCouponDetail, quantity?: number | string) {

  const qty = Math.min(10, Math.max(1, Number(quantity) || 1));

  return {

    couponId: detail.id,

    quantity: qty,

    couponName: detail.couponName || "",

    faceValueLabel: formatCouponFace(detail),

    validRange: formatCouponValidity(detail),

  };

}

function buildBenefitConfigString(form: BenefitForm) {
  if(form.benefitType === GIFT_POINT) return JSON.stringify({giftPoint:Number(form.giftPoint)});
  if(form.benefitType === 'POINT_MULTIPLIER') return JSON.stringify({multiplier:Number(form.multiplier)});
  if(form.benefitType === COUPON_PACKAGE) return JSON.stringify({
    grantRule:form.grantRule, grantDay:form.grantDay, periodMonths:form.periodMonths,
    coupons:(form.couponPackageRows || []).map((r)=>({couponId:String(r.couponId),quantity:Number(r.quantity)}))
  });
  return '{}';
}

function parseGiftPointFromConfig(benefitType?: string, benefitConfigStr?: string) {

  if (benefitType !== GIFT_POINT || !benefitConfigStr) return null;

  try {

    const o = JSON.parse(benefitConfigStr);

    if (o && typeof o.giftPoint !== "undefined") {

      const n = Number(o.giftPoint);

      return Number.isNaN(n) ? null : n;

    }

  } catch {

    /* ignore */

  }

  return null;

}

function onAddBenefitTypeChange(val: string) {

  if (val !== GIFT_POINT) {

    formAdd.value.giftPoint = null;

  }

  if (val !== COUPON_PACKAGE) {

    formAdd.value.couponPackageRows = [];

  }

  if (addForm.value && val !== GIFT_POINT) {

    touchFormField("addForm", "giftPoint");

  }

  if (addForm.value && val !== COUPON_PACKAGE) {

    touchFormField("addForm", "couponPackageRows");

  }

}

function onEditBenefitTypeChange(val: string) {

  if (val !== GIFT_POINT) {

    formEdit.value.giftPoint = null;

  }

  if (val !== COUPON_PACKAGE) {

    formEdit.value.couponPackageRows = [];

  }

  if (editForm.value && val !== GIFT_POINT) {

    touchFormField("editForm", "giftPoint");

  }

  if (editForm.value && val !== COUPON_PACKAGE) {

    touchFormField("editForm", "couponPackageRows");

  }

}

function parseCouponsFromConfig(str?: string) {

  if (!str) return [];

  try {

    const o = JSON.parse(str);

    if (o && Array.isArray(o.coupons)) {

      return (o.coupons as CouponPackageRow[]).map((c) => ({

        couponId: c.couponId,

        quantity: c.quantity,

      }));

    }

  } catch {

    /* ignore */

  }

  return [];

}

function normalizeCouponFaceFromDetail(item: PlatformCouponDetail) {

  let face = formatCouponFace(item);

  if (face !== "-") return face;

  const raw = item.faceValueText;

  if (raw == null || raw === "") return "-";

  return String(raw)

    .replace(/^减免现金\s*/, "")

    .replace(/^减免\s*/, "")

    .trim() || "-";

}

function mapCouponItemsToPackageRows(items: unknown): CouponPackageRow[] {

  if (!Array.isArray(items)) return [];

  return (items as PlatformCouponDetail[]).map((item) => {

    const face = normalizeCouponFaceFromDetail(item);

    const validHtml = item.validityText

      ? String(item.validityText).replace(/\n/g, "<br/>")

      : "-";

    return {

      couponId: item.couponId,

      quantity: Math.min(10, Math.max(1, Number(item.quantity) || 1)),

      couponName: item.couponName || "",

      faceValueLabel: face,

      validRange: validHtml,

    };

  });

}

async function hydrateCouponRowsForEdit(snippets: CouponPackageRow[]): Promise<CouponPackageRow[]> {

  const rows: CouponPackageRow[] = [];

  for (const s of snippets) {

    const cid = s.couponId;

    const qty = s.quantity;

    try {

      // snippets 里的 couponId 一定存在（由优惠券选择器写入）
      const res = await getPlatformCoupon(cid as string | number);

      if (res && res.success && res.result) {

        rows.push(buildCouponDisplayRow(res.result, qty));

      } else {

        rows.push({

          couponId: cid,

          quantity: Math.min(10, Math.max(1, Number(qty) || 1)),

          couponName: String(cid),

          faceValueLabel: "-",

          validRange: "-",

        });

      }

    } catch {

      rows.push({

        couponId: cid,

        quantity: Math.min(10, Math.max(1, Number(qty) || 1)),

        couponName: String(cid),

        faceValueLabel: "-",

        validRange: "-",

      });

    }

  }

  formEdit.value.couponPackageRows = rows;

  return rows;

}

function handleCouponPickerClose() {

  couponPickerVisible.value = false;

}

function openCouponPicker(which: FormWhich) {

  couponPickerWhich.value = which;

  couponPickerVisible.value = true;

}

function confirmCouponPicker() {

  const list = couponPicker.value?.getSelection?.() || [];

  if (list.length > 10) {
    ElMessage.warning("最多选择10张优惠券");
    return;
  }

  if (!list.length) {

    ElMessage.warning("请至少选择一张优惠券");

    return;

  }

  onCouponTemplateSelected(list);

  couponPickerVisible.value = false;

}

function onCouponTemplateSelected(selectedRows: PlatformCouponDetail[]) {

  const which = couponPickerWhich.value;

  const form = which === "add" ? formAdd.value : formEdit.value;

  const refName: keyof typeof formRefs = which === "add" ? "addForm" : "editForm";

  const list = selectedRows || [];

  const rows = list.map((row) => {

    const existing = (form.couponPackageRows || []).find((r) => String(r.couponId) === String(row.id));

    const qty = existing ? existing.quantity : 1;

    return buildCouponDisplayRow(row, qty);

  });

  form.couponPackageRows = rows;

  touchFormField(refName, "couponPackageRows");

}

function removeCouponRow(which: FormWhich, index: number) {

  const form = which === "add" ? formAdd.value : formEdit.value;

  const refName: keyof typeof formRefs = which === "add" ? "addForm" : "editForm";

  form.couponPackageRows.splice(index, 1);

  touchFormField(refName, "couponPackageRows");

}

function init() {

  loadBenefitTypes();

  getData();

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

function getData() {

  loading.value = true;

  const params: Record<string, unknown> = { ...searchForm.value, pageNumber: 1, pageSize: 999 };

  API_Member.getMemberBenefitByPage(params).then((res) => {

    loading.value = false;

    if (res && res.success && res.result) {

      data.value = Array.isArray(res.result.records) ? res.result.records : [];

    } else {

      data.value = [];

    }

  });

}

function searchBenefits() { getData(); }

function openAdd() {

  addFlag.value = true;

  submitAddLoading.value = false;

  nextTick(() => {

    addForm.value?.resetFields?.();

    formAdd.value = buildDefaultForm();

  });

}

function submitAdd() {

  if (!addForm.value) {

    ElMessage.warning("表单未就绪，请稍后重试");

    return;

  }

  addForm.value.validate((valid: boolean) => {

    if (!valid) return;

    submitAddLoading.value = true;

    const { giftPoint: _giftPoint, couponPackageRows: _couponPackageRows, ...rest } = formAdd.value;

    const payload = {

      ...rest,

      benefitConfig: buildBenefitConfigString(formAdd.value),

    };

    API_Member.addMemberBenefit(payload).then((res) => {

      submitAddLoading.value = false;

      if (res && res.success) {

        ElMessage.success("添加成功");

        addFlag.value = false;

        getData();

      } else if (res && res.message) {

        ElMessage.error(res.message);

      } else {

        ElMessage.error("添加失败");

      }

    }).catch(() => {

      submitAddLoading.value = false;

      ElMessage.error("网络异常，请稍后重试");

    });

  });

}

function openEdit(row: BenefitRow) {

  editFlag.value = true;

  submitEditLoading.value = false;

  nextTick(() => {

    editForm.value?.resetFields?.();

  });

  API_Member.getMemberBenefit(benefitIdOf(row)).then((res) => {

    if (res && res.success && res.result) {

      const raw = res.result;

      const detail = raw.benefit != null ? raw.benefit : raw;

      const couponItems = raw.couponItems;

      const bt = detail.benefitType || "";

      let extension = {};
      try { extension = JSON.parse(detail.benefitConfig || '{}'); } catch { /* 旧数据按默认配置回显 */ }
      const parsed = parseGiftPointFromConfig(bt, detail.benefitConfig || "");

      const couponSnippets = parseCouponsFromConfig(detail.benefitConfig || "");



      let couponRows: CouponPackageRow[] = [];

      if (bt === COUPON_PACKAGE && Array.isArray(couponItems) && couponItems.length) {

        couponRows = mapCouponItemsToPackageRows(couponItems);

      }



      formEdit.value = {

        id: detail.id || row.id || "",

        benefitName: detail.benefitName || "",

        benefitCode: detail.benefitCode || "",

        benefitType: bt,
        multiplier: Number((extension as Record<string, unknown>).multiplier ?? 1),
        grantRule: String((extension as Record<string, unknown>).grantRule || "ONCE"),
        grantDay: Number((extension as Record<string, unknown>).grantDay || 1),
        periodMonths: Number((extension as Record<string, unknown>).periodMonths || 1),

        benefitLogo: detail.benefitLogo || "",

        benefitDesc: detail.benefitDesc || "",

        benefitSort: Number(detail.benefitSort) > 0 ? Number(detail.benefitSort) : 1,

        benefitState: detail.benefitState || "OPEN",

        benefitConfig: detail.benefitConfig || "",

        giftPoint: bt === GIFT_POINT ? (parsed !== null ? parsed : null) : null,

        couponPackageRows: couponRows,

      };



      if (bt === COUPON_PACKAGE && couponRows.length === 0 && couponSnippets.length) {

        hydrateCouponRowsForEdit(couponSnippets);

      }

    }

  });

}

function submitEdit() {

  if (!editForm.value) {

    ElMessage.warning("表单未就绪，请稍后重试");

    return;

  }

  editForm.value.validate((valid: boolean) => {

    if (!valid) return;

    submitEditLoading.value = true;

    const { id, giftPoint: _giftPoint, couponPackageRows: _couponPackageRows, ...rest } = formEdit.value;

    const payload = {

      ...rest,

      benefitConfig: buildBenefitConfigString(formEdit.value),

    };

    API_Member.updateMemberBenefit(id as string | number, payload).then((res) => {

      submitEditLoading.value = false;

      if (res && res.success) {

        ElMessage.success("修改成功");

        editFlag.value = false;

        getData();

      } else if (res && res.message) {

        ElMessage.error(res.message);

      } else {

        ElMessage.error("修改失败");

      }

    }).catch(() => {

      submitEditLoading.value = false;

      ElMessage.error("网络异常，请稍后重试");

    });

  });

}

function onBenefitStateSwitch(row: BenefitRow, checked: boolean) {

  const nextState = checked ? "OPEN" : "CLOSE";

  const prevState = row.benefitState;

  if (nextState === prevState) return;

  const text = checked ? "开启" : "关闭";

  ElMessageBox.confirm(`确定${text}该客户权益？`, "提示", { type: "warning" }).then(() => {

    row._benefitStateLoading = true;

    return API_Member.updateMemberBenefitState(benefitIdOf(row), nextState)

      .then((res) => {

        row._benefitStateLoading = false;

        if (res && res.success) {

          ElMessage.success(`${text}成功`);

          row.benefitState = nextState;

        } else {

          getData();

        }

      })

      .catch(() => {

        row._benefitStateLoading = false;

      });

  }).catch(() => {});

}

function remove(row: BenefitRow) {

  ElMessageBox.confirm("确定删除该客户权益？", "提示", { type: "warning" }).then(() => {

    API_Member.deleteMemberBenefit(benefitIdOf(row)).then((res) => {

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



<style lang="scss" scoped>

.font-mono {

  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

}



.font-semibold {

  font-weight: 600;

}



.text-dark {

  color: #303133;

}



.text-secondary {

  color: #606266;

}



.text-placeholder {

  color: #c0c4cc;

}



.custom-benefit-table {

  .logo-thumb-wrapper {

    width: 44px;

    height: 44px;

    margin: 0 auto;

    border: 1px solid #ebeef5;

    border-radius: 4px;

    background: #fafafa;

    display: flex;

    align-items: center;

    justify-content: center;

    overflow: hidden;



    .logo-thumb-img {

      width: 40px;

      height: 40px;

    }



    .logo-slot {

      font-size: 11px;

      color: #c0c4cc;

    }

  }

}

.benefit-drawer-footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.benefit-drawer-footer-btns .el-button + .el-button {
  margin-left: 0;
}

.link-text {

  color: #409eff;

  cursor: pointer;

  text-decoration: none;

}

.op-split {

  margin: 0 8px;

  color: #dcdfe6;

}

</style>



<style lang="scss">
.benefit-form-drawer {
  max-width: 100vw;
  .el-drawer__header {
    margin-bottom: 0;
    padding: 22px 28px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  .el-drawer__body { padding: 20px 24px; background: #f5f7fa; }
  .el-drawer__footer {
    padding: 16px 28px;
    background: #fff;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .el-form-item__content { min-width: 0; }
  .benefit-drawer-heading h2 { margin: 0; color: var(--el-text-color-primary); font-size: 18px; font-weight: 600; line-height: 26px; }
  .benefit-drawer-heading p { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 20px; }
  .benefit-drawer-footer-btns .el-button { min-width: 92px; }
  .benefit-editor-form .tinymce-container { width: 100%; }
  .benefit-editor-form .tinymce-container > .wrapper { margin-bottom: 10px; }
}


.benefit-logo-thumb {

  width: 100px;

  height: 100px;

  min-width: 100px;

  min-height: 100px;

  max-width: 100px;

  max-height: 100px;

  flex-shrink: 0;

  border: 1px solid #dcdee2;

  border-radius: 4px;

  background: #f8f8f9;

  overflow: hidden;

  display: flex;

  align-items: center;

  justify-content: center;

  box-sizing: border-box;

}

.benefit-logo-thumb img {

  width: 100%;

  height: 100%;

  object-fit: contain;

  display: block;

}

.benefit-logo-thumb--table {

  margin: 0 auto;

}



.member-benefit .benefit-list-panel {

  width: 100%;

  max-width: 100%;

}

.member-benefit .benefit-list-panel .benefit-list-table {

  width: 100%;

}

.member-benefit .benefit-list-table table {

  table-layout: fixed;

}

.member-benefit .benefit-list-cell-ellipsis {

  display: inline-block;

  max-width: 100%;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  vertical-align: middle;

}

.member-benefit .benefit-list-cell-ellipsis--type {

  max-width: 118px;

}

.member-benefit .benefit-list-cell-ellipsis--name {

  max-width: 172px;

}



.member-benefit .benefit-list-table--no-vertical-borders .el-table th,

.member-benefit .benefit-list-table--no-vertical-borders .el-table td {

  border-right: none !important;

}



.member-benefit-coupon-picker-modal {

  z-index: 2700 !important;

}



.benefit-form-drawer .benefit-coupon-form-item.el-form-item .el-form-item__content {

  flex: 1;

  min-width: 0;

  max-width: none;

}

.benefit-form-drawer .benefit-coupon-field {

  width: 100%;

}

.benefit-form-drawer .benefit-coupon-table {

  width: 100%;

}

.benefit-form-drawer .benefit-coupon-table table {

  width: 100% !important;

}

</style>




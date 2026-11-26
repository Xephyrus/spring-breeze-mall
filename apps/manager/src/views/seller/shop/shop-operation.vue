<template>
  <div>
    <el-card>
      <el-button
        class="mb_10"
        v-if="shopForm.storeDisable === 'APPLYING'"
        type="primary"
        @click="auditHandler"
        >审核</el-button
      >
      <el-form
        ref="shopFormRef"
        :model="shopForm"
        label-width="130px"
        label-position="right"
        :rules="shopValidate"
      >
        <el-tabs
          :model-value="tabName"
          style="overflow: visible"
          @update:model-value="(v: string | number | undefined) => (tabName = String(v ?? 'base'))"
        >
          <el-tab-pane label="基本信息" class="tab" name="base">
            <el-divider content-position="left">基本信息</el-divider>
            <!-- 遮罩层  -->
            <div v-if="isRead" class="mask">只读不可修改</div>
            <div>
              <el-form-item label="会员名称" prop="memberName">
                <div class="item">
                  <el-input disabled v-model="shopForm.memberName" />
                  <el-button type="default" @click="selectMember()" v-if="!$route.query.shopId"
                    >选择会员</el-button
                  >
                </div>
              </el-form-item>
              <el-form-item label="店铺名称" prop="storeName">
                <el-input v-model="shopForm.storeName" clearable style="width: 350px" />
              </el-form-item>

              <el-form-item label="是否自营" prop="selfOperated">
                <el-radio-group
                  :model-value="shopForm.selfOperated"
                  @update:model-value="(v: string | number | boolean | undefined) => (shopForm.selfOperated = String(v ?? 'false'))"
                >
                  <el-radio-button value="true">自营</el-radio-button>
                  <el-radio-button value="false">非自营</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="店铺所在地" prop="storeAddressPath">
                <span>{{ shopForm.storeAddressPath || "暂无地址" }}</span>
                <el-button
                  style="margin-left: 10px"
                  type="default"
                  @click="handleClickAddress('storeAddressPath')"
                  >选择</el-button
                >
              </el-form-item>

              <el-form-item label="店铺详细地址" prop="storeAddressDetail">
                <el-input
                  v-model="shopForm.storeAddressDetail"
                  clearable
                  style="width: 350px"
                />
              </el-form-item>

              <el-form-item label="店铺logo" class="storeLogo">
                <div class="store-logo-block">
                  <el-avatar
                    shape="square"
                    :size="100"
                    :src="shopForm.storeLogo"
                  />
                  <el-button @click="handleCLickImg('storeLogo', -1)" type="primary"
                    >选择图片</el-button
                  >
                </div>
              </el-form-item>

              <el-form-item label="店铺简介" prop="storeDesc" style="width: 350px">
                <el-input
                  v-model="shopForm.storeDesc"
                  type="textarea"
                  :rows="4"
                  maxlength="200"
                  show-word-limit
                  clearable
                  style="width: 400px"
                />
              </el-form-item>
              <br />
              <el-divider content-position="left">退货收件地址</el-divider>
              <el-form-item label="收件人姓名">
                <el-input
                  v-model="shopForm.salesConsigneeName"
                  clearable
                  style="width: 350px"
                />
              </el-form-item>
              <el-form-item label="收件人手机">
                <el-input
                  v-model="shopForm.salesConsigneeMobile"
                  clearable
                  maxlength="11"
                  style="width: 350px"
                />
              </el-form-item>
              <el-form-item label="地址信息">
                {{ shopForm.salesConsigneeAddressPath || "暂无地址" }}
                <el-button
                  style="margin-left: 10px"
                  type="default"
                  @click="handleClickAddress('salesConsigneeAddressPath')"
                  >选择</el-button
                >
              </el-form-item>
              <el-form-item label="详细地址">
                <el-input
                  v-model="shopForm.salesConsigneeDetail"
                  clearable
                  style="width: 350px"
                />
              </el-form-item>
            </div>
          </el-tab-pane>

          <!-- 入驻信息 -->
          <el-tab-pane label="入驻信息" class="tab" name="entry">
            <!-- 遮罩层  -->
            <div v-if="isRead" class="mask">只读不可修改</div>
            <el-divider content-position="left">公司信息</el-divider>
            <div v-loading="loading">
              <el-form-item label="公司名称" prop="companyName">
                <el-input v-model="shopForm.companyName" clearable style="width: 350px" />
              </el-form-item>

              <el-form-item label="公司电话" prop="companyPhone">
                <el-input v-model="shopForm.companyPhone" clearable style="width: 350px" />
              </el-form-item>
              <el-form-item label="公司所在地" prop="companyAddressIdPath">
                <span>{{ shopForm.companyAddressPath }}</span>
                <el-button
                  style="margin-left: 10px"
                  type="default"
                  @click="handleClickAddress('companyAddressPath')"
                  >选择</el-button
                >
              </el-form-item>
              <el-form-item label="公司详细地址" prop="companyAddress">
                <el-input v-model="shopForm.companyAddress" clearable style="width: 350px" />
              </el-form-item>
              <el-form-item label="员工总数" prop="employeeNum">
                <el-input-number
                  style="width: 150px"
                  :min="1"
                  :max="9999999"
                  :model-value="shopForm.employeeNum"
              @update:model-value="(v: number | undefined) => (shopForm.employeeNum = Number(v ?? 0))"
                />
              </el-form-item>
              <el-form-item label="注册资金" prop="registeredCapital">
                <el-input-number
                  style="width: 150px"
                  :min="1"
                  :max="9999999"
                  :model-value="shopForm.registeredCapital"
              @update:model-value="(v: number | undefined) => (shopForm.registeredCapital = Number(v ?? 0))"
                />
                <span style="margin-left: 10px">万</span>
              </el-form-item>
              <el-form-item label="联系人姓名" prop="linkName">
                <el-input v-model="shopForm.linkName" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="联系人手机" prop="linkPhone">
                <el-input
                  v-model="shopForm.linkPhone"
                  maxlength="11"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="电子邮箱" prop="companyEmail">
                <el-input v-model="shopForm.companyEmail" clearable style="width: 200px" />
              </el-form-item>

              <el-divider content-position="left">营业执照信息</el-divider>

              <el-form-item label="营业执照号" prop="licenseNum">
                <el-input v-model="shopForm.licenseNum" clearable style="width: 200px" />
              </el-form-item>

              <el-form-item label="法定经营范围" prop="scope">
                <el-input v-model="shopForm.scope" clearable style="width: 200px" />
              </el-form-item>

              <el-form-item label="营业执照电子版" prop="licencePhoto">
                <div class="store-logo-block">
                  <el-avatar
                    shape="square"
                    :size="100"
                    :src="shopForm.licencePhoto"
                  />
                  <el-button @click="handleCLickImg('licencePhoto', 0)" type="primary"
                    >选择图片</el-button
                  >
                </div>
              </el-form-item>
              <el-divider content-position="left">法人信息</el-divider>

              <el-form-item label="法人姓名" prop="legalName">
                <el-input v-model="shopForm.legalName" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="法人证件号" prop="legalId">
                <el-input v-model="shopForm.legalId" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="法人身份证照片" prop="legalPhoto">
                <div class="legal-photo-block">
                  <div class="legal-photo-list">
                    <el-avatar
                      class="legal-photo"
                      shape="square"
                      :size="100"
                      @click="handleCLickImg('legalPhoto', 0)"
                      :src="shopForm.legalPhoto[0]"
                    />
                    <el-avatar
                      class="legal-photo"
                      shape="square"
                      :size="100"
                      @click="handleCLickImg('legalPhoto', 1)"
                      :src="shopForm.legalPhoto[1]"
                    />
                  </div>
                  <div class="form-tip">点击图片上传身份证正反面，要求身份证清晰，四角无缺漏</div>
                </div>
              </el-form-item>

              <el-divider content-position="left">结算银行信息</el-divider>
              <el-form-item label="银行开户名" prop="settlementBankAccountName">
                <el-input
                  v-model="shopForm.settlementBankAccountName"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="银行账号" prop="settlementBankAccountNum">
                <el-input
                  v-model="shopForm.settlementBankAccountNum"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="银行支行名称" prop="settlementBankBranchName">
                <el-input
                  v-model="shopForm.settlementBankBranchName"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="支行联行号" prop="settlementBankJointName">
                <el-input
                  v-model="shopForm.settlementBankJointName"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
            </div>
          </el-tab-pane>
          <el-tab-pane label="经营范围" class="tab" name="category">
            <!-- 遮罩层  -->
            <div v-if="isRead" class="mask">只读不可修改</div>
            <el-form-item label="经营类目" prop="goodsManagementCategory">
              <div class="category-panel">
                <div class="category-toolbar">
                  <el-checkbox
                    :model-value="checkAll"
              @update:model-value="(v: string | number | boolean | undefined) => (checkAll = Boolean(v))"
                    :indeterminate="indeterminate"
                    @change="handleCheckAll"
                    >全选
                  </el-checkbox>
                  <span class="category-count"
                    >已选 {{ checkAllGroup.length }} / {{ categories.length }} 项</span
                  >
                </div>
                <el-checkbox-group
                  v-model="checkAllGroup"
                  class="category-grid"
                  @change="checkAllGroupChange"
                >
                  <el-checkbox
                    v-for="(item, i) in categories"
                    :key="i + 1"
                    :value="String(item.id)"
                    >{{ item.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="结算信息" class="tab" name="settlement">
            <el-alert type="info" :closable="false" show-icon class="settlement-alert">
              已添加<span class="theme_color">{{ settlementCycle.length }}</span
              >个结算日，最多可添加5个结算日，当月不包含所设日期时，将会顺延到下一个结算日
            </el-alert>
            <el-form-item label="结算日期">
              <div class="settlement-panel">
                <div class="settlement-tags">
                  <el-tag
                    v-for="item in settlementCycle"
                    :key="item"
                    closable
                    class="settlement-tag"
                    @close="removesettlementCycle(item)"
                    >每月 {{ item }} 日
                  </el-tag>
                  <span v-if="!settlementCycle.length" class="settlement-empty"
                    >暂未添加结算日</span
                  >
                </div>
                <div class="settlement-actions">
                  <template v-if="settlementShow">
                    <el-input-number
                      size="small"
                      :max="31"
                      :min="1"
                      :model-value="day"
              @update:model-value="(v: number | undefined) => (day = Number(v ?? 0))"
                    />
                    <el-button
                      v-if="addSettlementConfirmBtn"
                      type="primary"
                      @click="addsettlementCycleConfirm"
                      size="small"
                      >确认
                    </el-button>
                    <el-button type="default" @click="cancelSettlementCycle" size="small"
                      >取消
                    </el-button>
                  </template>
                  <el-button
                    type="primary"
                    plain
                    @click="addsettlementCycle"
                    size="small"
                    v-if="addSettlementBtn && settlementCycle.length < 5"
                    >+ 添加结算日期
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <div style="text-align: center">
        <el-button
          type="default"
          v-show="tabNameList.indexOf(tabName) > 0"
          class="mr_10"
          @click="prev"
          >上一步</el-button
        >
        <el-button
          type="primary"
          v-show="tabNameList.indexOf(tabName) < tabNameList.length - 1"
          @click="next"
          >下一步</el-button
        >
        <el-button
          type="primary"
          v-show="tabNameList.indexOf(tabName) === tabNameList.length - 1"
          @click="save"
          v-if="!isRead"
        >
          {{ shopId ? "修改" : "保存" }}
        </el-button>
      </div>
    </el-card>

    <el-dialog
      v-model="picModelFlag"
      width="1200px"
      append-to-body
      destroy-on-close
      :show-close="true"
    >
      <ossManage
        @callback="callbackSelected"
        :isComponent="true"
        :initialize="picModelFlag"
        ref="ossManageRef"
      />
    </el-dialog>

    <el-dialog
      v-model="memberModalFlag"
      width="1200px"
      append-to-body
      destroy-on-close
      :show-close="true"
    >
      <memberLayout
        v-if="memberModalFlag"
        :selectedMember="true"
        @callback="callbackMember"
        ref="memberLayoutRef"
      />
    </el-dialog>

    <el-dialog v-model="auditModel" width="360px" append-to-body :show-close="true">
      <template #header>
        <span style="color: #f60; text-align: center; display: block">审核店铺</span>
      </template>
      <div style="text-align: center">
        <p>您确认要审核通过该店铺</p>
      </div>
      <template #footer>
        <el-button type="danger" :loading="auditModalLoading" @click="audit('REFUSED')"
          >驳回</el-button
        >
        <el-button type="primary" :loading="auditModalLoading" @click="audit('PASS')"
          >通过</el-button
        >
      </template>
    </el-dialog>

    <multipleMap ref="map" @callback="getAddress" />
  </div>
</template>

<script setup lang="ts">
import type { FormRefLike } from "@/types/el-refs";
import { nextTick, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import memberLayout from "@/views/member/list/index.vue";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import { getCategoryTree } from "@/api/goods";
import { shopDetail, shopAdd, shopEdit, getShopByMemberId, shopAudit } from "@/api/shops";
import multipleMap from "@/components/map/multiple-map.vue";
import { ElMessage } from "element-plus";
import type { ApiResult } from "@/types/api";

defineOptions({ name: "shop-operation" });

const route = useRoute();
const router = useRouter();

const shopFormRef = ref<FormRefLike | null>(null);
const ossManageRef = ref<{ selectImage?: boolean } | null>(null);
const memberLayoutRef = ref<{ show?: () => void } | null>(null);
const map = ref<{ open?: () => void } | null>(null);

const shopId = ref(String(route.query.shopId ?? "")); // 店铺id
const isRead = ref(false); // 是否只读，只有在店铺通过审核才可修改
const selectedFormBtnName = ref(""); // 点击图片绑定form
const loading = ref(false);
const auditModel = ref(false);
const auditModalLoading = ref(false);
const picModelFlag = ref(false); // 图片选择器
const address = ref(""); // 地址
const returnAddress = ref(""); // 退货地址
const memberModalFlag = ref(false); // 商家账号
const settlementShow = ref(false); // 是否展示结算日输入框
const addSettlementConfirmBtn = ref(false); // 添加结算日确认按钮
const addSettlementBtn = ref(true); // 添加结算日按钮
const day = ref(1); //结算日
const tabName = ref("base"); // tab栏name值
const tabNameList = ref(["base", "entry", "category", "settlement"]); // tab栏name值数组
const shopValidate = reactive({
  // 表单验证规则
  memberName: [{ required: true, message: "会员不能为空" }],
  storeAddressPath: [{ required: true, message: "店铺地址不能为空" }],
  storeName: [{ required: true, message: "店铺名称不能为空" }],
  companyAddress: [{ required: true, message: "公司地址不能为空" }],
  storeAddressDetail: [{ required: true, message: "店铺详细地址不能为空" }],
  storeDesc: [{ required: true, message: "店铺简介不能为空" }],
  storeCenter: [{ required: true, message: "店铺未定位" }],
  companyName: [{ required: true, message: "公司名称不能为空" }],
  companyPhone: [{ required: true, message: "公司电话不能为空" }],
  employeeNum: [
    {
      required: true,
      type: "number",
      message: "员工总数不能为空",
      trigger: "blur",
    },
  ],
  companyAddressIdPath: [{ required: true, message: "请选择公司地址" }],
  registeredCapital: [
    {
      required: true,
      type: "number",
      message: "注册资金不能为空",
      trigger: "blur",
    },
  ],
  linkName: [{ required: true, message: "联系人姓名不能为空" }],
  linkPhone: [
    { required: true, message: "联系人手机号不能为空" },
    {
      type: "string",
      pattern: /^1[3|4|5|6|7|8][0-9]{9}$/,
      message: "手机号格式出错",
      trigger: "blur",
    },
  ],
  companyEmail: [
    { required: true, message: "邮箱不能为空" },
    { type: "email", message: "邮箱格式错误" },
  ],
  licenseNum: [{ required: true, message: "营业执照号不能为空" }],
  scope: [{ required: true, message: "法定经营范围不能为空" }],
  licencePhoto: [{ required: true, message: "营业执照电子版不能为空" }],
  legalName: [{ required: true, message: "法人姓名不能为空" }],
  legalId: [{ required: true, message: "法人证件号不能为空" }],
  settlementBankAccountName: [{ required: true, message: "银行开户名不能为空" }],
  settlementBankAccountNum: [{ required: true, message: "银行账号不能为空" }],
  settlementBankBranchName: [{ required: true, message: "银行支行名称不能为空" }],
  settlementBankJointName: [{ required: true, message: "支行联行号不能为空" }],

  salesConsigneeMobile: [
    {
      type: "string",
      pattern: /^1[3|4|5|6|7|8][0-9]{9}$/,
      message: "手机号格式出错",
      trigger: "blur",
    },
  ],
});
const indeterminate = ref(true); // 复选框全选样式
const checkAll = ref(false); // 全选
const checkAllGroup = ref<Array<string | number>>([]); // 全选数组
const settlementCycle = ref<string[]>([]); // 结算日
/** 店铺表单（含审核/地址/结算等扩展字段） */
type ShopForm = {
  // 店铺数据
  storeAddressPath: string;
  /** 店铺详细地址 */
  storeAddressDetail: string;
  /** 店铺地址 id 路径 */
  storeAddressIdPath: string;
  settlementCycle: string;
  selfOperated: string;
  memberName: string;
  /** 会员 id（选择会员写回） */
  memberId: string | number;
  companyName: string;
  addressPath: string;
  addressIdPath: string;
  companyAddressPath: string;
  companyAddressIdPath: string;
  companyAddress: string;
  companyEmail: string;
  employeeNum: number;
  registeredCapital: number;
  linkName: string;
  linkPhone: string;
  licenseNum: string;
  scope: string;
  licencePhoto: string;
  legalName: string;
  legalId: string;
  legalPhoto: string[];
  companyPhone: string;
  settlementBankAccountName: string;
  settlementBankAccountNum: string;
  settlementBankBranchName: string;
  settlementBankJointName: string;
  businesses: string;
  storeName: string;
  storeLogo: string;
  storeDesc: string;
  ddCode: string;
  /** 店铺状态（APPLYING / OPEN / CLOSED ...） */
  storeDisable: string;
  /** 店铺中心标识 */
  storeCenter: string;
  center: string;
  /** 经营类目 */
  goodsManagementCategory: string[] | string;
  // 收货地址（销售端）
  salesConsigneeName: string;
  salesConsigneeMobile: string;
  salesConsigneeAddressPath: string;
  salesConsigneeAddressIdPath: string;
  salesConsigneeDetail: string;
  [key: string]: unknown;
};

/** 空表单（新增页 / 保存成功后清空） */
function emptyShopForm(): ShopForm {
  return {
    storeAddressPath: "",
    storeAddressDetail: "",
    storeAddressIdPath: "",
    memberId: "",
    storeDisable: "",
    storeCenter: "",
    center: "",
    goodsManagementCategory: [],
    salesConsigneeName: "",
    salesConsigneeMobile: "",
    salesConsigneeAddressPath: "",
    salesConsigneeAddressIdPath: "",
    salesConsigneeDetail: "",
    settlementCycle: "",
    selfOperated: "false",
    memberName: "",
    companyName: "",
    addressPath: "",
    addressIdPath: "",
    companyAddressPath: "",
    companyAddressIdPath: "",
    companyAddress: "",
    companyEmail: "",
    employeeNum: 1,
    registeredCapital: 1,
    linkName: "",
    linkPhone: "",
    licenseNum: "",
    scope: "",
    licencePhoto: "",
    legalName: "",
    legalId: "",
    legalPhoto: ["", ""],
    companyPhone: "",
    settlementBankAccountName: "",
    settlementBankAccountNum: "",
    settlementBankBranchName: "",
    settlementBankJointName: "",
    businesses: "",
    storeName: "",
    storeLogo: "",
    storeDesc: "",
    ddCode: "",
  };
}

const shopForm = ref<ShopForm>({
  // 店铺数据
  storeAddressPath: "",
  storeAddressDetail: "",
  storeAddressIdPath: "",
  memberId: "",
  storeDisable: "",
  storeCenter: "",
  center: "",
  goodsManagementCategory: [],
  salesConsigneeName: "",
  salesConsigneeMobile: "",
  salesConsigneeAddressPath: "",
  salesConsigneeAddressIdPath: "",
  salesConsigneeDetail: "",

  settlementCycle: "",
  selfOperated: "false",
  memberName: "",
  companyName: "",
  addressPath: "",
  addressIdPath: "",
  companyAddressPath: "",
  companyAddressIdPath: "",
  companyAddress: "",
  companyEmail: "",
  employeeNum: 1,
  registeredCapital: 1,
  linkName: "",
  linkPhone: "",
  licenseNum: "",
  scope: "",
  licencePhoto: "",
  legalName: "",
  legalId: "",
  legalPhoto: ["", ""],
  companyPhone: "",
  settlementBankAccountName: "",
  settlementBankAccountNum: "",
  settlementBankBranchName: "",
  settlementBankJointName: "",
  businesses: "",
  storeName: "",
  storeLogo: "",
  storeDesc: "",
  ddCode: "",
});
const categories = ref<Array<{ id?: string | number; name?: string }>>([]); // 分类

/** 店铺详情（后端 DTO，字段很多且会扩容，边界处保留宽类型） */
const infoResult = ref<Record<string, unknown>>({}); // 店铺详情
/** 图片下标（-1 表示该字段不是数组） */
const picIndex = ref(-1);
const currentAddress = ref(""); //当前选中的地址

// 历史遗留：_regionClick 中未在 data 声明、直接挂到 this 上的字段
let _showRegion = false;
let _regionId = "";

/** 省市区选择器回传的一个节点 */
type RegionNode = {
  id?: string | number;
  name?: string;
  center?: unknown;
  position?: unknown;
  [key: string]: unknown;
};

/** 地图选点回传（点选具体位置时是这一种） */
type MapPick = {
  addr?: string;
  addrId?: string;
  position?: { lng?: string | number; lat?: string | number };
};

/** 省市区选择器回传：级联路径 或 地图选点 */
type RegionPick = { type?: string; data?: RegionNode[] | MapPick };

// 选择地址
function handleClickAddress(field: string) {
  currentAddress.value = field;
  map.value?.open?.();
}
// 选择会员的回调
function callbackMember(val: { id?: string | number; username?: string; memberId?: string | number; memberName?: string }) {
  if (val) {
    //选择会员后需要检验此会员是否开过店铺
    getShopByMemberId(String(val.id ?? "")).then((res) => {
      if (res.success) {
        if (res.result != null) {
          ElMessage.error("当前会员已经拥有店铺");
        } else {
          shopForm.value.memberId = val.id ?? "";
          shopForm.value.memberName = val.username ?? "";
        }
        memberModalFlag.value = false;
      }
    });
  }
}

//选择会员
function selectMember() {
  memberModalFlag.value = true;
}

//修改地址
function _regionClick() {
  _showRegion = true;
  _regionId = "";
}
//删除所选择的结算日
function removesettlementCycle(name: string) {
  settlementCycle.value = settlementCycle.value.filter((i) => i !== name);
}
//确认添加方法
function addsettlementCycle() {
  settlementShow.value = true;
  addSettlementConfirmBtn.value = true;
  addSettlementBtn.value = false;
}
//添加结算日
function addsettlementCycleConfirm() {
  if (!day.value) {
    ElMessage.warning("请输入正确的结算日，1-31的整数");
    return;
  }
  if (settlementCycle.value.includes(String(day.value))) {
    ElMessage.warning("已有该结算日，不能重复输入");
    return;
  }
  settlementCycle.value.push(String(day.value));
  addSettlementConfirmBtn.value = false;
  addSettlementBtn.value = true;
  settlementShow.value = false;
  day.value = 1;
}
//取消添加结算日
function cancelSettlementCycle() {
  addSettlementConfirmBtn.value = false;
  addSettlementBtn.value = true;
  settlementShow.value = false;
  day.value = 1;
}
// 选择公司地址
// 选择退货收件地址
// 选择图片modal
function handleCLickImg(val: string, index: number) {
  picModelFlag.value = true;
  selectedFormBtnName.value = val;
  picIndex.value = Number(index);
  nextTick(() => {
    if (ossManageRef.value) {
      ossManageRef.value.selectImage = true;
    }
  });
}
// 图片回显
function callbackSelected(val: { url?: string }) {
  picModelFlag.value = false;
  const url = String(val?.url ?? "");
  const form = shopForm.value as Record<string, unknown>;
  const key = selectedFormBtnName.value;
  if (picIndex.value === 0 || picIndex.value === 1) {
    const target = form[key];
    if (Array.isArray(target)) target[picIndex.value] = url;
  } else {
    form[key] = url;
  }
  picIndex.value = -1;
}
// 初始化数据
function init() {
  getCategories();
  if (shopId.value) {
    getShopDetail();
  }
}
function next() {
  // 下一步
  let index = tabNameList.value.indexOf(tabName.value) + 1;
  tabName.value = tabNameList.value[index];
}
function prev() {
  // 上一步
  let index = tabNameList.value.indexOf(tabName.value) - 1;
  tabName.value = tabNameList.value[index];
}
// 获取店铺详情
function getShopDetail() {
  shopDetail(shopId.value).then((res) => {
    if (res.success) {
      infoResult.value = (res.result ?? {}) as unknown as typeof infoResult.value;
      shopForm.value = (res.result ?? {}) as unknown as typeof shopForm.value;
      shopForm.value.selfOperated
        ? (shopForm.value.selfOperated = "true")
        : (shopForm.value.selfOperated = "false");

      checkAllGroup.value = String(shopForm.value.goodsManagementCategory ?? "").split(",");
      if (shopForm.value.settlementCycle) {
        settlementCycle.value = String(shopForm.value.settlementCycle ?? "").split(",");
      }
      shopForm.value.legalPhoto = String(shopForm.value.legalPhoto ?? "").split(",");

      address.value = shopForm.value.companyAddressIdPath;
      returnAddress.value = String(shopForm.value.salesConsigneeAddressIdPath ?? "");
    }
  });
}
// 保存
function save() {
  shopFormRef.value?.validate?.((valid: boolean) => {
    //校验结算日是否已经确认完成
    if (settlementShow.value) {
      ElMessage.error("请确认当前所填结算日信息");
      return;
    }
    //校验经营类目
    if (!checkAllGroup.value || checkAllGroup.value.length === 0) {
      ElMessage.error("请选择店铺经营类目");
      tabName.value = "category";
      return;
    }
    if (valid) {
      const params = JSON.parse(JSON.stringify(shopForm.value));
      //处理经营类目，结算日
      params.goodsManagementCategory = checkAllGroup.value;
      params.settlementCycle = settlementCycle.value;
      if (shopId.value) {
        delete params.memberId;
        shopEdit(shopId.value, filterFun(params)).then((res) => {
          if (res.success) {
            ElMessage.success("编辑成功");
            router.push({ name: "shop-list" });
          }
        });
      } else {
        //添加店铺单独需要检验的参数
        if (params.memberName == "") {
          ElMessage.error("请选择开店的会员");
          return;
        }
        shopAdd(filterFun(params)).then((resp: ApiResult) => {
          if (resp.success) {
            ElMessage.success("添加成功");
            shopForm.value = emptyShopForm();
            router.push({ name: "shop-list" });
          }
        });
      }
    }
  });
}
// 筛选值为空的参数
function filterFun(params: Record<string, unknown>) {
  Object.entries(params).map((value) => {
    if (!value[1] || value[1] === "" || value[1] === "null") {
      delete params[value[0]];
    }
  });
  return params;
}
// 点击定位获取店铺地址
function getAddress(val: RegionPick) {
  if (val.type === "select") {
    const nodes = (val.data ?? []) as RegionNode[];
    const paths = nodes.map((item) => item.name).join(",");

    const ids = nodes.map((item) => item.id).join(",");

    if (currentAddress.value === "storeAddressPath") {
      shopForm.value.storeAddressPath = paths;
      shopForm.value.storeAddressIdPath = ids;

      shopForm.value.center = String(nodes[nodes.length - 1]?.center ?? "");
    } else if (currentAddress.value === "salesConsigneeAddressPath") {
      shopForm.value.salesConsigneeAddressPath = paths;
      shopForm.value.salesConsigneeAddressId = ids;
    } else if (currentAddress.value === "companyAddressPath") {
      shopForm.value.companyAddressPath = paths;
      shopForm.value.companyAddressIdPath = ids;
    }
  } else {
    const picked = (val.data ?? {}) as MapPick;
    if (currentAddress.value === "storeAddressPath") {
      const lng = picked.position?.lng ?? "";
      const lat = picked.position?.lat ?? "";
      shopForm.value.storeCenter = `${lng},${lat}`;
      shopForm.value.storeAddressPath = picked.addr ?? "";
      shopForm.value.storeAddressIdPath = picked.addrId ?? "";
    } else if (currentAddress.value === "salesConsigneeAddressPath") {
      shopForm.value.salesConsigneeAddressPath = picked.addr ?? "";
      shopForm.value.salesConsigneeAddressId = picked.addrId ?? "";
    } else if (currentAddress.value === "companyAddressPath") {
      shopForm.value.companyAddressPath = picked.addr ?? "";
      shopForm.value.companyAddressIdPath = picked.addrId ?? "";
    }
  }
}
// 全部选中
function handleCheckAll(checked: string | number | boolean) {
  indeterminate.value = false;
  if (checked) {
    const checkAllDate: Array<string | number> = [];
    categories.value.forEach((i) => checkAllDate.push(String(i.id)));
    checkAllGroup.value = checkAllDate;
  } else {
    checkAllGroup.value = [];
  }
}
// 经营类目的选择
function checkAllGroupChange(data: Array<string | number | boolean>) {
  if (data.length === categories.value.length) {
    indeterminate.value = false;
    checkAll.value = true;
  } else if (data.length > 0) {
    indeterminate.value = true;
    checkAll.value = false;
  } else {
    indeterminate.value = false;
    checkAll.value = false;
  }
}
// 获取所有分类
function getCategories() {
  getCategoryTree().then((res) => {
    if (res.success) {
      categories.value = (res.result ?? []) as unknown as typeof categories.value;
    }
  });
}
function auditHandler() {
  auditModel.value = true;
}
// 审核店铺
function audit(operation: string) {
  const rawId = route.query.shopId;
  const id = String(Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "");
  if (operation === "PASS") {
    shopAudit(id, true).then((res) => {
      auditModel.value = false;
      if (res.success) {
        ElMessage.success("操作成功");
        router.push({ name: "shop-auth" });
      }
    });
  } else {
    shopAudit(id, false).then((res) => {
      auditModel.value = false;
      if (res.success) {
        ElMessage.success("操作成功");
        router.push({ name: "shop-auth" });
      }
    });
  }
}

init();
</script>
<style lang="scss" scoped>
.selectedMember {
  width: 100%;
}

.mask {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(105, 105, 105, 0.1);
  z-index: 9;
}

:deep(.el-tabs__header) {
  margin: 0;
}

.tab {
  padding: 16px;
  position: relative;
}

.category-panel {
  width: 100%;
  max-width: 960px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.category-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8f9fb;
  border-bottom: 1px solid #e4e7ed;

  :deep(.el-checkbox) {
    height: 32px;
  }
}

.category-count {
  font-size: 12px;
  color: #909399;
}

.settlement-alert {
  margin-bottom: 16px;
}

.settlement-panel {
  width: 100%;
  max-width: 960px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.settlement-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 16px;
  min-height: 60px;
}

.settlement-tag {
  margin: 0;
}

.settlement-empty {
  color: #909399;
  font-size: 13px;
}

.settlement-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-top: 1px solid #ebeef5;
  background: #f8f9fb;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;

  :deep(.el-checkbox) {
    height: auto;
    margin-right: 0;
    padding: 5px 14px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    background: #fff;
    transition: border-color 0.2s, background-color 0.2s;

    &:hover {
      border-color: var(--el-color-primary, #409eff);
    }

    &.is-checked {
      border-color: var(--el-color-primary, #409eff);
      background-color: var(--el-color-primary-light-9, #ecf5ff);
    }

    .el-checkbox__label {
      padding-left: 6px;
    }
  }
}

.img {
  margin-right: 10px;
  width: 100px;
  height: 100px;
}

.item {
  width: 350px !important;
  display: flex;

  > * {
    margin: 0 4px;
  }
}
.legal-photo {
  width: 100px;
  height: 100px;
  cursor: pointer;
}
.store-logo-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.legal-photo-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.legal-photo-list {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-tip {
  color: #999;
  font-size: 12px;
  line-height: 1.5;
}
</style>

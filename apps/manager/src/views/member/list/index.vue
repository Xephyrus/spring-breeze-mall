<template>
  <div class="search">
    <el-card>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        label-width="70px"
        class="search-form"
        @keyup.enter="handleSearch"
      >
        <el-form-item label="客户ID" prop="id">
          <el-input v-model="searchForm.id" placeholder="请输入客户ID" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="客户名称" prop="_username">
          <el-input v-model="searchForm._username" placeholder="请输入客户名称" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="会员昵称" prop="nickName">
          <el-input v-model="searchForm.nickName" placeholder="请输入会员昵称" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="联系方式" prop="mobile">
          <el-input v-model="searchForm.mobile" placeholder="请输入会员联系方式" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="会员分组" prop="groupId">
          <el-select v-model="searchForm.groupId" clearable filterable style="width: 240px">
            <el-option
              v-for="item in memberGroupList"
              :key="item.id"
              :value="item.id ?? ''"
              :label="item.groupName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="会员等级" prop="gradeId">
          <el-select v-model="searchForm.gradeId" clearable filterable style="width: 240px">
            <el-option
              v-for="item in memberGradeList"
              :key="item.id"
              :value="item.id ?? ''"
              :label="item.gradeName"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-tabs v-if="!selectedMember" v-model="memberStatus" @tab-change="handleStatusChange">
        <el-tab-pane label="全部" name="ALL" />
        <el-tab-pane label="启用" name="OPEN" />
        <el-tab-pane label="禁用" name="CLOSE" />
      </el-tabs>
      <div v-if="!selectedMember" class="operation padding-row">
        <el-button type="primary" @click="addMember">添加会员</el-button>
        <el-button
          style="margin-left: 10px"
          type="primary"
          :disabled="selectedRows.length === 0"
          @click="openSetMemberGroup"
        >设定会员分组</el-button>
      </div>

      <el-table
        ref="table"
        v-loading="loading"
        border
        :data="data"
        class="mt_10"
        style="width: 100%"
        row-key="id"
        @selection-change="onSelectionChange"
      >
        <el-table-column
          v-if="!selectedMember || checkboxSelect"
          type="selection"
          width="60"
          align="center"
          :reserve-selection="checkboxSelect"
        />
        <el-table-column prop="id" label="客户ID" min-width="120" show-overflow-tooltip />
        <el-table-column label="头像" min-width="80" align="center">
          <template #default="{ row }">
            <img
              v-if="row"
              :src="row.face || defaultPic"
              alt="头像"
              style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="_username" label="客户名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="nickName" label="会员昵称" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="!selectedMember" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'success' : 'info'">{{ row.disabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" min-width="130">
          <template #default="{ row }">
            <span v-if="row">{{ row.mobile || "" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" min-width="160" />
        <el-table-column prop="lastLoginDate" label="最后登录时间" min-width="160" />
        <el-table-column label="积分数量" min-width="120" align="left">
          <template #default="{ row }">
            <span v-if="row">{{ row.point == void 0 ? "0" : row.point }}</span>
          </template>
        </el-table-column>
        <el-table-column label="经验值" min-width="100">
          <template #default="{ row }">
            <span v-if="row">{{ row.experience == null ? "0" : row.experience }}</span>
          </template>
        </el-table-column>
        <el-table-column label="会员等级" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row">{{ row.gradeName || "-" }}</span>
          </template>
        </el-table-column>
        <!-- 会员分组：客户与分组是多对多，后端按 memberId 批量回填 groupNames -->
        <el-table-column label="会员分组" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row">{{ row.groupNames || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="余额" width="120">
          <template #default="{ row }">
            <priceColorScheme v-if="row" :value="row.memberWallet" :color="$mainColor" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="!selectedMember || !checkboxSelect"
          label="操作"
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div v-if="row" style="display: flex; justify-content: center; align-items: center">
              <template v-if="selectedMember && !checkboxSelect">
                <a class="link-text" @click="callback(row)">
                  {{ row.___selected ? "已选择" : "选择" }}
                </a>
              </template>
              <template v-else>
                <a class="link-text" @click="detail(row)">查看</a>
                <span class="op-split">|</span>
                <el-dropdown trigger="click" @command="(cmd) => handleMoreCommand(cmd, row)">
                  <a class="link-text">
                    更多
                    <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
                  </a>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑会员</el-dropdown-item>
                      <el-dropdown-item command="increaseWallet">增加余额</el-dropdown-item>
                      <el-dropdown-item command="updatePoint">修改积分</el-dropdown-item>
                      <el-dropdown-item command="disabled">{{ row.disabled ? '禁用会员' : '启用会员' }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt_10" style="display: flex; justify-content: flex-end">
        <TablePager v-model:page="searchForm.pageNumber" v-model:size="searchForm.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[20, 50, 100]" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog v-model="addFlag" title="添加会员" width="500px" destroy-on-close class="add-member-dialog">
      <el-form
        ref="addMemberFormRef"
        :model="addMemberForm"
        :rules="addRule"
        label-width="100px"
      >
        <el-form-item label="手机号码" prop="mobile" style="width: 90%">
          <el-input
            v-model="addMemberForm.mobile"
            maxlength="11"
            placeholder="请输入手机号码"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item label="客户名称" prop="_username" style="width: 90%">
          <el-input
            v-model="addMemberForm._username"
            maxlength="15"
            placeholder="请输入客户名称"
            autocomplete="off"
            name="member-_username"
          />
        </el-form-item>
        <el-form-item label="会员密码" prop="password" style="width: 90%">
          <el-input
            v-model="addMemberForm.password"
            type="password"
            show-password
            maxlength="20"
            placeholder="请输入会员密码"
            autocomplete="new-password"
            name="member-password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFlag = false">取消</el-button>
        <el-button type="primary" @click="addMemberSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="descFlag" :title="descTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="ruleValidate" label-width="80px">
        <el-input v-model="form.id" style="display: none" />
        <el-form-item label="头像">
          <img alt="会员头像" :src="form.face || defaultPic" class="face" />
          <el-button
            type="primary"
            link
            class="upload"
            @click="openPicSelector"
          >修改</el-button>
        </el-form-item>
        <el-form-item label="用户名" prop="name">
          <el-input v-model="form._username" style="width: 200px" disabled />
        </el-form-item>
        <el-form-item label="用户昵称" prop="name">
          <el-input v-model="form.nickName" style="width: 200px" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="form.sex">
            <el-radio-button :value="1">男</el-radio-button>
            <el-radio-button :value="0">女</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="修改密码" prop="password">
          <el-input v-model="form.newPassword" type="password" show-password style="width: 220px" />
        </el-form-item>
        <el-form-item label="生日" prop="birthday">
          <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width: 220px" />
        </el-form-item>
        <el-form-item label="所在地" prop="mail">
          {{ form.region || "暂无地址" }}
          <el-button style="margin-left: 10px" @click="mapRef?.open()">选择</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="descFlag = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitModal">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="walletIncreaseFlag" title="增加余额" width="420px" destroy-on-close>
      <el-form ref="walletIncreaseFormRef" :model="walletIncreaseForm" :rules="walletIncreaseRule" label-width="90px">
        <el-form-item label="充值金额" prop="rechargeMoney">
          <el-input-number v-model="walletIncreaseForm.rechargeMoney" :min="0.01" :precision="2" style="width: 240px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="walletIncreaseFlag = false">取消</el-button>
        <el-button type="primary" :loading="walletIncreaseLoading" @click="submitWalletIncrease">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="memberPointFlag" title="修改积分" width="420px" destroy-on-close>
      <el-form ref="memberPointFormRef" :model="memberPointForm" :rules="memberPointRule" label-width="90px">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="memberPointForm.type">
            <el-radio-button value="INCREASE">增加</el-radio-button>
            <el-radio-button value="REDUCE">减少</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分" prop="point">
          <el-input-number v-model="memberPointForm.point" :min="1" :precision="0" style="width: 240px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberPointFlag = false">取消</el-button>
        <el-button type="primary" :loading="memberPointLoading" @click="submitMemberPoint">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="memberGroupFlag" title="设定会员分组" width="420px" destroy-on-close>
      <el-form ref="memberGroupFormRef" :model="memberGroupForm" :rules="memberGroupRule" label-width="90px">
        <el-form-item label="会员分组" prop="groupId">
          <el-select v-model="memberGroupForm.groupId" clearable filterable style="width: 240px">
            <el-option
              v-for="item in memberGroupList"
              :key="item.id"
              :value="item.id ?? ''"
              :label="item.groupName"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberGroupFlag = false">取消</el-button>
        <el-button type="primary" :loading="memberGroupLoading" @click="submitSetMemberGroup">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="picModelFlag" width="1200px">
      <ossManage ref="ossManageRef" @callback="callbackSelected" :isComponent="true" :initialize="picModelFlag" />
    </el-dialog>
    <multipleMap ref="mapRef" @callback="selectedRegion" />
  </div>
</template>

<script setup lang="ts">
import { useTable } from "@/utils/use-table";
import { ref, watch, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ArrowDown } from "@element-plus/icons-vue";
import multipleMap from "@/components/map/multiple-map.vue";
import * as API_Member from "@/api/member";
import ossManage from "@/views/sys/oss-manage/oss-manage.vue";
import * as RegExp from "@/libs/reg-exp";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormItemRule, TabPaneName } from "element-plus";
import { customRouterPush } from "@/utils/filters";
import { md5 } from "@/utils/md5";
import defaultPic from "@/assets/default.png";

defineOptions({ name: "member" });

const route = useRoute();

const props = defineProps({
  selectedMember: {
    type: Boolean,
    default: false,
  },
  selectedList: {
    type: null,
    default: () => [],
  },
  checkboxSelect: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["callback"]);

/** Element Plus 校验回调 */
type ValidateCallback = (error?: Error) => void;

/** el-form 实例（只声明真正用到的能力） */
type FormInstance = {
  validate: (callback?: (valid: boolean) => void) => void;
  validateField: (field: string, callback?: () => void) => void;
  resetFields?: () => void;
  clearValidate?: () => void;
};

/** el-table 实例 */
type TableInstance = {
  toggleRowSelection: (row: MemberRow, selected?: boolean) => void;
  clearSelection: () => void;
};

/** 会员行（列表/选择器返回） */
type MemberRow = {
  /** 主键（后端必然返回；可选以兼容 el-table slot 的行类型） */
  id?: string | number;
  mobile?: string;
  username?: string;
  /** 管理端展示用的用户名（后端 MemberVO 字段名带下划线） */
  _username?: string;
  nickName?: string;
  /** 后端在列表里给 0/1，在实体里给 boolean，统一按可 truthy 处理 */
  disabled?: string | number | boolean;
  groupId?: string | number;
  gradeId?: string | number;
  gradeName?: string;
  /** 所属分组名称（后端 MemberVO.groupNames，多个用「、」连接） */
  groupNames?: string;
  point?: number;
  experience?: number;
  memberWallet?: number;
  createTime?: string;
  lastLoginDate?: string;
  /** 选择态标记（本页内部用） */
  ___selected?: boolean;
};

/** 会员分组 / 等级下拉项 */
type MemberGroupOption = {
  id?: string | number;
  groupName?: string;
  gradeName?: string;
  [key: string]: unknown;
};

/** 会员详情表单 */
type MemberForm = {
  id?: string | number;
  memberId?: string | number;
  mobile?: string;
  nickName?: string;
  username?: string;
  _username?: string;
  password?: string;
  newPassword?: string;
  birthday?: string;
  sex?: string | number | boolean | undefined;
  disabled?: string;
  groupId?: string | number;
  gradeId?: string | number;
  point?: number;
  face?: string;
  region?: string;
  regionId?: string;
  mail?: string;
};

/** 列表搜索条件 */

// 模板 el-form/el-table 的模板 ref（原 ref="searchForm"/"addMemberForm"/"form" 等与 data 同名会互相覆盖，
// 改名为 xxxRef；ossManage 与 import 同名，改名 ossManageRef）
const searchFormRef = ref<FormInstance | null>(null);
const table = ref<TableInstance | null>(null);
const addMemberFormRef = ref<FormInstance | null>(null);
const formRef = ref<FormInstance | null>(null);
const walletIncreaseFormRef = ref<FormInstance | null>(null);
const memberPointFormRef = ref<FormInstance | null>(null);
const memberGroupFormRef = ref<FormInstance | null>(null);
/** 素材库：只需要打开选择态 */
const ossManageRef = ref<{ selectImage?: boolean } | null>(null);
/** 行政区划选择弹窗 */
const mapRef = ref<{ open: () => void } | null>(null);

const descTitle = ref("");
const descFlag = ref(false);
const addFlag = ref(false);
const addMemberForm = ref({
  mobile: "",
  _username: "",
  password: "",
});
/** el-tabs 的 v-model 值是 TabPaneName（string | number） */
const memberStatus = ref<TabPaneName>("ALL");
// 分页 / loading / data / total / 查询 交给 useTable。
// 注意：groupId 直接从路由取初值，否则 useTable 的 immediate 会早于 onMounted 里的赋值。
const {
  loading,
  data,
  total,
  searchForm,
  getDataList: getData,
  handleCurrentChange,
  handleSizeChange,
  handleSearch,
} = useTable<MemberRow>(API_Member.getMemberListData, {
  form: {
    order: "desc",
    id: "",
    _username: "",
    nickName: "",
    mobile: "",
    disabled: props.selectedMember ? "OPEN" : "",
    groupId: route.query.groupId ? String(route.query.groupId) : "",
    gradeId: "",
  },
  pageSize: 20,
  beforeRequest: (params) => {
    // 原逻辑：非「选中会员」模式下，请求前清空勾选
    if (!props.selectedMember) {
      selectedRows.value = [];
      clearSelection();
    }
    return params;
  },
  onSuccess: (_res, parsed) => {
    // 原逻辑：列表数据加工（勾选态回填）+ 同步表格选中
    init(parsed.records as MemberRow[]);
    syncTableSelection();
  },
});
const picModelFlag = ref(false);
const form = ref<MemberForm>({});
const walletIncreaseFlag = ref(false);
const walletIncreaseLoading = ref(false);
const walletIncreaseForm = ref<{
  memberId: string | number;
  rechargeMoney: number | null | undefined;
}>({
  memberId: "",
  rechargeMoney: null,
});
const walletIncreaseRule = ref({
  rechargeMoney: [
    { required: true, type: "number", message: "请输入充值金额", trigger: "change" },
    {
      validator: (_rule: unknown, value: unknown, callback: ValidateCallback) => {
        if (typeof value !== "number" || value <= 0) {
          callback(new Error("充值金额必须大于0"));
          return;
        }
        callback();
      },
      trigger: "change",
    },
  ],
});
const memberPointFlag = ref(false);
const memberPointLoading = ref(false);
const memberPointForm = ref<{
  memberId: string | number;
  point: number | null | undefined;
  type: string | number | boolean | undefined;
}>({
  memberId: "",
  point: null,
  type: "INCREASE",
});
const selectedRows = ref<MemberRow[]>([]);
const memberGroupFlag = ref(false);
const memberGroupLoading = ref(false);
const memberGroupForm = ref<{ groupId: string | number }>({
  groupId: "",
});
const memberGroupRule = ref({
  groupId: [{ required: true, message: "请选择会员分组", trigger: "change" }],
});
const memberGroupList = ref<MemberGroupOption[]>([]);
const memberGradeList = ref<MemberGroupOption[]>([]);
const memberPointRule = ref({
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  point: [
    { required: true, type: "number", message: "请输入积分", trigger: "change" },
    {
      validator: (_rule: unknown, value: unknown, callback: ValidateCallback) => {
        if (typeof value !== "number" || value <= 0) {
          callback(new Error("积分必须大于0"));
          return;
        }
        callback();
      },
      trigger: "change",
    },
  ],
});
const addRule = ref({
  mobile: [
    { required: true, message: "请输入手机号码" },
    { pattern: RegExp.mobile, message: "请输入正确的手机号" },
  ],
  _username: [{ required: true, message: "请输入客户名称" }],
  password: [{ required: true, message: "请输入密码" }],
});
const ruleValidate = ref<Record<string, FormItemRule[]>>({});
const selectMember = ref<MemberRow[]>([]);

watch(
  () => props.selectedList,
  (val: MemberRow[]) => {
    selectMember.value = JSON.parse(JSON.stringify(val));
    init(data.value);
  },
  { deep: true, immediate: true }
);

function handleMoreCommand(name: string, row: MemberRow) {
  if (name === "edit") editPerm(row);
  if (name === "disabled") disabled(row);
  if (name === "increaseWallet") openWalletIncrease(row);
  if (name === "updatePoint") openMemberPoint(row);
}
function onSelectionChange(selection: MemberRow[]) {
  if (props.selectedMember && props.checkboxSelect) {
    selectMember.value = selection || [];
    return;
  }
  selectedRows.value = selection || [];
}
function getSelection() {
  return selectMember.value || [];
}
function syncTableSelection() {
  if (!props.selectedMember || !props.checkboxSelect) {
    return;
  }
  nextTick(() => {
    clearSelection();
    data.value.forEach((row) => {
      if (selectMember.value.some((member) => member.id === row.id)) {
        table.value?.toggleRowSelection(row, true);
      }
    });
  });
}
function openSetMemberGroup() {
  memberGroupFlag.value = true;
  memberGroupLoading.value = false;
  memberGroupForm.value = { groupId: "" };
  nextTick(() => {
    memberGroupFormRef.value?.resetFields?.();
  });
  loadMemberGroupList();
}
function loadMemberGroupList() {
  API_Member.getMemberGroupByPage({ pageNumber: 1, pageSize: 1000 }).then((res) => {
    if (res && res.success && res.result) {
      memberGroupList.value = res.result.records || [];
    }
  });
}
function loadMemberGradeList() {
  API_Member.getMemberGradeByPage({ pageNumber: 1, pageSize: 1000 }).then((res) => {
    if (res && res.success && res.result) {
      memberGradeList.value = (res.result ?? []) as unknown as typeof memberGradeList.value;
    }
  });
}
function clearSelection() {
  table.value?.clearSelection();
}
function submitSetMemberGroup() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择会员");
    return;
  }
  memberGroupFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    const memberIds = selectedRows.value
      .map((item) => item.id)
      .filter((id): id is string | number => id !== undefined);
    const groupId = memberGroupForm.value.groupId as string | number;
    if (!memberIds.length) {
      ElMessage.warning("请先选择会员");
      return;
    }
    memberGroupLoading.value = true;
    // 一次请求由后端在单事务内完成：前端若并发发起 N 个请求，
    // 每个事务都会去删/插同一张关联表，极易死锁（曾表现为 400 服务器繁忙）。
    API_Member.setMembersUserGroups(memberIds, [groupId])
      .then((res) => {
        memberGroupLoading.value = false;
        if (!res || !res.success) {
          ElMessage.error(res?.message || "设置失败");
          return;
        }
        ElMessage.success("设置成功");
        memberGroupFlag.value = false;
        selectedRows.value = [];
        clearSelection();
        getData();
      })
      .catch(() => {
        memberGroupLoading.value = false;
        ElMessage.error("设置失败，请稍后重试");
      });
  });
}
function callback(val: MemberRow) {
  selectMember.value.forEach((item) => {
    item.___selected = false;
  });
  val.___selected = !val.___selected;
  const findUser = selectMember.value.find((item) => item.id == val.id);
  if (!findUser) {
    selectMember.value.push(val);
  } else {
    selectMember.value.map((item, index: number) => {
      if (item.id == findUser.id) {
        selectMember.value.splice(index, 1);
      }
    });
  }
  emit("callback", val);
}
function init(list: MemberRow[]) {
  list.forEach((item) => {
    if (selectMember.value.length != 0) {
      selectMember.value.forEach((member) => {
        if (member.id == item.id) {
          item.___selected = true;
        }
      });
    } else {
      item.___selected = false;
    }
  });
  data.value = list;
}
function handleStatusChange(name: TabPaneName) {
  const status = String(name);
  searchForm.disabled = status === "ALL" ? "" : status;
  searchForm.pageNumber = 1;
  getData();
}
function editPerm(row: MemberRow) {
  descTitle.value = `查看用户 ${row._username ?? row.nickName ?? ""}`;
  descFlag.value = true;
  getMemberInfo(row.id ?? "");
}
function addMember() {
  addMemberForm.value = {
    mobile: "",
    _username: "",
    password: "",
  };
  addFlag.value = true;
  nextTick(() => {
    addMemberFormRef.value?.clearValidate?.();
  });
}
function getMemberInfo(id: string | number) {
  API_Member.getMemberInfoData(id).then((res) => {
    if (res.result) {
      form.value = res.result as unknown as typeof form.value;
    }
  });
}
function openPicSelector() {
  picModelFlag.value = true;
  nextTick(() => {
    if (ossManageRef.value) {
      ossManageRef.value.selectImage = true;
    }
  });
}
function callbackSelected(val: { url?: string }) {
  picModelFlag.value = false;
  form.value.face = val.url;
}
function addMemberSubmit() {
  addMemberFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    // 后端 MemberAddDTO 的字段是 username（@NotEmpty「客户用户名必填」），
    // 表单内部沿用历史命名 _username，提交时必须映射成 username。
    // 密码在提交时才算 md5：放到前面算会让「校验失败后重试」重复加密一次。
    const payload = {
      username: addMemberForm.value._username,
      mobile: addMemberForm.value.mobile,
      password: md5(addMemberForm.value.password),
    };
    API_Member.addMember(payload).then((res) => {
      if (res.result) {
        addMemberFormRef.value?.resetFields?.();
        getData();
        ElMessage.success("添加成功！");
        addFlag.value = false;
      }
    });
  });
}
/**
 * multiple-map 的 callback 载荷有两种形态：
 * - 逐级选择：{ type: "select", data: [{ id, name }, ...] }
 * - 地图选点：{ type: "map", data: { addr, addrId, ... } }
 */
function selectedRegion(val: { type?: string; data?: unknown }) {
  if (val.type === "select" && Array.isArray(val.data)) {
    const list = val.data as Array<{ name?: string; id?: string | number }>;
    form.value.region = list.map((item) => item.name ?? "").join(",");
    form.value.regionId = list.map((item) => String(item.id ?? "")).join(",");
    return;
  }
  const picked = (val.data ?? {}) as { addr?: string; addrId?: string };
  form.value.region = picked.addr ?? "";
  form.value.regionId = picked.addrId ?? "";
}
function detail(row: MemberRow) {
  customRouterPush({ name: "member-detail", query: { id: row.id } });
}
function disabled(row: MemberRow) {
  const action = row.disabled ? "禁用" : "启用";
  const params = {
    memberIds: [row.id],
    disabled: !row.disabled,
  };
  ElMessageBox.confirm(`确认${action}此会员？`, "提示", { type: "warning" }).then(() => {
    API_Member.updateMemberStatus(params).then((res) => {
      if (res.success) {
        ElMessage.success(`${action}成功`);
        getData();
      }
    });
  }).catch(() => {});
}
function openWalletIncrease(row: MemberRow) {
  walletIncreaseLoading.value = false;
  walletIncreaseForm.value = { memberId: row.id ?? "", rechargeMoney: null };
  walletIncreaseFlag.value = true;
  nextTick(() => {
    walletIncreaseFormRef.value?.resetFields?.();
  });
}
function submitWalletIncrease() {
  walletIncreaseFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    walletIncreaseLoading.value = true;
    API_Member.increaseMemberWallet({
      memberId: walletIncreaseForm.value.memberId,
      rechargeMoney: walletIncreaseForm.value.rechargeMoney,
    })
      .then((res) => {
        if (res && res.success) {
          ElMessage.success("充值成功");
          walletIncreaseFlag.value = false;
          getData();
        } else {
          ElMessage.error((res && res.message) || "充值失败");
        }
      })
      .finally(() => {
        walletIncreaseLoading.value = false;
      });
  });
}
function openMemberPoint(row: MemberRow) {
  memberPointLoading.value = false;
  memberPointForm.value = { memberId: row.id ?? "", point: null, type: "INCREASE" };
  memberPointFlag.value = true;
  nextTick(() => {
    memberPointFormRef.value?.resetFields?.();
  });
}
function submitMemberPoint() {
  memberPointFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    memberPointLoading.value = true;
    API_Member.updateMemberPoint({
      memberId: memberPointForm.value.memberId,
      point: memberPointForm.value.point,
      type: memberPointForm.value.type,
    })
      .then((res) => {
        if (res && res.success) {
          ElMessage.success("修改成功");
          memberPointFlag.value = false;
          getData();
        } else {
          ElMessage.error((res && res.message) || "修改失败");
        }
      })
      .finally(() => {
        memberPointLoading.value = false;
      });
  });
}
function handleSubmitModal() {
  const { nickName, sex, _username, face, newPassword, id, regionId, region } = form.value;
  const time = form.value.birthday ? new Date(form.value.birthday) : null;
  const birthday = time
    ? time.getFullYear() + "-" + (time.getMonth() + 1) + "-" + time.getDate()
    : "";
  const submit: Record<string, unknown> = {
    regionId,
    region,
    nickName,
    sex,
    birthday,
    face,
    id,
  };
  if (newPassword) {
    submit.password = md5(newPassword);
  }
  API_Member.updateMember(submit).then((res) => {
    if (res.result) {
      ElMessage.success("修改成功！");
      descFlag.value = false;
      getData();
    }
  });
}

onMounted(() => {
  loadMemberGroupList();
  loadMemberGradeList();
});

watch(
  () => route.query.groupId,
  (val) => {
    if (val !== undefined) {
      searchForm.groupId = val ? String(val) : "";
      searchForm.pageNumber = 1;
      getData();
    }
  }
);

// 外部通过 ref 调用（promotions/coupon-activity/coupon-publish.vue 的 memberLayoutRef.getSelection()）
defineExpose({ getSelection });
</script>
<style lang="scss" scoped>
.face {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}
.link-text {
  color: #2d8cf0;
  cursor: pointer;
  text-decoration: none;
}
.op-split {
  margin: 0 8px;
  color: #dcdee2;
}

.add-member-dialog {
  :deep(.el-input__wrapper) {
    background-color: #fff !important;
    box-shadow: 0 0 0 1px var(--el-border-color) inset !important;

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
    }
  }

  :deep(.el-input__inner) {
    background-color: transparent !important;

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
      box-shadow: 0 0 0 1000px #fff inset !important;
      -webkit-text-fill-color: #606266 !important;
      caret-color: #606266;
      transition: background-color 99999s ease-out;
    }
  }
}
</style>

<template>
  <div class="setting-page">
    <el-form ref="formValidateRef" label-width="180px" label-position="right" :model="formValidate" :rules="ruleValidate">
      <div class="setting-section">
        <div class="section-title">基础设置</div>
        <el-form-item label="是否测试模式" prop="isTestModel">
          <div class="field-item">
            <el-radio-group v-model="formValidate.isTestModel">
              <el-radio-button value="true">开启</el-radio-button>
              <el-radio-button value="false">关闭</el-radio-button>
            </el-radio-group>
            <span class="field-desc">测试模式则不实际发送短信，短信验证码为：111111</span>
          </div>
        </el-form-item>
      </div>

      <div class="setting-section">
        <div class="section-title">短信模板</div>
        <el-form-item label="登录短信模板CODE" prop="loginTemplateCode">
          <el-input v-model="formValidate.loginTemplateCode"/>
        </el-form-item>
        <el-form-item label="注册短信模板CODE" prop="registerTemplateCode">
          <el-input v-model="formValidate.registerTemplateCode"/>
        </el-form-item>
        <el-form-item label="找回密码短信模板CODE" prop="findPasswordTemplateCode">
          <el-input v-model="formValidate.findPasswordTemplateCode"/>
        </el-form-item>
        <el-form-item label="设置密码短信模板CODE" prop="walletPasswordTemplateCode">
          <el-input v-model="formValidate.walletPasswordTemplateCode"/>
        </el-form-item>
        <el-form-item label="支付密码短信模板CODE" prop="payPasswordTemplateCode">
          <el-input v-model="formValidate.payPasswordTemplateCode"/>
        </el-form-item>
      </div>

      <div class="setting-section">
        <div class="section-title">平台配置</div>
        <el-form-item label="平台" prop="endPoint">
          <el-radio-group v-model="formValidate.type">
            <el-radio-button value="ALI">阿里云</el-radio-button>
            <el-radio-button value="HUAWEI">华为云</el-radio-button>
            <el-radio-button value="TENCENT">腾讯云</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <!--      阿里云-->
        <el-form-item v-if="formValidate.type==='ALI'" label="accessKeyId" prop="accessKeyId">
          <el-input v-model="formValidate.accessKeyId"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='ALI'" label="accessSecret" prop="accessSecret">
          <el-input v-model="formValidate.accessSecret"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='ALI'" label="短信签名" prop="signName">
          <el-input v-model="formValidate.signName"/>
        </el-form-item>

        <!--      华为云-->
        <el-form-item v-if="formValidate.type==='HUAWEI'" label="APP_Key" prop="huaweiAppKey">
          <el-input v-model="formValidate.huaweiAppKey"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='HUAWEI'" label="APP_Secret" prop="huaweiAppSecret">
          <el-input v-model="formValidate.huaweiAppSecret"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='HUAWEI'" label="短信签名通道号" prop="huaweiSender">
          <el-input v-model="formValidate.huaweiSender"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='HUAWEI'" label="短信签名" prop="huaweiSignature">
          <el-input v-model="formValidate.huaweiSignature"/>
        </el-form-item>

        <!--      腾讯云-->
        <el-form-item v-if="formValidate.type==='TENCENT'" label="用户的 SecretId" prop="tencentSecretId">
          <el-input v-model="formValidate.tencentSecretId"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='TENCENT'" label="用户的 SecretKey" prop="tencentSecretKey">
          <el-input v-model="formValidate.tencentSecretKey"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='TENCENT'" label="短信应用ID" prop="tencentSdkAppId">
          <el-input v-model="formValidate.tencentSdkAppId"/>
        </el-form-item>
        <el-form-item v-if="formValidate.type==='TENCENT'" label="短信签名" prop="tencentSignName">
          <el-input v-model="formValidate.tencentSignName"/>
        </el-form-item>
      </div>

      <div class="submit-bar">
        <el-button type="primary" @click="submit('formValidateRef')">保存</el-button>
      </div>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { getCurrentInstance, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {setSetting} from "@/api/index";
import type { FormRules } from "element-plus";
import {handleSubmit} from "./validate";

const props = defineProps<{ res?: string; type?: string }>();

// handleSubmit 通过 vm.$refs 访问表单实例（getCurrentInstance 可能为 null，这里兜底）
const instance = getCurrentInstance();
const proxy = instance?.proxy ?? null;

/** 从后端读回来的原始设置（全部字符串化） */
const result = ref<Record<string, string>>({});
/** 表单字段（设置项是自由 KV，这里把模板里真正用到的字段显式写出） */
type SmsSettingForm = {
  /** el-radio-group 写回 string | number | boolean */
  isTestModel?: string | number | boolean;
  /** 短信平台：ALI / HUAWEI / TENCENT（el-radio-group 写回 string|number|boolean） */
  type?: string | number | boolean;
  /** 阿里云签名 */
  signName?: string;
  loginTemplateCode?: string;
  registerTemplateCode?: string;
  findPasswordTemplateCode?: string;
  walletPasswordTemplateCode?: string;
  payPasswordTemplateCode?: string;
  accessKeyId?: string;
  regionId?: string;
  picLocation?: string;
  accessSecret?: string;
  tencentSecretId?: string;
  tencentSecretKey?: string;
  tencentSdkAppId?: string;
  tencentSignName?: string;
  huaweiAppKey?: string;
  huaweiAppSecret?: string;
  huaweiSender?: string;
  huaweiSignature?: string;
  /** 表单里可能有其它设置项 */
  [key: string]: string | number | boolean | undefined;
};

const ruleValidate = reactive<FormRules>({}); // 验证规则
const formValidate = ref<SmsSettingForm>({ // 表单数据
  isTestModel:1,
  loginTemplateCode:"",
  registerTemplateCode:"",
  findPasswordTemplateCode:"",
  walletPasswordTemplateCode:"",
  payPasswordTemplateCode:"",
  accessKeyId: "",
  regionId: "",
  picLocation: "",
  accessSecret: "",
  tencentSecretId: "",
  tencentSecretKey: "",
  tencentSdkAppId: "",
  tencentSignName: "",
  huaweiAppKey: "",
  huaweiAppSecret: "",
  huaweiSender: "",
  huaweiSignature: "",
});
// 表单实例：原模板 ref="formValidate" 与 data 同名会互相覆盖，改名 formValidateRef
const formValidateRef = ref<{ validate?: () => Promise<boolean> } | null>(null);

// 保存
function submit(name: string) {
  handleSubmit(proxy, name)
    .then(() => {
      setupSetting();
    })
    .catch(() => {});
}
// 保存设置
function setupSetting() {
  const settingType = props.type ?? "";
  setSetting(settingType, formValidate.value).then((res) => {
    if (res.success) {
      ElMessage.success("保存成功!");
    } else {
      ElMessage.error(res?.message || "保存失败");
    }
  });
}
// 实例化数据
function init() {
  const parsed = props.res ? (JSON.parse(props.res) as Record<string, unknown>) : {};
  // 设置项统一转字符串，避免 number/boolean 与输入框不匹配
  const asText: Record<string, string> = {};
  Object.keys(parsed).forEach((key) => {
    asText[key] = parsed[key] === undefined || parsed[key] === null ? "" : String(parsed[key]);
  });
  result.value = asText;
  formValidate.value = { ...asText };
  Object.keys(formValidate.value).forEach((item: string) => {
    ruleValidate[item] = [
      {
        required: true,
        message: "请填写必填项",
        trigger: "blur",
      },
    ];
  });
}

init();
</script>

<style lang="scss" scoped>
@import "./style.scss";

.setting-page {
  padding: 16px 0;
}

.setting-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px 24px 4px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.field-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.field-desc {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
  line-height: 1.4;
}

// 覆盖共享样式里 :deep(.el-input) 的 200px !important，统一输入框宽度
:deep(.el-input) {
  width: 400px !important;
}

.submit-bar {
  text-align: center;
  margin: 24px 0 8px;
}
</style>

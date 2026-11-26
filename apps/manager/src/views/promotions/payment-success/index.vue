<!--
  支付成功页，商品推荐和推广分别配置，复用公共选品、店铺与素材选择器。
  @author Bulbasaur
  @since 2026-11-19
-->
<template>
  <div class="search payment-success-setting" v-loading="loading">
    <el-alert v-if="loadError" title="配置加载失败，请重试" type="error" :closable="false" show-icon>
      <el-button link type="primary" @click="load">重新加载</el-button>
    </el-alert>
    <div v-else class="setting-layout">
      <el-card shadow="never" class="setting-card">
        <el-tabs v-model="tab">
          <el-tab-pane label="商品推荐" name="goods">
            <el-form label-width="120px" :model="form" @submit.prevent>
              <h4>展示设置</h4>
              <el-form-item label="展示推荐商品"><el-switch v-model="form.goodsEnabled" /></el-form-item>
              <el-form-item label="区域标题" required><el-input v-model="form.goodsTitle" maxlength="20" show-word-limit /></el-form-item>
              <el-form-item label="商品来源"><el-radio-group v-model="form.goodsSource"><el-radio value="MANUAL">手动指定</el-radio><el-radio value="AUTO">自动选取</el-radio></el-radio-group></el-form-item>
              <template v-if="form.goodsSource === 'AUTO'">
                <el-form-item label="分类范围"><el-tree-select v-model="form.categoryId" :data="categories" :props="categoryTreeProps" node-key="id" check-strictly clearable filterable placeholder="全部分类" /></el-form-item>
                <el-form-item label="店铺范围"><div class="field-row"><el-button @click="storePicker?.open(selectedStores)">选择店铺</el-button><span v-if="!form.storeIds.length">全部店铺</span><template v-else><span>已选 {{ form.storeIds.length }} 家</span><el-tag v-for="store in selectedStores" :key="store.id" closable @close="removeStore(store.id ?? '')">{{ store.storeName || `店铺 ${store.id}` }}</el-tag><el-button link type="primary" @click="clearStore">清除</el-button></template></div></el-form-item>
                <el-form-item label="排序方式"><el-select v-model="form.goodsSort"><el-option label="销量从高到低" value="SALES" /><el-option label="上新从新到旧" value="NEW" /></el-select></el-form-item>
              </template>
              <el-form-item label="最多展示"><el-select v-model="form.goodsLimit"><el-option v-for="count in [4,6,8,12]" :key="count" :label="`${count}个商品`" :value="count" /></el-select></el-form-item>
              <el-form-item label="排除已购"><el-checkbox v-model="form.excludePurchased">排除本次支付已购买的商品</el-checkbox></el-form-item>
              <template v-if="form.goodsSource === 'MANUAL'">
                <h4>推荐商品</h4>
                <el-form-item label="手动选品"><el-button @click="openGoods">选择商品</el-button><span class="hint inline-hint">已选 {{ selectedGoods.length }} 个SKU，最多50个</span></el-form-item>
                <el-table :data="selectedGoods" border empty-text="请选择推荐商品" max-height="520">
                  <el-table-column label="商品" min-width="220"><template #default="{row}"><div class="goods-cell"><el-image :src="row.thumbnail || row.small" fit="contain"><template #error>暂无图片</template></el-image><span>{{ row.goodsName }}</span></div></template></el-table-column>
                  <el-table-column label="售价" width="100" align="right"><template #default="{row}">{{ money(row.price) }}</template></el-table-column>
                  <el-table-column label="状态" width="100"><template #default="{row}">{{ row.available === false ? '已失效/售罄' : '已选择' }}</template></el-table-column>
                  <el-table-column label="操作" width="155" fixed="right"><template #default="{$index}"><el-button link type="primary" :disabled="$index === 0" @click="move($index,-1)">上移</el-button><el-button link type="primary" :disabled="$index === selectedGoods.length - 1" @click="move($index,1)">下移</el-button><el-button link type="danger" @click="remove($index)">移除</el-button></template></el-table-column>
                </el-table>
              </template>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="推广卡片" name="promotion">
            <el-form label-width="120px" :model="form" @submit.prevent>
              <h4>投放设置</h4>
              <el-form-item label="启用推广"><el-switch v-model="form.promotionEnabled" /></el-form-item>
              <el-form-item label="有效时间" class="activity-time-form-item" :required="Boolean(form.promotionEnabled)">
                <div class="activity-time-field">
                  <el-date-picker v-model="range" type="datetimerange" :disabled-date="disablePastDate" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" />
                </div>
              </el-form-item>
              <h4>内容和跳转</h4>
              <el-form-item label="推广图片" :required="Boolean(form.promotionEnabled)"><div class="image-field"><UploadPicInput v-model="form.image" /><div class="hint">展示在支付成功页结果下方，建议横图约3:1；请在右侧预览确认文字未被裁切。</div></div></el-form-item>
              <el-form-item label="选择目标" :required="Boolean(form.promotionEnabled)"><div class="field-row"><el-button @click="openTarget">选择目标</el-button><span>{{ targetName }}</span></div></el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
        <div class="form-footer"><el-button type="primary" :loading="saving" :disabled="loading || saving" @click="save">保存配置</el-button></div>
      </el-card>
      <el-card shadow="never" class="preview-card">
        <template #header><div class="preview-heading"><span>买家端预览</span><el-input v-if="form.excludePurchased" v-model="simulateMemberId" size="small" clearable placeholder="模拟会员ID（演示排除已购）" style="width:210px" /></div></template>
        <div class="phone-preview">
          <div class="phone-nav">支付结果</div>
          <div class="payment-state"><el-icon color="#21a675" :size="30"><CircleCheckFilled /></el-icon><span>支付成功</span><strong>¥{{ money(previewAmount) }}</strong><small>微信支付</small><div><el-button type="primary">查看订单</el-button><el-button>回到首页</el-button></div></div>
          <div v-if="form.promotionEnabled" class="promotion-preview"><el-image v-if="form.image" :src="form.image" fit="contain" /><div v-else class="image-placeholder">推广图片</div></div>
          <div v-if="form.goodsEnabled" class="recommend-preview"><h4>{{ form.goodsTitle || '为你推荐' }}</h4><el-alert v-if="previewError" title="商品预览加载失败" type="warning" :closable="false" /><el-empty v-else-if="!previewGoods.length" description="暂无有效推荐商品" :image-size="60" /><div v-else class="preview-goods"><div v-for="item in previewGoods.slice(0,form.goodsLimit)" :key="item.id"><el-image :src="item.thumbnail" fit="contain" /><div class="preview-name">{{ item.goodsName }}</div><span class="preview-price">¥{{ money(Number(item.promotionPrice) > 0 ? Math.min(Number(item.price), Number(item.promotionPrice)) : Number(item.price)) }}</span></div></div></div>
        </div>
      </el-card>
    </div>
    <LiliDialog ref="goodsPicker" @selectedGoodsData="confirmGoods" />
    <LiliDialog ref="targetPicker" @selectedLink="confirmTargetLink" />
    <StoreSelector ref="storePicker" :multiple="true" @selected="confirmStore" />
  </div>
</template>
<script setup lang="ts">
import type { CategoryNode } from "@/types/vo/common";
// 2026-11-25(R57)：any 已清零；摘指令后仍有 26 处「动态赋值 vs 声明类型」冲突，见 LINT-DEBT R57
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheckFilled } from '@element-plus/icons-vue';
import { getSetting, setSetting } from '@/api/index';
import { getCategoryTree, getGoodsSkuData } from '@/api/goods';
import { getCouponActivity } from '@/api/promotion';
import { getHomeData } from '@/api/other';
import { seeArticle } from '@/api/pages';
import { otherLinkOptions } from '@/components/lili-dialog/other-link-options';
import { getShopDetailData } from '@/api/shops';
import { getPaymentSuccessGoods, previewPaymentSuccessGoods } from '@/api/payment-success';
import type { TabPaneName } from 'element-plus';
import LiliDialog from '@/components/lili-dialog/index.vue';
import StoreSelector from '@/components/store-selector/index.vue';
import UploadPicInput from '@/components/lili/upload-pic-input.vue';

/** 推荐商品项（选择器 / 预览接口返回） */
type GoodsItem = {
  id?: string | number;
  goodsName?: string;
  thumbnail?: string;
  small?: string;
  price?: number | string;
  /** 促销价（后端预览接口可能返回） */
  promotionPrice?: number | string;
};

/** 店铺项 */
type StoreItem = { id?: string | number; storeName?: string };

/** 分类树节点 */

/** 公共选择器实例 */
type GoodsPickerInstance = { open: (mode: string) => void; goodsData?: GoodsItem[] };
type LinkPickerInstance = { open: (mode: string) => void };
type StorePickerInstance = { open: (selected: StoreItem[]) => void };

/** 付费成功页配置 */
type PaymentSuccessConfig = {
  /** el-switch 写回 string | number | boolean；el-checkbox 是 CheckboxValueType */
  goodsEnabled?: boolean | string | number;
  goodsTitle?: string;
  /** el-radio-group 值域 */
  goodsSource?: string | number | boolean;
  goodsSort?: string | number | boolean;
  goodsLimit?: number;
  excludePurchased?: boolean | string | number;
  categoryId?: string | number;
  storeIds: Array<string | number>;
  skuIds: Array<string | number>;
  promotionEnabled?: boolean | string | number;
  image?: string;
  startTime?: number | null;
  endTime?: number | null;
  targetType?: string | number | boolean;
  targetId?: string | number;
  /** 以下为历史字段，加载时会从表单里 delete 掉 */
  storeId?: string | number;
  clients?: unknown;
  promotionTitle?: string;
  buttonText?: string;
  minimumAmount?: number;
  promotionName?: string;
};

const defaults = () => ({ goodsEnabled:true, goodsTitle:'为你推荐', goodsSource:'AUTO', goodsSort:'NEW', goodsLimit:12, excludePurchased:true, categoryId:'', storeIds:[], skuIds:[], promotionEnabled:false, image:'', startTime:null, endTime:null, targetType:'COUPON_CENTER', targetId:'' });
const form = reactive<PaymentSuccessConfig>(defaults() as PaymentSuccessConfig);
const tab = ref<TabPaneName>('goods'),
  loading = ref(false),
  loadError = ref(false),
  saving = ref(false),
  categories = ref<CategoryNode[]>([]),
  selectedGoods = ref<GoodsItem[]>([]),
  selectedStores = ref<StoreItem[]>([]);
const previewAmount=128;
const goodsPicker = ref<GoodsPickerInstance | null>(null),
  targetPicker = ref<LinkPickerInstance | null>(null),
  storePicker = ref<StorePickerInstance | null>(null),
  /** 已选目标（结构由公共链接选择器决定） */
  targetSelection = ref<Record<string, unknown> | null>(null),
  previewGoods = ref<GoodsItem[]>([]),
  previewError = ref(false);
// 仅在管理端演示&quot;排除已购商品&quot;时使用，不随配置保存
const simulateMemberId=ref('');
const targets=[{value:'COUPON_CENTER',label:'领券中心'},{value:'GOODS',label:'商品详情'},{value:'SPECIAL',label:'移动端专题'},{value:'COUPON_PACKAGE',label:'优惠券礼包'},{value:'SECKILL',label:'秒杀频道'},{value:'PINTUAN',label:'拼团频道'},{value:'CATEGORY',label:'商品分类'},{value:'STORE',label:'店铺'},{value:'ARTICLE',label:'文章'}];
/** el-tree-select 需要 label / children（value 由运行时读取 id），写成变量避开对象字面量的多余属性检查 */
const categoryTreeProps = { label: 'name', value: 'id', children: 'children' };
const channelTypes: Record<string, string> = {
  COUPON_CENTER: 'coupon',
  SECKILL: 'seckill',
  PINTUAN: 'group',
};
const targetName=computed(()=>targetSelection.value?.goodsName || targetSelection.value?.storeName || targetSelection.value?.promotionName || targetSelection.value?.name || targetSelection.value?.title || '尚未选择');
let request = 0, previewRequest = 0, previewTimer: ReturnType<typeof setTimeout> | undefined;
let savedSchedule: {
  startTime: number | null;
  endTime: number | null;
  promotionEnabled: boolean;
} = { startTime: null, endTime: null, promotionEnabled: false };
const range=computed({get:()=>form.startTime && form.endTime ? [beijingTime(form.startTime),beijingTime(form.endTime)] : [],set:(value: string[] | null)=>{const start=value?.[0] ? Date.parse(value[0].replace(' ','T')+'+08:00') : null;const end=value?.[1] ? Date.parse(value[1].replace(' ','T')+'+08:00') : null;if(!scheduleAllowed(start,end)){ElMessage.warning('推广有效时间必须晚于当前时间，请重新选择');return;}form.startTime=start;form.endTime=end;}});

/** 日历禁用北京时间今天之前的日期，同一天的历史时分秒在确认及保存时再次校验。 */
function disablePastDate(date: Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`<beijingTime(Date.now()).slice(0,10);}
/** 新设或调整区间必须在未来；进行中活动可保留原区间编辑，关闭活动可保留历史区间。 */
function scheduleAllowed(start: number | null | undefined, end: number | null | undefined){const now=Date.now();if((start==null || start>now) && (end==null || end>now))return true;return start===savedSchedule.startTime && end===savedSchedule.endTime && (!form.promotionEnabled || (savedSchedule.promotionEnabled && (end ?? 0)>now));}

/** 固定按北京时间回显，避免运营电脑时区改变活动有效区间。 */
function beijingTime(value: number | string){return new Date(Number(value)+8*60*60*1000).toISOString().slice(0,19).replace('T',' ');}

/** 格式化展示金额，未取到价格时保持空值提示。 */
function money(value: unknown){ return value == null || value === '' ? '—' : Number(value).toFixed(2); }
/** 加载配置与已选商品，失败时禁用配置保存，避免空表单覆盖旧数据。 */
async function load(){
  const version=++request;
  loading.value=true;
  loadError.value=false;
  try{
    const [config,goods,tree]=await Promise.all([getSetting('PAYMENT_SUCCESS_SETTING'),getPaymentSuccessGoods(),getCategoryTree()]);
    if(version!==request)return;
    if(!config.success || !goods.success || !tree.success)throw new Error();
    Object.assign(form,defaults(),config.result);
    savedSchedule={
      startTime: form.startTime ?? null,
      endTime: form.endTime ?? null,
      promotionEnabled: Boolean(form.promotionEnabled),
    };
    const rawStoreIds = Array.isArray(config.result?.storeIds)
      ? config.result.storeIds
      : config.result?.storeId
        ? [config.result.storeId]
        : [];
    form.storeIds = [...new Set(rawStoreIds)] as Array<string | number>;
    delete form.storeId;
    delete form.clients;
    delete form.promotionTitle;
    delete form.buttonText;
    delete form.minimumAmount;
    delete form.promotionName;
    selectedGoods.value=goods.result || [];
    categories.value=tree.result || [];
    selectedStores.value=form.storeIds.map((id)=>({id}));
    targetSelection.value=configuredTarget();
    const [stores,target]=await Promise.allSettled([
      Promise.allSettled(form.storeIds.map((id)=>getShopDetailData(id))),
      loadTargetDetail(),
    ]);
    if(version!==request)return;
    if(stores.status==='fulfilled')selectedStores.value=form.storeIds.map((id, index)=>{const store=stores.value[index];const detail = store.status === 'fulfilled'
        ? (store.value as unknown as { success?: boolean; result?: { storeName?: string; store?: { storeName?: string } } })
        : undefined;
      return {
        id,
        storeName: detail?.success ? detail.result?.storeName || detail.result?.store?.storeName || '' : '',
      };
    });
    if(target.status==='fulfilled' && target.value)targetSelection.value={...targetSelection.value,...target.value};
    await refreshPreview();
  }catch{
    if(version===request)loadError.value=true;
  }finally{
    if(version===request)loading.value=false;
  }
}
/** 打开公共多选组件，复制已选对象，取消时不改变当前表单。 */
function openGoods(){
  const picker = goodsPicker.value;
  if (!picker) return;
  picker.open('goods');
  picker.goodsData = selectedGoods.value.map((item) => ({ ...item, small: item.thumbnail || item.small }));
}
/** 保留已有排序后追加新选择，避免跨页确认打乱运营顺序。 */
function confirmGoods(items: GoodsItem[]){ if(items.length>50){ElMessage.warning('最多选择50个SKU');return;} const ids=new Set(items.map((item)=>item.id)); const old=selectedGoods.value.filter((item)=>ids.has(item.id)); const oldIds=new Set(old.map((item)=>item.id)); selectedGoods.value=[...old,...items.filter((item)=>!oldIds.has(item.id)).map((item)=>({...item,thumbnail:item.thumbnail || item.small}))]; syncIds(); }
/** 同步手动选品ID，后端按该顺序生效。 */
function syncIds(){
  form.skuIds = selectedGoods.value
    .map((item) => item.id)
    .filter((id): id is string | number => id !== undefined);
}
/** 按相邻位置调整推荐顺序。 */
function move(index: number,offset: number){const next=index+offset;if(next<0 || next>=selectedGoods.value.length)return; [selectedGoods.value[index],selectedGoods.value[next]]=[selectedGoods.value[next],selectedGoods.value[index]]; syncIds();}
/** 移除指定位置的推荐商品。 */
function remove(index: number){selectedGoods.value.splice(index,1);syncIds();}
/** 确认公共店铺选择器的多选结果，取消选择器不改动已确认的店铺范围。 */
function confirmStore(stores: StoreItem[]){if(stores.length>50){ElMessage.warning('最多选择50家店铺');return;}selectedStores.value=stores.map((store)=>({...store}));form.storeIds=stores.map((store)=>store.id).filter((id): id is string | number => id !== undefined);}
/** 移除单个已选店铺，移除最后一家后恢复全部店铺范围。 */
function removeStore(id: string | number){confirmStore(selectedStores.value.filter((store)=>store.id!==id));}
/** 清除店铺范围。 */
function clearStore(){selectedStores.value=[];form.storeIds=[];}
/** 将已保存目标转换为公共选择器数据；失效目标仍保留ID供运营识别和替换。 */
function configuredTarget(){if(form.targetType==='OTHER'){const entry=otherLinkOptions.find((item)=>item.___type===form.targetId);return {___type:'other',originalType:form.targetId,title:entry?.title || `未知入口（${form.targetId}）`};}const title=targets.find((item)=>item.value===form.targetType)?.label || '未知目标';const channelKey = String(form.targetType ?? '');
  if(channelTypes[channelKey])return {___type:'other',originalType:channelTypes[channelKey],title};const type={GOODS:'goods',SPECIAL:'special',COUPON_PACKAGE:'couponPackage',CATEGORY:'category',STORE:'shops',ARTICLE:'pages'}[String(form.targetType ?? '')];return type && form.targetId ? {id:form.targetId,___type:type,title:`${title}（${form.targetId}）`} : null;}
/** 从已加载的公共分类树查找名称，不另建分类选择或查询逻辑。 */
function findCategory(nodes: CategoryNode[], id: string | number): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findCategory(node.children ?? [], id);
    if (child) return child;
  }
  return null;
}
/** 回读目标名称，查询失败时保留配置ID，不清空原目标。 */
async function loadTargetDetail(){
  if(!form.targetId)return null;
  let res:
    | { success?: boolean; result?: Record<string, unknown> | { storeName?: string; store?: { storeName?: string } } }
    | null
    | undefined;if(form.targetType==='GOODS'){res=await getGoodsSkuData({pageNumber:1,pageSize:1,id:form.targetId});return res.success ? (((res.result as { records?: GoodsItem[] } | undefined)?.records)?.find((item)=>item.id===form.targetId) ?? null) : null;}if(form.targetType==='CATEGORY')return findCategory(categories.value,form.targetId);if(form.targetType==='STORE'){
      res = (await getShopDetailData(form.targetId)) as unknown as {
        success?: boolean;
        result?: { storeName?: string; store?: { storeName?: string } };
      };
      return res?.success
        ? {
            name:
              (res.result as { storeName?: string; store?: { storeName?: string } } | undefined)
                ?.storeName ||
              (res.result as { store?: { storeName?: string } } | undefined)?.store?.storeName,
          }
        : null;
    }if(form.targetType==='ARTICLE')res=await seeArticle(form.targetId);if(form.targetType==='SPECIAL')res=await getHomeData(form.targetId);if(form.targetType==='COUPON_PACKAGE')res=await getCouponActivity(form.targetId);return res?.success ? res.result : null;}
/** 按楼层装修相同的调用方式打开公共链接选择器，取消时不修改表单。 */
function openTarget(){targetPicker.value?.open('link');}
/** 直接接收装修公共选择结果，固定入口以公共代码保存，具体内容以关联ID保存。 */
function confirmTargetLink(item: { ___type?: string; originalType?: string; id?: string | number } & Record<string, unknown>){
  const typeMap: Record<string, string> = { goods: 'GOODS', category: 'CATEGORY', shops: 'STORE', pages: 'ARTICLE', special: 'SPECIAL' };
  const type = item?.___type ? typeMap[item.___type] : undefined;
  if(item?.___type==='other' && otherLinkOptions.some((entry)=>entry.___type===item.originalType)){form.targetType='OTHER';form.targetId=item.originalType;}else if(type && item.id){form.targetType=type;form.targetId=item.id;}else{ElMessage.warning('请选择有效的推广目标');return;}targetSelection.value={...item};}
/** 从服务器获取当前表单的真实选品预览；不写系统设置。 */
async function refreshPreview(){const version=++previewRequest;previewError.value=false;try{const res=await previewPaymentSuccessGoods({...form,promotionEnabled:false}, simulateMemberId.value.trim() || undefined);if(version!==previewRequest)return;if(!res.success)throw new Error();previewGoods.value=res.result || [];}catch{if(version===previewRequest){previewGoods.value=[];previewError.value=true;}}}
/** 校验前端必填并保存，最终金额、状态和目标校验由后端统一执行。 */
async function save(){if(!String(form.goodsTitle ?? '').trim()){ElMessage.warning('请填写推荐区域标题');tab.value='goods';return;}if(form.goodsEnabled && form.goodsSource==='MANUAL' && !form.skuIds.length){ElMessage.warning('请选择推荐商品');return;}if(form.promotionEnabled && (!form.image || !form.startTime || !form.endTime)){ElMessage.warning('请完善推广图片和时间');tab.value='promotion';return;}if(!scheduleAllowed(form.startTime,form.endTime)){ElMessage.warning('推广有效时间必须晚于当前时间，请重新选择');tab.value='promotion';return;}if(form.startTime && form.endTime && form.endTime<=form.startTime){ElMessage.warning('推广结束时间必须晚于开始时间');tab.value='promotion';return;}saving.value=true;try{const res=await setSetting('PAYMENT_SUCCESS_SETTING',{...form});if(res.success){ElMessage.success('保存成功');await load();}}finally{saving.value=false;}}
watch(()=>[form.goodsEnabled,form.goodsSource,form.goodsSort,form.goodsLimit,form.excludePurchased,simulateMemberId.value,form.categoryId,[...form.storeIds],[...form.skuIds]],()=>{if(loading.value)return;clearTimeout(previewTimer);previewTimer=setTimeout(refreshPreview,350);},{deep:true});
onMounted(load);
onBeforeUnmount(()=>{request++;previewRequest++;clearTimeout(previewTimer);});
</script>
<style scoped lang="scss">
/* 左右卡片等高并独立滚动，预览标题保持可见。 */
.setting-card,.preview-card{height:calc(100vh - 146px);height:calc(100dvh - 146px);box-sizing:border-box;display:flex;flex-direction:column}
.preview-card{position:sticky;top:0}
.preview-card :deep(.el-card__header){flex-shrink:0}
.setting-card :deep(.el-card__body),.preview-card :deep(.el-card__body){flex:1;min-height:0;overflow-y:auto;overscroll-behavior-y:contain}
@media(max-width:1250px){.setting-card{height:auto}.preview-card{position:static}}
.activity-time-field{width:380px;max-width:100%}
.activity-time-form-item :deep(.el-date-editor){width:380px !important;max-width:100%;box-sizing:border-box;flex-grow:0}
.activity-time-field .hint{margin:6px 0 0}
.setting-layout{display:grid;grid-template-columns:minmax(0,1fr) 370px;gap:20px;align-items:start}.setting-card,.preview-card{min-width:0}.el-form h4{margin:18px 0 24px;font-size:15px}.el-form :deep(.el-input),.el-form :deep(.el-select),.el-form :deep(.el-input-number),.el-form :deep(.el-tree-select){width:260px}.el-form :deep(.el-date-editor){max-width:100%;width:380px}.hint{font-size:12px;color:#909399;line-height:1.7;margin:10px 0}.inline-hint{margin-left:12px}.field-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.image-field{width:100%;max-width:530px}.goods-cell{display:flex;gap:10px;align-items:center}.goods-cell .el-image{width:44px;height:44px;flex-shrink:0}.form-footer{margin-top:24px;padding-top:20px;border-top:1px solid #ebeef5;padding-left:120px}.preview-heading{display:flex;align-items:center;justify-content:space-between}.phone-preview{background:#f7f8fa;border:1px solid #ebeef5;border-radius:16px;padding:16px}.phone-nav{text-align:center;font-weight:500;padding:4px 0 18px;border-bottom:1px solid #ebeef5}.payment-state{display:flex;align-items:center;flex-direction:column;gap:12px;padding:24px 0;color:#21a675}.payment-state strong{color:#303133;font-size:26px}.payment-state small{color:#909399}.payment-state>div{display:flex;margin-top:6px}.promotion-preview{padding:16px 0;border-block:1px solid #ebeef5}.promotion-preview>.el-image{display:block;width:100%}.image-placeholder{height:95px;display:grid;place-items:center;background:#e9edf3;color:#909399}.recommend-preview h4{text-align:center;margin:24px 0 18px}.preview-goods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.preview-goods>div{min-width:0}.preview-goods .el-image{width:100%;height:125px;background:#fff;border-radius:8px}.preview-name{font-size:12px;line-height:1.6;min-height:38px;margin-top:5px;overflow-wrap:anywhere}.preview-price{color:var(--el-color-primary);font-size:14px}@media(max-width:1250px){.setting-layout{grid-template-columns:minmax(0,1fr)}.preview-card{width:370px;max-width:100%}}@media(max-width:650px){.el-form :deep(.el-input),.el-form :deep(.el-select),.el-form :deep(.el-input-number),.el-form :deep(.el-tree-select){width:100%}.form-footer{padding-left:0}}
</style>

/**
 * 支付成功页路由回归，确保上下文正确编码且推广仅能进入商城内部白名单页面。
 * @author Bulbasaur
 * @since 2026-11-19
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { paymentSuccessUrl, paymentPromotionUrl, paymentReturnUrl, navigatePaymentPromotion } from '../utils/payment-success.js';
import { resolveDecorateLink, navigateDecorateLink } from '../utils/decorate-link.js';

const url=paymentSuccessUrl({sn:'SN&injected=1',orderType:'ORDER',paymentMethod:'WECHAT',orderPromotionType:'PINTUAN'});
assert.ok(url.includes('sn=SN%26injected%3D1'));
assert.ok(url.includes('orderType=ORDER'));
assert.ok(!url.includes('payPrice'));
assert.equal(paymentPromotionUrl({targetType:'EXTERNAL',targetId:'https://example.com'}),'');
assert.equal(paymentPromotionUrl({targetType:'GOODS',targetId:'one'}),'');
assert.equal(paymentPromotionUrl({targetType:'COUPON_CENTER'}),'/pages/cart/coupon/couponCenter');
assert.equal(paymentPromotionUrl({targetType:'GOODS',targetId:'sku',goodsId:'goods'}),'/pages/product/goods?id=sku&goodsId=goods');
assert.equal(paymentPromotionUrl({targetType:'SPECIAL',targetId:'a&b'}),'/pages/tabbar/special/special?id=a%26b');
assert.equal(paymentPromotionUrl({targetType:'COUPON_PACKAGE',targetId:'pack'}),'/pages/promotion/coupon-pack?id=pack');
assert.equal(paymentPromotionUrl({targetType:'SECKILL'}),'/pages/promotion/seckill');
assert.equal(paymentPromotionUrl({targetType:'PINTUAN'}),'/pages/promotion/joinGroup');
assert.equal(paymentPromotionUrl(null),'');
assert.equal(paymentReturnUrl('https://shop.example/pages/cart/payment/payOrder?order_sn=1','https://shop.example','/pages/cart/payment/success?sn=1'),'https://shop.example/pages/cart/payment/success?sn=1');
assert.equal(paymentReturnUrl('https://shop.example/#/pages/cart/payment/payOrder?order_sn=1','https://shop.example','/pages/cart/payment/success?sn=1'),'https://shop.example/#/pages/cart/payment/success?sn=1');
assert.equal(paymentPromotionUrl({targetType:'CATEGORY',targetId:'a&b'}),'/pages/navigation/search/searchPage?category=a%26b');
assert.equal(paymentPromotionUrl({targetType:'STORE',targetId:'store'}),'/pages/product/shopPage?id=store');
assert.equal(paymentPromotionUrl({targetType:'ARTICLE',targetId:'article',targetName:'须知 & 优惠'}),'/pages/passport/article?id=article&title='+encodeURIComponent('须知 & 优惠'));
assert.equal(resolveDecorateLink({___type:'pages',id:'article',___path:'https://evil.example',title:'标题'}).url,'/pages/passport/article?id=article&title='+encodeURIComponent('标题'));

const expectedOther = {
  home:'/pages/tabbar/home/index',cart:'/pages/tabbar/cart/cartList',order:'/pages/order/myOrder?status=0',user:'/pages/tabbar/user/my',
  userInfo:'/pages/mine/set/personMsg',afterSale:'/pages/order/myOrder?status=5',myCoupons:'/pages/cart/coupon/myCoupon',collection:'/pages/mine/myCollect',
  msg:'/pages/mine/msgTips/main',merchantEntry:'/pages/passport/entry/seller/index',coupon:'/pages/cart/coupon/couponCenter',
  seckill:'/pages/promotion/seckill',group:'/pages/promotion/joinGroup',sign:'/pages/mine/signIn',live:'/pages/promotion/lives',kanjia:'/pages/promotion/bargain/list',point:'/pages/promotion/point/pointList',
};
// 按pages.json的root/path顺序检查所有目标均指向已注册页面，避免只验证拼接字符串。
const registered=new Set();let root='';
for(const match of readFileSync(new URL('../pages.json',import.meta.url),'utf8').matchAll(/"(root|path)"\s*:\s*"([^"]+)"/g)){
  if(match[1]==='root')root=match[2];else registered.add((root ? root+'/' : '')+match[2]);
}
for(const [code,path] of Object.entries(expectedOther)){
  assert.equal(paymentPromotionUrl({targetType:'OTHER',targetId:code}),path,code);
  assert.ok(registered.has(path.split('?')[0].slice(1)),`Unregistered target: ${path}`);
}
for(const type of ['CATEGORY','STORE','ARTICLE'])assert.equal(paymentPromotionUrl({targetType:type}),'');
for(const code of ['unknown','__proto__','constructor','https://evil.example'])assert.equal(paymentPromotionUrl({targetType:'OTHER',targetId:code}),'');
assert.equal(resolveDecorateLink({___type:'other',originalType:'link',url:'https://evil.example'}),null);

const actions=[];
globalThis.uni={navigateTo:args=>actions.push(['navigateTo',args.url]),switchTab:args=>actions.push(['switchTab',args.url]),showToast:args=>actions.push(['toast',args.title])};
for(const code of ['home','cart','user']){
  assert.equal(navigatePaymentPromotion({targetType:'OTHER',targetId:code}),true);
  assert.deepEqual(actions.pop(),['switchTab',expectedOther[code]]);
}
assert.equal(navigatePaymentPromotion({targetType:'OTHER',targetId:'afterSale'}),true);
assert.deepEqual(actions.pop(),['navigateTo',expectedOther.afterSale]);
assert.equal(navigatePaymentPromotion({targetType:'EXTERNAL',targetId:'https://evil.example'}),false);
assert.equal(actions.length,0);

// 执行楼层原调用入口，确认公共内部导航、旧营销链接及自定义链接行为仍可用。
let floorSource=readFileSync(new URL('../pages/tabbar/home/template/tpl.js',import.meta.url),'utf8').split('import config from')[0]
  .replace(/^import .*\r?\n/,'').replace('export function modelNavigateTo','function modelNavigateTo');
const platform=[true];floorSource=floorSource.split('\n').filter(line=>{const match=line.match(/\/\/\s*#(ifdef|ifndef)\s+([\w-]+)/);if(match){platform.push(platform.at(-1)&&(match[1]==='ifdef'?match[2]==='H5':match[2]!=='H5'));return false;}if(/\/\/\s*#endif/.test(line)){platform.pop();return false;}return platform.at(-1);}).join('\n');
const fakeWindow={location:{href:''}};
const modelNavigateTo=vm.runInNewContext(floorSource+'\nmodelNavigateTo',{navigateDecorateLink,uni:globalThis.uni,window:fakeWindow});
modelNavigateTo({url:{___type:'special',pageType:'special',id:'special-1'}});
assert.deepEqual(actions.splice(0),[['navigateTo','/pages/tabbar/special/special?id=special-1']]);
modelNavigateTo({url:{___type:'marketing',___promotion:'FULL_GIFT',skuId:'sku',goodsId:'goods'}});
assert.deepEqual(actions.splice(0),[['navigateTo','/pages/product/goods?id=sku&goodsId=goods']]);
modelNavigateTo({url:{___type:'other',title:'店铺列表'}});
assert.deepEqual(actions.splice(0),[['navigateTo','/pages/product/shopList']]);
modelNavigateTo({url:{___type:'other',originalType:'link',title:'自定义链接',url:'https://example.com'}});
assert.equal(fakeWindow.location.href,'https://example.com');
delete globalThis.uni;
console.log('PASS payment contexts, all decoration targets, registered pages, TabBar switching, invalid targets and shared floor navigation');

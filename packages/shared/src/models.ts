/**
 * 后端实体对应的 TS 模型（自动生成，来源 backend/framework 的 Java 实体类）。
 *
 * 说明：
 * - 所有字段均为可选：后端使用 MyBatis-Plus 动态 SQL，字段可能不出现在结果里；
 * - 枚举、关联对象、泛型容器统一退化为 any，避免与后端枚举演进强耦合；
 * - 需要更精确的字段时，在调用处收窄（如 `res.result as GoodsDetail`）。
 */

/** mybatis/BaseEntity */
export interface BaseEntity {
  id?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  deleteFlag?: boolean;
}

/** mybatis/BaseIdEntity */
export interface BaseIdEntity {
  id?: string;
}

/** modules/promotion/entity/dos/BasePromotions */
export interface BasePromotions extends BaseEntity {
  storeName?: string;
  storeId?: string;
  promotionName?: string;
  startTime?: string;
  endTime?: string;
  scopeId?: string;
}

/** modules/goods/entity/dos/Goods */
export interface Goods extends BaseEntity {
  goodsName?: string;
  spuSn?: string;
  price?: number;
  brandId?: string;
  categoryPath?: string;
  goodsUnit?: string;
  sellingPoint?: string;
  marketEnable?: string;
  intro?: string;
  buyCount?: number;
  quantity?: number;
  grade?: number;
  thumbnail?: string;
  small?: string;
  original?: string;
  storeCategoryPath?: string;
  commentNum?: number;
  storeId?: string;
  storeName?: string;
  templateId?: string;
  authFlag?: string;
  authMessage?: string;
  underMessage?: string;
  scheduledUpperTime?: string;
  scheduledUpperReason?: string;
  scheduledDownTime?: string;
  scheduledDownReason?: string;
  selfOperated?: boolean;
  mobileIntro?: string;
  goodsVideo?: string;
  recommend?: boolean;
  salesModel?: string;
  goodsType?: string;
  params?: string;
}

/** modules/goods/entity/dos/GoodsSku */
export interface GoodsSku extends BaseEntity {
  goodsId?: string;
  specs?: string;
  simpleSpecs?: string;
  freightTemplateId?: string;
  promotionFlag?: boolean;
  promotionPrice?: number;
  goodsName?: string;
  sn?: string;
  brandId?: string;
  categoryPath?: string;
  goodsUnit?: string;
  sellingPoint?: string;
  weight?: number;
  marketEnable?: string;
  intro?: string;
  price?: number;
  cost?: number;
  viewCount?: number;
  buyCount?: number;
  virtualSales?: number;
  quantity?: number;
  grade?: number;
  thumbnail?: string;
  big?: string;
  small?: string;
  original?: string;
  storeCategoryPath?: string;
  commentNum?: number;
  storeId?: string;
  storeName?: string;
  templateId?: string;
  authFlag?: string;
  authMessage?: string;
  underMessage?: string;
  selfOperated?: boolean;
  mobileIntro?: string;
  goodsVideo?: string;
  recommend?: boolean;
  salesModel?: string;
  goodsType?: string;
  alertQuantity?: number;
}

/** modules/member/entity/dos/Member */
export interface Member extends BaseEntity {
  username?: string;
  password?: string;
  nickName?: string;
  sex?: number;
  birthday?: string;
  regionId?: string;
  region?: string;
  mobile?: string;
  point?: number;
  totalPoint?: number;
  face?: string;
  disabled?: boolean;
  haveStore?: boolean;
  storeId?: string;
  clientEnum?: string;
  lastLoginDate?: string;
  gradeId?: string;
  experience?: number;
}

/** modules/store/entity/dos/Store */
export interface Store extends BaseEntity {
  memberId?: string;
  memberName?: string;
  storeName?: string;
  storeEndTime?: string;
  storeDisable?: string;
  selfOperated?: boolean;
  storeLogo?: string;
  storeCenter?: string;
  storeDesc?: string;
  storeAddressPath?: string;
  storeAddressIdPath?: string;
  storeAddressDetail?: string;
  descriptionScore?: number;
  serviceScore?: number;
  deliveryScore?: number;
  goodsNum?: number;
  collectionNum?: number;
  yzfSign?: string;
  yzfMpSign?: string;
  merchantEuid?: string;
  pageShow?: boolean;
  selfPickFlag?: boolean;
}

/** modules/promotion/entity/dos/Coupon */
export interface Coupon extends BasePromotions {
  couponName?: string;
  couponType?: string;
  price?: number;
  couponDiscount?: number;
  getType?: string;
  storeCommission?: number;
  description?: string;
  publishNum?: number;
  couponLimitNum?: number;
  usedNum?: number;
  receivedNum?: number;
  consumeThreshold?: number;
  rangeDayType?: string;
  effectiveDays?: number;
}

/** modules/live/entity/dos/LiveRoom */
export interface LiveRoom extends BaseEntity {
  title?: string;
  description?: string;
  coverImg?: string;
  displayMode?: string;
  viewerCount?: number;
  liveIntroduce?: string;
  pushStreamServer?: string;
  pushStreamCode?: string;
  pullStreamUrl?: string;
  startTime?: string;
  endTime?: string;
  imGroupId?: string;
  storeId?: string;
  storeName?: string;
  authFlag?: boolean;
  liveStatus?: string;
  sn?: string;
}

/** modules/order/order/entity/dos/Order */
export interface Order extends BaseEntity {
  sn?: string;
  tradeSn?: string;
  storeId?: string;
  storeName?: string;
  memberId?: string;
  memberName?: string;
  orderStatus?: string;
  payStatus?: string;
  deliverStatus?: string;
  receivableNo?: string;
  paymentMethod?: string;
  deductionMethod?: string;
  paymentTime?: string;
  consigneeName?: string;
  consigneeMobile?: string;
  deliveryMethod?: string;
  consigneeAddressPath?: string;
  consigneeAddressIdPath?: string;
  consigneeDetail?: string;
  flowPrice?: number;
  goodsPrice?: number;
  freightPrice?: number;
  discountPrice?: number;
  updatePrice?: number;
  logisticsNo?: string;
  logisticsCode?: string;
  logisticsName?: string;
  weight?: number;
  goodsNum?: number;
  remark?: string;
  sellerRemark?: string;
  cancelReason?: string;
  completeTime?: string;
  logisticsTime?: string;
  payOrderNo?: string;
  clientType?: string;
  needReceipt?: boolean;
  promotionId?: string;
  orderType?: string;
  orderPromotionType?: string;
  priceDetail?: string;
  canReturn?: boolean;
  verificationCode?: string;
  distributionId?: string;
  useStoreMemberCouponIds?: string;
  usePlatformMemberCouponId?: string;
  qrCode?: string;
  storeAddressPath?: string;
  storeAddressMobile?: string;
  storeAddressCenter?: string;
  liveRoomId?: string;
}

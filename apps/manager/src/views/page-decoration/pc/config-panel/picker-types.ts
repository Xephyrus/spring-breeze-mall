/**
 * PC 装修器里「全局选择器」的回调签名。
 *
 * 这些选择器由 page-decoration/pc/index.vue 通过 provide 注入，
 * 面板只消费回调，所以把回调契约写在这里，避免各处 `inject<any>`。
 */

/** 素材库选图：回调直接给图片地址 */
export type OpenImagePicker = (callback: (url: string) => void) => void;

/** 链接选择：回调给地址、标题，raw 是原始节点（分类/商品等） */
export type OpenLinkPicker = (
  callback: (picked: { url?: string; title?: string; raw?: Record<string, unknown> }) => void
) => void;

/**
 * 商品选择：回调给选中的商品数组。
 *
 * 各面板对商品字段的用法不同（id / skuId / goodsName / thumbnail …），
 * 这里只约定「一定的字段集合」，具体形状由各面板自己的 FloorGoods / ChannelGoods 定义。
 */
export type PickedGoods = Record<string, unknown>;

/**
 * 打开商品选择器。
 *
 * 第二个参数 initialSelected 用来「带着已选商品打开」（编辑楼层时回显），
 * 由 pc/index.vue 的 openGoodsPicker 写进选择器的 goodsData。
 */
export type OpenGoodsPicker = (
  callback: (goods: PickedGoods[]) => void,
  initialSelected?: PickedGoods[]
) => void;

/** 视频选择：回调直接给视频地址 */
export type OpenVideoPicker = (callback: (url: string) => void) => void;

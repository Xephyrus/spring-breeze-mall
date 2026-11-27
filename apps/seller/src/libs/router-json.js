/**
 * 商家端左侧菜单栏静态数据
 */

export const result = [{
    name: "lili",
    level: 0,
    type: -1,
    title: "商品",
    path: "",
    component: "",
    children: [{
      name: "goods-list",
      level: 1,
      type: 0,
      title: "商品管理",
      path: "",
      component: "main",
      children: [{
          name: "goods-operation",
          level: 2,
          type: 0,
          title: "商品发布",
          path: "goods-operation",
          component: "goods-operation",
          children: null,
        },
        {
          name: "goods",
          level: 2,
          type: 0,
          title: "商品列表",
          path: "goods",
          component: "goods/goods-seller/goods",
          children: null,
        },
        {
          path: "template-goods",
          props: {
            type: "TEMPLATE"
          },
          level: 2,
          type: 0,
          title: "商品模版",
          component: "goods/goods-seller/draftGoods",
          name: "template-goods",
          children: null,
        },
        {
          name: "category",
          level: 2,
          type: 0,
          title: "店铺分类",
          path: "category",
          component: "goods/goods-manage/category",
          children: null,
        }
      ]
    }]
  },
  {
    name: "order",
    level: 0,
    type: -1,
    title: "订单",
    path: "",
    component: "",
    description: "",
    children: [{
        name: "order",
        level: 1,
        type: 0,
        title: "订单管理",
        path: "/order",
        component: "main",
        children: [{
            name: "order-list",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "商品订单",
            path: "order-list",
            component: "order/order/orderList",
            children: null,
          },
          {
            name: "virtualOrderList",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "虚拟订单",
            path: "virtualOrderList",
            component: "order/order/virtualOrderList",
            children: null
          },
          {
            name: "order-verification",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "订单核销",
            path: "order-verification",
            component: "order/order/orderVerification",
            children: null
          }
        ]
      },
      {
        name: "member-comment",
        level: 1,
        type: 0,
        title: "评价管理",
        path: "/order",
        component: "main",
        children: [{
          name: "member-comment",
          level: 2,
          type: 0,
          title: "评价管理",
          path: "member-comment",
          component: "member/memberComment",
          children: null,
        }]
      },
      {
        name: "order",
        level: 1,
        type: 0,
        title: "售后管理",
        path: "/order",
        component: "main",
        children: [{
            name: "return-goods-order",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "退货管理",
            path: "return-goods-order",
            component: "order/after-order/returnGoodsOrder",
            children: null
          },
          {
            name: "return-money-order",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "退款管理",
            path: "return-money-order",
            component: "order/after-order/returnMoneyOrder",
            children: null
          },
          {
            name: "order-complaint",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "投诉管理",
            path: "order-complaint",
            component: "order/after-order/orderComplaint",
            children: null
          }
        ]
      }
    ]
  },
  {
    name: "bill",
    level: 0,
    type: -1,
    title: "财务",
    path: "",
    component: "",
    children: [{
        name: "bill",
        level: 1,
        type: 0,
        title: "财务管理",
        path: "/bill",
        component: "main",
        children: [{
            name: "accountStatementBill",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "财务对账",
            path: "accountStatementBill",
            component: "shop/bill/accountStatementBill",
            children: null
          },
          {
            name: "store-bill",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "店铺结算",
            path: "store-bill",
            component: "shop/bill/storeBill",
            children: null
          }
        ]
      },
      {
        name: "receiptManager",
        level: 1,
        type: 0,
        title: "发票管理",
        path: "/bill",
        component: "main",
        children: [{
          name: "receipt",
          level: 2,
          type: 0,
          title: "发票管理",
          path: "receipt",
          component: "order/receipt-manager/receipt",
          children: null
        }]
      }
    ]
  },
  {
    name: "promotion",
    level: 0,
    type: -1,
    title: "营销",
    path: "",
    component: "",
    children: [{
        name: "promotion",
        level: 1,
        type: 0,
        title: "平台活动",
        path: "/promotion",
        component: "main",
        children: [{
            name: "pintuan",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "拼团活动",
            path: "pintuan",
            component: "promotion/pintuan/pintuan",
            children: null
          },
          {
            name: "seckill",
            level: 2,
            type: 0,
            keepAlive: true,
            title: "秒杀活动",
            path: "seckill",
            component: "promotion/seckill/seckill",
            children: null
          }
        ]
      },
      {
        name: "lives",
        level: 1,
        type: 0,
        title: "直播活动",
        path: "/promotion",
        component: "main",
        children: [{
            name: "live",
            level: 2,
            type: 0,
            title: "直播管理",
            path: "live",
            component: "promotion/live/live",
            children: null
          },
          {
            name: "live-goods",
            level: 2,
            type: 0,
            title: "直播商品",
            path: "live-goods",
            component: "promotion/live/liveGoods",
            children: null
          }
        ]
      },
      {
        name: "storePromotion",
        level: 1,
        type: 0,
        title: "商家活动",
        path: "/storePromotion",
        component: "main",
        children: [{
            name: "full-cut",
            level: 2,
            type: 0,
            title: "满额活动",
            path: "full-discount",
            component: "promotion/full-discount/full-discount",
            children: null
          },
          {
            name: "coupon",
            level: 2,
            type: 0,
            title: "优惠券",
            path: "coupon",
            component: "promotion/coupon/coupon",
            children: null
          },
        ]
      },
      {
        name: "distribution",
        level: 1,
        type: 0,
        title: "分销管理",
        path: "/distribution",
        component: "main",
        children: [{
            name: "distribution-goods",
            level: 2,
            type: 0,
            title: "分销商品",
            path: "distribution-goods",
            component: "distribution/distributionGoods",
            children: null
          },
          {
            name: "distribution-order",
            level: 2,
            type: 0,
            title: "分销订单",
            path: "distribution-order",
            component: "distribution/distributionOrder",
            children: null
          }
        ]
      }
    ]
  },
  {
    name: "statistics",
    level: 0,
    type: -1,
    title: "统计",
    path: "",
    component: "",
    children: [{
      name: "statistics",
      level: 1,
      type: 0,
      title: "统计管理",
      path: "/statistics",
      component: "main",
      children: [{
          name: "goods-statistics",
          level: 2,
          type: 0,
          title: "商品统计",
          path: "goods-statistics",
          component: "statistics/goods",
          children: null
        },
        {
          name: "order-statistics",
          level: 2,
          type: 0,
          title: "订单统计",
          path: "order-statistics",
          component: "statistics/order",
          children: null
        },
        {
          name: "traffic-statistics",
          level: 2,
          type: 0,
          title: "流量统计",
          path: "traffic-statistics",
          component: "statistics/traffic",
          children: null
        },
        {
          name: "data-report",
          level: 2,
          type: 0,
          title: "数据报表",
          path: "data-report",
          component: "statistics/data-report",
          children: null
        },
      ]
    }]
  },
  {
    name: "settings",
    level: 0,
    type: -1,
    title: "设置",
    path: "",
    component: "",
    description: "",
    children: [{
        name: "user-manage",
        level: 1,
        type: 0,
        title: "页面设置",
        path: "user-manage",
        component: "sys/user-manage/userManage",
        children: []
      },
      {
        name: "clerk",
        level: 1,
        type: 0,
        title: "店员设置",
        path: "",
        component: "main",
        children: [
          {
            name: "clerkManage",
            level: 2,
            type: 0,
            title: "店员管理",
            path: "clerkManage",
            component: "shop/system/clerk/clerkManage",
            children: null
          },{
            name: "store-department-manage",
            level: 2,
            type: 0,
            title: "部门管理",
            path: "store-department-manage",
            component: "shop/system/department/storeDepartmentManage",
            children: null
          },
          {
            name: "storeRole",
            level: 2,
            type: 0,
            title: "角色权限",
            path: "storeRole",
            component: "shop/system/role/storeRoleManage",
            children: null
          }
        ]
      },
      {
        name: "ship",
        level: 1,
        type: 0,
        title: "配送设置",
        path: "",
        component: "main",
        children: [{
            name: "ship-template",
            level: 2,
            type: 0,
            title: "配送模板",
            path: "ship-template",
            component: "shop/ship/shipTemplate",
            children: null
          },
          {
            name: "logistics",
            level: 2,
            type: 0,
            title: "物流公司",
            path: "logistics",
            component: "shop/ship/logistics",
            children: null
          }
        ]
      },

      {
        name: "shop",
        level: 1,
        type: 0,
        title: "店铺管理",
        path: "/shop",
        component: "main",
        description: "",
        children: [
         {
            name: "shop-setting",
            level: 2,
            type: 0,
            title: "店铺设置",
            path: "shop-setting",
            component: "shop/shopSetting",
            children: null,
          },
          {
            name: "shop-info",
            level: 2,
            type: 0,
            title: "店铺信息",
            path: "shop-info",
            component: "shop/shopInfo",
            children: null,
          },
          {
            name: "address-manage",
            level: 2,
            type: 0,
            title: "地址管理",
            path: "address-manage",
            component: "shop/addressManage",
            children: null,
          },
          {
            name: "wap-list",
            level: 2,
            type: 0,
            title: "移动楼层",
            path: "wap-list",
            component: "shop/wap/wapList",
            children: null

          },
          {
            name: "pcList",
            level: 2,
            type: 0,
            title: "PC楼层",
            path: "pcList",
            component: "shop/floorList",
            children: null

          },
          {
            name: "oss-manage",
            level: 2,
            type: 0,
            title: "素材管理",
            path: "oss-manage",
            component: "sys/oss-manage/ossManage",
            /**
             * 运行时菜单来自 li_store_menu，此处仅为静态参考。
             * 平台后台「店铺菜单」配置：
             *   frontRoute = sys/oss-manage/ossManage
             *   permission = /store/common/file*,/store/common/fileDirectory*,/store/common/upload*
             */
            children: null
          },
          // {
          //   name: "shop-address",
          //   level: 2,
          //   type: 0,
          //   title: "自提管理",
          //   path: "shop-address",
          //   component: "shop/shopAddress",
          //   children: null,
          // }
          // {
          //   name: "shop-address",
          //   level: 2,
          //   type: 0,
          //   title: "自提管理",
          //   path: "shop-address",
          //   component: "shop/shopAddress",
          //   children: null,
          // }
        ]
      }
    ]
  },
  {
    name: "messages",
    level: 0,
    type: -1,
    title: "消息",
    path: "",
    component: "",
    children: [{
      name: "user-manage",
      level: 1,
      type: 0,
      title: "系统消息",
      path: "user-manage",
      component: "sys/user-manage/userManage",
      children: [{
        name: "message-index",
        level: 2,
        type: 0,
        title: "系统消息",
        path: "message",
        component: "message",
        children: null
      }]
    }]
  },

];

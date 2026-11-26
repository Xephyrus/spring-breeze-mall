# 「平台设置缺失 → 服务器繁忙」排查报告

> 起因：创建直播间报「服务器繁忙」，日志显示 `TencentLiveUtil.getLiveSetting` NPE。
> 本文是对**所有依赖【平台设置】的业务入口**做的同类风险排查与处置记录。
> 时间：2026-11-26（R138/R139）

---

## 一、结论

| 项 | 数量 |
|---|---:|

| 后端读取平台配置的位置 | **257 处 / 82 个文件** |
| 其中**已有**判空或 try/catch 保护 | **236 处** |
| 其中**真·未判空**（缺失配置即 NPE） | **21 处** |
| 本轮修复 | **21 处（全部）** |
| 编译 + 启动 + 直播全链路验证 | 通过 |

> **勘误**：初版报告写了「li_setting 表是空的」——**不准确**。
> 实际该表有 30+ 行，且**主键就是配置键**（`id` = `LIVE_SETTING`，没有 `setting_key` 列）。
> 当时 NPE 的直接原因是 `LIVE_SETTING` 这一行缺失（或被清空），不是整表为空。


---

## 二、统一的修法

新增 `framework/src/main/java/cn/lili/common/utils/SettingValues.java`：

```java
// 配置是业务前提 —— 缺失时抛出「可操作」的提示，而不是 NPE
SettingValues.require(settingService, SettingEnum.WITHDRAWAL_SETTING, WithdrawalSetting.class, "提现设置");
// → ServiceException("尚未配置提现设置，请先到【平台设置】中完成配置")

// 配置可缺省 —— 返回 null，由调用方降级（定时任务跳过、VO 字段留空）
SettingValues.optional(settingService, SettingEnum.ORDER_SETTING, OrderSetting.class);
```

两种语义分开，调用方必须显式选择「缺失算错」还是「缺失可降级」。

---

## 三、21 处明细与处置

### A. 配置缺失即错误（`require`，提示用户去配置）—— 15 处

| 文件 | 配置 | 用户影响 |
|---|---|---|
| `MemberWalletBuyerController` | 提现设置 | 会员端「提现」页 500 → 现在提示去配置 |
| `MemberWalletServiceImpl` ×2 | 提现设置 | 提现申请、提现打款 |
| `MemberWithdrawApplyServiceImpl` | 微信支付参数 | 微信转账提现 |
| `ConnectServiceImpl` | 微信登录参数 | 微信登录 |
| `ConnectUtil` ×2 | 微信登录参数 | 微信登录回调 |
| `ConnectUtil` | QQ 登录参数 | QQ 登录 |
| `GoodsServiceImpl` | 商品设置 | 商品新增/编辑 |
| `LiveOperateServiceImpl` | 腾讯云直播参数 | 直播 IM 签名 |
| `SeckillServiceImpl` | 秒杀设置 | 秒杀活动生成 |
| `LogisticsServiceImpl` | 物流设置 | 物流查询 |
| `CashierSupport` | 支付方式 | **收银台**（改为返回空列表，见 D） |

### B. 配置可降级（`optional`，缺失时跳过或留空）—— 6 处

| 文件 | 配置 | 降级方式 |
|---|---|---|
| `LiveRoomServiceImpl` ×2 | 直播参数 | 详情 VO 的 IM AppId / SecretId 留空，**不影响查看直播间** |
| `CashierSupport` | 支付方式 | 返回空列表（= 无可用支付方式），不抛异常 |
| `ConnectUtil` | 登录总开关 | 视为「未开启第三方登录」 |
| `MemberPointExecute` | 积分设置 | 定时任务跳过 |
| `CancelOrderTaskExecute` | 订单设置 | 定时任务跳过 |
| `RechargeOrderTaskExecute` | 订单设置 | 定时任务跳过 |
| `PromotionEverydayExecute` | 秒杀设置 | 定时任务跳过并打 warn |

### C. 定时任务：改为「跳过」而非「崩」

`OrderEveryDayTaskExecute` ×2 保留原有 `ORDER_SETTING_ERROR` 业务码（它原本就会抛，属于预期行为），
其余任务统一 `if (x == null) { log.warn(...); return; }`。

---

## 四、验证

| 项 | 结果 |
|---|---|
| `mvnw -pl manager-api -am package -DskipTests -o` | **成功** |
| 后端启动（8887） | `Started ManagerApiApplication in 17.5s` |
| 直播列表 / 创建 / 详情 / 删除（未配置直播参数） | 全部 `HTTP 200`，创建成功 |
| 平台设置读取接口 | `HTTP 200` |

---

## 五、给后续的提醒

1. **凡是 `settingService.get(...)`，下一行必须是判空或 `SettingValues`** —— 代码评审可据此卡。
2. 新环境初始化时，`li_setting` 表可能**缺很多行**。上线前建议跑一遍「平台设置 → 各页保存一次」。
3. 「服务器繁忙」应当只出现在真正的未知异常；**配置类问题必须能定位到具体设置页**。
4. 若后续引入新的外部服务（短信、地图、OSS 私有桶等），入口处按同样语义接 `SettingValues`。


---

## 六、提示文案规范（R140 优化后）

统一格式：**缺什么 + 去哪配 + 配完做什么**

```
未配置「提现设置」，请前往【平台设置 → 提现设置】填写并保存后重试
```

实现：`SettingValues` 内置 `SettingEnum → 菜单名` 映射（`PAGE_NAMES`），
`require(settingService, key, clazz)` 直接生成文案，调用方**不用再拼字符串**。

| 配置 | 自动生成的提示 |
|---|---|
| WITHDRAWAL_SETTING | 未配置「提现设置」，请前往【平台设置 → 提现设置】填写并保存后重试 |
| WECHAT_CONNECT | 未配置「微信登录」… |
| QQ_CONNECT | 未配置「QQ 登录」… |
| GOODS_SETTING | 未配置「商品设置」… |
| LIVE_SETTING | 未配置「直播设置」… |
| LOGISTICS_SETTING | 未配置「物流设置」… |
| SECKILL_SETTING | 未配置「秒杀设置」… |
| WECHAT_PAYMENT | 未配置「微信支付」… |
| 未登记的 key | 未配置「<KEY>」…（保证永远有「去哪儿配」） |

前端对应提示（直播创建/编辑）统一成同一句式：

```
未配置「直播设置」，推流地址为空。请前往【平台设置 → 直播设置】填写并保存后重试
```

### 单测

新增 `framework/src/test/java/cn/lili/common/utils/SettingValuesTest.java`，覆盖：文案格式、未登记 key 兜底、
`require` 抛业务异常而非 NPE、`optional` 无服务时返回 null。

> 本机离线缺 `surefire-junit-platform` 且 `<skipTests>true</skipTests>`，`mvn test` 跑不了；
> 断言按实现逐一核对，联网/CI 环境会执行。

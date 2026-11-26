-- =============================================================================
-- 补齐 li_setting 默认设置（幂等）
--
-- 用途：新环境导入基础库后，若缺少某些 SETTING 项，业务读取设置会拿到 null，
--       表现为「服务器繁忙」/ 空指针。本脚本把上游默认值补齐，已存在的键不动。
--
-- 来源：docker/init/mysql/lilishop.sql 里的 li_setting 初始数据
-- 生成时间：2026-11-27
-- 幂等性：INSERT ... SELECT ... WHERE NOT EXISTS
--
-- 用法：
--   mysql -u root -p lilishop < backend/DB/init-setting-defaults.sql
--
-- 注意：包含 33 个设置项；本地已有的值不会被覆盖。
-- =============================================================================

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'ALIPAY_PAYMENT', 'system', NOW(), b'0', NULL, NULL, '{\"privateKey\":\"privateKey\",\"alipayPublicCertPath\":\"/home/crt/lili-alipay/alipayCertPublicKey_RSA2.crt\",\"callbackUrl\":\"https://buyer-api.pickmall.cn\",\"certPath\":\"/home/crt/lili-alipay/appCertPublicKey_2021002107649773.crt\",\"appId\":\"appId\",\"rootCertPath\":\"/home/crt/lili-alipay/alipayRootCert.crt\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'ALIPAY_PAYMENT');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'BASE_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"staticPageAddress\":\"https://pc-b2b2c.pickmall.cn\",\"website\":\"https://pickmall.cn\",\"copyrightOwner\":\"lilishop\",\"storeSideLogo\":\"https://cdn.pickmall.cn/cdn/logo/logo2.png\",\"companyName\":\"北京宏业汇成科技有限公司\",\"buyerSideIcon\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/default/388d86596b5342c2ba57c76b4f0f6a98.ico\",\"siteName\":\"lilishop\",\"companyUrl\":\"https://pickmall.cn\",\"domainIcon\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/default/388d86596b5342c2ba57c76b4f0f6a98.ico\",\"storeSideIcon\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/default/388d86596b5342c2ba57c76b4f0f6a98.ico\",\"domainLogo\":\"https://cdn.pickmall.cn/cdn/logo/logo2.png\",\"icp\":\"京ICP备20009696号-1\",\"buyerSideLogo\":\"https://cdn.pickmall.cn/cdn/logo/logo2.png\",\"staticPageWapAddress\":\"https://m-b2b2c.pickmall.cn\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'BASE_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'CATEGORY_PAGE_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"template\":2,\"showFields\":{\"subTitle\":false,\"spec\":true,\"tags\":false,\"selfTag\":true,\"price\":true,\"linePrice\":false,\"sales\":false,\"cart\":true}}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'CATEGORY_PAGE_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'CONNECT_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"callbackUrl\":\"https://buyer-api.pickmall.cn\",\"pc\":\"https://pc-b2b2c.pickmall.cn\",\"wap\":\"https://m-b2b2c.pickmall.cn\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'CONNECT_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_CUSTOMER_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"bindMode\":\"PERMANENT\",\"permanentBindMode\":\"SCAN_IMMEDIATE\",\"permanentPaidDays\":1,\"shortTermBindDays\":1}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_CUSTOMER_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_FEATURED_GOODS_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"defaultSort\":\"HIGHEST_COMMISSION\",\"defaultShareText\":\"分享这个商品给你，快来一起购买吧~\\n精品商品------\\n✨@#\",\"centerVisible\":true,\"showSales\":true,\"sourceMode\":\"CUSTOM\",\"matchRule\":\"HIGHEST_COMMISSION\",\"displayCount\":5,\"skuIds\":[\"1381793060458856448\",\"1381792873405480961\",\"1381792103884914688\",\"1381792103876526080\"]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_FEATURED_GOODS_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_INVITE_CARD_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"memberInfoVisible\":true,\"backgroundImage\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/2083014190720294913/23a40e65429447f080802b22f900bc81.jpg\",\"slogan\":\"邀请您成为我的下级分销员\",\"textColor\":\"#1f2a44\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_INVITE_CARD_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_PROMOTION_POSTER_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"memberInfoVisible\":true,\"backgroundImage\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/2083014190720294913/ca0813a0c8f94e4e98307c593e570e63.jpg\",\"slogan\":\"发现好物，邀请你一起逛逛\",\"textColor\":\"#1f2a44\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_PROMOTION_POSTER_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_RECRUIT_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"planVersion\":18,\"joinConditionType\":\"NONE\",\"applyMode\":\"AUTO\",\"auditMode\":\"MANUAL\",\"onlineEntryVisible\":true,\"requireApplyInfo\":false,\"agreementContent\":\"<p>我是协议！</p>\",\"requirePurchaseGoods\":false,\"requireSelfPurchaseAmount\":false,\"requireConsumeCount\":false,\"minSelfPurchaseAmount\":100,\"minConsumeCount\":2,\"recruitGoods\":[],\"posterEnabled\":true,\"posterBackground\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/2083014190720294913/ca0813a0c8f94e4e98307c593e570e63.jpg\",\"fields\":[]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_RECRUIT_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"isOpen\":true,\"distributorName\":\"分销员\",\"upgradeConditionVisible\":true,\"parentDistributorVisible\":true,\"parentAttributionMode\":\"RECRUIT_INVITER\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'DISTRIBUTION_SETTLEMENT_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"selfPurchaseCommissionMode\":\"NONE\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'DISTRIBUTION_SETTLEMENT_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'ES_SIGN', 'system', NOW(), b'0', NULL, NULL, '{\"secretKey\":\"111\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'ES_SIGN');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'EXPERIENCE_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"items\":[{\"ruleKey\":\"CONSUME\",\"ruleName\":\"消费\",\"enabled\":true,\"value\":1,\"maxValue\":null},{\"ruleKey\":\"REGISTER\",\"ruleName\":\"注册\",\"enabled\":true,\"value\":10,\"maxValue\":null},{\"ruleKey\":\"SIGN_IN\",\"ruleName\":\"签到\",\"enabled\":true,\"value\":10,\"maxValue\":null},{\"ruleKey\":\"COMMENT\",\"ruleName\":\"评价\",\"enabled\":true,\"value\":5,\"maxValue\":null},{\"ruleKey\":\"SHARE\",\"ruleName\":\"分享商城\",\"enabled\":false,\"value\":1,\"maxValue\":100},{\"ruleKey\":\"PROFILE\",\"ruleName\":\"完善信息\",\"enabled\":true,\"value\":10,\"maxValue\":null},{\"ruleKey\":\"FOLLOW_STORE\",\"ruleName\":\"关注店铺\",\"enabled\":false,\"value\":1,\"maxValue\":100},{\"ruleKey\":\"BIND_WECHAT\",\"ruleName\":\"绑定微信\",\"enabled\":false,\"value\":100,\"maxValue\":null},{\"ruleKey\":\"ADD_ADDRESS\",\"ruleName\":\"添加收货地址\",\"enabled\":false,\"value\":10,\"maxValue\":null},{\"ruleKey\":\"SHARE_REGISTER\",\"ruleName\":\"分享注册\",\"enabled\":false,\"value\":1,\"maxValue\":100},{\"ruleKey\":\"SHARE_BUY\",\"ruleName\":\"分享购买\",\"enabled\":false,\"value\":1,\"maxValue\":100}],\"description\":\"签到领京豆活动规则\\n • 活动说明 参与活动前请认真阅读活动规则，参与本次活动即视为用户同意并接受本规则的全部内容。\\n • 活动举办方 本活动由京东举办。\\n • 活动时间（本活动所有时间均以北京时间为准） 1. 活动时间：2024年11月15日12:00:00至2025年12月31日23:59:59\\n • 活动玩法 1. 活动条件：符合【京东注册】条件的用户可参与本次签到领京豆活动。本次活动仅限京东普通个人用户参与，企业用户、渠道经销商、专卖店、批发商用户、异常用户不予参与。 2. 签到玩法：活动期间内，用户可通过【京东首页-京豆ICON-签到领京豆】或者【京东首页-我的-京豆】入口来访签到，可获得签到奖励。每位京东用户【每天】仅可参与【1】次本活动，超过前述次数限制的将被视为无效。3. 连签玩法：当连续签到至规定天数时，当天签到可额外获得京豆奖励。过程中任意一天中断签到，则本轮次连续签到周期从头开始计算奖励（例如：后天可领取第7天的签到奖励，但第6天时没有签到，则第7天签到时不可领取奖励，将从第1天开始计算签到进程和奖励）。完成一个轮次的连续签到后，循环下一个连签奖励周期重新开始（例\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'EXPERIENCE_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'GOODS_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"selfOperatedGoodsCheck\":\"false\",\"goodsCheck\":\"true\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'GOODS_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'IM_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"httpUrl\":\"http://127.0.0.1:8000\",\"imageOssBucket\":\"lili-im\",\"imageOssEndpoint\":\"oss-cn-beijing.aliyuncs.com\",\"imageOssAccessKeyId\":\"\",\"imageOssAccessKeySecret\":\"\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'IM_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'KUAIDI_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"ebusinessID\":\"test\",\"appKey\":\"test\",\"reqURL\":\"test\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'KUAIDI_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'ORDER_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"closeAfterSale\":\"0\",\"autoAfterSaleReview\":\"0\",\"autoEvaluation\":\"7\",\"closeComplaint\":\"12\",\"autoCancelAfterSale\":\"7\",\"autoCancel\":\"35\",\"autoReceive\":\"5\",\"wechatOrderAutoUploadEnabled\":true,\"autoAfterSaleComplete\":\"0\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'ORDER_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'OSS_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"type\": \"ALI_OSS\", \"cdnEnabled\": false, \"m_endpoint\": \"\", \"m_frontUrl\": \"\", \"m_accessKey\": \"\", \"m_secretKey\": \"\", \"cdnUrlPrefix\": \"\", \"m_bucketName\": \"\", \"tencentCOSBucket\": \"\", \"tencentCOSRegion\": \"\", \"aliyunOSSEndPoint\": \"\", \"tencentCOSEndPoint\": \"\", \"tencentCOSSecretId\": \"\", \"aliyunOSSBucketName\": \"\", \"tencentCOSSecretKey\": \"\", \"aliyunOSSAccessKeyId\": \"\", \"aliyunOSSPicLocation\": \"\", \"huaweicloudOBSEndPoint\": \"\", \"huaweicloudOBSAccessKey\": \"\", \"huaweicloudOBSSecretKey\": \"\", \"aliyunOSSAccessKeySecret\": \"\", \"huaweicloudOBSBucketName\": \"\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'OSS_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'PAID_MEMBER_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"enabled\":false,\"name\":\"付费会员\",\"icon\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/2117947015370043393/28bf6388af504bf6990bbdc6ba296806.png\",\"backgroundType\":\"COLOR\",\"backgroundColor\":\"#2b2623\",\"fontColor\":\"#f3d9a4\",\"price\":99,\"months\":12,\"benefitIds\":[\"1\",\"2\",\"10\",\"9\"],\"storeScope\":\"SELF\",\"storeIds\":[],\"discountMode\":\"ALL\",\"discount\":9.5,\"goodsRules\":[],\"recommendedSkuIds\":[\"1381792623026503680\",\"1381792263700480000\",\"1381792263696285696\",\"1381792187775188992\",\"1381792187770994688\",\"1381792103884914688\",\"1381792103876526080\",\"1381791962717224960\",\"1381791962713030656\",\"1381789991545339904\",\"1381789991541145600\",\"1376850145181696000\",\"1376850145177501696\"],\"unopenedText\":\"开通付费会员&#xff0c;享专属权益\",\"unopenedFontColor\":\"#f3d9a4\",\"unopenedBackground\":\"\",\"openedText\":\"我的付费会员&#xff0c;专享好权益\",\"openedFontColor\":\"#f3d9a4\",\"openedBackground\":\"\",\"priceLabel\":\"\",\"description\":\"<p>下面两份可直接放入富文本编辑器。先把 **【平台名称】、【运营主体全称】、【客服联系方式】**替换成实际信息。涉及费用、有效期、权益限制和退款的内容应保留醒目提示&#xff0c;相关原则参考[《消费者权益保护法》](https://www.samr.gov.cn/zfjcj/tzgg/art/2023/art_615af9ed6bcd4974bf853dd2e02bc663.html)及其[实施条例](https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2024/art_0aea188276a44f0baf940ab95ee00e0a.html)。</p>\\n<p>---</p>\\n<p>**购买说明**</p>\\n<p>**1. 会员开通**</p>\\n<p>付费会员是【平台名称】提供的增值服务&#xff0c;与普通客户等级独立。开通前&#xff0c;请核对会员价格、有效期及权益内容&#xff0c;具体以购买确认页面展示为准。</p>\\n<p>**2. 生效与续费**</p>\\n<p>支付成功并经平台确认后&#xff0c;会员资格按订单约定生效。会员有效期、开始时间和到期时间可在会员中心查看。</p>\\n<p>有效期内续费&#xff0c;新增有效期从原到期时间后顺延&#xff1b;会员已到期后再次购买&#xff0c;从本次开通生效时间起计算。有效期按自然月计算&#xff0c;目标月份没有对应日期时&#xff0c;以该月最后一天为对应日期。</p>\\n<p>**本服务采用手动续费&#xff0c;不会自动扣费。**</p>\\n<p>**3. 商品会员优惠**</p>\\n<p>会员有效期内&#xff0c;可购买参与商家范围内符合条件的会员优惠商品。具体适用商家、商品及折扣以页面展示和订单确认结果为准。</p>\\n<p>商品价格、参与范围及活动状态可能发生变化&#xff0c;推荐商品展示不代表该商品必然享有会员优惠。拼团、秒杀、积分兑换等活动专用订单不叠加会员折扣。</p>\\n<p>**4. 会员权益**</p>\\n<p>开通后可享受会员页面展示的专属权益。不同权益的使用条件、发放时间及次数&#xff0c;以对应权益说明为准&#xff1b;未来生效的续费权益&#xff0c;自相应有效期开始后按规则发放。</p>\\n<p>**5. 购物积分**</p>\\n<p>购物积分在订单完成、售后入口关闭且相关售后全部终结后&#xff0c;按最终保留金额计算。</p>\\n<p>**积分使用实际发放时的积分比例和客户当前有效权益最高倍率&#xff0c;同类倍率不叠乘。下单后积分配置变化、客户等级变化或付费会员到期&#xff0c;均可能影响尚未发放的积分。已发放积分不重复计算或补差额。**</p>\\n<p>**6. 退款与咨询**</p>\\n<p>商品退货退款按对应商品售后规则处理&#xff0c;会员费与商品价款分别处理。</p>\\n<p>如需咨询会员费退款、权益未到账或会员资格异常&#xff0c;请联系【客服联系方式】。平台将结合服务履行情况和适用法律处理&#xff0c;不影响您依法享有的退款及其他消费者权利。</p>\\n<p>---</p>\\n<p>双方发生争议时&#xff0c;可先协商解决&#xff1b;协商不成的&#xff0c;您可依法向有关部门投诉、申请调解&#xff0c;或向有管辖权的人民法院提起诉讼。</p>\\n<p>本协议未约定事项&#xff0c;依照适用法律法规处理&#xff1b;个别条款无效&#xff0c;不影响其他有效条款的效力。</p>\",\"agreement\":\"<p>**付费会员服务协议**</p>\\n<p>本协议由您与【平台名称】运营主体【运营主体全称】订立&#xff0c;适用于付费会员的购买、使用及续费。</p>\\n<p>**一、协议确认**</p>\\n<p>开通前&#xff0c;请仔细阅读本协议及购买页面展示的价格、有效期、权益内容和使用限制。如对相关内容存在疑问&#xff0c;可通过【客服联系方式】咨询。</p>\\n<p>您主动勾选同意本协议并完成购买&#xff0c;表示同意按照本协议及购买时明确展示的规则使用会员服务。</p>\\n<p>**二、会员账户**</p>\\n<p>会员资格与购买时登录的平台账户绑定。请妥善保管账户及支付信息&#xff0c;避免向他人泄露密码、验证码等信息。</p>\\n<p>会员服务供该账户正常消费使用&#xff0c;不得通过虚假交易、恶意退款、技术攻击等方式获取不当利益。账户安全事件发生后&#xff0c;请及时联系平台处理。</p>\\n<p>**三、费用与有效期**</p>\\n<p>1. 会员开通价格和有效期以购买确认页面及实际支付订单为准。会员费属于会员服务费用&#xff0c;不是商品购物款或账户充值余额。<br />2. 支付成功并经平台确认后&#xff0c;平台按订单约定提供会员服务。<br />3. 有效期内续费&#xff0c;从已有有效期结束后顺延&#xff1b;到期后再次购买&#xff0c;从本次开通生效时间起计算。具体起止时间以会员中心及购买记录为准。<br />4. 有效期按自然月计算&#xff0c;目标月份没有对应日期时&#xff0c;以该月最后一天为对应日期。<br />5. **本服务不自动续费&#xff0c;平台不会因会员到期而自动扣款。**</p>\\n<p>**四、权益与商品优惠**</p>\\n<p>1. 平台应按照购买时明确展示的内容提供会员服务&#xff0c;具体权益的条件、次数和发放周期以对应说明为准。<br />2. 付费会员与普通客户等级独立&#xff0c;开通会员不会直接改变普通等级或经验值。<br />3. 商品会员优惠仅适用于符合规则的商家、商品及订单。能否与其他优惠同享&#xff0c;以具体活动规则和订单确认页面为准。<br />4. 商品库存、上下架状态及活动状态可能变化。推荐商品列表属于展示内容&#xff0c;不构成固定供货或固定优惠承诺。<br />5. 因系统异常导致会员资格或权益未正常到账的&#xff0c;平台应及时核查&#xff0c;并根据实际情况恢复资格、补发权益或提供其他合理处理方案。</p>\\n<p>**五、购物积分**</p>\\n<p>1. 购物积分在订单完成、售后入口关闭且全部相关售后终结后发放&#xff1b;发生退款的&#xff0c;按最终保留金额计算。<br />2. **每元赠送积分数及权益倍率&#xff0c;使用实际发放时的当前规则&#xff0c;不使用下单时规则。**<br />3. 普通等级与有效付费会员权益中的同类积分倍率取最高值&#xff0c;不叠乘。客户升级、降级、权益变更或会员到期&#xff0c;可能影响尚未发放的积分。<br />4. 已成功发放的购物积分不因后续规则变化重新计算或补差额。</p>\\n<p>**六、取消与退款**</p>\\n<p>1. 未支付订单可以按平台提供的功能取消&#xff1b;已支付订单如需申请会员费退款&#xff0c;请联系【客服联系方式】。<br />2. 平台应依法审核退款申请。需要核算已履行服务或已享受权益的&#xff0c;应提供明确、合理的计算依据&#xff0c;不得重复扣减或任意增加费用。<br />3. 符合退款条件的&#xff0c;平台将与您确认退款金额及办理方式&#xff0c;原则上通过原支付渠道退回&#xff1b;原渠道无法退款的&#xff0c;双方另行确认其他合法方式。<br />4. 因平台原因无法继续提供约定服务的&#xff0c;平台应依法承担责任&#xff0c;并就未履行部分提供退款或经您同意的其他处理方案。<br />5. 商品退货退款与会员费退款分别处理&#xff0c;不影响您依法享有的消费者权利。</p>\\n<p>**七、服务调整与个人信息保护**</p>\\n<p>1. 平台可根据经营情况调整后续新购会员的价格和权益&#xff0c;并在购买前明确展示。<br />2. **涉及已购买会员服务的重大不利调整&#xff0c;平台应提前说明&#xff0c;不通过单方公告任意减少已约定权益&#xff1b;需要变更的&#xff0c;依法与您协商处理。**<br />3. 购物积分采用本协议第五条明确约定的发放时规则。<br />4. 平台仅在提供会员、支付、权益发放及售后服务所必需的范围内处理个人信息&#xff0c;具体按照平台隐私政策执行。</p>\\n<p>**八、联系与争议处理**</p>\\n<p>会员服务问题可通过【客服联系方式】联系平台。</p>\\n<p>\\u00a0</p>\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'PAID_MEMBER_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'PAYMENT_SUCCESS_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"goodsEnabled\":true,\"goodsTitle\":\"为你推荐\",\"goodsSource\":\"MANUAL\",\"goodsSort\":\"NEW\",\"goodsLimit\":4,\"excludePurchased\":true,\"storeIds\":[],\"skuIds\":[\"1381792263700480000\",\"1381792623026503680\",\"1381792873405480960\",\"1381792187770994688\",\"1387978323669286912\",\"1387978410361356288\"],\"promotionEnabled\":true,\"image\":\"https://lilishop-oss.oss-cn-beijing.aliyuncs.com/MANAGER/2117947015370043393/9379c31ca2e34b8880c580cc9d2c9e85.png\",\"startTime\":1795159980000,\"endTime\":1795190400000,\"targetType\":\"CATEGORY\",\"targetId\":\"1348576427264204941\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'PAYMENT_SUCCESS_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'PAYMENT_SUPPORT', 'system', NOW(), b'0', NULL, NULL, '{\"paymentSupportItems\":[{\"client\":\"H5\",\"supports\":[\"WALLET\",\"ALIPAY\",\"WECHAT\"]},{\"client\":\"PC\",\"supports\":[\"WECHAT\",\"ALIPAY\",\"WALLET\"]},{\"client\":\"WECHAT_MP\",\"supports\":[\"WECHAT\",\"WALLET\"]},{\"client\":\"APP\",\"supports\":[\"WECHAT\",\"ALIPAY\",\"WALLET\"]}]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'PAYMENT_SUPPORT');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'POINT_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"register\":10,\"consumer\":1,\"money\":1,\"signIn\":2,\"comment\":24,\"pointSettingItems\":[]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'POINT_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'QQ_CONNECT', 'system', NOW(), b'0', NULL, NULL, '{\"qqConnectSettingItemList\":[{\"clientType\":\"PC\",\"appId\":\"\",\"appKey\":\"\"},{\"clientType\":\"H5\",\"appId\":\"\",\"appKey\":\"\"}]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'QQ_CONNECT');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'SECKILL_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"seckillRule\":\"秒杀规则\",\"hours\":\"1,2,3\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'SECKILL_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'SECURITY_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"sensitiveLevel\":1,\"isDemoSite\":false,\"buyerTokenExpireTime\":259200,\"managerTokenExpireTime\":86400}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'SECURITY_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'SENSITIVE_WORDS_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"enabled\":true,\"disabledGroups\":[]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'SENSITIVE_WORDS_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'SMS_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"accessKeyId\":\"test\",\"tencentSdkAppId\":\"null\",\"registerTemplateCode\":\"SMS_205755298\",\"huaweiSender\":\"null\",\"signName\":\"lili\",\"tencentSecretId\":\"null\",\"huaweiAppKey\":\"null\",\"isTestModel\":\"true\",\"tencentSecretKey\":\"null\",\"type\":\"ALI\",\"accessSecret\":\"test\",\"tencentSignName\":\"null\",\"huaweiSignature\":\"null\",\"payPasswordTemplateCode\":\"SMS_205755301\",\"walletPasswordTemplateCode\":\"SMS_205755297\",\"findPasswordTemplateCode\":\"SMS_205755301\",\"huaweiAppSecret\":\"null\",\"loginTemplateCode\":\"SMS_205755300\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'SMS_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'THEME_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"mode\":\"system\",\"lightColor\":\"#F5222D\",\"aiderLightColor\":\"#FF4D4F\",\"themeColor\":\"#F5222D\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'THEME_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'TIMED_TASK_SETTING', 'system', NOW(), b'0', NULL, NULL, '[{\"id\":\"ORDER_AUTO_COMPLETE\",\"name\":\"订单自动确认收货\",\"description\":\"订单发货后达到自动收货时限自动确认收货\",\"group\":\"订单任务\",\"cron\":\"0 0 3 * * ?\",\"status\":true,\"lastExecTime\":1793264198281,\"lastExecStatus\":1,\"lastExecCost\":778},{\"id\":\"ORDER_AUTO_EVALUATE\",\"name\":\"订单自动好评\",\"description\":\"订单完成达到评价时限未评价自动五星好评\",\"group\":\"订单任务\",\"cron\":\"0 0 3 * * ?\",\"status\":true},{\"id\":\"ORDER_CLOSE_AFTER_SALE\",\"name\":\"自动关闭超时售后\",\"description\":\"买家申请售后超时未处理或未退货自动关闭\",\"group\":\"订单任务\",\"cron\":\"0 0 4 * * ?\",\"status\":true},{\"id\":\"ORDER_CLOSE_COMPLAINT\",\"name\":\"自动关闭超时投诉\",\"description\":\"交易投诉超时未响应自动关闭\",\"group\":\"订单任务\",\"cron\":\"0 0 4 * * ?\",\"status\":true},{\"id\":\"ORDER_PROFIT_SHARING\",\"name\":\"订单分账与解冻\",\"description\":\"订单结算周期完成后解冻佣金与分账\",\"group\":\"订单任务\",\"cron\":\"0 0 5 * * ?\",\"status\":true},{\"id\":\"ORDER_CREATE_BILL\",\"name\":\"生成店铺结算单\",\"description\":\"按店铺结算周期生成每日或每月对账结算单\",\"group\":\"订单任务\",\"cron\":\"0 0 6 * * ?\",\"status\":true},{\"id\":\"CancelOrderTaskExecute\",\"name\":\"订单超时自动取消\",\"description\":\"未付款订单超时后自动取消并释放库存\",\"group\":\"订单任务\",\"cron\":\"0 0/5 * * ?\",\"status\":true},{\"id\":\"RechargeOrderTaskExecute\",\"name\":\"充值订单超时取消\",\"description\":\"充值未付款订单超时后关闭\",\"group\":\"订单任务\",\"cron\":\"0 0/10 * * ?\",\"status\":true},{\"id\":\"AppointmentMinuteTaskExecute\",\"name\":\"预约订单超时核销与提醒\",\"description\":\"预约服务未到店核销自动处理及临期服务微信提醒\",\"group\":\"预约任务\",\"cron\":\"0 0/5 * * ?\",\"status\":true},{\"id\":\"CouponExecute\",\"name\":\"优惠券状态更新\",\"description\":\"失效或过期优惠券自动标记为已过期\",\"group\":\"营销任务\",\"cron\":\"0 0/30 * * ?\",\"status\":true},{\"id\":\"GiftCardCashExpireExecute\",\"name\":\"礼品卡现金过期处理\",\"description\":\"礼品卡绑定的余额过期处理\",\"group\":\"营销任务\",\"cron\":\"0 0 0 * * ?\",\"status\":true},{\"id\":\"PromotionEverydayExecute\",\"name\":\"促销活动每日更新\",\"description\":\"每日秒杀、拼团、满减等活动的开始与结束状态流转\",\"group\":\"营销任务\",\"cron\":\"0 0 0 * * ?\",\"status\":true},{\"id\":\"MemberCouponSignEverydayExecute\",\"name\":\"会员优惠券每日签到\",\"description\":\"会员每日签到领券等定时触发\",\"group\":\"营销任务\",\"cron\":\"0 0 0 * * ?\",\"status\":true},{\"id\":\"GoodsExecute\",\"name\":\"商品定时上下架\",\"description\":\"定时上架或达到下架时间的商品状态流转\",\"group\":\"商品任务\",\"cron\":\"0 0/10 * * ?\",\"status\":true},{\"id\":\"HotWordsEveryDayTaskExecute\",\"name\":\"搜索热词每日更新\",\"description\":\"统计搜索频次更新热门搜索关键词\",\"group\":\"商品任务\",\"cron\":\"0 0 1 * * ?\",\"status\":true},{\"id\":\"StoreExecute\",\"name\":\"店铺状态处理\",\"description\":\"店铺过期或年费到期状态处理\",\"group\":\"店铺任务\",\"cron\":\"0 0/30 * * ?\",\"status\":true},{\"id\":\"StoreRatingExecute\",\"name\":\"店铺评分统计更新\",\"description\":\"根据近期用户评价重新计算店铺综合评分\",\"group\":\"店铺任务\",\"cron\":\"0 0 2 * * ?\",\"status\":true},{\"id\":\"BroadcastExecute\",\"name\":\"小程序直播状态同步\",\"description\":\"同步微信小程序直播间数据和回放状态\",\"group\":\"系统任务\",\"cron\":\"0 0/30 * * ?\",\"status\":true},{\"id\":\"DistributionRelationExpireExecute\",\"name\":\"分销绑定关系过期\",\"description\":\"超过有效期的分销关系自动解绑\",\"group\":\"分销任务\",\"cron\":\"0 0 2 * * ?\",\"status\":true},{\"id\":\"OnlineMemberStatistics\",\"name\":\"在线会员统计\",\"description\":\"统计当前在线用户数与会话情况\",\"group\":\"统计任务\",\"cron\":\"0 0/10 * * ?\",\"status\":true},{\"id\":\"PageViewStatisticsExecute\",\"name\":\"页面访问PV/UV统计\",\"description\":\"按小时归档店铺与平台页面访问量\",\"group\":\"统计任务\",\"cron\":\"0 0 * * * ?\",\"status\":true,\"lastExecTime\":1793264400033,\"lastExecStatus\":1,\"lastExecCost\":33},{\"id\":\"MemberStatisticsExecute\",\"name\":\"会员活跃与增长统计\",\"description\":\"每日归档会员总数、新增会员与活跃情况\",\"group\":\"统计任务\",\"cron\":\"0 0 1 * * ?\",\"status\":true}]'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'TIMED_TASK_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'VERIFICATION_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"interfereNum\":1,\"watermark\":\"LILI-SHOP\",\"loginBypassEnabled\":false,\"faultTolerant\":3,\"effectiveTime\":300}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'VERIFICATION_SETTING');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'WECHAT_CONNECT', 'system', NOW(), b'0', NULL, NULL, '{\"wechatConnectSettingItems\":[{\"appId\":\"\",\"appSecret\":\"\",\"clientType\":\"PC\"},{\"appId\":\"\",\"appSecret\":\"\",\"clientType\":\"H5\"},{\"appId\":\"wx6f10f29075dc1b0b\",\"appSecret\":\"27e73c2493f9d98ba49fed069aea2c2d\",\"clientType\":\"WECHAT_MP\"}]}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'WECHAT_CONNECT');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'WECHAT_PAYMENT', 'system', NOW(), b'0', NULL, NULL, '{\"nativeAppId\":\"\",\"jsapiAppId\":\"\",\"mchId\":\"\",\"apiclient_key\":\"\",\"serialNumber\":\"\",\"mpAppId\":\"\",\"appAppId\":\"\",\"apiKey3\":\"\",\"apiclient_cert_pem\":\"\",\"apiclient_cert_p12\":\"\",\"h5AppId\":\"\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'WECHAT_PAYMENT');

INSERT INTO li_setting (id, create_by, create_time, delete_flag, update_by, update_time, setting_value)
SELECT 'WITHDRAWAL_SETTING', 'system', NOW(), b'0', NULL, NULL, '{\"minPrice\":1,\"type\":\"WECHAT\",\"apply\":true,\"wechatAppId\":\"1\",\"withdrawRule\":\"我是提现说明\"}'
WHERE NOT EXISTS (SELECT 1 FROM li_setting WHERE id = 'WITHDRAWAL_SETTING');

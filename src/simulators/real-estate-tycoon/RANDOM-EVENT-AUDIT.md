---

authored_by: external
content_role: reference
trust_level: primary
authoring_mode: human
last_verified: 2026-05-17
---
# 房地产大亨模拟器：突发事件逐项审查

生成时间：2026-05-02

## 审查标准

- **系统判定**：直接按代码里的 `eventMood()` 规则判定。`OPPORTUNITY_EVENT_IDS` 是机会；`NEUTRAL_EVENT_IDS` 或 `routine` 是中性；`high/crisis` 是坏事；其余是压力。
- **调度通道**：看事件是否在主线、`interruptEvents`、机会池、项目门控或资产处置门控中。
- **选择收益分**：粗略把现金、销售、交付、政府、银行、业主信任等正向数值加分；债务和隐藏风险加分反向扣分。它不是最终游戏数值，只用于判断“这个事件像不像好消息”。
- **审查结论**：判断事件在玩家体感里更像好消息、压力题、坏事，还是标题像机会但系统没当机会处理。

## 总览

- 总事件数：130
- 系统判定为机会：14
- 系统判定为坏事：75
- 系统判定为压力：30
- 系统判定为中性：11
- 严重度分布：pressure 38，high 41，routine 13，crisis 38
- 真正“每个选项都不亏”的正/中性事件：7
- 标题像机会但系统没有按机会处理：5

## 调度器实际逻辑

1. 玩家选择后，系统先执行 `scheduleConsequences()`，它主要把坏后果压进 `eventQueue`，例如供应商堵门、监管户、停工、银行抽贷、资产冻结、法律问询。
2. 然后执行 `scheduleDarkLineConsequences()`、`scheduleStakeholderReactions()`、`scheduleProjectLedgerActions()`。这些也主要生成风险、投诉、银行、业主、工程和黑灰线事件。
3. 到下一回合时，`advanceToNextEvent()` 决定是否继续事件。如果上一回合已经是突发事件，通常回老板桌；但系统压力高时会继续突发。
4. `rollTurnIncident()` 真正抽突发：
   - 连续坏事 >= 2 且不在强危机时，才强制插入机会事件。
   - 到期的项目/反应/危机队列优先级最高。
   - 普通队列、interrupt、普通事件池、机会池再一起竞争。
   - 机会池不是独立保底通道，所以会被大量队列坏事淹没。
5. 代码里“压力”事件不会增加 `badEventStreak`，但玩家体感上它们仍然是坏消息；因此连续多个压力事件不会触发机会保底。

## 机会池事件

| # | ID | 标题 | 重复 | 最好/最差 | 审查结论 |
|---:|---|---|---|---:|---|
| 6 | `lgfv-joint-venture` | 城投递来一份联合开发协议 | 否 | 17/-3 | 可作为好消息 |
| 9 | `trust-money-arrives` | 信托经理带着快钱上门 | 否 | 14/-6 | 可作为好消息 |
| 23 | `high-point-exit-window` | 高点退出窗口只开了半扇 | 否 | 62/-36 | 可作为好消息 |
| 25 | `mortgage-rate-cut-window` | 按揭利率下调，售楼处电话突然多了 | 是/9 | 21/5 | 可作为好消息 |
| 26 | `bank-credit-review-pass` | 银行复核通过，授信口子松了一格 | 是/10 | 22/-6 | 可作为好消息 |
| 27 | `city-permit-fast-track` | 住建窗口把证照流程往前排了一周 | 是/8 | 18/5 | 可作为好消息 |
| 28 | `project-collection-week` | 尾款和车位款集中到账，现金池厚了一口 | 是/7 | 19/11 | 可作为好消息 |
| 63 | `project-sale-window` | 有人愿意买你的好项目，但只给七折 | 否 | 54/-36 | 可作为好消息 |
| 73 | `land-auction-no-bid` | 土拍大厅没人举牌，县里看向你 | 否 | -2/-11 | 名义机会，但收益不明显/偏负 |
| 78 | `state-purchase-inventory` | 国企收储存量房：只收现房，价格很低 | 否 | 24/-18 | 可作为好消息 |
| 80 | `urban-village-renewal-package` | 城中村改造大包：周期长、关系多、现金慢 | 否 | 10/-13 | 可作为好消息 |
| 119 | `county-finance-road-advance` | 县里让你先垫一段配套路 | 否 | 0/-14 | 名义机会，但收益不明显/偏负 |
| 129 | `post-delivery-capital-desk` | 三盘交完，银行反而问你下一块地 | 是/5 | 21/-10 | 可作为好消息 |
| 130 | `voluntary-exit-window` | 你忽然发现：现在收手也许还能睡着 | 否 | 64/-22 | 可作为好消息 |

## 标题像机会但系统没按机会处理

| # | ID | 标题 | 系统判定 | 通道 | 最好/最差 | 审查结论 |
|---:|---|---|---|---|---:|---|
| 34 | `first-mortgage-bank-visit` | 银行只认回款，不认你的人情 | 压力 | 主线 | 13/0 | 标题像机会，但系统未按机会处理 |
| 56 | `sales-data-meeting` | 月报上，认购、网签、回款差了三张表 | 中性 | 主线 | 8/-3 | 标题像机会，但系统未按机会处理 |
| 100 | `mature-asset-sale-rumor` | 核心项目有人出高价，外面开始传你要撤 | 坏事 | 突发interrupt | 44/-11 | 标题像机会，但系统未按机会处理 |
| 110 | `related-bank-spv-loan` | 银行朋友说额度能走，但要绕一层公司 | 压力 | 突发interrupt | 6/-20 | 标题像机会，但系统未按机会处理 |
| 127 | `bank-credit-after-presale` | 银行看了网签表，主动问你要不要加额度 | 压力 | 突发interrupt | 11/4 | 标题像机会，但系统未按机会处理 |

## 全部事件逐项表

| # | ID | 标题 | 严重度 | 系统判定 | 调度通道 | 阶段 | 重复 | 最好/最差 | 三个选择粗分 | 审查结论 |
|---:|---|---|---|---|---|---|---|---:|---|---|
| 1 | `first-land-deposit` | 保证金、工资、商票，今晚只能付一张 | pressure | 压力 | 主线 | early-expansion | 否 | 4/-11 | 交保证金，先把地锁住(-11)<br>先发工资，地块让别人拍走(4)<br>兑商票，保证供应商别先翻脸(-3) | 压力题，不算好消息 |
| 2 | `contractor-payment` | 工地明早停不停，就看今晚付谁 | pressure | 压力 | 主线 | early-expansion, shelter-reform-boom, sales-freeze, guaranteed-delivery | 否 | 5/-23 | 拿现金补工程款，售楼处推广先砍掉(5)<br>开商票给总包：账上好看，期限往后(-5)<br>威胁换总包，逼他继续垫资(-23) | 压力题，不算好消息 |
| 3 | `presale-permit` | 预售证还差一层楼 | high | 坏事 | 普通事件池 | early-expansion, shelter-reform-boom, high-turnover | 否 | 10/-9 | 先开盘回款，把工程节点补上(-3)<br>等工程节点，不抢这一波开盘(10)<br>做内部认购，先收意向金不算正式销售(-9) | 坏事/危机 |
| 4 | `fake-showroom-heat` | 售楼处缺的不是客户，是人气 | routine | 中性 | 主线 | early-expansion, shelter-reform-boom, high-turnover | 否 | 15/-6 | 花钱做热场，把售楼处塞满(-6)<br>直接给首批客户真实折扣(15)<br>承认冷清，缩小开盘规模(4) | 中性经营题 |
| 5 | `demolition-nail-house` | 三户不签，土方老板说他能处理 | high | 坏事 | 普通事件池 | early-expansion, shelter-reform-boom, high-turnover | 否 | 11/-15 | 让土方老板出面，三天清场(-15)<br>加补偿，砍掉项目利润(11)<br>等街道调解，开工节点顺延(-5) | 坏事/危机 |
| 6 | `lgfv-joint-venture` | 城投递来一份联合开发协议 | pressure | 机会 | 机会池 | early-expansion, shelter-reform-boom, three-red-lines, clearance | 否 | 17/-3 | 接受城投入股，先把信用做起来(17)<br>只做单项目合作，不让城投进母公司(6)<br>拒绝入股，自己慢慢做(-3) | 可作为好消息 |
| 7 | `new-district-metro-rumor` | 新区地铁还在图纸上 | pressure | 压力 | 主线 | early-expansion, shelter-reform-boom, high-turnover | 否 | 2/-20 | 跟新区叙事走，再拿一块地(-20)<br>等正式批复，放弃首轮窗口(2)<br>找城投兜底，自己只出小股(-2) | 压力题，不算好消息 |
| 8 | `shelter-reform-boom` | 棚改款像潮水一样涌进县城 | high | 坏事 | 主线 | shelter-reform-boom | 否 | 15/-20 | 复制到三个县，做区域房企(-9)<br>只加码本城，把交付做成样板(15)<br>捂盘涨价，等补偿款继续进来(-20) | 坏事/危机 |
| 9 | `trust-money-arrives` | 信托经理带着快钱上门 | high | 机会 | 主线 / 机会池 | shelter-reform-boom, high-turnover, three-red-lines | 否 | 14/-6 | 接受信托资金，继续拿地(-6)<br>只借一半，专门补工程节点(9)<br>拒绝信托，卖掉一块边角地回血(14) | 可作为好消息 |
| 10 | `high-turnover-meeting` | 集团会：从拿地到开盘只给你 87 天 | high | 坏事 | 主线 | high-turnover | 否 | 6/-21 | 全面高周转，排名先冲上去(-21)<br>只标准化户型，不压工程安全节点(6)<br>延迟开盘，先把图纸和现场对齐(4) | 坏事/危机 |
| 11 | `school-district-promise` | 销售海报上多了一所学校 | pressure | 压力 | 主线 / 突发interrupt | shelter-reform-boom, high-turnover | 否 | 5/0 | 写进海报：名校配套，限时认购(1)<br>只写规划利好，不写入合同(0)<br>不卖学校，只按产品和价格卖(5) | 压力题，不算好消息 |
| 12 | `old-owners-price-cut` | 老业主把横幅做得很专业 | high | 坏事 | 主线 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 15/1 | 大幅降价，先把现金打回来(15)<br>不公开降价，给渠道暗折(1)<br>不降价，砍拿地和广告保交付(11) | 坏事/危机 |
| 13 | `presale-supervision-account` | 监管账户锁住了你的救命钱 | crisis | 坏事 | 主线 / 预售门控 / 资产处置门控 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 34/-37 | 尊重监管账户，只用于本项目复工(34)<br>找关系划走一部分，先还最急的债(-37)<br>让政府、银行、总包做封闭回款方案(14) | 坏事/危机 |
| 14 | `bank-loan-withdrawal` | 银行说监管口径变了 | crisis | 坏事 | 主线 | three-red-lines, sales-freeze | 否 | 22/-15 | 把最好的项目抵押出去换续贷(-1)<br>折价卖一个项目，先降负债(22)<br>把认购、拟签约和回款打包成漂亮材料(-15) | 坏事/危机 |
| 15 | `supplier-blockade` | 供应商把货车停在总部门口 | high | 坏事 | 主线 / 突发interrupt / 交付门控 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 10/-6 | 拿现金付头部供应商，先拆联盟(3)<br>用房子抵货款，让供应商自己去卖(-6)<br>公开分期兑付表，接受舆情短痛(10) | 坏事/危机 |
| 16 | `stoppage-video` | 停工视频上了本地热榜 | crisis | 坏事 | 主线 / 交付门控 | sales-freeze, guaranteed-delivery | 否 | 27/-45 | 停掉新项目资金，今晚复工这个盘(27)<br>先发声明和效果图，三天后再谈复工(-45)<br>请政府专班进驻，接受资金监管(14) | 坏事/危机 |
| 17 | `mortgage-boycott-letter` | 业主联名信写到了停贷 | crisis | 坏事 | 主线 / 预售门控 | guaranteed-delivery, clearance | 否 | 43/-54 | 卖掉两个未开工地块，专款复工(43)<br>申请专项借款，但接受封闭运行(29)<br>把责任推给总包和材料涨价(-54) | 坏事/危机 |
| 18 | `offshore-bond-due` | 美元债投资人不接受你的新故事 | crisis | 坏事 | 突发interrupt | three-red-lines, sales-freeze, clearance | 否 | 21/-24 | 主动债务重组，承认债权人要打折(15)<br>继续拖，等市场回暖和政策窗口(-24)<br>卖掉海外和非核心资产，先兑一部分(21) | 坏事/危机 |
| 19 | `diversification-circus` | 文旅城、汽车队、足球俱乐部都想找你冠名 | high | 坏事 | 突发interrupt | high-turnover, three-red-lines | 否 | 17/-51 | 砸钱做文旅和汽车，讲第二曲线(-51)<br>只做物业和代建，转轻资产(17)<br>接地方文旅城，换土地和政策支持(-20) | 坏事/危机 |
| 20 | `state-capital-takeover` | 国资接盘，只挑好资产 | crisis | 坏事 | 主线 / 资产处置门控 | guaranteed-delivery, clearance | 否 | 43/-41 | 接受国资控股，自己退到小股东(43)<br>坚持控股权，要求国资连债务一起接(-41)<br>卖好项目还债，保一个空壳继续熬(26) | 坏事/危机 |
| 21 | `boss-travel-ban` | 机场贵宾厅门口，你的证件刷红了 | crisis | 坏事 | 主线 / 突发interrupt | guaranteed-delivery, clearance | 否 | 30/-28 | 取消行程，回专班交账(12)<br>让律师拖程序，自己继续谈资产(-28)<br>公开项目账本，换取处置谈判空间(30) | 坏事/危机 |
| 22 | `anti-gang-investigation` | 土方老板被带走了 | crisis | 坏事 | 突发interrupt | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 14/-28 | 主动切割，提交完整付款和会议记录(14)<br>找旧领导压一压，别扩大(-28)<br>说是项目公司副总个人操作(-22) | 坏事/危机 |
| 23 | `high-point-exit-window` | 高点退出窗口只开了半扇 | pressure | 机会 | 主线 / 机会池 | shelter-reform-boom, high-turnover, three-red-lines | 否 | 62/-36 | 卖项目降杠杆，停止追榜(62)<br>不卖，反手再拿一块核心地(-36)<br>卖一半，另一半继续做(24) | 可作为好消息 |
| 24 | `distressed-project-bargain` | 隔壁房企暴雷，项目打六折卖你 | high | 坏事 | 主线 / 突发interrupt | three-red-lines, sales-freeze, clearance | 否 | 14/-29 | 六折接盘，赌自己能盘活(-29)<br>只做代建管理，不接旧债(14)<br>拒绝接盘，保自己项目(9) | 坏事/危机 |
| 25 | `mortgage-rate-cut-window` | 按揭利率下调，售楼处电话突然多了 | routine | 机会 | 机会池 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 是/9 | 21/5 | 只转化真实按揭客户，先收回款(21)<br>周末大促，先把热度打满(5)<br>不冲量，稳价格和交付承诺(16) | 可作为好消息 |
| 26 | `bank-credit-review-pass` | 银行复核通过，授信口子松了一格 | routine | 机会 | 机会池 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 是/10 | 22/-6 | 把续贷用于工程款和工资(22)<br>只动一半，留现金缓冲(12)<br>拿续贷口径去抢下一块地(-6) | 可作为好消息 |
| 27 | `city-permit-fast-track` | 住建窗口把证照流程往前排了一周 | routine | 机会 | 机会池 | early-expansion, shelter-reform-boom, high-turnover | 是/8 | 18/5 | 按真实材料申报，拿干净批复(18)<br>追加交付承诺，换更快会审(7)<br>不抢窗口，按正常流程排队(5) | 可作为好消息 |
| 28 | `project-collection-week` | 尾款和车位款集中到账，现金池厚了一口 | routine | 机会 | 机会池 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 是/7 | 19/11 | 先付工资和关键材料(19)<br>先还最短的一笔债(17)<br>先不花，留作下周缓冲(11) | 可作为好消息 |
| 29 | `design-change-cheap-material` | 设计变更单：少一面石材，多一行利润 | pressure | 压力 | 主线 | three-red-lines | 否 | 10/-8 | 改材料，现金先活下来(-8)<br>保外立面，砍看不见的机电余量(-6)<br>公开调整，给业主补偿选择(10) | 压力题，不算好消息 |
| 30 | `quality-inspection-crack` | 质检站抽查，地下车库裂缝上了照片 | crisis | 坏事 | 主线 | three-red-lines | 否 | 8/-12 | 停工检测，修完再说(4)<br>夜里修补，白天继续带看(-12)<br>请第三方出报告，同步给客户(8) | 坏事/危机 |
| 31 | `county-dinner-guarantee` | 饭桌上，区领导让你先把话说满 | pressure | 压力 | 主线 | early-expansion | 否 | 8/1 | 承诺做成县里样板盘(1)<br>只承诺按期交付，不承诺投资额(8)<br>让对方把支持政策写进会议纪要(2) | 压力题，不算好消息 |
| 32 | `soil-report-red-line` | 地勘报告：地下有条旧河道 | pressure | 压力 | 主线 | early-expansion | 否 | 10/-13 | 改基础方案，利润先砍一刀(10)<br>报告先放抽屉，等融资过会(-13)<br>拿报告去谈地价和配套(1) | 压力题，不算好消息 |
| 33 | `planning-ratio-envelope` | 容积率多 0.3，附带一栋幼儿园 | pressure | 压力 | 主线 | early-expansion | 否 | 7/-2 | 接受配建，换更高货值(-2)<br>不加容积率，按小盘做完(7)<br>先卖住宅，配建后置(1) | 压力题，不算好消息 |
| 34 | `first-mortgage-bank-visit` | 银行只认回款，不认你的人情 | pressure | 压力 | 主线 | early-expansion | 否 | 13/0 | 按真实现金流报，额度少一点(13)<br>把意向客户写成准回款(0)<br>拿家里资产追加担保(9) | 标题像机会，但系统未按机会处理 |
| 35 | `agency-exclusive-contract` | 渠道要独家，佣金翻倍 | routine | 中性 | 主线 | early-expansion | 否 | 5/1 | 给独家，先把人带进来(3)<br>分三家渠道互相制衡(5)<br>不用独家，自己慢慢养案场(1) | 中性经营题 |
| 36 | `sample-room-cost-cut` | 样板间像豪宅，交付标准写在小字里 | routine | 中性 | 主线 | early-expansion | 否 | 11/0 | 样板间拉满，合同小字兜底(0)<br>样板间按真实交付做(11)<br>基础交付普通，另卖升级包(2) | 中性经营题 |
| 37 | `buyer-lottery-room` | 摇号名单里，多了三个关系户 | pressure | 压力 | 主线 | early-expansion | 否 | 8/-6 | 留三套，换关系顺畅(-4)<br>公开摇号，不留房源(8)<br>提高首付门槛，让名单自然出局(-6) | 压力题，不算好消息 |
| 38 | `roof-waterproof-shortcut` | 雨季前，防水层要不要省一道 | pressure | 压力 | 主线 | early-expansion | 否 | 2/-3 | 省一道，先赶预售节点(-3)<br>补全工序，推迟开盘(2)<br>让分包签质量承诺，节点照旧(-2) | 压力题，不算好消息 |
| 39 | `fire-acceptance-dinner` | 消防验收前，顾问要一笔协调费 | pressure | 压力 | 主线 | early-expansion | 否 | 6/-6 | 付协调费，先过节点(-6)<br>按项整改，开盘延后(3)<br>要求窗口列书面整改清单(6) | 压力题，不算好消息 |
| 40 | `county-media-praise` | 县融媒要拍你：本土房企样板 | routine | 中性 | 主线 | shelter-reform-boom | 否 | 9/1 | 讲大故事：云江人盖云江好房(5)<br>只讲工期、户型和交付标准(9)<br>婉拒专题，不当样板(1) | 中性经营题 |
| 41 | `land-parcel-bundle` | 好地块旁边，绑着一块安置房硬骨头 | high | 坏事 | 主线 | shelter-reform-boom | 否 | 5/-12 | 一起接，先拿好地(-12)<br>拉城投一起接安置房(5)<br>放弃好地，不吃打包风险(0) | 坏事/危机 |
| 42 | `cashflow-week` | 周五四笔钱，同时到期 | high | 坏事 | 主线 | shelter-reform-boom | 否 | -11/-13 | 付银行和工资，拖渠道和材料(-13)<br>付渠道和材料，拖银行利息(-11)<br>每家付一点，谁都不满意(-12) | 坏事/危机 |
| 43 | `channel-refund-fight` | 客户退认购，渠道说佣金不退 | routine | 中性 | 主线 | shelter-reform-boom | 否 | 2/-6 | 先退客户，和渠道慢慢扯(0)<br>按合同不退，稳现金(-6)<br>项目、渠道、客户三方各退一步(2) | 中性经营题 |
| 44 | `online-rumor-crane-stop` | 本地群在传：你们塔吊停了 | pressure | 压力 | 主线 | shelter-reform-boom | 否 | 12/-9 | 直接开工地直播，能看多少看多少(12)<br>强硬辟谣：恶意造谣，保留追责(-9)<br>私下安抚业主代表，暂不公开(-2) | 压力题，不算好消息 |
| 45 | `price-control-window` | 住建局约谈：别涨太猛，也别降太狠 | pressure | 中性 | 主线 | shelter-reform-boom | 否 | 14/-17 | 表价稳定，暗中做优惠(-2)<br>报备真实降价，换现金(14)<br>不降价，等下一波行情(-17) | 中性经营题 |
| 46 | `second-city-temptation` | 邻县招商局请你去看地 | high | 坏事 | 主线 | shelter-reform-boom | 否 | 12/-10 | 去邻县拿地，抢窗口(-10)<br>只签意向，不交保证金(2)<br>拒绝扩张，先交第一个盘(12) | 坏事/危机 |
| 47 | `employee-sales-target` | 销售冠军用亲戚名额刷流水 | routine | 中性 | 主线 | high-turnover | 否 | 6/0 | 默许冲刺，先保月报(0)<br>撤销假认购，月报难看(3)<br>保留认购，但另列退订率(6) | 中性经营题 |
| 48 | `material-substitution` | 门窗报价便宜 18%，质保少五年 | pressure | 压力 | 主线 | high-turnover | 否 | 2/-2 | 换便宜门窗，先保利润(-2)<br>维持原供应商，砍营销费用(2)<br>高低配分楼栋，合同写清楚(-1) | 压力题，不算好消息 |
| 49 | `workers-injury-night` | 夜间赶工，一个工人从脚手架摔下 | crisis | 坏事 | 主线 | high-turnover | 否 | 3/-17 | 停工排查，公开处理(3)<br>私下补偿，节点照旧(-17)<br>追责总包，项目不出面(-10) | 坏事/危机 |
| 50 | `commercial-paper-maturity` | 第一批商票到期，微信群开始点名 | high | 坏事 | 主线 | high-turnover | 否 | 1/-8 | 兑付头部供应商，拆群(1)<br>统一展期三个月(-8)<br>用折扣房抵一部分票(-3) | 坏事/危机 |
| 51 | `trust-covenant-review` | 信托来查：钱到底进了哪个项目 | high | 坏事 | 主线 | high-turnover | 否 | 9/-12 | 卖车位和商铺，把钱补回项目(9)<br>解释为临时调剂，争取宽限(-11)<br>找新资金覆盖旧流水(-12) | 坏事/危机 |
| 52 | `group-loan-guarantee` | 兄弟公司让你互保：不签他今天就爆 | high | 坏事 | 主线 | high-turnover | 否 | 2/-7 | 签互保，保住关系网(-7)<br>拒绝互保，按项目切割(2)<br>只接受资产抵押，不做人情担保(-2) | 坏事/危机 |
| 53 | `guarantee-letter-template` | 政府要你签一份保交付承诺书 | pressure | 压力 | 主线 | three-red-lines | 否 | 8/-7 | 全部签，换政府和客户信心(8)<br>附上资金测算和条件(8)<br>拖一拖，先看同行怎么签(-7) | 压力题，不算好消息 |
| 54 | `local-election-change` | 县里换届，新领导先看旧账 | high | 坏事 | 主线 | three-red-lines | 否 | 9/-13 | 主动交项目台账和风险清单(9)<br>找旧关系人继续协调(-13)<br>暂停新投入，等风向清楚(-1) | 坏事/危机 |
| 55 | `homebuyer-open-day` | 业主开放日，楼板裂缝被拍到 | crisis | 坏事 | 主线 / 突发interrupt / 交付门控 | three-red-lines | 否 | 9/-11 | 请第三方检测，结果公开(9)<br>发说明：正常收缩，不影响安全(-11)<br>给核心业主补偿，别扩大(-5) | 坏事/危机 |
| 56 | `sales-data-meeting` | 月报上，认购、网签、回款差了三张表 | pressure | 中性 | 主线 | three-red-lines | 否 | 8/-3 | 对外只讲认购 96%(-3)<br>三张表一起上，承认缺口(8)<br>暂停新认购，集中催回款(6) | 标题像机会，但系统未按机会处理 |
| 57 | `unfinished-neighbor` | 隔壁烂尾盘业主来你售楼处讨说法 | pressure | 压力 | 主线 | three-red-lines | 否 | 10/-5 | 公开工程进度和监管账户节点(10)<br>强调隔壁和你无关(-5)<br>推出延期赔付承诺(1) | 压力题，不算好消息 |
| 58 | `court-freeze-account` | 供应商申请冻结项目账户 | crisis | 坏事 | 主线 / 突发interrupt | sales-freeze | 否 | 6/-10 | 马上和解，解除冻结(1)<br>走诉讼，不开先例(-10)<br>公布付款顺位，分批清偿(6) | 坏事/危机 |
| 59 | `special-loan-conditions` | 专项借款下来了，但只能进楼栋 | high | 坏事 | 主线 | guaranteed-delivery | 否 | 30/-15 | 严格进楼栋，先复工(30)<br>找关系挪一部分还急债(-15)<br>拿拨付计划去和债权人谈展期(12) | 坏事/危机 |
| 60 | `final-creditor-meeting` | 债权人会议：谁先拿钱，谁先闭嘴 | crisis | 坏事 | 主线 / 资产处置门控 | clearance | 否 | 21/-13 | 先保交付顺位，债务展期(21)<br>先稳银行和信托，换展期(-13)<br>交给国资平台做统一清偿表(6) | 坏事/危机 |
| 61 | `redline-reporting-night` | 三道红线报表今晚上报，你差一条过线 | crisis | 坏事 | 主线 / 突发interrupt | three-red-lines | 否 | 23/-19 | 按真实口径报，接受授信收缩(7)<br>把合作款和拟回款调进口径(-19)<br>连夜卖掉一个项目，把指标打下来(23) | 坏事/危机 |
| 62 | `wealth-product-redemption` | 员工理财到期，前台被自己人堵了 | crisis | 坏事 | 主线 / 突发interrupt | three-red-lines | 否 | 12/-34 | 先兑普通员工，小额刚兑(-3)<br>统一展期，利息再加两个点(-34)<br>公布资产处置清单，按顺位兑付(12) | 坏事/危机 |
| 63 | `project-sale-window` | 有人愿意买你的好项目，但只给七折 | high | 机会 | 主线 / 突发interrupt / 机会池 / 资产处置门控 | three-red-lines, sales-freeze, clearance | 否 | 54/-36 | 七折卖，资金进偿债和保交付账户(54)<br>拒绝七折：好项目不能贱卖(-12)<br>先卖掉，再把现金转去家族账户(-36) | 可作为好消息 |
| 64 | `family-office-transfer` | 家办顾问建议：先把家族资产隔离 | high | 坏事 | 主线 / 突发interrupt | sales-freeze, guaranteed-delivery, clearance | 否 | 8/-35 | 只做合规隔离，公开披露关联交易(8)<br>先转走能转的，后面再解释(-35)<br>暂停隔离，先补工地和员工理财(6) | 坏事/危机 |
| 65 | `asset-freeze-order` | 法院保全裁定到了：账户先冻三千万 | crisis | 坏事 | 主线 / 突发interrupt | sales-freeze, guaranteed-delivery, clearance | 否 | 6/-27 | 立刻和解，换解除冻结(5)<br>申请复议，坚决不开先例(-27)<br>请专班见证付款顺位，分批清偿(6) | 坏事/危机 |
| 66 | `homebuyers-mortgage-letter` | 业主公开信写到：不停工复工，我们就停贷 | crisis | 坏事 | 主线 / 突发interrupt / 预售门控 | sales-freeze, guaranteed-delivery | 否 | 29/-31 | 把钱打进楼栋，直播复工节点(29)<br>再承诺一个交付日期，先压热搜(-31)<br>拉银行和专班做封闭复工贷(24) | 坏事/危机 |
| 67 | `airport-control-window` | 凌晨航班前，秘书说边检可能有名单 | crisis | 坏事 | 主线 / 突发interrupt | guaranteed-delivery, clearance | 否 | 21/-37 | 照飞：先把境外交易签了(-37)<br>取消行程，主动向专班说明资产处置(21)<br>让团队飞，自己留在本地谈专班(7) | 坏事/危机 |
| 68 | `founder-police-inquiry` | 经侦电话：集团理财和预售资金谁拍板？ | crisis | 坏事 | 主线 / 突发interrupt | guaranteed-delivery, clearance | 否 | 17/-37 | 交出完整台账，把口头审批补成事实链(17)<br>说是财务团队误判，自己不知情(-37)<br>先找地方协调，争取按风险处置走(-6) | 坏事/危机 |
| 69 | `liquidation-petition` | 境外债权人递交清盘申请 | crisis | 坏事 | 主线 / 突发interrupt / 资产处置门控 | clearance | 否 | 23/-31 | 接受法院框架下重组，交出资产清单(23)<br>把境内保交楼资产切出来，境外慢慢谈(5)<br>反对清盘，继续拖谈判(-31) | 坏事/危机 |
| 70 | `local-protection-gap` | 区里不接电话了：你已经没人替你缓冲 | crisis | 坏事 | 突发interrupt | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 14/-53 | 拿真实账本求市场化展期(14)<br>临时找中间人打点关系(-19)<br>不协调，按谁先起诉谁先谈(-53) | 坏事/危机 |
| 71 | `white-list-application-review` | 白名单会审：救项目，不救集团 | crisis | 坏事 | 交付门控 / 资产处置门控 | sales-freeze, guaranteed-delivery | 否 | 32/-18 | 切开项目账，贷款只进楼栋(32)<br>把集团急债也塞进融资需求(-10)<br>不提旧诉讼和冻结，先争取入库(-18) | 坏事/危机 |
| 72 | `escrow-ledger-audit` | 预售监管账户盘账，差额刚好是总部借走的 | crisis | 坏事 | 预售门控 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 23/-27 | 卖车位和商铺，把监管账户补齐(21)<br>坚持说是临时调剂，先让项目继续卖(-27)<br>请专班协调封闭桥接资金(23) | 坏事/危机 |
| 73 | `land-auction-no-bid` | 土拍大厅没人举牌，县里看向你 | pressure | 机会 | 机会池 | early-expansion, shelter-reform-boom, high-turnover | 否 | -2/-11 | 举牌托底，换地方态度(-11)<br>不举牌，按市场信号撤(-4)<br>拉城投和别家拼联合体，自己做小股(-2) | 名义机会，但收益不明显/偏负 |
| 74 | `lower-tier-inventory-night` | 夜里巡盘：三公里八个竞品都亮着空窗 | high | 坏事 | 普通事件池 | shelter-reform-boom, high-turnover, three-red-lines | 否 | 12/-16 | 承认库存过剩，暂停周边拿地(11)<br>加渠道佣金，先把月报做上去(-16)<br>公开降价清库存，换现金回笼(12) | 坏事/危机 |
| 75 | `wage-account-deadline` | 工资专户今晚要补足，工人实名系统已经预警 | crisis | 坏事 | 交付门控 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 3/-27 | 补工资专户，砍广告和样板活动(3)<br>先保营销，工资下周补(-27)<br>让总包先垫，给他后续项目承诺(-7) | 坏事/危机 |
| 76 | `annual-audit-revenue-cut` | 年审现场：这批房不能确认收入 | high | 坏事 | 普通事件池 | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 14/-24 | 接受调减利润，重新披露风险(13)<br>压审计接受管理层判断(-24)<br>砍总部费用，先补消防和配套达交付(14) | 坏事/危机 |
| 77 | `share-pledge-margin-call` | 股价跌到质押线，券商要求补保证金 | crisis | 坏事 | 普通事件池 | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 0/-15 | 用个人资金补仓，保控制权(-10)<br>不补仓，接受部分股权被处置(0)<br>拿物业公司股权再质押补仓(-15) | 坏事/危机 |
| 78 | `state-purchase-inventory` | 国企收储存量房：只收现房，价格很低 | high | 机会 | 机会池 | sales-freeze, guaranteed-delivery, clearance | 否 | 24/-18 | 低价卖现房给国企，先回现金(24)<br>拒绝低价收储，继续市场销售(-18)<br>只拿最差楼栋去申报收储(-8) | 可作为好消息 |
| 79 | `property-service-cashbox` | 物业公司账上还有现金，集团想先借走 | high | 坏事 | 普通事件池 | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 6/-12 | 不碰物业现金，砍总部费用(6)<br>借物业现金补集团缺口(-12)<br>用未来物业费做质押融资(-9) | 坏事/危机 |
| 80 | `urban-village-renewal-package` | 城中村改造大包：周期长、关系多、现金慢 | high | 机会 | 机会池 | high-turnover, three-red-lines, sales-freeze | 否 | 10/-13 | 接下，但按慢周期和安置优先做(4)<br>让土方线加速，把拆迁节点抢出来(-13)<br>让国资控股，你做操盘和小股(10) | 可作为好消息 |
| 81 | `ad-hoc-creditor-term-sheet` | 境外债委会发来条款清单：先换董事，再谈展期 | crisis | 坏事 | 普通事件池 | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 23/-22 | 接受监督和现金扫款，换展期(21)<br>拒绝董事会席位，继续谈软条件(-22)<br>在债委会监督下卖资产还债(23) | 坏事/危机 |
| 82 | `interest-rollover-friday` | 周五下午五点，付息表比售楼日报先到 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | -2/-15 | 先付利息，压工程款一周(-13)<br>把利息并进新贷款，保现场不停(-15)<br>拆开回款、监管账户和施工节点给银行看(-2) | 坏事/危机 |
| 83 | `escrow-gap-screenshot` | 监管账户截图流出来：余额不够盖到封顶 | crisis | 坏事 | 突发interrupt / 预售门控 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 15/-28 | 卖一块地，先把监管账户补上(15)<br>说是临时错配，等销售回款补齐(-28)<br>请地方协调专项借款补缺口(13) | 坏事/危机 |
| 84 | `supplier-bill-discount` | 供应商把商票贴现，折价单传遍材料圈 | high | 坏事 | 突发interrupt | high-turnover, three-red-lines, sales-freeze | 否 | 0/-19 | 现金清掉关键材料商，其他继续排队(0)<br>开更大商票换继续供货(-12)<br>停一栋楼，把资源集中到能交付的楼栋(-19) | 坏事/危机 |
| 85 | `bank-branch-risk-meeting` | 分行风控会：你的项目被放进观察名单 | crisis | 坏事 | 突发interrupt / 资产处置门控 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 15/-11 | 接受降额，换不抽贷和账户白名单(4)<br>找领导打招呼，让客户经理顶住额度(-11)<br>卖掉边缘项目，先还银行敞口(15) | 坏事/危机 |
| 86 | `homebuyer-lawyer-letter` | 业主律师函：要的不是道歉，是资金流水 | crisis | 坏事 | 突发interrupt / 交付门控 | sales-freeze, guaranteed-delivery, clearance | 否 | 18/-15 | 公开资金台账和楼栋节点，接受监督(18)<br>发延期补偿券，暂不公开流水(-15)<br>先处理最活跃业主的小额诉求(-12) | 坏事/危机 |
| 87 | `local-task-force-night` | 专班夜会：你不是来谈利润，是来交保交楼方案 | crisis | 坏事 | 突发interrupt / 交付门控 / 资产处置门控 | sales-freeze, guaranteed-delivery, clearance | 否 | 14/-27 | 接受项目资金闭环，集团不得抽水(14)<br>坚持集团统筹资金，否则全盘都断(-27)<br>交出一个项目处置权，保其他项目(3) | 坏事/危机 |
| 88 | `discount-sale-stampede` | 降价海报发出去，老业主和新客户同时挤进售楼处 | high | 坏事 | 突发interrupt | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 10/-14 | 定向去库存，同时给老业主补偿包(10)<br>直接闪降抢现金，不解释旧价(2)<br>不降价，只加渠道佣金和首付分期(-14) | 坏事/危机 |
| 89 | `personal-guarantee-call` | 信托经理电话：续期可以，老板个人担保补上 | crisis | 坏事 | 突发interrupt | high-turnover, three-red-lines, sales-freeze | 否 | 18/-34 | 签个人担保，先保集团不断链(-22)<br>拒绝个人担保，卖资产还信托(18)<br>签之前先把部分资产转出去(-34) | 坏事/危机 |
| 90 | `planning-stop-work-order` | 规划局一纸停工：你多出来的半层被人举报了 | high | 坏事 | 突发interrupt / 交付门控 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | -9/-14 | 停工整改，补手续和罚款(-9)<br>找老关系压下执法，先别停工(-14)<br>把责任压给设计院和报批顾问(-11) | 坏事/危机 |
| 91 | `tax-and-construction-joint-audit` | 税务、住建、市场监管一起进场：他们说只是例行检查 | crisis | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 1/-29 | 一次性交出台账，承认补税和整改(0)<br>分口径给材料，别让部门串起来(-29)<br>拿保交楼和稳就业方案换检查节奏(1) | 坏事/危机 |
| 92 | `competitor-anonymous-report` | 匿名举报信写得太专业，不像业主写的 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | 0/-4 | 先补真实漏洞，再追举报来源(0)<br>反手举报竞品违规降价和无证蓄客(-4)<br>找本地媒体讲你是被恶意竞争(-4) | 压力题，不算好消息 |
| 93 | `rival-price-raid` | 隔壁盘夜里降价十五个点，还送车位 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 7/-15 | 跟降，但同步给老业主补偿规则(7)<br>不降价，偷偷加渠道佣金(-15)<br>请住建约谈竞品，压住价格战(-8) | 坏事/危机 |
| 94 | `land-auction-enclosure` | 土拍规则改了：竞品质押了你最想要的配建条件 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover | 否 | -4/-14 | 放弃这块地，保现金等下一轮(-4)<br>硬投，证明你还能和强手掰腕子(-14)<br>和竞品联合拿地，各退一步(-4) | 坏事/危机 |
| 95 | `contractor-evidence-package` | 总包递上证据包：签证、聊天、欠款表，一样不少 | crisis | 坏事 | 突发interrupt / 交付门控 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 7/-22 | 先结清关键签证和工资，换总包复工声明(7)<br>反诉总包虚增签证，拖住付款(-22)<br>换总包，找新队伍接盘(-21) | 坏事/危机 |
| 96 | `earthwork-boss-blackmail` | 土方老板说：当年那些事，我也留了底 | crisis | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 0/-35 | 切割土方线，主动交代可核事实(0)<br>付一笔封口费，让他别闹(-28)<br>找另一条社会关系压他回去(-35) | 坏事/危机 |
| 97 | `protective-umbrella-transfer` | 老领导调走，新班子开始翻旧项目 | crisis | 坏事 | 突发interrupt | high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 3/-16 | 把旧项目、旧承诺、旧资金一次性清表(3)<br>先观望，找新班子的入口(-15)<br>主动接一个烂尾盘，换新班子信任(-16) | 坏事/危机 |
| 98 | `public-security-tea` | 派出所请你喝茶：土方、催收、清场，谁授权的？ | crisis | 坏事 | 突发interrupt | three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 4/-35 | 按事实链说明授权和付款，不甩锅(4)<br>说是项目经理个人操作(-18)<br>找旧保护伞问能不能压一压(-35) | 坏事/危机 |
| 99 | `channel-poaching-war` | 渠道反水：你的客户名单被带到竞品售楼处 | pressure | 压力 | 突发interrupt | shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | -2/-6 | 先结清渠道旧佣金，换回名单和带看(-3)<br>自建客户池，慢慢脱离渠道(-2)<br>给更高佣金抢回渠道(-6) | 压力题，不算好消息 |
| 100 | `mature-asset-sale-rumor` | 核心项目有人出高价，外面开始传你要撤 | high | 坏事 | 突发interrupt | high-turnover, three-red-lines, sales-freeze | 否 | 44/-11 | 卖成熟资产，钱进偿债和交付账户(44)<br>不卖，保住城市门面和市场信心(-4)<br>悄悄卖给境外基金，少披露用途(-11) | 标题像机会，但系统未按机会处理 |
| 101 | `office-vacancy-rent-roll` | 写字楼租金表很好看，空置层也很好看 | pressure | 压力 | 突发interrupt | high-turnover, three-red-lines, sales-freeze | 否 | 25/-14 | 主动降租保入住率(5)<br>用长免租期撑表面租金(-14)<br>趁租约还在，打包卖掉一栋楼(25) | 压力题，不算好消息 |
| 102 | `foreign-fund-takeover-review` | 外资要买控股权，审批一直没有落章 | crisis | 坏事 | 突发interrupt | three-red-lines, sales-freeze, clearance | 否 | 9/-23 | 延长审查期，公开补充材料(9)<br>取消交易，转向租金和代建自救(-4)<br>找关系催审批，要求尽快放行(-23) | 坏事/危机 |
| 103 | `mortgage-funds-wrong-account` | 按揭款没进监管户，业主拿到流水 | crisis | 坏事 | 突发interrupt / 预售门控 | three-red-lines, sales-freeze, guaranteed-delivery | 否 | 14/-30 | 要求银行、住建和项目三方对账，先补监管户(14)<br>用新认购先把旧监管户窟窿补上(-18)<br>说是支行经办理解偏差，先让基层背锅(-30) | 坏事/危机 |
| 104 | `fake-progress-drawdown` | 工程进度照片，比现场快了两层 | high | 坏事 | 突发interrupt / 预售门控 | high-turnover, three-red-lines, sales-freeze | 否 | 13/-23 | 按真实进度重报，先少拿一笔(13)<br>用旧照片凑节点，先把拨付拿出来(-23)<br>让总包盖章：要钱可以，字也一起签(-7) | 坏事/危机 |
| 105 | `bid-companion-companies` | 三家陪标公司，用的是同一个报价模板 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover | 否 | -2/-6 | 废标重开，公开补充招标记录(-5)<br>照旧走流程，让熟人队伍中标(-6)<br>拆成小标段重开，保一部分熟人也留竞争(-2) | 坏事/危机 |
| 106 | `low-bid-change-order-night` | 低价中标后，签证单一页页长出来 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | 5/-28 | 认关键签证，要求换交付节点(5)<br>全部打回，准备反诉虚增签证(-28)<br>请第三方审价，边审边付一部分(1) | 压力题，不算好消息 |
| 107 | `land-auction-bond-borrowed` | 保证金是过桥钱，明天就开始计息 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover | 否 | 5/-11 | 借过桥钱冲进去，先把牌桌坐上(-11)<br>拉国企小股东一起进，分掉地块和控制权(5)<br>放弃报名，把现金留给在建项目(-7) | 坏事/危机 |
| 108 | `private-fund-bridge-weekend` | 周末过桥资金，合同写成咨询费 | high | 坏事 | 突发interrupt | high-turnover, three-red-lines, sales-freeze | 否 | -3/-29 | 签咨询费合同，周一先过桥(-29)<br>拒绝灰色过桥，直接找银行谈展期(-3)<br>按借款披露，接受高息和担保条件(-7) | 坏事/危机 |
| 109 | `earthwork-subcontract-chain` | 土方分包换了三层，最后一层来要账 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | -6/-18 | 直接付末端队一部分，换走照片和人(-6)<br>让总包处理：合同找谁签就找谁(-18)<br>请镇里和派出所熟人做调解，分期付款(-6) | 坏事/危机 |
| 110 | `related-bank-spv-loan` | 银行朋友说额度能走，但要绕一层公司 | pressure | 压力 | 突发interrupt | shelter-reform-boom, high-turnover, three-red-lines | 否 | 6/-20 | 拒绝绕道，接受额度变小(6)<br>走关联公司贸易背景，把钱转回项目(-20)<br>只借小额，补齐贸易、担保和资金用途材料(-2) | 标题像机会，但系统未按机会处理 |
| 111 | `branch-president-rotation` | 支行换行长：旧口头承诺不算数 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 11/-7 | 重做现金流表，接受额度缩水(11)<br>找旧行长打招呼，把材料先压过去(-7)<br>拿下一块地的故事换新增授信(-2) | 压力题，不算好消息 |
| 112 | `tax-invoice-chain` | 税务局抽到一串砂石发票 | high | 坏事 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 5/-10 | 补税重做台账，先把链条摊开(5)<br>让材料商补票，合同责任推回去(-9)<br>找熟人协调口径，先别扩大(-10) | 坏事/危机 |
| 113 | `rainstorm-basement-flood` | 暴雨夜，地下车库开始进水 | pressure | 压力 | 突发interrupt / 交付门控 / 项目必需门控 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 9/-13 | 停工排查排水系统，公开维修计划(9)<br>连夜抽水清场，第二天照常开放(-13)<br>说是市政管网倒灌，要求政府出面(-9) | 压力题，不算好消息 |
| 114 | `owner-livestream-site-check` | 业主开直播：镜头怼到工地围挡 | high | 坏事 | 突发interrupt / 交付门控 / 项目必需门控 | shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 15/-18 | 开放一段工区，给出复工节点表(15)<br>让保安挡镜头，先别让它扩散(-18)<br>请本地大号参观，讲复工故事(-5) | 坏事/危机 |
| 115 | `rival-drone-video` | 隔壁盘无人机拍到你的空工地 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 9/-3 | 发布真实进度和资金安排(9)<br>举报对方违规航拍和恶意竞争(-3)<br>马上降价促销，把客户抢回来(-1) | 压力题，不算好消息 |
| 116 | `steel-cement-price-jump` | 钢筋水泥三天涨了两轮 | routine | 中性 | 突发interrupt / 项目必需门控 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | 4/-14 | 补一笔现金，锁核心材料价(4)<br>开商票让供应商继续供货(-9)<br>按合同价压回去，谁违约谁赔(-14) | 中性经营题 |
| 117 | `tower-crane-near-miss` | 塔吊擦过隔壁小学围墙 | high | 坏事 | 突发interrupt / 交付门控 / 项目必需门控 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 10/-10 | 停塔整改，请第三方验收(10)<br>夜里调整设备，白天继续施工(-10)<br>换安全负责人，公开处罚(0) | 坏事/危机 |
| 118 | `delivered-wall-crack-repair` | 已交付小区墙面裂缝又上群了 | pressure | 压力 | 突发interrupt / 已交付门控 | shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 11/-12 | 拿钱设专项维修组，逐户销项(11)<br>说多半是业主装修造成，先鉴定(-12)<br>找原总包返修，先扣质保金(-1) | 压力题，不算好消息 |
| 119 | `county-finance-road-advance` | 县里让你先垫一段配套路 | pressure | 机会 | 突发interrupt / 机会池 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | 0/-14 | 先垫路钱，换审批和口碑(0)<br>要求写进会议纪要，抵扣后续费用(-1)<br>不垫，按合同边界来(-14) | 名义机会，但收益不明显/偏负 |
| 120 | `escrow-bank-weekend-freeze` | 周五下午，监管户拨付被银行按住 | high | 坏事 | 突发interrupt / 交付门控 / 项目必需门控 | high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 13/-12 | 银行、住建、总包三方对账后拨付(13)<br>先从别的项目调钱垫上(-12)<br>找关系让支行先签，材料后补(-5) | 坏事/危机 |
| 121 | `channel-rebate-blackmail` | 渠道经理把返佣表发到你手机 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 5/-6 | 付核心返佣，换客户资料和封口(-6)<br>审渠道名单，砍虚假到访和水分(5)<br>换渠道公司，让新人接盘(-6) | 压力题，不算好消息 |
| 122 | `media-real-estate-account` | 本地房产号问你要一个说法 | routine | 中性 | 突发interrupt | shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 8/-11 | 给节点表、监管户说明和现场照片(8)<br>投一笔广告，换温和标题(-7)<br>发律师函，要求停止传播(-11) | 中性经营题 |
| 123 | `dust-control-stop-work` | 扬尘红牌挂到围挡上 | routine | 中性 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 否 | 4/-5 | 按标准整改工地，补设备和台账(4)<br>找熟人先摘红牌，整改慢慢补(-5)<br>罚总包现场管理费，让他们整改(-4) | 中性经营题 |
| 124 | `old-demolition-video-resurfaces` | 旧改清场视频突然被翻出来 | high | 坏事 | 突发interrupt | shelter-reform-boom, high-turnover, three-red-lines, sales-freeze, guaranteed-delivery | 否 | 6/-18 | 找当事户补偿和解，留下书面闭环(4)<br>让土方老板找人删视频(-18)<br>公开旧改补偿台账和第三方复核(6) | 坏事/危机 |
| 125 | `state-owned-rival-bid-support` | 国企对手拿着白名单方案进场 | pressure | 压力 | 突发interrupt | high-turnover, three-red-lines, sales-freeze, guaranteed-delivery, clearance | 否 | 15/-17 | 让国企小股进入，换白名单和融资(5)<br>自己加码保交付承诺，别让盘被接走(-17)<br>把最难项目交给国企，保其他盘(15) | 压力题，不算好消息 |
| 126 | `presale-cash-next-parcel` | 第一批按揭款刚到，土拍群已经发新地 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | 9/-8 | 用可动用回款交保证金(-8)<br>先把钱留给工程进度，地块只跟踪(9)<br>拉金融小股东垫保证金，收益分成(-1) | 压力题，不算好消息 |
| 127 | `bank-credit-after-presale` | 银行看了网签表，主动问你要不要加额度 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover, three-red-lines | 否 | 11/4 | 新增授信用来拿下一块地(4)<br>新增授信只补工程和交付节点(11)<br>额度先批下来，不马上提款(7) | 标题像机会，但系统未按机会处理 |
| 128 | `split-team-next-site` | 项目还没交，投拓已经要第二支队伍 | pressure | 压力 | 突发interrupt | early-expansion, shelter-reform-boom, high-turnover | 否 | 1/-4 | 花钱组第二支项目队伍(1)<br>从当前项目抽骨干去看新地(-4)<br>让代建伙伴接新地前期，自己保操盘权(0) | 压力题，不算好消息 |
| 129 | `post-delivery-capital-desk` | 三盘交完，银行反而问你下一块地 | pressure | 机会 | 主线 / 突发interrupt / 机会池 | early-expansion, shelter-reform-boom, high-turnover, three-red-lines, sales-freeze | 是/5 | 21/-10 | 再拿一块地，让现金继续转(-10)<br>先还债，保一年空窗(21)<br>接代建小股，赚管理费不重拿地(10) | 可作为好消息 |
| 130 | `voluntary-exit-window` | 你忽然发现：现在收手也许还能睡着 | pressure | 机会 | 突发interrupt / 机会池 | shelter-reform-boom, high-turnover, three-red-lines | 否 | 64/-22 | 卖掉剩余权益，还债交楼，退出本县(64)<br>只卖一半，留一个项目等下一波(21)<br>不退，拿这张干净表去拍下一块地(-22) | 可作为好消息 |

## 第一轮结论

1. “完全没有好消息”的体感是合理的：当前事件库里系统判定的机会只有 14/130，而坏事+压力是 105/130。
2. 真正被玩家感知为好消息的事件更少，因为部分机会事件其实是资产处置、退出窗口或地方垫资，最好选择也不明显正向。
3. 坏事拥有多个强制来源：后果队列、暗线队列、项目队列、利益相关方反应、interrupt。好事主要靠机会池随机竞争。
4. `badEventStreak` 只统计 high/crisis 坏事，不统计 pressure。连续压力事件不会触发好消息保底，这是体感失衡的重要原因。
5. 下一步如果修改，不应该只继续加好事件，而要改调度规则：机会事件要有独立份额、正向队列、压力事件计入“负面体感”，并把标题像机会的事件重新分类。

## 第二轮修改后复核

本轮按“好坏参半，必须增加好事”修改后，事件池和调度规则已经改变：

- 总事件数：145。
- 机会事件：34。
- 压力事件：30。
- 坏事事件：72。
- 中性事件：9。

具体改动：

1. 机会事件从 14 个增加到 34 个。
2. 新增 15 个明确的正向房地产经营窗口：
   - 学校和道路真实开工。
   - 钢材水泥集采价下行。
   - 总包提前完成节点，监管户合规拨付。
   - 按揭批量审批通过。
   - 老业主转介绍带来自然到访。
   - 竞品授信冻结，客户回流。
   - 城投小股进入但不抢操盘。
   - 城市配套费缓缴。
   - 抵押物重估后银行愿意给额度。
   - 头部供应商恢复账期。
   - 车位和底商被企业团购。
   - 审计底稿过一版，银行恢复谈判。
   - 流拍地二轮降底价。
   - 产业客户签长租。
   - 住建抽检通过，只要求小整改。
3. 把部分原本“标题像机会但系统不按机会处理”的事件重新归入机会：
   - `presale-cash-next-parcel`
   - `bank-credit-after-presale`
   - `distressed-project-bargain`
   - `white-list-application-review`
   - `mature-asset-sale-rumor`
4. 新增数据驱动触发条件：
   - `requiresProject`
   - `requiresDevelopmentProject`
   - `requiresPresaleProject`
   - `requiresDeliveredProject`
   - `requiresLandAsset`
   - `requiresDebt`
   - `requiresLowCash`
   - `requiresBankTrust`
   - `requiresGovernmentTrust`
5. 调度规则改变：
   - `pressure` 不再当中性，而是计入负面手感。
   - 最近 6 次事件会形成 mood window。
   - 连续压力/坏事、3 次以上没有机会事件、或最近窗口机会占比过低时，系统强制插入机会事件。
   - 普通抽取时也会给机会事件更高权重，并压低坏事/压力连续出现的权重。

复核结论：

1. 这次不是只“加几个好消息”，而是同时改了事件池、事件分类、触发条件和抽取权重。
2. 机会事件数量已经超过压力事件数量，玩家不应再长期只看到坏消息。
3. 坏事仍然存在，而且危机期仍然会发生；区别是系统现在会把房地产经营里的真实利好窗口放进循环。
4. 后续如果继续调，应该看实际 20-30 局的事件 mood 分布，而不是只看事件库静态数量。
